const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function transactionsVisualCheck() {
  console.log('🔍 Starting transactions page visual verification...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set viewport for desktop
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📱 Navigating to http://localhost:5601/transactions');
    await page.goto('http://localhost:5601/transactions', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for page to fully render
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, '..', 'test_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // 1. Initial transactions page screenshot (light mode)
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'transactions-light-full.png'),
      fullPage: true 
    });
    console.log('📸 1. Transactions page light mode screenshot saved');
    
    // 2. Switch to dark mode
    const themeButton = await page.$('button[aria-label="Toggle theme"]');
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-dark-full.png'),
        fullPage: true 
      });
      console.log('📸 2. Transactions page dark mode screenshot saved');
    }
    
    // Switch back to light mode for testing
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Test search functionality
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('coffee');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-search-active.png'),
        fullPage: true 
      });
      console.log('📸 3. Search functionality screenshot saved');
      
      // Clear search
      await searchInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Test filter dropdowns
    const filterButtons = await page.$$('button[role="combobox"]');
    if (filterButtons.length > 0) {
      // Try to click first filter dropdown
      await filterButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-filter-dropdown.png'),
        fullPage: true 
      });
      console.log('📸 4. Filter dropdown screenshot saved');
      
      // Close dropdown by clicking elsewhere
      await page.click('body');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 5. Test bulk selection if checkboxes exist
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length > 2) {
      // Click a few checkboxes
      await checkboxes[1].click();
      await checkboxes[2].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-bulk-selected.png'),
        fullPage: true 
      });
      console.log('📸 5. Bulk selection screenshot saved');
      
      // Uncheck them
      await checkboxes[1].click();
      await checkboxes[2].click();
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log('ℹ️  5. Not enough checkboxes for bulk selection test (found: ' + checkboxes.length + ')');
    }
    
    // 6. Test column sorting by clicking headers
    const sortableHeaders = await page.$$('th button, th[role="columnheader"]');
    if (sortableHeaders.length > 0) {
      await sortableHeaders[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-sorted.png'),
        fullPage: true 
      });
      console.log('📸 6. Column sorting screenshot saved');
    }
    
    // 7. Mobile responsive view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'transactions-mobile.png'),
      fullPage: true 
    });
    console.log('📸 7. Mobile responsive screenshot saved');
    
    // 8. Mobile dark mode
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'transactions-mobile-dark.png'),
        fullPage: true 
      });
      console.log('📸 8. Mobile dark mode screenshot saved');
    }
    
    // Analyze page elements
    const analysis = await page.evaluate(() => {
      const filterBar = document.querySelector('[class*="filter"], .search-container, .filter-container');
      const table = document.querySelector('table, [role="table"]');
      const pagination = document.querySelector('[aria-label*="pagination"], .pagination');
      const bulkActions = document.querySelector('[class*="bulk"], .bulk-actions');
      const stats = document.querySelector('[class*="stat"], .summary, .statistics');
      
      return {
        pageTitle: document.title,
        h1Text: document.querySelector('h1')?.textContent || 'No H1',
        hasFilterBar: !!filterBar,
        hasTable: !!table,
        tableRowCount: document.querySelectorAll('tr').length,
        hasPagination: !!pagination,
        hasBulkActions: !!bulkActions,
        hasStats: !!stats,
        searchInputExists: !!document.querySelector('input[placeholder*="Search"]'),
        checkboxCount: document.querySelectorAll('input[type="checkbox"]').length,
        dropdownCount: document.querySelectorAll('button[role="combobox"]').length,
        darkModeActive: document.documentElement.classList.contains('dark')
      };
    });
    
    console.log('📊 Transactions Page Analysis:', analysis);
    
    console.log('✅ Transactions visual verification complete!');
    console.log('📁 Screenshots saved in:', screenshotsDir);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Transactions visual check failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  transactionsVisualCheck().catch(console.error);
}

module.exports = transactionsVisualCheck;