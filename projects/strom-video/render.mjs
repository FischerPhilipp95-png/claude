// Strom-Video: „Wie Strom in dein Haus kommt“ – 1920x1080, 60 fps, ca. 4:38.
// Stil: style_guide.md (refs/ref-03), Skript und Bild: shotlist.md, Zeiten: sections.json + beats.json.
//
//   node projects/strom-video/render.mjs --timeline        timeline.json + cues.json
//   node projects/strom-video/render.mjs --contact         ein Frame pro Satz als Übersicht
//   node projects/strom-video/render.mjs --still 12.5,40   einzelne Frames
//   node projects/strom-video/render.mjs [--from s --to s] Video (stumm) nach out/video.mp4
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const W = 1920, H = 1080, FPS = 60, CX = 960, CY = 540;
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-500.ttf'), 'Inter');

// ---------- Palette (style_guide.md) ----------
const C = { bg: '#000000', G: '#e0e0e0', P: '#924ef6', O: '#ff741c', GR: '#03b84c', BL: '#006aff', D: '#262626', W: '#ffffff', Y: '#ffd400' };

// ---------- Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const backOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2));
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const fract = (x) => x - Math.floor(x);

// ---------- Timeline ----------
const SEC = JSON.parse(fs.readFileSync(path.join(DIR, 'sections.json'), 'utf8'));
const BEATS = JSON.parse(fs.readFileSync(path.join(DIR, 'beats.json'), 'utf8'));
const B = BEATS.beats;
const snap = (t, list) => { let lo = 0, hi = list.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (list[m] < t) lo = m; else hi = m; } return Math.abs(list[lo] - t) < Math.abs(list[hi] - t) ? list[lo] : list[hi]; };
const onBeat = (t) => snap(t, B), onDown = (t) => snap(t, BEATS.downbeats);
function beatIndex(t) { let lo = 0, hi = B.length - 1; if (t < B[0]) return -1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m] <= t) lo = m; else hi = m; } return B[hi] <= t ? hi : lo; }
const sinceBeat = (t) => { const i = beatIndex(t); return i < 0 ? 9 : t - B[i]; };

// Kapitel mit auf die gemessenen Beats gerasterten Zeiten
const CH = SEC.chapters.map((c) => ({
  ...c,
  start: c.ch === 0 ? 0 : onDown(c.start),
  end: c.end,
  L: c.lines.map((l) => ({ id: l.id, t: onBeat(l.t), dur: l.dur })),
}));
CH.forEach((c, i) => { c.end = i < CH.length - 1 ? CH[i + 1].start : onDown(SEC.end_card); c.scene = c.title ? onBeat(c.start + 1.6) : 0; });
const END = onDown(SEC.end_card), DUR = SEC.total;
const VO = CH.flatMap((c) => c.L.map((l) => ({ id: l.id, t: +l.t.toFixed(3), dur: l.dur })));

// ---------- Figuren: Kreise mit Gesichtern aus Zeichen ----------
function eye(ctx, ch, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  const l = (a, b, c, d) => { ctx.moveTo(a * s, b * s); ctx.lineTo(c * s, d * s); };
  switch (ch) {
    case '*': for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + Math.PI / 2; l(-Math.cos(a), -Math.sin(a), Math.cos(a), Math.sin(a)); } break;
    case '-': l(-0.8, 0, 0.8, 0); break;
    case 'o': ctx.ellipse(0, 0, 0.62 * s, 0.75 * s, 0, 0, Math.PI * 2); break;
    case '>': ctx.moveTo(-0.7 * s, -0.8 * s); ctx.lineTo(0.7 * s, 0); ctx.lineTo(-0.7 * s, 0.8 * s); break;
    case '<': ctx.moveTo(0.7 * s, -0.8 * s); ctx.lineTo(-0.7 * s, 0); ctx.lineTo(0.7 * s, 0.8 * s); break;
    case '+': l(-0.8, 0, 0.8, 0); l(0, -0.8, 0, 0.8); break;
    case 'x': l(-0.7, -0.7, 0.7, 0.7); l(-0.7, 0.7, 0.7, -0.7); break;
    case '^': ctx.moveTo(-0.7 * s, 0.8 * s); ctx.lineTo(0, -0.8 * s); ctx.lineTo(0.7 * s, 0.8 * s); break;
    case 'v': ctx.moveTo(-0.7 * s, -0.8 * s); ctx.lineTo(0, 0.8 * s); ctx.lineTo(0.7 * s, -0.8 * s); break;
    case '/': l(-0.5, 0.9, 0.5, -0.9); break;
    case '~': ctx.moveTo(-0.9 * s, 0); ctx.bezierCurveTo(-0.45 * s, -0.8 * s, 0, 0.8 * s, 0.45 * s, 0); ctx.quadraticCurveTo(0.7 * s, -0.4 * s, 0.9 * s, -0.1 * s); break;
    default: break;
  }
  ctx.stroke(); ctx.restore();
}
/** Gesichtskreis. expr: 2 Zeichen (linkes/rechtes Auge). o: { a, scale, seed, eyeCol, spin, look } */
function face(ctx, x, y, r, col, expr, o = {}) {
  const sc = o.scale ?? 1;
  if (sc <= 0.001 || (o.a ?? 1) <= 0.001) return;
  const R = rand(o.seed ?? 1), rot1 = (R() - 0.5) * 0.35, rot2 = (R() - 0.5) * 0.35;
  const sq = o.squash ?? 0;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1;
  ctx.translate(x, y); ctx.scale(sc * (1 + sq), sc * (1 - sq));
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (expr) {
    ctx.strokeStyle = o.eyeCol ?? (col === C.D ? C.W : '#000'); ctx.lineWidth = r * 0.085; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    const s = r * 0.2, lx = o.look?.[0] ?? 0, ly = o.look?.[1] ?? 0, spin = o.spin ?? 0;
    eye(ctx, expr[0], -r * 0.36 + lx, -r * 0.08 + ly, s, rot1 + spin);
    eye(ctx, expr[1] ?? expr[0], r * 0.36 + lx, -r * 0.14 + ly, s, rot2 + spin);
  }
  ctx.restore();
}
// Ausdruck wechselt auf jedem Beat ab t0, dazu ein kleiner Squash
const exprAt = (t, seq, t0 = 0, every = 1) => seq[Math.max(0, Math.floor((beatIndex(t) - beatIndex(t0)) / every)) % seq.length];
const squashAt = (t) => 0.045 * Math.exp(-sinceBeat(t) / 0.06);
const pop = (t, t0, d = 0.38) => backOut(seg(t, t0, t0 + d));
const bob = (t, seed) => 5 * Math.sin(t * 1.4 + seed * 2.1);

// ---------- Text aus Punkten (Konstruktion wie in der Referenz) ----------
const TXT = new Map();
function textModel(text, size) {
  const key = `${text}|${size}`;
  if (TXT.has(key)) return TXT.get(key);
  const m = createCanvas(10, 10).getContext('2d'); m.font = `500 ${size}px Inter`;
  const w = Math.ceil(m.measureText(text).width) + 20, h = Math.ceil(size * 1.4);
  const c = createCanvas(w, h), x = c.getContext('2d');
  x.font = `500 ${size}px Inter`; x.fillStyle = '#fff'; x.textBaseline = 'alphabetic'; x.fillText(text, 10, size * 1.05);
  const d = x.getImageData(0, 0, w, h).data, A = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : d[(j * w + i) * 4 + 3]);
  const sp = Math.max(5, Math.round(size / 8.5)), pts = [], R = rand(text.length * 131 + size);
  for (let gy = 0; gy < h; gy += sp) for (let gx = 0; gx < w; gx += sp) {
    let found = null;
    for (let j = gy; j < Math.min(h, gy + sp) && !found; j++) for (let i = gx; i < Math.min(w, gx + sp); i++) {
      if (A(i, j) > 128 && (A(i - 1, j) < 128 || A(i + 1, j) < 128 || A(i, j - 1) < 128 || A(i, j + 1) < 128)) { found = [i - 10, j - size * 1.05]; break; }
    }
    if (found) pts.push({ x: found[0], y: found[1], sx: (R() - 0.5) * 420, sy: (R() - 0.5) * 300, d: R() });
  }
  const model = { w: w - 20, pts, size };
  TXT.set(key, model); return model;
}
/** Zeichnet ein Textstück, das sich ab t0 aus Punkten baut und ab t1 wieder zerfällt. x = linke Kante, y = Grundlinie */
function buildText(ctx, text, x, y, size, col, t, t0, t1 = Infinity, dotCol = C.O) {
  if (t < t0 || t > t1 + 0.6) return;
  const m = textModel(text, size), r = Math.max(2.2, size / 34);
  const outline = easeOut(seg(t, t0 + 0.35, t0 + 0.6)), fill = easeOut(seg(t, t0 + 0.5, t0 + 0.8));
  const gone = Number.isFinite(t1) ? easeIn(seg(t, t1, t1 + 0.45)) : 0;
  ctx.font = `500 ${size}px Inter`;
  if (outline > 0 && fill < 1 && gone < 1) { ctx.globalAlpha = outline * (1 - fill) * (1 - gone); ctx.strokeStyle = C.W; ctx.lineWidth = Math.max(1, size / 110); ctx.strokeText(text, x, y); }
  if (fill > 0 && gone < 1) { ctx.globalAlpha = fill * (1 - gone); ctx.fillStyle = col; ctx.fillText(text, x, y); }
  ctx.fillStyle = dotCol;
  for (const p of m.pts) {
    const k = seg(t, t0 + p.d * 0.3 + (p.x / Math.max(1, m.w)) * 0.2, t0 + p.d * 0.3 + (p.x / Math.max(1, m.w)) * 0.2 + 0.45);
    if (k <= 0) continue;
    const e = easeOut(k), out = gone > 0 ? easeIn(gone) : 0;
    const a = (1 - seg(t, t0 + 0.85, t0 + 1.25)) + out;
    if (a <= 0.01) continue;
    ctx.globalAlpha = clamp(a) * (gone > 0 ? 1 - gone : 1);
    const px = x + p.x + (1 - e) * p.sx + out * p.sx * 0.8, py = y + p.y + (1 - e) * p.sy + out * p.sy * 0.8;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/** Zeile aus farbigen Stücken [[text, farbe], ...], zentriert um cx, Stücke bauen sich nacheinander */
function buildLine(ctx, parts, cx, y, size, t, t0, t1 = Infinity, stagger = 0.18, align = 'center') {
  ctx.font = `500 ${size}px Inter`;
  const widths = parts.map(([s]) => ctx.measureText(s).width), total = widths.reduce((a, b) => a + b, 0);
  let x = align === 'center' ? cx - total / 2 : align === 'right' ? cx - total : cx;
  parts.forEach(([s, col], i) => { buildText(ctx, s, x, y, size, col, t, t0 + i * stagger, t1); x += widths[i]; });
}

// ---------- Punktflüsse ----------
function polyLen(P) { const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return L; }
function polyAt(P, L, d) {
  d = clamp(d, 0, L.at(-1)); let i = 1; while (i < L.length - 1 && L[i] < d) i++;
  const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)];
}
function line(ctx, P, col, w, a = 1, prog = 1) {
  const L = polyLen(P), end = L.at(-1) * prog; if (end <= 0) return;
  ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(...P[0]);
  for (let i = 1; i < P.length; i++) { if (L[i] <= end) ctx.lineTo(...P[i]); else { ctx.lineTo(...polyAt(P, L, end)); break; } }
  ctx.stroke(); ctx.globalAlpha = 1;
}
function flow(ctx, P, t, { n = 10, speed = 260, r = 6, col = C.G, a = 1, t0 = 0 } = {}) {
  const L = polyLen(P), len = L.at(-1);
  ctx.globalAlpha = a; ctx.fillStyle = col;
  for (let k = 0; k < n; k++) {
    const d = fract(k / n + ((t - t0) * speed) / len) * len;
    const [x, y] = polyAt(P, L, d);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function rrect(ctx, x, y, w, h, r, fill, stroke, lw = 6) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function label(ctx, text, x, y, size, a = 1, col = C.W, align = 'center') {
  if (a <= 0) return; ctx.globalAlpha = a; ctx.font = `500 ${size}px Inter`; ctx.textAlign = align; ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}

// ---------- Kamera: Close-up-Zoom am Szenenbeginn, Schrumpfen am Kapitelende ----------
function withCamera(ctx, t, c, focus, fn) {
  const zin = c.scene, zoom = lerp(7, 1, easeOut(seg(t, zin, zin + 1.0)));
  const out = easeIn(seg(t, c.end - 0.55, c.end - 0.05));
  ctx.save();
  ctx.translate(CX, CY); ctx.scale(1 - 0.97 * out, 1 - 0.97 * out); ctx.translate(-CX, -CY);
  if (zoom > 1.001) { ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-focus[0], -focus[1] + 30 / zoom); }
  fn();
  ctx.restore();
}
// Kapiteltitel: baut sich in der Mitte, wandert dann als kleines Label nach oben links
function chapterTitle(ctx, t, c, n) {
  if (!c.title || t < c.start || t > c.end) return;
  const size = 130, mv = easeInOut(seg(t, c.start + 1.1, c.start + 1.5));
  ctx.font = `500 ${size}px Inter`;
  const parts = [[`[${n}]`, C.P], [` ${c.title}`, C.W]];
  const wTot = parts.reduce((a, [s]) => a + ctx.measureText(s).width, 0);
  const x0 = lerp(CX - wTot / 2, 70, mv), y0 = lerp(CY + size * 0.35, 92, mv), s = lerp(1, 36 / size, mv);
  const fadeOut = seg(t, c.end - 0.5, c.end - 0.1);
  ctx.save(); ctx.translate(x0, y0); ctx.scale(s, s);
  if (mv <= 0) { let x = 0; parts.forEach(([p, col], i) => { buildText(ctx, p, x, 0, size, col, t, c.start + i * 0.2); x += ctx.measureText(p).width; }); }
  else { ctx.globalAlpha = 1 - fadeOut; let x = 0; ctx.font = `500 ${size}px Inter`; for (const [p, col] of parts) { ctx.fillStyle = col; ctx.fillText(p, x, 0); x += ctx.measureText(p).width; } }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------- Szenen ----------
const Lt = (c, i) => c.L[i].t, Le = (c, i) => c.L[i].t + c.L[i].dur;
const inLine = (c, i, f) => c.L[i].t + c.L[i].dur * f;

const SCENES = {
  0(ctx, t, c) { // Intro
    const E = ['**', '--', 'oo', '><', '^^', 'oo'];
    const gather = easeIn(seg(t, Lt(c, 3) + 0.9, Lt(c, 3) + 1.4));
    const zoom = lerp(8, 1, easeOut(seg(t, 0.3, 1.9)));
    ctx.save(); ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-CX, -CY + 40 * (1 - 1 / zoom));
    const others = [[C.P, 470, 250, 190, 'oo'], [C.O, 1450, 190, 150, '/ '], [C.GR, 1560, 600, 200, '++'], [C.BL, 1180, 960, 170, 'v '], [C.D, 480, 860, 190, '^^']];
    const t2 = Lt(c, 2);
    others.forEach(([col, x, y, r, e], i) => {
      const p = pop(t, onBeat(t2 + i * 0.25)) * (1 - gather);
      face(ctx, lerp(x, CX, gather), lerp(y, CY, gather) + bob(t, i), r, col, exprAt(t, [e, '--', 'oo', e, '><'], t2 + i * 0.25), { scale: p, seed: i + 3, squash: squashAt(t) });
    });
    const mainR = lerp(260, 190, easeInOut(seg(t, t2, t2 + 0.6)));
    face(ctx, CX, CY + bob(t, 0) * (zoom > 1.1 ? 0 : 1), mainR, C.G, exprAt(t, E, 0.4), { scale: 1 - gather, seed: 1, squash: squashAt(t) });
    ctx.restore();
    // „Sofort. Unsichtbar. Selbstverständlich.“
    buildLine(ctx, [['Sofort. ', C.W], ['Unsichtbar. ', C.W], ['Selbstverständlich.', C.GR]], CX, 970, 64, t, Lt(c, 1), Lt(c, 2) - 0.1, c.L[1].dur * 0.3);
    buildLine(ctx, [['Die Reise ', C.W], ['des Stroms.', C.GR]], CX, CY + 45, 130, t, Lt(c, 3) + 1.3, c.end - 0.5);
  },

  1(ctx, t, c) { // Kraftwerk
    const s = c.scene, T3 = Lt(c, 3), T4 = Lt(c, 4), dim = 1 - 0.75 * easeInOut(seg(t, T4, T4 + 0.5));
    withCamera(ctx, t, c, [760, 560], () => {
      const spin = (t - s) * (t > T3 ? 9 : 3);
      ctx.globalAlpha = dim;
      // Zuflüsse: Dampf, Wasser, Wind
      [[C.G, 330, 330, '~~'], [C.BL, 280, 560, 'vv'], [C.GR, 330, 790, '//']].forEach(([col, x, y, e], i) => {
        const p0 = onBeat(Lt(c, 2) + i * 0.5), p = pop(t, p0);
        if (p > 0) { flow(ctx, [[x + 60, y], [760 - 190, 560]], t, { n: 6, r: 6, col, a: p * dim, speed: 320 }); }
        face(ctx, x, y + bob(t, i), 72, col, e, { scale: p, seed: 10 + i, a: dim });
      });
      // Generator + Welle
      const gp = pop(t, T3);
      if (gp > 0) { line(ctx, [[760, 560], [1060, 560]], C.W, 14, dim * gp); face(ctx, 1060, 560, 110, C.D, 'oo', { scale: gp, seed: 21, a: dim }); }
      face(ctx, 760, 560 + bob(t, 1), 190, C.O, '++', { spin, seed: 20, squash: squashAt(t), a: dim });
      const sp = pop(t, onBeat(T3 + 0.9));
      if (sp > 0) { flow(ctx, [[1170, 560], [1350, 560]], t, { n: 5, r: 7, a: dim }); face(ctx, 1350, 560 + bob(t, 3), 90, C.G, exprAt(t, ['^^', 'oo', '^^', '**'], T3), { scale: sp, seed: 1, a: dim, squash: squashAt(t) }); }
      ctx.globalAlpha = 1;
      // Solar
      const so = pop(t, T4 + 0.3);
      if (so > 0) {
        ctx.save(); ctx.translate(1520, 300); ctx.rotate(t * 0.6); ctx.strokeStyle = C.O; ctx.lineWidth = 10; ctx.lineCap = 'butt';
        for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; ctx.globalAlpha = so; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 110 * so, Math.sin(a) * 110 * so); ctx.lineTo(Math.cos(a) * 140 * so, Math.sin(a) * 140 * so); ctx.stroke(); }
        ctx.restore(); ctx.globalAlpha = 1;
        face(ctx, 1520, 300, 90, C.O, '**', { scale: so, seed: 30, squash: squashAt(t) });
        const pp = pop(t, onBeat(T4 + 0.8));
        ctx.save(); ctx.translate(1480, 700); ctx.transform(1, 0, -0.35, 1, 0, 0); ctx.scale(pp, pp);
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) rrect(ctx, -150 + i * 62, -60 + j * 44, 54, 36, 6, C.BL);
        ctx.restore();
        const sp2 = pop(t, onBeat(T4 + 1.6));
        if (sp2 > 0) { flow(ctx, [[1520, 390], [1470, 640]], t, { n: 5, r: 6, col: C.O, a: so }); face(ctx, 1720, 840, 70, C.G, exprAt(t, ['^^', '**'], T4), { scale: sp2, seed: 1 }); }
      }
    });
  },

  2(ctx, t, c) { // Hochspannung
    const T1 = Lt(c, 1), T2 = Lt(c, 2), T3 = Lt(c, 3), T4 = Lt(c, 4);
    withCamera(ctx, t, c, [CX, CY], () => {
      // Figur schießt los
      if (t < T1 + 0.2) {
        const k = easeInOut(seg(t, c.scene + 0.3, c.scene + 1.3)), x = lerp(260, 1660, k);
        for (let i = 1; i < 8; i++) face(ctx, x - i * 40 * Math.sin(Math.PI * k), CY, 60 - i * 6, C.G, null, { a: 0.12 * (8 - i) / 8 });
        face(ctx, x, CY, 80, C.G, k > 0 && k < 1 ? '><' : '^^', { seed: 1, squash: squashAt(t) });
      }
    });
    buildLine(ctx, [['Höchstspannung ', C.GR], ['[380.000 V]', C.P]], CX, CY + 40, 96, t, T1 + 0.2, T2 - 0.2);
    // Vergleich: viel Strom (Verlust) gegen wenig Strom
    const cp = easeOut(seg(t, T2 + 0.2, T2 + 0.7)) * (1 - seg(t, T4 - 0.3, T4 + 0.1));
    if (cp > 0) {
      const P1 = [[260, 400], [1660, 400]], P2 = [[260, 700], [1660, 700]];
      line(ctx, P1, C.D, 26, cp); line(ctx, P2, C.D, 26, cp);
      const R = rand(5);
      for (let k = 0; k < 26; k++) { // viele dicke Punkte, die unterwegs verglühen
        const d = fract(k / 26 + (t - T2) * 0.12), x = lerp(260, 1660, d), heat = seg(t, T3, T3 + 1) * d;
        ctx.globalAlpha = cp * (1 - heat * 0.9); ctx.fillStyle = heat > 0.35 ? C.O : C.G;
        ctx.beginPath(); ctx.arc(x, 400 + (R() - 0.5) * 16, 11, 0, Math.PI * 2); ctx.fill();
        if (heat > 0.4) { ctx.globalAlpha = cp * 0.6 * heat; ctx.beginPath(); ctx.arc(x + 6, 370 - heat * 40, 4, 0, Math.PI * 2); ctx.fill(); }
      }
      for (let k = 0; k < 6; k++) { const d = fract(k / 6 + (t - T2) * 0.45); ctx.globalAlpha = cp; ctx.fillStyle = C.G; ctx.beginPath(); ctx.arc(lerp(260, 1660, d), 700, 8, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      label(ctx, 'viel Strom, wenig Spannung', 260, 340, 40, cp, C.W, 'left');
      label(ctx, 'wenig Strom, hohe Spannung', 260, 640, 40, cp, C.W, 'left');
      face(ctx, 1740, 400, 60, C.O, exprAt(t, ['><', 'xx'], T3), { scale: pop(t, T3 + 0.3) * cp, seed: 40 });
      face(ctx, 1740, 700, 60, C.GR, '^^', { scale: pop(t, T3 + 0.6) * cp, seed: 41 });
      buildLine(ctx, [['weniger Strom = ', C.W], ['weniger Verlust', C.GR]], CX, 900, 60, t, T3 + 0.4, T4 - 0.3);
    }
    // Masten
    if (t > T4 - 0.1) {
      const xs = [260, 720, 1180, 1640];
      const tops = xs.map((x, i) => ({ x, p: pop(t, onBeat(T4 + i * 0.25)) }));
      for (let i = 0; i < 3; i++) for (const arm of [-110, 110]) {
        const a = tops[i], b = tops[i + 1]; const k = Math.min(a.p, b.p); if (k <= 0) continue;
        const y = arm < 0 ? 380 : 460, sag = 60 + 6 * Math.sin(t * 2 + i);
        const P = []; for (let j = 0; j <= 20; j++) { const f = j / 20; P.push([lerp(a.x + arm, b.x + arm, f), y + sag * 4 * f * (1 - f)]); }
        line(ctx, P, C.W, 3, k); flow(ctx, P, t, { n: 4, r: 5, col: C.G, speed: 380, a: k });
      }
      for (const { x, p } of tops) {
        if (p <= 0) continue;
        ctx.save(); ctx.translate(x, 900); ctx.scale(p, p); ctx.translate(-x, -900);
        line(ctx, [[x - 90, 900], [x, 300], [x + 90, 900]], C.W, 10); line(ctx, [[x - 150, 380], [x + 150, 380]], C.W, 10); line(ctx, [[x - 150, 460], [x + 150, 460]], C.W, 10);
        line(ctx, [[x - 60, 640], [x + 60, 640]], C.W, 8);
        for (const [dx, y] of [[-110, 380], [110, 380], [-110, 460], [110, 460]]) face(ctx, x + dx, y + 14, 18, C.P, null);
        ctx.restore();
      }
    }
  },

  3(ctx, t, c) { // Umspannwerk
    const T1 = Lt(c, 1), T2 = Lt(c, 2), T3 = Lt(c, 3);
    const move = easeInOut(seg(t, T1, T1 + 0.6)), gone = seg(t, T3 - 0.3, T3 + 0.2);
    withCamera(ctx, t, c, [CX, 470], () => {
      face(ctx, lerp(CX, 1650, move), lerp(470, 230, move), lerp(170, 80, move), C.GR, exprAt(t, ['--', 'oo', '--', '^^'], c.scene, 2), { seed: 50, squash: squashAt(t) });
    });
    const st = easeOut(seg(t, T1 + 0.2, T1 + 0.8)) * (1 - gone);
    if (st > 0) {
      const steps = [[260, 330], [700, 330], [700, 560], [1140, 560], [1140, 790], [1660, 790]];
      line(ctx, steps, C.W, 10, st, st);
      const ride = seg(t, T1 + 0.6, Le(c, 2)), stepK = Math.min(2, Math.floor(ride * 3));
      const px = [480, 920, 1400][stepK], py = [330, 560, 790][stepK] - [80, 60, 42][stepK];
      face(ctx, px, py, [80, 58, 40][stepK], C.G, exprAt(t, ['oo', '^^'], T1), { seed: 1, squash: squashAt(t), a: st });
      buildLine(ctx, [['[110.000 V]', C.P]], 920, 660, 52, t, inLine(c, 2, 0.1), T3 - 0.3);
      buildLine(ctx, [['[10.000–20.000 V]', C.P]], 1400, 890, 52, t, inLine(c, 2, 0.55), T3 - 0.3);
    }
    const g = easeOut(seg(t, T3, T3 + 0.5));
    if (g > 0) {
      line(ctx, [[160, 560], [1760, 560]], C.W, 6, g, g);
      for (let x = 200; x < 1760; x += 80) line(ctx, [[x, 560], [x + 18, 540]], C.W, 4, g * 0.6);
      const P = [[160, 760], [1500, 760], [1500, 600]];
      line(ctx, P, C.D, 22, g, g); flow(ctx, P, t, { n: 12, r: 7, col: C.G, a: g, speed: 300 });
      label(ctx, 'Erdkabel', 330, 830, 40, g, C.W, 'left');
      [1380, 1520, 1660].forEach((x, i) => { const p = pop(t, onBeat(T3 + 0.6 + i * 0.25)); if (p > 0) { ctx.save(); ctx.translate(x, 560); ctx.scale(p, p); line(ctx, [[-50, 0], [-50, -80], [0, -130], [50, -80], [50, 0]], C.W, 8); ctx.restore(); } });
    }
  },

  4(ctx, t, c) { // Trafostation
    const T1 = Lt(c, 1), T2 = Lt(c, 2), T3 = Lt(c, 3);
    const up = easeInOut(seg(t, T2, T2 + 0.6));
    withCamera(ctx, t, c, [CX, 500], () => {
      const bx = CX, by = lerp(520, 400, up), s = lerp(1, 0.75, up);
      line(ctx, [[120, by + 170 * s], [1800, by + 170 * s]], C.W, 6, 1 - up);
      const P = [[120, by + 260 * s], [bx - 60, by + 260 * s], [bx - 60, by + 170 * s]];
      line(ctx, P, C.D, 20, 1 - up); flow(ctx, P, t, { n: 7, r: 6, a: 1 - up });
      ctx.save(); ctx.translate(bx, by); ctx.scale(s * (1 + squashAt(t)), s * (1 - squashAt(t)));
      rrect(ctx, -200, -170, 400, 340, 36, C.BL);
      line(ctx, [[-230, -150], [0, -250], [230, -150]], C.BL, 26);
      const e = t < T1 + 1.2 ? 'oo' : exprAt(t, ['><', '^^', '><', 'oo'], T1 + 1.2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 16; eye(ctx, e[0], -70, -20, 36, -0.1); eye(ctx, e[1], 70, -30, 36, 0.12);
      ctx.restore();
    });
    buildLine(ctx, [['Steckdose ', C.W], ['[230 V]', C.P]], CX, 800, 76, t, inLine(c, 2, 0.35), T3 - 0.2);
    buildLine(ctx, [['Herd & Durchlauferhitzer ', C.W], ['[400 V]', C.P]], CX, 910, 76, t, inLine(c, 2, 0.6), T3 - 0.2);
    const cta = pop(t, T3 + 0.2) * (1 - seg(t, c.end - 0.8, c.end - 0.4));
    if (cta > 0) {
      face(ctx, 1260, 820, 70, C.P, exprAt(t, ['^^', '**'], T3), { scale: cta, seed: 60, squash: squashAt(t) });
      buildLine(ctx, [['Abonnieren', C.W]], 1360, 842, 64, t, T3 + 0.4, c.end - 0.8, 0.18, 'left');
    }
  },

  5(ctx, t, c) { // Hausanschluss + Zähler
    const T1 = Lt(c, 1), T2 = Lt(c, 2);
    withCamera(ctx, t, c, [760, 810], () => {
      const hp = easeOut(seg(t, c.scene, c.scene + 0.8));
      line(ctx, [[560, 720], [560, 380], [960, 180], [1360, 380], [1360, 720]], C.W, 10, hp, hp);
      line(ctx, [[120, 720], [1800, 720]], C.W, 6, hp);
      line(ctx, [[560, 720], [560, 940], [1360, 940], [1360, 720]], C.W, 6, hp * 0.5);
      label(ctx, 'Keller', 1330, 910, 34, hp * 0.8, C.W, 'right');
      const P = [[120, 830], [690, 830]];
      line(ctx, P, C.D, 20, hp); flow(ctx, P, t, { n: 8, r: 6, a: hp });
      const kp = pop(t, T1);
      if (kp > 0) {
        ctx.save(); ctx.translate(760, 830); ctx.scale(kp, kp);
        rrect(ctx, -80, -60, 160, 120, 18, C.D);
        ctx.strokeStyle = C.W; ctx.lineWidth = 9; const e = exprAt(t, ['--', '--', 'oo'], T1); eye(ctx, e[0], -34, -6, 18, 0); eye(ctx, e[1], 34, -6, 18, 0);
        ctx.restore();
        const lp = pop(t, onBeat(inLine(c, 1, 0.45)));
        if (lp > 0) { ctx.save(); ctx.translate(760, 725); ctx.scale(lp, lp); rrect(ctx, -26, -14, 52, 40, 8, C.O); ctx.strokeStyle = C.O; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -14, 17, Math.PI, 0); ctx.stroke(); ctx.restore(); }
      }
      const mp = pop(t, T2);
      if (mp > 0) {
        flow(ctx, [[840, 830], [960, 830]], t, { n: 3, r: 6, a: mp });
        const look = [9 * Math.sin(t * 5), 0];
        face(ctx, 1040, 830, 72, C.P, 'oo', { scale: mp, seed: 70, look, squash: squashAt(t) });
      }
    });
    const cp = seg(t, T2 + 0.5, T2 + 0.8);
    if (cp > 0) {
      const kwh = (1234.5 + (t - T2) * 0.9).toFixed(1).replace('.', ',');
      label(ctx, `${kwh} kWh`, 1150, 845, 44, cp * (1 - seg(t, c.end - 0.6, c.end - 0.2)), C.W, 'left');
    }
    buildLine(ctx, [['Hausanschlusskasten', C.W]], CX, 1015, 56, t, inLine(c, 1, 0.1), T2 - 0.2);
    buildLine(ctx, [['Stromzähler ', C.W], ['[kWh]', C.P]], CX, 1015, 56, t, T2 + 0.2, c.end - 0.6);
  },

  6(ctx, t, c) { // Sicherungskasten + FI
    const [T1, T2, T3, T4, T5, T6] = [1, 2, 3, 4, 5, 6].map((i) => Lt(c, i));
    const trip = onBeat(inLine(c, 3, 0.55)), fiTrip = onBeat(inLine(c, 6, 0.6));
    const shrink = easeInOut(seg(t, T4, T4 + 0.6));
    const cols = [C.GR, C.BL, C.P, C.O, C.G, C.GR];
    withCamera(ctx, t, c, [CX, 380], () => {
      ctx.save(); ctx.translate(lerp(0, -500, shrink), lerp(0, 60, shrink)); ctx.translate(CX, 540); ctx.scale(lerp(1, 0.6, shrink), lerp(1, 0.6, shrink)); ctx.translate(-CX, -540);
      rrect(ctx, 600, 220, 720, 560, 40, C.D);
      ctx.strokeStyle = C.W; ctx.lineWidth = 16; const e = exprAt(t, ['><', 'oo', '--', 'oo'], c.scene, 2); eye(ctx, e[0], 880, 330, 34, -0.1); eye(ctx, e[1], 1040, 320, 34, 0.1);
      // Aufteilung in Stromkreise
      const sp = easeOut(seg(t, T1, T1 + 0.6));
      for (let i = 0; i < 6; i++) {
        const x = 700 + i * 104, dead = i === 3 && t > trip + 0.1;
        const lane = [[CX, 120], [CX, 400], [x, 480], [x, 1000]];
        if (sp > 0) { line(ctx, lane, C.W, 4, 0.35 * sp); flow(ctx, lane, dead ? trip : t, { n: 8, r: 6, col: C.G, speed: 240 + (i === 3 && t > inLine(c, 3, 0.2) && !dead ? 280 : 0), a: sp * (dead ? 0.15 : 1) }); }
        const bp = pop(t, onBeat(T2 + i * 0.25)) || (sp > 0 ? 0 : 0);
        let ex = '--';
        if (i === 3 && t > inLine(c, 3, 0.2)) ex = t < trip ? '><' : 'xx';
        const blink = t > T2 && t < T2 + 3.5 && Math.floor((t - T2) / 0.49) % 6 === i ? 0.08 : 0;
        face(ctx, x, 620, 40, cols[i], ex, { scale: Math.max(bp, sp > 0 && t > T2 + 2 ? 1 : 0) * (1 + blink), seed: 80 + i, a: dead ? 0.35 : 1 });
      }
      ctx.restore();
    });
    buildLine(ctx, [['Überlast? Kurzschluss? ', C.W], ['[aus]', C.O]], CX, 960, 56, t, inLine(c, 3, 0.35), T4 - 0.2);
    // FI-Schalter
    const fp = pop(t, T4 + 0.3);
    if (fp > 0) {
      const off = t > fiTrip;
      face(ctx, 1300, 440, 170, C.GR, off ? exprAt(t, ['><', 'xx'], fiTrip) : exprAt(t, ['++', '++', 'oo'], T4), { scale: fp, seed: 90, squash: squashAt(t) });
      const sp = easeOut(seg(t, T5, T5 + 0.5)) * (1 - seg(t, c.end - 0.6, c.end - 0.3));
      if (sp > 0) {
        const hin = [[900, 700], [1700, 700]], zur = [[1700, 800], [900, 800]];
        line(ctx, hin, C.W, 4, 0.35 * sp); line(ctx, zur, C.W, 4, 0.35 * sp);
        const tf = off ? fiTrip : t;
        flow(ctx, hin, tf, { n: 10, r: 8, a: sp * (off ? 0.2 : 1), speed: 300 });
        flow(ctx, zur, tf, { n: 10, r: 8, a: sp * (off ? 0.2 : 1), speed: 300 });
        label(ctx, 'hin', 880, 712, 36, sp, C.W, 'right'); label(ctx, 'zurück', 880, 812, 36, sp, C.W, 'right');
        const leak = seg(t, T6 + 0.3, fiTrip);
        if (leak > 0 && !off) for (let k = 0; k < 4; k++) { const d = fract(k / 4 + t * 0.9); ctx.globalAlpha = leak; ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(1300, lerp(800, 930, d), 8, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        face(ctx, 1300, 980, 48, C.G, off ? '^^' : leak > 0 ? '><' : 'oo', { scale: pop(t, T6 + 0.2), seed: 95 });
      }
      buildLine(ctx, [['FI ', C.GR], ['[30 mA]', C.P]], 1300, 200, 76, t, onBeat(fiTrip + 0.2), c.end - 0.5);
    }
  },

  7(ctx, t, c) { // Stromkreise
    const T1 = Lt(c, 1), T2 = Lt(c, 2), sh = easeInOut(seg(t, T2, T2 + 0.6));
    withCamera(ctx, t, c, [CX, 560], () => {
      ctx.save(); ctx.translate(lerp(0, -430, sh), 0); ctx.translate(CX, 560); ctx.scale(lerp(1, 0.62, sh), lerp(1, 0.62, sh)); ctx.translate(-CX, -560);
      const hp = easeOut(seg(t, c.scene, c.scene + 0.7));
      line(ctx, [[560, 900], [560, 380], [960, 180], [1360, 380], [1360, 900], [560, 900]], C.W, 10, hp, hp);
      line(ctx, [[560, 640], [1360, 640]], C.W, 6, hp); line(ctx, [[960, 380], [960, 900]], C.W, 6, hp);
      const rooms = [[C.P, 580, 400, 360, 220, 'Schlafzimmer', '--', 0.1], [C.O, 980, 660, 360, 220, 'Küche', 'oo', 0.45], [C.BL, 980, 400, 360, 220, 'Bad', 'oo', 0.75], [C.GR, 580, 660, 360, 220, 'Wohnen', '^^', 0.9]];
      rooms.forEach(([col, x, y, w, h, name, e, f], i) => {
        const on = pop(t, onBeat(inLine(c, 1, f)));
        const lane = [[600, 880], [600 + i * 18, 870], [x + w / 2, 870 - (i % 2 ? 0 : 0)], [x + w / 2, y + h / 2]];
        line(ctx, lane, C.W, 3, hp * 0.4); flow(ctx, lane, t, { n: 5, r: 5, a: hp * 0.9, speed: 200 });
        if (on > 0) { ctx.globalAlpha = 0.9 * Math.min(1, on); rrect(ctx, x + 10, y + 10, w - 20, h - 20, 18, col); ctx.globalAlpha = 1;
          ctx.strokeStyle = col === C.D ? C.W : '#000'; ctx.lineWidth = 10; eye(ctx, e[0], x + w / 2 - 40, y + h / 2 - 10, 20, 0); eye(ctx, e[1], x + w / 2 + 40, y + h / 2 - 16, 20, 0);
          label(ctx, name, x + w / 2, y + h - 30, 30, on, '#000'); }
      });
      rrect(ctx, 580, 820, 60, 70, 8, C.D);
      ctx.restore();
    });
    const cp = easeOut(seg(t, T2 + 0.4, T2 + 0.9));
    if (cp > 0) {
      const fade = 1 - seg(t, c.end - 0.6, c.end - 0.2);
      line(ctx, [[1000, 440], [1200, 440]], C.W, 22, cp * fade); flow(ctx, [[1000, 440], [1200, 440]], t, { n: 6, r: 10, a: cp * fade, speed: 260 });
      line(ctx, [[1000, 760], [1200, 760]], C.W, 3, cp * fade); flow(ctx, [[1000, 760], [1200, 760]], t, { n: 2, r: 4, a: cp * fade, speed: 160 });
      face(ctx, 1400, 440, 150, C.O, exprAt(t, ['><', '**'], T2), { scale: pop(t, T2 + 0.4) * fade, seed: 100, squash: squashAt(t) });
      face(ctx, 1290, 760, 30, C.G, 'oo', { scale: pop(t, T2 + 0.8) * fade, seed: 101 });
      label(ctx, 'Herd', 1400, 650, 44, cp * fade); label(ctx, 'Ladegerät', 1290, 840, 36, cp * fade);
    }
  },

  8(ctx, t, c) { // Steckdose, Schalter, Schutzleiter
    const [T1, T2, T3, T4, T5, T6] = [1, 2, 3, 4, 5, 6].map((i) => Lt(c, i));
    const phase = t < T2 ? 0 : t < T3 ? 1 : t < T6 ? 2 : 3;
    const fadeTo = (a, b) => (1 - seg(t, b - 0.35, b)) * easeOut(seg(t, a, a + 0.35));
    withCamera(ctx, t, c, [660, 520], () => {
      const a0 = t < T2 ? 1 : 1 - seg(t, T2 - 0.35, T2);
      if (a0 > 0) {
        line(ctx, [[120, 900], [660, 900], [660, 690]], C.W, 6, a0 * 0.6); line(ctx, [[660, 900], [1260, 900], [1260, 640]], C.W, 6, a0 * 0.6);
        face(ctx, 660, 520, 160, C.G, 'oo', { seed: 110, a: a0, squash: squashAt(t), eyeCol: '#000' });
        ctx.save(); ctx.globalAlpha = a0; ctx.translate(1260, 520); rrect(ctx, -100, -120, 200, 240, 30, C.D); ctx.strokeStyle = C.W; ctx.lineWidth = 12;
        const e = exprAt(t, ['--', 'oo'], c.scene, 2); eye(ctx, e[0], -40, -10, 22, 0); eye(ctx, e[1], 40, -10, 22, 0); ctx.restore();
        buildLine(ctx, [['Steckdose', C.W]], 660, 780, 52, t, c.scene + 0.3, T2 - 0.4);
        buildLine(ctx, [['Schalter', C.W]], 1260, 780, 52, t, c.scene + 0.5, T2 - 0.4);
        // Geräte bekommen Strom aus der Steckdose
        if (t > T1) [[C.P, 1560, 260, 'oo'], [C.BL, 1640, 520, '^^'], [C.O, 1560, 780, '**']].forEach(([col, x, y, e2], i) => {
          const p = pop(t, onBeat(inLine(c, 1, 0.3 + i * 0.18)));
          if (p > 0) { flow(ctx, [[820, 520], [x - 70, y]], t, { n: 4, r: 6, a: p * a0 }); face(ctx, x, y, 62, col, e2, { scale: p, seed: 115 + i, a: a0 }); }
        });
      }
      // Schalter-Szene: Lücke im Stromkreis
      const a1 = phase === 1 ? fadeTo(T2, T3) : 0;
      if (a1 > 0) {
        const closed = Math.floor((t - T2) / (B[1] - B[0]) / 4) % 2 === 1;
        line(ctx, [[200, 560], [880, 560]], C.W, 10, a1); line(ctx, [[1040, 560], [1450, 560]], C.W, 10, a1);
        ctx.save(); ctx.globalAlpha = a1; ctx.translate(880, 560); ctx.rotate(closed ? 0 : -0.6); line(ctx, [[0, 0], [160, 0]], C.O, 12); ctx.restore();
        if (closed) flow(ctx, [[200, 560], [1450, 560]], t, { n: 12, r: 7, a: a1 });
        if (closed) { ctx.globalAlpha = 0.25 * a1; ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(1560, 560, 150, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        face(ctx, 1560, 560, 100, closed ? C.O : C.D, closed ? '**' : '--', { seed: 120, a: a1 });
        label(ctx, closed ? 'an' : 'aus', 1560, 740, 44, a1);
      }
      // Leiter L, N, PE
      const a2 = phase === 2 ? fadeTo(T3, T6) : 0;
      if (a2 > 0) {
        const hl = seg(t, T4, T4 + 0.4), defect = t > T5;
        const dim = (k) => (k === 2 ? 1 : 1 - 0.7 * hl);
        const Ls = [[C.O, 380, 'L'], [C.BL, 520, 'N'], [C.GR, 660, 'PE']];
        Ls.forEach(([col, y, n], k) => {
          const P = [[220, y], [defect ? 1000 : 1700, y]];
          line(ctx, P, col, 14, a2 * dim(k), easeOut(seg(t, T3 + k * 0.25, T3 + k * 0.25 + 0.5)));
          if (k === 2) { ctx.save(); ctx.setLineDash([20, 20]); line(ctx, P, C.Y, 14, a2 * easeOut(seg(t, T3 + 0.5, T3 + 1))); ctx.restore(); }
          label(ctx, n, 180, y + 14, 40, a2 * dim(k), C.W, 'right');
        });
        if (t > T4) face(ctx, 1780, 660, 60, C.GR, '^^', { scale: pop(t, T4 + 0.3) * (defect ? 0 : 1), seed: 125, a: a2 });
        if (defect) {
          const dp = easeOut(seg(t, T5, T5 + 0.4)), trip = onBeat(inLine(c, 5, 0.7));
          rrect(ctx, 1000, 300, 360, 260, 30, null, C.G, 10);
          label(ctx, 'Gerät (Metall)', 1180, 610, 36, a2 * dp);
          const zap = t > inLine(c, 5, 0.15) && t < trip;
          if (zap) for (let k = 0; k < 6; k++) { ctx.fillStyle = C.O; ctx.globalAlpha = a2; ctx.beginPath(); ctx.arc(1000 + ((k * 67 + t * 400) % 360), 300 + ((k * 41) % 60), 7, 0, Math.PI * 2); ctx.fill(); }
          const P = [[1000, 520], [980, 660], [980, 900]];
          line(ctx, P, C.GR, 14, a2 * dp); if (zap) flow(ctx, P, t, { n: 6, r: 7, col: C.O, a: a2, speed: 360 });
          for (let k = 0; k < 3; k++) line(ctx, [[980 - 60 + k * 18, 900 + k * 20], [980 + 60 - k * 18, 900 + k * 20]], C.W, 8, a2 * dp);
          face(ctx, 1600, 440, 70, C.G, zap ? 'oo' : '^^', { scale: pop(t, T5 + 0.3), seed: 126, a: a2 });
          label(ctx, 'du', 1600, 560, 36, a2 * dp);
          face(ctx, 1600, 800, 60, C.GR, t > trip ? exprAt(t, ['><', 'xx'], trip) : '++', { scale: pop(t, inLine(c, 5, 0.55)), seed: 127, a: a2 });
          label(ctx, 'FI', 1600, 900, 36, a2 * pop(t, inLine(c, 5, 0.55)));
        }
      }
      // Schuko-Steckdose mit Schutzkontakten
      const a3 = phase === 3 ? easeOut(seg(t, T6, T6 + 0.4)) : 0;
      if (a3 > 0) {
        face(ctx, CX, 480, 240 * pop(t, T6), C.G, null, { a: a3 });
        ctx.globalAlpha = a3; ctx.fillStyle = '#000';
        for (const dx of [-95, 95]) { ctx.beginPath(); ctx.arc(CX + dx, 480, 28, 0, Math.PI * 2); ctx.fill(); }
        const glow = 0.5 + 0.5 * Math.sin((t - T6) * 8);
        for (const dy of [-200, 200]) { rrect(ctx, CX - 40, 480 + dy - 18, 80, 36, 10, C.GR); ctx.globalAlpha = a3 * glow; ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(CX + 60, 480 + dy, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a3; }
        ctx.globalAlpha = 1;
        buildLine(ctx, [['Schutzkontakte ', C.W], ['[PE]', C.GR]], CX, 900, 64, t, T6 + 0.6, c.end - 0.5);
      }
    });
  },

  9(ctx, t, c) { // Die ganze Reise
    const T1 = Lt(c, 1), T2 = Lt(c, 2);
    const st = [[C.O, '++', 'Turbine'], [C.P, '//', 'Hochspannung'], [C.GR, '--', 'Umspannwerk'], [C.BL, 'oo', 'Trafostation'], [C.D, '--', 'Hausanschluss'], [C.P, 'oo', 'Zähler'], [C.D, '><', 'Sicherung'], [C.GR, '^^', 'Stromkreis'], [C.G, 'oo', 'Steckdose']];
    const gather = easeIn(seg(t, T2 + 0.2, T2 + 0.8));
    withCamera(ctx, t, c, [CX, CY], () => {
      st.forEach(([col, e, name], i) => {
        const x = 170 + i * 197, pass = inLine(c, 1, (i + 0.5) / 9.5), hit = Math.exp(-Math.max(0, t - pass) / 0.12) * (t > pass ? 1 : 0);
        const p = pop(t, onBeat(Lt(c, 0) + 0.2 + i * 0.245)) * (1 - gather);
        face(ctx, lerp(x, CX, gather), CY + bob(t, i) * 0.5, 62, col, t > pass ? exprAt(t, [e, '^^', e], pass) : e, { scale: p * (1 + 0.25 * hit), seed: 130 + i, spin: i === 0 ? t * 4 : 0 });
        buildText(ctx, name, x - textModel(name, 28).w / 2, CY + 120, 28, C.W, t, pass - 0.1, T2 + 0.2);
      });
      if (t > T1 && t < T2 + 0.3) {
        const k = seg(t, T1, Le(c, 1)), x = lerp(120, 1800, k);
        face(ctx, x, CY - 130, 44, C.G, '><', { seed: 1, squash: squashAt(t) });
      }
    });
    buildLine(ctx, [['Strom ', C.W], ['[fast Lichtgeschwindigkeit]', C.P]], CX, CY + 30, 84, t, T2 + 0.8, c.end - 0.5);
  },

  10(ctx, t, c, avatar) { // Outro + Schlussbild
    const T1 = Lt(c, 1);
    buildLine(ctx, [['Elektrik? ', C.W], ['Nur vom Profi.', C.GR]], CX, CY + 40, 110, t, Lt(c, 0) + 0.2, T1 - 0.2);
    const ap = pop(t, T1 + 0.1, 0.5);
    if (ap > 0) {
      const r = 170 * ap;
      ctx.save(); ctx.beginPath(); ctx.arc(CX, 420, r, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatar, CX - r, 420 - r, 2 * r, 2 * r); ctx.restore();
      [[C.P, 700, 300, 60, 'oo'], [C.O, 1230, 250, 50, '^^'], [C.GR, 1270, 560, 64, '++'], [C.BL, 640, 580, 48, '><']].forEach(([col, x, y, rr, e], i) =>
        face(ctx, x, y + bob(t, i), rr, col, exprAt(t, [e, '**', e, '--'], T1 + i * 0.49), { scale: pop(t, onBeat(T1 + 0.5 + i * 0.25)), seed: 140 + i, squash: squashAt(t) }));
      buildLine(ctx, [['Der Handwerksdoktor', C.W]], CX, 720, 80, t, T1 + 0.4);
      buildLine(ctx, [['[', C.P], ['@derhandwerksdoktor', C.GR], [']', C.P]], CX, 810, 48, t, T1 + 0.8, Infinity, 0.12);
    }
  },
};
const FOCUS = { 1: [760, 560], 2: [CX, CY] };

// ---------- SFX-Cues ----------
function buildCues() {
  const cues = [], add = (t, type, gain) => cues.push({ t: +t.toFixed(3), type, gain });
  CH.forEach((c) => {
    if (c.title) { add(c.start, 'whoosh', 0.35); add(c.start + 0.05, 'pop', 0.35); add(c.scene, 'whoosh', 0.45); }
    add(c.end - 0.5, 'whoosh', 0.3);
  });
  add(0.35, 'whoosh', 0.5);
  const c0 = CH[0]; for (let i = 0; i < 5; i++) add(onBeat(Lt(c0, 2) + i * 0.25), 'pop', 0.4);
  const c1 = CH[1]; add(Lt(c1, 3), 'pop', 0.5); add(onBeat(Lt(c1, 3) + 0.9), 'pop', 0.5); add(Lt(c1, 4) + 0.3, 'pop', 0.4);
  const c2 = CH[2]; for (let i = 0; i < 4; i++) add(onBeat(Lt(c2, 4) + i * 0.25), 'thump', 0.35);
  const c4 = CH[4]; add(Lt(c4, 3) + 0.2, 'pop', 0.5);
  const c5 = CH[5]; add(Lt(c5, 1), 'thump', 0.4); add(onBeat(inLine(c5, 1, 0.45)), 'click', 0.6); add(Lt(c5, 2), 'pop', 0.5);
  const c6 = CH[6]; for (let i = 0; i < 6; i++) add(onBeat(Lt(c6, 2) + i * 0.25), 'click', 0.45);
  add(onBeat(inLine(c6, 3, 0.55)), 'thump', 0.7); add(Lt(c6, 4) + 0.3, 'pop', 0.6); add(onBeat(inLine(c6, 6, 0.6)), 'thump', 0.8);
  const c8 = CH[8]; const T2 = Lt(c8, 2), T3 = Lt(c8, 3), bt = B[1] - B[0];
  for (let t = T2; t < T3; t += 4 * bt) add(t, 'click', 0.8);
  add(onBeat(inLine(c8, 5, 0.7)), 'thump', 0.7);
  const c9 = CH[9]; for (let i = 0; i < 9; i++) add(inLine(c9, 1, (i + 0.5) / 9.5), 'pop', 0.3);
  const c10 = CH[10]; add(Lt(c10, 1) + 0.1, 'thump', 0.8);
  return cues.filter((c) => c.t >= 0 && c.t < DUR).sort((a, b) => a.t - b.t);
}

// ---------- Frame ----------
function drawFrame(ctx, t, avatar) {
  ctx.globalAlpha = 1; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const c = CH.findLast((x) => x.start <= t) ?? CH[0];
  if (t >= c.start && (t >= c.scene || c.ch === 0)) SCENES[c.ch](ctx, t, c, avatar);
  chapterTitle(ctx, t, c, c.ch);
  if (c.ch === 10 && t >= c.start) { /* Outro zeichnet selbst */ }
}

// ---------- Ausgabe ----------
function writeTimeline() {
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  const chapters = CH.map((c) => ({ ch: c.ch, title: c.title, start: +c.start.toFixed(3) }));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, chapters, vo: VO }, null, 2));
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  writeTimeline();
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  const avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });

  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number)
      : CH.flatMap((c) => [...(c.title ? [c.start + 0.9] : []), ...c.L.map((l) => l.t + l.dur * 0.75)]).concat([DUR - 1]);
    const files = [];
    for (const t of times) { drawFrame(ctx, t, avatar); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
    if (args[0] === '--contact') {
      const tw = 384, th = 216, cols = 8, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw - 4, th - 4);
        const m = Math.floor(t / 60), s = (t % 60).toFixed(1).padStart(4, '0');
        sc.fillStyle = '#fff'; sc.font = '500 20px Inter'; sc.fillText(`${m}:${s}`, x + 6, y + 22);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png');
      fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
    } else console.log(files.map((f) => f[0]).join('\n'));
    return;
  }

  const from = arg('--from', 0), to = arg('--to', DUR);
  const out = path.join(DIR, 'out', args.includes('--from') ? 'preview.mp4' : 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`, '-r', `${FPS}`, '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
  for (let f = f0; f < f1; f++) {
    drawFrame(ctx, f / FPS, avatar);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 600 === 0) process.stdout.write(`\r${((f - f0) / (f1 - f0) * 100).toFixed(0)}%`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\r${out}`);
}

main();
