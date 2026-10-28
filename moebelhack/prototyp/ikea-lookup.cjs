const { chromium } = require('playwright');
const fs = require('node:fs');
const queries = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'de-DE' });
  const page = await ctx.newPage();
  const out = {};
  for (const q of queries) {
    try {
      await page.goto('https://www.ikea.com/de/de/search/?q=' + encodeURIComponent(q), { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      const items = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('[class*="plp-fragment-wrapper"], [class*="plp-product"], [data-testid*="plp-product"]')];
        const seen = new Set(); const res = [];
        for (const c of cards) {
          const a = c.querySelector('a[href*="/p/"]'); if (!a) continue;
          const href = a.getAttribute('href'); if (seen.has(href)) continue; seen.add(href);
          const txt = c.innerText.replace(/\s+/g, ' ').trim();
          const m = href.match(/-(\d{8})\/?$/);
          res.push({ href, itemNo: m ? m[1] : null, text: txt.slice(0, 220) });
          if (res.length >= 4) break;
        }
        return res;
      });
      out[q] = items;
      console.log('##', q); for (const it of items) console.log('  ', it.itemNo, '|', it.text, '|', it.href);
    } catch (e) { console.log('## ' + q + ' FAILED: ' + e.message.slice(0, 120)); }
  }
  // Produktseite KALLAX: Preis, Artikelnummer, Maße
  try {
    await page.goto('https://www.ikea.com/de/de/p/kallax-regal-weiss-80275887/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const t = document.body.innerText;
      const price = (t.match(/(\d+[,.]?\d*)\s*€/) || [])[1];
      const art = (t.match(/Artikelnummer\s*([\d.]+)/) || [])[1];
      const dims = (t.match(/Breite:\s*[\d,]+\s*cm[\s\S]{0,80}?Höhe:\s*[\d,]+\s*cm/) || [])[0];
      const avail = (t.match(/(Verfügbar[^\n]{0,80}|Nicht verfügbar[^\n]{0,80}|Online[^\n]{0,60})/) || [])[0];
      return { title: document.title, price, art, dims: dims && dims.replace(/\s+/g, ' '), avail };
    });
    console.log('## Produktseite KALLAX', JSON.stringify(info));
    out.kallax_page = info;
  } catch (e) { console.log('## Produktseite FAILED ' + e.message.slice(0, 120)); }
  fs.writeFileSync('lookup.json', JSON.stringify(out, null, 2));
  await browser.close();
})();
