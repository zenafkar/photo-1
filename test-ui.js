import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console Error: ${msg.text()}`);
    consoleLogs.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`Page Error: ${err.toString()}`));
  page.on('requestfailed', request => {
    // Ignore clerk blocking since we know about it
    if (!request.url().includes('clerk')) {
      errors.push(`Network Error: ${request.url()} - ${request.failure()?.errorText}`);
    }
  });

  console.log('Navigating to https://zenstudio.my.id...');
  await page.goto('https://zenstudio.my.id', { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Set viewport to simulate desktop
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Scrolling down to trigger ScrollReveal animations...');
  // Scroll step by step
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('Scrolling back up...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  console.log('Checking if any Error occurred during rendering...');
  
  if (errors.length > 0) {
    console.log('\n--- CRITICAL ERRORS DETECTED ---');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\n--- NO CRITICAL ERRORS DETECTED! Animations and components rendered smoothly ---');
  }

  await browser.close();
})();
