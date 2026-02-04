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
