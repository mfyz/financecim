const puppeteer = require('puppeteer');

async function testCompleteImport() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('🎯 Testing complete import with database verification...\n');

    // Get initial transaction count
    const Database = require('better-sqlite3');
    const db = new Database('./data.db');
    const initialCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
    console.log(`📊 Initial transaction count: ${initialCount}`);
    db.close();

    // Complete flow through step 3
    await page.goto('http://localhost:5601/import');
    await page.waitForSelector('input[type="file"]');

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('/Users/fatih/Development/financecim/test-transactions.csv');

    // Wait and navigate through steps
    await page.waitForFunction(() => {
      const statusElement = document.querySelector('[class*="text-green"]');
      return statusElement && statusElement.textContent.includes('Ready');
    }, { timeout: 10000 });

    const step2Button = await page.$('a[href="/import/step2"]:not([class*="cursor-not-allowed"])');
    await step2Button.click();
    await page.waitForNavigation();

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.select('select:first-of-type', '1'); // Select Chase Bank

    const step3Button = await page.$('a[href="/import/step3"]');
    await step3Button.click();
    await page.waitForNavigation();

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Reached step 3 - testing import functionality');

    // Take detailed screenshot of step 3
    await page.screenshot({ path: 'final-step3-before-import.png', fullPage: true });
    console.log('📸 Screenshot: final-step3-before-import.png');

    // Check amount formatting in the preview
    const amountFormatting = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td'));
      const amountCells = cells.filter(cell => {
        const text = cell.textContent.trim();
        return text.includes('$') && (text.includes('-') || text.match(/\d/));
      });

      return {
        totalCells: cells.length,
        amountCellsFound: amountCells.length,
        sampleAmounts: amountCells.slice(0, 5).map(cell => cell.textContent.trim()),
        hasNaN: cells.some(cell => cell.textContent.includes('NaN'))
      };
    });

    console.log('💰 Amount formatting check:');
    console.log(`  - Total table cells: ${amountFormatting.totalCells}`);
    console.log(`  - Amount cells with $: ${amountFormatting.amountCellsFound}`);
    console.log(`  - Sample amounts: [${amountFormatting.sampleAmounts.join(', ')}]`);
    console.log(`  - Has NaN issues: ${amountFormatting.hasNaN}`);

    // Try to click import button
    const importButton = await page.$('button');
    if (importButton) {
      const buttonText = await page.evaluate(btn => btn.textContent.trim(), importButton);
      console.log(`🔘 Found button: "${buttonText}"`);

      if (buttonText.toLowerCase().includes('import')) {
        console.log('⏳ Clicking import button...');
        await importButton.click();

        // Wait for modal
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for modal
        const hasModal = await page.evaluate(() => {
          return !!(document.querySelector('.fixed') || document.querySelector('[role="dialog"]'));
        });

        console.log(`🔲 Modal appeared: ${hasModal}`);

        if (hasModal) {
          await page.screenshot({ path: 'final-import-modal.png', fullPage: true });
          console.log('📸 Screenshot: final-import-modal.png');

          // Look for confirm button and click it
          const modalButtons = await page.$$('.fixed button, [role="dialog"] button');
          if (modalButtons.length > 0) {
            // Usually the confirm button is red or blue (not gray/cancel)
            for (const button of modalButtons) {
              const buttonClass = await page.evaluate(btn => btn.className, button);
              const buttonText = await page.evaluate(btn => btn.textContent.trim(), button);

              console.log(`  Button: "${buttonText}" (classes: ${buttonClass})`);

              if (buttonClass.includes('bg-red') || buttonClass.includes('bg-blue') || buttonText.toLowerCase().includes('confirm') || buttonText.toLowerCase().includes('import')) {
                console.log(`✅ Clicking confirm button: "${buttonText}"`);
                await button.click();

                // Wait for import to complete
                await new Promise(resolve => setTimeout(resolve, 5000));

                await page.screenshot({ path: 'final-import-success.png', fullPage: true });
                console.log('📸 Screenshot: final-import-success.png');

                break;
              }
            }
          }
        }

        // Check final transaction count
        await new Promise(resolve => setTimeout(resolve, 2000));
        const db2 = new Database('./data.db');
        const finalCount = db2.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
        console.log(`📊 Final transaction count: ${finalCount}`);

        if (finalCount > initialCount) {
          console.log(`🎉 SUCCESS: ${finalCount - initialCount} transactions imported!`);

          // Show recent imports
          const recentImports = db2.prepare('SELECT date, description, amount FROM transactions ORDER BY created_at DESC LIMIT 3').all();
          console.log('📝 Recent imports:');
          recentImports.forEach((tx, i) => {
            console.log(`  ${i+1}. ${tx.date} - ${tx.description} - $${tx.amount}`);
          });
        } else {
          console.log('⚠️  No new transactions found - import may not have completed');
        }
        db2.close();
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteImport();