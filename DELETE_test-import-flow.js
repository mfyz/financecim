const puppeteer = require('puppeteer');

async function testImportFlow() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('🧪 Starting complete import flow test...\n');

    // Step 1: Upload file
    console.log('📁 Step 1: File Upload');
    await page.goto('http://localhost:5601/import');
    await page.waitForSelector('input[type="file"]');

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('/Users/fatih/Development/financecim/test-transactions.csv');
    console.log('  ✅ File uploaded');

    // Wait for processing
    await page.waitForFunction(() => {
      const statusElement = document.querySelector('[class*="text-green"]');
      return statusElement && statusElement.textContent.includes('Ready');
    }, { timeout: 10000 });
    console.log('  ✅ File processed');

    // Take screenshot of step 1
    await page.screenshot({ path: 'test-step1-complete.png', fullPage: true });
    console.log('  📸 Screenshot: test-step1-complete.png');

    // Navigate to step 2
    const step2Button = await page.$('a[href="/import/step2"]:not([class*="cursor-not-allowed"])');
    await step2Button.click();
    await page.waitForNavigation();
    console.log('  ✅ Navigated to step 2\n');

    // Step 2: Column mapping
    console.log('🗂️  Step 2: Column Mapping');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check auto-detection
    const mappings = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.map((select, i) => ({
        index: i,
        value: select.value,
        options: Array.from(select.options).map(opt => opt.text)
      }));
    });

    console.log('  📋 Column mappings detected:');
    mappings.forEach((mapping, i) => {
      if (mapping.value) {
        console.log(`    ${i}: ${mapping.value}`);
      }
    });

    // Select source
    const sourceSelect = await page.$('select:first-of-type');
    if (sourceSelect) {
      await page.select('select:first-of-type', '1');
      console.log('  ✅ Selected source: Chase Bank');
    }

    // Take screenshot of step 2
    await page.screenshot({ path: 'test-step2-complete.png', fullPage: true });
    console.log('  📸 Screenshot: test-step2-complete.png');

    // Navigate to step 3
    await new Promise(resolve => setTimeout(resolve, 1000));
    const step3Button = await page.$('a[href="/import/step3"]');
    if (step3Button) {
      await step3Button.click();
      await page.waitForNavigation();
      console.log('  ✅ Navigated to step 3\n');
    } else {
      console.log('  ❌ Could not find step 3 button');
      return;
    }

    // Step 3: Preview and import
    console.log('📊 Step 3: Preview & Import');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Analyze content
    const preview = await page.evaluate(() => {
      const body = document.body.textContent;
      const tables = document.querySelectorAll('table').length;
      const buttons = Array.from(document.querySelectorAll('button'));
      const importBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('import'));

      return {
        hasTransactionData: body.includes('Coffee') || body.includes('Salary') || body.includes('$'),
        tableCount: tables,
        hasImportButton: !!importBtn,
        importButtonText: importBtn ? importBtn.textContent.trim() : null,
        containsDollarSigns: body.includes('$'),
        contentLength: body.length
      };
    });

    console.log('  📈 Preview analysis:');
    console.log(`    - Content length: ${preview.contentLength} chars`);
    console.log(`    - Has transaction data: ${preview.hasTransactionData}`);
    console.log(`    - Table count: ${preview.tableCount}`);
    console.log(`    - Has import button: ${preview.hasImportButton}`);
    console.log(`    - Dollar signs present: ${preview.containsDollarSigns}`);

    if (preview.importButtonText) {
      console.log(`    - Import button text: "${preview.importButtonText}"`);
    }

    // Take screenshot of step 3
    await page.screenshot({ path: 'test-step3-complete.png', fullPage: true });
    console.log('  📸 Screenshot: test-step3-complete.png');

    // Test import button if present
    if (preview.hasImportButton) {
      console.log('  🚀 Testing import button...');

      const importButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent.toLowerCase().includes('import')
        );
      });

      if (importButton._remoteObject.objectId) {
        await importButton.click();
        console.log('  ✅ Import button clicked');

        // Wait for modal
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take modal screenshot
        await page.screenshot({ path: 'test-modal-confirmation.png', fullPage: true });
        console.log('  📸 Screenshot: test-modal-confirmation.png');

        // Check modal
        const modalInfo = await page.evaluate(() => {
          const modal = document.querySelector('.fixed') ||
                       document.querySelector('[role="dialog"]') ||
                       document.querySelector('.modal');

          if (modal) {
            const buttons = Array.from(modal.querySelectorAll('button'));
            return {
              hasModal: true,
              modalText: modal.textContent.trim().substring(0, 100),
              buttonCount: buttons.length,
              buttonTexts: buttons.map(btn => btn.textContent.trim())
            };
          }
          return { hasModal: false };
        });

        console.log('  🔲 Modal analysis:');
        console.log(`    - Has modal: ${modalInfo.hasModal}`);
        if (modalInfo.hasModal) {
          console.log(`    - Modal text preview: "${modalInfo.modalText}..."`);
          console.log(`    - Button count: ${modalInfo.buttonCount}`);
          console.log(`    - Button texts: [${modalInfo.buttonTexts.join(', ')}]`);
        }
      }
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testImportFlow();