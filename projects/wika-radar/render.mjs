// WIKA Radar-Füllstandssensor ILT, 15-s-Werbung (Grammatik: refs/ref-07). 1920x1080, 60 fps, 6 Takte à 96 BPM.
// Ablauf: shotlist.md, Stil: style_guide.md, Assets: assets/wika/ (aus den WIKA-Datenblättern LM 50.17 / LM 50.27).
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
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-500.ttf'), 'InterM');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');

const C = { bg: '#FBFBFB', bg2: '#EEF0F3', ink: '#1F2122', gray: '#8A8F96', light: '#B9BDC3', blue: '#2056AE', blueL: '#5B8FD6', liquid: '#2F6FC9' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(9 * x));
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const BPM = 96, BEAT = 60 / BPM, BAR = 4 * BEAT, DUR = 6 * BAR;
const S = { intro: [0, 1], produkt: [1, 2], daten: [2, 3.5], kunststoff: [3.5, 4.5], finale: [4.5, 6] };
for (const k in S) S[k] = S[k].map((b) => b * BAR);
const HIT = 5 * BAR;

// ---------- Helfer ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function shadow(ctx, a = 0.12, blur = 50, dy = 22) { ctx.shadowColor = `rgba(20,30,50,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function background(ctx) {
  const g = ctx.createRadialGradient(CX, CY - 80, 100, CX, CY, 1200);
  g.addColorStop(0, C.bg); g.addColorStop(1, C.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Wörter erscheinen einzeln: erst hellgrau, dann dunkel (wie in der Referenz)
function words(ctx, t, str, x, y, size, t0, step = BEAT / 2, { font = 'InterM', align = 'center', out = Infinity, col = C.ink, accent = {} } = {}) {
  ctx.font = `${size}px ${font}`; ctx.letterSpacing = `${-size * 0.02}px`;
  const ws = str.split(' '), sp = ctx.measureText(' ').width, wd = ws.map((w) => ctx.measureText(w).width);
  const total = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = align === 'center' ? x - total / 2 : x;
  const o = easeIn(seg(t, out, out + 0.3));
  ws.forEach((w, i) => {
    const ts = t0 + i * step, p = easeOut(seg(t, ts, ts + 0.3)), dark = easeOut(seg(t, ts + 0.15, ts + 0.45));
    if (p > 0) {
      const target = accent[w] || col;
      ctx.globalAlpha = p * (1 - o); ctx.fillStyle = dark < 1 ? mix(C.light, target, dark) : target;
      ctx.fillText(w, cx, y + (1 - p) * 14 - o * 14); ctx.globalAlpha = 1;
    }
    cx += wd[i] + sp;
  });
  ctx.letterSpacing = '0px';
  return total;
}
function hex(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function mix(a, b, t) { const p = hex(a), q = hex(b); return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], t))).join(',')})`; }

const IMG = {}; const ALPHA = {};
async function loadAssets() {
  for (const k of ['ilt_c01', 'ilt_c05', 'logo']) IMG[k] = await loadImage(A(k + '.png'));
  // Alpha-Raster des Sensors für die Punkt-Montage
  const c = createCanvas(44, 80), x = c.getContext('2d'); x.drawImage(IMG.ilt_c01, 0, 0, 44, 80);
  ALPHA.c01 = x.getImageData(0, 0, 44, 80).data;
}
// Produktfoto mit Lichtkante, die über das Metall gleitet (nur auf dem Produkt)
const off = createCanvas(700, 1300), offx = off.getContext('2d');
function product(ctx, img, cx, cy, h, { sweep = -1, alpha = 1, rot = 0, scale = 1, shadowA = 0.18 } = {}) {
  if (alpha <= 0) return;
  const w = h * img.width / img.height;
  offx.clearRect(0, 0, off.width, off.height);
  offx.drawImage(img, 0, 0, w, h);
  if (sweep >= 0 && sweep <= 1) {
    offx.globalCompositeOperation = 'source-atop';
    const sx = lerp(-w, w * 2, sweep), g = offx.createLinearGradient(sx - 120, 0, sx + 120, h * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    offx.fillStyle = g; offx.fillRect(0, 0, w, h); offx.globalCompositeOperation = 'source-over';
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(scale, scale);
  // weicher Bodenschatten
  if (shadowA > 0) {   // runder, weicher Bodenschatten (elliptisch gestauchter Kreisverlauf)
    ctx.save(); ctx.translate(0, h / 2 + 34); ctx.scale(1, 0.16);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
    sg.addColorStop(0, `rgba(20,30,50,${shadowA})`); sg.addColorStop(1, 'rgba(20,30,50,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, w * 0.75, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.drawImage(off, 0, 0, w, h, -w / 2, -h / 2, w, h);
  ctx.restore();
}
// Radarkegel ±6° mit wandernden Wellenbögen
function radarBeam(ctx, t, x, y0, y1, alpha = 1, halfAngle = 6) {
  if (alpha <= 0) return;
  const tan = Math.tan(halfAngle * Math.PI / 180) * 2.2;     // optisch etwas breiter, damit man ihn sieht
  const len = y1 - y0;
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(91,143,214,0.45)'); g.addColorStop(1, 'rgba(91,143,214,0.08)');
  ctx.globalAlpha = alpha; ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 10, y0); ctx.lineTo(x + 10, y0); ctx.lineTo(x + 10 + len * tan, y1); ctx.lineTo(x - 10 - len * tan, y1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.blueL; ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const u = ((t * 1.2 + k / 4) % 1), yy = y0 + u * len, r = 10 + u * len * tan;
    ctx.globalAlpha = alpha * (1 - u) * 0.9; ctx.beginPath(); ctx.ellipse(x, yy, r, r * 0.22, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function liquid(ctx, t, x0, x1, y, yBottom, alpha = 1) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y, 0, yBottom); g.addColorStop(0, 'rgba(47,111,201,0.55)'); g.addColorStop(1, 'rgba(32,86,174,0.85)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, yBottom);
  for (let i = 0; i <= 60; i++) { const u = i / 60, xx = lerp(x0, x1, u); ctx.lineTo(xx, y + Math.sin(u * 9 + t * 3) * 6 + Math.sin(u * 4 - t * 2) * 4); }
  ctx.lineTo(x1, yBottom); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= 60; i++) { const u = i / 60, xx = lerp(x0, x1, u), yy = y + Math.sin(u * 9 + t * 3) * 6 + Math.sin(u * 4 - t * 2) * 4; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke(); ctx.globalAlpha = 1;
}

// ================= Szenen =================
// 1 Punkte als Radarwellen -> setzen sich zum Sensor zusammen
function sceneIntro(ctx, t) {
  const [a, b] = S.intro;
  background(ctx);
  const sx = CX, sy = 300;
  // Wellen aus Punkten
  for (let k = 0; k < 5; k++) {
    const u = ((t * 0.55 + k / 5) % 1), r = 40 + u * 700, al = (1 - u) * (1 - seg(t, b - 0.9, b - 0.4));
    if (al <= 0) continue;
    const n = Math.floor(14 + r / 18);
    for (let i = 0; i <= n; i++) {
      const ang = Math.PI * (0.15 + 0.7 * i / n);
      ctx.globalAlpha = al * 0.8; ctx.fillStyle = C.blueL;
      ctx.fillRect(sx + Math.cos(ang) * r - 4, sy + Math.sin(ang) * r * 0.75 - 4, 8, 8);
    }
  }
  ctx.globalAlpha = 1;
  // Punkt-Montage des Sensors (Pixel wie das Pixel-Logo der Referenz)
  const asm = seg(t, b - 1.0, b - 0.25);
  if (asm > 0) {
    const r = rand(5), cw = 6.5;
    for (let j = 0; j < 80; j++) for (let i = 0; i < 44; i++) {
      const al = ALPHA.c01[(j * 44 + i) * 4 + 3]; if (al < 128) continue;
      const d = r(), p = easeOut(clamp((asm - d * 0.6) / 0.4));
      if (p <= 0) continue;
      const tx = CX - 22 * cw + i * cw, ty = 210 + j * cw;
      const fx = tx + (r() - 0.5) * 900 * (1 - p), fy = ty + (r() - 0.5) * 600 * (1 - p);
      ctx.globalAlpha = p; ctx.fillStyle = mix(C.blueL, C.blue, d); ctx.fillRect(fx, fy, cw - 1.5, cw - 1.5);
    }
    ctx.globalAlpha = 1;
  }
  const out = b - 0.35;
  words(ctx, t, 'Füllstand messen.', CX, 880, 72, a + 0.15, BEAT / 2, { out: a + 2 * BEAT - 0.3 });
  words(ctx, t, 'Ohne Berührung.', CX, 880, 72, a + 2 * BEAT, BEAT / 2, { out, accent: { 'Berührung.': C.blue } });
}

// 2 Einschlag: ILT-C01 auf dem Tank, Radarkegel, Flüssigkeit
function sceneProdukt(ctx, t) {
  const [a, b] = S.produkt;
  background(ctx);
  const p = spring(seg(t, a, a + 0.8)), out = easeIn(seg(t, b - 0.35, b));
  const px = 640, top = 180, ph = 360;
  ctx.save(); ctx.translate(-out * 200, 0); ctx.globalAlpha = 1 - out;
  // Tank-Ausschnitt
  const tx0 = 420, tx1 = 860, ty0 = top + ph - 10, ty1 = 1000;
  ctx.globalAlpha = (1 - out) * easeOut(seg(t, a + 0.2, a + 0.7));
  ctx.strokeStyle = '#C9CDD3'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx0, ty1); ctx.lineTo(tx1, ty1); ctx.lineTo(tx1, ty0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx0 - 20, ty0); ctx.lineTo(tx1 + 20, ty0); ctx.stroke();
  ctx.globalAlpha = 1 - out;
  liquid(ctx, t, tx0 + 3, tx1 - 3, lerp(ty1 - 10, 780, easeInOut(seg(t, a + 0.3, a + 1.6))), ty1 - 3, 1 - out);
  radarBeam(ctx, t, px, ty0 + 6, lerp(ty1 - 10, 780, easeInOut(seg(t, a + 0.3, a + 1.6))) - 6, easeOut(seg(t, a + 0.5, a + 0.9)) * (1 - out));
  product(ctx, IMG.ilt_c01, px, top + ph / 2 - 30 * (1 - p), ph, { scale: lerp(0.85, 1, p), alpha: clamp(p * 2), sweep: seg(t, a + 0.4, a + 1.3) });
  ctx.restore();
  // Text rechts
  const o = b - 0.35;
  words(ctx, t, 'Radar-Füllstandssensor', 1060, 470, 58, a + 0.35, BEAT / 2, { align: 'left', out: o });
  ctx.globalAlpha = easeOut(seg(t, a + 2 * BEAT, a + 2 * BEAT + 0.4)) * (1 - easeIn(seg(t, o, o + 0.3)));
  ctx.font = '150px InterXB'; ctx.letterSpacing = '-4px'; ctx.fillStyle = C.blue; ctx.fillText('ILT', 1056, 630); ctx.letterSpacing = '0px';
  const cp = spring(seg(t, a + 3 * BEAT, a + 3 * BEAT + 0.5));
  if (cp > 0) {
    ctx.save(); ctx.translate(1060, 690); ctx.scale(cp, cp); ctx.globalAlpha = 1 - easeIn(seg(t, o, o + 0.3));
    shadow(ctx, 0.1, 24, 8); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, 330, 66, 33); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.blueL; ctx.beginPath(); ctx.arc(34, 33, 9, 0, Math.PI * 2); ctx.fill();
    ctx.font = '30px InterM'; ctx.fillStyle = C.ink; ctx.fillText('60-GHz-FMCW', 58, 44); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// 3 Datenkarten, Kamera fährt seitlich
const CARDS = [['±5 mm', 'Genauigkeit'], ['bis 5 m', 'Messabstand'], ['−40 … +150 °C', 'Temperaturbereich'], ['40 g / 100 g', 'Vibration / Schock'], ['IP67', 'Schutzart']];
const CPOS = [[400, 330], [960, 280], [1520, 330], [680, 640], [1240, 640]];
function sceneDaten(ctx, t) {
  const [a, b] = S.daten;
  background(ctx);
  const cam = lerp(80, -80, easeInOut(seg(t, a, b))), out = easeIn(seg(t, b - 0.3, b));
  CARDS.forEach(([v, l], i) => {
    const ts = a + i * BEAT * 0.9, p = spring(seg(t, ts, ts + 0.6));
    if (p <= 0) return;
    const [x, y] = CPOS[i], depth = i % 2 ? 0.6 : 1;
    ctx.save(); ctx.translate(x + cam * depth - out * 300 * depth, y + (1 - p) * 60); ctx.globalAlpha = clamp(p * 2) * (1 - out);
    ctx.transform(1, (i - 2) * -0.012, 0, 1, 0, 0); ctx.scale(lerp(0.95, 1.2, p), lerp(0.95, 1.2, p));
    const w = 440, h = 230;
    shadow(ctx, 0.11, 50, 24); ctx.fillStyle = '#fff'; rrect(ctx, -w / 2, -h / 2, w, h, 26); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.blue; rrect(ctx, -w / 2 + 34, -h / 2 + 34, 40, 6, 3); ctx.fill();
    ctx.font = `${v.length > 9 ? 56 : 72}px InterXB`; ctx.letterSpacing = '-2px'; ctx.fillStyle = C.ink; ctx.fillText(v, -w / 2 + 32, 22); ctx.letterSpacing = '0px';
    ctx.font = '28px InterM'; ctx.fillStyle = C.gray; ctx.fillText(l, -w / 2 + 34, 76);
    ctx.restore();
  });
  words(ctx, t, 'Präzise. Robust. Wartungsfrei.', CX, 940, 54, a + 5 * BEAT * 0.9, BEAT / 2, { out: b - 0.3, accent: { 'Wartungsfrei.': C.blue } });
}

// 4 Durch die Kunststoffwand + Messstoff-Icons
function icon(ctx, kind, x, y, s) {
  ctx.fillStyle = C.blue; ctx.strokeStyle = C.blue; ctx.lineWidth = 5;
  if (kind === 'fl') { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.bezierCurveTo(x + s * 0.9, y, x + s * 0.7, y + s * 0.8, x, y + s * 0.8); ctx.bezierCurveTo(x - s * 0.7, y + s * 0.8, x - s * 0.9, y, x, y - s); ctx.fill(); }
  if (kind === 'hv') { // zäher Tropfen, der langsam abreißt
    ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 0.9); ctx.lineTo(x + s * 0.9, y - s * 0.9); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.75, x + s * 0.12, y - s * 0.2);
    ctx.lineTo(x - s * 0.12, y - s * 0.2); ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.75, x - s * 0.9, y - s * 0.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.55, y + s * 0.2, x + s * 0.45, y + s * 0.85, x, y + s * 0.85); ctx.bezierCurveTo(x - s * 0.45, y + s * 0.85, x - s * 0.55, y + s * 0.2, x, y - s * 0.35); ctx.fill(); }
  if (kind === 'fe') { for (const [dx, dy, r] of [[-0.5, 0.4, 0.3], [0.2, 0.45, 0.32], [-0.15, -0.1, 0.3], [0.55, -0.05, 0.25], [-0.6, -0.3, 0.2], [0.1, -0.55, 0.22]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); } }
}
function sceneKunststoff(ctx, t) {
  const [a, b] = S.kunststoff;
  background(ctx);
  const p = easeOut(seg(t, a, a + 0.5)), out = easeIn(seg(t, b - 0.3, b));
  ctx.save(); ctx.globalAlpha = p * (1 - out);
  // transparenter Kunststofftank
  const x0 = 1050, x1 = 1620, y0 = 420, y1 = 960, wall = 22;
  ctx.fillStyle = 'rgba(200,215,230,0.35)'; rrect(ctx, x0, y0, x1 - x0, y1 - y0, 40); ctx.fill();
  ctx.save(); rrect(ctx, x0 + wall, y0 + wall, x1 - x0 - 2 * wall, y1 - y0 - 2 * wall, 24); ctx.clip();
  ctx.fillStyle = C.bg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  liquid(ctx, t, x0 + wall, x1 - wall, 700, y1 - wall, 1); ctx.restore();
  ctx.strokeStyle = 'rgba(150,170,190,0.6)'; ctx.lineWidth = 3; rrect(ctx, x0, y0, x1 - x0, y1 - y0, 40); ctx.stroke();
  // Sensor außen über der Wand, Strahl geht durch die Wand (Aufblitzen)
  const sx = 1335;
  product(ctx, IMG.ilt_c01, sx, 250, 240, { shadowA: 0 });
  radarBeam(ctx, t, sx, 372, 690, 1);
  const flash = 0.5 + 0.5 * Math.sin(t * 8);
  ctx.fillStyle = `rgba(91,143,214,${0.25 + 0.35 * flash})`; ctx.fillRect(sx - 60, y0, 120, wall);
  ctx.restore();
  // Text links + Icons
  words(ctx, t, 'Misst auch durch', 160, 470, 66, a + 0.1, BEAT / 2, { align: 'left', out: b - 0.3 });
  words(ctx, t, 'Kunststoff.', 160, 556, 66, a + 0.1 + 1.5 * BEAT, BEAT / 2, { align: 'left', out: b - 0.3, accent: { 'Kunststoff.': C.blue } });
  [['fl', 'Flüssig'], ['hv', 'Hochviskos'], ['fe', 'Fest']].forEach(([k, l], i) => {
    const ts = a + 2 * BEAT + i * BEAT * 0.5, q = spring(seg(t, ts, ts + 0.5));
    if (q <= 0) return;
    const x = 230 + i * 230, y = 760;
    ctx.save(); ctx.globalAlpha = clamp(q * 2) * (1 - out); ctx.translate(x, y); ctx.scale(q, q);
    shadow(ctx, 0.1, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, -80, -80, 160, 160, 34); ctx.fill(); noShadow(ctx);
    icon(ctx, k, 0, -6, 36); ctx.restore();
    ctx.globalAlpha = clamp(q * 2) * (1 - out); ctx.font = '30px InterM'; ctx.fillStyle = C.ink; const w = ctx.measureText(l).width; ctx.fillText(l, x - w / 2, y + 130); ctx.globalAlpha = 1;
  });
}

// 5 ILT-C05 steigt auf, Sog, finaler Hit: WIKA-Logo + Pille + Cursor-Klick
function sceneFinale(ctx, t) {
  const [a] = S.finale;
  background(ctx);
  if (t < HIT) {
    const p = spring(seg(t, a, a + 0.9)), suck = easeIn(seg(t, HIT - 0.4, HIT));
    ctx.save(); ctx.translate(CX, CY); ctx.scale(1 - suck * 0.25, 1 - suck * 0.25); ctx.translate(-CX, -CY);
    product(ctx, IMG.ilt_c05, 700, lerp(900, 520, p), 620, { alpha: clamp(p * 2) * (1 - suck), sweep: seg(t, a + 0.3, a + 1.1) });
    words(ctx, t, 'Gebaut für', 1050, 500, 66, a + 0.02, 0.16, { align: 'left', out: HIT - 0.3 });
    words(ctx, t, 'mobile Arbeitsmaschinen.', 1050, 586, 66, a + 0.3, 0.16, { align: 'left', out: HIT - 0.3, accent: { 'Arbeitsmaschinen.': C.blue } });
    ctx.restore();
    return;
  }
  // Hit: weißer Blitz, Logo schärft sich
  const f = 1 - seg(t, HIT, HIT + 0.35);
  const lp = easeOut(seg(t, HIT, HIT + 0.6)), lw = 700 * lerp(1.12, 1, lp), lh = lw * IMG.logo.height / IMG.logo.width;
  ctx.save(); if (lp < 1) ctx.filter = `blur(${((1 - lp) * 14).toFixed(1)}px)`;
  ctx.globalAlpha = clamp(lp * 1.5); ctx.drawImage(IMG.logo, CX - lw / 2, 470 - lh / 2, lw, lh); ctx.restore();
  // Pille + Cursor
  const pp = spring(seg(t, HIT + 0.7, HIT + 1.2)), tc = HIT + 1.65;
  const press = t > tc ? 1 - 0.06 * Math.sin(Math.PI * seg(t, tc, tc + 0.18)) : 1;
  if (pp > 0) {
    ctx.save(); ctx.translate(CX, 790); ctx.scale(pp * press, pp * press);
    shadow(ctx, 0.2, 30, 12); ctx.fillStyle = C.blue; rrect(ctx, -230, -42, 460, 84, 42); ctx.fill(); noShadow(ctx);
    ctx.font = '34px InterM'; ctx.fillStyle = '#fff'; const s = 'Mehr erfahren  →  wika.com', w = ctx.measureText(s).width; ctx.fillText(s, -w / 2, 12);
    ctx.restore();
  }
  const cm = easeInOut(seg(t, HIT + 1.0, tc));
  if (cm > 0) {
    const x = lerp(1500, CX + 120, cm), y = lerp(1020, 810, cm), s = t > tc ? 1 - 0.15 * Math.sin(Math.PI * seg(t, tc, tc + 0.18)) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * 1.6, s * 1.6);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 20); ctx.lineTo(12, 31); ctx.lineTo(17, 29); ctx.lineTo(12, 18); ctx.lineTo(21, 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const rp = seg(t, tc, tc + 0.5);
    if (rp > 0 && rp < 1) { ctx.globalAlpha = 1 - rp; ctx.strokeStyle = C.blueL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX + 120, 810, 10 + rp * 60, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; noShadow(ctx);
  const sc = [['intro', sceneIntro], ['produkt', sceneProdukt], ['daten', sceneDaten], ['kunststoff', sceneKunststoff], ['finale', sceneFinale]];
  for (const [k, fn] of sc) if (t >= S[k][0] && t < S[k][1]) return fn(ctx, t);
  sceneFinale(ctx, t);
}

function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  add(S.produkt[0] - 0.15, 'whoosh', 0.5);
  CARDS.forEach((_, i) => add(S.daten[0] + i * BEAT * 0.9, 'pop', 0.3));
  add(S.kunststoff[0] - 0.1, 'whoosh', 0.4);
  [0, 1, 2].forEach((i) => add(S.kunststoff[0] + 2 * BEAT + i * BEAT * 0.5, 'pop', 0.3));
  add(S.finale[0], 'whoosh', 0.45);
  add(HIT + 0.7, 'pop', 0.35); add(HIT + 1.65, 'click', 0.6);
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
    const times = args[0] === '--still' ? args[1].split(',').map(Number) : Array.from({ length: 20 }, (_, i) => 0.4 + i * 0.74);
    const files = [];
    for (const t of times) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
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
  const from = arg('--from', 0), to = arg('--to', DUR);
  const outFile = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = Math.round(from * FPS); n < Math.round(to * FPS); n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(outFile);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
