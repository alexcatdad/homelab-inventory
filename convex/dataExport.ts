/**
 * Data export query for backup/migration
 * Returns all user data in a portable JSON format
 */

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Fetch all user's devices
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Fetch all user's network connections
    const connections = await ctx.db
      .query("network_connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Build device ID -> name mapping for connections
    const idToName = new Map(devices.map((d) => [d._id, d.name]));

    // Transform devices (strip internal fields like _id, _creationTime, userId)
    const exportDevices = devices.map((d) => ({
      name: d.name,
      type: d.type,
      model: d.model,
      quantity: d.quantity,
      acquired_date: d.acquired_date,
      location: d.location,
      notes: d.notes,
      specifications: d.specifications,
      gpus: d.gpus,
      storage: d.storage,
      pcie_slots: d.pcie_slots,
      upgrade_analysis: d.upgrade_analysis,
      network_info: d.network_info,
    }));

    // Transform connections (IDs -> names for portability)
    const exportConnections = connections
      .filter(
        (c) => idToName.has(c.from_device_id) && idToName.has(c.to_device_id)
      )
      .map((c) => ({
        from_device_name: idToName.get(c.from_device_id)!,
        to_device_name: idToName.get(c.to_device_id)!,
        connection_type: c.connection_type,
        port: c.port,
        speed: c.speed,
      }));

    // Fetch specs cache (global, not user-specific)
    const specsCache = await ctx.db.query("specs_cache").collect();
    const exportCache = specsCache.map((s) => ({
      model_query: s.model_query,
      specs_json: s.specs_json,
      source_url: s.source_url,
      expires_at: s.expires_at,
    }));

    return {
      version: "1.0",
      exported_at: new Date().toISOString(),
      source: "homelab-inventory",
      data: {
        devices: exportDevices,
        network_connections: exportConnections,
        specs_cache: exportCache,
      },
    };
  },
});
