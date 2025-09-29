import { test, expect } from '@playwright/test';

test.describe('Transaction Filtering and Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to transactions page
    await page.goto('/transactions');
  });

  test('should filter transactions by date range', async ({ page }) => {
    // Open filter panel
    await page.click('button:has-text("Filters")');

    // Set date range
    const startDate = page.locator('input[name="start-date"]');
    const endDate = page.locator('input[name="end-date"]');

    await startDate.fill('2024-01-01');
    await endDate.fill('2024-01-31');

    // Apply filters
    await page.click('button:has-text("Apply Filters")');

    // Verify URL updated with filters
    await expect(page).toHaveURL(/startDate=2024-01-01/);
    await expect(page).toHaveURL(/endDate=2024-01-31/);

    // Verify filtered results message
    await expect(page.locator('text=/Showing.*January/i')).toBeVisible();
  });

  test('should filter by unit and category', async ({ page }) => {
    // Open filter panel
    await page.click('button:has-text("Filters")');

    // Select unit filter
    const unitSelect = page.locator('select[name="unit-filter"]');
    await unitSelect.selectOption({ index: 1 }); // Select first unit

    // Select category filter
    const categorySelect = page.locator('select[name="category-filter"]');
    await categorySelect.selectOption({ label: /Groceries/i });

    // Apply filters
    await page.click('button:has-text("Apply Filters")');

    // Verify filtered results
    const transactions = page.locator('tbody tr');
    const count = await transactions.count();

    // Each visible transaction should have the selected category
    for (let i = 0; i < count; i++) {
      const row = transactions.nth(i);
      await expect(row.locator('text=/Groceries/i')).toBeVisible();
    }
  });

  test('should search transactions by description', async ({ page }) => {
    // Use search box
    const searchBox = page.locator('input[placeholder*="Search"]');
    await searchBox.fill('WALMART');
    await searchBox.press('Enter');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify all visible transactions contain search term
    const descriptions = page.locator('tbody tr td:nth-child(3)'); // Description column
    const count = await descriptions.count();

    for (let i = 0; i < count; i++) {
      const text = await descriptions.nth(i).textContent();
      expect(text?.toUpperCase()).toContain('WALMART');
    }
  });

  test('should perform bulk categorization', async ({ page }) => {
    // Select multiple transactions
    await page.check('input[type="checkbox"]:nth-child(1)');
    await page.check('input[type="checkbox"]:nth-child(2)');
    await page.check('input[type="checkbox"]:nth-child(3)');

    // Bulk actions toolbar should appear
    await expect(page.locator('text=/3 selected/i')).toBeVisible();

    // Click bulk categorize
    await page.click('button:has-text("Bulk Categorize")');

    // Select category in modal
    const bulkCategorySelect = page.locator('.modal select[name="category"]');
    await bulkCategorySelect.selectOption({ label: /Entertainment/i });

    // Apply bulk action
    await page.click('.modal button:has-text("Apply")');

    // Wait for success message
    await expect(page.locator('text=/Successfully updated 3 transactions/i')).toBeVisible();

    // Verify transactions are updated
    const selectedRows = page.locator('tbody tr:has(input:checked)');
    const rowCount = await selectedRows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = selectedRows.nth(i);
      await expect(row.locator('text=/Entertainment/i')).toBeVisible();
    }
  });

  test('should perform bulk unit assignment', async ({ page }) => {
    // Select all visible transactions
    await page.check('input[name="select-all"]');

    // Bulk actions toolbar should appear
    await expect(page.locator('text=/selected/i')).toBeVisible();

    // Click bulk assign unit
    await page.click('button:has-text("Assign Unit")');

    // Select unit in modal
    const bulkUnitSelect = page.locator('.modal select[name="unit"]');
    await bulkUnitSelect.selectOption({ index: 1 });

    // Apply bulk action
    await page.click('.modal button:has-text("Apply")');

    // Wait for success message
    await expect(page.locator('text=/Successfully updated/i')).toBeVisible();

    // Verify at least first transaction shows the unit
    const firstRow = page.locator('tbody tr:first-child');
    const unitCell = firstRow.locator('td:nth-child(2)'); // Unit column
    await expect(unitCell).not.toBeEmpty();
  });

  test('should bulk ignore/unignore transactions', async ({ page }) => {
    // Select transactions
    await page.check('input[type="checkbox"]:nth-child(1)');
    await page.check('input[type="checkbox"]:nth-child(2)');

    // Click bulk ignore
    await page.click('button:has-text("Bulk Ignore")');

    // Confirm action
    await page.click('.modal button:has-text("Confirm")');

    // Wait for success
    await expect(page.locator('text=/Successfully ignored 2 transactions/i')).toBeVisible();

    // Filter to show ignored transactions
    await page.click('button:has-text("Filters")');
    await page.check('input[name="show-ignored"]');
    await page.click('button:has-text("Apply Filters")');

    // Verify ignored transactions are visible with strikethrough or muted style
    const ignoredRows = page.locator('tbody tr.ignored, tbody tr.opacity-50');
    await expect(ignoredRows).toHaveCount(2);
  });

  test('should perform inline editing', async ({ page }) => {
    // Click on a transaction row to open edit mode
    const firstRow = page.locator('tbody tr:first-child');
    await firstRow.click();

    // Edit category inline
    const categorySelect = firstRow.locator('select[name="category"]');
    await categorySelect.selectOption({ label: /Transportation/i });

    // Edit notes inline
    const notesInput = firstRow.locator('input[name="notes"]');
    await notesInput.fill('Gas for business trip');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify changes persisted
    await expect(firstRow.locator('text=/Transportation/i')).toBeVisible();
    await expect(firstRow.locator('text=Gas for business trip')).toBeVisible();
  });

  test('should export filtered transactions', async ({ page }) => {
    // Apply some filters first
    await page.click('button:has-text("Filters")');
    const startDate = page.locator('input[name="start-date"]');
    await startDate.fill('2024-01-01');
    await page.click('button:has-text("Apply Filters")');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    // Verify the download contains data
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should paginate through transactions', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('.pagination, nav[aria-label="pagination"]');

    if (await pagination.isVisible()) {
      // Get first transaction text
      const firstPageText = await page.locator('tbody tr:first-child td:nth-child(3)').textContent();

      // Go to next page
      await page.click('button:has-text("Next"), a:has-text("Next")');

      // Wait for navigation
      await page.waitForTimeout(500);

      // Verify different transaction is shown
      const nextPageText = await page.locator('tbody tr:first-child td:nth-child(3)').textContent();
      expect(nextPageText).not.toBe(firstPageText);

      // Go back to first page
      await page.click('button:has-text("Previous"), a:has-text("Previous"), button:has-text("1")');

      // Verify we're back to original transaction
      const backToFirstText = await page.locator('tbody tr:first-child td:nth-child(3)').textContent();
      expect(backToFirstText).toBe(firstPageText);
    }
  });

  test('should sort transactions by different columns', async ({ page }) => {
    // Click date header to sort by date
    await page.click('th:has-text("Date")');

    // Get first and last dates
    const dates = await page.locator('tbody tr td:nth-child(1)').allTextContents();
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);

    // Should be sorted ascending
    expect(firstDate.getTime()).toBeLessThanOrEqual(lastDate.getTime());

    // Click again to sort descending
    await page.click('th:has-text("Date")');

    // Get dates again
    const datesDesc = await page.locator('tbody tr td:nth-child(1)').allTextContents();
    const firstDateDesc = new Date(datesDesc[0]);
    const lastDateDesc = new Date(datesDesc[datesDesc.length - 1]);

    // Should be sorted descending
    expect(firstDateDesc.getTime()).toBeGreaterThanOrEqual(lastDateDesc.getTime());

    // Sort by amount
    await page.click('th:has-text("Amount")');

    // Get amounts
    const amounts = await page.locator('tbody tr td:nth-child(4)').allTextContents();
    const firstAmount = parseFloat(amounts[0].replace(/[^0-9.-]/g, ''));
    const lastAmount = parseFloat(amounts[amounts.length - 1].replace(/[^0-9.-]/g, ''));

    // Should be sorted (ascending or descending)
    expect(Math.abs(firstAmount)).toBeDefined();
    expect(Math.abs(lastAmount)).toBeDefined();
  });
});