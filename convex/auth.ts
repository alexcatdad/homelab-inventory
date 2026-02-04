import GitHub from "@auth/core/providers/github";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

/**
 * Test auth provider for E2E testing.
 * Only active when CONVEX_TEST_AUTH_SECRET environment variable is set.
 * In production, don't set this variable and the provider won't be available.
 */
const TestProvider = ConvexCredentials<DataModel>({
  id: "test",
  authorize: async (credentials, ctx) => {
    const testSecret = process.env.CONVEX_TEST_AUTH_SECRET;

    // If no test secret configured, test auth is disabled
    if (!testSecret) {
      console.warn("Test auth attempted but CONVEX_TEST_AUTH_SECRET not set");
      return null;
    }

    // Verify the token matches our secret
    if (credentials?.token !== testSecret) {
      console.warn("Test auth failed: invalid token");
      return null;
    }

    // Find or create the test user
    const existingUser = await ctx.runQuery(internal.testAuth.findUserByEmail, {
      email: "test@e2e.local",
    });

    if (existingUser) {
      return { userId: existingUser._id };
    }

    // Create new test user
    const userId = await ctx.runMutation(internal.testAuth.createTestUser, {
      name: "E2E Test User",
      email: "test@e2e.local",
      image: "https://github.com/ghost.png",
    });

    return { userId };
  },
});

// Build providers list - test provider only included if secret is set
const providers = process.env.CONVEX_TEST_AUTH_SECRET
  ? [GitHub, TestProvider]
  : [GitHub];

export const { auth, signIn, signOut, store } = convexAuth({
  providers,
});

// Query to check if user is authenticated (callable from client)
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    // Return the user document
    return await ctx.db.get(userId);
  },
});
