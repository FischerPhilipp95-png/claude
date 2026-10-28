const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', e => console.log('pageerror', e.message));
  const base = 'file://' + path.resolve('scene.html');
  const shots = [['step1', 'step=1'], ['step2', 'step=2'], ['step3', 'step=3'], ['step4', 'step=4'], ['step5', 'step=5'], ['final', 'step=5&hilite=0&final=1']];
  for (const [name, q] of shots) {
    await page.goto(base + '?' + q); await page.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
    await page.screenshot({ path: name + '.png', clip: { x: 0, y: 0, width: 1400, height: 900 } }); console.log('ok', name);
  }
  await browser.close();
})();
