const { chromium } = require('playwright');
const path = require('node:path');
const http = require('node:http'); const fs = require('node:fs');
// kleiner Server, damit fetch('model.json') funktioniert
const root = path.resolve(__dirname, '..');
const srv = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('Content-Type', f.endsWith('.json') ? 'application/json' : f.endsWith('.js') ? 'text/javascript' : 'text/html'); res.end(b); }); });
srv.listen(8765, async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', e => console.log('pageerror', e.message));
  const shots = [['haus_s03','step=3'],['haus_s06','step=6'],['haus_s09','step=9'],['haus_s12','step=12'],['haus_s14','step=14'],['haus_final','step=99&hilite=0'],['haus_final_links','step=99&hilite=0&az=-0.7'],['haus_first','step=99&hilite=0&hw=70&lx=64&ly=135&lz=48']];
  for (const [name, qs] of shots) {
    await page.goto('http://localhost:8765/haus/scene.html?' + qs); await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
    const n = await page.evaluate(() => window.__shown);
    await page.screenshot({ path: path.join(__dirname, name + '.png') }); console.log('ok', name, 'Teile sichtbar:', n);
  }
  await browser.close(); srv.close();
});
