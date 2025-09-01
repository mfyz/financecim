const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function visualCheck() {
  console.log('🔍 Starting visual verification...');
  
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
    
    // Wait for page to fully render
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'homepage-light.png'),
      fullPage: true 
    });
    console.log('📸 Light mode screenshot saved');
    
    // Click theme toggle to switch to dark mode
    const themeButton = await page.$('button[aria-label="Toggle theme"]');
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'homepage-dark.png'),
        fullPage: true 
      });
      console.log('📸 Dark mode screenshot saved');
    }
    
    // Check if CSS is loaded
    const styles = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const hasStyles = styleSheets.length > 0;
      const tailwindLoaded = Array.from(document.querySelectorAll('*')).some(el => 
        getComputedStyle(el).getPropertyValue('--tw-ring-offset-shadow') !== ''
      );
      
      return {
        styleSheetsCount: styleSheets.length,
        hasStyles,
        tailwindLoaded,
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className
      };
    });
    
    console.log('🎨 CSS Analysis:', styles);
    
    // Check navigation
    const navigation = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const navLinks = document.querySelectorAll('nav a');
      return {
        navExists: !!nav,
        navClasses: nav?.className || 'NOT FOUND',
        linkCount: navLinks.length,
        firstLinkText: navLinks[0]?.textContent || 'NO LINKS'
      };
    });
    
    console.log('🧭 Navigation Analysis:', navigation);
    
    // Check main content
    const content = await page.evaluate(() => {
      const main = document.querySelector('main');
      const h1 = document.querySelector('main h1');
      const cards = document.querySelectorAll('.bg-white, .dark\\:bg-gray-800');
      
      return {
        mainExists: !!main,
        mainClasses: main?.className || 'NOT FOUND',
        h1Text: h1?.textContent || 'NO H1',
        cardCount: cards.length
      };
    });
    
    console.log('📄 Content Analysis:', content);
    
    // Mobile viewport test
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'homepage-mobile.png'),
      fullPage: true 
    });
    console.log('📸 Mobile screenshot saved');
    
    console.log('✅ Visual verification complete!');
    console.log('📁 Screenshots saved in:', screenshotsDir);
    
  } catch (error) {
    console.error('❌ Visual check failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  visualCheck().catch(console.error);
}

module.exports = visualCheck;