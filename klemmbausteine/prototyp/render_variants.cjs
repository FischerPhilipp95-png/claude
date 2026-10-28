const { chromium } = require('playwright'); const path = require('node:path'); const http = require('node:http'); const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const srv = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.setHeader('Content-Type', f.endsWith('.json') ? 'application/json' : f.endsWith('.js') ? 'text/javascript' : 'text/html'); res.end(b); }); });
srv.listen(8766, async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const shots = [['foto_final', 'model=model_foto.json&step=99&hilite=0&lx=72&ly=45&lz=56&hw=200'], ['foto_front', 'model=model_foto.json&step=99&hilite=0&lx=72&ly=45&lz=56&hw=200&az=0.12']];
  for (const [name, qs] of shots) { await page.goto('http://localhost:8766/haus/scene.html?' + qs); await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 }); await page.screenshot({ path: path.join(__dirname, name + '.png') }); console.log('ok', name); }
  await browser.close(); srv.close();
});
