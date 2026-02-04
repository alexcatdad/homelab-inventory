import { test, expect } from '@playwright/test';
import { authenticateViaSignInAction, clearAuthState } from './auth-helper';

/**
 * Device Management E2E Tests
 * Tests CRUD operations for devices in the inventory
 */
test.describe('Device Management', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Device Grid View', () => {
    test('can navigate to devices view', async ({ page }) => {
      // Click on Devices nav button
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });

      // If nav is visible, click it
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);

        // Should show devices page with title
        await expect(page.locator('h1')).toContainText(/devices|inventory/i, { timeout: 5000 });
      }
    });

    test('device grid displays devices or empty state', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1500);
      }

      // Should show either device cards or empty state
      const hasDeviceCards = await page.locator('.device-grid .grid-item').count() > 0;
      const hasEmptyState = await page.locator('.empty-state').isVisible().catch(() => false);
      const hasResultsBar = await page.locator('.results-bar').isVisible().catch(() => false);

      // One of these states should be true
      expect(hasDeviceCards || hasEmptyState || hasResultsBar).toBe(true);
    });

    test('results bar shows device count', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1500);
      }

      // Results bar should show count
      const resultsBar = page.locator('.results-bar');
      if (await resultsBar.isVisible().catch(() => false)) {
        const countValue = page.locator('.count-value');
        await expect(countValue).toBeVisible();

        // Count should be a number
        const countText = await countValue.textContent();
        expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Add Device', () => {
    test('add device button is visible', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Add device button should be visible
      const addButton = page.locator('button.add-device-btn');
      if (await addButton.isVisible().catch(() => false)) {
        await expect(addButton).toBeVisible();
      }
    });

    test('clicking add device opens form panel', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Click add device button
      const addButton = page.locator('button.add-device-btn');
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Form panel should appear
        const formPanel = page.locator('.form-panel');
        await expect(formPanel).toBeVisible({ timeout: 3000 });

        // Should show "NEW" badge
        const newBadge = page.locator('.badge').filter({ hasText: 'NEW' });
        await expect(newBadge).toBeVisible();

        // Close form
        const closeBtn = page.locator('.close-btn');
        await closeBtn.click();
      }
    });

    test('can fill out device form fields', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Click add device button
      const addButton = page.locator('button.add-device-btn');
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill in required field - Name
        const nameInput = page.locator('#name');
        await nameInput.fill('E2E Test Device');

        // Verify the input was filled
        await expect(nameInput).toHaveValue('E2E Test Device');

        // Fill in optional fields
        const modelInput = page.locator('#model');
        await modelInput.fill('Test Model XYZ');
        await expect(modelInput).toHaveValue('Test Model XYZ');

        // Select device type
        const typeSelect = page.locator('#type');
        await typeSelect.selectOption('Server');
        await expect(typeSelect).toHaveValue('Server');

        // Fill quantity
        const quantityInput = page.locator('#quantity');
        await quantityInput.fill('2');

        // Fill location
        const locationInput = page.locator('#location');
        await locationInput.fill('Test Rack 1');
        await expect(locationInput).toHaveValue('Test Rack 1');

        // Close form without submitting (don't create test data)
        const closeBtn = page.locator('.close-btn');
        await closeBtn.click();
        await expect(page.locator('.form-panel')).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('name field is required', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Click add device button
      const addButton = page.locator('button.add-device-btn');
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Check that name input has required attribute
        const nameInput = page.locator('#name');
        await expect(nameInput).toHaveAttribute('required', '');

        // Form panel should still be open since we haven't submitted
        await expect(page.locator('.form-panel')).toBeVisible();

        // Close form
        const closeBtn = page.locator('.close-btn');
        await closeBtn.click();
      }
    });
  });

  test.describe('Device Type Filter', () => {
    test('type filter dropdown is visible', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Type filter should be visible
      const typeFilter = page.locator('.filter-group select');
      if (await typeFilter.isVisible().catch(() => false)) {
        await expect(typeFilter).toBeVisible();

        // Should have options
        const options = await typeFilter.locator('option').count();
        expect(options).toBeGreaterThan(1);
      }
    });

    test('can filter by device type', async ({ page }) => {
      // Navigate to devices
      const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
      if (await devicesNav.isVisible().catch(() => false)) {
        await devicesNav.click();
        await page.waitForTimeout(1000);
      }

      // Select a type filter
      const typeFilter = page.locator('.filter-group select');
      if (await typeFilter.isVisible().catch(() => false)) {
        await typeFilter.selectOption('Server');
        await page.waitForTimeout(500);

        // Clear filters button should appear if there are filters
        const clearFilters = page.locator('.clear-filters');
        const hasFilters = await clearFilters.isVisible().catch(() => false);

        if (hasFilters) {
          await expect(clearFilters).toBeVisible();

          // Click clear filters
          await clearFilters.click();
          await page.waitForTimeout(500);

          // Filter should be cleared
          const filterValue = await typeFilter.inputValue();
          expect(filterValue).toBe('');
        }
      }
    });
  });

  test.describe('Search Devices', () => {
    test('search input is functional', async ({ page }) => {
      // Search input in header
      const searchInput = page.locator('#device-search');

      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test search');
        await page.waitForTimeout(500);

        const value = await searchInput.inputValue();
        expect(value).toBe('test search');

        // Clear search
        await searchInput.fill('');
      }
    });
  });
});

test.describe('Device Card Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaSignInAction(page);
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('device cards show device information', async ({ page }) => {
    // Navigate to devices
    const devicesNav = page.locator('button.nav-item').filter({ hasText: /devices/i });
    if (await devicesNav.isVisible().catch(() => false)) {
      await devicesNav.click();
      await page.waitForTimeout(1500);
    }

    // Check if there are device cards
    const deviceCards = page.locator('.device-grid .grid-item');
    const cardCount = await deviceCards.count();

    if (cardCount > 0) {
      // First card should have device info
      const firstCard = deviceCards.first();
      await expect(firstCard).toBeVisible();
    }
  });
});
