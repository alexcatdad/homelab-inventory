import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all devices with optional filtering
export const list = query({
  args: {
    type: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let devices;

    if (args.type) {
      devices = await ctx.db
        .query("devices")
        .withIndex("by_type", (q) => q.eq("type", args.type as any))
        .collect();
    } else {
      devices = await ctx.db.query("devices").collect();
    }

    // Apply search filter in memory
    if (args.search) {
      const query = args.search.toLowerCase();
      devices = devices.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.model?.toLowerCase().includes(query) ||
          d.specifications?.cpu?.model?.toLowerCase().includes(query)
      );
    }

    // Sort by name
    devices.sort((a, b) => a.name.localeCompare(b.name));

    return devices;
  },
});

// Get single device by ID
export const get = query({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get device by name (for duplicate checking)
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Create a new device
export const create = mutation({
  args: {
    type: v.string(),
    name: v.string(),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    acquired_date: v.optional(v.string()),
    specifications: v.optional(v.any()),
    gpus: v.optional(v.array(v.any())),
    storage: v.optional(v.array(v.any())),
    pcie_slots: v.optional(v.array(v.any())),
    upgrade_analysis: v.optional(v.any()),
    network_info: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate name
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Device with name "${args.name}" already exists`);
    }

    const deviceId = await ctx.db.insert("devices", {
      type: args.type as any,
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

// Update a device
export const update = mutation({
  args: {
    id: v.id("devices"),
    type: v.optional(v.string()),
    name: v.optional(v.string()),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    acquired_date: v.optional(v.string()),
    specifications: v.optional(v.any()),
    gpus: v.optional(v.array(v.any())),
    storage: v.optional(v.array(v.any())),
    pcie_slots: v.optional(v.array(v.any())),
    upgrade_analysis: v.optional(v.any()),
    network_info: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Device not found");
    }

    // Check for duplicate name if changing it
    if (updates.name && updates.name !== existing.name) {
      const duplicate = await ctx.db
        .query("devices")
        .withIndex("by_name", (q) => q.eq("name", updates.name!))
        .first();
      if (duplicate) {
        throw new Error(`Device "${updates.name}" already exists`);
      }
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

// Delete a device
export const remove = mutation({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    // Delete associated network connections
    const fromConnections = await ctx.db
      .query("network_connections")
      .withIndex("by_from_device", (q) => q.eq("from_device_id", args.id))
      .collect();
    const toConnections = await ctx.db
      .query("network_connections")
      .withIndex("by_to_device", (q) => q.eq("to_device_id", args.id))
      .collect();

    for (const conn of [...fromConnections, ...toConnections]) {
      await ctx.db.delete(conn._id);
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
