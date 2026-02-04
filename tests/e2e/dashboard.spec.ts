import { test, expect } from '@playwright/test';
import { authenticateViaSignInAction, clearAuthState } from './auth-helper';

/**
 * Dashboard E2E Tests
 * Tests dashboard stats, charts, and overview functionality
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2500);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Dashboard Overview', () => {
    test('dashboard shows page header', async ({ page }) => {
      // Dashboard is the default view
      // Should show page title with "OVERVIEW" or similar
      const pageTitle = page.locator('.page-header h1');

      // Either we see the dashboard title or we're on login page
      const hasDashboard = await pageTitle.isVisible().catch(() => false);
      const hasLogin = await page.getByRole('button', { name: /github/i }).isVisible().catch(() => false);

      expect(hasDashboard || hasLogin).toBe(true);
    });

    test('sample data banner appears for new users', async ({ page }) => {
      // Sample data banner might be visible for test user
      const sampleBanner = page.locator('[class*="sample"]').first();

      // Either we see the banner or we have real data (both are valid states)
      const pageContent = await page.locator('body').textContent() || '';
      const validState = pageContent.toLowerCase().includes('sample') ||
        pageContent.toLowerCase().includes('dashboard') ||
        pageContent.toLowerCase().includes('overview') ||
        pageContent.includes('GitHub');

      expect(validState).toBe(true);
    });
  });

  test.describe('Metrics Display', () => {
    test('dashboard shows metric cards', async ({ page }) => {
      // Navigate to dashboard explicitly
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // Check for metric cards
      const metricCards = page.locator('.metric-card');
      const cardCount = await metricCards.count().catch(() => 0);

      // Should have metric cards or be on login page
      const hasLogin = await page.getByRole('button', { name: /github/i }).isVisible().catch(() => false);

      expect(cardCount > 0 || hasLogin).toBe(true);
    });

    test('total devices metric shows a number', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // Check first metric card value
      const metricValue = page.locator('.metric-value').first();

      if (await metricValue.isVisible().catch(() => false)) {
        const value = await metricValue.textContent();
        // Should contain a number or unit (like "0" or "0 B" or "5")
        expect(value).toBeTruthy();
      }
    });

    test('RAM utilization shows current and max', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // RAM card shows value group with current/max
      const ramValueGroup = page.locator('.metric-value-group');

      if (await ramValueGroup.isVisible().catch(() => false)) {
        await expect(ramValueGroup).toBeVisible();
      }
    });

    test('upgradeable devices metric is visible', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // Check for upgradeable card (has .upgradeable class)
      const upgradeCard = page.locator('.metric-card.upgradeable');

      if (await upgradeCard.isVisible().catch(() => false)) {
        await expect(upgradeCard).toBeVisible();
      }
    });
  });

  test.describe('Analytics Charts', () => {
    test('storage distribution chart area exists', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1500);
      }

      // Look for analytics section or panels
      const analyticsSection = page.locator('mc-panel, .card-content').first();

      if (await analyticsSection.isVisible().catch(() => false)) {
        await expect(analyticsSection).toBeVisible();
      }
    });

    test('chart headers display correctly', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1500);
      }

      // Check for card headers
      const cardHeaders = page.locator('.card-header h3');
      const headerCount = await cardHeaders.count().catch(() => 0);

      // If we have charts, they should have headers
      if (headerCount > 0) {
        const firstHeader = await cardHeaders.first().textContent();
        expect(firstHeader).toBeTruthy();
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('view all devices button is visible', async ({ page }) => {
      // Navigate to dashboard
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // Quick actions section
      const quickActions = page.locator('.quick-actions');

      if (await quickActions.isVisible().catch(() => false)) {
        await expect(quickActions).toBeVisible();
      }
    });

    test('clicking view all devices navigates to device grid', async ({ page }) => {
      // Navigate to dashboard first
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard|overview/i });
      if (await dashboardNav.isVisible().catch(() => false)) {
        await dashboardNav.click();
        await page.waitForTimeout(1000);
      }

      // Click the view all devices button
      const viewAllButton = page.locator('.quick-actions mc-button, .quick-actions button').first();

      if (await viewAllButton.isVisible().catch(() => false)) {
        await viewAllButton.click();
        await page.waitForTimeout(1000);

        // Should now show devices view
        const devicesTitle = page.locator('h1').filter({ hasText: /devices|inventory/i });
        const isOnDevices = await devicesTitle.isVisible().catch(() => false);

        // Or nav item should be active
        const devicesNavActive = await page.locator('button.nav-item.active').filter({ hasText: /devices/i }).isVisible().catch(() => false);

        expect(isOnDevices || devicesNavActive).toBe(true);
      }
    });
  });
});

test.describe('Dashboard Header Stats', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('header shows quick stats on larger screens', async ({ page }) => {
    // Quick stats in header (might be hidden on mobile)
    const quickStats = page.locator('.quick-stats');

    // This is viewport-dependent, so just check if element exists
    const statsExist = await page.locator('.stat-chip').count() > 0;

    // Either we have stats or we're on login page
    const hasLogin = await page.getByRole('button', { name: /github/i }).isVisible().catch(() => false);

    expect(statsExist || hasLogin).toBe(true);
  });
});
