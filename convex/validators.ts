/**
 * Shared validators for Convex schema and mutations
 * These ensure consistent validation across the application
 */

import { v } from "convex/values";

// Device type enum
export const deviceType = v.union(
  v.literal("Server"),
  v.literal("Desktop"),
  v.literal("Laptop"),
  v.literal("Component"),
  v.literal("IoT"),
  v.literal("Network")
);

// RAM type enum
export const ramType = v.union(
  v.literal("DDR3"),
  v.literal("DDR4"),
  v.literal("DDR5"),
  v.literal("Unified Memory"),
  v.literal("LPDDR4"),
  v.literal("LPDDR5")
);

// PCIe status enum
export const pcieStatus = v.union(v.literal("Available"), v.literal("Occupied"));

// Connection type enum
export const connectionType = v.union(
  v.literal("ethernet"),
  v.literal("wifi"),
  v.literal("thunderbolt"),
  v.literal("usb")
);

// Supported languages
export const supportedLanguage = v.union(
  v.literal("en"),
  v.literal("ro")
);

// Embedded document validators
export const cpuValidator = v.object({
  model: v.string(),
  cores: v.optional(v.number()),
  threads: v.optional(v.number()),
  socket: v.optional(v.string()),
  tdp_watts: v.optional(v.number()),
  video_codecs: v.optional(v.string()),
});

export const ramValidator = v.object({
  current: v.string(),
  max_supported: v.string(),
  type: ramType,
  slots_total: v.optional(v.number()),
  slots_used: v.optional(v.number()),
});

export const motherboardValidator = v.object({
  model: v.string(),
  chipset: v.optional(v.string()),
  form_factor: v.optional(v.string()),
  sata_ports: v.optional(v.number()),
  nvme_slots: v.optional(v.number()),
});

export const gpuValidator = v.object({
  model: v.string(),
  vram: v.optional(v.string()),
});

export const storageDriveValidator = v.object({
  type: v.string(),
  capacity: v.optional(v.string()),
  capacity_bytes: v.optional(v.number()),
  device_path: v.optional(v.string()),
  mount_point: v.optional(v.string()),
  details: v.optional(v.string()),
});

export const pcieSlotValidator = v.object({
  description: v.string(),
  generation: v.optional(v.number()),
  lanes: v.optional(v.number()),
  status: pcieStatus,
  current_card: v.optional(v.string()),
});

export const specificationsValidator = v.object({
  cpu: v.optional(cpuValidator),
  ram: v.optional(ramValidator),
  motherboard: v.optional(motherboardValidator),
});

export const upgradeAnalysisValidator = v.object({
  cpu_max: v.optional(v.string()),
  ram_max_practical: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const networkInfoValidator = v.object({
  mac_address: v.optional(v.string()),
  ip_address: v.optional(v.string()),
  hostname: v.optional(v.string()),
  last_seen: v.optional(v.string()),
  open_ports: v.optional(v.array(v.number())),
});

// Specs cache validator (for storing hardware specifications)
export const specsDataValidator = v.object({
  cpu: v.optional(v.object({
    model: v.optional(v.string()),
    cores: v.optional(v.number()),
    threads: v.optional(v.number()),
    socket: v.optional(v.string()),
    tdp_watts: v.optional(v.number()),
  })),
  ram: v.optional(v.object({
    current: v.optional(v.string()),
    max_supported: v.optional(v.string()),
    type: v.optional(v.string()),
  })),
  motherboard: v.optional(v.object({
    model: v.optional(v.string()),
    chipset: v.optional(v.string()),
    form_factor: v.optional(v.string()),
  })),
});
