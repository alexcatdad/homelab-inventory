/**
 * Data import mutations for backup restoration
 * Uses authenticated user context (no userId argument required)
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Validator for imported device data
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
  quantity: v.optional(v.number()),
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

// Import devices with duplicate handling options
export const importDevices = mutation({
  args: {
    devices: v.array(importedDevice),
    duplicateHandling: v.union(
      v.literal("skip"), // Skip existing devices with same name
      v.literal("rename"), // Rename with (1), (2), etc.
      v.literal("replace") // Replace existing device data
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const results = {
      imported: 0,
      skipped: 0,
      renamed: 0,
      replaced: 0,
      errors: [] as string[],
      deviceNameMap: {} as Record<string, string>, // original -> actual name
    };

    for (const device of args.devices) {
      try {
        // Check for existing device by name within user's devices
        const existing = await ctx.db
          .query("devices")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("name"), device.name))
          .first();

        if (existing) {
          switch (args.duplicateHandling) {
            case "skip":
              results.skipped++;
              results.deviceNameMap[device.name] = device.name;
              continue;

            case "rename":
              // Find unique name
              let newName = device.name;
              let counter = 1;
              while (true) {
                const dup = await ctx.db
                  .query("devices")
                  .withIndex("by_user", (q) => q.eq("userId", userId))
                  .filter((q) => q.eq(q.field("name"), newName))
                  .first();
                if (!dup) break;
                newName = `${device.name} (${counter++})`;
              }
              await ctx.db.insert("devices", {
                ...device,
                name: newName,
                userId,
                quantity: device.quantity ?? 1,
                model: device.model ?? "",
              } as any);
              results.renamed++;
              results.deviceNameMap[device.name] = newName;
              continue;

            case "replace":
              await ctx.db.patch(existing._id, {
                ...device,
                userId,
                quantity: device.quantity ?? 1,
                model: device.model ?? "",
              } as any);
              results.replaced++;
              results.deviceNameMap[device.name] = device.name;
              continue;
          }
        }

        // No existing device, create new
        await ctx.db.insert("devices", {
          ...device,
          userId,
          quantity: device.quantity ?? 1,
          model: device.model ?? "",
        } as any);
        results.imported++;
        results.deviceNameMap[device.name] = device.name;
      } catch (e) {
        results.errors.push(`${device.name}: ${e}`);
      }
    }

    return results;
  },
});

// Import network connections (after devices are imported)
export const importConnections = mutation({
  args: {
    connections: v.array(importedConnection),
    deviceNameMap: v.any(), // Map of original name -> actual name after import
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Build name -> ID lookup for user's devices
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const nameToId = new Map(devices.map((d) => [d.name, d._id]));

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const conn of args.connections) {
      try {
        // Resolve names through the mapping (handles renames)
        const actualFromName =
          args.deviceNameMap?.[conn.from_device_name] || conn.from_device_name;
        const actualToName =
          args.deviceNameMap?.[conn.to_device_name] || conn.to_device_name;

        const fromId = nameToId.get(actualFromName);
        const toId = nameToId.get(actualToName);

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

        await ctx.db.insert("network_connections", {
          userId,
          from_device_id: fromId,
          to_device_id: toId,
          connection_type: (conn.connection_type as any) || "ethernet",
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const entry of args.cache) {
      try {
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
