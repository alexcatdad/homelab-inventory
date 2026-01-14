import { get } from 'svelte/store';
import { llmEngine, llmStatus, initializeLLM } from './engine';
import type { Specifications, CPU, RAM, Motherboard, DeviceType, RAMType } from '../../../shared/types';

export interface SpecLookupResult {
  success: boolean;
  specs?: Specifications;
  error?: string;
  source?: 'cache' | 'web';
}

// Server API - cache only
async function checkCache(model: string): Promise<{ cached: boolean; specs?: Specifications }> {
  const res = await fetch(`/api/specs/cache?model=${encodeURIComponent(model)}`);
  return res.json();
}

async function saveToCache(model: string, specs: Specifications): Promise<void> {
  await fetch('/api/specs/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, specs, source_url: 'duckduckgo' }),
  });
}

// Search via server proxy (bypasses CORS, server fetches DuckDuckGo HTML)
async function searchDuckDuckGo(model: string): Promise<string> {
  const query = `${model} specifications CPU RAM`;
  const proxyUrl = `/api/specs/proxy-search?q=${encodeURIComponent(query)}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error('Search request failed');
  }

  const html = await response.text();

  // Check for CAPTCHA/rate limit
  const isCaptcha = html.includes('anomaly-modal') ||
    html.includes('Please verify you are a human') ||
    html.includes('blocked') && html.includes('unusual traffic');
  if (isCaptcha) {
    throw new Error('Search rate limited - please try again later');
  }

  // Extract snippets and titles from DuckDuckGo HTML
  const snippetPattern = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const titlePattern = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;

  const snippetMatches = [...html.matchAll(snippetPattern)].slice(0, 5);
  const titleMatches = [...html.matchAll(titlePattern)].slice(0, 5);

  const snippets = snippetMatches.map(m => cleanHtml(m[1])).filter(Boolean);
  const titles = titleMatches.map(m => cleanHtml(m[1])).filter(Boolean);

  // Combine into searchable content - use whichever has more items as base
  let content: string;
  if (titles.length >= snippets.length) {
    content = titles.map((t, i) => `${t}\n${snippets[i] || ''}`).join('\n\n');
  } else {
    content = snippets.map((s, i) => `${titles[i] || ''}\n${s}`).join('\n\n');
  }

  return content || '';
}

// Clean HTML entities
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// Build extraction prompt for LLM using TOON format
function buildExtractionPrompt(model: string, searchContent: string): string {
  return `Extract hardware specifications for "${model}" from this search result text.

Search results:
${searchContent}

Return specs in TOON format (indentation-based, like YAML). Example:
cpu:
  model: Intel Core i5-8500
  cores: 6
  threads: 6
  tdp_watts: 65
ram:
  type: DDR4
  max_supported: 64GB
motherboard:
  chipset: Intel Q370

Only include fields you find. Return ONLY the TOON data, no explanation.`;
}

// Parse TOON format response into nested object
function parseToon(text: string): Record<string, Record<string, string | number>> {
  const result: Record<string, Record<string, string | number>> = {};
  const lines = text.split('\n');

  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    // Section header (no leading whitespace, ends with colon)
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1).toLowerCase();
      result[currentSection] = {};
    }
    // Key-value pair (has leading whitespace)
    else if (currentSection && (line.startsWith('  ') || line.startsWith('\t'))) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
        let value: string | number = trimmed.slice(colonIdx + 1).trim();

        // Try to parse as number
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && /^\d+(\.\d+)?$/.test(value)) {
          value = numValue;
        }

        result[currentSection][key] = value;
      }
    }
  }

  return result;
}

// Parse LLM response (TOON format) into Specifications object
function parseSpecResponse(response: string): Specifications | null {
  try {
    let text = response.trim();

    // Remove markdown code blocks if present
    const codeMatch = text.match(/```(?:toon|yaml)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      text = codeMatch[1].trim();
    }

    const parsed = parseToon(text);
    const specs: Specifications = {};

    // Parse CPU
    if (parsed.cpu) {
      const cpu: CPU = { model: String(parsed.cpu.model || '') };
      if (parsed.cpu.cores) cpu.cores = Number(parsed.cpu.cores);
      if (parsed.cpu.threads) cpu.threads = Number(parsed.cpu.threads);
      if (parsed.cpu.socket) cpu.socket = String(parsed.cpu.socket);
      if (parsed.cpu.tdp_watts) cpu.tdp_watts = Number(parsed.cpu.tdp_watts);
      if (parsed.cpu.video_codecs) cpu.video_codecs = String(parsed.cpu.video_codecs);
      if (cpu.model) specs.cpu = cpu;
    }

    // Parse RAM
    if (parsed.ram) {
      const validRamTypes: RAMType[] = ['DDR3', 'DDR4', 'DDR5', 'Unified Memory', 'LPDDR4', 'LPDDR5'];
      const typeStr = String(parsed.ram.type || 'DDR4').toUpperCase();
      const ramType = validRamTypes.find(t => t.toUpperCase() === typeStr) || 'DDR4';

      const ram: RAM = {
        current: String(parsed.ram.current || ''),
        max_supported: String(parsed.ram.max_supported || ''),
        type: ramType
      };
      if (parsed.ram.slots_total) ram.slots_total = Number(parsed.ram.slots_total);
      if (parsed.ram.slots_used) ram.slots_used = Number(parsed.ram.slots_used);
      if (ram.type) specs.ram = ram;
    }

    // Parse Motherboard
    if (parsed.motherboard) {
      const mb: Motherboard = { model: String(parsed.motherboard.model || '') };
      if (parsed.motherboard.chipset) mb.chipset = String(parsed.motherboard.chipset);
      if (parsed.motherboard.form_factor) mb.form_factor = String(parsed.motherboard.form_factor);
      if (parsed.motherboard.sata_ports) mb.sata_ports = Number(parsed.motherboard.sata_ports);
      if (parsed.motherboard.nvme_slots) mb.nvme_slots = Number(parsed.motherboard.nvme_slots);
      if (mb.model || mb.chipset) specs.motherboard = mb;
    }

    return specs;
  } catch (e) {
    console.error('Failed to parse spec response:', e);
    return null;
  }
}

// Main spec lookup function - client-side search approach
export async function lookupSpecs(
  modelName: string,
  deviceType: DeviceType
): Promise<SpecLookupResult> {
  if (!modelName.trim()) {
    return { success: false, error: 'Model name is required' };
  }

  try {
    // Step 1: Check server cache first
    const cacheResult = await checkCache(modelName);
    if (cacheResult.cached && cacheResult.specs) {
      return { success: true, specs: cacheResult.specs, source: 'cache' };
    }

    // Step 2: Search DuckDuckGo via proxy
    const searchContent = await searchDuckDuckGo(modelName);
    if (!searchContent) {
      return { success: false, error: 'No search results found' };
    }

    // Step 3: Ensure LLM engine is ready
    let engine = get(llmEngine);
    if (!engine || get(llmStatus) !== 'ready') {
      const success = await initializeLLM();
      if (!success) {
        return { success: false, error: 'Failed to initialize AI model' };
      }
      engine = get(llmEngine);
    }

    if (!engine) {
      return { success: false, error: 'AI model not available' };
    }

    // Step 4: Use LLM to extract specs from search results
    const prompt = buildExtractionPrompt(modelName, searchContent);
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '';
    const specs = parseSpecResponse(content);

    if (!specs || Object.keys(specs).length === 0) {
      return { success: false, error: 'Could not extract specifications from search results' };
    }

    // Step 5: Cache the extracted specs
    await saveToCache(modelName, specs);

    return { success: true, specs, source: 'web' };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Spec lookup failed';
    return { success: false, error: errorMessage };
  }
}

// Store for lookup state
import { writable } from 'svelte/store';

export const specLookupLoading = writable(false);
export const specLookupError = writable<string | null>(null);
