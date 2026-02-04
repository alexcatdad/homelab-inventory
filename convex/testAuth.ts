import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal functions for test authentication.
 * These are only used by the test auth provider for E2E testing.
 */

// Find user by email (internal query)
export const findUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Create test user (internal mutation)
export const createTestUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
    });
  },
});
