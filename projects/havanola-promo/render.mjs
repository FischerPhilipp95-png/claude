// HAVANOLA Werbevideo im Morph-Stil (Grammatik: refs/ref-05): eine Einstellung ohne Schnitt,
// jedes Objekt verwandelt sich ins nächste. 1080x1920, 60 fps, 18 Takte à 144 BPM = 30 s.
// Ablauf: shotlist.md, Stil: style_guide.md, Marke und Fotos: assets/havanola/.
//   node projects/havanola-promo/render.mjs --timeline        timeline.json + cues.json
//   node projects/havanola-promo/render.mjs --contact         Übersicht zur Abnahme
//   node projects/havanola-promo/render.mjs --still 5,12.5    einzelne Frames
//   node projects/havanola-promo/render.mjs [--from s --to s] Video (stumm) nach out/video.mp4
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const A = (f) => path.join(ROOT, 'assets/havanola', f);
const W = 1080, H = 1920, FPS = 60, CX = 540, OY = 760, CAP_Y = 1215;
for (const [w, n] of [[300, 'LatoL'], [400, 'LatoR'], [700, 'LatoB'], [900, 'LatoK']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Lato-${w}.ttf`), n);

// ---------- Marke ----------
const C = { ink: '#141414', roof: '#2A2A2A', sand: '#CBB492', sandD: '#A88F66', pet: '#35738A', petD: '#1F4F60', petL: '#8FB8C6', gray: '#9A9A96', white: '#FFFFFF', cap: '#2B2B2B' };

// ---------- Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x)); // federt über
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixCol = (a, b, t) => { const p = hex(a), q = hex(b); return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], t))).join(',')})`; };
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- Takt ----------
const BPM = 144, BEAT = 60 / BPM, BAR = 4 * BEAT, N_BARS = 18, DUR = N_BARS * BAR;
const bt = (n) => n * BEAT;          // Zeit von Beat n
const STOP = 16 * BAR;               // Musik endet
const sinceBeat = (t) => t - Math.floor(t / BEAT + 1e-6) * BEAT;

// Zeitplan (Sekunden), alles auf Beats (shotlist.md)
const T = {
  bars: [0.15, bt(2)], bend: [bt(2), bt(4)], fill: [bt(4), bt(5)], door: bt(4.5), win: [bt(5), bt(5.5)],
  age: [bt(6), bt(8), bt(10)], zoom: [bt(12), bt(14)], hole: bt(14), shaft: bt(14.5), flip: bt(15.5),
  coin: bt(18), spin: bt(19), ring: bt(21),
  scale: bt(24), tilt: bt(26),
  eye: bt(30), blink: bt(33), look: bt(34),
  frame: bt(36), wipe: bt(39), grid: bt(40.5),
  ring6: bt(46), portraits: bt(46.75),
  merge: bt(52), pin: bt(53), drop: bt(54), land: bt(55),
  phone: bt(58), type: [bt(59), bt(61)],
  logo: bt(62), word: bt(64.5), sub: bt(65.5), tag: bt(67), url: bt(68.5),
};
const CAPS = [
  ['Geerbt. Abgewohnt. Zu groß?', [bt(6), bt(8), bt(10)], bt(11.4)],
  ['Wir kaufen direkt.', bt(14.5), bt(17.4)],
  ['Provisionsfrei.', bt(20), bt(23.4)],
  ['Fairer Preis.', bt(26), bt(29.4)],
  ['Wir kaufen „wie gesehen“.', bt(32), bt(35.4)],
  ['Aus alt wird neu.', bt(42), bt(45.4)],
  ['Menschen, nicht Systeme.', bt(47.5), bt(51.4)],
  ['Aschaffenburg · Miltenberg', bt(55.5), bt(57.6)],
  ['06021 – 44 99 667', bt(59), bt(61.6)],
];

// ---------- Zeichnen: Grundlagen ----------
function background(ctx, t) {
  const g = ctx.createRadialGradient(CX, OY - 60, 80, CX, OY, 1350);
  g.addColorStop(0, '#F1F0EE'); g.addColorStop(0.55, '#E4E2DE'); g.addColorStop(1, '#CFCCC7');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const white = 1 - easeInOut(seg(t, 0.7, 1.6));   // Anfang auf Weiß wie in der Referenz
  if (white > 0) { ctx.fillStyle = `rgba(255,255,255,${white})`; ctx.fillRect(0, 0, W, H); }
}
function shadowOn(ctx, a = 0.16, blur = 50, dy = 24) { ctx.shadowColor = `rgba(45,38,30,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; }
function shadowOff(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function lineSeg(ctx, x0, y0, x1, y1, w, col, alpha = 1) {
  if (alpha <= 0 || w <= 0) return;
  ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.globalAlpha = 1;
}
function circle(ctx, x, y, r, col, alpha = 1) { if (r <= 0 || alpha <= 0) return; ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh);
}

// Kleine Textzeile unter dem Objekt: Wörter federn einzeln herein, am Ende nach oben weg
function caption(ctx, t, str, t0, t1, size = 54, font = 'LatoR', col = C.cap, y = CAP_Y) {
  const starts = Array.isArray(t0) ? t0 : null;
  ctx.font = `${size}px ${font}`;
  const words = str.split(' '), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const out = easeIn(seg(t, t1 - 0.3, t1));
  let x = CX - total / 2;
  words.forEach((w, i) => {
    const ts = starts ? starts[Math.min(i, starts.length - 1)] : t0 + i * 0.07;
    const p = spring(seg(t, ts, ts + 0.5)), a = clamp(seg(t, ts, ts + 0.2)) * (1 - out);
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText(w, x, y + (1 - p) * 26 - out * 20); ctx.globalAlpha = 1; }
    x += ws[i] + sp;
  });
}

// ---------- Formen als Punktlisten (für echte Morphs) ----------
const N = 160;
function resample(pts, n = N) {
  const d = [0];
  for (let i = 1; i <= pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i % pts.length]; d.push(d[i - 1] + Math.hypot(x1 - x0, y1 - y0)); }
  const L = d[d.length - 1], out = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / n) * L;
    while (d[k + 1] < s) k++;
    const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length], u = (s - d[k]) / (d[k + 1] - d[k] || 1);
    out.push([lerp(x0, x1, u), lerp(y0, y1, u)]);
  }
  return out;
}
// Alle Formen starten unten in der Mitte und laufen im Uhrzeigersinn über links nach oben
function circlePts(r, cx = 0, cy = 0) { const p = []; for (let i = 0; i < N; i++) { const a = Math.PI / 2 + (i / N) * Math.PI * 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
function pinPts(r = 100, cy = -60, tip = 170) {
  const d = tip - cy, beta = Math.acos(r / d), p = [[0, tip]];
  for (let i = 0; i <= 120; i++) { const a = Math.PI / 2 + beta + (i / 120) * (2 * Math.PI - 2 * beta); p.push([r * Math.cos(a), cy + r * Math.sin(a)]); }
  return resample(p);
}
function rrectPts(w, h, r) {
  const p = [[0, h / 2]], c = (cx, cy, a0) => { for (let i = 0; i <= 12; i++) { const a = a0 + (i / 12) * Math.PI / 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  c(-w / 2 + r, h / 2 - r, Math.PI / 2); c(-w / 2 + r, -h / 2 + r, Math.PI); c(w / 2 - r, -h / 2 + r, -Math.PI / 2); c(w / 2 - r, h / 2 - r, 0);
  return resample(p);
}
const morph = (a, b, t) => a.map(([x, y], i) => [lerp(x, b[i][0], t), lerp(y, b[i][1], t)]);
function fillPts(ctx, pts, col) { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); }

// ---------- Assets ----------
const IMG = {};
async function loadAssets() {
  IMG.logo = await loadImage(A('logo_black.png'));
  for (const k of ['p_cb', 'p_mk', 'p_wm', 'p_jp', 'p_am', 'p_ae']) IMG[k] = await loadImage(A(k + '.jpg'));
  for (const r of ROOMS) for (const k of ['vorher', 'nachher']) IMG[`${r}_${k}`] = await loadImage(A(`ba/${r}_${k}.jpg`));
}
const ROOMS = ['eltern', 'ess', 'wohn', 'bad', 'buero', 'kind1', 'kind2', 'treppe'];
const TEAM = ['p_cb', 'p_mk', 'p_wm', 'p_jp', 'p_am', 'p_ae'];

// ================= Szenen (Ursprung = Objektmitte, ctx ist schon verschoben) =================

// 1–2: Logo-Balken -> Haus -> altes Haus
const KNOB = [30, 138];
function house(ctx, t) {
  const pBars = expOut(seg(t, T.bars[0], T.bars[1]));
  const pb = easeInOut(seg(t, T.bend[0], T.bend[1]));
  const pw = easeInOut(seg(t, T.bend[0] + BEAT, T.bend[1] + BEAT * 0.5));
  const pf = easeOut(seg(t, T.fill[0], T.fill[1]));
  const age = seg(t, T.age[0], T.age[2] + BEAT);
  const hit = (tt) => (t >= tt ? Math.exp(-(t - tt) * 7) * Math.sin((t - tt) * 30) : 0); // kleines Zucken auf dem Beat
  const squash = 1 - 0.035 * (hit(T.age[0]) + hit(T.age[1]) + hit(T.age[2]));
  ctx.save(); ctx.translate(0, 200); ctx.scale(1 / squash, squash); ctx.translate(0, -200);
  const half = 260 * pBars, bw = 20;
  // Körper (weiß, mit Schatten), wird mit dem Alter gräulich
  if (pf > 0) {
    shadowOn(ctx, 0.16 * pf); ctx.globalAlpha = pf; ctx.fillStyle = mixCol('#FFFFFF', '#E3DDD1', age);
    ctx.fillRect(-200, -60, 400, 260); shadowOff(ctx); ctx.globalAlpha = 1;
  }
  // Dach: aus dem oberen Balken
  const L0 = [[-half, -150], [0, -150]], L1 = [[-235, -45], [0, -250]];
  const lx0 = lerp(L0[0][0], L1[0][0], pb), ly0 = lerp(L0[0][1], L1[0][1], pb), ax = 0, ay = lerp(-150, -250, pb);
  if (pf > 0) {
    ctx.globalAlpha = pf; ctx.fillStyle = mixCol(C.roof, '#55504A', age);
    ctx.beginPath(); ctx.moveTo(-235, -45); ctx.lineTo(0, -250); ctx.lineTo(235, -45); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    if (age > 0.55) { ctx.fillStyle = mixCol('#FFFFFF', '#E3DDD1', age); ctx.beginPath(); ctx.moveTo(110, -150); ctx.lineTo(150, -114); ctx.lineTo(96, -118); ctx.closePath(); ctx.globalAlpha = seg(age, 0.55, 0.7); ctx.fill(); ctx.globalAlpha = 1; }
  }
  lineSeg(ctx, lx0, ly0, ax, ay, bw, C.ink);
  lineSeg(ctx, -lx0, ly0, -ax, ay, bw, C.ink);
  // Boden aus dem unteren Balken, Wände wachsen
  const fx = lerp(half, 200, pb);
  lineSeg(ctx, -fx, 200, fx, 200, bw * (1 - pf) + 0.01, C.ink, 1 - pf);
  lineSeg(ctx, -200, 200, -200, lerp(200, -60, pw), bw * (1 - pf) + 0.01, C.ink, pw * (1 - pf));
  lineSeg(ctx, 200, 200, 200, lerp(200, -60, pw), bw * (1 - pf) + 0.01, C.ink, pw * (1 - pf));
  // Tür, Knauf, Fenster (federn herein)
  const pd = spring(seg(t, T.door, T.door + 0.6));
  if (pd > 0) {
    ctx.save(); ctx.translate(0, 200); ctx.scale(1, pd); ctx.fillStyle = mixCol(C.pet, '#77868A', age); rrect(ctx, -48, -140, 96, 140, 10); ctx.fill(); ctx.restore();
    circle(ctx, KNOB[0], KNOB[1], 10 * spring(seg(t, T.door + 0.25, T.door + 0.7)), C.sand);
  }
  [[-150, T.win[0], 1], [150, T.win[1], -1]].forEach(([wx, tw, side], i) => {
    const p = spring(seg(t, tw, tw + 0.55));
    if (p <= 0) return;
    ctx.save(); ctx.translate(wx - 38, -8);
    if (i === 0) ctx.rotate(0.21 * spring(seg(t, T.age[1], T.age[1] + 0.7)));        // Fenster hängt schief
    ctx.scale(p, p); ctx.fillStyle = mixCol('#CFE0E6', '#B5B2AA', age); rrect(ctx, 0, 0, 76, 76, 6); ctx.fill();
    ctx.strokeStyle = mixCol('#FFFFFF', '#D8D2C6', age); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(38, 76); ctx.moveTo(0, 38); ctx.lineTo(76, 38); ctx.stroke();
    ctx.restore();
  });
  // Riss
  const pc = easeOut(seg(t, T.age[0], T.age[0] + 0.3));
  if (pc > 0) {
    const crack = [[-95, -60], [-80, -20], [-104, 10], [-86, 50], [-100, 90]];
    ctx.strokeStyle = '#8A857C'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    const n = pc * (crack.length - 1);
    crack.forEach(([x, y], i) => { if (i <= n) (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); });
    const k = Math.floor(n); if (k < crack.length - 1) { const u = n - k; ctx.lineTo(lerp(crack[k][0], crack[k + 1][0], u), lerp(crack[k][1], crack[k + 1][1], u)); }
    ctx.stroke();
  }
  ctx.restore();
  // abblätternde Farbe: Flocken fallen
  if (t > T.age[1]) {
    const r = rand(12);
    for (let i = 0; i < 16; i++) {
      const t0 = T.age[1] + r() * 1.3, x0 = -180 + r() * 360, y0 = -40 + r() * 180, sz = 5 + r() * 9, dt = t - t0;
      if (dt < 0 || dt > 1.4) continue;
      ctx.save(); ctx.translate(x0 + Math.sin(dt * 5 + i) * 12, y0 + dt * dt * 260); ctx.rotate(dt * 6 + i);
      ctx.globalAlpha = 1 - dt / 1.4; ctx.fillStyle = '#D8D2C6'; ctx.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66); ctx.restore(); ctx.globalAlpha = 1;
    }
  }
}

// 3: Schlüssel (Ursprung = Kopfmitte beim Zoom-Ende)
function keyShape(ctx, t, headR, holeR, shaft, flip, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.scale(flip, 1);
  const g = ctx.createLinearGradient(-headR, -headR, headR, headR * 3);
  g.addColorStop(0, '#DCC8A6'); g.addColorStop(0.5, C.sand); g.addColorStop(1, C.sandD);
  shadowOn(ctx, 0.18 * alpha, 40, 20);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, headR, 0, Math.PI * 2);
  if (shaft > 0) {
    ctx.rect(-22, headR * 0.7, 44, shaft);
    if (shaft > 120) { ctx.rect(22, headR * 0.7 + shaft - 110, 52 * clamp((shaft - 120) / 150), 34); ctx.rect(22, headR * 0.7 + shaft - 50, 38 * clamp((shaft - 120) / 150), 34); }
  }
  if (holeR > 0) { ctx.moveTo(holeR, -headR * 0.3); ctx.arc(0, -headR * 0.3, holeR, 0, Math.PI * 2, true); } // Loch (Gegenrichtung)
  ctx.fill('nonzero'); shadowOff(ctx);
  // Glanzkante
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, headR - 8, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  ctx.restore();
}

// 4: Münze
function coin(ctx, t, r, spin, faceA, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  const sx = Math.cos(spin * Math.PI * 2), edge = Math.abs(Math.sin(spin * Math.PI * 2)) * 16;
  shadowOn(ctx, 0.2 * alpha, 46, 22);
  ctx.fillStyle = C.sandD; ctx.beginPath(); ctx.ellipse(edge * Math.sign(Math.sin(spin * 6.283)), 0, Math.max(1, r * Math.abs(sx)), r, 0, 0, Math.PI * 2); ctx.fill();
  shadowOff(ctx);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#E6D6BA'); g.addColorStop(1, C.sand);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, r * Math.abs(sx)), r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.sandD; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, r * 0.82 * Math.abs(sx)), r * 0.82, 0, 0, Math.PI * 2); ctx.stroke();
  if (faceA > 0 && sx > 0.2) {
    ctx.save(); ctx.scale(sx, 1); ctx.globalAlpha = alpha * faceA;
    ctx.font = `${Math.round(r * 0.72)}px LatoB`; ctx.fillStyle = C.ink; const s = '0 %', w = ctx.measureText(s).width;
    ctx.fillText(s, -w / 2, r * 0.25); ctx.restore();
  }
  ctx.restore();
}

// 5: Waage (Drehpunkt oben)
const PIV = [0, -170];
function balance(ctx, t, p, tilt, alpha = 1, pansIn = 0) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const post = easeOut(seg(p, 0.15, 0.55)), beam = easeOut(seg(p, 0.3, 0.7)), strings = spring(seg(p, 0.5, 1));
  lineSeg(ctx, 0, PIV[1], 0, PIV[1] + 390 * post, 12, C.ink, alpha);
  if (post > 0.8) { ctx.globalAlpha = alpha * seg(post, 0.8, 1); ctx.fillStyle = C.ink; rrect(ctx, -120, PIV[1] + 380, 240, 22, 11); ctx.fill(); ctx.globalAlpha = alpha; }
  const bl = 280 * beam, ca = Math.cos(tilt), sa = Math.sin(tilt);
  const ends = [[-bl * ca, PIV[1] - bl * sa], [bl * ca, PIV[1] + bl * sa]];
  lineSeg(ctx, ends[0][0], ends[0][1], ends[1][0], ends[1][1], 12, C.ink, alpha);
  ends.forEach(([ex, ey]) => {
    const drop = 190 * strings, px = ex * (1 - pansIn), py = lerp(ey + drop, 0, pansIn);
    if (strings <= 0) return;
    lineSeg(ctx, ex, ey, px - 85, py, 3, C.ink, alpha * (1 - pansIn));
    lineSeg(ctx, ex, ey, px + 85, py, 3, C.ink, alpha * (1 - pansIn));
    shadowOn(ctx, 0.14 * alpha, 30, 16);
    ctx.fillStyle = C.sand; ctx.beginPath(); ctx.moveTo(px - 95, py); ctx.quadraticCurveTo(px, py + 70, px + 95, py); ctx.closePath(); ctx.fill(); shadowOff(ctx);
  });
  ctx.restore();
}

// 6: Auge (Mittelpunkt 0,0)
function eye(ctx, t, open, lid, lookX, irisR, alpha = 1) {
  if (alpha <= 0) return;
  const w = 280, k = 250 * lid * open;
  ctx.save(); ctx.globalAlpha = alpha;
  const almond = () => { ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, -k, w, 0); ctx.quadraticCurveTo(0, k, -w, 0); ctx.closePath(); };
  shadowOn(ctx, 0.12 * alpha, 40, 18); almond(); ctx.fillStyle = '#FFFFFF'; ctx.fill(); shadowOff(ctx);
  ctx.save(); almond(); ctx.clip();
  const g = ctx.createRadialGradient(lookX - 20, -20, 5, lookX, 0, irisR);
  g.addColorStop(0, C.petL); g.addColorStop(1, C.pet);
  circle(ctx, lookX, 0, irisR, g); circle(ctx, lookX, 0, irisR * 0.42, C.ink); circle(ctx, lookX - irisR * 0.3, -irisR * 0.32, irisR * 0.13, '#FFFFFF', 0.9);
  ctx.restore();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineJoin = 'round'; almond(); ctx.stroke();
  ctx.restore();
}

// 7: Bilderrahmen mit Vorher/Nachher
function roomFrame(ctx, room, x, y, w, h, radius, wipe, alpha = 1, reveal = 1, label = true) {
  if (alpha <= 0 || w < 2) return;
  ctx.save(); ctx.globalAlpha = alpha;
  shadowOn(ctx, 0.16 * alpha, 40, 20); ctx.fillStyle = '#FFFFFF'; rrect(ctx, x - w / 2, y - h / 2, w, h, radius); ctx.fill(); shadowOff(ctx);
  const b = Math.max(3, w * 0.028);
  ctx.save(); rrect(ctx, x - w / 2 + b, y - h / 2 + b, w - 2 * b, h - 2 * b, Math.max(0, radius - b)); ctx.clip();
  if (reveal < 1) { ctx.beginPath(); ctx.arc(x, y, Math.hypot(w, h) / 2 * reveal, 0, Math.PI * 2); ctx.clip(); }
  const ix = x - w / 2 + b, iy = y - h / 2 + b, iw = w - 2 * b, ih = h - 2 * b;
  cover(ctx, IMG[`${room}_vorher`], ix, iy, iw, ih);
  if (wipe > 0) {
    const wx = ix + iw * wipe;
    ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, wx - ix, ih); ctx.clip(); cover(ctx, IMG[`${room}_nachher`], ix, iy, iw, ih); ctx.restore();
    if (wipe < 1) { ctx.fillStyle = C.sand; ctx.fillRect(wx - 3, iy, 6, ih); }
  }
  if (label && w > 300) {
    const lbl = wipe > 0.5 ? 'Nachher' : 'Vorher';
    ctx.font = '28px LatoR'; const lw = ctx.measureText(lbl).width + 34;
    ctx.fillStyle = 'rgba(255,255,255,0.93)'; rrect(ctx, ix + 18, iy + 18, lw, 46, 23); ctx.fill();
    ctx.fillStyle = wipe > 0.5 ? C.pet : C.ink; ctx.fillText(lbl, ix + 35, iy + 51);
  }
  ctx.restore(); ctx.restore();
}

// ================= Ablauf =================
function drawScene(ctx, t) {
  // ---------- 1–3: Haus, Zoom in den Türknauf ----------
  if (t < T.zoom[1]) {
    const z = easeInOut(seg(t, T.zoom[0], T.zoom[1]));
    const s = Math.pow(11, z);                                   // Knauf (r 10) -> Schlüsselkopf (r 110)
    ctx.save(); ctx.scale(s, s); ctx.translate(-KNOB[0] * z, -KNOB[1] * z);
    house(ctx, t);
    ctx.restore();
    return;
  }
  // ---------- 3–4: Schlüssel -> Münze ----------
  if (t < T.scale) {
    const up = spring(seg(t, T.shaft, T.shaft + 0.7)), back = easeInOut(seg(t, T.coin, T.coin + 0.45));
    const cy = lerp(0, -150, up) * (1 - back);
    const hole = spring(seg(t, T.hole, T.hole + 0.5)) * 34 * (1 - easeIn(seg(t, T.coin, T.coin + 0.25)));
    const shaft = 330 * spring(seg(t, T.shaft, T.shaft + 0.7)) * (1 - easeIn(seg(t, T.coin, T.coin + 0.35)));
    const fl = seg(t, T.flip, T.flip + 0.4), flip = Math.cos(Math.PI * easeInOut(fl)) * (fl < 1 ? 1 : 1);
    const r = lerp(110, 170, spring(seg(t, T.coin + 0.2, T.coin + 0.9)));
    ctx.save(); ctx.translate(0, cy);
    if (t < T.coin + 0.3) keyShape(ctx, t, r, hole, shaft, Math.abs(flip) < 0.02 ? 0.02 : flip);
    else {
      const spin = easeInOut(seg(t, T.spin, T.spin + 0.7));
      coin(ctx, t, r, spin, easeOut(seg(t, T.spin + 0.45, T.spin + 0.8)));
      const pr = easeInOut(seg(t, T.ring, T.ring + 0.5));
      if (pr > 0) { ctx.strokeStyle = C.pet; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r + 38, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
    return;
  }
  // ---------- 5: Münze -> Drehpunkt der Waage ----------
  if (t < T.eye) {
    const sh = easeInOut(seg(t, T.scale, T.scale + 0.45));
    const p = seg(t, T.scale + 0.2, T.scale + 1.3);
    const dt = t - T.tilt, tilt = dt > 0 ? 0.22 * Math.exp(-dt * 1.6) * Math.cos(dt * 6.5) : 0.22 * easeOut(seg(t, T.scale + 0.5, T.tilt));
    balance(ctx, t, p, tilt);
    const r = lerp(170, 26, sh), y = lerp(0, PIV[1], sh);
    ctx.save(); ctx.translate(0, y); coin(ctx, t, r, 0, 1 - seg(sh, 0, 0.3)); ctx.restore();
    const ring = 1 - seg(sh, 0, 0.5);
    if (ring > 0) { ctx.globalAlpha = ring; ctx.strokeStyle = C.pet; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, y, r + 38 * ring, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    return;
  }
  // ---------- 6: Waage -> Auge ----------
  if (t < T.frame) {
    const m = easeInOut(seg(t, T.eye, T.eye + 0.55));
    if (m < 1) {
      ctx.save(); ctx.globalAlpha = 1 - m; balance(ctx, t, 1, 0, 1 - m, m); ctx.restore();
    }
    // Balken biegt sich zum Lid, Drehpunkt wird zur Iris
    const blinkP = seg(t, T.blink, T.blink + 0.28), lid = blinkP > 0 && blinkP < 1 ? 1 - Math.sin(Math.PI * blinkP) * 0.96 : 1;
    const look = t < T.look ? 0 : t < T.look + 0.45 ? -80 * spring(seg(t, T.look, T.look + 0.45)) : t < T.look + 0.9 ? lerp(-80, 80, spring(seg(t, T.look + 0.45, T.look + 0.9))) : lerp(80, 0, spring(seg(t, T.look + 0.9, T.look + 1.3)));
    ctx.save(); ctx.translate(0, lerp(PIV[1], 0, m));
    eye(ctx, t, m, lid, look, lerp(26, 92, spring(seg(t, T.eye + 0.1, T.eye + 0.7))), clamp(m * 1.5));
    ctx.restore();
    return;
  }
  // ---------- 7: Pupille -> Rahmen -> Raster ----------
  const FW = 490, FH = 815;
  const cellW = 222, cellH = 368, gap = 22;
  const cellPos = (i) => [(i % 4 - 1.5) * (cellW + gap), (Math.floor(i / 4) - 0.5) * (cellH + gap)];
  if (t < T.ring6) {
    const g = spring(seg(t, T.frame, T.frame + 0.8));
    const eyeOut = easeOut(seg(t, T.frame, T.frame + 0.22));
    if (eyeOut < 1) eye(ctx, t, 1 - eyeOut, 1, 0, 92, 1 - eyeOut);
    const toGrid = seg(t, T.grid, T.grid + 0.9);
    ROOMS.forEach((room, i) => {
      const [gx, gy] = cellPos(i);
      const pi = spring(seg(t, T.grid + i * 0.05, T.grid + 0.75 + i * 0.05));
      let x, y, w, h, rad, a = 1, wipe;
      if (i === 0) {
        w = lerp(38, FW, g); h = lerp(38, FH, g); rad = lerp(19, 30, g);
        x = lerp(0, gx, pi); y = lerp(0, gy, pi); w = lerp(w, cellW, pi); h = lerp(h, cellH, pi); rad = lerp(rad, 18, pi);
        wipe = easeInOut(seg(t, T.wipe, T.wipe + 0.4));
      } else {
        if (toGrid <= 0) return;
        x = gx * pi; y = gy * pi; w = cellW * pi; h = cellH * pi; rad = 18; a = clamp(pi * 2);
        const tw = T.grid + 0.7 + i * 0.12; wipe = easeInOut(seg(t, tw, tw + 0.35));
      }
      roomFrame(ctx, room, x, y, w, h, rad, wipe, a, i === 0 ? easeOut(seg(t, T.frame + 0.15, T.frame + 0.7)) : 1, i === 0 && pi < 0.3);
    });
    return;
  }
  // ---------- 8: Raster -> Ring aus Team-Porträts ----------
  if (t < T.merge) {
    const m = easeInOut(seg(t, T.ring6, T.ring6 + 0.6));
    const rot = Math.max(0, t - (T.ring6 + 0.6)) * 0.45;
    const pulse = Math.exp(-sinceBeat(t) / 0.12) * 0.05 * m;
    ROOMS.forEach((room, i) => {
      const [gx, gy] = cellPos(i);
      if (i >= 6) { roomFrame(ctx, room, gx, gy, cellW * (1 - m), cellH * (1 - m), 18, 1, 1 - m, 1, false); return; }
      const a = -Math.PI / 2 + i * Math.PI / 3 + rot * m;
      const rx = 290 * Math.cos(a), ry = 290 * Math.sin(a);
      const x = lerp(gx, rx, m), y = lerp(gy, ry, m), w = lerp(cellW, 196, m) * (1 + pulse), h = lerp(cellH, 196, m) * (1 + pulse);
      const rad = lerp(18, 98, m);
      const face = easeInOut(seg(t, T.portraits + i * 0.06, T.portraits + 0.4 + i * 0.06));
      roomFrame(ctx, room, x, y, w, h, rad, 1, 1 - face * 0.999, 1, false);
      if (face > 0) {
        ctx.save(); ctx.globalAlpha = face; shadowOn(ctx, 0.16 * face, 34, 16); ctx.fillStyle = '#FFF'; rrect(ctx, x - w / 2, y - h / 2, w, h, rad); ctx.fill(); shadowOff(ctx);
        const b = 7; rrect(ctx, x - w / 2 + b, y - h / 2 + b, w - 2 * b, h - 2 * b, rad - b); ctx.clip();
        cover(ctx, IMG[TEAM[i]], x - w / 2, y - h / 2, w, h, 0.5, 0.28); ctx.restore();
      }
    });
    return;
  }
  // ---------- 9: Ring -> Pin auf Karte ----------
  const pinShape = pinPts();
  const drawMap = (a) => {
    if (a <= 0) return;
    const lines = [[[-520, 140], [520, 60]], [[-160, -600], [-60, 700]], [[180, -600], [300, 700]], [[-520, 380], [520, 300]], [[-520, -200], [520, -140]]];
    lines.forEach(([[x0, y0], [x1, y1]], i) => {
      const p = easeOut(seg(t, T.pin + i * 0.08, T.pin + 0.6 + i * 0.08)) * a;
      lineSeg(ctx, x0, y0, lerp(x0, x1, p), lerp(y0, y1, p), i === 0 ? 7 : 4, i === 0 ? '#BCB8B1' : '#CDCAC4', a);
    });
    ctx.globalAlpha = a * 0.5; ctx.strokeStyle = C.petL; ctx.lineWidth = 14; ctx.beginPath();
    const rp = easeOut(seg(t, T.pin + 0.2, T.pin + 1));
    for (let i = 0; i <= 40 * rp; i++) { const u = i / 40, x = -540 + 1080 * u, y = 330 + Math.sin(u * 5) * 70; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
  };
  if (t < T.phone) {
    const mg = easeIn(seg(t, T.merge, T.merge + 0.4));
    drawMap(1);
    if (mg < 1) {
      TEAM.forEach((k, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 3 + (T.merge - (T.ring6 + 0.6)) * 0.45;
        const x = 290 * Math.cos(a) * (1 - mg), y = 290 * Math.sin(a) * (1 - mg), r = lerp(98, 100, mg);
        ctx.save(); shadowOn(ctx, 0.16, 34, 16); circle(ctx, x, y, r, '#FFF'); shadowOff(ctx);
        ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.clip(); cover(ctx, IMG[k], x - r, y - r, 2 * r, 2 * r, 0.5, 0.28);
        ctx.fillStyle = C.pet; ctx.globalAlpha = mg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
      });
      return;
    }
    const pm = easeInOut(seg(t, T.pin, T.pin + 0.4));
    const hop = t < T.drop ? 0 : t < T.land ? -110 * Math.sin(Math.PI * seg(t, T.drop, T.land)) : -Math.exp(-(t - T.land) * 6) * Math.abs(Math.sin((t - T.land) * 14)) * 40;
    ctx.save(); ctx.translate(0, hop);
    shadowOn(ctx, 0.2, 40, 24); fillPts(ctx, morph(circlePts(100), pinShape, pm), C.pet); shadowOff(ctx);
    circle(ctx, 0, lerp(0, -60, pm), 36 * pm, '#FFFFFF');
    ctx.restore();
    for (let k = 0; k < 2; k++) {
      const p = seg(t, T.land + k * 0.18, T.land + 1.1 + k * 0.18);
      if (p > 0 && p < 1) { ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = C.pet; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 170, 250 * p, 80 * p, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    return;
  }
  // ---------- 10: Pin -> Smartphone ----------
  const PW = 330, PH = 660;
  if (t < T.logo) {
    const m = easeInOut(seg(t, T.phone, T.phone + 0.45));
    drawMap(1 - m);
    ctx.save(); shadowOn(ctx, 0.22, 50, 26);
    fillPts(ctx, morph(pinShape, rrectPts(PW, PH, 54), m), mixCol(C.pet, C.ink, m)); shadowOff(ctx);
    const sc = easeOut(seg(t, T.phone + 0.3, T.phone + 0.6));
    if (sc > 0) {
      ctx.globalAlpha = sc; ctx.fillStyle = '#FAFAF8'; rrect(ctx, -PW / 2 + 14, -PH / 2 + 14, PW - 28, PH - 28, 42); ctx.fill();
      ctx.fillStyle = C.ink; rrect(ctx, -44, -PH / 2 + 26, 88, 22, 11); ctx.fill();
      const lw = 190, lh = lw * IMG.logo.height / IMG.logo.width; ctx.drawImage(IMG.logo, -lw / 2, -PH / 2 + 90, lw, lh);
      const str = '06021 – 44 99 667', n = Math.floor(str.length * seg(t, T.type[0], T.type[1]));
      ctx.font = '31px LatoR'; ctx.fillStyle = C.ink; const s = str.slice(0, n), w = ctx.measureText(str).width;
      ctx.fillText(s, -w / 2, -10);
      if (n < str.length && Math.floor(t * 4) % 2 === 0) ctx.fillRect(-w / 2 + ctx.measureText(s).width + 3, -38, 3, 36);
      const pr = 1 + Math.exp(-sinceBeat(t) / 0.1) * 0.08;
      circle(ctx, 0, PH / 2 - 120, 46 * pr, C.pet);
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, PH / 2 - 120, 20, Math.PI * 0.75, Math.PI * 1.25, true); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    return;
  }
  // ---------- 11: Telefon kippt -> Logo-Balken -> Logo ----------
  const lw = 760, lh = lw * IMG.logo.height / IMG.logo.width, ly = -lh / 2 - 40;
  const barT = 0.058 * lh, bandH = 0.775 * lh;
  const rot = easeInOut(seg(t, T.logo, T.logo + 0.45));            // Phase A: Telefon kippt um 90°
  const shape = easeInOut(seg(t, T.logo + 0.45, T.logo + 0.95));    // Phase B: wird zum Balken-Band des Logos
  const bodyA = 1 - seg(t, T.logo + 0.65, T.logo + 0.95);
  const cy = ly + bandH / 2;
  ctx.save(); ctx.translate(0, lerp(0, cy, shape));
  if (shape <= 0) ctx.rotate(-Math.PI / 2 * rot);
  const ww = shape <= 0 ? PW : lerp(PH, lw, shape), hh = shape <= 0 ? PH : lerp(PW, bandH, shape);
  if (bodyA > 0) { ctx.globalAlpha = bodyA; shadowOn(ctx, 0.22 * bodyA, 50, 26); ctx.fillStyle = C.ink; rrect(ctx, -ww / 2, -hh / 2, ww, hh, lerp(54, 2, shape)); ctx.fill(); shadowOff(ctx); ctx.globalAlpha = 1; }
  if (shape <= 0 && rot < 1) { ctx.globalAlpha = 1 - rot; ctx.fillStyle = '#FAFAF8'; rrect(ctx, -PW / 2 + 14, -PH / 2 + 14, PW - 28, PH - 28, 42); ctx.fill(); ctx.globalAlpha = 1; }
  if (shape > 0.3) { ctx.fillStyle = C.ink; ctx.globalAlpha = seg(shape, 0.3, 0.6); ctx.fillRect(-ww / 2, -hh / 2, ww, barT); ctx.fillRect(-ww / 2, hh / 2 - barT, ww, barT); ctx.globalAlpha = 1; }
  ctx.restore();
  // Schriftzug zwischen den Balken, dann IMMOBILIEN (Bildstreifen aus dem echten Logo)
  const iw = IMG.logo.width, ih = IMG.logo.height, wordP = easeInOut(seg(t, T.word, T.word + 0.5)), subP = seg(t, T.sub, T.sub + 0.8);
  if (wordP > 0) {
    const y0 = 0.07, y1 = 0.7;
    ctx.save(); ctx.beginPath(); ctx.rect(-lw / 2, ly + lh * y0 + lh * (y1 - y0) * (1 - wordP), lw, lh * (y1 - y0) * wordP); ctx.clip();
    ctx.drawImage(IMG.logo, 0, ih * y0, iw, ih * (y1 - y0), -lw / 2, ly + lh * y0 + (1 - wordP) * 40, lw, lh * (y1 - y0)); ctx.restore();
  }
  for (let k = 0; k < 10; k++) {
    const p = easeOut(seg(subP, k * 0.07, k * 0.07 + 0.35));
    if (p <= 0) continue;
    ctx.globalAlpha = p; ctx.drawImage(IMG.logo, iw * k / 10, ih * 0.8, iw / 10, ih * 0.2, -lw / 2 + lw * k / 10, ly + lh * 0.8 + (1 - p) * 12, lw / 10, lh * 0.2); ctx.globalAlpha = 1;
  }
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; shadowOff(ctx);
  background(ctx, t);
  // Objekte bis zum Rahmen etwas größer, danach Originalgröße; leichtes Schweben wie in der Referenz
  const sc = lerp(1.22, 1, easeInOut(seg(t, T.frame, T.frame + 0.6)));
  ctx.save(); ctx.translate(CX, OY + Math.sin(t * 1.7) * 6); ctx.scale(sc, sc); drawScene(ctx, t); ctx.restore();
  for (const [s, t0, t1] of CAPS) caption(ctx, t, s, t0, t1);
  // Schluss: kleine Zeilen unter dem Logo
  const tag = easeOut(seg(t, T.tag, T.tag + 0.5)), url = easeOut(seg(t, T.url, T.url + 0.5));
  if (tag > 0) {
    ctx.font = '52px LatoR'; ctx.globalAlpha = tag; ctx.fillStyle = C.cap; let s = 'Wir kaufen Ihre Immobilie.'; ctx.fillText(s, CX - ctx.measureText(s).width / 2, OY + 250 + (1 - tag) * 14);
    ctx.font = '38px LatoL'; ctx.globalAlpha = url; ctx.fillStyle = '#5E5B56'; s = 'havanola.com'; ctx.fillText(s, CX - ctx.measureText(s).width / 2, OY + 320 + (1 - url) * 14);
    ctx.globalAlpha = 1;
  }
}

// ---------- Sounds (cues.json für tools/sfx.mjs) ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  add(0.2, 'whoosh', 0.35); add(T.bend[0], 'click', 0.35); add(T.fill[0], 'pop', 0.4); add(T.door, 'pop', 0.35);
  T.win.forEach((w) => add(w, 'pop', 0.3));
  add(T.age[0], 'click', 0.45); add(T.age[1], 'thump', 0.35); add(T.age[2], 'click', 0.35);
  add(T.zoom[0] + 0.3, 'whoosh', 0.6); add(T.hole, 'pop', 0.4); add(T.shaft, 'click', 0.3); add(T.flip + 0.2, 'click', 0.6); add(T.flip + 0.26, 'key', 0.5);
  add(T.coin, 'whoosh', 0.35); add(T.spin, 'whoosh', 0.4); add(T.spin + 0.7, 'blip', 0.35); add(T.ring, 'blip', 0.3);
  add(T.scale, 'whoosh', 0.35); add(T.scale + 0.5, 'pop', 0.35); add(T.scale + 0.9, 'pop', 0.3); add(T.tilt, 'click', 0.3);
  add(T.eye, 'whoosh', 0.4); add(T.blink + 0.12, 'key', 0.45);
  add(T.frame, 'whoosh', 0.4); add(T.wipe, 'whoosh', 0.3);
  for (let i = 1; i < 8; i++) add(T.grid + i * 0.05, 'pop', 0.22);
  for (let i = 1; i < 8; i++) add(T.grid + 0.7 + i * 0.12, 'click', 0.2);
  add(T.ring6, 'whoosh', 0.45); for (let i = 0; i < 6; i++) add(T.portraits + i * 0.06, 'pop', 0.2);
  add(T.merge, 'whoosh', 0.45); add(T.pin, 'pop', 0.45); add(T.land, 'thump', 0.5); add(T.land + 0.05, 'blip', 0.3);
  add(T.phone, 'whoosh', 0.45);
  const str = '06021 – 44 99 667';
  for (let i = 1; i <= str.length; i++) if (str[i - 1] !== ' ') add(T.type[0] + (T.type[1] - T.type[0]) * i / str.length, 'key', 0.3);
  add(T.logo, 'whoosh', 0.5); add(T.word, 'click', 0.35);
  return c.filter((q) => q.t < STOP + 1.2).sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, times: T, vo: [] }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number) : Array.from({ length: 24 }, (_, i) => 0.6 + i * 1.22);
    const files = [];
    for (const t of times) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
    if (args[0] === '--contact') {
      const tw = 270, th = 480, cols = 8, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw - 4, th - 4);
        sc.fillStyle = '#fff'; sc.font = '20px LatoR'; sc.fillText(`${t.toFixed(1)} s`, x + 6, y + 22);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png'); fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
    } else console.log(files.map(([f]) => f).join('\n'));
    return;
  }
  const from = arg('--from', 0), to = arg('--to', DUR);
  const outFile = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = Math.round(from * FPS); n < Math.round(to * FPS); n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 300 === 0) process.stdout.write(`\r${(n / FPS).toFixed(1)} / ${to.toFixed(1)} s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
