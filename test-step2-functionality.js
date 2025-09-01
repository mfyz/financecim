const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    console.log('🔍 Testing Import Step 2 Functionality...\n');
    
    // Navigate to step 2
    await page.goto('http://localhost:5601/import/step2', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Successfully loaded import/step2');
    
    // Test 1: Check if step progress indicators are clickable links
    console.log('\n📋 Test 1: Step Progress Indicators');
    const stepLinks = await page.$$('a[href*="/import/step"]');
    console.log(`   Found ${stepLinks.length} clickable step indicators`);
    
    for (let i = 0; i < stepLinks.length; i++) {
      const href = await page.evaluate(el => el.getAttribute('href'), stepLinks[i]);
      const text = await page.evaluate(el => el.textContent.trim(), stepLinks[i]);
      console.log(`   ✓ Step link: "${text}" -> ${href}`);
    }
    
    // Test if we can click on step 3
    const step3Link = await page.$('a[href="/import/step3"]');
    if (step3Link) {
      console.log('   ✓ Step 3 link is clickable (link element found)');
    } else {
      console.log('   ❌ Step 3 link not found or not clickable');
    }
    
    // Test 2: Test the "Next: Preview Data" button navigation
    console.log('\n🔄 Test 2: Next Button Navigation');
    
    // Find the Next button by looking for links to step 3
    const nextButton = await page.$('a[href="/import/step3"]');
    
    if (nextButton) {
      console.log('   ✓ "Next: Preview Data" button found as a link');
      
      // Click the next button
      console.log('   🖱️ Clicking "Next: Preview Data" button...');
      await nextButton.click();
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
      
      const currentUrl = page.url();
      console.log(`   📍 Current URL after click: ${currentUrl}`);
      
      if (currentUrl.includes('/import/step3')) {
        console.log('   ✅ Successfully navigated to step 3 (no alert shown)');
        
        // Take screenshot of step 3
        await page.screenshot({ path: './import-step3-after-navigation.png', fullPage: true });
        console.log('   📸 Screenshot of step 3 saved');
        
      } else {
        console.log('   ❌ Failed to navigate to step 3');
      }
      
    } else {
      console.log('   ❌ "Next: Preview Data" button not found as a link');
      
      // Check if it's a regular button that might trigger an alert
      const buttons = await page.$$('button');
      for (let i = 0; i < buttons.length; i++) {
        const buttonText = await page.evaluate(el => el.textContent, buttons[i]);
        if (buttonText.includes('Next') || buttonText.includes('Preview')) {
          console.log(`   ⚠️ Found a regular button: "${buttonText.trim()}" - this might show an alert`);
        }
      }
    }
    
    // Test 3: Overall page layout verification
    console.log('\n🎨 Test 3: Page Layout Verification');
    
    // Go back to step 2 for layout checks
    await page.goto('http://localhost:5601/import/step2', { waitUntil: 'networkidle0' });
    
    const heading = await page.$('h1, h2');
    if (heading) {
      const headingText = await page.evaluate(el => el.textContent, heading);
      console.log(`   ✓ Main heading: "${headingText.trim()}"`);
    }
    
    const quickTemplatesText = await page.evaluate(() => {
      return document.body.textContent.includes('Quick Templates');
    });
    if (quickTemplatesText) {
      console.log('   ✓ Quick Templates section found');
    }
    
    const columnMappingText = await page.evaluate(() => {
      return document.body.textContent.includes('Column Mapping');
    });
    if (columnMappingText) {
      console.log('   ✓ Column Mapping section found');
    }
    
    const previewSectionText = await page.evaluate(() => {
      return document.body.textContent.includes('Preview Mapped Data');
    });
    if (previewSectionText) {
      console.log('   ✓ Preview Mapped Data section found');
    }
    
    // Check dropdowns
    const dropdowns = await page.$$('select');
    console.log(`   ✓ Found ${dropdowns.length} dropdown selectors for column mapping`);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  await browser.close();
})();