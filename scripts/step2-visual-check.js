const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function step2VisualCheck() {
  console.log('🔍 Starting step2 visual verification...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Set viewport for desktop
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📱 Navigating to http://localhost:5601');
    await page.goto('http://localhost:5601', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set up test data in sessionStorage to enable step2 page
    console.log('📊 Setting up test CSV data...');
    await page.evaluate(() => {
      const testData = [
        ['Date', 'Description', 'Amount', 'Category', 'Balance', 'Reference', 'Type'],
        ['2024-01-20', 'WALMART SUPERCENTER #1234 - This is a very long description that should demonstrate the column stretching behavior and show how the table handles long content without excessive wrapping', '-125.43', 'FOOD_GROCERY', '2345.67', 'TXN001', 'PURCHASE'],
        ['2024-01-19', 'SHELL GAS STATION #5678', '-45.00', 'GAS_STATION', '2470.67', 'TXN002', 'PURCHASE'],
        ['2024-01-19', 'STARBUCKS STORE #9012', '-6.75', 'RESTAURANT', '2515.67', 'TXN003', 'PURCHASE'],
        ['2024-01-18', 'TARGET STORE #3456 - Another long description to test column width behavior and see if the dynamic width calculation is working properly', '-89.23', 'SHOPPING_GENERAL', '2522.42', 'TXN004', 'PURCHASE'],
        ['2024-01-18', 'NETFLIX.COM MONTHLY SUBSCRIPTION SERVICE', '-15.99', 'ENTERTAINMENT', '2611.65', 'TXN005', 'SUBSCRIPTION'],
        ['2024-01-17', 'PAYCHECK DEPOSIT FROM COMPANY XYZ CORP', '2500.00', 'INCOME', '2127.64', 'TXN006', 'DEPOSIT']
      ];

      sessionStorage.setItem('csvData', JSON.stringify(testData));
    });

    console.log('🔀 Navigating to step2 page...');
    await page.goto('http://localhost:5601/import/step2', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Wait for page to fully render and load data
    await page.waitForSelector('table', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, '..', 'test_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'step2-table-full.png'),
      fullPage: true
    });
    console.log('📸 Full page screenshot saved');

    // Take screenshot focused on the table area
    const tableElement = await page.$('table');
    if (tableElement) {
      await tableElement.screenshot({
        path: path.join(screenshotsDir, 'step2-table-focused.png')
      });
      console.log('📸 Table-focused screenshot saved');
    }

    // Analyze table structure and column widths
    const tableAnalysis = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return { error: 'Table not found' };

      const headers = Array.from(table.querySelectorAll('thead tr:first-child th')).map((th, index) => ({
        index,
        text: th.textContent.trim(),
        width: th.style.width,
        computedWidth: getComputedStyle(th).width,
        className: th.className
      }));

      const tableStyle = {
        tableLayout: table.style.tableLayout,
        width: table.style.width,
        minWidth: table.style.minWidth,
        computedTableLayout: getComputedStyle(table).tableLayout,
        computedWidth: getComputedStyle(table).width
      };

      // Check first data row cells for content and width
      const firstDataRow = table.querySelector('tbody tr');
      const cells = firstDataRow ? Array.from(firstDataRow.querySelectorAll('td')).map((td, index) => ({
        index,
        text: td.textContent.trim().substring(0, 50) + '...',
        textLength: td.textContent.trim().length,
        width: td.style.width,
        computedWidth: getComputedStyle(td).width,
        className: td.className
      })) : [];

      return {
        tableStyle,
        headers,
        firstRowCells: cells,
        totalColumns: headers.length
      };
    });

    console.log('📊 Table Analysis:');
    console.log('  Table Style:', tableAnalysis.tableStyle);
    console.log('  Headers:', tableAnalysis.headers);
    console.log('  First Row Cells:', tableAnalysis.firstRowCells);

    // Check if the table shows long content properly
    const longContentAnalysis = await page.evaluate(() => {
      const descriptionCells = Array.from(document.querySelectorAll('tbody td')).filter(td =>
        td.textContent.includes('very long description') ||
        td.textContent.includes('Another long description')
      );

      return descriptionCells.map(cell => ({
        text: cell.textContent.trim(),
        textLength: cell.textContent.trim().length,
        width: cell.style.width,
        computedWidth: getComputedStyle(cell).width,
        offsetWidth: cell.offsetWidth,
        scrollWidth: cell.scrollWidth,
        isOverflowing: cell.scrollWidth > cell.offsetWidth,
        lineHeight: getComputedStyle(cell).lineHeight,
        height: getComputedStyle(cell).height,
        offsetHeight: cell.offsetHeight
      }));
    });

    console.log('📝 Long Content Analysis:', longContentAnalysis);

    // Switch to dark mode and take another screenshot
    const themeButton = await page.$('button[aria-label="Toggle theme"]');
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.screenshot({
        path: path.join(screenshotsDir, 'step2-table-dark.png'),
        fullPage: true
      });
      console.log('📸 Dark mode screenshot saved');
    }

    console.log('✅ Step2 visual verification complete!');
    console.log('📁 Screenshots saved in:', screenshotsDir);

    return {
      tableAnalysis,
      longContentAnalysis,
      screenshotDir: screenshotsDir
    };

  } catch (error) {
    console.error('❌ Step2 visual check failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  step2VisualCheck().catch(console.error);
}

module.exports = step2VisualCheck;