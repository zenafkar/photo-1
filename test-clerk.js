import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  
  // Capture unhandled page errors
  page.on('pageerror', err => console.error('BROWSER_PAGE_ERROR:', err.toString()));
  
  // Capture failed network requests
  page.on('requestfailed', request => {
    console.error(`BROWSER_NETWORK_ERROR: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('Page loaded. Checking for "Masuk" or "Mulai Gratis" button...');
  
  try {
    // Attempt to click the Masuk button in the navbar or Mulai Gratis
    const buttonSelector = 'button:has-text("Masuk"), button:has-text("Mulai Gratis"), button:has-text("Coba Gratis")';
    
    // In puppeteer we can evaluate and click
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const btn of btns) {
        if (btn.innerText.includes('Masuk') || btn.innerText.includes('Mulai Gratis') || btn.innerText.includes('Coba Gratis')) {
          console.log('Found button:', btn.innerText);
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log('Clicked the button. Waiting for 5 seconds for modal to appear...');
      await new Promise(r => setTimeout(r, 5000));
      
      const hasClerkModal = await page.evaluate(() => {
        return document.querySelector('#clerk-components') !== null || document.querySelector('.cl-modalContent') !== null;
      });
      
      console.log('Clerk Modal present in DOM:', hasClerkModal);
    } else {
      console.log('Could not find auth button!');
    }
  } catch (error) {
    console.error('Error during interaction:', error);
  }

  await browser.close();
})();
