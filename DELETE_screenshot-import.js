const puppeteer = require('puppeteer');

async function takeScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to import page
    await page.goto('http://localhost:5601/import', { waitUntil: 'networkidle0' });

    // Wait for main content to load
    await page.waitForSelector('main', { timeout: 10000 });

    // Take light mode screenshot
    await page.screenshot({
      path: 'import-light-mode.png',
      fullPage: true
    });

    console.log('✓ Light mode screenshot taken');

    // Try to find and click theme toggle for dark mode
    try {
      // Look for theme toggle button (usually has moon/sun icon)
      const themeButton = await page.$('[data-testid="theme-toggle"], button[aria-label*="theme"], button[title*="theme"]');
      if (themeButton) {
        await themeButton.click();

        // Wait for theme transition
        await new Promise(resolve => setTimeout(resolve, 500));

        // Take dark mode screenshot
        await page.screenshot({
          path: 'import-dark-mode.png',
          fullPage: true
        });

        console.log('✓ Dark mode screenshot taken');
      } else {
        console.log('⚠ Theme toggle not found, skipping dark mode');
      }
    } catch (error) {
      console.log('⚠ Could not toggle theme:', error.message);
    }

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();