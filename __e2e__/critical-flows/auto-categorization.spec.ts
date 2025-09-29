import { test, expect } from '@playwright/test';

test.describe('Auto-Categorization Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Rules page to set up categorization rules
    await page.goto('/rules');
  });

  test('should create and apply unit rules', async ({ page }) => {
    // Create a unit rule
    await page.click('button:has-text("Add Unit Rule")');

    // Fill in the rule form
    await page.fill('input[name="pattern"]', 'WALMART');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="unit_id"]', { index: 1 }); // Select first unit
    await page.fill('input[name="priority"]', '1');

    // Save the rule
    await page.click('button:has-text("Save")');

    // Verify rule appears in the list
    await expect(page.locator('text=WALMART')).toBeVisible();
    await expect(page.locator('text=Description contains')).toBeVisible();

    // Test the rule
    await page.click('button:has-text("Test Rules")');

    // Enter test transaction
    await page.fill('input[name="test-description"]', 'WALMART GROCERY STORE');
    await page.click('button:has-text("Test")');

    // Verify rule matches
    await expect(page.locator('text=/Matched.*Unit/i')).toBeVisible();
  });

  test('should create and apply category rules', async ({ page }) => {
    // Switch to Category Rules tab
    await page.click('button:has-text("Category Rules")');

    // Create a category rule
    await page.click('button:has-text("Add Category Rule")');

    // Fill in the rule form
    await page.fill('input[name="pattern"]', 'NETFLIX');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="category_id"]', { label: 'Entertainment' });
    await page.fill('input[name="priority"]', '1');

    // Save the rule
    await page.click('button:has-text("Save")');

    // Verify rule appears in the list
    await expect(page.locator('text=NETFLIX')).toBeVisible();
    await expect(page.locator('text=Description contains')).toBeVisible();

    // Test the rule
    await page.click('button:has-text("Test Rules")');

    // Enter test transaction
    await page.fill('input[name="test-description"]', 'NETFLIX SUBSCRIPTION');
    await page.click('button:has-text("Test")');

    // Verify rule matches
    await expect(page.locator('text=/Matched.*Entertainment/i')).toBeVisible();
  });

  test('should apply rules during import', async ({ page }) => {
    // First set up rules
    await page.goto('/rules');

    // Create Unit Rule
    await page.click('button:has-text("Add Unit Rule")');
    await page.fill('input[name="pattern"]', 'SALARY');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="unit_id"]', { index: 1 });
    await page.fill('input[name="priority"]', '1');
    await page.click('button:has-text("Save")');

    // Create Category Rule
    await page.click('button:has-text("Category Rules")');
    await page.click('button:has-text("Add Category Rule")');
    await page.fill('input[name="pattern"]', 'SALARY');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="category_id"]', { label: 'Income' });
    await page.fill('input[name="priority"]', '1');
    await page.click('button:has-text("Save")');

    // Now import transactions
    await page.goto('/import');

    const csvContent = `Date,Description,Amount
2024-01-15,SALARY PAYMENT,3000.00
2024-01-16,GROCERY STORE,-50.00`;

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'auto-categorize.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    const sourceSelect = page.locator('select[name="source"]');
    await sourceSelect.selectOption({ index: 1 });

    // Enable auto-categorization
    await page.check('input[name="apply-rules"]');

    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")'); // Skip mapping

    // In preview, verify categorization suggestions
    await expect(page.locator('text=Suggested categorizations')).toBeVisible();

    // Complete import
    await page.click('button:has-text("Import")');

    // Navigate to transactions to verify categorization
    await page.click('button:has-text("View Transactions")');

    // Verify the salary transaction is categorized
    const salaryRow = page.locator('tr', { hasText: 'SALARY PAYMENT' });
    await expect(salaryRow.locator('text=/Income/i')).toBeVisible();
  });

  test('should handle priority ordering of rules', async ({ page }) => {
    // Create multiple rules with different priorities
    await page.click('button:has-text("Add Unit Rule")');

    // High priority rule
    await page.fill('input[name="pattern"]', 'STORE');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="unit_id"]', { index: 1 });
    await page.fill('input[name="priority"]', '1');
    await page.click('button:has-text("Save")');

    // Lower priority rule (more specific)
    await page.click('button:has-text("Add Unit Rule")');
    await page.fill('input[name="pattern"]', 'WALMART STORE');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'contains');
    await page.selectOption('select[name="unit_id"]', { index: 2 });
    await page.fill('input[name="priority"]', '2');
    await page.click('button:has-text("Save")');

    // Test with description that matches both
    await page.click('button:has-text("Test Rules")');
    await page.fill('input[name="test-description"]', 'WALMART STORE PURCHASE');
    await page.click('button:has-text("Test")');

    // Should match the higher priority rule (priority 1)
    const resultText = await page.locator('.test-result').textContent();
    expect(resultText).toContain('Priority: 1');
  });

  test('should toggle rule active status', async ({ page }) => {
    // Create a rule
    await page.click('button:has-text("Add Unit Rule")');
    await page.fill('input[name="pattern"]', 'DISABLED_RULE');
    await page.selectOption('select[name="rule_type"]', 'description');
    await page.selectOption('select[name="match_type"]', 'exact');
    await page.selectOption('select[name="unit_id"]', { index: 1 });
    await page.fill('input[name="priority"]', '1');
    await page.click('button:has-text("Save")');

    // Find the rule row
    const ruleRow = page.locator('tr', { hasText: 'DISABLED_RULE' });

    // Toggle to disable
    await ruleRow.locator('button:has-text("Active")').click();
    await expect(ruleRow.locator('text=Inactive')).toBeVisible();

    // Test the disabled rule
    await page.click('button:has-text("Test Rules")');
    await page.fill('input[name="test-description"]', 'DISABLED_RULE');
    await page.click('button:has-text("Test")');

    // Should not match since it's disabled
    await expect(page.locator('text=No rules matched')).toBeVisible();

    // Re-enable the rule
    await ruleRow.locator('button:has-text("Inactive")').click();
    await expect(ruleRow.locator('text=Active')).toBeVisible();

    // Test again
    await page.click('button:has-text("Test Rules")');
    await page.fill('input[name="test-description"]', 'DISABLED_RULE');
    await page.click('button:has-text("Test")');

    // Should match now
    await expect(page.locator('text=/Matched/i')).toBeVisible();
  });
});