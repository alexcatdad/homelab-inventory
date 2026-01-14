/**
 * Import migration from SQLite export
 * Run with: bunx convex run migrations/import
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Schema for imported data
const importedDevice = v.object({
  type: v.union(
    v.literal("Server"),
    v.literal("Desktop"),
    v.literal("Laptop"),
    v.literal("Component"),
    v.literal("IoT"),
    v.literal("Network")
  ),
  name: v.string(),
  model: v.optional(v.string()),
  quantity: v.number(),
  acquired_date: v.optional(v.string()),
  location: v.optional(v.string()),
  notes: v.optional(v.string()),
  specifications: v.optional(
    v.object({
      cpu: v.optional(
        v.object({
          model: v.string(),
          cores: v.optional(v.number()),
          threads: v.optional(v.number()),
          socket: v.optional(v.string()),
          tdp_watts: v.optional(v.number()),
          video_codecs: v.optional(v.string()),
        })
      ),
      ram: v.optional(
        v.object({
          current: v.string(),
          max_supported: v.string(),
          type: v.string(),
          slots_total: v.optional(v.number()),
          slots_used: v.optional(v.number()),
        })
      ),
      motherboard: v.optional(
        v.object({
          model: v.string(),
          chipset: v.optional(v.string()),
          form_factor: v.optional(v.string()),
          sata_ports: v.optional(v.number()),
          nvme_slots: v.optional(v.number()),
        })
      ),
    })
  ),
  gpus: v.optional(
    v.array(
      v.object({
        model: v.string(),
        vram: v.optional(v.string()),
      })
    )
  ),
  storage: v.optional(
    v.array(
      v.object({
        type: v.string(),
        capacity: v.optional(v.string()),
        capacity_bytes: v.optional(v.number()),
        device_path: v.optional(v.string()),
        mount_point: v.optional(v.string()),
        details: v.optional(v.string()),
      })
    )
  ),
  pcie_slots: v.optional(
    v.array(
      v.object({
        description: v.string(),
        generation: v.optional(v.number()),
        lanes: v.optional(v.number()),
        status: v.optional(v.string()),
        current_card: v.optional(v.string()),
      })
    )
  ),
  upgrade_analysis: v.optional(
    v.object({
      cpu_max: v.optional(v.string()),
      ram_max_practical: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
  ),
  network_info: v.optional(
    v.object({
      mac_address: v.optional(v.string()),
      ip_address: v.optional(v.string()),
      hostname: v.optional(v.string()),
      last_seen: v.optional(v.string()),
      open_ports: v.optional(v.array(v.string())),
    })
  ),
});

const importedConnection = v.object({
  from_device_name: v.string(),
  to_device_name: v.string(),
  connection_type: v.optional(v.string()),
  port: v.optional(v.string()),
  speed: v.optional(v.string()),
});

const importedSpecsCache = v.object({
  model_query: v.string(),
  specs_json: v.string(),
  source_url: v.optional(v.string()),
  expires_at: v.optional(v.number()),
});

// Import devices
export const importDevices = mutation({
  args: {
    devices: v.array(importedDevice),
  },
  handler: async (ctx, args) => {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const device of args.devices) {
      // Check for existing device by name
      const existing = await ctx.db
        .query("devices")
        .withIndex("by_name", (q) => q.eq("name", device.name))
        .first();

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        // Cast to any for migration flexibility - schema will validate
        await ctx.db.insert("devices", device as any);
        results.imported++;
      } catch (e) {
        results.errors.push(`${device.name}: ${e}`);
      }
    }

    return results;
  },
});

// Import network connections
export const importConnections = mutation({
  args: {
    connections: v.array(importedConnection),
  },
  handler: async (ctx, args) => {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Build device name -> ID mapping
    const devices = await ctx.db.query("devices").collect();
    const nameToId = new Map<string, typeof devices[0]["_id"]>();
    devices.forEach((d) => nameToId.set(d.name, d._id));

    for (const conn of args.connections) {
      const fromId = nameToId.get(conn.from_device_name);
      const toId = nameToId.get(conn.to_device_name);

      if (!fromId || !toId) {
        results.errors.push(
          `Missing device: ${conn.from_device_name} -> ${conn.to_device_name}`
        );
        results.skipped++;
        continue;
      }

      // Check for existing connection
      const existing = await ctx.db
        .query("network_connections")
        .withIndex("by_from_device", (q) => q.eq("from_device_id", fromId))
        .filter((q) => q.eq(q.field("to_device_id"), toId))
        .first();

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        await ctx.db.insert("network_connections", {
          from_device_id: fromId,
          to_device_id: toId,
          connection_type: conn.connection_type as any,
          port: conn.port,
          speed: conn.speed,
        });
        results.imported++;
      } catch (e) {
        results.errors.push(`Connection error: ${e}`);
      }
    }

    return results;
  },
});

// Import specs cache
export const importSpecsCache = mutation({
  args: {
    cache: v.array(importedSpecsCache),
  },
  handler: async (ctx, args) => {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const entry of args.cache) {
      // Check for existing cache entry
      const existing = await ctx.db
        .query("specs_cache")
        .withIndex("by_model_query", (q) =>
          q.eq("model_query", entry.model_query.toLowerCase().trim())
        )
        .first();

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        await ctx.db.insert("specs_cache", {
          model_query: entry.model_query.toLowerCase().trim(),
          specs_json: entry.specs_json,
          source_url: entry.source_url,
          expires_at: entry.expires_at,
        });
        results.imported++;
      } catch (e) {
        results.errors.push(`${entry.model_query}: ${e}`);
      }
    }

    return results;
  },
});
