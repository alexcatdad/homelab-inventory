import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Parse RAM string like "64GB" to number of GB
function parseRamToGB(ram: string | undefined): number {
  if (!ram) return 0;
  const match = ram.match(/^(\d+)\s*(GB|TB|MB)?$/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || "GB").toUpperCase();
  if (unit === "TB") return value * 1024;
  if (unit === "MB") return value / 1024;
  return value;
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

// Get inventory statistics for current user
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      // Return empty stats for unauthenticated users
      return {
        total_devices: 0,
        devices_by_type: {},
        total_storage_bytes: 0,
        total_storage_formatted: "0 B",
        total_ram_current: "0GB",
        total_ram_potential: "0GB",
        upgradeable_devices: 0,
      };
    }

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const devicesByType: Record<string, number> = {};
    let totalStorageBytes = 0;
    let totalRamCurrent = 0;
    let totalRamMax = 0;

    for (const device of devices) {
      // Count by type
      devicesByType[device.type] = (devicesByType[device.type] || 0) + 1;

      // Sum storage
      if (device.storage) {
        for (const drive of device.storage) {
          totalStorageBytes += drive.capacity_bytes || 0;
        }
      }

      // Sum RAM
      if (device.specifications?.ram) {
        totalRamCurrent += parseRamToGB(device.specifications.ram.current);
        totalRamMax += parseRamToGB(device.specifications.ram.max_supported);
      }
    }

    // Count upgradeable devices
    const upgradeableDevices = devices.filter(
      (d) =>
        d.upgrade_analysis?.cpu_max &&
        d.upgrade_analysis.cpu_max !== "Not Upgradeable"
    ).length;

    return {
      total_devices: devices.length,
      devices_by_type: devicesByType,
      total_storage_bytes: totalStorageBytes,
      total_storage_formatted: formatBytes(totalStorageBytes),
      total_ram_current: `${totalRamCurrent}GB`,
      total_ram_potential: `${totalRamMax}GB`,
      upgradeable_devices: upgradeableDevices,
    };
  },
});
