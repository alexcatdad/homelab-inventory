import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Supported languages type
const supportedLanguage = v.union(v.literal("en"), v.literal("ro"));

/**
 * Get the current user's language preference
 */
export const getLanguage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return prefs?.language || null;
  },
});

/**
 * Set the current user's language preference
 */
export const setLanguage = mutation({
  args: {
    language: supportedLanguage,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if preferences already exist
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, { language: args.language });
    } else {
      // Create new preferences
      await ctx.db.insert("userPreferences", {
        userId,
        language: args.language,
      });
    }

    return args.language;
  },
});
