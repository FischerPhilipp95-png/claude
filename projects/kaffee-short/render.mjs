// Kaffee-Short: „Wie funktioniert ein Kaffeevollautomat?“ – 1080x1920, 60 fps, 20 s.
// Stil: style_guide.md (Referenz refs/ref-02), Ablauf: shotlist.md.
// Alles besteht aus einem Pool von Punkten, die zwischen den Formen zu Staub zerfallen.
//
//   node projects/kaffee-short/render.mjs --timeline | --contact | --still 1.5,4 | (voll)
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const W = 1080, H = 1920, FPS = 60, DUR = 20;
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-500.ttf'), 'Inter');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-400.ttf'), 'InterRegular');

// ---------- Palette (style_guide.md) ----------
const C = { bg: '#18171a', light: '#f4f4ec', gray: '#8a8a8c', blue: '#3454d4', ink: '#18171a' };
const WHITE = [241, 239, 236], LAV = [164, 172, 236];

// ---------- Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const fract = (x) => x - Math.floor(x);

// ---------- Timeline auf beats.json ----------
const beats = JSON.parse(fs.readFileSync(path.join(DIR, 'beats.json'), 'utf8'));
const vo = JSON.parse(fs.readFileSync(path.join(DIR, 'audio/vo/durations.json'), 'utf8'));
const snap = (t, list) => list.reduce((b, x) => (Math.abs(x - t) < Math.abs(b - t) ? x : b), list[0]);
const onBeat = (t) => snap(t, beats.beats), onDown = (t) => snap(t, beats.downbeats), onHit = (t) => snap(t, beats.hits);

const T = {
  bean: 0.35,             // Punkt zerplatzt, Bohne entsteht
  grind: onBeat(3.0),     // Mahlen
  heat: onDown(6.0),      // Erhitzen
  brew: onBeat(9.0),      // Brühen
  press: onBeat(9.5),     // Kolben presst
  eject: onBeat(12.5),    // Auswerfen
  land: onDown(14.0),     // Puck landet im Behälter
  word: onDown(16.0),     // Punktschrift „Bohne“
  morph: onBeat(16.5),    // „Bohne“ -> „Kaffee“
  collapse: onBeat(17.5), // alles in die Mitte
  end: onDown(18.0),      // heller Kreis, Schlussbild
};
const VO = [['vo1', 0.25], ['vo2', T.grind + 0.1], ['vo3', T.heat + 0.1], ['vo4', T.brew + 0.1],
  ['vo5', T.eject + 0.25], ['vo6', T.word + 0.1], ['vo7', T.end + 0.3]]
  .map(([id, t]) => ({ id, t: +t.toFixed(3), dur: vo[id] }));

const TITLES = [
  { a: 0.3, b: T.grind - 0.25, lines: [['Ganze Bohnen.', 100, 'w'], ['Ein Knopfdruck.', 100, 'lav']] },
  { a: T.grind + 0.1, b: T.heat - 0.2, lines: [['Mahlen', 124, 'w'], ['Frisch, direkt vorm Brühen.', 38, 'gray']] },
  { a: T.heat + 0.1, b: T.brew - 0.2, lines: [['Erhitzen', 124, 'w'], ['Pumpe und Thermoblock.', 38, 'gray']] },
  { a: T.brew + 0.1, b: T.eject - 0.2, lines: [['Brühen', 124, 'w'], ['Meist unter 10 Sekunden.', 38, 'gray']] },
  { a: T.eject + 0.1, b: T.word - 0.2, lines: [['Auswerfen', 124, 'w'], ['Der Trester landet im Behälter.', 38, 'gray']] },
];
const NAME = 'Der Handwerksdoktor', HANDLE = '@derhandwerksdoktor';

// ---------- Punkt-Formen ----------
const N = 1500;
const GX = 540, GY = 1010;
// Eine Form liefert eine Liste von Punkten [x, y, größe, alpha, lavendel(0..1)]
const pt = (x, y, s = 2.6, a = 1, c = 0) => [x, y, s, a, c];

function dotLine(out, ax, ay, bx, by, sp = 15, s = 2.4, a = 0.85, c = 0) {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / sp));
  for (let i = 0; i <= n; i++) out.push(pt(lerp(ax, bx, i / n), lerp(ay, by, i / n), s, a, c));
}
function dotEllipse(out, cx, cy, rx, ry, n, { s = 2.4, a = 0.85, c = 0, phase = 0, backDim = 0.4 } = {}) {
  for (let i = 0; i < n; i++) {
    const ang = phase + (i / n) * Math.PI * 2, back = Math.sin(ang) < 0;
    out.push(pt(cx + rx * Math.cos(ang), cy + ry * Math.sin(ang), back ? s * 0.8 : s, back ? a * backDim : a, c));
  }
}

// Bohne: Ellipsoid aus Fibonacci-Punkten mit Kerbe, dreht sich leicht
const BEAN = (() => {
  const pts = [], n = 1560, r = rand(3);
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, rad = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    if (z > 0.15 && Math.abs(x - 0.2 * Math.sin(Math.PI * y * 0.95)) < 0.1 && Math.abs(y) < 0.85) continue; // Kerbe
    pts.push([x, y, z, r()]);
  }
  return pts.slice(0, N);
})();
function shapeBean(t) {
  const th = -0.55 + 0.28 * t, tilt = -0.5, A = 250, B = 165, Cz = 125;
  const [cs, sn, ct, st] = [Math.cos(th), Math.sin(th), Math.cos(tilt), Math.sin(tilt)];
  const breathe = 1 + 0.015 * Math.sin(t * 4);
  return BEAN.map(([x, y, z]) => {
    const X = x * B, Y = y * A, Z = z * Cz;
    const xr = X * cs + Z * sn, zr = -X * sn + Z * cs;
    const px = xr * ct - Y * st, py = xr * st + Y * ct;
    const zn = clamp((zr / Cz + 1) / 2);
    return pt(GX + px * breathe, GY + py * breathe, 1.3 + 1.9 * zn, 0.18 + 0.82 * zn, clamp((xr / B - 0.25) * 1.6));
  });
}

// Mahlwerk: Trichter, rotierende Mahlscheiben, fallende Bruchstücke, feiner Pulverstrahl, Häufchen
const GR = rand(5);
const FRAG = Array.from({ length: 150 }, () => ({ x0: 300 + GR() * 480, ph: GR(), s: 2.4 + GR() * 1.4 }));
const POWDER = Array.from({ length: 230 }, () => ({ ph: GR(), dx: (GR() - 0.5) * 30, v: 0.8 + GR() * 0.5 }));
const PILE = Array.from({ length: 260 }, () => { const u = GR() * 2 - 1, h = GR(); return { u, h }; });
function shapeGrind(t) {
  const out = [], lt = t - T.grind;
  dotLine(out, 290, 700, 480, 900); dotLine(out, 790, 700, 600, 900);
  dotEllipse(out, GX, 945, 130, 30, 44, { phase: lt * 5 });
  dotEllipse(out, GX, 945, 80, 18, 28, { phase: -lt * 7, c: 0.6 });
  dotLine(out, 505, 975, 505, 1040); dotLine(out, 575, 975, 575, 1040);
  for (const f of FRAG) { // Bruchstücke rutschen in den Trichter
    const p = fract(lt * 0.9 + f.ph), e = easeIn(p);
    out.push(pt(lerp(f.x0, GX + (f.x0 - GX) * 0.12, e), lerp(640, 930, e), lerp(f.s, 1.6, p), p < 0.9 ? 1 : (1 - p) * 10, 0));
  }
  for (const p0 of POWDER) { // feiner Pulverstrahl
    const p = fract(lt * 1.3 * p0.v + p0.ph);
    out.push(pt(GX + p0.dx * p, lerp(1045, 1300, p * p), 1.5, 0.9, 0));
  }
  const fill = 0.25 + 0.75 * seg(t, T.grind + 0.4, T.heat - 0.2); // Häufchen wächst
  for (const q of PILE) {
    const hmax = 110 * fill * (1 - q.u * q.u);
    out.push(pt(GX + q.u * 170 * Math.sqrt(fill), 1370 - q.h * hmax, 1.7, 0.95, 0));
  }
  return out;
}

// Erhitzen: Tank -> Pumpe -> Thermoblock (Schlange) -> Auslass mit Dampf
const PATH = [[290, 1080], [465, 1080], [560, 1080], [760, 1080], [760, 1020], [580, 1020], [580, 960], [760, 960], [760, 900], [900, 900], [900, 790]];
const pathLen = (() => { const L = [0]; for (let i = 1; i < PATH.length; i++) L.push(L[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1])); return L; })();
function along(d) {
  d = clamp(d, 0, pathLen.at(-1));
  let i = 1; while (i < pathLen.length - 1 && pathLen[i] < d) i++;
  const f = (d - pathLen[i - 1]) / (pathLen[i] - pathLen[i - 1]);
  return [lerp(PATH[i - 1][0], PATH[i][0], f), lerp(PATH[i - 1][1], PATH[i][1], f)];
}
const D_IN = pathLen[2], D_OUT = pathLen[8];
const HR = rand(9);
const STEAM = Array.from({ length: 70 }, () => ({ ph: HR(), dx: (HR() - 0.5) * 60, sw: HR() * 6.28 }));
function shapeHeat(t) {
  const out = [], lt = t - T.heat;
  // Tank mit Wasser, Pegel sinkt
  dotLine(out, 130, 820, 130, 1110); dotLine(out, 290, 820, 290, 1110); dotLine(out, 130, 1110, 290, 1110);
  const level = 880 + 60 * seg(t, T.heat, T.brew);
  for (let y = 1095; y > level; y -= 17) for (let x = 147; x < 285; x += 17) out.push(pt(x, y, 2, 0.55, 0));
  // Pumpe pulsiert auf den Beats
  const pulse = Math.exp(-(fract((t - T.heat) / 0.5) * 0.5) / 0.07);
  dotEllipse(out, 420, 1080, 46 * (1 + 0.12 * pulse), 46 * (1 + 0.12 * pulse), 26, { backDim: 1 });
  for (let k = 0; k < 3; k++) { const a = lt * 9 + k * 2.09; out.push(pt(420 + 22 * Math.cos(a), 1080 + 22 * Math.sin(a), 3, 1, 0)); }
  // Thermoblock-Gehäuse
  dotLine(out, 540, 860, 800, 860, 17, 2, 0.5); dotLine(out, 540, 1110, 800, 1110, 17, 2, 0.5);
  dotLine(out, 540, 860, 540, 1110, 17, 2, 0.5); dotLine(out, 800, 860, 800, 1110, 17, 2, 0.5);
  // Leitung (schwach) + Wasser, das fließt und heiß (lavendel) wird
  for (let d = 0; d < pathLen.at(-1); d += 18) { const [x, y] = along(d); out.push(pt(x, y, 1.6, 0.3, clamp((d - D_IN) / (D_OUT - D_IN)))); }
  const adv = lt * 210 + 26 * Math.sin(2 * Math.PI * lt * 2);
  for (let k = 0; k < 90; k++) {
    const d = fract((k / 90) + adv / pathLen.at(-1)) * pathLen.at(-1);
    const [x, y] = along(d), c = clamp((d - D_IN) / (D_OUT - D_IN));
    out.push(pt(x, y, 3 + c * 0.6, 1, c));
  }
  for (const s of STEAM) { // Dampf
    const p = fract(lt * 0.7 + s.ph);
    out.push(pt(900 + s.dx * p + 12 * Math.sin(s.sw + lt * 3), lerp(780, 580, p), 2.2 * (1 - p * 0.5), (1 - p) * 0.9, 1));
  }
  return out;
}

// Brühen + Auswerfen: Brühgruppe (Zylinder), Kolben, Pulver/Puck, Tropfen, Tasse, Timer, Tresterbehälter
const BR = rand(13);
const PUCK = Array.from({ length: 210 }, () => ({ u: BR() * 2 - 1, v: BR() * 2 - 1, h: BR() }));
const DRIPS = Array.from({ length: 40 }, () => ({ ph: BR(), dx: (BR() - 0.5) * 8 }));
const WATER = Array.from({ length: 36 }, () => ({ ph: BR(), dx: (BR() - 0.5) * 160 }));
const OLD = Array.from({ length: 120 }, () => ({ x: 740 + BR() * 170, y: 1375 - BR() * 30 }));
const CUP = { x0: 430, x1: 650, y0: 1215, y1: 1350 };
function shapeBrew(t) {
  const out = [], cx = GX, top = 830, bot = 1070, rx = 150, ry = 38;
  // Zylinder
  dotEllipse(out, cx, top, rx, ry, 50); dotEllipse(out, cx, bot, rx, ry, 50);
  dotLine(out, cx - rx, top, cx - rx, bot); dotLine(out, cx + rx, top, cx + rx, bot);
  // Kolben: senkt sich, presst, fährt beim Auswerfen wieder hoch
  const down = easeInOut(seg(t, T.press, T.press + 0.45)) * (1 - easeInOut(seg(t, T.eject, T.eject + 0.35)));
  const pY = lerp(740, 960, down);
  dotEllipse(out, cx, pY, rx - 12, ry - 6, 44, { a: 1, s: 2.8, backDim: 0.6 });
  dotLine(out, cx, pY - 180, cx, pY - 40, 15, 2.4, 0.7);
  // Wasser (lavendel): von oben, nach dem Pressen durchs Pulver
  if (t < T.eject) for (const w of WATER) {
    const p = fract((t - T.brew) * 1.4 + w.ph);
    const y = down < 0.5 ? lerp(640, pY - 10, p) : lerp(pY + 20, 1040, p);
    out.push(pt(cx + w.dx * (down < 0.5 ? 0.2 : 1), y, 2.4, down < 0.5 ? 1 - p * 0.3 : 0.9, 1));
  }
  // Pulver / Puck: wird gepresst, dann ausgeworfen
  const squeeze = lerp(70, 34, down);
  const ex = seg(t, T.eject + 0.35, T.eject + 0.8), fall = seg(t, T.eject + 0.8, T.land);
  const bounce = t > T.land ? Math.exp(-(t - T.land) * 9) * Math.abs(Math.sin((t - T.land) * 18)) * 30 : 0;
  const puckX = lerp(cx, 780, easeInOut(ex)) + lerp(0, 45, fall);
  const puckY = lerp(1030, 1060, easeInOut(ex)) + lerp(0, 290, easeIn(fall)) - bounce;
  const rot = fall * 0.6;
  for (const q of PUCK) {
    const x = q.u * 118 * Math.sqrt(1 - q.v * q.v * 0.2), y = -q.h * squeeze + q.v * 18;
    out.push(pt(puckX + x * Math.cos(rot) - y * Math.sin(rot), puckY + x * Math.sin(rot) + y * Math.cos(rot), 2.1, 0.95, 0));
  }
  // Tasse und Kaffee
  dotLine(out, CUP.x0, CUP.y0, CUP.x0 + 18, CUP.y1); dotLine(out, CUP.x1, CUP.y0, CUP.x1 - 18, CUP.y1);
  dotLine(out, CUP.x0 + 18, CUP.y1, CUP.x1 - 18, CUP.y1);
  dotEllipse(out, CUP.x1 + 12, CUP.y0 + 55, 30, 36, 16, { backDim: 1, phase: -Math.PI / 2, a: 0.8 });
  const level = seg(t, T.press + 0.5, T.eject - 0.3) * 0.8 + (t > T.eject ? 0.8 : 0) * 0;
  const lvl = t >= T.eject - 0.3 ? 0.8 : level;
  const surf = lerp(CUP.y1 - 8, CUP.y0 + 25, lvl);
  for (let y = CUP.y1 - 10; y > surf; y -= 11) {
    const inset = (CUP.y1 - y) / (CUP.y1 - CUP.y0) * 18;
    for (let x = CUP.x0 + 30 - inset; x < CUP.x1 - 30 + inset; x += 12) out.push(pt(x, y, 2, 0.9, 0));
  }
  if (t > T.press + 0.4 && t < T.eject - 0.2) for (const d of DRIPS) { // Tropfen
    const p = fract((t - T.press) * 1.8 + d.ph);
    out.push(pt(cx + d.dx, lerp(bot + 12, surf, p * p), 2.4, 1, 0));
  }
  // Timer-Ring: läuft bis knapp unter 10 s
  const tp = seg(t, T.press, T.eject - 0.2) * 0.86, tAlpha = 1 - seg(t, T.eject - 0.2, T.eject + 0.2);
  for (let k = 0; k < 40; k++) {
    const a = -Math.PI / 2 + (k / 40) * Math.PI * 2, on = k / 40 < tp;
    out.push(pt(860 + 62 * Math.cos(a), 700 + 62 * Math.sin(a), on ? 3 : 1.8, (on ? 1 : 0.3) * tAlpha, on ? 1 : 0));
  }
  // Tresterbehälter mit altem Trester
  const box = easeOut(seg(t, T.eject - 0.2, T.eject + 0.4));
  if (box > 0) {
    dotLine(out, 720, 1250, 720, 1400, 15, 2.4, box); dotLine(out, 940, 1250, 940, 1400, 15, 2.4, box);
    dotLine(out, 720, 1400, 940, 1400, 15, 2.4, box);
    for (const o of OLD) out.push(pt(o.x, o.y, 1.8, 0.5 * box, 0));
  }
  return out;
}

// Punktschrift „Bohne“ -> „Kaffee“
function textDots(word, size, sp) {
  const c = createCanvas(W, 500), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.font = `500 ${size}px Inter`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(word, W / 2, 250);
  const d = x.getImageData(0, 0, W, 500).data, pts = [];
  for (let y = 0; y < 500; y += sp) for (let xx = (y / sp) % 2 ? sp / 2 : 0; xx < W; xx += sp) if (d[(Math.floor(y) * W + Math.floor(xx)) * 4 + 3] > 140) pts.push([xx, GY - 250 + y]);
  return pts;
}
const WORD = (() => {
  const a = textDots('Bohne', 270, 12), b = textDots('Kaffee', 250, 12);
  const n = Math.min(N, Math.max(a.length, b.length)), r = rand(21);
  const pad = (l) => { const o = l.slice(); while (o.length < n) o.push(l[Math.floor(r() * l.length)]); return o.slice(0, n); };
  const byX = (l) => l.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return { a: byX(pad(a)), b: byX(pad(b)), s: Array.from({ length: n }, () => [r() - 0.5, r() - 0.5, r()]) };
})();
function shapeWord(t) {
  return WORD.a.map((p, i) => {
    const q = WORD.b[i], [sx, sy, dl] = WORD.s[i];
    const k = seg(t, T.morph + (p[0] / W) * 0.45 + dl * 0.1, T.morph + (p[0] / W) * 0.45 + dl * 0.1 + 0.4);
    const e = easeInOut(k), sc = Math.sin(Math.PI * k) * 70;
    return pt(lerp(p[0], q[0], e) + sx * sc, lerp(p[1], q[1], e) + sy * sc, 2.6, 1, Math.sin(Math.PI * k) * 0.9);
  });
}
const shapeCenter = () => [];
const shapeDot = () => Array.from({ length: N }, () => pt(GX, GY, 1, 0, 0));
const shapeCollapse = () => Array.from({ length: N }, () => pt(GX, GY, 2, 1, 0));

// Keyframes: [Start, Form, Übergangsdauer]
const KEYS = [[0, shapeDot, 0.01], [T.bean, shapeBean, 1.0], [T.grind, shapeGrind, 1.0], [T.heat, shapeHeat, 1.0],
  [T.brew, shapeBrew, 1.0], [T.word, shapeWord, 0.9], [T.collapse, shapeCollapse, 0.45], [T.end + 0.6, shapeCenter, 0.01]];

// Pro-Partikel-Zufall für Zerfall und Staub
const PR = rand(77);
const PART = Array.from({ length: N }, () => ({
  sx: PR() - 0.5, sy: PR() - 0.5, d: PR(), dust: [GX + (PR() - 0.5) * 900, GY + (PR() - 0.5) * 1000],
}));
const dustPt = (i) => pt(PART[i].dust[0], PART[i].dust[1], 1.4, 0, 0);

function particles(t) {
  let k = 0; while (k < KEYS.length - 1 && KEYS[k + 1][0] <= t) k++;
  const [t0, fn, D] = KEYS[k];
  const B = fn(t);
  if (k === 0 || t >= t0 + D) return B.slice(0, N);
  const A = KEYS[k - 1][1](t), out = [];
  for (let i = 0; i < N; i++) {
    const a = A[i] || dustPt(i), b = B[i] || dustPt(i), P = PART[i];
    const p = seg(t, t0 + P.d * D * 0.4, t0 + P.d * D * 0.4 + D * 0.6), e = easeInOut(p), sc = Math.sin(Math.PI * p) * 120;
    if (!A[i] && !B[i]) continue;
    out.push(pt(lerp(a[0], b[0], e) + P.sx * sc, lerp(a[1], b[1], e) + P.sy * sc, lerp(a[2], b[2], e),
      lerp(a[3], b[3], e) * (1 - 0.3 * Math.sin(Math.PI * p)), lerp(a[4], b[4], e)));
  }
  return out;
}

// ---------- SFX-Cues ----------
function buildCues() {
  const c = [];
  c.push({ t: T.bean, type: 'pop', gain: 0.7 });
  c.push({ t: 0.3 + 0.55, type: 'click', gain: 0.9 }); // „Ein Knopfdruck“
  for (const t of [T.grind, T.heat, T.brew, T.word, T.collapse]) c.push({ t: t - 0.05, type: 'whoosh', gain: 0.55 });
  for (const h of beats.hits.filter((h) => h > T.grind + 0.3 && h < T.heat - 0.3)) c.push({ t: h, type: 'click', gain: 0.12 });
  for (let t = T.heat + 0.5; t < T.brew - 0.2; t += 0.5) c.push({ t: onBeat(t), type: 'thump', gain: 0.28 });
  c.push({ t: T.press, type: 'whoosh', gain: 0.4 });
  for (let t = T.press + 0.75; t < T.eject - 0.3; t += 0.5) c.push({ t: onHit(t), type: 'pop', gain: 0.18 });
  c.push({ t: T.eject + 0.35, type: 'whoosh', gain: 0.4 });
  c.push({ t: T.land, type: 'thump', gain: 0.75 });
  for (let k = 0; k < 6; k++) c.push({ t: onHit(T.morph + 0.1 + k * 0.1), type: 'pop', gain: 0.25 });
  c.push({ t: T.end, type: 'thump', gain: 1 });
  const seen = new Set();
  return c.map((x) => ({ ...x, t: +x.t.toFixed(3) })).filter((x) => { const k = x.type + x.t; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.t - b.t);
}

// ---------- Zeichnen ----------
const rgba = (c, a) => {
  const col = [0, 1, 2].map((j) => Math.round(lerp(WHITE[j], LAV[j], clamp(c))));
  return `rgba(${col[0]},${col[1]},${col[2]},${clamp(a).toFixed(3)})`;
};

function drawTitles(ctx, t) {
  for (const T0 of TITLES) {
    if (t < T0.a || t > T0.b + 0.5) continue;
    let y = 380;
    T0.lines.forEach(([text, size, col], li) => {
      const inP = easeOut(seg(t, T0.a + li * 0.12, T0.a + li * 0.12 + 0.45));
      const outP = easeIn(seg(t, T0.b + li * 0.05, T0.b + li * 0.05 + 0.35));
      const lineH = size * 1.2;
      if (li > 0) y += size > 60 ? size * 1.12 : 70;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y - size * 1.0, W, lineH + size * 0.1); ctx.clip();
      ctx.font = size > 60 ? `500 ${size}px Inter` : `400 ${size}px InterRegular`;
      ctx.letterSpacing = `${(-size * 0.02).toFixed(1)}px`;
      ctx.fillStyle = col === 'lav' ? 'rgb(164,172,236)' : col === 'gray' ? C.gray : 'rgb(241,239,236)';
      ctx.fillText(text, 96, y + (1 - inP) * lineH - outP * lineH);
      ctx.restore();
    });
  }
  ctx.letterSpacing = '0px';
}

function drawBrewLabel(ctx, t) { // „< 10 s“ am Timer-Ring
  const a = easeOut(seg(t, T.press, T.press + 0.4)) * (1 - seg(t, T.eject - 0.2, T.eject + 0.2));
  if (a <= 0) return;
  const secs = Math.min(9.4, seg(t, T.press, T.eject - 0.2) * 9.4);
  ctx.globalAlpha = a; ctx.textAlign = 'center';
  ctx.font = '500 34px Inter'; ctx.fillStyle = 'rgb(241,239,236)'; ctx.fillText(`${secs.toFixed(1)} s`, 860, 712);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}

function drawEnd(ctx, t, avatar) {
  // Intro: Kreis wächst, schrumpft zum Punkt, zerplatzt
  if (t < T.bean + 0.05) {
    const r = t < 0.2 ? lerp(0, 70, easeOut(t / 0.2)) : lerp(70, 5, easeIn(seg(t, 0.2, T.bean)));
    ctx.fillStyle = 'rgb(241,239,236)'; ctx.beginPath(); ctx.arc(GX, GY, r, 0, Math.PI * 2); ctx.fill();
  }
  if (t < T.end - 0.1) return;
  // Heller Kreis wächst aus der Mitte
  const R = lerp(0, 1250, easeInOut(seg(t, T.end - 0.1, T.end + 0.5)));
  ctx.fillStyle = C.light; ctx.beginPath(); ctx.arc(GX, GY, R, 0, Math.PI * 2); ctx.fill();
  const cx = 540, cy = 860, r = 150;
  const p = easeOut(seg(t, T.end + 0.25, T.end + 0.7)), s = lerp(0.9, 1, p);
  if (p > 0) {
    ctx.save(); ctx.globalAlpha = p;
    ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(avatar, cx - r * s, cy - r * s, 2 * r * s, 2 * r * s); ctx.restore();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, (r + 14) * s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeInOut(seg(t, T.end + 0.25, T.end + 0.9))); ctx.stroke();
  }
  const rise = (text, font, color, y, at) => {
    const q = easeOut(seg(t, at, at + 0.45)); if (q <= 0) return;
    ctx.save(); ctx.font = font; ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.beginPath(); ctx.rect(0, y - 90, W, 110); ctx.clip();
    ctx.fillText(text, cx, y + (1 - q) * 90); ctx.restore();
  };
  ctx.letterSpacing = '-1.3px';
  rise(NAME, '500 66px Inter', C.ink, cy + r + 120, T.end + 0.5);
  ctx.letterSpacing = '0px';
  rise(HANDLE, '500 38px Inter', C.blue, cy + r + 190, T.end + 0.75);
}

function drawFrame(ctx, t, avatar) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  if (t < T.end + 0.6) {
    for (const [x, y, s, a, c] of particles(t)) {
      if (a <= 0.01) continue;
      ctx.fillStyle = rgba(c, a);
      ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawTitles(ctx, t);
  drawBrewLabel(ctx, t);
  drawEnd(ctx, t, avatar);
}

// ---------- Ausgabe ----------
function writeTimeline() {
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, T, vo: VO }, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  writeTimeline();
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  const avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });

  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number)
      : [0.2, 1.8, T.grind + 0.5, T.grind + 2, T.heat + 0.5, T.heat + 2, T.brew + 1, T.brew + 2.6, T.eject + 0.6, T.land + 0.8, T.word + 0.3, T.morph + 0.3, T.morph + 0.8, T.collapse + 0.35, T.end + 1.5];
    const files = [];
    for (const t of times) {
      drawFrame(ctx, t, avatar);
      const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`);
      fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]);
    }
    if (args[0] === '--contact') {
      const tw = 300, th = 533, cols = 8, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 36) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#000'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 36);
        sc.drawImage(img, x + 3, y + 36, tw - 6, th - 6);
        sc.fillStyle = '#fff'; sc.font = '500 22px Inter'; sc.fillText(`${t.toFixed(2)}s`, x + 8, y + 26);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png');
      fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
    } else console.log(files.map((f) => f[0]).join('\n'));
    return;
  }

  const out = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`, '-r', `${FPS}`, '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < DUR * FPS; f++) {
    drawFrame(ctx, f / FPS, avatar);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 120 === 0) process.stdout.write(`\r${f}/${DUR * FPS}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\r${out}`);
}

main();
