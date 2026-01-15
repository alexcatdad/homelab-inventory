import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if user has any devices
export const hasDevices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const device = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!device;
  },
});

// Check if user has sample data
export const hasSampleData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const sampleDevice = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("notes"), "[SAMPLE DATA]"))
      .first();

    return !!sampleDevice;
  },
});

// Seed sample homelab data for new users
export const seedSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Check if user already has devices
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("User already has devices");
    }

    const sampleNote = "[SAMPLE DATA]";

    // Sample enthusiast homelab devices
    const devices = [
      {
        userId,
        type: "Server" as const,
        name: "Proxmox Host",
        model: "Custom Build",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "AMD Ryzen 9 5900X", cores: 12, threads: 24, tdp_watts: 105 },
          ram: { type: "DDR4" as const, current: "64GB", max_supported: "128GB", slots_total: 4, slots_used: 2 },
          motherboard: { model: "ASUS ProArt X570-Creator", chipset: "X570", form_factor: "ATX" },
        },
        storage: [
          { type: "NVMe", capacity: "1TB", details: "Samsung 980 Pro" },
          { type: "NVMe", capacity: "1TB", details: "Samsung 980 Pro" },
        ],
        gpus: [{ model: "NVIDIA Quadro P2000", vram: "5GB" }],
      },
      {
        userId,
        type: "Server" as const,
        name: "TrueNAS Scale",
        model: "Dell PowerEdge R720",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Xeon E5-2670 v2", cores: 10, threads: 20, tdp_watts: 115 },
          ram: { type: "DDR3" as const, current: "128GB", max_supported: "384GB", slots_total: 24, slots_used: 8 },
        },
        storage: [
          { type: "HDD", capacity: "8TB", details: "WD Red Plus" },
          { type: "HDD", capacity: "8TB", details: "WD Red Plus" },
          { type: "HDD", capacity: "8TB", details: "WD Red Plus" },
          { type: "HDD", capacity: "8TB", details: "WD Red Plus" },
          { type: "SSD", capacity: "500GB", details: "Samsung 870 EVO" },
          { type: "SSD", capacity: "500GB", details: "Samsung 870 EVO" },
        ],
      },
      {
        userId,
        type: "IoT" as const,
        name: "Pi Cluster Node 1",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4" as const, current: "8GB", max_supported: "8GB" },
        },
        storage: [{ type: "SSD", capacity: "256GB", details: "Samsung T7" }],
      },
      {
        userId,
        type: "IoT" as const,
        name: "Pi Cluster Node 2",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4" as const, current: "8GB", max_supported: "8GB" },
        },
        storage: [{ type: "SSD", capacity: "256GB", details: "Samsung T7" }],
      },
      {
        userId,
        type: "IoT" as const,
        name: "Pi Cluster Node 3",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4" as const, current: "8GB", max_supported: "8GB" },
        },
        storage: [{ type: "SSD", capacity: "256GB", details: "Samsung T7" }],
      },
      {
        userId,
        type: "Network" as const,
        name: "Main Switch",
        model: "UniFi Switch 24 PoE",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        network_info: { ip_address: "192.168.1.2", mac_address: "00:1A:2B:3C:4D:5E" },
      },
      {
        userId,
        type: "Network" as const,
        name: "OPNsense Firewall",
        model: "Protectli Vault FW4B",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Celeron J3160", cores: 4, threads: 4, tdp_watts: 6 },
          ram: { type: "DDR3" as const, current: "8GB", max_supported: "8GB" },
        },
        storage: [{ type: "SSD", capacity: "120GB", details: "mSATA" }],
        network_info: { ip_address: "192.168.1.1" },
      },
      {
        userId,
        type: "IoT" as const,
        name: "Home Assistant",
        model: "Intel NUC8i3BEH",
        quantity: 1,
        location: "Living Room",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Core i3-8109U", cores: 2, threads: 4, tdp_watts: 28 },
          ram: { type: "DDR4" as const, current: "16GB", max_supported: "32GB", slots_total: 2, slots_used: 1 },
        },
        storage: [{ type: "NVMe", capacity: "256GB", details: "Samsung 970 EVO" }],
      },
    ];

    // Insert devices and collect IDs
    const deviceIds = new Map<string, any>();
    for (const device of devices) {
      const id = await ctx.db.insert("devices", device);
      deviceIds.set(device.name, id);
    }

    // Create network connections
    const connections = [
      { from: "Proxmox Host", to: "Main Switch", type: "ethernet", speed: "10Gbps" },
      { from: "TrueNAS Scale", to: "Main Switch", type: "ethernet", speed: "10Gbps" },
      { from: "Pi Cluster Node 1", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Pi Cluster Node 2", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Pi Cluster Node 3", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "OPNsense Firewall", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Home Assistant", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
    ];

    for (const conn of connections) {
      const fromId = deviceIds.get(conn.from);
      const toId = deviceIds.get(conn.to);
      if (fromId && toId) {
        await ctx.db.insert("network_connections", {
          userId,
          from_device_id: fromId,
          to_device_id: toId,
          connection_type: conn.type as "ethernet" | "wifi" | "thunderbolt" | "usb",
          speed: conn.speed,
        });
      }
    }

    return { seeded: devices.length };
  },
});

// Clear all sample data for current user
export const clearSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Find all sample devices
    const sampleDevices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("notes"), "[SAMPLE DATA]"))
      .collect();

    // Delete their network connections
    for (const device of sampleDevices) {
      const fromConns = await ctx.db
        .query("network_connections")
        .withIndex("by_from_device", (q) => q.eq("from_device_id", device._id))
        .collect();
      const toConns = await ctx.db
        .query("network_connections")
        .withIndex("by_to_device", (q) => q.eq("to_device_id", device._id))
        .collect();

      for (const conn of [...fromConns, ...toConns]) {
        if (conn.userId === userId) {
          await ctx.db.delete(conn._id);
        }
      }
    }

    // Delete sample devices
    for (const device of sampleDevices) {
      await ctx.db.delete(device._id);
    }

    return { cleared: sampleDevices.length };
  },
});
