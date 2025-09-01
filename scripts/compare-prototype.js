const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function compareWithPrototype() {
  console.log('🔍 Starting prototype comparison...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set viewport for desktop
    await page.setViewport({ width: 1280, height: 720 });
    
    const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'comparison');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // 1. Screenshot our current app
    console.log('📸 Taking screenshot of our app...');
    await page.goto('http://localhost:5601', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'our-app.png'),
      fullPage: true 
    });
    
    // 2. Screenshot the prototype
    console.log('📸 Taking screenshot of prototype...');
    const prototypeFile = path.join(__dirname, '..', 'docs', 'prototype', 'index.html');
    const prototypeUrl = `file://${prototypeFile}`;
    
    await page.goto(prototypeUrl, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Alpine.js to load
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'prototype.png'),
      fullPage: true 
    });
    
    // 3. Analyze differences
    console.log('🔍 Analyzing differences...');
    
    // Check prototype styles
    const prototypeAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const main = document.querySelector('main') || document.querySelector('[x-data]');
      const cards = document.querySelectorAll('.bg-white, .dark\\:bg-gray-800');
      const themeToggle = document.querySelector('button[\\@click*="toggleDarkMode"]');
      
      return {
        navClasses: nav?.className || 'NOT FOUND',
        mainExists: !!main,
        cardCount: cards.length,
        hasThemeToggle: !!themeToggle,
        bodyClasses: document.body.className,
        hasAlpineJS: !!window.Alpine,
        hasTailwindStyles: !!Array.from(document.styleSheets).some(sheet => {
          try {
            return sheet.href && sheet.href.includes('tailwindcss');
          } catch (e) {
            return false;
          }
        })
      };
    });
    
    console.log('🎨 Prototype Analysis:', prototypeAnalysis);
    
    // Now check our app
    await page.goto('http://localhost:5601', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const ourAppAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const main = document.querySelector('main');
      const cards = document.querySelectorAll('.bg-white, .dark\\:bg-gray-800');
      const themeToggle = document.querySelector('button[aria-label="Toggle theme"]');
      
      return {
        navClasses: nav?.className || 'NOT FOUND',
        mainExists: !!main,
        cardCount: cards.length,
        hasThemeToggle: !!themeToggle,
        bodyClasses: document.body.className,
        hasNextJS: !!window.__NEXT_DATA__,
        stylesheetCount: document.styleSheets.length
      };
    });
    
    console.log('⚛️  Our App Analysis:', ourAppAnalysis);
    
    // 4. Key differences report
    console.log('\n📊 COMPARISON REPORT:');
    console.log('====================');
    console.log(`Cards: Prototype=${prototypeAnalysis.cardCount}, Our App=${ourAppAnalysis.cardCount}`);
    console.log(`Theme Toggle: Prototype=${prototypeAnalysis.hasThemeToggle}, Our App=${ourAppAnalysis.hasThemeToggle}`);
    console.log(`Main Content: Prototype=${prototypeAnalysis.mainExists}, Our App=${ourAppAnalysis.mainExists}`);
    
    if (prototypeAnalysis.cardCount !== ourAppAnalysis.cardCount) {
      console.log('⚠️  CARD COUNT MISMATCH - Check component structure');
    }
    
    if (!ourAppAnalysis.hasThemeToggle && prototypeAnalysis.hasThemeToggle) {
      console.log('⚠️  THEME TOGGLE MISSING - Check theme implementation');
    }
    
    console.log('\n📁 Screenshots saved in:', screenshotsDir);
    console.log('✅ Prototype comparison complete!');
    
  } catch (error) {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  compareWithPrototype().catch(console.error);
}

module.exports = compareWithPrototype;