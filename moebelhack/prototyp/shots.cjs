const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
  await page.goto('file://' + path.resolve('anleitung.html'), { waitUntil: 'networkidle' });
  await page.pdf({ path: 'anleitung.pdf', width: '1123px', height: '794px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const secs = page.locator('section.page'); const n = await secs.count();
  for (let i = 0; i < n; i++) await secs.nth(i).screenshot({ path: `anleitung_${i+1}.png` });
  console.log('manual pages:', n);
  const p2 = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  await p2.goto('file://' + path.resolve('startseite.html'), { waitUntil: 'networkidle' });
  await p2.screenshot({ path: 'startseite.png', fullPage: true });
  console.log('startseite ok');
  await browser.close();
})();
