// YouTube-Thumbnails im festen Kanal-Stil (Vorlage vom Nutzer, siehe CLAUDE.md „Thumbnails“):
// dunkel getöntes Hintergrundfoto, links riesige Frage in Anton (weiße Zeilen, letzte gelb), rechts das Kanal-Porträt mit
// weichem Rand, gelbes schräges Badge unten links, optional Label oben, Linie, Kreis-Ausschnitt, Wert-Tag oder Leuchtpunkte.
// Unten rechts bleibt frei, dort blendet YouTube die Videolänge ein.
//
//   node tools/thumbnail.mjs projects/<projekt>/thumbnail.json
//
// Hintergrund: { "pexels": "Suchbegriff", "nr": 0 } holt ein freies Foto über die Pexels-API (Umgebungsvariable PEXELS_API_KEY)
// und legt es mit Fotograf und Link unter projects/<projekt>/thumbnail/ ab. Oder { "datei": "pfad/zum/bild.jpg" }.
// Ausgabe: 1920x1080 JPEG (unter 2 MB, wie YouTube es verlangt) plus eine 1280x720-Vorschau.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specPfad = process.argv[2];
if (!specPfad) { console.error('Aufruf: node tools/thumbnail.mjs projects/<projekt>/thumbnail.json'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPfad, 'utf8'));
const DIR = path.dirname(path.resolve(specPfad));
const AUS = path.join(DIR, 'thumbnail');
fs.mkdirSync(AUS, { recursive: true });

const GELB = '#ffd400';
const TOENUNG = { teal: '#0d3d40', lila: '#3a2560', blau: '#16304f', rot: '#9b0f14', grau: '#22262b', gruen: '#123d2a', orange: '#5a2a08' };
const dataUrl = (f) => `data:${f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.woff2') ? 'font/woff2' : 'image/jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Freies Foto von Pexels holen (einmal, danach aus dem Projektordner). */
async function pexels({ pexels: suche, nr = 0 }) {
  const meta = path.join(AUS, 'pexels.json');
  if (fs.existsSync(meta)) {
    const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
    if (m.suche === suche && m.nr === nr && fs.existsSync(path.join(AUS, m.datei))) return path.join(AUS, m.datei);
  }
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY fehlt. Bitte in den Einstellungen der Cloud-Umgebung als Umgebungsvariable eintragen (nie in den Chat).');
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(suche)}&orientation=landscape&size=large&per_page=15&locale=de-DE`;
  const r = await fetch(url, { headers: { Authorization: key } });
  if (!r.ok) throw new Error(`Pexels antwortet mit ${r.status}`);
  const fotos = (await r.json()).photos ?? [];
  if (!fotos.length) throw new Error(`Pexels: nichts gefunden für „${suche}“`);
  const f = fotos[Math.min(nr, fotos.length - 1)];
  const bild = await fetch(f.src.large2x);
  const datei = `pexels-${f.id}.jpg`;
  fs.writeFileSync(path.join(AUS, datei), Buffer.from(await bild.arrayBuffer()));
  fs.writeFileSync(meta, JSON.stringify({ suche, nr, datei, id: f.id, fotograf: f.photographer, fotografUrl: f.photographer_url, seite: f.url,
    lizenz: 'Pexels-Lizenz (kostenlos, Nennung nicht nötig)', weitere: fotos.slice(0, 8).map((x) => ({ nr: fotos.indexOf(x), alt: x.alt, seite: x.url })) }, null, 2));
  console.log(`Pexels: ${f.url} (Foto: ${f.photographer})`);
  return path.join(AUS, datei);
}

async function bildPfad(b) {
  if (!b) return null;
  if (b.pexels) return pexels(b);
  const p = path.resolve(ROOT, b.datei);
  if (!fs.existsSync(p)) throw new Error(`Bild nicht gefunden: ${b.datei}`);
  return p;
}

const hg = await bildPfad(spec.bild);
const kreisBild = spec.kreis ? await bildPfad(spec.kreis.bild) : null;
const toenung = TOENUNG[spec.toenung] ?? spec.toenung ?? TOENUNG.grau;
const zeilen = spec.zeilen.map(([t, farbe]) => `<div class="z ${farbe === 'gelb' ? 'gelb' : ''}">${esc(t)}</div>`).join('');

// Zusätze. Koordinaten in Pixeln auf 1280x720.
const linie = spec.linie ? (() => {
  const { von: [x1, y1], nach: [x2, y2], farbe = GELB, bogen = 0.25 } = spec.linie;
  const cx = (x1 + x2) / 2 + (y2 - y1) * bogen, cy = (y1 + y2) / 2 - (x2 - x1) * bogen;
  return `<svg class="ebene" viewBox="0 0 1280 720"><defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${farbe}" stroke-width="11" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="${x1}" cy="${y1}" r="20" fill="${farbe}" stroke="#fff" stroke-width="3" filter="url(#glow)"/></svg>`;
})() : '';
const kreis = spec.kreis ? (() => {
  const { x, y, r = 165, rand = GELB } = spec.kreis;
  return `<div class="kreis" style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;border-color:${rand};background-image:url('${dataUrl(kreisBild)}')"></div>`;
})() : '';
const tag = spec.tag ? `<div class="tag" style="left:${spec.tag.x}px;top:${spec.tag.y}px">${esc(spec.tag.text)}</div>` : '';
const punkte = (spec.punkte ?? []).map(({ x, y, r = 22, farbe = '#ff2a2a' }) =>
  `<div class="punkt" style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;background:${farbe};box-shadow:0 0 22px 6px ${farbe}"></div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Anton; src: url('${dataUrl(path.join(ROOT, 'assets/fonts/anton-latin-400-normal.woff2'))}'); }
@font-face { font-family: Archivo; src: url('${dataUrl(path.join(ROOT, 'assets/fonts/archivo-black-latin-400-normal.woff2'))}'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1280px; height: 720px; overflow: hidden; position: relative; background: ${toenung}; }
.hg { position: absolute; inset: 0; background: url('${hg ? dataUrl(hg) : ''}') ${spec.bild?.position ?? 'center'} / cover; filter: grayscale(.35) brightness(.62) contrast(1.05); }
.ton { position: absolute; inset: 0; background: ${toenung}; mix-blend-mode: color; opacity: .85; }
.dunkel { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,.05) 75%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.45) 100%); }
.korn { position: absolute; inset: 0; opacity: .10; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>"); }
.ebene { position: absolute; inset: 0; width: 1280px; height: 720px; }
.person { position: absolute; right: -50px; bottom: -95px; width: 690px; height: 690px; background: url('${dataUrl(path.join(ROOT, 'assets/channel_person_cutout.png'))}') center / cover;
  -webkit-mask-image: radial-gradient(ellipse 58% 64% at 50% 52%, #000 62%, transparent 100%); filter: drop-shadow(0 10px 30px rgba(0,0,0,.5)); }
.halo { position: absolute; right: -20px; bottom: -40px; width: 700px; height: 720px; background: radial-gradient(ellipse 50% 55% at 55% 55%, rgba(170,170,170,.55), transparent 70%); }
.text { position: absolute; left: 64px; top: ${spec.label ? 112 : 34}px; font-family: Anton; text-transform: uppercase; line-height: .9; letter-spacing: .5px; }
.z { color: #fff; font-size: var(--fs); text-shadow: 0 5px 0 rgba(0,0,0,.35), 0 10px 30px rgba(0,0,0,.45); white-space: nowrap; }
.z.gelb { color: ${GELB}; }
.label { position: absolute; left: 64px; top: 36px; background: #111; color: #fff; font-family: Archivo; font-size: 30px; letter-spacing: 2px; text-transform: uppercase; padding: 8px 18px 6px; border-radius: 8px; }
.badge { position: absolute; left: 64px; bottom: 58px; background: ${GELB}; color: #111; font-family: Archivo; font-size: 42px; text-transform: uppercase; padding: 14px 28px 10px; border-radius: 14px; transform: rotate(-3deg); box-shadow: 0 8px 22px rgba(0,0,0,.45); }
.kreis { position: absolute; border-radius: 50%; border: 10px solid; background-size: cover; background-position: center; box-shadow: 0 12px 36px rgba(0,0,0,.55); }
.tag { position: absolute; background: #fff; color: #10306b; font-family: Archivo; font-size: 46px; padding: 12px 24px 8px; border-radius: 14px; transform: rotate(-3deg); box-shadow: 0 8px 22px rgba(0,0,0,.4); }
.punkt { position: absolute; border-radius: 50%; border: 3px solid rgba(255,255,255,.85); }
</style></head><body>
<div class="hg"></div><div class="ton"></div><div class="dunkel"></div><div class="korn"></div>
${linie}${kreis}${punkte}
<div class="halo"></div><div class="person"></div>
${tag}
${spec.label ? `<div class="label">${esc(spec.label)}</div>` : ''}
<div class="text" id="t">${zeilen}</div>
${spec.badge ? `<div class="badge">${esc(spec.badge)}</div>` : ''}
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(async () => { await document.fonts.ready; });
// Schrift so groß wie möglich: links neben dem Porträt (bis ~x=700) und über dem Badge.
await page.evaluate(({ maxB, maxH }) => {
  const t = document.getElementById('t');
  let fs = 210;
  const passt = () => t.scrollWidth <= maxB && t.offsetHeight <= maxH;
  t.style.setProperty('--fs', fs + 'px');
  while (!passt() && fs > 70) { fs -= 4; t.style.setProperty('--fs', fs + 'px'); }
}, { maxB: spec.maxBreite ?? 640, maxH: spec.badge ? (spec.label ? 470 : 540) : (spec.label ? 560 : 640) });
const name = spec.name ?? 'thumbnail';
const groß = path.join(AUS, `${name}.jpg`);
await page.screenshot({ path: groß, type: 'jpeg', quality: 90 });
const klein = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await klein.setContent(html, { waitUntil: 'load' });
await klein.evaluate(async (fs) => { await document.fonts.ready; document.getElementById('t').style.setProperty('--fs', fs); },
  await page.evaluate(() => getComputedStyle(document.getElementById('t')).getPropertyValue('--fs')));
await klein.screenshot({ path: path.join(AUS, `${name}-vorschau.jpg`), type: 'jpeg', quality: 85 });
await browser.close();
const kb = (fs.statSync(groß).size / 1024).toFixed(0);
console.log(`${path.relative(ROOT, groß)} (1920x1080, ${kb} KB)${kb > 2000 ? '  ACHTUNG: über 2 MB, YouTube lehnt das ab' : ''}`);
