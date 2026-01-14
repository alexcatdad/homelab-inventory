import { query, mutation, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Internal query for cache lookup (used by action)
export const getCacheInternal = internalQuery({
  args: { model: v.string() },
  handler: async (ctx, args) => {
    const normalizedQuery = args.model.toLowerCase().trim();
    const cached = await ctx.db
      .query("specs_cache")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    if (cached && (!cached.expires_at || cached.expires_at > Date.now())) {
      return {
        cached: true,
        specs: JSON.parse(cached.specs_json),
        source_url: cached.source_url,
      };
    }

    return { cached: false };
  },
});

// Get cached specs for a model (reactive query)
export const getCache = query({
  args: { model: v.string() },
  handler: async (ctx, args) => {
    const normalizedQuery = args.model.toLowerCase().trim();
    const cached = await ctx.db
      .query("specs_cache")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    if (cached && (!cached.expires_at || cached.expires_at > Date.now())) {
      return {
        cached: true,
        specs: JSON.parse(cached.specs_json),
        source_url: cached.source_url,
      };
    }

    return { cached: false };
  },
});

// Store specs in cache
export const setCache = mutation({
  args: {
    model: v.string(),
    specs: v.any(),
    source_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedQuery = args.model.toLowerCase().trim();
    const existing = await ctx.db
      .query("specs_cache")
      .withIndex("by_model_query", (q) => q.eq("model_query", normalizedQuery))
      .first();

    // 30-day expiry
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        specs_json: JSON.stringify(args.specs),
        source_url: args.source_url,
        expires_at: expiresAt,
      });
    } else {
      await ctx.db.insert("specs_cache", {
        model_query: normalizedQuery,
        specs_json: JSON.stringify(args.specs),
        source_url: args.source_url,
        expires_at: expiresAt,
      });
    }

    return { success: true };
  },
});

// Check cache imperatively (action wrapper for imperative use)
export const checkCache = action({
  args: { model: v.string() },
  handler: async (ctx, args): Promise<{ cached: boolean; specs?: any; source_url?: string }> => {
    const result = await ctx.runQuery(internal.specs.getCacheInternal, {
      model: args.model,
    });
    return result;
  },
});

// Proxy search to DuckDuckGo (action for external HTTP calls)
export const proxySearch = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    return await response.text();
  },
});

// Clear expired cache entries
export const clearExpiredCache = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allCache = await ctx.db.query("specs_cache").collect();

    let cleared = 0;
    for (const entry of allCache) {
      if (entry.expires_at && entry.expires_at < now) {
        await ctx.db.delete(entry._id);
        cleared++;
      }
    }

    return { cleared };
  },
});
