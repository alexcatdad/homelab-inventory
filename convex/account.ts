import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Delete all user data
export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Delete all user's devices
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Delete network connections for each device
    for (const device of devices) {
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

      await ctx.db.delete(device._id);
    }

    // Delete user preferences
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (prefs) {
      await ctx.db.delete(prefs._id);
    }

    // Delete supporter record if exists
    const supporter = await ctx.db
      .query("supporters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (supporter) {
      await ctx.db.delete(supporter._id);
    }

    return { deleted: true, deviceCount: devices.length };
  },
});
