# Spec Lookup Cascade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace DDG HTML proxy with a cascade lookup: cache → DDG Instant Answer API (JSONP) → community database → user paste fallback.

**Architecture:** Browser-native JSONP call to DDG API eliminates server proxy. New `community_specs` table enables shared specs. Fallback UI prompts users to paste specs when all else fails.

**Tech Stack:** Convex (schema, mutations, queries), Svelte 5, TypeScript, WebGPU LLM (existing)

---

## Task 1: Add community_specs table to schema

**Files:**
- Modify: `convex/schema.ts:66-72` (after specs_cache table)

**Step 1: Add the community_specs table definition**

Add after the `specs_cache` table definition (line 72):

```typescript
  // Community-contributed hardware specs (shared, verified by admin)
  community_specs: defineTable({
    model_query: v.string(),
    specs_json: v.string(),
    device_type: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    contributed_by: v.optional(v.id("users")),
    verified: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_model_query", ["model_query"])
    .index("by_manufacturer", ["manufacturer"])
    .index("by_verified", ["verified"]),
```

**Step 2: Verify schema compiles**

Run: `bunx convex dev --once`
Expected: Schema syncs without errors

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add community_specs table for shared hardware specs"
```

---

## Task 2: Create communitySpecs.ts with lookup and submit mutations

**Files:**
- Create: `convex/communitySpecs.ts`

**Step 1: Create the community specs module**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { specsDataValidator } from "./validators";

// Lookup community specs (public, no auth required)
export const lookup = query({
  args: { model: v.string() },
  handler: async (ctx, args) => {
    const normalizedQuery = args.model.toLowerCase().trim();

    const result = await ctx.db
      .query("community_specs")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    if (result && result.verified) {
      return { found: true, specs: JSON.parse(result.specs_json) };
    }
    return { found: false };
  },
});

// Submit specs for community review (requires auth)
export const submit = mutation({
  args: {
    model: v.string(),
    device_type: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    specs: specsDataValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const normalizedQuery = args.model.toLowerCase().trim();

    // Validate query length
    if (normalizedQuery.length < 2 || normalizedQuery.length > 200) {
      throw new Error("Invalid model query length");
    }

    // Check if already exists
    const existing = await ctx.db
      .query("community_specs")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    if (existing) {
      return { success: false, reason: "already_exists" };
    }

    await ctx.db.insert("community_specs", {
      model_query: normalizedQuery,
      specs_json: JSON.stringify(args.specs),
      device_type: args.device_type,
      manufacturer: args.manufacturer,
      contributed_by: userId,
      verified: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
```

**Step 2: Verify convex generates types**

Run: `bunx convex dev --once`
Expected: Types generated, `api.communitySpecs.lookup` and `api.communitySpecs.submit` available

**Step 3: Commit**

```bash
git add convex/communitySpecs.ts
git commit -m "feat: add communitySpecs lookup and submit mutations"
```

---

## Task 3: Create DDG JSONP helper

**Files:**
- Create: `src/client/lib/specLookup/ddgInstant.ts`

**Step 1: Create directory and file**

```bash
mkdir -p src/client/lib/specLookup
```

**Step 2: Create the JSONP helper**

```typescript
/**
 * DuckDuckGo Instant Answer API helper
 * Uses JSONP to bypass CORS - no server proxy needed
 */

export interface DDGInstantResult {
  text?: string;
  heading?: string;
  abstractURL?: string;
}

/**
 * Query DDG Instant Answer API via JSONP
 * Returns Wikipedia/knowledge graph data if available
 * ~20% hit rate for hardware - only popular items have Wikipedia entries
 */
export function queryDDGInstant(query: string, timeoutMs = 3000): Promise<DDGInstantResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve({});
    }, timeoutMs);

    const callbackName = `ddg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      script.remove();
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve({
        text: data.AbstractText || '',
        heading: data.Heading || '',
        abstractURL: data.AbstractURL || '',
      });
    };

    const script = document.createElement('script');
    script.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&callback=${callbackName}&t=homelab-inventory`;
    script.onerror = () => {
      cleanup();
      resolve({});
    };
    document.head.appendChild(script);
  });
}
```

**Step 3: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/client/lib/specLookup/ddgInstant.ts
git commit -m "feat: add DDG Instant Answer JSONP helper"
```

---

## Task 4: Create cascade lookup logic

**Files:**
- Create: `src/client/lib/specLookup/cascade.ts`

**Step 1: Create the cascade module**

```typescript
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
    if (codeMatch) {
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
      } else if (currentSection && (line.startsWith('  ') || line.startsWith('\t'))) {
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
```

**Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/client/lib/specLookup/cascade.ts
git commit -m "feat: add spec lookup cascade logic with DDG, community, and LLM extraction"
```

---

## Task 5: Create SpecLookupPrompt component

**Files:**
- Create: `src/client/components/SpecLookupPrompt.svelte`

**Step 1: Create the component**

```svelte
<script lang="ts">
  import { extractFromUserText, type CascadeOps } from '../lib/specLookup/cascade';
  import type { Specifications } from '../../shared/types';

  interface Props {
    modelName: string;
    onSpecsExtracted: (specs: Specifications) => void;
    onSkip: () => void;
    saveCache: (model: string, specs: Specifications) => Promise<void>;
  }

  let { modelName, onSpecsExtracted, onSkip, saveCache }: Props = $props();

  let inputText = $state('');
  let isExtracting = $state(false);
  let error = $state('');
  let shareWithCommunity = $state(true);

  async function handleExtract() {
    if (!inputText.trim()) return;

    isExtracting = true;
    error = '';

    try {
      const result = await extractFromUserText(modelName, inputText, { saveCache });

      if (result.success && result.specs) {
        onSpecsExtracted(result.specs);
      } else {
        error = result.error || 'Could not extract specs from text. Try adding more details.';
      }
    } catch (e) {
      error = 'Extraction failed. Please try again.';
    } finally {
      isExtracting = false;
    }
  }

  let canExtract = $derived(inputText.trim().length > 20 && !isExtracting);
</script>

<div class="spec-prompt">
  <div class="prompt-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <span>SPECS NOT FOUND</span>
  </div>

  <p class="prompt-text">
    No specs found for <strong>"{modelName}"</strong>. Paste specifications from a product page:
  </p>

  <textarea
    bind:value={inputText}
    placeholder="Paste specs here, e.g.:&#10;&#10;CPU: Intel Core i5-10500, 6 cores, 12 threads&#10;RAM: 16GB DDR4 (max 128GB)&#10;Chipset: Intel Q470"
    rows="5"
    disabled={isExtracting}
  ></textarea>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <label class="share-checkbox">
    <input type="checkbox" bind:checked={shareWithCommunity} disabled={isExtracting} />
    <span>Share these specs with the community</span>
  </label>

  <div class="prompt-actions">
    <button type="button" class="btn-skip" onclick={onSkip} disabled={isExtracting}>
      Skip, enter manually
    </button>
    <button type="button" class="btn-extract" onclick={handleExtract} disabled={!canExtract}>
      {#if isExtracting}
        <span class="spinner"></span>
        Extracting...
      {:else}
        Extract Specs
      {/if}
    </button>
  </div>
</div>

<style>
  .spec-prompt {
    background: var(--panel-deep);
    border: 1px solid var(--signal-blue);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin: var(--space-4) 0;
  }

  .prompt-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--signal-blue);
    margin-bottom: var(--space-3);
  }

  .prompt-header svg {
    width: 16px;
    height: 16px;
  }

  .prompt-header span {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .prompt-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  .prompt-text strong {
    color: var(--text-primary);
  }

  textarea {
    width: 100%;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-primary);
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    resize: vertical;
    min-height: 100px;
  }

  textarea:focus {
    outline: none;
    border-color: var(--signal-blue);
  }

  textarea::placeholder {
    color: var(--text-dim);
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .error {
    color: #ff6b6b;
    font-size: 0.8125rem;
    margin-top: var(--space-2);
  }

  .share-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: 0.8125rem;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .share-checkbox input {
    accent-color: var(--signal-blue);
  }

  .prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .btn-skip,
  .btn-extract {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .btn-skip {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-dim);
  }

  .btn-skip:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--border-panel);
  }

  .btn-extract {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--bg-base);
    background: var(--signal-blue);
    border: none;
  }

  .btn-extract:hover:not(:disabled) {
    background: var(--signal-blue-bright, #5ba3ff);
  }

  .btn-skip:disabled,
  .btn-extract:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

**Step 2: Verify component compiles**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/client/components/SpecLookupPrompt.svelte
git commit -m "feat: add SpecLookupPrompt component for user paste fallback"
```

---

## Task 6: Update DeviceForm to use cascade

**Files:**
- Modify: `src/client/components/DeviceForm.svelte`

**Step 1: Update imports** (replace lines 5-6)

Replace:
```typescript
  import { lookupSpecs, specLookupLoading, specLookupError, type ConvexSpecsOps } from '../lib/llm/specLookup';
  import { llmStatus, initializeLLM } from '../lib/llm/engine';
```

With:
```typescript
  import { lookupSpecsCascade, type CascadeOps, type LookupResult } from '../lib/specLookup/cascade';
  import { llmStatus, initializeLLM } from '../lib/llm/engine';
  import SpecLookupPrompt from './SpecLookupPrompt.svelte';
```

**Step 2: Add new state variable** (after line 16)

Add after `let lookupStatus`:
```typescript
  let showSpecPrompt = $state(false);
  let pendingModel = $state('');
```

**Step 3: Replace handleModelBlur function** (lines 126-181)

Replace the entire `handleModelBlur` function:
```typescript
  async function handleModelBlur() {
    if (!model.trim() || lookingUpSpecs || saving) return;

    // Don't lookup if we already have specs filled in
    if (cpuModel || ramCurrent || mbModel) return;

    specLookupLoading.set(true);
    specLookupError.set(null);
    showSpecPrompt = false;

    const cascadeOps: CascadeOps = {
      checkCache: async (modelQuery: string) => {
        const result = await client.action(api.specs.checkCache, { model: modelQuery });
        return { cached: result.cached, specs: result.specs };
      },
      checkCommunity: async (modelQuery: string) => {
        const result = await client.query(api.communitySpecs.lookup, { model: modelQuery });
        return { found: result.found, specs: result.specs };
      },
      saveCache: async (modelQuery: string, specs: Specifications) => {
        await client.mutation(api.specs.setCache, { model: modelQuery, specs });
      },
    };

    try {
      const result = await lookupSpecsCascade(model, cascadeOps);

      if (result.success && result.specs) {
        applySpecs(result.specs);
      } else if (result.needsUserInput) {
        // Show the paste prompt
        pendingModel = model;
        showSpecPrompt = true;
      }
    } catch (e) {
      console.error('Spec lookup failed:', e);
    } finally {
      specLookupLoading.set(false);
    }
  }

  function applySpecs(specs: Specifications) {
    if (specs.cpu) {
      cpuModel = specs.cpu.model || cpuModel;
      cpuCores = specs.cpu.cores ?? cpuCores;
      cpuThreads = specs.cpu.threads ?? cpuThreads;
      cpuSocket = specs.cpu.socket || cpuSocket;
      cpuTdp = specs.cpu.tdp_watts ?? cpuTdp;
    }
    if (specs.ram) {
      ramType = specs.ram.type || ramType;
      ramCurrent = specs.ram.current || ramCurrent;
      ramMax = specs.ram.max_supported || ramMax;
    }
    if (specs.motherboard) {
      mbModel = specs.motherboard.model || mbModel;
      mbChipset = specs.motherboard.chipset || mbChipset;
      mbFormFactor = specs.motherboard.form_factor || mbFormFactor;
    }
  }

  function handleSpecsExtracted(specs: Specifications) {
    applySpecs(specs);
    showSpecPrompt = false;
  }

  function handleSpecPromptSkip() {
    showSpecPrompt = false;
  }

  async function saveCacheForPrompt(modelQuery: string, specs: Specifications) {
    await client.mutation(api.specs.setCache, { model: modelQuery, specs });
  }
```

**Step 4: Add SpecLookupPrompt in template** (after the MODEL form-group, around line 345)

Add after the `</div>` that closes the `.input-with-status` div:
```svelte
        {#if showSpecPrompt}
          <SpecLookupPrompt
            modelName={pendingModel}
            onSpecsExtracted={handleSpecsExtracted}
            onSkip={handleSpecPromptSkip}
            saveCache={saveCacheForPrompt}
          />
        {/if}
```

**Step 5: Verify component compiles**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 6: Commit**

```bash
git add src/client/components/DeviceForm.svelte
git commit -m "feat: integrate cascade lookup with user paste fallback in DeviceForm"
```

---

## Task 7: Remove proxySearch from specs.ts

**Files:**
- Modify: `convex/specs.ts`

**Step 1: Remove rate limiting code** (lines 7-9)

Delete:
```typescript
// Rate limiting: track last search time per user (in-memory, resets on deploy)
const searchTimestamps = new Map<string, number>();
const SEARCH_RATE_LIMIT_MS = 2000; // Minimum 2 seconds between searches
```

**Step 2: Remove proxySearch action** (lines 114-161)

Delete the entire `proxySearch` action:
```typescript
// Proxy search to DuckDuckGo (action for external HTTP calls)
// Requires authentication and implements rate limiting
export const proxySearch = action({
  // ... entire function
});
```

**Step 3: Verify convex compiles**

Run: `bunx convex dev --once`
Expected: Compiles without errors (some client code may warn about missing proxySearch until we clean up)

**Step 4: Commit**

```bash
git add convex/specs.ts
git commit -m "refactor: remove proxySearch DDG proxy action"
```

---

## Task 8: Clean up old specLookup.ts

**Files:**
- Modify: `src/client/lib/llm/specLookup.ts`

**Step 1: Remove HTML parsing and old lookup function**

Replace entire file with simplified version that only exports stores:

```typescript
/**
 * Spec lookup state stores
 * The actual lookup logic is now in src/client/lib/specLookup/cascade.ts
 */
import { writable } from 'svelte/store';

// Store for lookup state (used by DeviceForm)
export const specLookupLoading = writable(false);
export const specLookupError = writable<string | null>(null);
```

**Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/client/lib/llm/specLookup.ts
git commit -m "refactor: simplify specLookup.ts to state stores only"
```

---

## Task 9: Manual testing

**Step 1: Start the dev server**

Run: `bun run dev`

**Step 2: Test the cascade**

1. Open the app, log in
2. Click "Add Device"
3. Enter model name: "Raspberry Pi 4" (has Wikipedia data)
4. Tab out of field
5. Expected: Specs should populate from DDG Instant Answer

**Step 3: Test user paste fallback**

1. Enter model name: "Dell OptiPlex 7080" (no Wikipedia data)
2. Tab out of field
3. Expected: Paste prompt appears
4. Paste some specs text
5. Click "Extract Specs"
6. Expected: Specs populate

**Step 4: Test community lookup** (requires seeded data)

This will work once community_specs has data. For now, verify no errors.

**Step 5: Commit any fixes**

If any issues found, fix and commit.

---

## Task 10: Final commit and push

**Step 1: Check git status**

Run: `git status`
Expected: All changes committed

**Step 2: Create summary commit if needed**

If there are any uncommitted changes:
```bash
git add -A
git commit -m "chore: spec lookup cascade implementation complete"
```

**Step 3: Push to remote**

Run: `git push`

---

## Summary

After completing all tasks:

- `community_specs` table added for shared specs
- DDG Instant Answer API called via browser JSONP (no proxy)
- Cascade tries: cache → DDG → community → user paste
- `proxySearch` removed from Convex
- Old HTML parsing removed
- User gets paste prompt when automated lookup fails
