// Thumbnails J/K/L für „Heizkörper wird nicht warm?“, Profi-Look nach CLAUDE.md (Vorlage: projects/klima-probleme/thumbnail_pro.mjs).
// node projects/heizkoerper-kalt/thumbnail_pro.mjs
// Prinzip: ein Hauptmotiv, Tiefe (Hintergrund unscharf + gegradet, Gerät scharf freigestellt mit Bodenschatten),
// Kanal-Person als Sticker mit Lichtkante, Typo mit Tiefe statt dicker Konturen, wenige Elemente, Filmkorn.
// Hauptmotiv: der Wärmebild-Heizkörper aus dem Video bzw. der echte Thermostatkopf (Foto: ri, CC0, mit rembg freigestellt).
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
for (const [w, n] of [[600, 'ISB'], [800, 'IXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);
const W = 1280, H = 720, YEL = '#ffd400', RED = '#e8201c', BLUE = '#39a8ff', LIME = '#CFF72A';
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));
const radPhoto = await loadImage(path.join(DIR, 'photos/Radiator-250558_1280.jpg'));
const thermoRaw = await loadImage(path.join(DIR, 'photos/radiator_cutout.png'));
// nur der Thermostatkopf (Bildbereich im Original ca. x 600..1000, y 340..760)
const thermo = (() => {
  const c = createCanvas(420, 430), g = c.getContext('2d'); g.drawImage(thermoRaw, -600, -340);
  // Herstellerschriftzug oben auf dem Ring weichzeichnen (kein Marken-Fokus im Thumbnail)
  const b = createCanvas(420, 430), bg = b.getContext('2d'); bg.filter = 'blur(6px)'; bg.drawImage(c, 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.beginPath(); g.rect(80, 0, 320, 95); g.clip(); g.drawImage(b, 0, 0); g.restore();
  return c;
})();
const { radiator, FIELD, heat } = await import('./render.mjs');
function cover(x, img, fx = 0.5, fy = 0.5, zoom = 1, blur = 0) {
  const s = Math.max(W / img.width, H / img.height) * zoom, w = img.width * s, h = img.height * s;
  x.save(); if (blur) x.filter = `blur(${blur}px)`;
  x.drawImage(img, Math.min(0, Math.max(W - w, W / 2 - fx * w)), Math.min(0, Math.max(H - h, H / 2 - fy * h)), w, h);
  x.restore();
}
// eingefärbte Silhouette eines freigestellten Bildes
function silhouette(img, col) {
  const c = createCanvas(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
// Sticker: weiße Kontur, farbige Lichtkante, weicher Schatten
function sticker(x, img, dx, dy, dw, dh, { stroke = 9, rim = BLUE, rimSide = -1 } = {}) {
  const sh = silhouette(img, '#000'), wh = silhouette(img, '#fff'), rc = silhouette(img, rim);
  x.save(); x.globalAlpha = 0.55; x.filter = 'blur(26px)'; x.drawImage(sh, dx + 18, dy + 22, dw, dh); x.restore();
  x.save(); x.globalAlpha = 0.9; x.filter = 'blur(18px)'; x.drawImage(rc, dx + rimSide * 16, dy - 6, dw, dh); x.restore();
  for (let a = 0; a < 32; a++) x.drawImage(wh, dx + Math.cos(a / 32 * Math.PI * 2) * stroke, dy + Math.sin(a / 32 * Math.PI * 2) * stroke, dw, dh);
  x.drawImage(img, dx, dy, dw, dh);
  // Lichtkante auf der Person selbst (nur innerhalb der Silhouette)
  const lc = createCanvas(dw, dh), l = lc.getContext('2d');
  l.drawImage(img, 0, 0, dw, dh); l.globalCompositeOperation = 'source-atop';
  const g = l.createLinearGradient(rimSide < 0 ? 0 : dw, 0, rimSide < 0 ? dw * 0.35 : dw * 0.65, 0);
  g.addColorStop(0, rim); g.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g; l.globalAlpha = 0.45; l.fillRect(0, 0, dw, dh);
  x.save(); x.globalCompositeOperation = 'screen'; x.drawImage(lc, dx, dy); x.restore();
}
// Gerät mit Bodenschatten und Glanz
function product(x, img, cx, by, h, rot = 0, tint = null) {
  const w = h * img.width / img.height;
  x.save(); x.translate(cx, by);
  const g = x.createRadialGradient(0, 0, 10, 0, 0, w * 0.6); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.scale(1, 0.18); x.fillStyle = g; x.beginPath(); x.arc(0, 0, w * 0.6, 0, 7); x.fill(); x.restore();
  x.rotate(rot);
  if (tint) { x.save(); x.filter = 'blur(30px)'; x.globalAlpha = 0.85; x.drawImage(silhouette(img, tint), -w / 2 - 10, -h - 10, w + 20, h + 20); x.restore(); }
  x.drawImage(img, -w / 2, -h, w, h);
  x.restore();
}
// Schrift mit Tiefe: dunkle Extrusion, weicher Schatten, Verlauf in der Füllung
function title(x, parts, px, py, size, { depth = 9, extrude = '#0b0d12', align = 'left', rot = 0 } = {}) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.font = `${size}px IXB`; x.letterSpacing = `${-size * (size > 90 ? 0.035 : 0.01)}px`;
  const ws = parts.map(([s]) => x.measureText(s).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
  parts.forEach(([s, col], i) => {
    x.save(); x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 40; x.shadowOffsetY = 16;
    for (let d = depth; d >= 1; d--) { x.fillStyle = extrude; x.fillText(s, cx + d * 0.6, d); if (d === depth) { x.shadowColor = 'transparent'; } }
    x.restore();
    const g = x.createLinearGradient(0, -size * 0.8, 0, size * 0.1);
    if (Array.isArray(col)) { g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); } else { g.addColorStop(0, col); g.addColorStop(1, col); }
    x.fillStyle = g; x.fillText(s, cx, 0);
    cx += ws[i];
  });
  x.restore();
  return total;
}
// Glas-Pill mit kleinem Label oben und Wert
function tag(x, label, value, px, py, accent = LIME, rot = 0) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.font = '26px ISB'; x.letterSpacing = '3px'; const lw = x.measureText(label).width;
  x.font = '54px IXB'; x.letterSpacing = '-1.5px'; const vw = x.measureText(value).width;
  const w = Math.max(lw, vw) + 64, h = 128;
  x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 40; x.shadowOffsetY = 14;
  x.fillStyle = 'rgba(12,12,14,0.86)'; x.beginPath(); x.roundRect(0, 0, w, h, 24); x.fill(); x.shadowColor = 'transparent';
  x.strokeStyle = 'rgba(255,255,255,0.14)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = accent; x.beginPath(); x.roundRect(0, 18, 7, h - 36, 4); x.fill();
  x.font = '26px ISB'; x.letterSpacing = '3px'; x.fillStyle = 'rgba(255,255,255,0.65)'; x.fillText(label, 32, 46);
  x.font = '54px IXB'; x.letterSpacing = '-1.5px'; x.fillStyle = accent; x.fillText(value, 32, 104);
  x.restore();
}
function grade(x, top, bottom, mode = 'soft-light', a = 0.9) {
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.save(); x.globalCompositeOperation = mode; x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
}
function vignette(x, s = 0.6) {
  const g = x.createRadialGradient(W * 0.55, H * 0.5, H * 0.2, W * 0.55, H * 0.5, W * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function light(x, cx, cy, r, col, a = 0.6) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
}
function grain(x, a = 10) {
  const d = x.getImageData(0, 0, W, H), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - 0.5) * a; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  x.putImageData(d, 0, 0);
}
function personAt(x, cx, top, h, rim, side = -1) { sticker(x, person, cx - h / 2, top, h, h, { rim, rimSide: side }); }
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f); }

// Wärmebild-Heizkörper als freistehendes Motiv: leicht perspektivisch, Glow, Bodenschatten
function thermalRad(x, cx, by, w, h, field, glow, ribs = 12) {
  const c = createCanvas(w + 80, h + 80), g = c.getContext('2d');
  radiator(g, 40, 40, w, h, field, ribs, { level: 5 });
  x.save(); x.translate(cx, by);
  const sh = x.createRadialGradient(0, 0, 10, 0, 0, w * 0.6); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.scale(1, 0.16); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, w * 0.62, 0, 7); x.fill(); x.restore();
  x.save(); x.filter = 'blur(40px)'; x.globalAlpha = 0.75; x.fillStyle = glow; x.fillRect(-w / 2, -h - 20, w, h); x.restore();
  x.transform(1, -0.06, 0, 1, 0, 0);
  x.drawImage(c, -w / 2 - 40, -h - 40 - 20);
  x.restore();
}
function bubbleRing(x, cx, cy, r) { x.save(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 4; x.shadowColor = '#fff'; x.shadowBlur = 10; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); x.restore(); }

// J „WIRD NICHT WARM?“ – kalter Heizkörper im Wärmebild, kühles Blau
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, radPhoto, 0.5, 0.5, 1.2, 16);
  x.fillStyle = 'rgba(4,10,30,0.62)'; x.fillRect(0, 0, W, H);
  grade(x, '#1b4dff', '#00121f', 'color', 0.6);
  light(x, 500, 470, 430, '#2f7dff', 0.5);
  thermalRad(x, 470, 670, 520, 300, (u, v) => 0.05 + 0.16 * (1 - v) + 0.03 * Math.sin(u * 9), '#2346e8');
  vignette(x, 0.55);
  personAt(x, 1085, 210, 560, BLUE, -1);
  title(x, [['WIRD NICHT', '#ffffff']], 48, 132, 112);
  title(x, [['WARM?', ['#7fd0ff', '#2a8cff']]], 48, 262, 132);
  tag(x, 'DRUCK MEIST', '1–2 bar', 830, 560, BLUE, 0);
  grain(x, 7);
  await save(c, 'thumbnail_J.png');
}

// K „OBEN KALT?“ – Luft: oben blau, unten glühend, Luftblasen, warmes Orange
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, radPhoto, 0.5, 0.5, 1.2, 18);
  x.fillStyle = 'rgba(30,8,0,0.55)'; x.fillRect(0, 0, W, H);
  grade(x, '#ff7a00', '#7a0000', 'color', 0.55);
  light(x, 520, 520, 460, '#ff8a1c', 0.55);
  thermalRad(x, 500, 680, 540, 330, FIELD.air(0.6), '#ff5a00');
  for (const [bx, by, r] of [[330, 395, 10], [420, 380, 14], [520, 402, 9], [610, 384, 12], [470, 412, 7]]) bubbleRing(x, bx, by, r);
  vignette(x, 0.5);
  personAt(x, 1090, 220, 540, '#ff8a00', -1);
  title(x, [['OBEN', '#ffffff']], 48, 150, 140);
  title(x, [['KALT?', ['#7fd0ff', '#2a8cff']]], 48, 290, 140);
  tag(x, 'VENTIL AUF', '¼–½ Drehung', 760, 40, YEL, 0);
  grain(x, 7);
  await save(c, 'thumbnail_K.png');
}

// L „GANZ KALT?“ – echter Thermostatkopf groß, Frost-Blau, Ventilstift-Maß
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, radPhoto, 0.3, 0.5, 1.3, 20);
  x.fillStyle = 'rgba(2,8,24,0.66)'; x.fillRect(0, 0, W, H);
  grade(x, '#39a8ff', '#001a33', 'color', 0.55);
  light(x, 470, 400, 420, '#7fd0ff', 0.45);
  product(x, thermo, 560, 735, 420, -0.18, '#39a8ff');
  vignette(x, 0.5);
  personAt(x, 1090, 230, 520, LIME, -1);
  title(x, [['GANZ', '#ffffff']], 48, 150, 140);
  title(x, [['KALT?', ['#7fd0ff', '#2a8cff']]], 48, 290, 140);
  tag(x, 'VENTILSTIFT', 'ca. 5 mm', 800, 560, LIME, 0);
  grain(x, 7);
  await save(c, 'thumbnail_L.png');
}
