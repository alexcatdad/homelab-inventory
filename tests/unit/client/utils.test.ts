import { describe, test, expect } from "bun:test";

// Test utility functions that might be used across the application

describe("Storage Formatting Utilities", () => {
  // Utility function to format bytes to human readable
  function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  test("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  test("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
  });

  test("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(2048)).toBe("2 KB");
  });

  test("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(10485760)).toBe("10 MB");
  });

  test("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
    expect(formatBytes(100 * 1073741824)).toBe("100 GB");
  });

  test("formats terabytes", () => {
    expect(formatBytes(1099511627776)).toBe("1 TB");
    expect(formatBytes(10 * 1099511627776)).toBe("10 TB");
  });

  test("respects decimal places", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
  });
});

describe("RAM Parsing Utilities", () => {
  // Parse RAM string to GB number
  function parseRAMToGB(ramString: string): number {
    const match = ramString.match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case "TB":
        return value * 1024;
      case "GB":
        return value;
      case "MB":
        return value / 1024;
      default:
        return 0;
    }
  }

  test("parses GB values", () => {
    expect(parseRAMToGB("16GB")).toBe(16);
    expect(parseRAMToGB("32 GB")).toBe(32);
    expect(parseRAMToGB("128GB")).toBe(128);
  });

  test("parses TB values", () => {
    expect(parseRAMToGB("1TB")).toBe(1024);
    expect(parseRAMToGB("2 TB")).toBe(2048);
  });

  test("parses MB values", () => {
    expect(parseRAMToGB("512MB")).toBe(0.5);
    expect(parseRAMToGB("1024 MB")).toBe(1);
  });

  test("handles invalid input", () => {
    expect(parseRAMToGB("")).toBe(0);
    expect(parseRAMToGB("invalid")).toBe(0);
    expect(parseRAMToGB("16")).toBe(0);
  });

  test("is case insensitive", () => {
    expect(parseRAMToGB("16gb")).toBe(16);
    expect(parseRAMToGB("16Gb")).toBe(16);
    expect(parseRAMToGB("16gB")).toBe(16);
  });
});

describe("Device Type Utilities", () => {
  const deviceTypeColors: Record<string, string> = {
    Server: "#00a8ff",
    Desktop: "#a855f7",
    Laptop: "#00d26a",
    Component: "#ffb020",
    IoT: "#ff4757",
    Network: "#00e5cc",
  };

  test("returns correct color for each device type", () => {
    expect(deviceTypeColors.Server).toBe("#00a8ff");
    expect(deviceTypeColors.Desktop).toBe("#a855f7");
    expect(deviceTypeColors.Laptop).toBe("#00d26a");
    expect(deviceTypeColors.Component).toBe("#ffb020");
    expect(deviceTypeColors.IoT).toBe("#ff4757");
    expect(deviceTypeColors.Network).toBe("#00e5cc");
  });

  test("all device types have colors", () => {
    const types = ["Server", "Desktop", "Laptop", "Component", "IoT", "Network"];
    for (const type of types) {
      expect(deviceTypeColors[type]).toBeDefined();
      expect(deviceTypeColors[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("Search Query Utilities", () => {
  // Filter devices by search query
  function matchesSearch(
    device: { name: string; model?: string; cpu?: string },
    query: string
  ): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      device.name.toLowerCase().includes(q) ||
      (device.model?.toLowerCase().includes(q) ?? false) ||
      (device.cpu?.toLowerCase().includes(q) ?? false)
    );
  }

  const testDevices = [
    { name: "Production Server", model: "Dell R730", cpu: "Intel Xeon E5-2680" },
    { name: "Dev Workstation", model: "HP Z440", cpu: "Intel Xeon E5-1650" },
    { name: "Gaming Desktop", model: "Custom Build", cpu: "AMD Ryzen 9 5900X" },
  ];

  test("matches by name", () => {
    expect(matchesSearch(testDevices[0], "production")).toBe(true);
    expect(matchesSearch(testDevices[0], "server")).toBe(true);
    expect(matchesSearch(testDevices[0], "gaming")).toBe(false);
  });

  test("matches by model", () => {
    expect(matchesSearch(testDevices[0], "dell")).toBe(true);
    expect(matchesSearch(testDevices[0], "r730")).toBe(true);
    expect(matchesSearch(testDevices[1], "hp")).toBe(true);
  });

  test("matches by CPU", () => {
    expect(matchesSearch(testDevices[0], "xeon")).toBe(true);
    expect(matchesSearch(testDevices[2], "ryzen")).toBe(true);
    expect(matchesSearch(testDevices[2], "intel")).toBe(false);
  });

  test("is case insensitive", () => {
    expect(matchesSearch(testDevices[0], "PRODUCTION")).toBe(true);
    expect(matchesSearch(testDevices[0], "DELL")).toBe(true);
    expect(matchesSearch(testDevices[0], "XEON")).toBe(true);
  });

  test("returns true for empty query", () => {
    expect(matchesSearch(testDevices[0], "")).toBe(true);
  });

  test("handles devices with missing optional fields", () => {
    const device = { name: "Simple Device" };
    expect(matchesSearch(device, "simple")).toBe(true);
    expect(matchesSearch(device, "dell")).toBe(false);
  });
});

describe("Date Formatting Utilities", () => {
  function formatDate(dateString: string | undefined, locale = "en"): string {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  }

  test("formats ISO date string", () => {
    const formatted = formatDate("2024-01-15T10:00:00Z");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
  });

  test("handles undefined input", () => {
    expect(formatDate(undefined)).toBe("N/A");
  });

  test("handles invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("Invalid date");
    expect(formatDate("")).toBe("N/A");
  });

  test("respects locale", () => {
    const date = "2024-01-15T10:00:00Z";
    const en = formatDate(date, "en");
    const ro = formatDate(date, "ro");
    // Both should contain 2024 and 15
    expect(en).toContain("2024");
    expect(ro).toContain("2024");
  });
});

describe("Connection Type Utilities", () => {
  function getConnectionSpeed(type: string, speed?: string): string {
    if (speed) return speed;
    // Default speeds by connection type
    const defaults: Record<string, string> = {
      ethernet: "1 Gbps",
      wifi: "300 Mbps",
      thunderbolt: "40 Gbps",
      usb: "5 Gbps",
    };
    return defaults[type] || "Unknown";
  }

  test("returns specified speed when provided", () => {
    expect(getConnectionSpeed("ethernet", "10 Gbps")).toBe("10 Gbps");
    expect(getConnectionSpeed("wifi", "1 Gbps")).toBe("1 Gbps");
  });

  test("returns default speed for each connection type", () => {
    expect(getConnectionSpeed("ethernet")).toBe("1 Gbps");
    expect(getConnectionSpeed("wifi")).toBe("300 Mbps");
    expect(getConnectionSpeed("thunderbolt")).toBe("40 Gbps");
    expect(getConnectionSpeed("usb")).toBe("5 Gbps");
  });

  test("handles unknown connection type", () => {
    expect(getConnectionSpeed("bluetooth")).toBe("Unknown");
  });
});

describe("Validation Utilities", () => {
  function isValidIPv4(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
  }

  function isValidMAC(mac: string): boolean {
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
  }

  test("validates correct IPv4 addresses", () => {
    expect(isValidIPv4("192.168.1.1")).toBe(true);
    expect(isValidIPv4("10.0.0.1")).toBe(true);
    expect(isValidIPv4("255.255.255.255")).toBe(true);
    expect(isValidIPv4("0.0.0.0")).toBe(true);
  });

  test("rejects invalid IPv4 addresses", () => {
    expect(isValidIPv4("256.1.1.1")).toBe(false);
    expect(isValidIPv4("192.168.1")).toBe(false);
    expect(isValidIPv4("192.168.1.1.1")).toBe(false);
    expect(isValidIPv4("192.168.01.1")).toBe(false); // Leading zero
    expect(isValidIPv4("abc.def.ghi.jkl")).toBe(false);
    expect(isValidIPv4("")).toBe(false);
  });

  test("validates correct MAC addresses", () => {
    expect(isValidMAC("00:11:22:33:44:55")).toBe(true);
    expect(isValidMAC("00-11-22-33-44-55")).toBe(true);
    expect(isValidMAC("AA:BB:CC:DD:EE:FF")).toBe(true);
    expect(isValidMAC("aa:bb:cc:dd:ee:ff")).toBe(true);
  });

  test("rejects invalid MAC addresses", () => {
    expect(isValidMAC("00:11:22:33:44")).toBe(false);
    expect(isValidMAC("00:11:22:33:44:55:66")).toBe(false);
    expect(isValidMAC("GG:HH:II:JJ:KK:LL")).toBe(false);
    expect(isValidMAC("001122334455")).toBe(false);
    expect(isValidMAC("")).toBe(false);
  });
});

describe("Array Utilities", () => {
  function uniqueBy<T>(arr: T[], key: keyof T): T[] {
    const seen = new Set();
    return arr.filter((item) => {
      const k = item[key];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  test("removes duplicates by key", () => {
    const items = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 1, name: "C" },
    ];
    const unique = uniqueBy(items, "id");
    expect(unique.length).toBe(2);
    expect(unique[0].name).toBe("A");
    expect(unique[1].name).toBe("B");
  });

  test("preserves first occurrence", () => {
    const items = [
      { name: "First", value: 1 },
      { name: "Second", value: 2 },
      { name: "First", value: 3 },
    ];
    const unique = uniqueBy(items, "name");
    expect(unique.length).toBe(2);
    expect(unique.find((i) => i.name === "First")?.value).toBe(1);
  });

  test("handles empty array", () => {
    const items: { id: number }[] = [];
    const unique = uniqueBy(items, "id");
    expect(unique.length).toBe(0);
  });
});
