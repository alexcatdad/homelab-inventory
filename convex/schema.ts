import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Device type enum
const deviceType = v.union(
  v.literal("Server"),
  v.literal("Desktop"),
  v.literal("Laptop"),
  v.literal("Component"),
  v.literal("IoT"),
  v.literal("Network")
);

// RAM type enum
const ramType = v.union(
  v.literal("DDR3"),
  v.literal("DDR4"),
  v.literal("DDR5"),
  v.literal("Unified Memory"),
  v.literal("LPDDR4"),
  v.literal("LPDDR5")
);

// PCIe status enum
const pcieStatus = v.union(v.literal("Available"), v.literal("Occupied"));

// Connection type enum
const connectionType = v.union(
  v.literal("ethernet"),
  v.literal("wifi"),
  v.literal("thunderbolt"),
  v.literal("usb")
);

// Embedded document validators
const cpu = v.object({
  model: v.string(),
  cores: v.optional(v.number()),
  threads: v.optional(v.number()),
  socket: v.optional(v.string()),
  tdp_watts: v.optional(v.number()),
  video_codecs: v.optional(v.string()),
});

const ram = v.object({
  current: v.string(),
  max_supported: v.string(),
  type: ramType,
  slots_total: v.optional(v.number()),
  slots_used: v.optional(v.number()),
});

const motherboard = v.object({
  model: v.string(),
  chipset: v.optional(v.string()),
  form_factor: v.optional(v.string()),
  sata_ports: v.optional(v.number()),
  nvme_slots: v.optional(v.number()),
});

const gpu = v.object({
  model: v.string(),
  vram: v.optional(v.string()),
});

const storageDrive = v.object({
  type: v.string(),
  capacity: v.optional(v.string()),
  capacity_bytes: v.optional(v.number()),
  device_path: v.optional(v.string()),
  mount_point: v.optional(v.string()),
  details: v.optional(v.string()),
});

const pcieSlot = v.object({
  description: v.string(),
  generation: v.optional(v.number()),
  lanes: v.optional(v.number()),
  status: pcieStatus,
  current_card: v.optional(v.string()),
});

const specifications = v.object({
  cpu: v.optional(cpu),
  ram: v.optional(ram),
  motherboard: v.optional(motherboard),
});

const upgradeAnalysis = v.object({
  cpu_max: v.optional(v.string()),
  ram_max_practical: v.optional(v.string()),
  notes: v.optional(v.string()),
});

const networkInfo = v.object({
  mac_address: v.optional(v.string()),
  ip_address: v.optional(v.string()),
  hostname: v.optional(v.string()),
  last_seen: v.optional(v.string()),
  open_ports: v.optional(v.array(v.number())),
});

export default defineSchema({
  // Main devices table with embedded related data
  devices: defineTable({
    type: deviceType,
    name: v.string(),
    model: v.optional(v.string()),
    quantity: v.number(),
    acquired_date: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Embedded specifications
    specifications: v.optional(specifications),
    // Embedded arrays (1:many relations)
    gpus: v.optional(v.array(gpu)),
    storage: v.optional(v.array(storageDrive)),
    pcie_slots: v.optional(v.array(pcieSlot)),
    // Embedded 1:1 relations
    upgrade_analysis: v.optional(upgradeAnalysis),
    network_info: v.optional(networkInfo),
  })
    .index("by_name", ["name"])
    .index("by_type", ["type"]),

  // Network connections (many-to-many between devices)
  network_connections: defineTable({
    from_device_id: v.id("devices"),
    to_device_id: v.id("devices"),
    connection_type: connectionType,
    port: v.optional(v.string()),
    speed: v.optional(v.string()),
  })
    .index("by_from_device", ["from_device_id"])
    .index("by_to_device", ["to_device_id"]),

  // Hardware specs lookup cache
  specs_cache: defineTable({
    model_query: v.string(),
    specs_json: v.string(),
    source_url: v.optional(v.string()),
    expires_at: v.optional(v.number()),
  }).index("by_model_query", ["model_query"]),
});
