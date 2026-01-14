import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get network topology for current user (nodes and edges)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { nodes: [], edges: [] };
    }

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const connections = await ctx.db
      .query("network_connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

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

// Add a connection between devices (verify ownership)
export const addConnection = mutation({
  args: {
    from_device_id: v.id("devices"),
    to_device_id: v.id("devices"),
    connection_type: v.optional(v.string()),
    port: v.optional(v.string()),
    speed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Verify both devices exist AND belong to user
    const fromDevice = await ctx.db.get(args.from_device_id);
    const toDevice = await ctx.db.get(args.to_device_id);

    if (
      !fromDevice ||
      fromDevice.userId !== userId ||
      !toDevice ||
      toDevice.userId !== userId
    ) {
      throw new Error("One or both devices not found or access denied");
    }

    const connectionId = await ctx.db.insert("network_connections", {
      userId,
      from_device_id: args.from_device_id,
      to_device_id: args.to_device_id,
      connection_type: (args.connection_type || "ethernet") as any,
      port: args.port,
      speed: args.speed,
    });

    return { id: connectionId };
  },
});

// Remove a connection (verify ownership)
export const removeConnection = mutation({
  args: { id: v.id("network_connections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const connection = await ctx.db.get(args.id);
    if (!connection || connection.userId !== userId) {
      throw new Error("Connection not found or access denied");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
