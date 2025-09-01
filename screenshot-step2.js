const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    console.log('Navigating to import step 2...');
    await page.goto('http://localhost:5601/import/step2', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: './import-step2-screenshot.png', fullPage: true });
    console.log('Screenshot saved to ./import-step2-screenshot.png');
    
    // Check if step indicators are clickable (should be links)
    const stepIndicators = await page.$$('a[href*="/import/step"]');
    console.log('Number of clickable step indicators (links):', stepIndicators.length);
    
    // Check for step indicator content
    const stepElements = await page.$$('[class*="step"], .step, nav a, .breadcrumb a');
    console.log('Step-related elements found:', stepElements.length);
    
    // Check for Next button
    const buttons = await page.$$('button');
    console.log('Number of buttons found:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await page.evaluate(el => el.textContent, buttons[i]);
      console.log(`Button ${i + 1} text: "${buttonText.trim()}"`);
    }
    
    // Check page title/heading
    const headings = await page.$$('h1, h2, h3');
    for (let i = 0; i < headings.length; i++) {
      const headingText = await page.evaluate(el => el.textContent, headings[i]);
      console.log(`Heading: "${headingText.trim()}"`);
    }
    
    // Check if there are any navigation links
    const navLinks = await page.$$('a');
    console.log('Total links on page:', navLinks.length);
    
    // Check for specific import step links
    for (let i = 0; i < navLinks.length; i++) {
      const href = await page.evaluate(el => el.getAttribute('href'), navLinks[i]);
      const text = await page.evaluate(el => el.textContent, navLinks[i]);
      if (href && href.includes('/import/step')) {
        console.log(`Import step link found: "${text.trim()}" -> ${href}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();