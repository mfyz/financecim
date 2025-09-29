import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Transaction Import Flow', () => {
  test('should complete full import flow from upload to completion', async ({ page }) => {
    // Step 1: Navigate to import page
    await page.goto('/import');

    // Verify we're on the upload step
    await expect(page.locator('h1')).toContainText('Import Transactions');
    await expect(page.locator('text=Step 1')).toBeVisible();

    // Select a source
    const sourceSelect = page.locator('select[name="source"]');
    await sourceSelect.selectOption({ index: 1 }); // Select first available source

    // Create and upload a test CSV file
    const csvContent = `Date,Description,Amount,Category
2024-01-15,WALMART GROCERY,-45.50,Groceries
2024-01-16,SALARY DEPOSIT,2500.00,Income
2024-01-17,NETFLIX SUBSCRIPTION,-15.99,Entertainment
2024-01-18,GAS STATION,-40.00,Transportation
2024-01-19,RESTAURANT DINING,-75.25,Dining`;

    // Upload file using file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-transactions.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Verify file was accepted
    await expect(page.locator('text=test-transactions.csv')).toBeVisible();
    await expect(page.locator('text=5 rows')).toBeVisible();

    // Click Next to go to column mapping
    await page.click('button:has-text("Next")');

    // Step 2: Column Mapping
    await expect(page.locator('text=Step 2')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Map Columns');

    // Verify auto-detected mappings
    await expect(page.locator('text=Date column')).toBeVisible();
    await expect(page.locator('text=Description column')).toBeVisible();
    await expect(page.locator('text=Amount column')).toBeVisible();

    // The mapping should be auto-detected correctly
    // Click Next to preview
    await page.click('button:has-text("Next")');

    // Step 3: Preview
    await expect(page.locator('text=Step 3')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Preview');

    // Verify transactions are displayed in preview table
    await expect(page.locator('text=WALMART GROCERY')).toBeVisible();
    await expect(page.locator('text=SALARY DEPOSIT')).toBeVisible();
    await expect(page.locator('text=NETFLIX SUBSCRIPTION')).toBeVisible();

    // Verify statistics are shown
    await expect(page.locator('text=Total Transactions: 5')).toBeVisible();

    // Click Import to complete
    await page.click('button:has-text("Import")');

    // Step 4: Completion
    await expect(page.locator('h1')).toContainText(/Import Complete|Success/i);

    // Verify import statistics
    await expect(page.locator('text=/imported.*5/i')).toBeVisible();

    // Click to view transactions
    await page.click('button:has-text("View Transactions")');

    // Verify navigation to transactions page
    await page.waitForURL('/transactions');
    await expect(page.locator('h1')).toContainText('Transactions');

    // Verify imported transactions are visible
    await expect(page.locator('text=WALMART GROCERY')).toBeVisible();
    await expect(page.locator('text=SALARY DEPOSIT')).toBeVisible();
  });

  test('should handle duplicate detection during import', async ({ page }) => {
    // First import
    await page.goto('/import');

    const csvContent = `Date,Description,Amount
2024-01-15,DUPLICATE TEST,-100.00`;

    const fileInput = page.locator('input[type="file"]');

    // First import
    await fileInput.setInputFiles({
      name: 'first-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    const sourceSelect = page.locator('select[name="source"]');
    await sourceSelect.selectOption({ index: 1 });

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")'); // Skip mapping
    await page.click('button:has-text("Import")');

    // Wait for completion
    await expect(page.locator('text=/imported.*1/i')).toBeVisible();

    // Try to import same file again
    await page.goto('/import');
    await fileInput.setInputFiles({
      name: 'second-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await sourceSelect.selectOption({ index: 1 });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Import")');

    // Should show skipped transactions
    await expect(page.locator('text=/skipped.*1/i')).toBeVisible();
  });

  test('should validate column mapping', async ({ page }) => {
    await page.goto('/import');

    // Upload file with ambiguous headers
    const csvContent = `Col1,Col2,Col3,Col4
2024-01-15,Test Transaction,-50.00,Category1`;

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'ambiguous.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    const sourceSelect = page.locator('select[name="source"]');
    await sourceSelect.selectOption({ index: 1 });

    await page.click('button:has-text("Next")');

    // On mapping page, should show mapping interface
    await expect(page.locator('text=Map Columns')).toBeVisible();

    // Manually map columns
    const dateSelect = page.locator('select[name="date-mapping"]');
    const descSelect = page.locator('select[name="description-mapping"]');
    const amountSelect = page.locator('select[name="amount-mapping"]');

    await dateSelect.selectOption('0'); // Col1
    await descSelect.selectOption('1'); // Col2
    await amountSelect.selectOption('2'); // Col3

    // Continue to preview
    await page.click('button:has-text("Next")');

    // Verify data is mapped correctly in preview
    await expect(page.locator('text=Test Transaction')).toBeVisible();
    await expect(page.locator('text=-50.00')).toBeVisible();
  });
});