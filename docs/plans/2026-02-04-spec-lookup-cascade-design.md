# Spec Lookup Cascade Design

**Date:** 2026-02-04
**Status:** Approved
**Goal:** Eliminate external dependencies while maintaining spec lookup functionality

## Problem

The current spec lookup feature proxies DuckDuckGo searches through Convex to work around browser CORS restrictions. This adds an external runtime dependency beyond Convex and auth.

## Solution

Replace the DDG HTML scraping with a cascade of lookup sources, prioritizing zero-dependency options.

## Lookup Cascade

```
User enters model name
        │
        ▼
┌───────────────────────────────────┐
│ 1. USER'S PERSONAL CACHE          │
│    specs_cache table (Convex)     │
│    Hit → Done                     │
└───────────────────────────────────┘
        │ Miss
        ▼
┌───────────────────────────────────┐
│ 2. DDG INSTANT ANSWER API         │
│    Browser-native JSONP           │
│    No server proxy needed         │
│    ~20% hit rate (Wikipedia data) │
│    Hit → LLM extract → Cache      │
└───────────────────────────────────┘
        │ Miss
        ▼
┌───────────────────────────────────┐
│ 3. COMMUNITY SPECS DATABASE       │
│    community_specs table (Convex) │
│    Shared, verified entries       │
│    Hit → Copy to user cache       │
└───────────────────────────────────┘
        │ Miss
        ▼
┌───────────────────────────────────┐
│ 4. USER-ASSISTED EXTRACTION       │
│    Prompt user to paste specs     │
│    LLM extracts (browser-side)    │
│    Optional: share with community │
└───────────────────────────────────┘
```

## Schema Changes

### New table: `community_specs`

```typescript
community_specs: defineTable({
  model_query: v.string(),           // Normalized lookup key
  specs_json: v.string(),            // Specifications JSON
  device_type: v.optional(v.string()),
  manufacturer: v.optional(v.string()),
  contributed_by: v.optional(v.id("users")),
  verified: v.boolean(),             // Only verified entries returned
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_model_query", ["model_query"])
  .index("by_manufacturer", ["manufacturer"])
  .index("by_verified", ["verified"])
```

### Existing `specs_cache`

No changes. Continues to serve as per-user cache.

## New Files

### `src/client/lib/specLookup/cascade.ts`

Main cascade logic:

```typescript
export interface LookupResult {
  success: boolean;
  specs?: Specifications;
  source?: 'cache' | 'ddg_instant' | 'community' | 'user_input';
  error?: string;
}

export async function lookupSpecsCascade(
  model: string,
  ops: ConvexOps
): Promise<LookupResult> {
  // 1. User's personal cache
  const cached = await ops.checkCache(model);
  if (cached.specs) {
    return { success: true, specs: cached.specs, source: 'cache' };
  }

  // 2. DDG Instant Answer API (browser-native JSONP)
  const ddgResult = await tryDDGInstantAnswer(model);
  if (ddgResult.text) {
    const specs = await extractSpecsWithLLM(ddgResult.text);
    if (specs) {
      await ops.saveCache(model, specs);
      return { success: true, specs, source: 'ddg_instant' };
    }
  }

  // 3. Community database
  const community = await ops.checkCommunitySpecs(model);
  if (community.specs) {
    await ops.saveCache(model, community.specs);
    return { success: true, specs: community.specs, source: 'community' };
  }

  // 4. Signal user input needed
  return { success: false, error: 'not_found' };
}
```

### DDG JSONP Helper

```typescript
function tryDDGInstantAnswer(query: string): Promise<{text?: string}> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({}), 3000);
    const cb = `ddg_${Date.now()}`;

    window[cb] = (data: any) => {
      clearTimeout(timeout);
      delete window[cb];
      resolve({ text: data.AbstractText || '' });
    };

    const script = document.createElement('script');
    script.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&callback=${cb}`;
    script.onerror = () => { clearTimeout(timeout); resolve({}); };
    document.head.appendChild(script);
  });
}
```

### `convex/communitySpecs.ts`

```typescript
// Submit specs for review
export const submitSpecs = mutation({
  args: {
    model: v.string(),
    device_type: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    specs: specsDataValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const normalizedQuery = args.model.toLowerCase().trim();

    const existing = await ctx.db
      .query("community_specs")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    if (existing) {
      return { success: false, reason: 'already_exists' };
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

// Lookup community specs (public)
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
```

### `src/client/components/SpecLookupPrompt.svelte`

User input fallback UI when cascade returns `not_found`:

- Textarea for pasting specs text
- "Extract Specs" button using existing LLM
- "Skip, I'll enter manually" option
- "Share with community" checkbox on success

## Files to Modify

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `community_specs` table |
| `convex/specs.ts` | Remove `proxySearch` action |
| `src/client/lib/llm/specLookup.ts` | Remove HTML parsing, simplify to text extraction only |
| `src/client/components/DeviceForm.svelte` | Integrate cascade + prompt UI |

## Files to Remove

None. The `proxySearch` function is removed but the file stays for cache operations.

## Migration Steps

1. Add `community_specs` table to schema
2. Run `npx convex dev` to sync schema
3. Create `convex/communitySpecs.ts`
4. Create `src/client/lib/specLookup/cascade.ts`
5. Create `src/client/components/SpecLookupPrompt.svelte`
6. Update `DeviceForm.svelte` to use new cascade
7. Remove `proxySearch` from `convex/specs.ts`
8. Remove HTML parsing from `specLookup.ts`
9. (Optional) Seed `community_specs` with common homelab devices

## Dependency Changes

**Removed runtime dependencies:**
- DuckDuckGo HTML search (proxied through Convex)

**Kept:**
- Convex (database, auth, functions)
- GitHub OAuth (authentication)
- `@mlc-ai/web-llm` (browser-side LLM, model cached locally)

**Added:**
- DDG Instant Answer API (browser-native JSONP, no proxy)

## Success Metrics

- Spec lookup works without Convex proxy for DDG
- Community database grows over time
- User paste fallback provides 100% coverage with user input

## Future Enhancements

- Admin UI for verifying community submissions
- Bulk import from existing `specs_cache` to seed `community_specs`
- Manufacturer-specific parsing hints
