import { Page } from '@playwright/test';

/**
 * E2E Test Auth Helper
 *
 * Authenticates using the test auth provider.
 * Requires CONVEX_TEST_AUTH_SECRET to be set in both:
 * - Convex environment (npx convex env set CONVEX_TEST_AUTH_SECRET <secret>)
 * - Playwright environment (via .env or process.env)
 */

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://resilient-canary-765.convex.cloud';
const TEST_AUTH_SECRET = process.env.CONVEX_TEST_AUTH_SECRET || 'e2e-test-secret-dev';

// Storage key namespace - derived from Convex URL
function getStorageNamespace(): string {
  return CONVEX_URL.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Authenticate as test user in E2E tests.
 *
 * This calls the test auth provider and stores the resulting tokens
 * in localStorage, allowing the app to pick them up.
 */
export async function authenticateAsTestUser(page: Page): Promise<void> {
  // Navigate to the app first to set up the origin
  await page.goto('/');

  // Call Convex auth action directly via HTTP
  const response = await page.evaluate(
    async ({ convexUrl, testSecret }) => {
      const res = await fetch(`${convexUrl}/api/auth/callback/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testSecret,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Auth failed: ${res.status} ${text}`);
      }

      return res.json();
    },
    { convexUrl: CONVEX_URL, testSecret: TEST_AUTH_SECRET }
  );

  // If we got tokens, store them
  if (response?.tokens) {
    const namespace = getStorageNamespace();
    await page.evaluate(
      ({ tokens, ns }) => {
        localStorage.setItem(`__convexAuthJWT_${ns}`, tokens.token);
        if (tokens.refreshToken) {
          localStorage.setItem(`__convexAuthRefreshToken_${ns}`, tokens.refreshToken);
        }
      },
      { tokens: response.tokens, ns: namespace }
    );

    // Reload to pick up the new auth state
    await page.reload();
  }
}

/**
 * Alternative: Authenticate by calling signIn action through Convex HTTP API
 */
export async function authenticateViaSignInAction(page: Page): Promise<void> {
  await page.goto('/');

  const namespace = getStorageNamespace();

  // Use the Convex HTTP API to sign in with test credentials
  const result = await page.evaluate(
    async ({ convexUrl, testSecret, ns }) => {
      // Convex HTTP API uses /api/run/{module}/{function} format
      const actionUrl = `${convexUrl}/api/run/auth/signIn`;

      const res = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          args: {
            provider: 'test',
            params: {
              token: testSecret,
            },
          },
          format: 'json',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { error: `${res.status}: ${text}` };
      }

      const data = await res.json();

      // The response format for /api/run is { value: { ... }, status: "success" }
      // For auth:signIn, the value contains tokens
      if (data?.value?.tokens) {
        localStorage.setItem(`__convexAuthJWT_${ns}`, data.value.tokens.token);
        if (data.value.tokens.refreshToken) {
          localStorage.setItem(`__convexAuthRefreshToken_${ns}`, data.value.tokens.refreshToken);
        }
        return { success: true };
      }

      return { error: 'No tokens in response', data };
    },
    { convexUrl: CONVEX_URL, testSecret: TEST_AUTH_SECRET, ns: namespace }
  );

  if ('error' in result) {
    console.warn('Auth via signIn action failed:', result.error);
    // Fall back to mock auth state for UI testing
    await injectMockAuthState(page);
  } else {
    // Reload to pick up auth state
    await page.reload();
    await page.waitForTimeout(1000);
  }
}

/**
 * Fallback: Inject mock auth state directly into localStorage.
 * This doesn't create a real session but allows testing UI that checks isAuthenticated.
 */
export async function injectMockAuthState(page: Page): Promise<void> {
  const namespace = getStorageNamespace();

  await page.evaluate(
    ({ ns }) => {
      // Inject a mock JWT - this won't work for real Convex queries
      // but will make the frontend think we're authenticated
      const mockJwt = 'mock-test-jwt-for-e2e';
      localStorage.setItem(`__convexAuthJWT_${ns}`, mockJwt);
    },
    { ns: namespace }
  );

  await page.reload();
  await page.waitForTimeout(500);
}

/**
 * Clear auth state - sign out
 */
export async function clearAuthState(page: Page): Promise<void> {
  const namespace = getStorageNamespace();

  await page.evaluate(
    ({ ns }) => {
      localStorage.removeItem(`__convexAuthJWT_${ns}`);
      localStorage.removeItem(`__convexAuthRefreshToken_${ns}`);
      localStorage.removeItem(`__convexAuthOAuthVerifier_${ns}`);
    },
    { ns: namespace }
  );
}
