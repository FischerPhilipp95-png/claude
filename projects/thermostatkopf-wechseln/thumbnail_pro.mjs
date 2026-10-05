// Thumbnails J/K/L für „Thermostatkopf wechseln: alt gegen neu oder smart“, Profi-Look nach CLAUDE.md.
// node projects/thermostatkopf-wechseln/thumbnail_pro.mjs
// Hauptmotiv: Hand am Thermostat auf Stufe 5 (Foto: BOOM Photography / Pexels, mit rembg freigestellt), Hintergrund: dasselbe Foto, unscharf.
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
for (const [w, n] of [[600, 'ISB'], [800, 'IXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);
const W = 1280, H = 720, YEL = '#ffd400', RED = '#e8201c', BLUE = '#39a8ff', LIME = '#CFF72A';
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));
const bgPhoto = await loadImage(path.join(DIR, 'photos/pexels_thermostat_hand.jpg'));
const motifRaw = await loadImage(path.join(DIR, 'photos/thermostat_hand_cutout.png'));
// Arm läuft nach rechts weich aus (der Ausschnitt endet am Handgelenk)
const motif = (() => {
  const c = createCanvas(motifRaw.width, motifRaw.height), x = c.getContext('2d');
  x.drawImage(motifRaw, 0, 0); x.globalCompositeOperation = 'destination-out';
  const g = x.createLinearGradient(motifRaw.width * 0.55, 0, motifRaw.width * 0.92, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); return c;
})();
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


fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
function scene(x, tint, dark, glow) {
  cover(x, bgPhoto, 0.3, 0.5, 1.2, 18);
  x.fillStyle = dark; x.fillRect(0, 0, W, H);
  grade(x, tint, '#000000', 'color', 0.6);
  light(x, 690, 430, 460, glow, 0.55);
  // Motif: Hand am Thermostat, rechter Rand verschwindet hinter der Person
  const mh = 470, mw = mh * motif.width / motif.height, mx = 930 - mw, my = 225;
  x.save(); x.filter = 'blur(34px)'; x.globalAlpha = 0.85; x.drawImage(silhouette(motif, glow), mx - 10, my - 10, mw + 20, mh + 20); x.restore();
  const sh = x.createRadialGradient(mx + mw / 2, my + mh + 20, 10, mx + mw / 2, my + mh + 20, mw * 0.5); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.translate(0, my + mh + 20); x.scale(1, 0.18); x.translate(0, -(my + mh + 20)); x.fillStyle = sh; x.beginPath(); x.arc(mx + mw / 2, my + mh + 20, mw * 0.5, 0, 7); x.fill(); x.restore();
  x.save(); x.translate(mx + mw / 2, my + mh / 2); x.rotate(-0.05); x.drawImage(motif, -mw / 2, -mh / 2, mw, mh); x.restore();
  vignette(x, 0.55);
  personAt(x, 1120, 250, 480, glow, -1);
  x.save(); x.font = '34px ISB'; x.letterSpacing = '4px'; x.fillStyle = 'rgba(255,255,255,0.85)'; x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 16; x.fillText('THERMOSTATKOPF', 52, 62); x.restore();
}

// J „THERMOSTAT IN 10 MIN“ – Blau
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  scene(x, '#1b4dff', 'rgba(4,10,30,0.6)', BLUE);
  title(x, [['TAUSCHEN', '#ffffff']], 48, 190, 124);
  title(x, [['IN 10 MIN', ['#7fd0ff', '#2a8cff']]], 48, 320, 124);
  tag(x, 'KEIN WASSER', 'tritt aus', 48, 548, BLUE);
  grain(x, 7);
  await save(c, 'thumbnail_J.png');
}

// K „PASST DAS?“ – Gelb
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  scene(x, '#ffd400', 'rgba(20,14,0,0.6)', YEL);
  title(x, [['PASST', '#ffffff']], 48, 190, 132);
  title(x, [['DAS?', ['#ffe14d', '#ffb800']]], 48, 320, 132);
  tag(x, 'MEIST', 'M30 × 1,5', 48, 548, YEL);
  grain(x, 7);
  await save(c, 'thumbnail_K.png');
}

// L „ALT RAUS, SMART REIN“ – Limette
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  scene(x, '#5fd000', 'rgba(6,16,0,0.6)', LIME);
  title(x, [['ALT RAUS,', '#ffffff']], 48, 190, 116);
  title(x, [['SMART REIN', ['#e6ff7a', '#9fd400']]], 48, 316, 108);
  tag(x, 'JEDES GRAD WENIGER', '≈ 6 % Energie', 48, 548, LIME);
  grain(x, 7);
  await save(c, 'thumbnail_L.png');
}
