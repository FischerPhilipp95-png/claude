// Pinterest-Pins (1000x1500, JPEG) für alle Artikel und Rechner: /bilder/pins/…
// Gleicher Look wie die Titelbilder (scripts/titelbilder.mjs), aber im Hochformat, das Pinterest bevorzugt.
// Pro Artikel bis zu drei Designs (Texte und Zeitplan: scripts/pin-varianten.mjs):
//   <artikel>.jpg     dunkel, Titel und Beschreibung
//   <artikel>-2.jpg   in der Themenfarbe, erste Frage aus „Häufige Fragen“ mit Antwort
//   <artikel>-3.jpg   hell, Schritte aus dem Ablauf, Checkliste oder Überblick
//   rechner-<name>.jpg  dunkel, für jeden Rechner
// Die Pins landen über die Feeds unter /pinterest/ automatisch bei Pinterest (siehe README).
//   npm run pins          (fehlende Pins)
//   npm run pins -- --alle (alle neu, z. B. nach Änderungen am Design oder an den FAQ)
import { readFile, readdir, access, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { varianten } from './pin-varianten.mjs';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const alle = process.argv.includes('--alle');
const ZIEL = ROOT + 'public/bilder/pins/';

const themenTs = await readFile(ROOT + 'src/themen.ts', 'utf8');
const THEMEN = Object.fromEntries([...themenTs.matchAll(/^\s+(\S+): \{ slug: '([^']+)', titel: '([^']+)', icon: '([^']+)', farbe: '([^']+)'/gm)]
  .map(([, key, slug, titel, icon, farbe]) => [key, { slug, titel, icon, farbe }]));
const rechnerTs = await readFile(ROOT + 'src/rechner.ts', 'utf8');
const RECHNER = [...rechnerTs.matchAll(/href: '\/rechner\/([^/]+)\/', icon: '([^']+)', farbe: '[^']+', thema: '([^']+)', titel: '([^']+)', text: '([^']+)'/g)]
  .map(([, name, icon, thema, titel, text]) => ({ name, icon, thema, titel, text }));

const font = async (w) => (await readFile(ROOT + `public/fonts/inter-${w}.woff2`)).toString('base64');
const [f500, f800] = await Promise.all([font(500), font(800)]);
const avatar = (await readFile(ROOT + 'public/bilder/autor.webp')).toString('base64');
const icon = async (name, size, stroke = 1.6) => (await readFile(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8'))
  .replace(/<!--.*?-->/s, '').replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`)
  .replace(/stroke-width="2"/, `stroke-width="${stroke}"`);

function zerlegen(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const out = {};
  for (const line of (m ? m[1] : '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { k: out, body: m ? m[2] : '' };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const kopf = (bodyCss) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;font-weight:500;src:url(data:font/woff2;base64,${f500}) format('woff2')}
  @font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${f800}) format('woff2')}
  *{margin:0;box-sizing:border-box}
  body{width:1000px;height:1500px;font-family:Inter;overflow:hidden;${bodyCss}}
  .chip{position:absolute;left:72px;top:84px;display:flex;gap:12px;align-items:center;font-weight:800;font-size:34px;letter-spacing:.08em;text-transform:uppercase}
  .cta{position:absolute;left:72px;bottom:190px;display:inline-flex;gap:12px;align-items:center;padding:20px 30px;border-radius:999px;font-weight:800;font-size:36px}
  .foot{position:absolute;left:72px;bottom:70px;display:flex;gap:18px;align-items:center;font-weight:500;font-size:32px}
  .foot img{width:72px;height:72px;border-radius:50%}
  </style>`;
const fuss = (farbe) => `<div class="foot"><img src="data:image/webp;base64,${avatar}" style="border:3px solid ${farbe}">Der Handwerksdoktor · handwerksdoktor.de</div>`;

// Design 1: dunkel, großes Icon, Titel und Beschreibung (Artikel und Rechner).
async function dunkel({ farbe, chipIcon, chipText, bigIcon, titel, text, cta }) {
  return `${kopf(`color:#fff;background:radial-gradient(circle at 80% 22%, ${farbe}55 0, transparent 42%), radial-gradient(circle at 0% 100%, #ffffff12 0, transparent 45%), #111`)}<style>
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:40px 40px}
  .bar{position:absolute;left:0;right:0;top:0;height:16px;background:${farbe}}
  .chip{color:${farbe}}
  .bigicon{position:absolute;left:50%;top:190px;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle, ${farbe}40, ${farbe}10 70%);border:3px solid ${farbe}66;color:${farbe}}
  h1{position:absolute;left:72px;right:72px;top:660px;font-weight:800;font-size:88px;line-height:1.06;letter-spacing:-.02em}
  p{position:absolute;left:72px;right:72px;font-weight:500;font-size:38px;line-height:1.35;color:#d6d6d6}
  .cta{background:${farbe};color:#111}
  .foot{color:#cfcfcf}
  </style></head><body><div class="grid"></div><div class="bar"></div>
  <div class="chip">${await icon(chipIcon, 38, 2.2)} ${esc(chipText)}</div>
  <div class="bigicon">${await icon(bigIcon, 220)}</div>
  <h1 id="t">${esc(titel)}</h1>
  <p id="d">${esc(text)}</p>
  <div class="cta">${esc(cta)} ${await icon('arrow-right', 36, 2.6)}</div>
  ${fuss(farbe)}</body></html>`;
}

// Design 2: ganze Fläche in der Themenfarbe, Frage groß, Antwort auf weißer Karte.
async function frage({ farbe, t, titel, text }) {
  return `${kopf(`color:#111;background:radial-gradient(circle at 85% 12%, #ffffff40 0, transparent 40%), ${farbe}`)}<style>
  .grid{position:absolute;inset:0;background-image:linear-gradient(#0000000d 1px,transparent 1px),linear-gradient(90deg,#0000000d 1px,transparent 1px);background-size:40px 40px}
  .qicon{position:absolute;right:56px;top:56px;color:#111;opacity:.9}
  h1{position:absolute;left:72px;right:72px;top:250px;font-weight:800;font-size:96px;line-height:1.05;letter-spacing:-.025em}
  .karte{position:absolute;left:56px;right:56px;background:#fff;border-radius:32px;padding:44px 48px;box-shadow:0 16px 40px #0000002e}
  .karte p{font-weight:500;font-size:40px;line-height:1.38;color:#222}
  .cta{background:#111;color:#fff}
  .foot{color:#111}
  </style></head><body><div class="grid"></div>
  <div class="chip">${await icon(t.icon, 38, 2.2)} Häufige Frage · ${esc(t.titel)}</div>
  <div class="qicon">${await icon('message-circle-question', 150, 1.8)}</div>
  <h1 id="t">${esc(titel)}</h1>
  <div class="karte" id="k"><p id="d">${esc(text)}</p></div>
  <div class="cta">Ganze Antwort lesen ${await icon('arrow-right', 36, 2.6)}</div>
  ${fuss('#111')}</body></html>`;
}

// Design 3: hell, Schritte oder Checkliste mit Nummern bzw. Haken in der Themenfarbe.
async function liste({ farbe, t, art, kicker, titel, punkte }) {
  const haken = await icon('check', 36, 3.2);
  const items = punkte.map((p, i) => `<li><span class="nr">${art === 'checkliste' ? haken : i + 1}</span><span class="tx">${p.titel ? `<b>${esc(p.titel)}:</b> ` : ''}${esc(p.text)}</span></li>`).join('');
  const cta = art === 'checkliste' ? 'Checkliste im Artikel' : art === 'schritte' ? 'Ganze Anleitung lesen' : 'Ganzen Artikel lesen';
  return `${kopf('color:#111;background:#f6f4ef')}<style>
  .bar{position:absolute;left:0;right:0;top:0;height:16px;background:${farbe}}
  .chip{padding:12px 22px;border-radius:999px;background:${farbe};color:#111;font-size:30px}
  .kicker{position:absolute;left:72px;right:72px;top:180px;font-weight:800;font-size:40px;color:#555}
  h1{position:absolute;left:72px;right:72px;top:240px;font-weight:800;font-size:84px;line-height:1.06;letter-spacing:-.02em}
  ul{position:absolute;left:72px;right:72px;list-style:none;padding:0;display:flex;flex-direction:column;gap:26px}
  li{display:flex;gap:26px;align-items:flex-start;font-weight:500;font-size:38px;line-height:1.3;color:#222}
  li b{font-weight:800;color:#111}
  .nr{flex:none;width:68px;height:68px;border-radius:50%;background:${farbe};color:#111;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:34px;margin-top:-10px}
  .mehr{color:#555;font-weight:800}
  .cta{background:#111;color:#fff}
  .foot{color:#333}
  </style></head><body><div class="bar"></div>
  <div class="chip">${await icon(t.icon, 34, 2.4)} ${esc(t.titel)}</div>
  <div class="kicker" id="kick">${esc(kicker)}</div>
  <h1 id="t">${esc(titel)}</h1>
  <ul id="l">${items}</ul>
  <div class="cta">${cta} ${await icon('arrow-right', 36, 2.6)}</div>
  ${fuss(farbe)}</body></html>`;
}

// Platz bis zur Schaltfläche unten (cta: bottom 190, etwa 80 hoch) mit etwas Abstand.
const UNTEN = 1500 - 190 - 80 - 50;

const einpassen = {
  dunkel: () => {
    const h = document.getElementById('t');
    const d = document.getElementById('d');
    let s = 88;
    while (h.scrollHeight > 300 && s > 56) { s -= 4; h.style.fontSize = s + 'px'; }
    d.style.top = (660 + h.scrollHeight + 40) + 'px';
    const frei = 1500 - 190 - 40 - (660 + h.scrollHeight + 40);
    while (d.scrollHeight > frei && d.textContent.length > 40) d.textContent = d.textContent.replace(/ …$/, '').replace(/\s+\S+$/, '') + ' …';
  },
  frage: (unten) => {
    const h = document.getElementById('t');
    const k = document.getElementById('k');
    const d = document.getElementById('d');
    let s = 96;
    while (h.scrollHeight > 420 && s > 60) { s -= 4; h.style.fontSize = s + 'px'; }
    const top = 250 + h.scrollHeight + 50;
    k.style.top = top + 'px';
    while (top + k.offsetHeight > unten && d.textContent.length > 40) d.textContent = d.textContent.replace(/ …$/, '').replace(/\s+\S+$/, '') + ' …';
  },
  liste: (unten) => {
    const h = document.getElementById('t');
    const l = document.getElementById('l');
    let s = 84;
    while (h.scrollHeight > 280 && s > 56) { s -= 4; h.style.fontSize = s + 'px'; }
    const top = 240 + h.scrollHeight + 56;
    l.style.top = top + 'px';
    let f = 38;
    const passt = () => top + l.offsetHeight <= unten;
    while (!passt() && f > 30) { f -= 2; l.querySelectorAll('li').forEach((li) => (li.style.fontSize = f + 'px')); }
    // Passt es immer noch nicht: hintere Punkte weglassen und „+ N weitere“ anzeigen.
    const alle = l.querySelectorAll('li').length;
    while (!passt() && l.querySelectorAll('li').length > 3) {
      l.querySelectorAll('li:not(.mehr-li)').item(l.querySelectorAll('li:not(.mehr-li)').length - 1).remove();
      let m = l.querySelector('.mehr-li');
      if (!m) { m = document.createElement('li'); m.className = 'mehr-li'; m.style.fontSize = f + 'px'; l.appendChild(m); }
      const rest = alle - l.querySelectorAll('li:not(.mehr-li)').length;
      m.innerHTML = `<span class="nr">+</span><span class="tx mehr">${rest} weitere im Artikel</span>`;
    }
  },
};

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });

async function speichern(datei, html, art) {
  if (!alle) { try { await access(datei); return; } catch {} }
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(einpassen[art], UNTEN);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(datei);
  console.log('erzeugt', datei.replace(ROOT + 'public', ''));
}

for (const f of (await readdir(ROOT + 'src/content/artikel')).filter((f) => f.endsWith('.mdx')).sort()) {
  const { k, body } = zerlegen(await readFile(ROOT + 'src/content/artikel/' + f, 'utf8'));
  if (k.entwurf === 'true') continue;
  const id = f.replace(/\.mdx$/, '');
  const t = THEMEN[k.thema];
  await speichern(ZIEL + id + '.jpg', await dunkel({
    farbe: t.farbe, chipIcon: t.icon, chipText: t.titel, bigIcon: k.icon || t.icon,
    titel: k.kurztitel || k.title, text: k.description, cta: 'Anleitung lesen',
  }), 'dunkel');
  for (const v of varianten(k, body)) {
    const datei = `${ZIEL}${id}-${v.nr}.jpg`;
    if (v.art === 'frage') await speichern(datei, await frage({ farbe: t.farbe, t, titel: v.bild.titel, text: v.bild.text }), 'frage');
    else await speichern(datei, await liste({ farbe: t.farbe, t, art: v.art, kicker: v.bild.kicker, titel: v.bild.titel, punkte: v.bild.punkte }), 'liste');
  }
}

for (const r of RECHNER) {
  const t = THEMEN[r.thema];
  await speichern(`${ZIEL}rechner-${r.name}.jpg`, await dunkel({
    farbe: t.farbe, chipIcon: 'calculator', chipText: `Rechner · ${t.titel}`, bigIcon: r.icon,
    titel: r.titel, text: `${r.text} Kostenlos und ohne Anmeldung.`, cta: 'Jetzt ausrechnen',
  }), 'dunkel');
}
await browser.close();
