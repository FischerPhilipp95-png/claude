// Pinterest-Pins (1000x1500, JPEG) für alle Artikel: /bilder/pins/<artikel>.jpg
// Gleicher Look wie die Titelbilder (scripts/titelbilder.mjs), aber im Hochformat, das Pinterest bevorzugt.
// Die Pins landen über die Feeds unter /pinterest/ automatisch bei Pinterest (siehe README).
//   npm run pins          (fehlende Pins)
//   npm run pins -- --alle (alle neu)
import { readFile, readdir, access, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const alle = process.argv.includes('--alle');
const ZIEL = ROOT + 'public/bilder/pins/';

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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function html(k, t) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;font-weight:500;src:url(data:font/woff2;base64,${f500}) format('woff2')}
  @font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${f800}) format('woff2')}
  *{margin:0;box-sizing:border-box}
  body{width:1000px;height:1500px;font-family:Inter;color:#fff;overflow:hidden;
    background:radial-gradient(circle at 80% 22%, ${t.farbe}55 0, transparent 42%), radial-gradient(circle at 0% 100%, #ffffff12 0, transparent 45%), #111}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:40px 40px}
  .bar{position:absolute;left:0;right:0;top:0;height:16px;background:${t.farbe}}
  .chip{position:absolute;left:72px;top:84px;display:flex;gap:12px;align-items:center;font-weight:800;font-size:34px;letter-spacing:.08em;text-transform:uppercase;color:${t.farbe}}
  .bigicon{position:absolute;left:50%;top:190px;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle, ${t.farbe}40, ${t.farbe}10 70%);border:3px solid ${t.farbe}66;color:${t.farbe}}
  h1{position:absolute;left:72px;right:72px;top:660px;font-weight:800;font-size:88px;line-height:1.06;letter-spacing:-.02em}
  p{position:absolute;left:72px;right:72px;font-weight:500;font-size:38px;line-height:1.35;color:#d6d6d6}
  .cta{position:absolute;left:72px;bottom:190px;display:inline-flex;gap:12px;align-items:center;padding:20px 30px;border-radius:999px;background:${t.farbe};color:#111;font-weight:800;font-size:36px}
  .foot{position:absolute;left:72px;bottom:70px;display:flex;gap:18px;align-items:center;font-weight:500;font-size:32px;color:#cfcfcf}
  .foot img{width:72px;height:72px;border-radius:50%;border:3px solid ${t.farbe}}
  </style></head><body><div class="grid"></div><div class="bar"></div>
  <div class="chip">${await icon(t.icon, 38, 2.2)} ${t.titel}</div>
  <div class="bigicon">${await icon(k.icon || t.icon, 220)}</div>
  <h1 id="t">${esc(k.kurztitel || k.title)}</h1>
  <p id="d">${esc(k.description)}</p>
  <div class="cta">Anleitung lesen ${await icon('arrow-right', 36, 2.6)}</div>
  <div class="foot"><img src="data:image/webp;base64,${avatar}">Der Handwerksdoktor · handwerksdoktor.de</div>
  </body></html>`;
}

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
for (const f of (await readdir(ROOT + 'src/content/artikel')).filter((f) => f.endsWith('.mdx')).sort()) {
  const k = kopf(await readFile(ROOT + 'src/content/artikel/' + f, 'utf8'));
  if (k.entwurf === 'true') continue;
  const datei = ZIEL + f.replace(/\.mdx$/, '.jpg');
  if (!alle) { try { await access(datei); continue; } catch {} }
  const t = THEMEN[k.thema];
  await page.setContent(await html(k, t), { waitUntil: 'load' });
  // Titel passend verkleinern, Beschreibung direkt darunter setzen und notfalls kürzen.
  await page.evaluate(() => {
    const h = document.getElementById('t');
    const d = document.getElementById('d');
    let s = 88;
    while (h.scrollHeight > 300 && s > 56) { s -= 4; h.style.fontSize = s + 'px'; }
    d.style.top = (660 + h.scrollHeight + 40) + 'px';
    const frei = 1500 - 190 - 40 - (660 + h.scrollHeight + 40);
    while (d.scrollHeight > frei && d.textContent.length > 40) d.textContent = d.textContent.replace(/ …$/, '').replace(/\s+\S+$/, '') + ' …';
  });
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(datei);
  console.log('erzeugt', datei.replace(ROOT + 'public', ''));
}
await browser.close();
