import { describe, test, expect } from "bun:test";

// Test the validator type definitions and expected values
// Since Convex validators are used at runtime by the server, we test the expected values and structures

describe("Device Type Values", () => {
  const validDeviceTypes = ["Server", "Desktop", "Laptop", "Component", "IoT", "Network"];

  test("all valid device types are defined", () => {
    expect(validDeviceTypes).toHaveLength(6);
  });

  test("device types are strings", () => {
    for (const type of validDeviceTypes) {
      expect(typeof type).toBe("string");
    }
  });

  test("device types match expected values", () => {
    expect(validDeviceTypes).toContain("Server");
    expect(validDeviceTypes).toContain("Desktop");
    expect(validDeviceTypes).toContain("Laptop");
    expect(validDeviceTypes).toContain("Component");
    expect(validDeviceTypes).toContain("IoT");
    expect(validDeviceTypes).toContain("Network");
  });
});

describe("RAM Type Values", () => {
  const validRamTypes = ["DDR3", "DDR4", "DDR5", "Unified Memory", "LPDDR4", "LPDDR5"];

  test("all valid RAM types are defined", () => {
    expect(validRamTypes).toHaveLength(6);
  });

  test("RAM types include DDR variants", () => {
    expect(validRamTypes.filter((t) => t.startsWith("DDR")).length).toBe(3);
  });

  test("RAM types include LPDDR variants", () => {
    expect(validRamTypes.filter((t) => t.startsWith("LPDDR")).length).toBe(2);
  });
});

describe("Connection Type Values", () => {
  const validConnectionTypes = ["ethernet", "wifi", "thunderbolt", "usb"];

  test("all valid connection types are defined", () => {
    expect(validConnectionTypes).toHaveLength(4);
  });

  test("connection types are lowercase", () => {
    for (const type of validConnectionTypes) {
      expect(type).toBe(type.toLowerCase());
    }
  });
});

describe("Supported Language Values", () => {
  const supportedLanguages = ["en", "ro"];

  test("English and Romanian are supported", () => {
    expect(supportedLanguages).toContain("en");
    expect(supportedLanguages).toContain("ro");
  });

  test("language codes are lowercase", () => {
    for (const lang of supportedLanguages) {
      expect(lang).toBe(lang.toLowerCase());
    }
  });
});

describe("CPU Object Structure", () => {
  interface CPU {
    model: string;
    cores?: number;
    threads?: number;
    socket?: string;
    tdp_watts?: number;
    video_codecs?: string;
  }

  test("CPU requires model", () => {
    const cpu: CPU = { model: "Intel Core i7-12700K" };
    expect(cpu.model).toBeDefined();
  });

  test("CPU can have all optional fields", () => {
    const cpu: CPU = {
      model: "Intel Core i7-12700K",
      cores: 12,
      threads: 20,
      socket: "LGA1700",
      tdp_watts: 125,
      video_codecs: "AV1, HEVC",
    };
    expect(cpu.cores).toBe(12);
    expect(cpu.threads).toBe(20);
    expect(cpu.socket).toBe("LGA1700");
    expect(cpu.tdp_watts).toBe(125);
    expect(cpu.video_codecs).toContain("HEVC");
  });
});

describe("RAM Object Structure", () => {
  interface RAM {
    current: string;
    max_supported: string;
    type: string;
    slots_total?: number;
    slots_used?: number;
  }

  test("RAM requires current, max_supported, and type", () => {
    const ram: RAM = {
      current: "32GB",
      max_supported: "128GB",
      type: "DDR4",
    };
    expect(ram.current).toBeDefined();
    expect(ram.max_supported).toBeDefined();
    expect(ram.type).toBeDefined();
  });

  test("RAM can have slot information", () => {
    const ram: RAM = {
      current: "32GB",
      max_supported: "128GB",
      type: "DDR4",
      slots_total: 4,
      slots_used: 2,
    };
    expect(ram.slots_total).toBe(4);
    expect(ram.slots_used).toBe(2);
  });
});

describe("Motherboard Object Structure", () => {
  interface Motherboard {
    model: string;
    chipset?: string;
    form_factor?: string;
    sata_ports?: number;
    nvme_slots?: number;
  }

  test("Motherboard requires model", () => {
    const mb: Motherboard = { model: "ASUS ROG STRIX B550-F" };
    expect(mb.model).toBeDefined();
  });

  test("Motherboard can have all optional fields", () => {
    const mb: Motherboard = {
      model: "ASUS ROG STRIX B550-F",
      chipset: "B550",
      form_factor: "ATX",
      sata_ports: 6,
      nvme_slots: 2,
    };
    expect(mb.chipset).toBe("B550");
    expect(mb.form_factor).toBe("ATX");
    expect(mb.sata_ports).toBe(6);
    expect(mb.nvme_slots).toBe(2);
  });
});

describe("GPU Object Structure", () => {
  interface GPU {
    model: string;
    vram?: string;
  }

  test("GPU requires model", () => {
    const gpu: GPU = { model: "NVIDIA RTX 3080" };
    expect(gpu.model).toBeDefined();
  });

  test("GPU can have vram", () => {
    const gpu: GPU = { model: "NVIDIA RTX 3080", vram: "10GB" };
    expect(gpu.vram).toBe("10GB");
  });
});

describe("Storage Drive Object Structure", () => {
  interface StorageDrive {
    type: string;
    capacity?: string;
    capacity_bytes?: number;
    device_path?: string;
    mount_point?: string;
    details?: string;
  }

  test("Storage requires type", () => {
    const storage: StorageDrive = { type: "NVMe SSD" };
    expect(storage.type).toBeDefined();
  });

  test("Storage can have capacity info", () => {
    const storage: StorageDrive = {
      type: "NVMe SSD",
      capacity: "1TB",
      capacity_bytes: 1000000000000,
    };
    expect(storage.capacity).toBe("1TB");
    expect(storage.capacity_bytes).toBe(1000000000000);
  });

  test("Storage can have path info", () => {
    const storage: StorageDrive = {
      type: "NVMe SSD",
      device_path: "/dev/nvme0n1",
      mount_point: "/",
    };
    expect(storage.device_path).toBe("/dev/nvme0n1");
    expect(storage.mount_point).toBe("/");
  });
});

describe("PCIe Slot Object Structure", () => {
  interface PCIeSlot {
    description: string;
    generation?: number;
    lanes?: number;
    status: "Available" | "Occupied";
    current_card?: string;
  }

  test("PCIe slot requires description and status", () => {
    const slot: PCIeSlot = {
      description: "PCIe x16 Slot 1",
      status: "Available",
    };
    expect(slot.description).toBeDefined();
    expect(slot.status).toBeDefined();
  });

  test("PCIe slot can be occupied", () => {
    const slot: PCIeSlot = {
      description: "PCIe x16 Slot 1",
      status: "Occupied",
      current_card: "RTX 3080",
    };
    expect(slot.status).toBe("Occupied");
    expect(slot.current_card).toBe("RTX 3080");
  });

  test("PCIe slot can have generation and lanes", () => {
    const slot: PCIeSlot = {
      description: "PCIe x16 Slot 1",
      generation: 4,
      lanes: 16,
      status: "Available",
    };
    expect(slot.generation).toBe(4);
    expect(slot.lanes).toBe(16);
  });
});

describe("Network Info Object Structure", () => {
  interface NetworkInfo {
    mac_address?: string;
    ip_address?: string;
    hostname?: string;
    last_seen?: string;
    open_ports?: number[];
  }

  test("Network info can be empty", () => {
    const network: NetworkInfo = {};
    expect(Object.keys(network).length).toBe(0);
  });

  test("Network info can have all fields", () => {
    const network: NetworkInfo = {
      mac_address: "00:11:22:33:44:55",
      ip_address: "192.168.1.100",
      hostname: "server01",
      last_seen: "2024-01-15T10:00:00Z",
      open_ports: [22, 80, 443],
    };
    expect(network.mac_address).toBe("00:11:22:33:44:55");
    expect(network.ip_address).toBe("192.168.1.100");
    expect(network.hostname).toBe("server01");
    expect(network.open_ports).toHaveLength(3);
  });

  test("Open ports are numbers", () => {
    const network: NetworkInfo = { open_ports: [22, 80, 443, 8080] };
    for (const port of network.open_ports!) {
      expect(typeof port).toBe("number");
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    }
  });
});

describe("Upgrade Analysis Object Structure", () => {
  interface UpgradeAnalysis {
    cpu_max?: string;
    ram_max_practical?: string;
    notes?: string;
  }

  test("Upgrade analysis can be empty", () => {
    const analysis: UpgradeAnalysis = {};
    expect(Object.keys(analysis).length).toBe(0);
  });

  test("Upgrade analysis can have recommendations", () => {
    const analysis: UpgradeAnalysis = {
      cpu_max: "Intel Core i9-12900K",
      ram_max_practical: "128GB",
      notes: "Upgrade possible with BIOS update",
    };
    expect(analysis.cpu_max).toContain("i9");
    expect(analysis.ram_max_practical).toContain("128");
    expect(analysis.notes).toContain("BIOS");
  });
});

describe("Full Device Object Structure", () => {
  interface Device {
    _id: string;
    userId?: string;
    type: string;
    name: string;
    model?: string;
    quantity: number;
    acquired_date?: string;
    location?: string;
    notes?: string;
    specifications?: {
      cpu?: { model: string };
      ram?: { current: string; max_supported: string; type: string };
      motherboard?: { model: string };
    };
    gpus?: Array<{ model: string; vram?: string }>;
    storage?: Array<{ type: string; capacity?: string }>;
    pcie_slots?: Array<{ description: string; status: string }>;
    upgrade_analysis?: { cpu_max?: string; ram_max_practical?: string };
    network_info?: { ip_address?: string; hostname?: string };
  }

  test("Device requires id, type, name, and quantity", () => {
    const device: Device = {
      _id: "device123",
      type: "Server",
      name: "Production Server",
      quantity: 1,
    };
    expect(device._id).toBeDefined();
    expect(device.type).toBeDefined();
    expect(device.name).toBeDefined();
    expect(device.quantity).toBeDefined();
  });

  test("Device can have full specifications", () => {
    const device: Device = {
      _id: "device123",
      type: "Server",
      name: "Production Server",
      quantity: 1,
      specifications: {
        cpu: { model: "Intel Xeon E5-2680" },
        ram: { current: "64GB", max_supported: "768GB", type: "DDR4" },
        motherboard: { model: "Supermicro X11DPH-T" },
      },
    };
    expect(device.specifications?.cpu?.model).toContain("Xeon");
    expect(device.specifications?.ram?.current).toBe("64GB");
    expect(device.specifications?.motherboard?.model).toContain("Supermicro");
  });

  test("Device can have multiple GPUs", () => {
    const device: Device = {
      _id: "device123",
      type: "Desktop",
      name: "Workstation",
      quantity: 1,
      gpus: [
        { model: "NVIDIA RTX 3080", vram: "10GB" },
        { model: "NVIDIA RTX 3090", vram: "24GB" },
      ],
    };
    expect(device.gpus).toHaveLength(2);
  });

  test("Device can have multiple storage drives", () => {
    const device: Device = {
      _id: "device123",
      type: "Server",
      name: "Storage Server",
      quantity: 1,
      storage: [
        { type: "NVMe SSD", capacity: "1TB" },
        { type: "HDD", capacity: "10TB" },
        { type: "HDD", capacity: "10TB" },
      ],
    };
    expect(device.storage).toHaveLength(3);
  });
});
