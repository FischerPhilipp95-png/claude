// Titelbilder (1200x675, WebP) für alle Artikel, deren `bild` unter /bilder/titel/ liegt.
// Gerendert als HTML im lokalen Chromium: Inter-Schrift, Lucide-Icon und Themenfarbe.
//   npm run titelbilder          (fehlende Bilder)
//   npm run titelbilder -- --alle (alle neu)
import { readFile, readdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const alle = process.argv.includes('--alle');

// Themen aus src/themen.ts lesen (einfaches Parsen, damit kein TypeScript-Build nötig ist).
const themenTs = await readFile(ROOT + 'src/themen.ts', 'utf8');
const THEMEN = Object.fromEntries([...themenTs.matchAll(/^\s+(\S+): \{ slug: '([^']+)', titel: '([^']+)', icon: '([^']+)', farbe: '([^']+)'/gm)]
  .map(([, key, slug, titel, icon, farbe]) => [key, { slug, titel, icon, farbe }]));

const font = async (w) => (await readFile(ROOT + `public/fonts/inter-${w}.woff2`)).toString('base64');
const [f500, f800] = await Promise.all([font(500), font(800)]);
const avatar = (await readFile(ROOT + 'public/bilder/autor.webp')).toString('base64');
const icon = async (name, size, stroke = 1.6) => (await readFile(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8'))
  .replace(/<!--.*?-->/s, '').replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`)
  .replace(/stroke-width="2"/, `stroke-width="${stroke}"`);

function kopf(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  for (const line of (m ? m[1] : '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

async function html(titel, t, artIcon) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;font-weight:500;src:url(data:font/woff2;base64,${f500}) format('woff2')}
  @font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${f800}) format('woff2')}
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:675px;font-family:Inter;color:#fff;overflow:hidden;
    background:radial-gradient(circle at 88% 30%, ${t.farbe}55 0, transparent 45%), radial-gradient(circle at 0% 100%, #ffffff10 0, transparent 40%), #111}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:40px 40px}
  .bigicon{position:absolute;right:70px;top:120px;width:360px;height:360px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle, ${t.farbe}40, ${t.farbe}10 70%);border:2px solid ${t.farbe}66;color:${t.farbe}}
  .chip{position:absolute;left:72px;top:64px;display:flex;gap:10px;align-items:center;font-weight:800;font-size:26px;letter-spacing:.08em;text-transform:uppercase;color:${t.farbe}}
  h1{position:absolute;left:72px;top:150px;width:660px;font-weight:800;font-size:66px;line-height:1.08;letter-spacing:-.02em}
  .bar{position:absolute;left:0;top:0;bottom:0;width:14px;background:${t.farbe}}
  .foot{position:absolute;left:72px;bottom:56px;display:flex;gap:16px;align-items:center;font-weight:500;font-size:26px;color:#cfcfcf}
  .foot img{width:58px;height:58px;border-radius:50%;border:3px solid ${t.farbe}}
  </style></head><body><div class="grid"></div><div class="bar"></div>
  <div class="chip">${await icon(t.icon, 30, 2.2)} ${t.titel}</div>
  <h1 id="t">${titel}</h1>
  <div class="bigicon">${await icon(artIcon || t.icon, 200)}</div>
  <div class="foot"><img src="data:image/webp;base64,${avatar}">Der Vollautomaten-Doktor · vollautomatendoktor.de</div>
  </body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
for (const f of (await readdir(ROOT + 'src/content/artikel')).filter((f) => f.endsWith('.mdx')).sort()) {
  const k = kopf(await readFile(ROOT + 'src/content/artikel/' + f, 'utf8'));
  if (!k.bild?.startsWith('/bilder/titel/')) continue;
  const ziel = ROOT + 'public' + k.bild;
  if (!alle) { try { await access(ziel); continue; } catch {} }
  const t = THEMEN[k.thema];
  await page.setContent(await html(k.kurztitel || k.title, t, k.icon), { waitUntil: 'load' });
  // Schrift schrumpfen, bis der Titel in den Platz passt
  await page.evaluate(() => {
    const h = document.getElementById('t');
    let s = 66;
    while (h.scrollHeight > 330 && s > 40) { s -= 2; h.style.fontSize = s + 'px'; }
  });
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).webp({ quality: 85 }).toFile(ziel);
  console.log('erzeugt', k.bild);
}
await browser.close();
