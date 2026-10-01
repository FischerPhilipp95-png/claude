// WIKA Radar-Füllstandssensor ILT, 15-s-Werbung, Version 2 (hochwertig). Grammatik: refs/ref-07.
// 1920x1080, 60 fps, echte Bewegungsunschärfe (4 Unterbilder pro Frame), Filmkorn, Vignette.
// Fakten, Fotos, Logo: WIKA-Datenblätter LM 50.17 (ILT-C01) und LM 50.27 (ILT-C05).
//   node projects/wika-radar/render.mjs --timeline | --contact | --still 3,7 | [--from s --to s]
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const A = (f) => path.join(ROOT, 'assets/wika', f);
const W = 1920, H = 1080, FPS = 60, CX = 960, CY = 540;
const SUB = 4, SHUTTER = 0.5;            // Bewegungsunschärfe: 4 Unterbilder, 180°-Verschluss
for (const [w, n] of [[300, 'InterL'], [500, 'InterM'], [600, 'InterSB'], [800, 'InterXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);

const C = { ink: '#16191D', gray: '#7D838C', light: '#C3C8CF', blue: '#2056AE', blue2: '#3E7BD6', blueL: '#6E9BE0', glass: 'rgba(226,234,243,0.42)' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const expoIn = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const quint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(10 * x));
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hex(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function mix(a, b, t) { const p = hex(a), q = hex(b); return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], t))).join(',')})`; }

const BPM = 96, BEAT = 60 / BPM, DUR = 15;
const T = { intro: [0, 2.5], hero: [2.5, 5], data: [5, 8.75], plastic: [8.75, 11.25], final: [11.25, 15] };
const HIT = 12.5;

// ---------- Grundlagen ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function shadow(ctx, a = 0.12, blur = 50, dy = 24) { ctx.shadowColor = `rgba(18,28,48,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function offscreen(w, h) { const c = createCanvas(Math.ceil(w), Math.ceil(h)); return [c, c.getContext('2d')]; }

// Studio-Hintergrund: weiches Licht von oben, ganz leichter Kühlton, schwebende Lichtpunkte (Tiefe)
const BOKEH = (() => { const r = rand(11); return Array.from({ length: 18 }, () => ({ x: r() * W, y: r() * H, r: 30 + r() * 110, a: 0.03 + r() * 0.05, s: 0.2 + r() * 0.6 })); })();
function studio(ctx, t, floorY = null) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FBFCFD'); g.addColorStop(1, '#ECEFF3');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(CX, 300, 50, CX, 380, 1100); r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  if (floorY !== null) {   // glänzender Boden mit Horizont
    const f = ctx.createLinearGradient(0, floorY - 2, 0, H); f.addColorStop(0, 'rgba(214,220,228,0.0)'); f.addColorStop(0.02, 'rgba(214,220,228,0.55)'); f.addColorStop(1, 'rgba(232,236,241,0.2)');
    ctx.fillStyle = f; ctx.fillRect(0, floorY, W, H - floorY);
  }
  for (const b of BOKEH) {
    const x = (b.x + t * 14 * b.s) % (W + 200) - 100, y = b.y - t * 6 * b.s;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, b.r); rg.addColorStop(0, `rgba(110,155,224,${b.a})`); rg.addColorStop(1, 'rgba(110,155,224,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - b.r, y - b.r, 2 * b.r, 2 * b.r);
  }
}

// ---------- Typografie ----------
// Wörter gleiten einzeln aus einer Maske nach oben, erst hellgrau, dann in Zielfarbe (Grammatik ref-07)
function reveal(ctx, t, str, x, y, size, { t0 = 0, stagger = 0.09, font = 'InterSB', col = C.ink, align = 'left', out = Infinity, accent = {}, track = -0.025 } = {}) {
  ctx.font = `${size}px ${font}`; ctx.letterSpacing = `${size * track}px`;
  const ws = str.split(' '), sp = ctx.measureText(' ').width, wd = ws.map((w) => ctx.measureText(w).width);
  const total = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const o = quint(seg(t, out, out + 0.4));
  ws.forEach((w, i) => {
    const ts = t0 + i * stagger, p = expoOut(seg(t, ts, ts + 0.7)), dark = easeOut(seg(t, ts + 0.1, ts + 0.55));
    if (p > 0.001 && o < 0.999) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 10, y - size * 1.05, wd[i] + 20, size * 1.33); ctx.clip();
      const target = accent[w] || col;
      ctx.fillStyle = dark < 1 ? mix(C.light, target, dark) : target;
      ctx.fillText(w, cx, y + (1 - p) * size * 1.35 - o * size * 1.1);
      ctx.restore();
    }
    cx += wd[i] + sp;
  });
  ctx.letterSpacing = '0px';
  return total;
}
function label(ctx, s, x, y, { size = 20, col = C.blue, alpha = 1, align = 'left', track = 0.22 } = {}) {
  if (alpha <= 0) return;
  ctx.font = `${size}px InterSB`; ctx.letterSpacing = `${size * track}px`;
  const w = ctx.measureText(s).width;
  ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fillText(s, align === 'right' ? x - w : align === 'center' ? x - w / 2 : x, y);
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
}

// ---------- Bilder ----------
const IMG = {};
async function loadAssets() {
  IMG.c01 = await loadImage(A('ilt_c01_2x.png')); IMG.c05 = await loadImage(A('ilt_c05_2x.png')); IMG.logo = await loadImage(A('logo.png'));
}
const PCACHE = new Map();
// Produkt mit Lichtkante (nur auf dem Metall), optional Spiegelung auf dem Boden und blauem Gegenlicht
function product(ctx, img, cx, bottom, h, { sweep = -1, alpha = 1, scale = 1, reflect = false, glow = 0, rot = 0 } = {}) {
  if (alpha <= 0) return;
  const w = h * img.width / img.height, key = `${w | 0}x${h | 0}`;
  if (!PCACHE.has(key)) PCACHE.set(key, offscreen(w, h));
  const [oc, ox] = PCACHE.get(key);
  ox.clearRect(0, 0, oc.width, oc.height); ox.imageSmoothingQuality = 'high'; ox.drawImage(img, 0, 0, w, h);
  if (sweep > 0 && sweep < 1) {
    ox.globalCompositeOperation = 'source-atop';
    const sx = lerp(-w * 0.8, w * 1.8, sweep), g = ox.createLinearGradient(sx - 160, 0, sx + 160, h * 0.35);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ox.fillStyle = g; ox.fillRect(0, 0, w, h); ox.globalCompositeOperation = 'source-over';
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, bottom); ctx.rotate(rot); ctx.scale(scale, scale);
  if (glow > 0) {
    const gg = ctx.createRadialGradient(0, -h * 0.55, 10, 0, -h * 0.55, h * 0.75);
    gg.addColorStop(0, `rgba(62,123,214,${0.22 * glow})`); gg.addColorStop(1, 'rgba(62,123,214,0)');
    ctx.fillStyle = gg; ctx.fillRect(-h, -h * 1.4, 2 * h, 1.8 * h);
  }
  if (reflect) {
    ctx.save(); ctx.translate(0, 6); ctx.scale(1, -1); ctx.globalAlpha = alpha * 0.22; ctx.drawImage(oc, -w / 2, -h, w, h); ctx.restore();
    const fade = ctx.createLinearGradient(0, 6, 0, 6 + h * 0.45); fade.addColorStop(0, 'rgba(236,239,243,0)'); fade.addColorStop(1, 'rgba(236,239,243,1)');
    ctx.fillStyle = fade; ctx.fillRect(-w, 6, 2 * w, h * 0.5);
    ctx.save(); ctx.scale(1, 0.12); const sg = ctx.createRadialGradient(0, 30, 0, 0, 30, w * 0.8);
    sg.addColorStop(0, 'rgba(18,28,48,0.35)'); sg.addColorStop(1, 'rgba(18,28,48,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 30, w * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.drawImage(oc, -w / 2, -h, w, h);
  ctx.restore();
}

// ---------- Perspektive (Homographie, Dreiecke) ----------
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
  const mx = (d0x + d1x + d2x) / 3, my = (d0y + d1y + d2y) / 3, gr = (px, py) => { const vx = px - mx, vy = py - my, l = Math.hypot(vx, vy) || 1; return [px + vx / l * 0.8, py + vy / l * 0.8]; };
  const g0 = gr(d0x, d0y), g1 = gr(d1x, d1y), g2 = gr(d2x, d2y);
  ctx.save(); ctx.beginPath(); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, dd, e, f); ctx.drawImage(src, 0, 0); ctx.restore();
}
function drawQuad(ctx, src, quad, n = 5) {
  const map = homography(quad), sw = src.width, sh = src.height;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    const P = [map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)];
    const Q = [[u0 * sw, v0 * sh], [u1 * sw, v0 * sh], [u1 * sw, v1 * sh], [u0 * sw, v1 * sh]];
    drawTri(ctx, src, [Q[0], Q[1], Q[2]], [P[0], P[1], P[2]]); drawTri(ctx, src, [Q[0], Q[2], Q[3]], [P[0], P[2], P[3]]);
  }
}

// ---------- Radar / Flüssigkeit / Glas ----------
function beam(ctx, t, x, y0, y1, alpha = 1) {
  if (alpha <= 0 || y1 <= y0) return;
  const tan = Math.tan(6 * Math.PI / 180) * 2.4, len = y1 - y0;
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'multiply';
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(62,123,214,0.42)'); g.addColorStop(1, 'rgba(62,123,214,0.06)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 12, y0); ctx.lineTo(x + 12, y0); ctx.lineTo(x + 12 + len * tan, y1); ctx.lineTo(x - 12 - len * tan, y1); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'rgba(62,123,214,0.6)'; ctx.shadowBlur = 12; ctx.strokeStyle = C.blue2;
  for (let k = 0; k < 5; k++) {
    const u = (t * 1.6 + k / 5) % 1, yy = y0 + u * len, r = 12 + u * len * tan;
    ctx.globalAlpha = alpha * Math.sin(Math.PI * u) * 0.95; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, yy, r, r * 0.24, 0, 0.08 * Math.PI, 0.92 * Math.PI); ctx.stroke();
  }
  ctx.restore();
}
function liquid(ctx, t, x0, x1, ySurf, yBot, alpha = 1) {
  if (alpha <= 0) return;
  const surf = (u) => ySurf + Math.sin(u * 8 + t * 2.6) * 5 + Math.sin(u * 3.3 - t * 1.7) * 4 + Math.sin(u * 17 + t * 4) * 1.5;
  ctx.save(); ctx.globalAlpha = alpha;
  const path = () => { ctx.beginPath(); ctx.moveTo(x0, yBot); for (let i = 0; i <= 80; i++) { const u = i / 80; ctx.lineTo(lerp(x0, x1, u), surf(u)); } ctx.lineTo(x1, yBot); ctx.closePath(); };
  const g = ctx.createLinearGradient(0, ySurf, 0, yBot); g.addColorStop(0, '#5C93E2'); g.addColorStop(0.35, '#3A72CF'); g.addColorStop(1, '#1E4C9C');
  path(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); path(); ctx.clip();
  for (let k = 0; k < 7; k++) {          // Lichtbänder (Kaustik)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 10 + k * 3; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, xx = lerp(x0, x1, u), yy = ySurf + 40 + k * 38 + Math.sin(u * 6 + t * 1.3 + k) * 14; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  const r = rand(3);
  for (let i = 0; i < 22; i++) {          // aufsteigende Bläschen
    const bx = lerp(x0 + 20, x1 - 20, r()), sp = 40 + r() * 70, ph = r() * 400, by = yBot - ((t * sp + ph) % Math.max(1, yBot - ySurf));
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.arc(bx + Math.sin(t * 3 + i) * 4, by, 2 + r() * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  const hl = ctx.createLinearGradient(0, ySurf - 6, 0, ySurf + 26); hl.addColorStop(0, 'rgba(255,255,255,0.0)'); hl.addColorStop(0.3, 'rgba(255,255,255,0.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 80; i++) { const u = i / 80; i ? ctx.lineTo(lerp(x0, x1, u), surf(u)) : ctx.moveTo(x0, surf(0)); }
  ctx.stroke();
  ctx.restore();
}
function glassTank(ctx, x0, y0, x1, y1, r = 34, { tint = C.glass, wall = 0, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  shadow(ctx, 0.08, 60, 30); ctx.fillStyle = tint; rrect(ctx, x0, y0, x1 - x0, y1 - y0, r); ctx.fill(); noShadow(ctx);
  if (wall > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = wall; rrect(ctx, x0 + wall / 2, y0 + wall / 2, x1 - x0 - wall, y1 - y0 - wall, r - wall / 2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(150,165,186,0.55)'; ctx.lineWidth = 2; rrect(ctx, x0, y0, x1 - x0, y1 - y0, r); ctx.stroke();
  for (const [px, pw, a] of [[0.08, 0.05, 0.55], [0.17, 0.015, 0.4], [0.9, 0.025, 0.35]]) {   // Glanzstreifen
    const sx = lerp(x0, x1, px), g = ctx.createLinearGradient(sx, 0, sx + (x1 - x0) * pw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(sx, y0 + r * 0.6, (x1 - x0) * pw, y1 - y0 - r * 1.2);
  }
  ctx.restore();
}
// technische Beschriftung: Punkt am Produkt, Linie mit Knick, Titel + Wert
function callout(ctx, t, t0, px, py, lx, ly, title, value, alpha = 1) {
  const p = seg(t, t0, t0 + 0.35), q = expoOut(seg(t, t0 + 0.25, t0 + 0.75));
  if (p <= 0 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const pulse = (t - t0) % 1.2 / 1.2;
  ctx.strokeStyle = `rgba(62,123,214,${0.5 * (1 - pulse)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 6 + pulse * 18, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
  const ex = lerp(px, lx + (lx < px ? 30 : -30), Math.min(1, p * 1.6)), ey = py, fx = lerp(ex, lx, clamp(p * 1.6 - 0.6)), fy = lerp(py, ly, clamp(p * 1.6 - 0.6));
  ctx.strokeStyle = 'rgba(32,86,174,0.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px + (lx < px ? -8 : 8), py); ctx.lineTo(ex, ey); if (p > 0.4) ctx.lineTo(fx, fy); ctx.stroke();
  if (q > 0) {
    const al = lx < px ? 'right' : 'left', dx = lx < px ? -14 : 14;
    label(ctx, title, lx + dx, ly - 10 + (1 - q) * 10, { size: 15, col: C.gray, alpha: q * alpha, align: al, track: 0.2 });
    ctx.font = '25px InterSB'; ctx.letterSpacing = '-0.4px'; ctx.globalAlpha = q * alpha; ctx.fillStyle = C.ink;
    const w = ctx.measureText(value).width; ctx.fillText(value, al === 'right' ? lx + dx - w : lx + dx, ly + 22 + (1 - q) * 10); ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

// ================= Szenen =================
// 1 Spannung: FMCW-Chirp quer durchs Bild, dann Radar-Ringe, Zoom ins Zentrum, Blitz
function sceneIntro(ctx, t) {
  studio(ctx, t);
  const zoom = expoIn(seg(t, 1.95, 2.5)), sc = 1 + zoom * 0.9;
  ctx.save(); ctx.translate(CX, 380); ctx.scale(sc, sc); ctx.translate(-CX, -380);
  // Chirp: Sinus mit steigender Frequenz, zeichnet sich von links, zieht sich dann zur Mitte zusammen
  const draw = expoOut(seg(t, 0.12, 1.15)), shrink = quint(seg(t, 1.05, 1.45));
  if (shrink < 1) {
    ctx.save(); ctx.shadowColor = 'rgba(62,123,214,0.55)'; ctx.shadowBlur = 16; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const g = ctx.createLinearGradient(160, 0, W - 160, 0); g.addColorStop(0, 'rgba(110,155,224,0.2)'); g.addColorStop(0.5, C.blue2); g.addColorStop(1, C.blue);
    ctx.strokeStyle = g; ctx.beginPath();
    const n = 600;
    for (let i = 0; i <= n * draw; i++) {
      const u = i / n, ph = 2 * Math.PI * (3 * u + 9 * u * u) - t * 4;
      const x = lerp(lerp(160, W - 160, u), CX, shrink), y = 380 + Math.sin(ph) * 46 * (1 - shrink) * Math.sin(Math.PI * u) ** 0.5;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  }
  // Radar-Ringe (nach unten, wie der Sensor abstrahlt)
  if (t > 1.2) {
    ctx.save(); ctx.shadowColor = 'rgba(62,123,214,0.5)'; ctx.shadowBlur = 10;
    for (let k = 0; k < 6; k++) {
      const tk = 1.2 + k * BEAT / 2; if (t < tk) continue;
      const u = clamp((t - tk) / 1.6), r = 20 + expoOut(u) * 820;
      ctx.globalAlpha = (1 - u) * 0.9; ctx.strokeStyle = k % 2 ? C.blueL : C.blue; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(CX, 380, r, r * 0.5, 0, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(CX, 380, 6 + 2 * Math.sin(t * 20), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 1 - zoom;
  label(ctx, 'WIKA · RADAR-FÜLLSTANDSMESSUNG', CX, 690, { size: 18, align: 'center', alpha: easeOut(seg(t, 0.2, 0.7)) * (1 - seg(t, 1.9, 2.2)) });
  reveal(ctx, t, 'Füllstand messen.', CX, 800, 86, { t0: 0.3, align: 'center', out: 1.05 });
  reveal(ctx, t, 'Ohne Berührung.', CX, 800, 86, { t0: 1.25, align: 'center', out: 2.15, accent: { 'Berührung.': C.blue } });
  ctx.restore();
  const flash = seg(t, 2.32, 2.5); if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
}

// 2 Produkt im Glastank: Beschriftungen, Radarkegel, Live-Messwert
function sceneHero(ctx, t) {
  const [a, b] = T.hero;
  studio(ctx, t);
  const push = quint(seg(t, a, b)) * 0.035, out = expoIn(seg(t, b - 0.32, b));
  ctx.save(); ctx.translate(780, 560); ctx.scale(1 + push + out * 0.5, 1 + push + out * 0.5); ctx.translate(-780, -560);
  ctx.globalAlpha = 1 - out;
  const tx0 = 540, tx1 = 980, ty0 = 500, ty1 = 1010;
  const surf = lerp(905, 790, quint(seg(t, a + 0.3, b)));
  glassTank(ctx, tx0, ty0, tx1, ty1, 30, { alpha: easeOut(seg(t, a, a + 0.5)) });
  ctx.save(); rrect(ctx, tx0 + 3, ty0 + 3, tx1 - tx0 - 6, ty1 - ty0 - 6, 28); ctx.clip();
  liquid(ctx, t, tx0, tx1, surf, ty1, easeOut(seg(t, a + 0.1, a + 0.6))); ctx.restore();
  const dome = 520;
  beam(ctx, t, 760, dome + 4, surf - 6, easeOut(seg(t, a + 0.35, a + 0.8)));
  const pp = spring(seg(t, a, a + 0.9));
  product(ctx, IMG.c01, 760, dome + (1 - pp) * -40, 410, { sweep: seg(t, a + 0.25, a + 1.3), glow: pp, alpha: clamp(pp * 2) });
  // Beschriftungen (Datenblatt LM 50.17)
  const al = 1 - out;
  callout(ctx, t, a + 0.45, 760 - 30, 140, 440, 150, 'ANSCHLUSS', 'Rundstecker M12 × 1', al);
  callout(ctx, t, a + 0.7, 760 - 92, 250, 440, 262, 'GEHÄUSE', 'CrNi-Stahl 1.4404', al);
  callout(ctx, t, a + 0.95, 760 - 72, 420, 440, 400, 'PROZESSANSCHLUSS', 'G½A', al);
  callout(ctx, t, a + 1.2, 760 - 36, 505, 440, 540, 'SENSORLINSE', 'PEEK · 60 GHz', al);
  // Live-Messwert am Strahl
  const hp = easeOut(seg(t, a + 0.7, a + 1.1));
  if (hp > 0) {
    const x = 1010; ctx.globalAlpha = hp * al; ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 8, dome); ctx.lineTo(x + 8, dome); ctx.moveTo(x, dome); ctx.lineTo(x, surf); ctx.moveTo(x - 8, surf); ctx.lineTo(x + 8, surf); ctx.stroke();
    const mm = Math.round((surf - dome) * 3.6);
    label(ctx, 'ABSTAND', x + 22, (dome + surf) / 2 - 18, { size: 14, col: C.gray, alpha: hp * al });
    ctx.font = '34px InterSB'; ctx.fillStyle = C.ink; ctx.fillText(`${mm.toLocaleString('de-DE')} mm`, x + 22, (dome + surf) / 2 + 20);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // Titel rechts
  const o = b - 0.32;
  label(ctx, 'RADAR-FÜLLSTANDSSENSOR', 1250, 430, { size: 22, alpha: easeOut(seg(t, a + 0.15, a + 0.6)) * (1 - seg(t, o, o + 0.3)) });
  ctx.save();
  const ip = expoOut(seg(t, a + 0.3, a + 1.0));
  ctx.beginPath(); ctx.rect(1230, 440, 640, 230); ctx.clip();
  ctx.font = '250px InterXB'; ctx.letterSpacing = '-10px';
  const g = ctx.createLinearGradient(1250, 460, 1650, 660); g.addColorStop(0, C.blue); g.addColorStop(1, C.blue2);
  ctx.fillStyle = g; ctx.globalAlpha = 1 - quint(seg(t, o, o + 0.35)); ctx.fillText('ILT', 1240, 650 + (1 - ip) * 220 - quint(seg(t, o, o + 0.35)) * 200);
  ctx.letterSpacing = '0px'; ctx.restore();
  reveal(ctx, t, 'Typ ILT-C01 · ILT-C05', 1254, 720, 34, { t0: a + 0.75, font: 'InterM', col: C.gray, out: o, stagger: 0.06 });
  const cp = spring(seg(t, a + 1.05, a + 1.6));
  if (cp > 0) {
    ctx.save(); ctx.translate(1254, 760); ctx.scale(cp, cp); ctx.globalAlpha = 1 - seg(t, o, o + 0.3);
    shadow(ctx, 0.1, 26, 10); ctx.fillStyle = 'rgba(255,255,255,0.92)'; rrect(ctx, 0, 0, 390, 64, 32); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(32,86,174,0.18)'; ctx.lineWidth = 1.5; rrect(ctx, 0, 0, 390, 64, 32); ctx.stroke();
    ctx.fillStyle = C.blue2; ctx.beginPath(); ctx.arc(32, 32, 8 + Math.sin(t * 8) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '26px InterSB'; ctx.fillStyle = C.ink; ctx.fillText('60-GHz-FMCW · berührungslos', 54, 41); ctx.restore();
  }
}

// 3 Datenkarten im Raum (echte Perspektive, Tiefenunschärfe), Kamera fliegt am Ende hindurch
const CARDS = [
  { k: 'GENAUIGKEIT', v: '±5 mm', sub: 'Nichtwiederholbarkeit ≤ 2 mm', g: 'ruler', x: -600, y: -215 },
  { k: 'MESSABSTAND', v: 'bis 5 m', sub: 'ab 100 mm · Abstrahlwinkel ±6°', g: 'dist', x: 0, y: -245 },
  { k: 'TEMPERATUR', v: '−40 … +150 °C', sub: 'Hochtemperaturausführung ILT-C05', g: 'temp', x: 600, y: -215 },
  { k: 'VIBRATION / SCHOCK', v: '40 g / 100 g', sub: 'Schock nach IEC 60068-2-27', g: 'vib', x: -300, y: 205 },
  { k: 'SCHUTZART', v: 'IP67', sub: 'nach IEC 60529', g: 'ip', x: 300, y: 205 },
];
const [CW, CH] = [560, 330];
const CARDC = CARDS.map(() => offscreen(CW, CH)), BLURC = offscreen(CW, CH);
function cardGraphic(x, kind, t, p) {
  const y0 = 252, x0 = 40, x1 = CW - 40;
  x.save(); x.lineCap = 'round';
  if (kind === 'ruler') {
    for (let i = 0; i <= 40; i++) { const xx = lerp(x0, x1, i / 40), h = i % 10 === 0 ? 22 : i % 5 === 0 ? 14 : 8; x.strokeStyle = 'rgba(22,25,29,0.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(xx, y0 + 30); x.lineTo(xx, y0 + 30 - h); x.stroke(); }
    x.fillStyle = 'rgba(62,123,214,0.16)'; x.fillRect(CW / 2 - 40, y0 - 4, 80, 40);
    const m = CW / 2 + Math.exp(-p * 4) * Math.cos(p * 18) * 150; x.fillStyle = C.blue; x.beginPath(); x.moveTo(m, y0 + 2); x.lineTo(m - 9, y0 - 12); x.lineTo(m + 9, y0 - 12); x.closePath(); x.fill();
  }
  if (kind === 'dist') {
    const e = lerp(x0, x1, expoOut(clamp(p * 1.5))); x.strokeStyle = C.blue; x.lineWidth = 2.5;
    x.beginPath(); x.moveTo(x0, y0 + 14); x.lineTo(e, y0 + 14); x.stroke();
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0, y0 + 28); x.moveTo(e, y0); x.lineTo(e, y0 + 28); x.stroke();
    x.font = '17px InterM'; x.fillStyle = C.gray; x.fillText('0', x0 + 6, y0 + 50); const s = '5 m'; x.fillText(s, e - x.measureText(s).width - 4, y0 + 50);
  }
  if (kind === 'temp') {
    const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#6E9BE0'); g.addColorStop(0.45, '#E8C25C'); g.addColorStop(1, '#E2553F');
    x.fillStyle = 'rgba(22,25,29,0.08)'; rrect(x, x0, y0 + 6, x1 - x0, 16, 8); x.fill();
    x.fillStyle = g; rrect(x, x0, y0 + 6, (x1 - x0) * expoOut(clamp(p * 1.4)), 16, 8); x.fill();
    x.font = '17px InterM'; x.fillStyle = C.gray; x.fillText('−40 °C', x0, y0 + 50); const s = '+150 °C'; x.fillText(s, x1 - x.measureText(s).width, y0 + 50);
  }
  if (kind === 'vib') {
    x.strokeStyle = C.blue; x.lineWidth = 2.2; x.beginPath();
    for (let i = 0; i <= 160; i++) { const u = i / 160, xx = lerp(x0, x1, u), sp = Math.exp(-((u - 0.7) ** 2) / 0.0008) * 34; const yy = y0 + 16 + Math.sin(u * 60 - t * 20) * 7 * clamp(p * 2) + (u > 0.6 ? -sp : 0); i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
    x.stroke();
  }
  if (kind === 'ip') {
    x.fillStyle = C.blue;
    for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(x0 + 14 + (i % 4) * 14, y0 + 6 + Math.floor(i / 4) * 14 + (i % 2) * 4, 3.5, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); const dx = x0 + 150, dy = y0 + 4; x.moveTo(dx, dy - 8); x.bezierCurveTo(dx + 16, dy + 10, dx + 12, dy + 26, dx, dy + 26); x.bezierCurveTo(dx - 12, dy + 26, dx - 16, dy + 10, dx, dy - 8); x.fill();
    x.font = '17px InterM'; x.fillStyle = C.gray; x.fillText('staubdicht', x0, y0 + 50); x.fillText('wasserdicht', x0 + 120, y0 + 50);
  }
  x.restore();
}
function renderCard(i, t, p) {
  const c = CARDS[i], [cv, x] = CARDC[i];
  x.clearRect(0, 0, CW, CH);
  const g = x.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, 'rgba(255,255,255,0.96)'); g.addColorStop(1, 'rgba(247,249,252,0.9)');
  x.fillStyle = g; rrect(x, 2, 2, CW - 4, CH - 4, 30); x.fill();
  const b = x.createLinearGradient(0, 0, CW, CH); b.addColorStop(0, 'rgba(255,255,255,1)'); b.addColorStop(1, 'rgba(176,188,204,0.7)');
  x.strokeStyle = b; x.lineWidth = 2; rrect(x, 2, 2, CW - 4, CH - 4, 30); x.stroke();
  x.font = '17px InterSB'; x.letterSpacing = '3.5px'; x.fillStyle = C.blue; x.fillText(c.k, 40, 62); x.letterSpacing = '0px';
  // Zahlenwert rollt: Ziffern zählen vom Start bis zum Ziel
  const roll = expoOut(clamp(p * 1.3));
  const v = c.g === 'ip' ? c.v : c.v.replace(/\d+/g, (d) => String(Math.round(Number(d) * roll)));   // IP-Code nicht hochzählen
  x.font = `${c.v.length > 9 ? 64 : 84}px InterSB`; x.letterSpacing = '-2.5px'; x.fillStyle = C.ink; x.fillText(v, 36, 160); x.letterSpacing = '0px';
  x.font = '19px InterM'; x.fillStyle = C.gray; x.fillText(c.sub, 40, 205);
  cardGraphic(x, c.g, t, p);
  return cv;
}
function project(px, py, pz, cam) {
  const dx = px - cam.x, dz = pz - cam.z, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const x = dx * cy - dz * sy, z = dx * sy + dz * cy, f = 1400 / Math.max(60, z);
  return [CX + x * f, CY + (py - cam.y) * f, z];
}
function sceneData(ctx, t) {
  const [a, b] = T.data;
  studio(ctx, t);
  const fly = expoIn(seg(t, b - 0.45, b));
  const cam = { x: lerp(-140, 140, quint(seg(t, a, b))), y: -10, z: lerp(-1400, -250, fly), yaw: lerp(0.06, -0.06, quint(seg(t, a, b))) };
  const list = CARDS.map((c, i) => {
    const ts = a + 0.1 + i * BEAT * 0.95, p = seg(t, ts, ts + 1.4), e = expoOut(seg(t, ts, ts + 0.9));
    return { i, ts, p, e, z: lerp(2600, 0, e), alpha: clamp(e * 2.5) };
  }).filter((o) => t >= o.ts);
  list.sort((p, q) => q.z - p.z);
  for (const o of list) {
    const c = CARDS[o.i], cz = o.z;
    const corners = [[-CW / 2, -CH / 2], [CW / 2, -CH / 2], [CW / 2, CH / 2], [-CW / 2, CH / 2]].map(([dx, dy]) => {
      const rx = (1 - o.e) * 0.6;                          // Karte kippt beim Anflug nach vorn
      const yy = dy * Math.cos(rx), zz = cz + dy * Math.sin(rx);
      return project(c.x + dx, c.y + yy, zz, cam);
    });
    if (corners.some((p) => p[2] < 80)) continue;
    const q = corners.map((p) => [p[0], p[1]]);
    const cv = renderCard(o.i, t, o.p);
    const depthBlur = clamp(Math.abs(corners[0][2] - 1400) / 700) * 7 + fly * 4;
    let src = cv;
    if (depthBlur > 0.6) { const [bc, bx] = BLURC; bx.clearRect(0, 0, CW, CH); bx.filter = `blur(${depthBlur.toFixed(1)}px)`; bx.drawImage(cv, 0, 0); bx.filter = 'none'; src = bc; }
    ctx.save(); ctx.globalAlpha = o.alpha * (1 - fly * 0.6);
    shadow(ctx, 0.1 * o.alpha, 60, 30); ctx.fillStyle = 'rgba(255,255,255,0.01)';
    ctx.beginPath(); q.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); noShadow(ctx);
    drawQuad(ctx, src, q, 4); ctx.restore();
  }
  reveal(ctx, t, 'Präzise. Robust. Wartungsfrei.', CX, 1010, 52, { t0: a + 2.9, align: 'center', out: b - 0.4, accent: { 'Wartungsfrei.': C.blue }, stagger: 0.14 });
  const wf = seg(t, b - 0.12, b); if (wf > 0) { ctx.fillStyle = `rgba(250,251,252,${wf})`; ctx.fillRect(0, 0, W, H); }
}

// 4 Durch die Kunststoffwand
function lineIcon(ctx, kind, x, y, s, p) {
  ctx.save(); ctx.strokeStyle = C.blue; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash([400, 400]); ctx.lineDashOffset = 400 * (1 - p); ctx.beginPath();
  if (kind === 'fl') { ctx.moveTo(x, y - s); ctx.bezierCurveTo(x + s * 0.9, y, x + s * 0.7, y + s * 0.8, x, y + s * 0.8); ctx.bezierCurveTo(x - s * 0.7, y + s * 0.8, x - s * 0.9, y, x, y - s); ctx.moveTo(x - s * 0.35, y + s * 0.35); ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.6, x, y + s * 0.6); }
  if (kind === 'hv') { ctx.moveTo(x - s, y - s * 0.8); ctx.lineTo(x + s, y - s * 0.8); ctx.moveTo(x - s * 0.5, y - s * 0.8); ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.6, x - s * 0.12, y - s * 0.1); ctx.bezierCurveTo(x - s * 0.55, y + s * 0.3, x - s * 0.3, y + s * 0.9, x, y + s * 0.9); ctx.bezierCurveTo(x + s * 0.3, y + s * 0.9, x + s * 0.55, y + s * 0.3, x + s * 0.12, y - s * 0.1); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.6, x + s * 0.5, y - s * 0.8); }
  if (kind === 'fe') { for (const [dx, dy, r] of [[-0.5, 0.45, 0.32], [0.25, 0.5, 0.34], [-0.15, -0.05, 0.3], [0.6, -0.05, 0.26], [-0.65, -0.3, 0.22], [0.15, -0.6, 0.24]]) { ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); } }
  ctx.stroke(); ctx.restore();
}
function scenePlastic(ctx, t) {
  const [a, b] = T.plastic;
  studio(ctx, t);
  const inn = expoOut(seg(t, a, a + 0.8)), out = expoIn(seg(t, b - 0.35, b));
  ctx.save(); const s = lerp(1.12, 1, inn); ctx.translate(1370, 640); ctx.scale(s, s); ctx.translate(-1370 - out * 500, -640); ctx.globalAlpha = clamp(inn * 1.5) * (1 - out);
  const x0 = 1090, x1 = 1650, y0 = 400, y1 = 990, wall = 18;
  glassTank(ctx, x0, y0, x1, y1, 46, { tint: 'rgba(214,226,240,0.6)', wall });
  ctx.save(); rrect(ctx, x0 + wall, y0 + wall, x1 - x0 - 2 * wall, y1 - y0 - 2 * wall, 30); ctx.clip();
  liquid(ctx, t, x0 + wall, x1 - wall, 700, y1, 1); ctx.restore();
  label(ctx, 'KUNSTSTOFFTANK', (x0 + x1) / 2, y1 - 40, { size: 16, col: 'rgba(255,255,255,0.75)', align: 'center' });
  const sx = 1370, dome = 392;
  beam(ctx, t, sx, dome, 690, 1);
  const pulse = 0.5 + 0.5 * Math.sin(t * 9);   // Durchtritt durch die Wand leuchtet
  const wg = ctx.createRadialGradient(sx, y0 + wall / 2, 2, sx, y0 + wall / 2, 90);
  wg.addColorStop(0, `rgba(110,155,224,${0.55 + 0.25 * pulse})`); wg.addColorStop(1, 'rgba(110,155,224,0)');
  ctx.fillStyle = wg; ctx.fillRect(sx - 100, y0 - 40, 200, 90);
  product(ctx, IMG.c01, sx, dome, 300, { glow: 0.6, sweep: seg(t, a + 0.3, a + 1.2) });
  callout(ctx, t, a + 0.9, sx + 70, y0 + wall / 2, 1500, 300, 'MONTAGE', 'von außen, durch die Wand', 1);
  ctx.restore();
  const o = b - 0.35;
  label(ctx, 'BERÜHRUNGSLOS', 200, 380, { size: 20, alpha: easeOut(seg(t, a + 0.1, a + 0.5)) * (1 - seg(t, o, o + 0.3)) });
  reveal(ctx, t, 'Misst auch durch', 196, 480, 82, { t0: a + 0.2, out: o });
  reveal(ctx, t, 'Kunststoff.', 196, 578, 82, { t0: a + 0.45, out: o, accent: { 'Kunststoff.': C.blue } });
  [['fl', 'Flüssig'], ['hv', 'Hochviskos'], ['fe', 'Fest']].forEach(([k, l], i) => {
    const ts = a + 1.0 + i * 0.2, q = expoOut(seg(t, ts, ts + 0.7)), d = easeOut(seg(t, ts + 0.15, ts + 0.9));
    if (q <= 0) return;
    const x = 270 + i * 210, y = 760;
    ctx.save(); ctx.globalAlpha = q * (1 - quint(seg(t, o, o + 0.35))); ctx.translate(x, y + (1 - q) * 40);
    shadow(ctx, 0.08, 34, 14); ctx.fillStyle = 'rgba(255,255,255,0.9)'; rrect(ctx, -78, -78, 156, 156, 36); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(176,188,204,0.5)'; ctx.lineWidth = 1.5; rrect(ctx, -78, -78, 156, 156, 36); ctx.stroke();
    lineIcon(ctx, k, 0, -4, 34, d);
    ctx.font = '24px InterM'; ctx.fillStyle = C.ink; const w = ctx.measureText(l).width; ctx.fillText(l, -w / 2, 122);
    ctx.restore();
  });
}

// 5 ILT-C05 auf glänzendem Boden, Sog, finaler Hit mit Logo
const SPARK = (() => { const r = rand(21); return Array.from({ length: 70 }, () => ({ a: r() * Math.PI * 2, v: 160 + r() * 520, s: 1.5 + r() * 3.5, c: r() < 0.6 })); })();
const [LOGOC, LOGOX] = offscreen(1400, 700);
function sceneFinal(ctx, t) {
  const [a] = T.final;
  if (t < HIT) {
    const floor = 880;
    studio(ctx, t, floor);
    const suck = expoIn(seg(t, HIT - 0.42, HIT)), s = 1 - suck * 0.18;
    ctx.save(); ctx.translate(760, 560); ctx.scale(s, s); ctx.translate(-760, -560);
    const p = expoOut(seg(t, a, a + 0.9));
    product(ctx, IMG.c05, 700, floor, 660, { reflect: true, glow: p, sweep: seg(t, a + 0.25, a + 1.0), alpha: clamp(p * 1.6), scale: lerp(0.92, 1, p) });
    const o = HIT - 0.42;
    label(ctx, 'TYP ILT-C05 · BIS +150 °C', 1064, 430, { size: 20, alpha: easeOut(seg(t, a + 0.1, a + 0.5)) * (1 - seg(t, o, o + 0.3)) });
    reveal(ctx, t, 'Gebaut für mobile', 1060, 530, 76, { t0: a + 0.15, out: o, stagger: 0.07 });
    reveal(ctx, t, 'Arbeitsmaschinen.', 1060, 622, 76, { t0: a + 0.36, out: o, stagger: 0.07, accent: { 'Arbeitsmaschinen.': C.blue } });
    ctx.restore();
    const wf = seg(t, HIT - 0.12, HIT); if (wf > 0) { ctx.fillStyle = `rgba(255,255,255,${wf})`; ctx.fillRect(0, 0, W, H); }
    return;
  }
  studio(ctx, t);
  const push = 1 + quint(seg(t, HIT, DUR)) * 0.035;
  ctx.save(); ctx.translate(CX, 520); ctx.scale(push, push); ctx.translate(-CX, -520);
  // Funken-Ring beim Einschlag
  const sp = seg(t, HIT, HIT + 1.6);
  if (sp > 0 && sp < 1) {
    for (const s of SPARK) {
      const d = expoOut(sp) * s.v, x = CX + Math.cos(s.a) * d * 1.3, y = 470 + Math.sin(s.a) * d * 0.75;
      ctx.globalAlpha = (1 - sp) * 0.9; ctx.fillStyle = s.c ? C.blue2 : '#9EC0F0'; ctx.beginPath(); ctx.arc(x, y, s.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Logo: wird scharf, Glanz läuft darüber, blaues Leuchten
  const lp = expoOut(seg(t, HIT, HIT + 0.9)), lw = 700 * lerp(1.1, 1, lp), lh = lw * IMG.logo.height / IMG.logo.width;
  LOGOX.clearRect(0, 0, 1400, 700); LOGOX.drawImage(IMG.logo, 0, 0, lw, lh);
  const sw = seg(t, HIT + 0.5, HIT + 1.3);
  if (sw > 0 && sw < 1) {
    LOGOX.globalCompositeOperation = 'source-atop';
    const sx = lerp(-200, lw + 200, sw), g = LOGOX.createLinearGradient(sx - 90, 0, sx + 90, lh * 0.4);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    LOGOX.fillStyle = g; LOGOX.fillRect(0, 0, lw, lh); LOGOX.globalCompositeOperation = 'source-over';
  }
  ctx.save(); if (lp < 0.98) ctx.filter = `blur(${((1 - lp) * 14).toFixed(1)}px)`;
  ctx.shadowColor = `rgba(62,123,214,${0.35 * (1 - seg(t, HIT + 0.4, HIT + 2))})`; ctx.shadowBlur = 60;
  ctx.globalAlpha = clamp(lp * 1.4); ctx.drawImage(LOGOC, 0, 0, lw, lh, CX - lw / 2, 470 - lh / 2, lw, lh); ctx.restore();
  // Button + Cursor
  const pp = spring(seg(t, HIT + 0.85, HIT + 1.5)), tc = HIT + 1.75;
  const press = t > tc ? 1 - 0.05 * Math.sin(Math.PI * seg(t, tc, tc + 0.2)) : 1;
  if (pp > 0) {
    ctx.save(); ctx.translate(CX, 790); ctx.scale(pp * press, pp * press);
    shadow(ctx, 0.25, 40, 16);
    const g = ctx.createLinearGradient(0, -46, 0, 46); g.addColorStop(0, '#3471CF'); g.addColorStop(1, '#1D4E9F');
    ctx.fillStyle = g; rrect(ctx, -270, -46, 540, 92, 46); ctx.fill(); noShadow(ctx);
    const hl = ctx.createLinearGradient(0, -46, 0, 0); hl.addColorStop(0, 'rgba(255,255,255,0.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; rrect(ctx, -266, -42, 532, 44, 40); ctx.fill();
    ctx.font = '31px InterSB'; ctx.fillStyle = '#fff'; const s = 'Mehr erfahren  →  wika.com', w = ctx.measureText(s).width; ctx.fillText(s, -w / 2, 11);
    ctx.restore();
  }
  const cm = quint(seg(t, HIT + 1.1, tc));
  if (cm > 0) {
    const x = lerp(1560, CX + 150, cm), y = lerp(1040, 805, cm), s = t > tc ? 1 - 0.14 * Math.sin(Math.PI * seg(t, tc, tc + 0.2)) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * 1.7, s * 1.7); shadow(ctx, 0.25, 8, 3);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 20); ctx.lineTo(12, 31); ctx.lineTo(17, 29); ctx.lineTo(12, 18); ctx.lineTo(21, 18); ctx.closePath(); ctx.fill(); noShadow(ctx); ctx.stroke(); ctx.restore();
    const rp = seg(t, tc, tc + 0.6);
    if (rp > 0 && rp < 1) { ctx.globalAlpha = (1 - rp) * 0.8; ctx.strokeStyle = C.blueL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(CX + 150, 805, 12 + rp * 70, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  const wf = 1 - seg(t, HIT, HIT + 0.45); if (wf > 0) { ctx.fillStyle = `rgba(255,255,255,${wf})`; ctx.fillRect(0, 0, W, H); }
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over'; noShadow(ctx);
  ctx.imageSmoothingQuality = 'high';
  const sc = [['intro', sceneIntro], ['hero', sceneHero], ['data', sceneData], ['plastic', scenePlastic], ['final', sceneFinal]];
  for (const [k, fn] of sc) if (t >= T[k][0] && t < T[k][1]) return fn(ctx, t);
  sceneFinal(ctx, t);
}

// ---------- Nachbearbeitung: Unterbilder mitteln, Vignette, Filmkorn ----------
const VIG = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - CX) / CX, dy = (y - CY) / CY; VIG[y * W + x] = 1 - 0.09 * Math.pow(dx * dx * 0.8 + dy * dy, 1.3); }
const GRAIN = (() => { const r = rand(77), g = new Int8Array(W * H + 4096); for (let i = 0; i < g.length; i++) g[i] = Math.round((r() + r() - 1) * 3.2); return g; })();
const ACC = new Float32Array(W * H * 4), OUTB = Buffer.alloc(W * H * 4);
function renderOutput(ctx, t, sub) {
  ACC.fill(0);
  for (let k = 0; k < sub; k++) {
    const tt = sub === 1 ? t : t + ((k + 0.5) / sub - 0.5) * SHUTTER / FPS;
    drawFrame(ctx, clamp(tt, 0, DUR - 1e-4));
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < d.length; i++) ACC[i] += d[i];
  }
  const off = (Math.floor(t * FPS) * 1543) % 4096;
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    const v = VIG[p] / sub, gn = GRAIN[p + off];
    OUTB[i] = clamp(ACC[i] * v + gn, 0, 255); OUTB[i + 1] = clamp(ACC[i + 1] * v + gn, 0, 255); OUTB[i + 2] = clamp(ACC[i + 2] * v + gn, 0, 255); OUTB[i + 3] = 255;
  }
  return OUTB;
}

function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  [0.45, 0.7, 0.95, 1.2].forEach((d) => add(T.hero[0] + d, 'blip', 0.12));
  CARDS.forEach((_, i) => add(T.data[0] + 0.1 + i * BEAT * 0.95, 'whoosh', 0.18));
  add(T.data[1] - 0.35, 'whoosh', 0.4);
  [0, 1, 2].forEach((i) => add(T.plastic[0] + 1.0 + i * 0.2, 'pop', 0.12));
  add(HIT + 1.75, 'click', 0.45);
  return c.sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, scenes: T, vo: [] }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number) : Array.from({ length: 20 }, (_, i) => 0.4 + i * 0.74);
    const files = [];
    const [oc, ox] = offscreen(W, H);
    for (const t of times) {
      const buf = renderOutput(ctx, t, 1); const id = ox.createImageData(W, H); id.data.set(buf); ox.putImageData(id, 0, 0);
      const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await oc.encode('png')); files.push([f, t]);
    }
    if (args[0] === '--contact') {
      const tw = 480, th = 270, cols = 5, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw - 4, th - 4); sc.fillStyle = '#fff'; sc.font = '20px InterM'; sc.fillText(`${t.toFixed(1)} s`, x + 6, y + 22);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png'); fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
    } else console.log(files.map(([f]) => f).join('\n'));
    return;
  }
  const from = arg('--from', 0), to = arg('--to', DUR), sub = arg('--sub', SUB);
  const outFile = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'grain', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let n = Math.round(from * FPS); n < Math.round(to * FPS); n++) {
    const buf = renderOutput(ctx, n / FPS, sub);
    if (!ff.stdin.write(Buffer.from(buf))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 60 === 0) process.stdout.write(`\r${(n / FPS).toFixed(1)} / ${to.toFixed(1)} s  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
