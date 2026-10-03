// Checklisten zum Ausdrucken: A4-PDF je Checkliste aus src/checklisten.mjs → public/checklisten/<id>.pdf
// Mit QR-Code zum passenden Artikel. Läuft lokal und in GitHub Actions (wie die Pins: nur fehlende, --alle für alle).
//   npm run checklisten
//   npm run checklisten -- --alle
import { readFile, access, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { renderSVG } from 'uqr';
import { CHECKLISTEN } from '../src/checklisten.mjs';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const ZIEL = ROOT + 'public/checklisten/';
const alle = process.argv.includes('--alle');
const SITE = 'https://vollautomatendoktor.de';

const themenTs = await readFile(ROOT + 'src/themen.ts', 'utf8');
const THEMEN = Object.fromEntries([...themenTs.matchAll(/^\s+(\S+): \{ slug: '([^']+)', titel: '([^']+)', icon: '([^']+)', farbe: '([^']+)'/gm)]
  .map(([, key, slug, titel, icon, farbe]) => [key, { slug, titel, icon, farbe }]));
const font = async (w) => (await readFile(ROOT + `public/fonts/inter-${w}.woff2`)).toString('base64');
const [f400, f800] = await Promise.all([font(400), font(800)]);
const avatar = (await readFile(ROOT + 'public/bilder/autor.webp')).toString('base64');
const icon = async (name, size, stroke = 2) => (await readFile(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8'))
  .replace(/<!--.*?-->/s, '').replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`)
  .replace(/stroke-width="2"/, `stroke-width="${stroke}"`);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function html(c) {
  const t = THEMEN[c.thema];
  const url = `${SITE}/artikel/${c.artikel[0]}/`;
  const qr = renderSVG(url, { border: 1 });
  const mitText = c.punkte.some((p) => p[1]);
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(c.titel)} – Der Vollautomaten-Doktor</title><style>
  @font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${f400}) format('woff2')}
  @font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${f800}) format('woff2')}
  @page{size:A4;margin:0}
  *{margin:0;box-sizing:border-box}
  body{width:210mm;height:297mm;font-family:Inter;color:#111;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bar{height:6mm;background:${t.farbe}}
  .kopf{display:flex;justify-content:space-between;align-items:flex-start;padding:12mm 16mm 0}
  .chip{display:inline-flex;gap:2mm;align-items:center;padding:1.6mm 3.6mm;border-radius:99px;background:${t.farbe};font-weight:800;font-size:9pt;letter-spacing:.06em;text-transform:uppercase}
  .marke{display:flex;gap:2.5mm;align-items:center;font-size:9pt;color:#444}
  .marke img{width:10mm;height:10mm;border-radius:50%}
  h1{padding:7mm 16mm 0;font-weight:800;font-size:${c.titel.length > 50 ? 22 : 25}pt;line-height:1.12;letter-spacing:-.01em}
  .intro{padding:4mm 16mm 0;font-size:11pt;line-height:1.45;color:#333}
  ul{list-style:none;padding:${mitText ? 7 : 6}mm 16mm 0;display:${mitText ? 'block' : 'grid'};grid-template-columns:1fr 1fr;column-gap:8mm}
  li{display:flex;gap:4mm;align-items:flex-start;padding:${mitText ? 3.1 : 2.6}mm 0;border-bottom:.3mm solid #e4e1da;break-inside:avoid}
  .box{flex:none;width:6.5mm;height:6.5mm;border:.6mm solid #111;border-radius:1.4mm;margin-top:.2mm}
  li b{display:block;font-weight:800;font-size:11.5pt;line-height:1.3}
  li span{display:block;font-size:10pt;line-height:1.4;color:#444;margin-top:.6mm}
  .notiz{margin:7mm 16mm 0;padding:4mm 5mm;border:.4mm dashed #bbb;border-radius:2mm;font-size:9.5pt;color:#777;height:24mm}
  .fuss{position:absolute;left:16mm;right:16mm;bottom:12mm;display:flex;gap:6mm;align-items:center;padding-top:5mm;border-top:.4mm solid #111}
  .fuss .qr{width:24mm;height:24mm;flex:none}
  .fuss p{font-size:9.5pt;line-height:1.45;color:#333}
  .fuss b{font-weight:800}
  </style></head><body>
  <div class="bar"></div>
  <div class="kopf"><span class="chip">${await icon(t.icon, 14, 2.4)} Checkliste · ${esc(t.titel)}</span>
    <span class="marke"><img src="data:image/webp;base64,${avatar}" alt="">Der Vollautomaten-Doktor</span></div>
  <h1>${esc(c.titel)}</h1>
  <p class="intro">${esc(c.intro)}</p>
  <ul>${c.punkte.map(([titel, text]) => `<li><span class="box"></span><div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div></li>`).join('')}</ul>
  ${!mitText || c.punkte.length <= 8 ? '<div class="notiz">Notizen:</div>' : ''}
  <div class="fuss"><div class="qr">${qr.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    <p><b>Die ausführliche Anleitung mit Bildern:</b><br>${url.replace('https://', '')}<br>
    Kostenlos vom Vollautomaten-Doktor: vollautomatendoktor.de und YouTube @derhandwerksdoktor.<br>
    Alle Angaben ohne Gewähr. Bei Gas, Strom und Unsicherheit einen Fachbetrieb fragen.</p></div>
  </body></html>`;
}

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const c of CHECKLISTEN) {
  const datei = `${ZIEL}${c.id}.pdf`;
  if (!alle) { try { await access(datei); continue; } catch {} }
  await page.setContent(await html(c), { waitUntil: 'load' });
  await page.pdf({ path: datei, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('erzeugt', datei.replace(ROOT + 'public', ''));
}
await browser.close();
