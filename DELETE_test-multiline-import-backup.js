const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('1. Navigating to import page...');
    await page.goto('http://localhost:5601/import', { waitUntil: 'networkidle0' });

    // Take initial screenshot
    await page.screenshot({
      path: 'test_screenshots/01-import-page-initial.png',
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: 01-import-page-initial.png');

    console.log('\n2. Uploading test CSV file...');
    const filePath = path.resolve(__dirname, 'test_multiline.csv');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }

    // Find the file input and upload
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('File input not found on page');
    }

    await fileInput.uploadFile(filePath);
    console.log('   ✓ File uploaded');

    // Wait for processing - look for the preview or next button
    console.log('\n3. Waiting for file processing...');
    await page.waitForFunction(
      () => {
        // Check if we can see some indication of processed data
        const nextButton = document.querySelector('button');
        const hasData = document.body.textContent.includes('rows') ||
                       document.body.textContent.includes('columns') ||
                       document.body.textContent.includes('Next');
        return hasData;
      },
      { timeout: 10000 }
    );

    // Wait a bit more for UI to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot after upload
    await page.screenshot({
      path: 'test_screenshots/02-after-upload.png',
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: 02-after-upload.png');

    // Extract information from the page
    const pageInfo = await page.evaluate(() => {
      const text = document.body.textContent;

      // Try to find row and column counts
      const rowMatch = text.match(/(\d+)\s*rows?/i);
      const colMatch = text.match(/(\d+)\s*columns?/i);

      return {
        bodyText: text.substring(0, 500), // First 500 chars for debugging
        hasRowInfo: !!rowMatch,
        hasColInfo: !!colMatch,
        rowCount: rowMatch ? parseInt(rowMatch[1]) : null,
        colCount: colMatch ? parseInt(colMatch[1]) : null,
        hasNextButton: text.includes('Next'),
        hasError: text.toLowerCase().includes('error')
      };
    });

    console.log('\n4. Page information after upload:');
    console.log('   - Row count detected:', pageInfo.rowCount || 'Not found');
    console.log('   - Column count detected:', pageInfo.colCount || 'Not found');
    console.log('   - Has "Next" button:', pageInfo.hasNextButton);
    console.log('   - Has errors:', pageInfo.hasError);

    // Look for Next button and click it
    console.log('\n5. Looking for "Next: Map Columns" button...');

    // Try multiple strategies to find and click the "Next: Map Columns" button
    const buttonClicked = await page.evaluate(() => {
      // Strategy 1: Look for button with specific text
      const buttons = Array.from(document.querySelectorAll('button'));
      let nextButton = buttons.find(btn => {
        const text = btn.textContent || btn.innerText;
        return text.includes('Next') && text.includes('Map');
      });

      // Strategy 2: Look for any link/button with "step2" in href
      if (!nextButton) {
        const links = Array.from(document.querySelectorAll('a[href*="step2"], button[onclick*="step2"]'));
        if (links.length > 0) {
          nextButton = links[0];
        }
      }

      // Strategy 3: Look for the visible button at the bottom (usually last visible button)
      if (!nextButton) {
        const visibleButtons = buttons.filter(btn =>
          btn.offsetParent !== null &&
          btn.getBoundingClientRect().width > 0
        );
        // Get the last visible button (usually the "Next" button)
        nextButton = visibleButtons[visibleButtons.length - 1];
      }

      if (nextButton) {
        nextButton.click();
        return true;
      }
      return false;
    });

    if (buttonClicked) {
      console.log('   ✓ Next button found and clicked');

      // Wait for navigation to step 2
      await page.waitForFunction(
        () => window.location.pathname.includes('step2') ||
              document.body.textContent.includes('Map') ||
              document.body.textContent.includes('column'),
        { timeout: 5000 }
      );

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take screenshot of step 2
      await page.screenshot({
        path: 'test_screenshots/03-column-mapping.png',
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 03-column-mapping.png');

      // Extract column mapping information
      const mappingInfo = await page.evaluate(() => {
        const text = document.body.textContent;

        // Count dropdown selects (column mappings)
        const selects = document.querySelectorAll('select');

        // Look for detected columns
        const columnNames = Array.from(document.querySelectorAll('label, th, td'))
          .map(el => el.textContent.trim())
          .filter(text => text && text.length < 50);

        return {
          selectCount: selects.length,
          hasMapping: text.includes('map') || text.includes('Map'),
          sampleColumns: columnNames.slice(0, 15),
          hasPreview: text.includes('preview') || text.includes('Preview')
        };
      });

      console.log('\n6. Column mapping page information:');
      console.log('   - Number of select dropdowns:', mappingInfo.selectCount);
      console.log('   - Has mapping interface:', mappingInfo.hasMapping);
      console.log('   - Has preview:', mappingInfo.hasPreview);
      console.log('   - Sample text on page:', mappingInfo.sampleColumns.slice(0, 5).join(', '));

    } else {
      console.log('   ✗ Next button not found');
      console.log('   Page text sample:', pageInfo.bodyText);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\nScreenshots saved to test_screenshots/ folder:');
    console.log('   - 01-import-page-initial.png');
    console.log('   - 02-after-upload.png');
    console.log('   - 03-column-mapping.png');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);

    // Take error screenshot
    try {
      const page = (await browser.pages())[0];
      await page.screenshot({
        path: 'test_screenshots/error-screenshot.png',
        fullPage: true
      });
      console.log('Error screenshot saved: test_screenshots/error-screenshot.png');
    } catch (e) {
      console.error('Could not take error screenshot');
    }

    throw error;
  } finally {
    await browser.close();
  }
})();