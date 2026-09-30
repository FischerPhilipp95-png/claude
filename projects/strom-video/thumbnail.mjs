// Thumbnails für das Strom-Video, 1280x720, im Stil des Videos (Figur „Funke“, Kreise mit Zeichen-Gesichtern).
// Drei Varianten für YouTubes „Testen und vergleichen“.
//   node projects/strom-video/thumbnail.mjs  ->  out/thumbnail_A.png, _B.png, _C.png
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');
const W = 1280, H = 720;
const C = { S: '#ffd400', G: '#e0e0e0', P: '#924ef6', O: '#ff741c', GR: '#03b84c', BL: '#006aff', D: '#262626', W: '#ffffff' };
const BOLT = [[10, -100], [-45, 10], [-5, 10], [-20, 100], [45, -15], [5, -15], [25, -100]];

function eye(x, ch, px, py, s, rot) {
  x.save(); x.translate(px, py); x.rotate(rot); x.beginPath();
  const l = (a, b, c, d) => { x.moveTo(a * s, b * s); x.lineTo(c * s, d * s); };
  if (ch === 'o') x.ellipse(0, 0, 0.62 * s, 0.75 * s, 0, 0, Math.PI * 2);
  if (ch === 'O') x.ellipse(0, 0, 0.8 * s, 0.95 * s, 0, 0, Math.PI * 2);
  if (ch === '>') { x.moveTo(-0.7 * s, -0.8 * s); x.lineTo(0.7 * s, 0); x.lineTo(-0.7 * s, 0.8 * s); }
  if (ch === '<') { x.moveTo(0.7 * s, -0.8 * s); x.lineTo(-0.7 * s, 0); x.lineTo(0.7 * s, 0.8 * s); }
  if (ch === '+') { l(-0.8, 0, 0.8, 0); l(0, -0.8, 0, 0.8); }
  if (ch === '*') for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + Math.PI / 2; l(-Math.cos(a), -Math.sin(a), Math.cos(a), Math.sin(a)); }
  if (ch === '^') { x.moveTo(-0.7 * s, 0.8 * s); x.lineTo(0, -0.8 * s); x.lineTo(0.7 * s, 0.8 * s); }
  if (ch === '-') l(-0.8, 0, 0.8, 0);
  x.stroke(); x.restore();
}
function face(x, cx, cy, r, col, e, eyeCol = '#000') {
  x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  if (!e) return;
  x.strokeStyle = eyeCol; x.lineWidth = r * 0.09; x.lineCap = 'butt'; x.lineJoin = 'miter';
  eye(x, e[0], cx - r * 0.36, cy - r * 0.08, r * 0.2, -0.12); eye(x, e[1], cx + r * 0.36, cy - r * 0.14, r * 0.2, 0.1);
}
function spark(x, cx, cy, r, e, { tail = 0, sparks = true } = {}) {
  if (tail > 0) {
    x.strokeStyle = C.S; x.lineWidth = r * 0.16; x.lineJoin = 'miter'; x.lineCap = 'butt'; x.beginPath(); x.moveTo(cx - r * 0.8, cy);
    for (let k = 1; k <= 4; k++) x.lineTo(cx - r * 0.8 - (r * 2.2 * tail * k) / 4, cy + (k % 2 ? -1 : 1) * r * 0.32 * (1 - k * 0.12));
    x.stroke();
  }
  x.save(); x.translate(cx + r * 0.13, cy - r * 1.12); x.rotate(0.3); x.scale(r * 0.006, r * 0.006);
  x.fillStyle = C.S; x.beginPath(); BOLT.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); x.restore();
  if (sparks) {
    x.strokeStyle = C.S; x.lineWidth = r * 0.07;
    for (const a of [-2.6, -0.5, 0.35, 2.75, 1.95]) { const r1 = r * 1.16, len = r * 0.26; x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * (r1 + len), cy + Math.sin(a) * (r1 + len)); x.stroke(); }
  }
  face(x, cx, cy, r, C.S, e);
}
function text(x, parts, px, py, size, align = 'left') {
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.03}px`;
  const total = parts.reduce((a, [s]) => a + x.measureText(s).width, 0);
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  for (const [s, col] of parts) { x.fillStyle = col; x.fillText(s, cx, py); cx += x.measureText(s).width; }
  x.letterSpacing = '0px';
}
function canvas() { const c = createCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); return [c, x]; }
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }

// A: Zahl als Neugier-Lücke – 380.000 V -> 230 V, geschockter Funke
{
  const [c, x] = canvas();
  face(x, 90, 90, 95, C.O, '++'); face(x, 70, 660, 110, C.P, 'oo'); face(x, 660, 690, 70, C.GR, '^^');
  spark(x, 320, 410, 205, 'OO', { tail: 0 });
  text(x, [['380.000 V', C.W]], 1230, 300, 120, 'right');
  text(x, [['↓', C.S]], 1000, 440, 120, 'center');
  text(x, [['230 V', C.S]], 1230, 600, 170, 'right');
  await save(c, 'thumbnail_A.png');
}
// B: Frage – „Woher kommt dein STROM?“, Funke schaut aus der Steckdose
{
  const [c, x] = canvas();
  face(x, 1110, 470, 250, C.G, null);
  x.fillStyle = '#000'; for (const dx of [-95, 95]) { x.beginPath(); x.arc(1110 + dx, 470, 30, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = C.GR; for (const dy of [-205, 205]) { x.beginPath(); x.roundRect(1070, 470 + dy - 18, 80, 36, 10); x.fill(); }
  spark(x, 1110, 235, 110, '><');
  text(x, [['Woher kommt', C.W]], 70, 250, 112);
  text(x, [['dein ', C.W], ['Strom?', C.S]], 70, 390, 132);
  face(x, 150, 580, 70, C.O, '++'); face(x, 330, 600, 55, C.P, 'oo'); face(x, 480, 585, 62, C.BL, '^^');
  await save(c, 'thumbnail_B.png');
}
// C: Die Reise – Kraftwerk -> Funke mit Schweif -> Steckdose
{
  const [c, x] = canvas();
  text(x, [['Vom Kraftwerk', C.W]], 640, 150, 104, 'center');
  text(x, [['bis zur ', C.W], ['Steckdose', C.S]], 640, 270, 104, 'center');
  face(x, 190, 520, 150, C.O, '++');
  face(x, 1090, 520, 150, C.G, null);
  x.fillStyle = '#000'; for (const dx of [-55, 55]) { x.beginPath(); x.arc(1090 + dx, 520, 20, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = C.S; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(380 + i * 34, 520, 8, 0, Math.PI * 2); x.fill(); }
  spark(x, 720, 520, 125, '><', { tail: 1.0, sparks: true });
  await save(c, 'thumbnail_C.png');
}
