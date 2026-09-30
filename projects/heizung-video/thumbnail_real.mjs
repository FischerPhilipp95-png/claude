// Drei weitere Thumbnails G/H/I mit echten Fotos (Wikimedia Commons), 1280x720.
// node projects/heizung-video/thumbnail_real.mjs
// G „OBEN KALT?“: Heizkörper-Foto mit Wärmebild-Look (CC0, ri)
// H „DIESES 1€-TEIL“: Schlüssel im Entlüftungsventil (CC0, Noggo)
// I „DANACH PRÜFEN!“: Manometer (CC BY 2.0, Shixart1985, Nennung in der Beschreibung)
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bubble, C, BEAT_TIMES } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');
const W = 1280, H = 720, RED = '#e8201c', YEL = '#ffd400', COLD = '#39a8ff';
const T = BEAT_TIMES[40] + 0.05;
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));
const photo = (f) => loadImage(path.join(DIR, 'photos', f));

// Text mit dicker schwarzer Kontur, damit er auf Fotos lesbar bleibt
function text(x, parts, px, py, size, align = 'left', stroke = size * 0.16) {
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.03}px`; x.lineJoin = 'round';
  const total = parts.reduce((a, [s]) => a + x.measureText(s).width, 0);
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  for (const [s, col] of parts) {
    if (stroke) { x.strokeStyle = '#000'; x.lineWidth = stroke; x.strokeText(s, cx, py); }
    x.fillStyle = col; x.fillText(s, cx, py); cx += x.measureText(s).width;
  }
  x.letterSpacing = '0px';
  return total;
}
function arrow(x, [[ax, ay], [cx, cy], [bx, by]], col, w, head = 30) {
  const draw = (c, lw) => {
    x.strokeStyle = c; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke();
    const ang = Math.atan2(by - cy, bx - cx);
    x.beginPath(); x.moveTo(bx - head * Math.cos(ang - 0.5), by - head * Math.sin(ang - 0.5)); x.lineTo(bx, by); x.lineTo(bx - head * Math.cos(ang + 0.5), by - head * Math.sin(ang + 0.5)); x.stroke();
  };
  draw('#000', w + 8); draw(col, w);
}
function ring(x, cx, cy, rx, ry, col = RED, w = 12) {
  for (const [c, lw] of [['#000', w + 8], [col, w]]) {
    x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.ellipse(cx, cy, rx, ry, -0.12, 0.2, Math.PI * 2 + 0.05); x.stroke();
  }
}
function pill(x, label, cx, cy, size, bg, fg = '#fff', rot = 0) {
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.02}px`;
  const w = x.measureText(label).width + size * 0.9, h = size * 1.45;
  x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 24; x.shadowOffsetY = 6;
  x.fillStyle = bg; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * 0.28); x.fill(); x.shadowColor = 'transparent';
  x.strokeStyle = '#000'; x.lineWidth = 5; x.stroke();
  x.fillStyle = fg; x.textAlign = 'center'; x.fillText(label, 0, size * 0.36); x.textAlign = 'left'; x.letterSpacing = '0px';
  x.restore();
}
function drawPerson(x, cx, faceY, h) {
  x.save(); x.shadowColor = 'rgba(0,0,0,0.7)'; x.shadowBlur = 50; x.drawImage(person, cx - h / 2, faceY - h * 0.4, h, h); x.restore();
}
// Foto „cover“ in ein Rechteck, Fokuspunkt (fx, fy) in 0..1, optional gespiegelt und gezoomt
function cover(x, img, rx, ry, rw, rh, fx = 0.5, fy = 0.5, zoom = 1, mirror = false) {
  const s = Math.max(rw / img.width, rh / img.height) * zoom, w = img.width * s, h = img.height * s;
  const dx = rx + Math.min(0, Math.max(rw - w, rw / 2 - fx * w)), dy = ry + Math.min(0, Math.max(rh - h, rh / 2 - fy * h));
  x.save(); x.beginPath(); x.rect(rx, ry, rw, rh); x.clip();
  if (mirror) { x.translate(rx * 2 + rw, 0); x.scale(-1, 1); }
  x.drawImage(img, dx, dy, w, h); x.restore();
}
function vignette(x, strength = 0.55) {
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }

// G: „OBEN KALT?“ – echter Heizkörper im Wärmebild-Look: oben blau, unten rot
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const img = await photo('Radiator-250558_1280.jpg');
  cover(x, img, 0, 0, W, H, 0.3, 0.5, 1.0, true);
  // Wärmebild: Farbe per „color“-Blend, dann etwas Sättigung per „overlay“
  const tg = x.createLinearGradient(0, 40, 0, H - 40);
  tg.addColorStop(0, '#1b3cff'); tg.addColorStop(0.38, '#20b6ff'); tg.addColorStop(0.55, '#ffd000'); tg.addColorStop(0.75, '#ff5a00'); tg.addColorStop(1, '#e0001b');
  x.globalCompositeOperation = 'color'; x.fillStyle = tg; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.55; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  // links abdunkeln für den Text
  const lg = x.createLinearGradient(0, 0, 700, 0); lg.addColorStop(0, 'rgba(0,0,0,0.9)'); lg.addColorStop(0.55, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  vignette(x, 0.5);
  text(x, [['OBEN', C.W]], 50, 200, 170);
  text(x, [['KALT?', COLD]], 50, 370, 170);
  text(x, [['UNTEN WARM?', '#ff6a1a']], 54, 470, 74);
  pill(x, 'SO GEHT’S WEG!', 300, 600, 58, RED, '#fff', -0.03);
  pill(x, 'KALT', 1010, 110, 46, COLD, '#fff', 0.04);
  pill(x, 'WARM', 1040, 640, 46, RED, '#fff', -0.04);
  bubble(x, T, 1120, 250, 70, '><');
  arrow(x, [[640, 250], [760, 170], [1030, 230]], C.W, 12, 34);
  await save(c, 'thumbnail_G.png');
}

// H: „DIESES 1€-TEIL“ – Schlüssel steckt im Entlüftungsventil, roter Kreis, Person
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const img = await photo('Bleedscrew_in_use.jpg');
  cover(x, img, 0, 0, W, H, 0.4, 0.42, 1.25);
  const lg = x.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, 'rgba(0,0,0,0.75)'); lg.addColorStop(0.3, 'rgba(0,0,0,0.05)'); lg.addColorStop(0.7, 'rgba(0,0,0,0.05)'); lg.addColorStop(1, 'rgba(0,0,0,0.85)');
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  vignette(x, 0.45);
  drawPerson(x, 1085, 330, 640);
  text(x, [['DIESES ', C.W], ['1€-TEIL', YEL]], 36, 120, 116);
  text(x, [['SPART HEIZKOSTEN!', C.W]], 36, 680, 92);
  ring(x, 520, 335, 250, 165, RED, 14);
  pill(x, 'BIS ZU −15 %', 640, 545, 52, RED, '#fff', -0.04);
  await save(c, 'thumbnail_H.png');
}

// I: „DANACH PRÜFEN!“ – echtes Manometer, Nadel eingekreist
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#0b0b0d'; x.fillRect(0, 0, W, H);
  const img = await photo('A_pressure_gauge_attached_to_a_heating_system.jpg');
  const px = 560;
  cover(x, img, px, 0, W - px, H, 0.48, 0.5, 1.6);
  const lg = x.createLinearGradient(px, 0, px + 260, 0); lg.addColorStop(0, 'rgba(11,11,13,1)'); lg.addColorStop(1, 'rgba(11,11,13,0)');
  x.fillStyle = lg; x.fillRect(px, 0, 260, H);
  vignette(x, 0.4);
  text(x, [['NACH DEM ENTLÜFTEN:', C.O]], 44, 110, 50, 'left', 0);
  text(x, [['DAS HIER', C.W]], 40, 250, 138);
  text(x, [['PRÜFEN!', RED]], 40, 390, 150);
  drawPerson(x, 300, 560, 440);
  ring(x, 920, 360, 195, 195, YEL, 12);
  arrow(x, [[600, 150], [690, 130], [735, 270]], C.W, 12, 32);
  pill(x, '1,2–2 bar?', 930, 640, 56, '#1fa34a', '#fff', -0.04);
  await save(c, 'thumbnail_I.png');
}
