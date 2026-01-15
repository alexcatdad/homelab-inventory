// convex/supporters.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all active supporters (public)
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const supporters = await ctx.db
      .query("supporters")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Sort by most recent first
    supporters.sort((a, b) => b.supportedAt - a.supportedAt);

    return supporters.map((s) => ({
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      type: s.type,
      supportedAt: s.supportedAt,
    }));
  },
});

// Check if current user is a supporter
export const currentUserSupporter = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const supporter = await ctx.db
      .query("supporters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!supporter || !supporter.isActive) return null;

    return {
      type: supporter.type,
      supportedAt: supporter.supportedAt,
    };
  },
});
