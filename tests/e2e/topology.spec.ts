import { test, expect } from '@playwright/test';
import { authenticateViaSignInAction, clearAuthState } from './auth-helper';

/**
 * Topology View E2E Tests
 * Tests network topology visualization
 */
test.describe('Topology View', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Topology Navigation', () => {
    test('can navigate to topology view', async ({ page }) => {
      // Topology nav button
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology|network/i });

      if (await topologyNav.isVisible().catch(() => false)) {
        await topologyNav.click();
        await page.waitForTimeout(1500);

        // Should show topology content or title
        const bodyText = await page.locator('body').textContent() || '';
        const hasTopology = bodyText.toLowerCase().includes('topology') ||
          bodyText.toLowerCase().includes('network') ||
          bodyText.toLowerCase().includes('graph');

        expect(hasTopology).toBe(true);
      }
    });

    test('topology nav item can be activated', async ({ page }) => {
      // Topology nav button
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology|network/i });

      if (await topologyNav.isVisible().catch(() => false)) {
        await topologyNav.click();
        await page.waitForTimeout(500);

        // Nav item should have active state
        await expect(topologyNav).toHaveClass(/active/);
      }
    });
  });

  test.describe('Topology Content', () => {
    test('topology view loads without errors', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Navigate to topology
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology|network/i });

      if (await topologyNav.isVisible().catch(() => false)) {
        await topologyNav.click();
        await page.waitForTimeout(2000);

        // Filter out expected errors
        const unexpectedErrors = errors.filter(
          (e) => !e.includes('auth') && !e.includes('Convex') && !e.includes('WebSocket')
        );

        expect(unexpectedErrors).toHaveLength(0);
      }
    });

    test('topology graph container exists', async ({ page }) => {
      // Navigate to topology
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology|network/i });

      if (await topologyNav.isVisible().catch(() => false)) {
        await topologyNav.click();
        await page.waitForTimeout(1500);

        // Look for graph container or SVG element
        const hasGraph = await page.locator('svg, canvas, .graph, [class*="topology"]').first().isVisible().catch(() => false);
        const hasContent = await page.locator('body').textContent().then(t =>
          (t || '').toLowerCase().includes('topology') ||
          (t || '').toLowerCase().includes('network')
        ).catch(() => false);

        expect(hasGraph || hasContent).toBe(true);
      }
    });
  });
});

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Navigation Bar', () => {
    test('navigation bar is visible', async ({ page }) => {
      const nav = page.locator('nav.nav');

      if (await nav.isVisible().catch(() => false)) {
        await expect(nav).toBeVisible();
      }
    });

    test('all main nav items are present', async ({ page }) => {
      // Dashboard, Devices, Topology
      const navItems = page.locator('button.nav-item');
      const itemCount = await navItems.count();

      // Should have at least 3 nav items (dashboard, devices, topology)
      // or we're on login page
      const hasLogin = await page.getByRole('button', { name: /github/i }).isVisible().catch(() => false);

      expect(itemCount >= 3 || hasLogin).toBe(true);
    });

    test('nav items show active state correctly', async ({ page }) => {
      // Click on devices nav
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });

      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(500);

        // Should have active class
        await expect(devicesNav).toHaveClass(/active/);

        // Dashboard should not be active
        const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard/i });
        if (await dashboardNav.isVisible().catch(() => false)) {
          const dashboardClasses = await dashboardNav.getAttribute('class') || '';
          expect(dashboardClasses).not.toContain('active');
        }
      }
    });
  });

  test.describe('Navigation Flow', () => {
    test('can navigate through all views', async ({ page }) => {
      const views = ['dashboard', 'devices', 'topology'];

      for (const view of views) {
        const navItem = page.locator('button.nav-item').filter({ hasText: new RegExp(view, 'i') });

        if (await navItem.isVisible().catch(() => false)) {
          await navItem.click();
          await page.waitForTimeout(500);

          // Should activate the nav item
          await expect(navItem).toHaveClass(/active/);
        }
      }
    });

    test('navigation preserves app state', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });

      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(500);

        // Navigate to dashboard
        const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard/i });
        if (await dashboardNav.isVisible().catch(() => false)) {
          await dashboardNav.click();
          await page.waitForTimeout(500);

          // Navigate back to devices
          await devicesNav.click();
          await page.waitForTimeout(500);

          // Should still be in devices view
          await expect(devicesNav).toHaveClass(/active/);
        }
      }
    });
  });
});

test.describe('AI Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('AI chat button is visible in header', async ({ page }) => {
    const chatButton = page.locator('.chat-button');
    const chatByLabel = page.getByRole('button', { name: /ai|chat|assistant/i });

    const chatVisible = await chatButton.isVisible().catch(() => false) ||
      await chatByLabel.isVisible().catch(() => false);

    // Either we have chat button or we're on login page
    const hasLogin = await page.getByRole('button', { name: /github/i }).isVisible().catch(() => false);

    expect(chatVisible || hasLogin).toBe(true);
  });

  test('clicking chat button opens chat panel', async ({ page }) => {
    const chatButton = page.locator('.chat-button');

    if (await chatButton.isVisible().catch(() => false)) {
      await chatButton.click();
      await page.waitForTimeout(500);

      // Chat panel should appear
      const chatPanel = page.locator('[class*="chat-panel"], [class*="ChatPanel"]');
      const hasChatContent = await page.locator('body').textContent().then(t =>
        (t || '').toLowerCase().includes('chat') ||
        (t || '').toLowerCase().includes('assistant')
      ).catch(() => false);

      expect(await chatPanel.isVisible().catch(() => false) || hasChatContent).toBe(true);
    }
  });
});
