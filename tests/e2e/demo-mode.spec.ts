import { test, expect } from '@playwright/test';

/**
 * Demo Mode E2E Tests
 *
 * Tests the guest/demo mode which allows users to explore the app
 * with sample data without authentication. This is ideal for E2E testing
 * because it doesn't require auth setup.
 */
test.describe('Demo Mode', () => {
  test.describe('Landing Page - Demo Entry', () => {
    test('landing page shows "Try Demo" button', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Check for Try Demo button
      const tryDemoButton = page.getByRole('button', { name: /try demo/i });
      await expect(tryDemoButton).toBeVisible();
    });

    test('clicking "Try Demo" navigates to demo mode', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Click Try Demo
      await page.getByRole('button', { name: /try demo/i }).click();

      // Should navigate to /demo
      await expect(page).toHaveURL('/demo');
    });
  });

  test.describe('Demo Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);
    });

    test('demo dashboard loads with demo banner', async ({ page }) => {
      // Should show demo banner
      const demoBanner = page.locator('.demo-banner');
      await expect(demoBanner).toBeVisible({ timeout: 5000 });

      // Banner should contain "DEMO MODE" text
      await expect(demoBanner).toContainText(/demo mode/i);
    });

    test('demo dashboard shows page title', async ({ page }) => {
      // Should show dashboard title
      const pageTitle = page.locator('.page-header h1');
      await expect(pageTitle).toBeVisible({ timeout: 5000 });
      await expect(pageTitle).toContainText(/overview/i);
    });

    test('demo dashboard shows metric cards with demo data', async ({ page }) => {
      // Should show 4 metric cards
      const metricCards = page.locator('.metric-card');
      await expect(metricCards).toHaveCount(4, { timeout: 5000 });

      // First metric should show total devices (12 in demo data)
      const firstMetricValue = page.locator('.metric-value').first();
      await expect(firstMetricValue).toBeVisible();
      const value = await firstMetricValue.textContent();
      expect(parseInt(value || '0')).toBeGreaterThan(0);
    });

    test('demo dashboard shows storage metric', async ({ page }) => {
      // Storage metric should show TB or GB
      const storageCard = page.locator('.metric-card').nth(1);
      await expect(storageCard).toBeVisible();

      const storageValue = storageCard.locator('.metric-value');
      const value = await storageValue.textContent();
      expect(value).toMatch(/\d+(\.\d+)?\s*(TB|GB)/i);
    });

    test('demo dashboard shows RAM utilization', async ({ page }) => {
      // RAM card should show current/max format
      const ramValueGroup = page.locator('.metric-value-group');
      await expect(ramValueGroup).toBeVisible({ timeout: 5000 });

      // Should contain GB values
      const text = await ramValueGroup.textContent();
      expect(text).toMatch(/\d+GB/i);
    });

    test('demo dashboard shows analytics charts', async ({ page }) => {
      // Should have 3 chart panels
      const chartPanels = page.locator('mc-panel, .card-content');
      const count = await chartPanels.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('demo dashboard "View All Devices" button works', async ({ page }) => {
      // Click view all devices
      const viewAllButton = page.locator('.quick-actions').getByRole('button');
      await expect(viewAllButton).toBeVisible();
      await viewAllButton.click();

      await page.waitForTimeout(500);

      // Should now show devices view
      const devicesTitle = page.locator('.page-header h1');
      await expect(devicesTitle).toContainText(/inventory|devices/i);
    });
  });

  test.describe('Demo Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);
    });

    test('demo header shows DEMO badge', async ({ page }) => {
      // Header should have DEMO indicator
      const demoBadge = page.locator('mc-status, .demo-badge').first();
      await expect(demoBadge).toBeVisible({ timeout: 5000 });
    });

    test('navigation tabs work in demo mode', async ({ page }) => {
      // Click Devices tab
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      await expect(devicesNav).toBeVisible({ timeout: 5000 });
      await devicesNav.click();
      await page.waitForTimeout(500);

      // Should show devices page
      const devicesTitle = page.locator('.page-header h1');
      await expect(devicesTitle).toContainText(/inventory|devices/i);

      // Click Topology tab
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology/i });
      await topologyNav.click();
      await page.waitForTimeout(500);

      // Should show topology view
      const topologyHeader = page.locator('.topology-header h2');
      await expect(topologyHeader).toContainText(/topology/i);

      // Click Dashboard tab to go back
      const dashboardNav = page.locator('button.nav-item').filter({ hasText: /dashboard/i });
      await dashboardNav.click();
      await page.waitForTimeout(500);

      const dashboardTitle = page.locator('.page-header h1');
      await expect(dashboardTitle).toContainText(/overview/i);
    });
  });

  test.describe('Demo Device Grid', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      await devicesNav.click();
      await page.waitForTimeout(500);
    });

    test('demo device grid shows devices', async ({ page }) => {
      // Should show device cards
      const deviceCards = page.locator('.device-card');
      const count = await deviceCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('demo device grid shows correct device count', async ({ page }) => {
      // Results bar should show count
      const countValue = page.locator('.count-value');
      await expect(countValue).toBeVisible();

      const count = await countValue.textContent();
      expect(parseInt(count || '0')).toEqual(12); // Demo data has 12 devices
    });

    test('demo device cards show device info', async ({ page }) => {
      // First device card should have name, type badge, and specs
      const firstCard = page.locator('.device-card').first();
      await expect(firstCard).toBeVisible();

      // Should have device name
      const deviceName = firstCard.locator('.device-name');
      await expect(deviceName).toBeVisible();
      const name = await deviceName.textContent();
      expect(name?.length).toBeGreaterThan(0);

      // Should have type badge
      const badge = firstCard.locator('.badge');
      await expect(badge).toBeVisible();
    });

    test('demo device filter by type works', async ({ page }) => {
      // Select "Server" from filter
      const typeSelect = page.locator('select');
      await typeSelect.selectOption('Server');
      await page.waitForTimeout(500);

      // Should show only servers
      const countValue = page.locator('.count-value');
      const count = await countValue.textContent();
      expect(parseInt(count || '0')).toBeLessThan(12); // Less than total

      // All visible cards should be servers
      const visibleBadges = page.locator('.device-card .badge');
      const badgeCount = await visibleBadges.count();
      for (let i = 0; i < badgeCount; i++) {
        const badgeText = await visibleBadges.nth(i).textContent();
        expect(badgeText?.toLowerCase()).toContain('server');
      }
    });

    test('demo device search works', async ({ page }) => {
      // Search for "Proxmox"
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('Proxmox');
      await page.waitForTimeout(500);

      // Should find the Proxmox host
      const deviceCards = page.locator('.device-card');
      const count = await deviceCards.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // First result should contain "Proxmox"
      const firstName = await page.locator('.device-name').first().textContent();
      expect(firstName?.toLowerCase()).toContain('proxmox');
    });

    test('clicking device card opens detail panel', async ({ page }) => {
      // Click first device card
      const firstCard = page.locator('.device-card').first();
      await firstCard.click();
      await page.waitForTimeout(500);

      // Detail panel should be visible
      const detailPanel = page.locator('.detail-panel');
      await expect(detailPanel).toBeVisible();

      // Should show device name in header
      const detailTitle = page.locator('#device-detail-title');
      await expect(detailTitle).toBeVisible();
    });

    test('add device button shows demo message', async ({ page }) => {
      // Handle the alert dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Sign in');
        await dialog.accept();
      });

      // Click add device button
      const addButton = page.getByRole('button', { name: /add device/i });
      await addButton.click();
    });
  });

  test.describe('Demo Device Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Navigate to devices and open first device
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      await devicesNav.click();
      await page.waitForTimeout(500);

      const firstCard = page.locator('.device-card').first();
      await firstCard.click();
      await page.waitForTimeout(500);
    });

    test('detail panel shows demo read-only notice', async ({ page }) => {
      const demoNotice = page.locator('.demo-notice');
      await expect(demoNotice).toBeVisible();
      await expect(demoNotice).toContainText(/read-only/i);
    });

    test('detail panel shows device specifications', async ({ page }) => {
      // Should have sections
      const sections = page.locator('.detail-section');
      const count = await sections.count();
      expect(count).toBeGreaterThan(0);
    });

    test('detail panel can be closed', async ({ page }) => {
      // Click close button
      const closeBtn = page.locator('.close-btn');
      await closeBtn.click();
      await page.waitForTimeout(300);

      // Panel should be hidden
      const detailPanel = page.locator('.detail-panel');
      await expect(detailPanel).not.toBeVisible();
    });

    test('pressing Escape closes detail panel', async ({ page }) => {
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Panel should be hidden
      const detailPanel = page.locator('.detail-panel');
      await expect(detailPanel).not.toBeVisible();
    });
  });

  test.describe('Demo Topology View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Navigate to topology
      const topologyNav = page.locator('button.nav-item').filter({ hasText: /topology/i });
      await topologyNav.click();
      await page.waitForTimeout(500);
    });

    test('topology view shows demo badge', async ({ page }) => {
      const demoBadge = page.locator('.demo-badge');
      await expect(demoBadge).toBeVisible();
      await expect(demoBadge).toContainText(/demo/i);
    });

    test('topology view shows device count', async ({ page }) => {
      const deviceCount = page.locator('.device-count');
      await expect(deviceCount).toBeVisible();
      await expect(deviceCount).toContainText(/\d+ devices/i);
    });

    test('topology view shows stats bar', async ({ page }) => {
      const statsBar = page.locator('.stats-bar');
      await expect(statsBar).toBeVisible();

      // Should show network, servers, IoT, and connections counts
      const stats = page.locator('.stat');
      const count = await stats.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('topology shows network graph', async ({ page }) => {
      // The TopologyGraph component should be rendered
      const topologyContainer = page.locator('.topology-container');
      await expect(topologyContainer).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Demo Banner Actions', () => {
    test('demo banner sign in button navigates to app', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Click sign in button in banner
      const signInBtn = page.locator('.demo-banner .sign-in-btn');
      await expect(signInBtn).toBeVisible();
      await signInBtn.click();

      // Should navigate to /app
      await expect(page).toHaveURL('/app');
    });
  });

  test.describe('Demo Mode Persistence', () => {
    test('demo mode persists across page navigation', async ({ page }) => {
      // Enter demo mode
      await page.goto('/');
      await page.getByRole('button', { name: /try demo/i }).click();
      await expect(page).toHaveURL('/demo');

      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      await devicesNav.click();
      await page.waitForTimeout(500);

      // Should still be in demo mode (demo banner visible)
      const demoBanner = page.locator('.demo-banner');
      await expect(demoBanner).toBeVisible();
    });

    test('demo mode can be exited via sign in', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Click sign in
      const signInBtn = page.locator('.demo-banner .sign-in-btn');
      await signInBtn.click();

      // Should be on /app (login page since not authenticated)
      await expect(page).toHaveURL('/app');

      // Should NOT see demo banner
      const demoBanner = page.locator('.demo-banner');
      await expect(demoBanner).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Demo Data Consistency', () => {
    test('demo data shows expected devices', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      await devicesNav.click();
      await page.waitForTimeout(500);

      // Should have key demo devices
      const pageContent = await page.locator('.device-grid').textContent();

      expect(pageContent).toContain('Proxmox');
      expect(pageContent).toContain('TrueNAS');
      expect(pageContent).toContain('Pi Cluster');
    });

    test('demo stats are calculated correctly', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(1000);

      // Total devices should be 12
      const firstMetric = page.locator('.metric-value').first();
      const totalDevices = await firstMetric.textContent();
      expect(parseInt(totalDevices || '0')).toEqual(12);
    });
  });
});
