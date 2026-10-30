// Rendert die 3D-Schnittzeichnungen: node scripts/querschnitt/render.mjs [bauart]
// Ergebnis: public/bilder/querschnitt/<bauart>.webp (Grundbild), <bauart>-<teil>.webp (Hervorhebung je Bauteil, transparent),
// src/querschnitte/<bauart>.json (Bildmaße, Anker, Label-Positionen, enger Ausschnitt).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const hier = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(hier, '..', '..');
const bauarten = process.argv[2] ? [process.argv[2]] : fs.readdirSync(path.join(hier, 'modelle')).map((f) => f.replace(/\.mjs$/, ''));
const W = 2000, H = 1500;
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let datei = url.pathname.startsWith('/three/') ? path.join(site, 'node_modules', 'three', url.pathname.slice(7)) : path.join(hier, url.pathname);
  if (!fs.existsSync(datei)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(datei)] || 'application/octet-stream' });
  fs.createReadStream(datei).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => { console.error('Seite:', e.message); });
page.on('console', (m) => { if (m.type() === 'error') console.error('Konsole:', m.text()); });

const schreibe = async (dataUrl, ziel, breite, qualitaet) => {
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  await sharp(png).resize({ width: breite }).webp({ quality: qualitaet, alphaQuality: 90, effort: 5 }).toFile(ziel);
};

for (const bauart of bauarten) {
  await page.goto(`http://127.0.0.1:${port}/render.html?bauart=${bauart}&w=${W}&h=${H}`);
  await page.waitForFunction(() => window.fertig === true, null, { timeout: 120000 });
  const ordner = path.join(site, 'public', 'bilder', 'querschnitt');
  fs.mkdirSync(ordner, { recursive: true });
  const t0 = Date.now();
  const basis = await page.evaluate(() => window.rendern(null));
  await schreibe(basis, path.join(ordner, `${bauart}.webp`), W, 82);
  await schreibe(basis, path.join(ordner, `${bauart}-1000.webp`), 1000, 80);
  const { anker, umriss, labels } = await page.evaluate(() => window.anker());
  const teile = [];
  for (const id of Object.keys(anker)) {
    const bild = await page.evaluate((t) => window.rendern(t), id);
    await schreibe(bild, path.join(ordner, `${bauart}-${id}.webp`), 1400, 78);
    teile.push(id);
  }
  // Label-Positionen (Bildpixel): Spalten links, rechts, oben; enger Ausschnitt für schmale Bildschirme
  const pos = {}, eng = {};
  const [ux0, uy0, ux1, uy1] = umriss;
  const ex0 = Math.max(0, ux0 - 90), ey0 = Math.max(0, Math.min(uy0 - 40, 50)), ex1 = Math.min(W, ux1 + 90), ey1 = Math.min(H, uy1 + 30);
  const spalte = (liste, x, xEng) => liste.forEach((k, i) => {
    const y = Math.round(ey0 + 70 + (i * (ey1 - ey0 - 140)) / Math.max(1, liste.length - 1));
    pos[k] = [x, y]; eng[k] = [xEng, y];
  });
  spalte(labels.links, 150, ex0 + 60);
  spalte(labels.rechts, W - 150, ex1 - 60);
  labels.oben.forEach((k, i) => { const x = Math.round(W * (0.36 + 0.22 * i)); pos[k] = [x, 60]; eng[k] = [Math.round(ex0 + (ex1 - ex0) * (0.32 + 0.3 * i)), ey0 + 40]; });
  const fehlt = teile.filter((t) => !pos[t]);
  if (fehlt.length) throw new Error(`Labels fehlen für: ${fehlt.join(', ')}`);
  const json = { bild: `/bilder/querschnitt/${bauart}`, breite: W, hoehe: H, viewBox: [0, 0, W, H], viewBoxEng: [ex0, ey0, ex1 - ex0, ey1 - ey0], anker, labels: pos, labelsEng: eng, teile };
  fs.mkdirSync(path.join(site, 'src', 'querschnitte'), { recursive: true });
  fs.writeFileSync(path.join(site, 'src', 'querschnitte', `${bauart}.json`), JSON.stringify(json, null, 1) + '\n');
  console.log(`${bauart}: ${teile.length} Bauteile, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
server.close();
