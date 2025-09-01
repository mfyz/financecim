import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should render homepage successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Financecim/);

    // Check if main content heading is visible
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Dashboard');

    // Check if description text is visible
    const description = page.locator('text=Overview of your financial activity');
    await expect(description).toBeVisible();

    // Verify the page structure
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();
    await expect(mainElement).toHaveClass(/max-w-7xl/);
  });

  test('should have correct meta tags', async ({ page }) => {
    await page.goto('/');

    // Check meta description
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toBe('Track and categorize your transactions from multiple sources');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(heading).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });
});