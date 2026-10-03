// Unlighthouse prüft jede gebaute Seite mit Lighthouse (Mobilansicht).
// Aufruf: npm run lighthouse (vorher npm run build und lokaler Server auf Port 4399, siehe README).
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Alle Seiten aus dist/ einsammeln, damit nichts vom Crawler übersehen wird.
function seiten(dir = 'dist', basis = '/') {
  const out = [];
  if (existsSync(join(dir, 'index.html'))) out.push(basis);
  for (const name of readdirSync(dir)) {
    if (['pagefind', '_astro', 'bilder', 'fonts'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...seiten(p, `${basis}${name}/`));
  }
  return out;
}

export default {
  site: 'http://localhost:4399',
  outputPath: '.unlighthouse',
  urls: seiten(),
  puppeteerOptions: {
    executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  },
  scanner: { device: 'mobile', samples: 1, sitemap: false, robotsTxt: false, crawler: false },
  ci: { reporter: 'jsonExpanded', buildStatic: false },
};
