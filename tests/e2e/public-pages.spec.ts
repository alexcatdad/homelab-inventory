import { test, expect } from '@playwright/test';

test.describe('Public Pages (no auth required)', () => {
  test('landing page loads with hero section', async ({ page }) => {
    await page.goto('/');

    // Check hero headline - exact text from component
    await expect(page.locator('h1')).toContainText("actually enjoy using", {
      timeout: 10000,
    });

    // Check CTA button exists (text is "Get Started — Free")
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();

    // Check feature cards are visible (6 features with class .feature-card)
    await expect(page.locator('.feature-card')).toHaveCount(6, { timeout: 5000 });
  });

  test('landing page has working navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Click supporters link
    await page.click('text=Supporters');
    await expect(page).toHaveURL('/supporters');

    // Go back to landing
    await page.goto('/');

    // Click privacy link in footer
    await page.click('text=Privacy');
    await expect(page).toHaveURL('/privacy');
  });

  test('supporters page loads', async ({ page }) => {
    await page.goto('/supporters');

    // Check page title
    await expect(page.locator('h1')).toContainText(/supporter/i, { timeout: 10000 });
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.locator('h1')).toContainText(/privacy/i, { timeout: 10000 });
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.locator('h1')).toContainText(/terms/i, { timeout: 10000 });
  });

  test('clicking "Get Started" navigates to app', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /get started/i }).click();

    // Should navigate to /app
    await expect(page).toHaveURL('/app');
  });

  test('clicking "Try Demo" navigates to demo mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Check Try Demo button exists and click it
    const tryDemoButton = page.getByRole('button', { name: /try demo/i });
    await expect(tryDemoButton).toBeVisible();
    await tryDemoButton.click();

    // Should navigate to /demo
    await expect(page).toHaveURL('/demo');

    // Should show demo banner
    const demoBanner = page.locator('.demo-banner');
    await expect(demoBanner).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Navigation between public pages', () => {
  test('can navigate between all public pages', async ({ page }) => {
    // Landing page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Supporters page
    await page.goto('/supporters');
    await expect(page.locator('h1')).toContainText(/supporter/i, { timeout: 10000 });

    // Privacy page
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText(/privacy/i, { timeout: 10000 });

    // Terms page
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText(/terms/i, { timeout: 10000 });

    // Back to landing
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/actually enjoy/i, { timeout: 10000 });
  });
});
