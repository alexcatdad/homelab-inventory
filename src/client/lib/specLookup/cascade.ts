import { queryDDGInstant } from './ddgInstant';
import { get } from 'svelte/store';
import { llmEngine, llmStatus, initializeLLM } from '../llm/engine';
import type { Specifications } from '../../../shared/types';

export interface LookupResult {
  success: boolean;
  specs?: Specifications;
  source?: 'cache' | 'ddg_instant' | 'community' | 'user_input';
  error?: string;
  needsUserInput?: boolean;
}

export interface CascadeOps {
  checkCache: (model: string) => Promise<{ cached: boolean; specs?: Specifications }>;
  checkCommunity: (model: string) => Promise<{ found: boolean; specs?: Specifications }>;
  saveCache: (model: string, specs: Specifications) => Promise<void>;
}

/**
 * Build extraction prompt for LLM
 */
function buildExtractionPrompt(model: string, text: string): string {
  return `Extract hardware specifications for "${model}" from this text.

Text:
${text}

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

/**
 * Parse TOON format into specs object
 */
function parseToonToSpecs(text: string): Specifications | null {
  try {
    let content = text.trim();

    // Remove markdown code blocks if present
    const codeMatch = content.match(/```(?:toon|yaml)?\s*([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      content = codeMatch[1].trim();
    }

    const result: Record<string, Record<string, string | number>> = {};
    const lines = content.split('\n');
    let currentSection: string | null = null;

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) continue;

      if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
        currentSection = trimmed.slice(0, -1).toLowerCase();
        result[currentSection] = {};
      } else if (currentSection && result[currentSection] && (line.startsWith('  ') || line.startsWith('\t'))) {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
          let value: string | number = trimmed.slice(colonIdx + 1).trim();
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && /^\d+(\.\d+)?$/.test(value)) {
            value = numValue;
          }
          result[currentSection][key] = value;
        }
      }
    }

    const specs: Specifications = {};

    if (result.cpu) {
      specs.cpu = {
        model: String(result.cpu.model || ''),
        cores: result.cpu.cores ? Number(result.cpu.cores) : undefined,
        threads: result.cpu.threads ? Number(result.cpu.threads) : undefined,
        socket: result.cpu.socket ? String(result.cpu.socket) : undefined,
        tdp_watts: result.cpu.tdp_watts ? Number(result.cpu.tdp_watts) : undefined,
      };
    }

    if (result.ram) {
      specs.ram = {
        current: String(result.ram.current || ''),
        max_supported: String(result.ram.max_supported || ''),
        type: (String(result.ram.type || 'DDR4').toUpperCase() as any) || 'DDR4',
      };
    }

    if (result.motherboard) {
      specs.motherboard = {
        model: String(result.motherboard.model || ''),
        chipset: result.motherboard.chipset ? String(result.motherboard.chipset) : undefined,
        form_factor: result.motherboard.form_factor ? String(result.motherboard.form_factor) : undefined,
      };
    }

    return Object.keys(specs).length > 0 ? specs : null;
  } catch {
    return null;
  }
}

/**
 * Extract specs from text using browser LLM
 */
async function extractSpecsWithLLM(model: string, text: string): Promise<Specifications | null> {
  let engine = get(llmEngine);

  if (!engine || get(llmStatus) !== 'ready') {
    const success = await initializeLLM();
    if (!success) return null;
    engine = get(llmEngine);
  }

  if (!engine) return null;

  try {
    const prompt = buildExtractionPrompt(model, text);
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '';
    return parseToonToSpecs(content);
  } catch {
    return null;
  }
}

/**
 * Main cascade lookup function
 * Tries sources in order: cache → DDG Instant → community → signals user input needed
 */
export async function lookupSpecsCascade(
  model: string,
  ops: CascadeOps
): Promise<LookupResult> {
  if (!model.trim()) {
    return { success: false, error: 'Model name is required' };
  }

  // 1. Check user's personal cache
  try {
    const cached = await ops.checkCache(model);
    if (cached.cached && cached.specs) {
      return { success: true, specs: cached.specs, source: 'cache' };
    }
  } catch (e) {
    console.error('Cache check failed:', e);
  }

  // 2. Try DDG Instant Answer API (browser-native JSONP)
  try {
    const ddgResult = await queryDDGInstant(model);
    if (ddgResult.text && ddgResult.text.length > 50) {
      const specs = await extractSpecsWithLLM(model, ddgResult.text);
      if (specs && Object.keys(specs).length > 0) {
        await ops.saveCache(model, specs);
        return { success: true, specs, source: 'ddg_instant' };
      }
    }
  } catch (e) {
    console.error('DDG lookup failed:', e);
  }

  // 3. Check community database
  try {
    const community = await ops.checkCommunity(model);
    if (community.found && community.specs) {
      await ops.saveCache(model, community.specs);
      return { success: true, specs: community.specs, source: 'community' };
    }
  } catch (e) {
    console.error('Community lookup failed:', e);
  }

  // 4. Signal that user input is needed
  return { success: false, needsUserInput: true };
}

/**
 * Extract specs from user-provided text
 */
export async function extractFromUserText(
  model: string,
  text: string,
  ops: { saveCache: (model: string, specs: Specifications) => Promise<void> }
): Promise<LookupResult> {
  if (!text.trim()) {
    return { success: false, error: 'Text is required' };
  }

  const specs = await extractSpecsWithLLM(model, text);

  if (!specs || Object.keys(specs).length === 0) {
    return { success: false, error: 'Could not extract specs from text' };
  }

  await ops.saveCache(model, specs);
  return { success: true, specs, source: 'user_input' };
}
