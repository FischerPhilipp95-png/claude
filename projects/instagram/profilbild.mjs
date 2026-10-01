// Profilbild für den Motion-Design-Instagram-Account, im Stil der Kanal-Videos (refs/ref-03):
// schwarzer Grund, flache Kreise mit Gesichtern aus Zeichen, orange Konstruktionspunkte.
// node projects/instagram/profilbild.mjs  → out/profilbild_A|B|C.png (1080x1080) + out/profilbild_vorschau.png
import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { face, C } from '../strom-video/render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
fs.mkdirSync(OUT, { recursive: true });
const S = 1080, M = S / 2; // Instagram schneidet rund aus: alles Wichtige innerhalb r ≈ 0.42·S

function dots(x, pts, r, col = C.O) {
  x.fillStyle = col;
  for (const [px, py] of pts) { x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); }
}
const arcPts = (cx, cy, R, a0, a1, n) =>
  Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * i / (n - 1); return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });

// A „Bewegung“: orange Hauptfigur springt nach rechts oben, dahinter Nachbilder in Lila/Blau/Grün (Motion-Echo)
function variantA(x) {
  const dir = [-Math.SQRT1_2, Math.SQRT1_2], main = [650, 430, 200];
  const echo = [[140, C.P], [95, C.BL], [60, C.GR]];
  let [px, py, pr] = main; const list = [];
  for (const [r, col] of echo) { const d = pr + r - 28; px += dir[0] * d; py += dir[1] * d; pr = r; list.push([px, py, r, col]); }
  x.save(); x.translate(M, M); x.scale(0.85, 0.85); x.translate(-M, -M);
  list.reverse().forEach(([ex, ey, r, col]) => face(x, ex, ey, r, col, null));
  face(x, main[0], main[1], main[2], C.O, '^^', { seed: 3, squash: -0.05 });
  x.restore();
}

// B „Ensemble“: orange Hauptfigur in der Mitte, drei kleine Figuren auf gepunkteter Umlaufbahn
function variantB(x) {
  x.save(); x.translate(M, M); x.rotate(-0.35);
  dots(x, arcPts(0, 0, 370, 0, Math.PI * 2 * 0.98, 60).map(([a, b]) => [a, b * 0.42]), 9);
  x.restore();
  const orbit = (a) => { const px = 370 * Math.cos(a), py = 370 * 0.42 * Math.sin(a); return [M + px * Math.cos(-0.35) - py * Math.sin(-0.35), M + px * Math.sin(-0.35) + py * Math.cos(-0.35)]; };
  const back = [[3.6, C.BL, 'oo']];
  for (const [a, col, e] of back) { const [px, py] = orbit(a); face(x, px, py, 72, col, e, { seed: 5 }); }
  face(x, M, M, 215, C.O, '**', { seed: 2 });
  for (const [a, col, e] of [[0.55, C.P, '><'], [2.2, C.GR, '^^']]) { const [px, py] = orbit(a); face(x, px, py, 95, col, e, { seed: 9 }); }
}

// C „Squash & Stretch“: Figur prallt auf, gestaucht, Bewegungslinien darüber, Sprungbahn aus orangen Punkten
function variantC(x) {
  dots(x, arcPts(560, 860, 330, Math.PI * 1.08, Math.PI * 1.5, 8), 12);
  x.strokeStyle = C.W; x.lineWidth = 16; x.lineCap = 'round';
  for (const [dx, h] of [[-90, 120], [0, 170], [90, 120]]) { x.beginPath(); x.moveTo(M + 40 + dx, 300 - h * 0.15); x.lineTo(M + 40 + dx, 300 - h); x.stroke(); }
  x.fillStyle = C.D; x.beginPath(); x.ellipse(M + 40, 800, 250, 34, 0, 0, Math.PI * 2); x.fill();
  face(x, M + 40, 560, 230, C.S, '><', { seed: 4, squash: 0.16 });
}

const variants = { A: variantA, B: variantB, C: variantC };
const imgs = {};
for (const [k, fn] of Object.entries(variants)) {
  const cv = createCanvas(S, S), x = cv.getContext('2d');
  x.fillStyle = C.bg; x.fillRect(0, 0, S, S);
  fn(x);
  fs.writeFileSync(path.join(OUT, `profilbild_${k}.png`), cv.toBuffer('image/png'));
  imgs[k] = cv;
}

// Vorschau: rund ausgeschnitten, groß und in Original-Profilgröße, auf dunklem und hellem Grund
const PW = 1500, PH = 760, pv = createCanvas(PW, PH), p = pv.getContext('2d');
p.fillStyle = '#ffffff'; p.fillRect(0, 0, PW, PH / 2); p.fillStyle = '#121212'; p.fillRect(0, PH / 2, PW, PH / 2);
Object.values(imgs).forEach((cv, i) => {
  for (const [row, d, sx] of [[0, 300, 0], [1, 300, 0]]) {
    const cx = 250 + i * 500, cy = row * PH / 2 + PH / 4;
    p.save(); p.beginPath(); p.arc(cx - 70, cy, d / 2, 0, Math.PI * 2); p.clip(); p.drawImage(cv, cx - 70 - d / 2, cy - d / 2, d, d); p.restore();
    p.save(); p.beginPath(); p.arc(cx + 160, cy, 44, 0, Math.PI * 2); p.clip(); p.drawImage(cv, cx + 116, cy - 44, 88, 88); p.restore();
  }
  p.fillStyle = '#888'; p.font = '600 30px sans-serif'; p.fillText('ABC'[i], 250 + i * 500 - 80, 40);
});
fs.writeFileSync(path.join(OUT, 'profilbild_vorschau.png'), pv.toBuffer('image/png'));
console.log('ok');
