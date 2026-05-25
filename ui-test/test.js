import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser to test visually...');
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null, 
    args: ['--start-maximized'] 
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  console.log('Loaded application...');
  await new Promise(r => setTimeout(r, 3000));

  // Try clicking some links in the sidebar
  try {
      const links = await page.$$('a');
      for (const link of links) {
          const text = await page.evaluate(el => el.innerText, link);
          if (text && text.toLowerCase().includes('timetable')) {
              console.log('Navigating to Timetable...');
              await link.click();
              await new Promise(r => setTimeout(r, 4000));
              break;
          }
      }
      
      const links2 = await page.$$('a');
      for (const link of links2) {
          const text = await page.evaluate(el => el.innerText, link);
          if (text && text.toLowerCase().includes('history')) {
              console.log('Navigating to History...');
              await link.click();
              await new Promise(r => setTimeout(r, 4000));
              break;
          }
      }
      
  } catch(e) {
      console.log('Error interacting with page:', e);
  }

  console.log('Test complete. Keeping browser open for a bit...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('Closing browser...');
  await browser.close();
})();
