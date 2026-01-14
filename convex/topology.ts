import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get network topology (nodes and edges)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").collect();
    const connections = await ctx.db.query("network_connections").collect();

    const nodes = devices.map((d) => ({
      id: d._id,
      name: d.name,
      type: d.type,
      ip: d.network_info?.ip_address,
      hostname: d.network_info?.hostname,
    }));

    const edges = connections.map((c) => ({
      id: c._id,
      source: c.from_device_id,
      target: c.to_device_id,
      type: c.connection_type,
      speed: c.speed,
    }));

    return { nodes, edges };
  },
});

// Add a connection between devices
export const addConnection = mutation({
  args: {
    from_device_id: v.id("devices"),
    to_device_id: v.id("devices"),
    connection_type: v.optional(v.string()),
    port: v.optional(v.string()),
    speed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify both devices exist
    const fromDevice = await ctx.db.get(args.from_device_id);
    const toDevice = await ctx.db.get(args.to_device_id);

    if (!fromDevice || !toDevice) {
      throw new Error("One or both devices not found");
    }

    const connectionId = await ctx.db.insert("network_connections", {
      from_device_id: args.from_device_id,
      to_device_id: args.to_device_id,
      connection_type: (args.connection_type || "ethernet") as any,
      port: args.port,
      speed: args.speed,
    });

    return { id: connectionId };
  },
});

// Remove a connection
export const removeConnection = mutation({
  args: { id: v.id("network_connections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
