// HAVANOLA Werbevideo (Instagram Reels, 1080x1920, 60 fps, 23 Takte à 136 BPM).
// Stil: style_guide.md (Grammatik aus refs/ref-04), Ablauf: shotlist.md, Marke und Fotos: assets/havanola/.
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
const W = 1080, H = 1920, FPS = 60, CX = 540;
const TY = 760; // Mitte der Text-Zone (Reels: oben 14 %, unten 35 % frei lassen)
for (const [w, n] of [[300, 'LatoL'], [400, 'LatoR'], [700, 'LatoB'], [900, 'LatoK']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Lato-${w}.ttf`), n);

// ---------- Marke (style_guide.md) ----------
const C = { bg: '#EFEEEB', ink: '#111111', sand: '#CBB492', pet: '#35738A', petL: '#8FB8C6', cream: '#F3E9D8', petD: '#1F4F60', gray: '#9A9A96', white: '#FFFFFF' };

// ---------- Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const backOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2));
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// ---------- Takt ----------
const BEATS = JSON.parse(fs.readFileSync(path.join(DIR, 'beats.json'), 'utf8'));
const BEAT = 60 / BEATS.bpm, BAR = 4 * BEAT, N_BARS = 23, DUR = N_BARS * BAR;
const bar = (b) => b * BAR;
const sinceBeat = (t) => t - Math.floor(t / BEAT + 1e-6) * BEAT;
const beatNo = (t) => Math.floor(t / BEAT + 1e-6);
const pulse = (t, k = 0.12) => Math.exp(-sinceBeat(t) / k);

// Szenen in Takten (shotlist.md)
const S = {
  intro: [0, 1.5], klammer: [1.5, 3], name: [3, 4], buero: [4, 6], tippen: [6, 8], liste: [8, 10],
  vorher: [10, 13], team: [13, 15], region: [15, 16.5], karten: [16.5, 19.5], wert: [19.5, 20.5], logo: [20.5, 23],
};
for (const k in S) S[k] = S[k].map(bar);

// ---------- Text ----------
function font(ctx, size, w = 'R', ls = 0) { ctx.font = `${size}px Lato${w}`; ctx.letterSpacing = `${ls}px`; }
function tw(ctx, s) { return ctx.measureText(s).width; }
function text(ctx, s, x, y, size, col, w = 'R', align = 'center', alpha = 1, ls = 0) {
  if (alpha <= 0) return 0;
  font(ctx, size, w, ls);
  const width = tw(ctx, s);
  const x0 = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fillText(s, x0, y); ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  return width;
}
// Wörter blenden nacheinander ein, leicht von unten und aus der Unschärfe (wie in der Referenz)
function wordsIn(ctx, s, x, y, size, col, t, t0, stagger = 0.09, w = 'R', align = 'center', out = Infinity) {
  font(ctx, size, w);
  const words = s.split(' '), space = tw(ctx, ' ');
  const widths = words.map((q) => tw(ctx, q));
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const o = 1 - easeIn(seg(t, out, out + 0.3));
  words.forEach((q, i) => {
    const p = easeOut(seg(t, t0 + i * stagger, t0 + i * stagger + 0.35));
    if (p > 0) {
      ctx.save();
      if (p < 1) ctx.filter = `blur(${((1 - p) * 8).toFixed(1)}px)`;
      text(ctx, q, cx, y + (1 - p) * 18, size, col, w, 'left', p * o);
      ctx.restore();
    }
    cx += widths[i] + space;
  });
  return total;
}

// ---------- Formen ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
// 4 schwarze Eck-Quadrate, die leicht driften und auf dem Beat springen
function corners(ctx, t, cx, cy, w, h, alpha = 1, seed = 1, col = C.ink, size = 12) {
  if (alpha <= 0) return;
  const b = beatNo(t), j = easeOut(seg(sinceBeat(t), 0, 0.14));
  ctx.globalAlpha = alpha; ctx.fillStyle = col;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => {
    const o = (n) => (hash(seed * 31 + i * 7 + n * 13) - 0.5) * 60;
    const dx = lerp(o(b - 1), o(b), j) + Math.sin(t * 1.3 + i) * 6, dy = lerp(o(b + 50), o(b + 51), j) + Math.cos(t * 1.1 + i) * 6;
    ctx.fillRect(cx + sx * w / 2 + dx - size / 2, cy + sy * h / 2 + dy - size / 2, size, size);
  });
  ctx.globalAlpha = 1;
}
// Fadenkreuz-Ecken (+) um ein Bild
function crosshairs(ctx, pts, alpha = 1, col = C.ink) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function handles(ctx, pts, alpha = 1) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha; ctx.fillStyle = C.ink;
  for (const [x, y] of pts) ctx.fillRect(x - 8, y - 8, 16, 16);
  ctx.globalAlpha = 1;
}
function arrow(ctx, x, y, dir, len, col, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * len, y);
  ctx.moveTo(x + dir * len - dir * 16, y - 12); ctx.lineTo(x + dir * len, y); ctx.lineTo(x + dir * len - dir * 16, y + 12); ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- Bilder ----------
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const iw = img.width, ih = img.height, s = Math.max(w / iw, h / ih) * zoom, dw = iw * s, dh = ih * s;
  const dx = x + clamp(w / 2 - fx * dw, w - dw, 0), dy = y + clamp(h / 2 - fy * dh, h - dh, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
}
function offscreen(w, h) { const c = createCanvas(Math.round(w), Math.round(h)); return [c, c.getContext('2d')]; }

// Perspektive: Einheitsquadrat -> Viereck (Homographie), Bild in Dreiecken affin gezeichnet
function homography([p0, p1, p2, p3]) {
  const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (Math.abs(dx3) > 1e-6 || Math.abs(dy3) > 1e-6) { const det = dx1 * dy2 - dx2 * dy1; g = (dx3 * dy2 - dx2 * dy3) / det; h = (dx1 * dy3 - dx3 * dy1) / det; }
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u, v) => { const z = g * u + h * v + 1; return [(a * u + b * v + x0) / z, (d * u + e * v + y0) / z]; };
}
function drawTri(ctx, src, s, d) {
  const [[s0x, s0y], [s1x, s1y], [s2x, s2y]] = s, [[d0x, d0y], [d1x, d1y], [d2x, d2y]] = d;
  const den = s0x * (s2y - s1y) - s1x * s2y + s2x * s1y + (s1x - s2x) * s0y;
  if (Math.abs(den) < 1e-9) return;
  const a = -(s0y * (d2x - d1x) - s1y * d2x + s2y * d1x + (s1y - s2y) * d0x) / den;
  const b = (s1y * d2y + s0y * (d1y - d2y) - s2y * d1y + (s2y - s1y) * d0y) / den;
  const c = (s0x * (d2x - d1x) - s1x * d2x + s2x * d1x + (s1x - s2x) * d0x) / den;
  const dd = -(s1x * d2y + s0x * (d1y - d2y) - s2x * d1y + (s2x - s1x) * d0y) / den;
  const e = (s0x * (s2y * d1x - s1y * d2x) + s0y * (s1x * d2x - s2x * d1x) + (s2x * s1y - s1x * s2y) * d0x) / den;
  const f = (s0x * (s2y * d1y - s1y * d2y) + s0y * (s1x * d2y - s2x * d1y) + (s2x * s1y - s1x * s2y) * d0y) / den;
  const mx = (d0x + d1x + d2x) / 3, my = (d0y + d1y + d2y) / 3, grow = (px, py) => { const vx = px - mx, vy = py - my, l = Math.hypot(vx, vy) || 1; return [px + vx / l * 0.9, py + vy / l * 0.9]; };
  ctx.save(); ctx.beginPath();
  const g0 = grow(d0x, d0y), g1 = grow(d1x, d1y), g2 = grow(d2x, d2y);
  ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, dd, e, f); ctx.drawImage(src, 0, 0); ctx.restore();
}
function drawQuad(ctx, src, quad, n = 6, alpha = 1) {
  if (alpha <= 0) return;
  const map = homography(quad), sw = src.width, sh = src.height;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    const P = [map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)];
    const Q = [[u0 * sw, v0 * sh], [u1 * sw, v0 * sh], [u1 * sw, v1 * sh], [u0 * sw, v1 * sh]];
    drawTri(ctx, src, [Q[0], Q[1], Q[2]], [P[0], P[1], P[2]]);
    drawTri(ctx, src, [Q[0], Q[2], Q[3]], [P[0], P[2], P[3]]);
  }
  ctx.globalAlpha = 1;
}
// Karte im Raum: Mitte, Größe, Drehung um Y/X (rad), Tiefe z -> vier Ecken
function quad3d(cx, cy, w, h, ry = 0, rx = 0, z = 0, rz = 0) {
  const F = 1600;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    let x = sx * w / 2, y = sy * h / 2, zz = 0;
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    [x, zz] = [x * Math.cos(ry), x * Math.sin(ry)];
    [y, zz] = [y * Math.cos(rx) - zz * Math.sin(rx), y * Math.sin(rx) + zz * Math.cos(rx)];
    const k = F / (F + zz + z);
    return [cx + x * k, cy + y * k];
  });
}
function shadowQuad(ctx, q, blur = 40, a = 0.18) {
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = 14; ctx.fillStyle = '#fff';
  ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------- Hintergründe ----------
// Wabernde Verlaufsfläche in Markenfarben (Referenz: große weiche Farbflächen)
function gradientBg(ctx, t, mode = 'warm') {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const blobs = mode === 'warm'
    ? [[C.petD, 200, 1800, 900], [C.pet, 820, 1500, 800], [C.sand, 300, 1150, 700], [C.cream, 800, 950, 600], [C.petL, 150, 700, 500]]
    : [[C.petL, 300, 400, 700], [C.cream, 800, 900, 700], [C.sand, 400, 1500, 800], [C.pet, 900, 1800, 700]];
  blobs.forEach(([col, x, y, r], i) => {
    const bx = x + Math.sin(t * 0.5 + i * 1.7) * 90, by = y + Math.cos(t * 0.4 + i * 1.3) * 70;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, col); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
}
// Pixel-Streifen: bunte Blöcke, die über eine Kante wandern (Glitch-Übergang)
function pixelStrip(ctx, t, y, h, p, seed = 3) {
  if (p <= 0 || p >= 1) return;
  const r = rand(seed + Math.floor(t * 30));
  const cols = [C.pet, C.sand, C.petL, C.cream, C.ink, C.petD];
  for (let i = 0; i < 26; i++) {
    const x = r() * W, w = 12 + r() * 90, hh = 6 + r() * h;
    if (r() > 1 - p * 1.4) continue;
    ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.fillRect(x, y + (r() - 0.5) * h, w, hh);
  }
}

// ---------- Assets ----------
const IMG = {};
const PRE = {};
async function loadAssets() {
  const files = ['office_sign', 'team_tablet', 'meeting', 'card', 'p_cb', 'p_mk', 'p_wm', 'p_jp', 'p_am', 'p_ae', 'p_x1', 'p_x3'];
  for (const f of files) IMG[f] = await loadImage(A(f + '.jpg'));
  IMG.logo = await loadImage(A('logo_black.png'));
  for (const r of ['eltern', 'ess', 'bad', 'buero', 'kind1', 'kind2', 'treppe', 'wohn'])
    for (const k of ['vorher', 'nachher']) IMG[`${r}_${k}`] = await loadImage(A(`ba/${r}_${k}.jpg`));
  // Falschfarben-Version vom Büro-Foto (Verlaufs-Map über die Helligkeit)
  {
    const [c, x] = offscreen(1100, 1115 / 2200 * 1100); x.drawImage(IMG.office_sign, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    const stops = [[0, [31, 79, 96]], [0.3, [53, 115, 138]], [0.5, [143, 184, 198]], [0.68, [203, 180, 146]], [0.85, [243, 233, 216]], [1, [255, 255, 255]]];
    for (let i = 0; i < p.length; i += 4) {
      const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255;
      let k = 0; while (k < stops.length - 2 && l > stops[k + 1][0]) k++;
      const [a0, c0] = stops[k], [a1, c1] = stops[k + 1], q = clamp((l - a0) / (a1 - a0));
      p[i] = lerp(c0[0], c1[0], q); p[i + 1] = lerp(c0[1], c1[1], q); p[i + 2] = lerp(c0[2], c1[2], q);
    }
    x.putImageData(d, 0, 0); PRE.officeFalse = c;
  }
  // Halbton-Raster (Referenz: gerasterte Wolken) aus dem Besprechungsfoto, in Petrol auf Weiß
  {
    const [c, x] = offscreen(W, H); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const [s, sx] = offscreen(W / 12, H / 12); cover(sx, IMG.meeting, 0, 0, s.width, s.height, 0.55, 0.5);
    const p = sx.getImageData(0, 0, s.width, s.height).data;
    x.fillStyle = C.petL;
    for (let j = 0; j < s.height; j++) for (let i = 0; i < s.width; i++) {
      const k = (j * s.width + i) * 4, l = (p[k] + p[k + 1] + p[k + 2]) / 765;
      const r = (1 - l) * 7.2;
      if (r > 0.6) { x.beginPath(); x.arc(i * 12 + 6, j * 12 + 6, r, 0, Math.PI * 2); x.fill(); }
    }
    PRE.halftone = c;
  }
  // Punkt-Raster-Farben für das erste Vorher-Foto
  {
    const [s, sx] = offscreen(18, 30); sx.drawImage(IMG.eltern_vorher, 0, 0, 18, 30);
    PRE.dots = sx.getImageData(0, 0, 18, 30).data;
  }
}

// ---------- Szenen ----------
// 1 Intro: unscharfes Porträt im Markenverlauf, Frage blendet ein, Rahmen schrumpft, Glitch-Abgang
function sceneIntro(ctx, t) {
  const [a, b] = S.intro;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const shrink = easeInOut(seg(t, a + 0.9, a + 1.6));
  const collapse = easeIn(seg(t, b - 0.45, b - 0.05));
  const m = lerp(0, 70, shrink), fh = (H - 2 * m - 400 * shrink) * (1 - collapse) + 6 * collapse;
  const fy = lerp(H / 2, TY + 40, shrink) - fh / 2;
  ctx.save(); rrect(ctx, m, fy, W - 2 * m, fh, 24 * shrink); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.cream); g.addColorStop(0.35, C.sand); g.addColorStop(0.7, C.pet); g.addColorStop(1, C.petD);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.filter = 'blur(36px)'; ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'soft-light';
  cover(ctx, IMG.p_x1, -200, -100, W + 400, H + 200, 0.5, 0.25, 1 + 0.05 * (t - a));
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35;
  cover(ctx, IMG.p_x1, -200, -100, W + 400, H + 200, 0.5, 0.25, 1 + 0.05 * (t - a));
  ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  const out = b - 0.5;
  wordsIn(ctx, 'Geerbte, abgewohnte', CX, TY - 10, 72, C.white, t, a + 0.15, 0.12, 'L', 'center', out);
  wordsIn(ctx, 'oder zu große Wohnung?', CX, TY + 78, 72, C.white, t, a + 0.45, 0.12, 'L', 'center', out);
  pixelStrip(ctx, t, fy + fh / 2, 30, seg(t, b - 0.5, b + 0.25));
}

// 2 Klammer-Wörter { Wir } -> { Wir kaufen } -> { Wir kaufen direkt. }
function sceneKlammer(ctx, t) {
  const [a, b] = S.klammer;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  pixelStrip(ctx, t, TY + 330, 16, 1 - seg(t, a, a + 0.5));
  const steps = [[a, 'Wir'], [a + 2 * BEAT, 'Wir kaufen'], [a + 4 * BEAT, 'Wir kaufen direkt.']];
  let k = 0; steps.forEach(([ts], i) => { if (t >= ts) k = i; });
  const size = 88;
  font(ctx, size, 'R');
  const wNow = tw(ctx, steps[k][1]), wPrev = k ? tw(ctx, steps[k - 1][1]) : 0;
  const grow = easeOut(seg(t, steps[k][0], steps[k][0] + 0.18)), inner = lerp(wPrev, wNow, grow);
  const gap = 26;
  text(ctx, '{', CX - inner / 2 - gap, TY, size, C.ink, 'L', 'right');
  text(ctx, '}', CX + inner / 2 + gap, TY, size, C.ink, 'L', 'left');
  ctx.save(); ctx.beginPath(); ctx.rect(CX - inner / 2 - 4, TY - 100, inner + 8, 140); ctx.clip();
  text(ctx, steps[k][1], CX - wNow / 2, TY, size, C.ink, 'R', 'left');
  ctx.restore();
  corners(ctx, t, CX, TY - 26, inner + 260, 260, easeOut(seg(t, a + 0.1, a + 0.4)), 5);
  // Übergang: Klammern bleiben, Text wird zu HAVANOLA (nächste Szene)
}

// 3 {HAVA [Fotos] NOLA} mit Pfeilen
function sceneName(ctx, t) {
  const [a, b] = S.name;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const size = 96, open = easeInOut(seg(t, a + BEAT, a + BEAT + 0.3)), gapW = 300 * open;
  font(ctx, size, 'R', 4);
  const wl = tw(ctx, 'HAVA'), wr = tw(ctx, 'NOLA');
  const total = wl + wr + gapW, x0 = CX - total / 2;
  const glitch = seg(t, b - 0.35, b);
  ctx.save();
  if (glitch > 0) ctx.translate((hash(Math.floor(t * 40)) - 0.5) * 30 * glitch, 0);
  text(ctx, '{', x0 - 22, TY, size, C.pet, 'L', 'right');
  text(ctx, 'HAVA', x0, TY, size, C.pet, 'R', 'left', 1, 4);
  text(ctx, 'NOLA', x0 + wl + gapW, TY, size, C.pet, 'R', 'left', 1, 4);
  text(ctx, '}', x0 + total + 22, TY, size, C.pet, 'L', 'left');
  // Fotos schieben sich in die Lücke, wechseln auf jedem Achtel
  if (open > 0.5) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + wl + 6, TY - 100, gapW - 12, 140); ctx.clip();
    const faces = ['p_cb', 'p_mk', 'p_wm', 'p_jp', 'p_am', 'p_ae'];
    const n = 3, sz = 80, gx = x0 + wl + (gapW - n * sz - (n - 1) * 12) / 2;
    const step = Math.floor((t - a) / (BEAT / 2));
    for (let i = 0; i < n; i++) {
      const p = easeOut(seg(t, a + BEAT + 0.08 * i, a + BEAT + 0.3 + 0.08 * i));
      const img = IMG[faces[(i + step) % faces.length]];
      ctx.globalAlpha = p;
      cover(ctx, img, gx + i * (sz + 12), TY - 70 + (1 - p) * 30, sz, sz, 0.5, 0.25);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  const ar = easeOut(seg(t, a + 2 * BEAT, a + 2 * BEAT + 0.4));
  arrow(ctx, x0 - 80 - 20 * ar, TY - 32, -1, 70, C.petL, ar);
  arrow(ctx, x0 + total + 80 + 20 * ar, TY - 32, 1, 70, C.petL, ar);
  ctx.restore();
  corners(ctx, t, CX, TY - 32, total + 330, 240, 1 - glitch, 9);
  if (glitch > 0) {
    // Pixel-Auflösung in das Falschfarben-Bild der nächsten Szene
    const r = rand(77), cell = 60;
    for (let j = 0; j < H / cell; j++) for (let i = 0; i < W / cell; i++) {
      if (r() < glitch * 1.05) {
        ctx.save(); ctx.beginPath(); ctx.rect(i * cell, j * cell, cell, cell); ctx.clip();
        officePhoto(ctx, S.buero[0], 1); ctx.restore();
      }
    }
  }
}

// 4 Büro mit Leuchtschild: erst Falschfarben, dann Block für Block echt, langsamer Zoom aufs Schild
function officePhoto(ctx, t, falseAmt) {
  const [a, b] = S.buero;
  const z = lerp(1.0, 1.08, easeInOut(seg(t, a, b)));
  const src = IMG.office_sign;
  // Das Schild ist breiter als ein 9:16-Ausschnitt: Foto so skalieren, dass es ganz drauf ist,
  // oben und unten füllt eine unscharfe Kopie des Fotos
  const draw = (img) => {
    ctx.save(); ctx.filter = 'blur(40px)'; cover(ctx, img, -60, -60, W + 120, H + 120, 0.385, 0.5); ctx.restore();
    const s = W / (0.36 * img.width) * z, dw = img.width * s, dh = img.height * s;
    const sx = 0.38 * dw, sy = 0.19 * dh;             // Schild-Mitte im Foto
    ctx.drawImage(img, CX - sx, 470 - sy, dw, dh);
  };
  draw(src);
  if (falseAmt >= 1) { draw(PRE.officeFalse); return; }
  if (falseAmt <= 0) return;
  const r = rand(4242), cell = 90;
  for (let j = 0; j < Math.ceil(H / cell); j++) for (let i = 0; i < Math.ceil(W / cell); i++) {
    if (r() < falseAmt) { ctx.save(); ctx.beginPath(); ctx.rect(i * cell, j * cell, cell, cell); ctx.clip(); draw(PRE.officeFalse); ctx.restore(); }
  }
}
function sceneBuero(ctx, t) {
  const [a, b] = S.buero;
  // Falschfarben -> echt in 4 Beat-Stufen (ab Beat 2 der Szene)
  const steps = t < a + 2 * BEAT ? 0 : Math.min(4, Math.floor((t - (a + 2 * BEAT)) / BEAT + 1e-6) + 1);
  officePhoto(ctx, t, 1 - steps / 4);
  // leichter weißer Schleier für Ruhe, dann Push durchs Bild in die nächste Szene
  const push = easeIn(seg(t, b - 0.45, b));
  if (push > 0) { ctx.fillStyle = `rgba(255,255,255,${push})`; ctx.fillRect(0, 0, W, H); }
}

// 5 Eingabezeile auf Halbton-Raster, Text wird getippt, Zoom ins Getippte
const TYPED = 'Wohnung verkaufen – fair, diskret, ohne Umwege';
const typeStart = () => S.tippen[0] + 0.45, typeEnd = () => S.tippen[1] - 0.9;
function typedCount(t) { return Math.floor(TYPED.length * clamp((t - typeStart()) / (typeEnd() - typeStart()))); }
function sceneTippen(ctx, t) {
  const [a, b] = S.tippen;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(PRE.halftone, 0, (t - a) * -12);
  // großes, blasses Logo dahinter (wie das Marken-Logo in der Referenz)
  ctx.globalAlpha = 0.16; const lw = 980, lh = lw * IMG.logo.height / IMG.logo.width; ctx.drawImage(IMG.logo, CX - lw / 2, TY - lh / 2 - 40, lw, lh); ctx.globalAlpha = 1;
  const intro = 1 - easeOut(seg(t, a, a + 0.35));
  ctx.fillStyle = `rgba(255,255,255,${intro})`; ctx.fillRect(0, 0, W, H);
  const n = typedCount(t), s = TYPED.slice(0, n), cursorOn = Math.floor(t * 3) % 2 === 0 || (n > 0 && n < TYPED.length);
  // Zoom: 0 = Eingabefeld, 1 = riesiger Text
  const zin = easeInOut(seg(t, a + 1.1, a + 1.45)), zout = easeInOut(seg(t, b - 0.8, b - 0.45));
  const z = zin * (1 - zout);
  const out = easeIn(seg(t, b - 0.3, b));
  // Eingabefeld
  if (z < 1) {
    const pw = 940, ph = 104, px = CX - pw / 2, py = TY - ph / 2;
    ctx.globalAlpha = (1 - z) * (1 - out);
    ctx.save(); ctx.shadowColor = 'rgba(31,79,96,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; rrect(ctx, px, py, pw, ph, ph / 2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = C.petL; ctx.lineWidth = 2; rrect(ctx, px, py, pw, ph, ph / 2); ctx.stroke();
    ctx.globalAlpha = (1 - z) * (1 - out);
    const fs = 36; font(ctx, fs, 'R');
    const shown = s.length ? s : '';
    text(ctx, shown, px + 44, TY + 13, fs, C.ink, 'R', 'left', (1 - z) * (1 - out));
    if (!s.length) text(ctx, 'Was möchten Sie verkaufen?', px + 44, TY + 13, fs, C.gray, 'L', 'left', (1 - z) * (1 - out));
    if (cursorOn) { ctx.fillStyle = C.ink; ctx.fillRect(px + 46 + tw(ctx, shown), TY - 22, 3, 44); }
    // Senden-Knopf
    ctx.fillStyle = C.pet; ctx.beginPath(); ctx.arc(px + pw - 54, TY, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + pw - 54, TY + 13); ctx.lineTo(px + pw - 54, TY - 13); ctx.moveTo(px + pw - 66, TY - 2); ctx.lineTo(px + pw - 54, TY - 14); ctx.lineTo(px + pw - 42, TY - 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // riesiger Text auf Glas-Band, Cursor bleibt rechts im Bild
  if (z > 0) {
    ctx.globalAlpha = z;
    const bh = 330, by = TY - bh / 2 - 30;
    const g = ctx.createLinearGradient(0, by, W, by + bh);
    g.addColorStop(0, 'rgba(143,184,198,0.55)'); g.addColorStop(0.35, 'rgba(243,233,216,0.7)'); g.addColorStop(0.7, 'rgba(203,180,146,0.55)'); g.addColorStop(1, 'rgba(143,184,198,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, by, W, 3); ctx.fillRect(0, by + bh - 3, W, 3);
    const fs = 150; font(ctx, fs, 'R');
    const wS = tw(ctx, s), cx = Math.min(80, 900 - wS);
    text(ctx, s, cx, TY + 20, fs, C.ink, 'R', 'left', z);
    if (cursorOn) { ctx.fillStyle = C.ink; ctx.fillRect(cx + wS + 10, TY - 100, 6, 150); }
    ctx.globalAlpha = 1;
  }
  if (out > 0) { ctx.fillStyle = `rgba(239,238,235,${out})`; ctx.fillRect(0, 0, W, H); }
}

// 6 Status-Liste „Ihr Verkauf“ (Referenz: „Building Image“)
const ITEMS = [
  ['Provisionsfrei', 'Provisionsfreie Abwicklung', 'euro'],
  ['Geringer Aufwand', 'ohne Sanierungsaufwand', 'tools'],
  ['Fairer Preis', 'ohne Unsicherheit', 'scale'],
  ['Kein Risiko', 'wir kaufen „wie gesehen“', 'shield'],
];
function icon(ctx, kind, x, y, s, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  rrect(ctx, x - s / 2, y - s / 2, s, s, 10); ctx.stroke();
  ctx.beginPath();
  if (kind === 'euro') { ctx.arc(x + 3, y, s * 0.22, 0.8, Math.PI * 2 - 0.8); ctx.moveTo(x - 12, y - 4); ctx.lineTo(x + 2, y - 4); ctx.moveTo(x - 12, y + 4); ctx.lineTo(x + 2, y + 4); }
  if (kind === 'tools') { ctx.moveTo(x - 10, y + 10); ctx.lineTo(x + 8, y - 8); ctx.arc(x + 10, y - 10, 5, 0, Math.PI * 1.5); }
  if (kind === 'scale') { ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.moveTo(x - 12, y - 6); ctx.lineTo(x + 12, y - 6); ctx.moveTo(x - 12, y - 6); ctx.lineTo(x - 16, y + 4); ctx.lineTo(x - 8, y + 4); ctx.closePath(); ctx.moveTo(x + 12, y - 6); ctx.lineTo(x + 8, y + 4); ctx.lineTo(x + 16, y + 4); ctx.closePath(); }
  if (kind === 'shield') { ctx.moveTo(x, y - 13); ctx.lineTo(x + 11, y - 8); ctx.lineTo(x + 9, y + 5); ctx.lineTo(x, y + 13); ctx.lineTo(x - 9, y + 5); ctx.lineTo(x - 11, y - 8); ctx.closePath(); }
  if (kind === 'check') { ctx.moveTo(x - 10, y); ctx.lineTo(x - 3, y + 8); ctx.lineTo(x + 11, y - 9); }
  ctx.stroke();
}
function itemTimes(i) { const a = S.liste[0]; return [a + BEAT * (1 + i), a + BEAT * (3 + i)]; } // erscheint, erledigt
function sceneListe(ctx, t) {
  const [a, b] = S.liste;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const x0 = 140, y0 = 470;
  const head = easeOut(seg(t, a, a + 0.3));
  wordsIn(ctx, 'Ihr Verkauf', x0, y0, 62, C.ink, t, a, 0.1, 'R', 'left');
  const lineLen = easeOut(seg(t, a + 0.2, a + BEAT * 5)) * 700;
  ctx.fillStyle = '#c9c8c3'; ctx.fillRect(x0 + 4, y0 + 36, 2, lineLen * head);
  ITEMS.forEach(([label, desc, kind], i) => {
    const [ti, td] = itemTimes(i);
    const p = backOut(seg(t, ti, ti + 0.3)), done = t >= td;
    if (p <= 0) return;
    const y = y0 + 130 + i * 150;
    ctx.save(); ctx.globalAlpha = clamp(p); ctx.translate(0, (1 - p) * 20);
    const col = done ? C.sand : C.pet;
    icon(ctx, done ? 'check' : kind, x0 + 70, y - 16, 46, col);
    text(ctx, label, x0 + 120, y, 50, col, 'R', 'left', clamp(p));
    text(ctx, desc, x0 + 120, y + 52, 36, C.gray, 'L', 'left', clamp(p));
    ctx.restore();
  });
  const dots = '.'.repeat(1 + (Math.floor(t * 4) % 3));
  const allDone = t >= itemTimes(3)[1];
  text(ctx, allDone ? 'Fair. Diskret. Ohne Umwege.' : 'Läuft' + dots, x0, y0 + 780, 40, allDone ? C.ink : C.gray, allDone ? 'R' : 'L', 'left', easeOut(seg(t, a + 0.5, a + 0.9)));
  const out = easeIn(seg(t, b - 0.3, b));
  if (out > 0) { ctx.fillStyle = `rgba(239,238,235,${out})`; ctx.fillRect(0, 0, W, H); }
}

// 7 Vorher/Nachher: Punkt-Raster -> Foto, Wisch auf Nachher, Kaskade der Räume
const ROOMS = ['eltern', 'ess', 'bad', 'buero', 'kind1', 'kind2', 'treppe', 'wohn'];
const [CARD_W, CARD_H] = [560, 560 * 690 / 415];
const cardCache = {};
function roomCard(room, wipe) {
  // Karte mit Vorher links vom Wisch, Nachher rechts; weißer Rand, kleines Label
  const key = room;
  if (!cardCache[key]) cardCache[key] = offscreen(CARD_W, CARD_H);
  const [c, x] = cardCache[key];
  x.clearRect(0, 0, c.width, c.height);
  x.save(); rrect(x, 0, 0, c.width, c.height, 22); x.clip();
  x.drawImage(IMG[`${room}_vorher`], 0, 0, c.width, c.height);
  if (wipe > 0) {
    const wx = c.width * (1 - wipe);
    x.save(); x.beginPath(); x.rect(wx, 0, c.width - wx, c.height); x.clip(); x.drawImage(IMG[`${room}_nachher`], 0, 0, c.width, c.height); x.restore();
    if (wipe < 1) { x.fillStyle = C.sand; x.fillRect(wx - 3, 0, 6, c.height); }
  }
  const lbl = wipe > 0.5 ? 'Nachher' : 'Vorher';
  x.font = '30px LatoR'; const lw = x.measureText(lbl).width + 36;
  x.fillStyle = 'rgba(255,255,255,0.92)'; rrect(x, 22, 22, lw, 48, 24); x.fill();
  x.fillStyle = wipe > 0.5 ? C.pet : C.ink; x.fillText(lbl, 40, 56);
  x.restore();
  return c;
}
function sceneVorher(ctx, t) {
  const [a, b] = S.vorher;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const t1 = a + 2 * BEAT;              // Punkte fertig, Foto da
  const tc = a + 4 * BEAT;              // Kaskade beginnt
  if (t < t1 + 0.3) {
    // Punkt-Raster baut das Vorher-Foto auf
    const cols = 18, rows = 30, cw = CARD_W / cols, ch = CARD_H / rows, x0 = CX - CARD_W / 2, y0 = TY - CARD_H / 2 + 40;
    const r = rand(99), fade = seg(t, t1 - 0.1, t1 + 0.3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = r(), p = easeOut(seg(t, a + d * 1.2 * BEAT, a + d * 1.2 * BEAT + 0.2));
      if (p <= 0) continue;
      const k = (j * cols + i) * 4, col = `rgb(${PRE.dots[k]},${PRE.dots[k + 1]},${PRE.dots[k + 2]})`;
      ctx.globalAlpha = 1 - fade; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x0 + i * cw + cw / 2, y0 + j * ch + ch / 2, cw * 0.42 * p, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (fade > 0) { ctx.globalAlpha = fade; ctx.drawImage(roomCard('eltern', 0), x0, y0); ctx.globalAlpha = 1; }
    return;
  }
  // Kaskade: jede Karte erscheint vorne und wandert dann nach links hinten
  const cascadeIdx = (t - tc) / BEAT;   // wie viele Karten sind schon nachgerückt
  const exit = easeIn(seg(t, b - 0.4, b));
  const cards = [];
  ROOMS.forEach((room, i) => {
    const tin = i === 0 ? t1 : tc + (i - 1) * BEAT;
    if (t < tin) return;
    const wipeT = i === 0 ? a + 3 * BEAT : tin + BEAT / 2;
    const wipe = easeInOut(seg(t, wipeT, wipeT + 0.25));
    const age = Math.max(0, cascadeIdx - (i - 1)) - (i === 0 ? 0 : 0);
    const depth = i === 0 ? Math.max(0, cascadeIdx + 1) : Math.max(0, cascadeIdx - (i - 1));
    const d = easeOut(clamp(depth - Math.floor(depth))) + Math.floor(depth);
    const pop = i === 0 ? 1 : backOut(seg(t, tin, tin + 0.28));
    cards.push({ room, wipe, d: t >= tc ? d : 0, pop, i, age });
  });
  cards.sort((p, q) => q.d - p.d);
  for (const c of cards) {
    const d = c.d;
    const cx = CX + 120 - d * 150 - exit * 900, cy = TY + 60 - d * 10;
    const s = Math.pow(0.86, d) * lerp(0.6, 1, c.pop);
    const q = quad3d(cx, cy, CARD_W * s * 0.82, CARD_H * s * 0.82, lerp(0.12, 0.55, clamp(d)), 0, d * 40);
    if (d > 5.5) continue;
    shadowQuad(ctx, q, 30, 0.12);
    drawQuad(ctx, roomCard(c.room, c.wipe), q, 5, clamp(6 - d));
  }
  // Wörter wie „gets / better“ in der Referenz
  wordsIn(ctx, 'Aus alt', 700, 330, 84, C.ink, t, tc + BEAT, 0.1, 'R', 'left', b - 0.35);
  wordsIn(ctx, 'wird neu.', 640, 1340, 84, C.pet, t, tc + 3 * BEAT, 0.1, 'R', 'left', b - 0.35);
}

// 8 Team-Kaskade: „Menschen, / nicht Systeme.“
const TEAM = ['p_cb', 'p_mk', 'p_wm', 'p_jp', 'p_am', 'p_ae'];
const teamCards = {};
function teamCard(k) {
  if (teamCards[k]) return teamCards[k];
  const [c, x] = offscreen(420, 540);
  cover(x, IMG[k], 0, 0, 420, 540, 0.5, 0.3);
  return (teamCards[k] = c);
}
function sceneTeam(ctx, t) {
  const [a, b] = S.team;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const exit = easeIn(seg(t, b - 0.5, b));
  const list = [];
  TEAM.forEach((k, i) => {
    const tin = a + i * BEAT * 0.75;
    if (t < tin) return;
    const pop = backOut(seg(t, tin, tin + 0.25));
    const depth = Math.max(0, (t - tin) / (BEAT * 0.75) - 1);
    const d = Math.floor(depth) + easeOut(clamp(depth - Math.floor(depth)));
    list.push({ k, d, pop });
  });
  list.sort((p, q) => q.d - p.d);
  ctx.save();
  if (exit > 0) ctx.filter = `blur(${(exit * 30).toFixed(1)}px)`;
  for (const c of list) {
    const d = Math.min(c.d, 6);
    const cx = CX + 150 - d * 120, cy = TY + 40 + d * 18;
    const s = Math.pow(0.88, d) * lerp(0.5, 1, c.pop);
    const q = quad3d(cx, cy, 420 * s, 540 * s, 0.35 + 0.1 * d, 0, d * 30, -0.03 * d);
    shadowQuad(ctx, q, 26, 0.12);
    drawQuad(ctx, teamCard(c.k), q, 4, clamp(1.2 - exit));
  }
  ctx.restore();
  wordsIn(ctx, 'Menschen,', 620, 360, 80, C.ink, t, a + 2 * BEAT, 0.1, 'R', 'left', b - 0.45);
  wordsIn(ctx, 'nicht Systeme.', 1010, 1250, 80, C.ink, t, a + 4 * BEAT, 0.12, 'R', 'right', b - 0.45);
  if (exit > 0) { ctx.globalAlpha = exit; gradientBg(ctx, t, 'warm'); ctx.globalAlpha = 1; }
}

// 9 Verlauf + „Ihr regionaler Immobilienankäufer“
function sceneRegion(ctx, t) {
  const [a, b] = S.region;
  gradientBg(ctx, t, 'warm');
  const out = b - 0.3;
  wordsIn(ctx, 'Ihr regionaler', CX, TY - 30, 72, C.ink, t, a + 0.1, 0.12, 'R', 'center', out);
  wordsIn(ctx, 'Immobilienankäufer', CX, TY + 56, 72, C.ink, t, a + 0.3, 0.12, 'R', 'center', out);
  wordsIn(ctx, 'Aschaffenburg · Miltenberg', CX, TY + 150, 44, C.petD, t, a + 4 * BEAT, 0.08, 'L', 'center', out);
  corners(ctx, t, CX, TY + 20, 760, 300, easeOut(seg(t, a, a + 0.3)) * (1 - seg(t, out, b)), 21, C.ink);
}

// 10 Karten mit Anfassern und Fluss-Linien
function infoCard() {
  if (PRE.info) return PRE.info;
  const w = 600, ph = 400, ih = 190;
  const [c, x] = offscreen(w, ph + ih);
  x.fillStyle = '#fff'; rrect(x, 0, 0, w, ph + ih, 6); x.fill();
  cover(x, IMG.team_tablet, 0, 0, w, ph, 0.5, 0.45);
  x.fillStyle = C.ink; x.font = '30px LatoB'; x.fillText('Wohnung · Haus · Mehrfamilienhaus', 26, ph + 50);
  x.fillStyle = '#6b6b67'; x.font = '24px LatoL'; x.fillText('Wir kaufen direkt – fair, diskret, ohne Umwege.', 26, ph + 88);
  x.fillStyle = C.sand; x.fillRect(0, ph + 118, w, 4);
  x.fillStyle = C.ink; x.font = '22px LatoR';
  x.fillText('Aschaffenburg', 26, ph + 162); x.fillText('Miltenberg', 250, ph + 162); x.fillText('Mömlingen', 440, ph + 162);
  return (PRE.info = c);
}
function photoCard(key, w, h, fx = 0.5, fy = 0.5) {
  const id = `${key}_${w}`;
  if (PRE[id]) return PRE[id];
  const [c, x] = offscreen(w, h); cover(x, IMG[key], 0, 0, w, h, fx, fy);
  return (PRE[id] = c);
}
function quoteCard() {
  if (PRE.quote) return PRE.quote;
  const [c, x] = offscreen(600, 250);
  x.fillStyle = '#fff'; rrect(x, 0, 0, 600, 250, 6); x.fill();
  x.fillStyle = C.sand; x.font = '90px LatoB'; x.fillText('„', 24, 100);
  x.fillStyle = C.ink; x.font = '31px LatoR';
  x.fillText('Alles war klar, ehrlich', 80, 78); x.fillText('und ohne Druck.“', 80, 118);
  x.fillStyle = '#6b6b67'; x.font = '22px LatoL';
  x.fillText('Ulrike M., Eigentümerin aus Aschaffenburg', 80, 170);
  x.fillStyle = C.sand; x.fillRect(80, 196, 60, 4);
  return (PRE.quote = c);
}
function callCard(t) {
  if (!PRE.call) PRE.call = offscreen(600, 200);
  const [c, x] = PRE.call;
  x.clearRect(0, 0, 600, 200);
  x.fillStyle = '#fff'; rrect(x, 0, 0, 600, 200, 6); x.fill();
  x.fillStyle = C.ink; x.beginPath(); x.arc(56, 60, 26, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(48, 47); x.lineTo(70, 60); x.lineTo(48, 73); x.closePath(); x.fill();
  x.fillStyle = C.gray; x.font = '20px LatoR'; x.fillText('00:18', 96, 67);
  for (let i = 0; i < 52; i++) {
    const h = 6 + 34 * Math.abs(Math.sin(i * 0.9 + t * 7) * Math.sin(i * 0.37 + t * 2.3));
    x.fillStyle = i / 52 < ((t * 0.4) % 1) ? C.pet : C.petL; x.fillRect(170 + i * 7.8, 60 - h / 2, 4, h);
  }
  x.fillStyle = C.ink; x.font = '34px LatoB'; x.fillText('06021 – 44 99 667', 30, 140);
  x.fillStyle = '#6b6b67'; x.font = '22px LatoL'; x.fillText('Rufen Sie an – persönlich, direkt und ohne Umwege.', 30, 176);
  return c;
}
function flowLine(ctx, p0, p1, prog, col) {
  if (prog <= 0) return;
  const [x0, y0] = p0, [x1, y1] = p1, mx = (x0 + x1) / 2;
  const bez = (u) => { const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3; return [a * x0 + b * mx + c * mx + d * x1, a * y0 + b * y0 + c * y1 + d * y1]; };
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 40 * prog; i++) { const [x, y] = bez(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  const [ex, ey] = bez(prog);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0, y0, 9, 0, Math.PI * 2); ctx.fill();
}
function sceneKarten(ctx, t) {
  const [a, b] = S.karten;
  gradientBg(ctx, t, 'warm');
  const straighten = easeInOut(seg(t, a + 0.1, a + 1.3));
  const toCard = easeInOut(seg(t, a + 1.3, a + 1.8));
  const move = easeInOut(seg(t, a + 2.2, a + 2.8));
  const exit = easeIn(seg(t, b - 0.35, b));
  const info = infoCard();
  // A: Team mit Tablet, erst schräg mit Anfassern, dann gerade Karte, dann nach oben links
  const aw = lerp(700, 480, move), ah = aw * info.height / info.width;
  const acx = lerp(CX, 320, move), acy = lerp(TY, 520, move) - exit * 1400;
  const photoOnly = 1 - toCard;
  const qA = quad3d(acx, acy, aw, ah, lerp(0.7, 0, straighten), lerp(0.35, 0, straighten), 0, lerp(-0.12, 0, straighten));
  shadowQuad(ctx, qA, 40, 0.18 * toCard);
  drawQuad(ctx, info, qA, 6, 1);
  if (photoOnly > 0) {
    // Solange nur das Foto zählt, wird der Info-Teil abgedeckt (Foto wächst zur Karte)
    const map = homography(qA), cut = 400 / info.height;
    const [c0, c1, c2, c3] = [map(0, cut + (1 - cut) * toCard), map(1, cut + (1 - cut) * toCard), map(1, 1), map(0, 1)];
    ctx.save(); ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.lineTo(...c2); ctx.lineTo(...c3); ctx.closePath(); ctx.clip();
    gradientBg(ctx, t, 'warm'); ctx.restore();
    const map2 = homography(qA);
    handles(ctx, [map2(0, 0), map2(1, 0), map2(1, cut), map2(0, cut)], photoOnly);
  }
  // B: Besprechungsfoto
  const tB = a + 2.8, pB = backOut(seg(t, tB, tB + 0.3));
  const bw = 440 * pB, bh = 300 * pB, bcx = 790, bcy = 830 - exit * 1400;
  flowLine(ctx, [acx + aw / 2, acy + 40], [bcx - bw / 2, bcy], easeInOut(seg(t, tB - 0.35, tB)), C.sand);
  if (pB > 0) { const q = quad3d(bcx, bcy, bw, bh, -0.12, 0); shadowQuad(ctx, q, 30, 0.15); drawQuad(ctx, photoCard('meeting', 440, 300, 0.55, 0.5), q, 4, 1); }
  // C: Kundenzitat
  const tC = a + 3.7, pC = backOut(seg(t, tC, tC + 0.3));
  const ccx = 360, ccy = 1110 - exit * 1400;
  flowLine(ctx, [bcx, bcy + bh / 2], [ccx + 300 * pC, ccy - 40], easeInOut(seg(t, tC - 0.35, tC)), C.pet);
  if (pC > 0) { const q = quad3d(ccx, ccy, 600 * pC, 250 * pC, 0.1, 0); shadowQuad(ctx, q, 30, 0.15); drawQuad(ctx, quoteCard(), q, 3, 1); }
  // D: Anruf-Karte mit Wellenform
  const tD = a + 4.5, pD = backOut(seg(t, tD, tD + 0.3));
  const dcx = 700, dcy = 1330 - exit * 1400;
  flowLine(ctx, [ccx + 300, ccy + 125], [dcx - 300 * pD, dcy], easeInOut(seg(t, tD - 0.35, tD)), C.sand);
  if (pD > 0) { const q = quad3d(dcx, dcy, 600 * pD, 200 * pD, -0.08, 0); shadowQuad(ctx, q, 30, 0.15); drawQuad(ctx, callCard(t), q, 3, 1); }
  // kleine farbige Punkte wie in der Referenz
  [[C.sand, 120, 380], [C.pet, 980, 560], [C.cream, 150, 1300]].forEach(([col, x, y], i) => {
    const p = easeOut(seg(t, a + 0.5 + i * 0.4, a + 0.8 + i * 0.4));
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i) * 14, y + Math.cos(t * 1.6 + i) * 14 - exit * 1400, 12 * p, 0, Math.PI * 2); ctx.fill();
  });
}

// 11 „Wir machen Immobilien [Foto] wieder wertvoll.“
function sceneWert(ctx, t) {
  const [a, b] = S.wert;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const pin = easeOut(seg(t, a + BEAT, a + BEAT + 0.3));
  const tilt = easeIn(seg(t, b - 0.5, b));
  const pw = 700, ph = 520, cy = TY + 20;
  if (pin > 0) {
    const [c, x] = offscreen(pw, ph);
    cover(x, IMG.wohn_nachher, 0, 0, pw, ph, 0.5, 0.55);
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 0, pw, ph);
    x.font = '66px LatoB'; x.fillStyle = '#fff'; const s = 'Immobilien wieder'; x.fillText(s, (pw - x.measureText(s).width) / 2, ph / 2 + 22);
    const q = quad3d(CX - tilt * 200, cy + tilt * 100, pw * lerp(0.8, 1, pin) * (1 - 0.6 * tilt), ph * lerp(0.8, 1, pin) * (1 - 0.6 * tilt), tilt * 0.9, tilt * 0.4, 0, -tilt * 0.3);
    drawQuad(ctx, c, q, 5, pin * (1 - seg(t, b - 0.15, b)));
    crosshairs(ctx, q, pin * (1 - tilt));
  }
  wordsIn(ctx, 'Wir machen', CX, cy - ph / 2 - 60, 70, C.ink, t, a + 0.05, 0.1, 'R', 'center', b - 0.35);
  wordsIn(ctx, 'wertvoll.', CX, cy + ph / 2 + 110, 70, C.pet, t, a + 2 * BEAT, 0.1, 'R', 'center', b - 0.35);
}

// 12 Logo + Kontakt
function sceneLogo(ctx, t) {
  const [a] = S.logo;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const lw = 820, lh = lw * IMG.logo.height / IMG.logo.width, lx = CX - lw / 2, ly = 640 - lh / 2;
  const iw = IMG.logo.width, ih = IMG.logo.height;
  // Balken (oben/unten) zeichnen sich von der Mitte nach außen, dann die Buchstaben, dann „IMMOBILIEN“
  const barP = expOut(seg(t, a, a + 0.5)), word = easeInOut(seg(t, a + 0.25, a + 0.75)), sub = seg(t, a + 0.6, a + 1.3);
  const bands = [[0, 0.07], [0.07, 0.72], [0.72, 0.8], [0.8, 1]]; // Bereiche im Logo (Anteil der Höhe)
  bands.forEach(([y0, y1], i) => {
    const sy = y0 * ih, sh = (y1 - y0) * ih, dy = ly + y0 * lh, dh = (y1 - y0) * lh;
    if (i === 0 || i === 2) {
      const w = lw * barP; ctx.drawImage(IMG.logo, iw / 2 - iw * barP / 2, sy, iw * barP, sh, CX - w / 2, dy, w, dh);
    } else if (i === 1) {
      ctx.save(); ctx.beginPath(); ctx.rect(lx, dy + dh * (1 - word), lw, dh * word); ctx.clip();
      ctx.drawImage(IMG.logo, 0, sy, iw, sh, lx, dy + (1 - word) * 30, lw, dh); ctx.restore();
    } else {
      const n = 10;
      for (let k = 0; k < n; k++) {
        const p = easeOut(seg(sub, k / n * 0.7, k / n * 0.7 + 0.3));
        ctx.globalAlpha = p; ctx.drawImage(IMG.logo, iw * k / n, sy, iw / n, sh, lx + lw * k / n, dy + (1 - p) * 10, lw / n, dh); ctx.globalAlpha = 1;
      }
    }
  });
  wordsIn(ctx, 'Wir kaufen Ihre Immobilie.', CX, 930, 52, C.ink, t, a + 1.5, 0.1, 'R');
  const tel = easeOut(seg(t, a + 2.2, a + 2.6));
  text(ctx, '06021 – 44 99 667', CX, 1040 + (1 - tel) * 20, 56, C.pet, 'B', 'center', tel);
  text(ctx, 'havanola.com  ·  @havanola_gmbh', CX, 1110 + (1 - tel) * 20, 34, '#6b6b67', 'L', 'center', tel);
  ctx.fillStyle = C.sand; ctx.fillRect(CX - 40 * tel, 1160, 80 * tel, 4);
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  const scenes = [['intro', sceneIntro], ['klammer', sceneKlammer], ['name', sceneName], ['buero', sceneBuero], ['tippen', sceneTippen], ['liste', sceneListe],
    ['vorher', sceneVorher], ['team', sceneTeam], ['region', sceneRegion], ['karten', sceneKarten], ['wert', sceneWert], ['logo', sceneLogo]];
  for (const [k, fn] of scenes) if (t >= S[k][0] && t < S[k][1]) { fn(ctx, t); return; }
  sceneLogo(ctx, t);
}

// ---------- Sounds (cues.json für tools/sfx.mjs) ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.6) => c.push({ t: +t.toFixed(3), type, gain });
  add(S.intro[1] - 0.45, 'glitch', 0.5);
  [0, 2, 4].forEach((k) => add(S.klammer[0] + k * BEAT, 'click', 0.5));
  add(S.name[0] + BEAT, 'pop', 0.5); add(S.name[1] - 0.35, 'glitch', 0.6);
  for (let k = 0; k < 4; k++) add(S.buero[0] + (2 + k) * BEAT, 'click', 0.35);
  add(S.buero[1] - 0.1, 'whoosh', 0.7);
  for (let i = 1; i <= TYPED.length; i++) {
    const tt = typeStart() + (typeEnd() - typeStart()) * i / TYPED.length;
    if (TYPED[i - 1] !== ' ') add(tt, 'key', 0.35);
  }
  add(S.tippen[0] + 1.25, 'whoosh', 0.5); add(S.tippen[1] - 0.6, 'whoosh', 0.4);
  ITEMS.forEach((_, i) => { add(itemTimes(i)[0], 'pop', 0.45); add(itemTimes(i)[1], 'blip', 0.35); });
  add(S.vorher[0] + 2 * BEAT, 'pop', 0.4);
  add(S.vorher[0] + 3 * BEAT, 'whoosh', 0.35);
  ROOMS.forEach((_, i) => { if (i) { const tin = S.vorher[0] + 4 * BEAT + (i - 1) * BEAT; add(tin, 'pop', 0.4); add(tin + BEAT / 2 + 0.1, 'click', 0.3); } });
  add(S.vorher[1] - 0.2, 'whoosh', 0.6);
  TEAM.forEach((_, i) => add(S.team[0] + i * BEAT * 0.75, 'pop', 0.4));
  add(S.team[1] - 0.2, 'whoosh', 0.5);
  add(S.karten[0] + 0.1, 'whoosh', 0.4);
  [2.8, 3.7, 4.5].forEach((d) => add(S.karten[0] + d, 'pop', 0.45));
  add(S.karten[1] - 0.2, 'whoosh', 0.5);
  add(S.wert[0] + BEAT, 'pop', 0.45); add(S.wert[1] - 0.4, 'whoosh', 0.5);
  add(S.logo[0] + 0.3, 'click', 0.5); add(S.logo[0] + 2.2, 'pop', 0.4);
  return c.sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, scenes: S, vo: [] }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number)
      : Object.values(S).flatMap(([s, e]) => [s + (e - s) * 0.3, s + (e - s) * 0.75]);
    const files = [];
    for (const t of times) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
    if (args[0] === '--contact') {
      const tw_ = 270, th = 480, cols = 8, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw_ * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw_, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw_ - 4, th - 4);
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
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
  for (let n = n0; n < n1; n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 300 === 0) process.stdout.write(`\r${(n / FPS).toFixed(1)} / ${to.toFixed(1)} s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
