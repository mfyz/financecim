const puppeteer = require('puppeteer');

async function testThemeSwitching() {
  console.log('🎨 Testing theme switching...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto('http://localhost:5601', { waitUntil: 'networkidle0' });
    
    // Check initial theme
    const initialTheme = await page.evaluate(() => {
      return {
        htmlClasses: document.documentElement.className,
        bodyClasses: document.body.className,
        localStorage: localStorage.getItem('financecim-theme')
      };
    });
    console.log('Initial state:', initialTheme);
    
    // Find and click theme toggle button
    await page.waitForSelector('button[aria-label="Toggle theme"]', { timeout: 5000 });
    await page.click('button[aria-label="Toggle theme"]');
    
    // Wait a moment for the theme to change
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check theme after click
    const afterClick = await page.evaluate(() => {
      return {
        htmlClasses: document.documentElement.className,
        bodyClasses: document.body.className,
        localStorage: localStorage.getItem('financecim-theme')
      };
    });
    console.log('After clicking toggle:', afterClick);
    
    // Click again
    await page.click('button[aria-label="Toggle theme"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check final state
    const finalState = await page.evaluate(() => {
      return {
        htmlClasses: document.documentElement.className,
        bodyClasses: document.body.className,
        localStorage: localStorage.getItem('financecim-theme')
      };
    });
    console.log('Final state:', finalState);
    
  } catch (error) {
    console.error('❌ Theme test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testThemeSwitching();