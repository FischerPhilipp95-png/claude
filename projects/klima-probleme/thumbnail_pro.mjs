// Thumbnails J/K/L im „Profi“-Look, 1280x720 (Nutzer: G/H/I zu unprofessionell).
// node projects/klima-probleme/thumbnail_pro.mjs
// Prinzip: ein Hauptmotiv, Tiefe (Hintergrund unscharf + gegradet, Gerät scharf freigestellt mit Bodenschatten),
// Kanal-Person als Sticker mit Lichtkante, Typo mit Tiefe statt dicker Konturen, wenige Elemente, Filmkorn.
// Fotos: Shixart1985, CC BY 2.0 (Wikimedia Commons), Gerät mit rembg freigestellt.
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
for (const [w, n] of [[600, 'ISB'], [800, 'IXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);
const W = 1280, H = 720, YEL = '#ffd400', RED = '#e8201c', BLUE = '#39a8ff', LIME = '#CFF72A';
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));
const unitRaw = await loadImage(path.join(DIR, 'photos/aussengeraet_garten_cutout.png'));
const fassade = await loadImage(path.join(DIR, 'photos/fassade_klimageraete.jpg'));
const garten = await loadImage(path.join(DIR, 'photos/aussengeraet_garten.jpg'));
// Standfuß unten abschneiden: nur das Gehäuse (Bildbereich y 330..1650 im Original)
const unit = (() => { const c = createCanvas(1280, 1330); c.getContext('2d').drawImage(unitRaw, 0, -330); return c; })();

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
function product(x, cx, by, h, rot = 0, tint = null) {
  const w = h * unit.width / unit.height;
  x.save(); x.translate(cx, by);
  const g = x.createRadialGradient(0, 0, 10, 0, 0, w * 0.6); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.scale(1, 0.18); x.fillStyle = g; x.beginPath(); x.arc(0, 0, w * 0.6, 0, 7); x.fill(); x.restore();
  x.rotate(rot);
  if (tint) { x.save(); x.filter = 'blur(30px)'; x.globalAlpha = 0.85; x.drawImage(silhouette(unit, tint), -w / 2 - 10, -h - 10, w + 20, h + 20); x.restore(); }
  x.drawImage(unit, -w / 2, -h, w, h);
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

// J „ZU LAUT?“ – Nacht-Look: Gerät strahlt Schallwellen ab, Nachbarfenster im Hintergrund
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, fassade, 0.6, 0.45, 1.15, 14);
  x.fillStyle = 'rgba(6,14,32,0.62)'; x.fillRect(0, 0, W, H);
  grade(x, '#1b4dff', '#00121f', 'color', 0.55);
  light(x, 560, 470, 420, '#2f7dff', 0.55);
  // Schallwellen
  for (let i = 0; i < 5; i++) {
    const r = 210 + i * 62;
    x.save(); x.strokeStyle = `rgba(255,212,0,${0.95 - i * 0.17})`; x.lineWidth = 12 - i * 1.4; x.lineCap = 'round';
    x.shadowColor = YEL; x.shadowBlur = 24;
    x.beginPath(); x.arc(560, 430, r, -0.95, 0.5); x.stroke(); x.restore();
  }
  product(x, 520, 660, 470, -0.05, '#2f7dff');
  vignette(x, 0.55);
  personAt(x, 1080, 210, 560, BLUE, -1);
  title(x, [['ZU ', '#ffffff'], ['LAUT?', ['#ffe14d', '#ffb800']]], 52, 150, 150);
  tag(x, 'NACHTS ERLAUBT', 'nur 40 dB(A)', 52, 520, YEL, 0);
  grain(x, 7);
  await save(c, 'thumbnail_J.png');
}

// K „KÜHLT NICHT?“ – Hitze-Look: oranges Gegenlicht, Gerät, Ursachen-Hinweis
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, garten, 0.5, 0.25, 1.1, 18);
  x.fillStyle = 'rgba(30,8,0,0.5)'; x.fillRect(0, 0, W, H);
  grade(x, '#ff7a00', '#d10000', 'color', 0.6);
  light(x, 1000, 120, 650, '#ffb347', 0.8);
  product(x, 690, 700, 470, 0.04, '#ff5a00');
  vignette(x, 0.5);
  personAt(x, 1095, 220, 540, '#ff8a00', -1);
  title(x, [['KÜHLT', '#ffffff']], 50, 150, 140);
  title(x, [['NICHT?', ['#7fd0ff', '#2a8cff']]], 50, 290, 140);
  tag(x, 'OFT SCHULD', 'Dreckiger Filter', 50, 540, '#7fd0ff', 0);
  grain(x, 7);
  await save(c, 'thumbnail_K.png');
}

// L „10.000 €?!“ – Kosten: riesige Zahl, Gerät, realistische Spanne als Gegenpol
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, garten, 0.5, 0.6, 1.2, 20);
  x.fillStyle = 'rgba(4,10,6,0.66)'; x.fillRect(0, 0, W, H);
  grade(x, '#00b36b', '#002a14', 'color', 0.5);
  light(x, 420, 360, 520, '#1fdc84', 0.4);
  product(x, 270, 700, 430, -0.06, '#1fdc84');
  vignette(x, 0.5);
  personAt(x, 1090, 230, 520, LIME, -1);
  title(x, [['10.000 €', ['#ffffff', '#d8d8d8']]], 600, 200, 150, { align: 'center', rot: -0.03 });
  // durchgestrichen: rote Linie über der Zahl
  x.save(); x.translate(600, 160); x.rotate(-0.08); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 20;
  x.fillStyle = RED; x.beginPath(); x.roundRect(-330, -10, 660, 22, 11); x.fill(); x.restore();
  title(x, [['FÜR EINE KLIMAANLAGE?', '#ffffff']], 600, 300, 52, { align: 'center', depth: 5 });
  tag(x, 'REALISTISCH MIT MONTAGE', '1.500–3.500 €', 470, 460, LIME, 0);
  grain(x, 7);
  await save(c, 'thumbnail_L.png');
}
