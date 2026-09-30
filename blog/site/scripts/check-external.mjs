// Prüft die gebaute Seite (dist/): Darf keine Anfrage an fremde Server stellen.
// Lädt jede HTML-Seite in Chromium und meldet alle Requests, die nicht an den lokalen Server gehen.
//   npm run build && npm run check            (Screenshots: SHOTS=ordner npm run check)
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

async function htmlFiles(dir, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = join(base, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(join(dir, e.name), rel));
    else if (e.name.endsWith('.html')) out.push('/' + rel.replace(/index\.html$/, ''));
  }
  return out;
}

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(DIST, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end(await readFile(join(DIST, '404.html')));
  }
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const pages = await htmlFiles(DIST);
const external = [];
const shots = process.env.SHOTS;
if (shots) await mkdir(shots, { recursive: true });

for (const path of pages) {
  for (const [label, viewport] of [['mobil', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
    const page = await browser.newPage({ viewport });
    page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) external.push(`${path} → ${r.url()}`); });
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) external.push(`${path} (${label}): Seite ist breiter als der Bildschirm`);
    if (shots) await page.screenshot({ path: join(shots, `${path.replace(/\//g, '_') || '_'}${label}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
server.close();

console.log(`${pages.length} Seiten geprüft (mobil + desktop).`);
if (external.length) {
  console.log('PROBLEME:\n' + [...new Set(external)].join('\n'));
  process.exit(1);
}
console.log('OK: keine Anfragen an fremde Server, kein horizontales Scrollen.');
