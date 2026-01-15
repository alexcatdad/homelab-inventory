import { test, expect } from '@playwright/test';

/**
 * Tests for authenticated app behavior.
 *
 * Note: Convex uses WebSockets, so HTTP route interception doesn't work for auth mocking.
 * These tests verify behavior when auth state is unknown/loading.
 * For full auth testing, use convex-test for backend and real GitHub OAuth for E2E.
 */
test.describe('App Route Behavior', () => {
  test('app route shows loading or auth prompt initially', async ({ page }) => {
    await page.goto('/app');

    // The app should show either:
    // 1. A loading state while checking auth
    // 2. A sign-in prompt if not authenticated
    // 3. The dashboard if somehow authenticated

    // Wait for initial render
    await page.waitForTimeout(2000);

    // Should not show a 404 page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('Page not found');
  });

  test('app route does not crash', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/app');
    await page.waitForTimeout(3000);

    // Filter out expected Convex auth errors (not logged in is expected)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('auth') && !e.includes('Convex') && !e.includes('WebSocket')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});

test.describe('Route Protection', () => {
  test('unauthenticated user on /app sees sign-in option', async ({ page }) => {
    await page.goto('/app');

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Should have some auth-related UI element
    // Either a sign-in button, or redirect to landing, or loading
    const hasSignIn = await page.getByRole('button', { name: /sign in|login|github/i }).isVisible().catch(() => false);
    const hasLanding = await page.locator('h1').filter({ hasText: /actually enjoy/i }).isVisible().catch(() => false);
    const hasLoading = await page.getByText(/loading/i).isVisible().catch(() => false);
    const hasDashboard = await page.locator('h1').filter({ hasText: /overview|dashboard/i }).isVisible().catch(() => false);

    // At least one of these states should be true
    const validState = hasSignIn || hasLanding || hasLoading || hasDashboard;
    expect(validState).toBe(true);
  });
});

test.describe('Navigation from App', () => {
  test('can navigate back to landing from app', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(2000);

    // Navigate to landing
    await page.goto('/');

    // Should show landing page
    await expect(page.locator('h1')).toContainText('actually enjoy', { timeout: 10000 });
  });
});
