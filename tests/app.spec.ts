import { test, expect } from '@playwright/test';

test.describe('Home Lab Inventory', () => {
  test('API health check', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
  });

  test('API returns devices', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/devices');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.devices).toBeDefined();
    expect(Array.isArray(data.devices)).toBeTruthy();
    console.log(`Found ${data.devices.length} devices`);
  });

  test('API returns stats', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.total_devices).toBeDefined();
    console.log('Stats:', data);
  });

  test('app loads and shows dashboard', async ({ page }) => {
    // Log all console messages
    page.on('console', msg => console.log('Browser:', msg.type(), msg.text()));

    // Log all network requests
    page.on('request', req => console.log('Request:', req.method(), req.url()));
    page.on('response', res => console.log('Response:', res.status(), res.url()));
    page.on('requestfailed', req => console.log('Failed:', req.url(), req.failure()?.errorText));

    await page.goto('/');

    // Wait for loading to finish - should see "SYSTEM OVERVIEW" text
    await expect(page.locator('h1')).toContainText('SYSTEM OVERVIEW', { timeout: 10000 });

    // Check metric cards are visible
    await expect(page.locator('.metric-card')).toHaveCount(4);

    // Check device count is shown
    const totalDevices = page.locator('.metric-value').first();
    await expect(totalDevices).toBeVisible();
  });

  test('can navigate to devices view', async ({ page }) => {
    page.on('console', msg => console.log('Browser:', msg.type(), msg.text()));

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('SYSTEM OVERVIEW', { timeout: 10000 });

    // Click devices nav
    await page.click('button:has-text("DEVICES")');

    // Should show devices page
    await expect(page.locator('h1')).toContainText('DEVICE INVENTORY');

    // Should show device cards
    await expect(page.locator('.device-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('can open device detail', async ({ page }) => {
    page.on('console', msg => console.log('Browser:', msg.type(), msg.text()));

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('SYSTEM OVERVIEW', { timeout: 10000 });

    // Go to devices
    await page.click('button:has-text("DEVICES")');
    await expect(page.locator('.device-card').first()).toBeVisible({ timeout: 5000 });

    // Click first device card
    await page.locator('.device-card').first().click();

    // Detail panel should open
    await expect(page.locator('.detail-panel')).toBeVisible();

    // Should show device name
    await expect(page.locator('.detail-panel h2')).toBeVisible();
  });
});
