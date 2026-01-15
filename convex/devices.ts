import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  deviceType,
  specificationsValidator,
  gpuValidator,
  storageDriveValidator,
  pcieSlotValidator,
  upgradeAnalysisValidator,
  networkInfoValidator,
} from "./validators";

// List all devices for the current user with optional filtering
export const list = query({
  args: {
    type: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Return empty for unauthenticated users
    }

    let devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by type if specified
    if (args.type) {
      devices = devices.filter((d) => d.type === args.type);
    }

    // Apply search filter in memory
    if (args.search) {
      const searchQuery = args.search.toLowerCase();
      devices = devices.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery) ||
          d.model?.toLowerCase().includes(searchQuery) ||
          d.specifications?.cpu?.model?.toLowerCase().includes(searchQuery)
      );
    }

    // Sort by name
    devices.sort((a, b) => a.name.localeCompare(b.name));

    return devices;
  },
});

// Get single device by ID (verify ownership)
export const get = query({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const device = await ctx.db.get(args.id);
    if (!device || device.userId !== userId) {
      return null; // Don't reveal device exists if not owned
    }
    return device;
  },
});

// Get device by name for current user (for duplicate checking)
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

// Create a new device (assign to current user)
export const create = mutation({
  args: {
    type: deviceType,
    name: v.string(),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    acquired_date: v.optional(v.string()),
    specifications: v.optional(specificationsValidator),
    gpus: v.optional(v.array(gpuValidator)),
    storage: v.optional(v.array(storageDriveValidator)),
    pcie_slots: v.optional(v.array(pcieSlotValidator)),
    upgrade_analysis: v.optional(upgradeAnalysisValidator),
    network_info: v.optional(networkInfoValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check for duplicate name within user's devices
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error(`Device with name "${args.name}" already exists`);
    }

    const deviceId = await ctx.db.insert("devices", {
      userId,
      type: args.type,
      name: args.name,
      model: args.model || "",
      quantity: args.quantity || 1,
      location: args.location,
      notes: args.notes,
      acquired_date: args.acquired_date,
      specifications: args.specifications,
      gpus: args.gpus || [],
      storage: args.storage || [],
      pcie_slots: args.pcie_slots || [],
      upgrade_analysis: args.upgrade_analysis,
      network_info: args.network_info,
    });

    return await ctx.db.get(deviceId);
  },
});

// Update a device (verify ownership)
export const update = mutation({
  args: {
    id: v.id("devices"),
    type: v.optional(deviceType),
    name: v.optional(v.string()),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    acquired_date: v.optional(v.string()),
    specifications: v.optional(specificationsValidator),
    gpus: v.optional(v.array(gpuValidator)),
    storage: v.optional(v.array(storageDriveValidator)),
    pcie_slots: v.optional(v.array(pcieSlotValidator)),
    upgrade_analysis: v.optional(upgradeAnalysisValidator),
    network_info: v.optional(networkInfoValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);

    if (!existing || existing.userId !== userId) {
      throw new Error("Device not found or access denied");
    }

    // Check for duplicate name if changing it (within user's devices)
    if (updates.name && updates.name !== existing.name) {
      const duplicate = await ctx.db
        .query("devices")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("name"), updates.name!))
        .first();
      if (duplicate) {
        throw new Error(`Device "${updates.name}" already exists`);
      }
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

// Delete a device (verify ownership)
export const remove = mutation({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const device = await ctx.db.get(args.id);
    if (!device || device.userId !== userId) {
      throw new Error("Device not found or access denied");
    }

    // Delete associated network connections (only user's)
    const fromConnections = await ctx.db
      .query("network_connections")
      .withIndex("by_from_device", (q) => q.eq("from_device_id", args.id))
      .collect();
    const toConnections = await ctx.db
      .query("network_connections")
      .withIndex("by_to_device", (q) => q.eq("to_device_id", args.id))
      .collect();

    for (const conn of [...fromConnections, ...toConnections]) {
      if (conn.userId === userId) {
        await ctx.db.delete(conn._id);
      }
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
