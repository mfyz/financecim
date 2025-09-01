const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function checkImportOverview() {
  console.log('🔍 Starting import overview page verification...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set viewport for desktop
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📱 Navigating to http://localhost:5601/import/overview');
    await page.goto('http://localhost:5601/import/overview', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to fully render
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Extra wait for import page
    
    // Take screenshot
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'import-overview-light.png'),
      fullPage: true 
    });
    console.log('📸 Import overview light mode screenshot saved');
    
    // Click theme toggle to switch to dark mode
    const themeButton = await page.$('button[aria-label="Toggle theme"]');
    if (themeButton) {
      await themeButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'import-overview-dark.png'),
        fullPage: true 
      });
      console.log('📸 Import overview dark mode screenshot saved');
    }
    
    // Check page content specifically for import overview
    const pageAnalysis = await page.evaluate(() => {
      const main = document.querySelector('main');
      const h1 = document.querySelector('main h1');
      const cards = document.querySelectorAll('[class*="bg-white"], [class*="bg-gray-"], [class*="border"]');
      const buttons = document.querySelectorAll('button');
      const links = document.querySelectorAll('a');
      
      // Look for import-specific content
      const importCards = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
          el.textContent.includes('Main Import') ||
          el.textContent.includes('Column Mapping') ||
          el.textContent.includes('Data Preview') ||
          el.textContent.includes('Import History')
        )
      );
      
      return {
        mainExists: !!main,
        h1Text: h1?.textContent || 'NO H1',
        cardCount: cards.length,
        buttonCount: buttons.length,
        linkCount: links.length,
        importCardsFound: importCards.length,
        importCardTexts: importCards.map(el => el.textContent.trim()).slice(0, 10)
      };
    });
    
    console.log('📄 Import Overview Page Analysis:', pageAnalysis);
    
    // Check if this is actually the import overview page
    const isCorrectPage = await page.evaluate(() => {
      return window.location.pathname === '/import/overview' ||
             document.title.toLowerCase().includes('import') ||
             document.body.textContent.includes('Import Overview') ||
             document.body.textContent.includes('Main Import');
    });
    
    console.log('✅ Is correct import overview page:', isCorrectPage);
    
    // Mobile viewport test
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'import-overview-mobile.png'),
      fullPage: true 
    });
    console.log('📸 Import overview mobile screenshot saved');
    
    console.log('✅ Import overview verification complete!');
    console.log('📁 Screenshots saved in:', screenshotsDir);
    
    return {
      success: true,
      isCorrectPage,
      pageAnalysis
    };
    
  } catch (error) {
    console.error('❌ Import overview check failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  checkImportOverview().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  }).catch(console.error);
}

module.exports = checkImportOverview;