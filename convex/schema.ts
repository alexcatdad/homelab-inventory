import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  deviceType,
  connectionType,
  supportedLanguage,
  specificationsValidator,
  gpuValidator,
  storageDriveValidator,
  pcieSlotValidator,
  upgradeAnalysisValidator,
  networkInfoValidator,
} from "./validators";

export default defineSchema({
  // Auth tables (users, sessions, etc.)
  ...authTables,

  // User preferences (language, etc.)
  userPreferences: defineTable({
    userId: v.id("users"),
    language: supportedLanguage,
  }).index("by_user", ["userId"]),

  // Main devices table with embedded related data
  // NOTE: userId is optional to support legacy data migration
  // Once legacy data is cleared, make this required: userId: v.id("users")
  devices: defineTable({
    userId: v.optional(v.id("users")),
    type: deviceType,
    name: v.string(),
    model: v.optional(v.string()),
    quantity: v.number(),
    acquired_date: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Embedded specifications
    specifications: v.optional(specificationsValidator),
    // Embedded arrays (1:many relations)
    gpus: v.optional(v.array(gpuValidator)),
    storage: v.optional(v.array(storageDriveValidator)),
    pcie_slots: v.optional(v.array(pcieSlotValidator)),
    // Embedded 1:1 relations
    upgrade_analysis: v.optional(upgradeAnalysisValidator),
    network_info: v.optional(networkInfoValidator),
  })
    .index("by_name", ["name"])
    .index("by_type", ["type"])
    .index("by_user", ["userId"]),

  // Network connections (many-to-many between devices)
  // NOTE: userId is optional to support legacy data migration
  network_connections: defineTable({
    userId: v.optional(v.id("users")),
    from_device_id: v.id("devices"),
    to_device_id: v.id("devices"),
    connection_type: connectionType,
    port: v.optional(v.string()),
    speed: v.optional(v.string()),
  })
    .index("by_from_device", ["from_device_id"])
    .index("by_to_device", ["to_device_id"])
    .index("by_user", ["userId"]),

  // Hardware specs lookup cache
  specs_cache: defineTable({
    model_query: v.string(),
    specs_json: v.string(),
    source_url: v.optional(v.string()),
    expires_at: v.optional(v.number()),
  }).index("by_model_query", ["model_query"]),

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

  // Supporters table (public, for listing)
  supporters: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    type: v.union(v.literal("monthly"), v.literal("one-time")),
    // Stripe-related
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    // Status
    isActive: v.boolean(),
    supportedAt: v.number(), // timestamp
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_type", ["type"]),
});

// Re-export validators for use in other files
export {
  deviceType,
  connectionType,
  supportedLanguage,
} from "./validators";
