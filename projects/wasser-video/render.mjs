// Wasser-Video: „Wie funktioniert die Wasserleitung im Haus?“ – 1920x1080, 60 fps, ca. 4:45.
// Gleiches Design wie projects/strom-video (refs/ref-03), Figuren fürs Wasser: style_guide.md.
// Stil: style_guide.md (refs/ref-03), Skript und Bild: shotlist.md, Zeiten: sections.json + beats.json.
//
//   node projects/wasser-video/render.mjs --timeline        timeline.json + cues.json
//   node projects/wasser-video/render.mjs --contact         ein Frame pro Satz als Übersicht
//   node projects/wasser-video/render.mjs --still 12.5,40   einzelne Frames
//   node projects/wasser-video/render.mjs [--from s --to s] Video (stumm) nach out/video.mp4
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
const C = { bg: '#000000', G: '#e0e0e0', P: '#924ef6', O: '#ff741c', GR: '#03b84c', BL: '#006aff', D: '#262626', W: '#ffffff', WA: '#39a8ff', WASTE: '#8b5e3c', GAS: '#9a9a9a', RED: '#e8201c' };

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

// Die Hauptfigur „Tropfen“: hellblauer Wassertropfen mit Glanzpunkt, wabbelt auf dem Beat und spritzt.
// o.col wechselt die Farbe (kalt/warm/Abwasser), o.tail (0..~1.5) zeichnet beim Reisen eine Wellen-Spur entgegen o.dir.
function dropPath(ctx, r) {
  ctx.beginPath(); ctx.moveTo(0, -1.55 * r);
  ctx.bezierCurveTo(0.35 * r, -1.05 * r, r, -0.5 * r, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r, -0.5 * r, -0.35 * r, -1.05 * r, 0, -1.55 * r); ctx.closePath();
}
function drop(ctx, t, x, y, r, expr, o = {}) {
  const sc = o.scale ?? 1, a = o.a ?? 1, col = o.col ?? C.WA;
  if (sc <= 0.001 || a <= 0.001) return;
  const bi = beatIndex(t), since = sinceBeat(t), kick = Math.exp(-since / 0.08);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
  if (o.tail > 0) { // Wellen-Spur
    ctx.save(); ctx.rotate((o.dir ?? 0) + Math.PI);
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'; ctx.beginPath();
    const len = r * 2.6 * o.tail;
    for (let k = 0; k <= 30; k++) { const f = k / 30, px = r * 0.9 + len * f, py = Math.sin(f * Math.PI * 3 - t * 14) * r * 0.28 * (1 - f * 0.5); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.restore();
  }
  if (since < 0.28) { // Spritzer nach jedem Beat
    const R = rand(bi * 5 + 11), k = since / 0.28;
    ctx.fillStyle = col;
    for (let i = 0; i < 3; i++) {
      const ang = -Math.PI / 2 + (R() - 0.5) * 2.2, v = r * (1.2 + R() * 0.6);
      const px = Math.cos(ang) * v * k * 1.1, py = -r * 0.4 + Math.sin(ang) * v * k + r * 2.2 * k * k;
      ctx.globalAlpha = a * (1 - k); ctx.beginPath(); ctx.arc(px, py, r * 0.1 * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = a;
  }
  ctx.scale(1 + 0.06 * kick, 1 - 0.06 * kick);
  ctx.fillStyle = col; dropPath(ctx, r); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-0.5 * r, -0.35 * r, 0.12 * r, 0.26 * r, 0.5, 0, Math.PI * 2); ctx.fill();
  if (expr) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.085; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    eye(ctx, expr[0], -r * 0.34, r * 0.08, r * 0.2, -0.12); eye(ctx, expr[1] ?? expr[0], r * 0.34, r * 0.02, r * 0.2, 0.1);
  }
  ctx.restore();
}

// Stations-Figuren fürs Wasser: jede Station an ihrer Form erkennbar, dazu Augen aus Zeichen.
function eyesAt(ctx, expr, x1, y1, x2, y2, s, col) {
  if (!expr) return;
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.42; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  eye(ctx, expr[0], x1, y1, s, -0.1); eye(ctx, expr[1] ?? expr[0], x2, y2, s, 0.1);
}
function station(ctx, t, kind, x, y, r, expr, o = {}) {
  const sc = o.scale ?? 1, a = o.a ?? 1;
  if (sc <= 0.001 || a <= 0.001) return;
  const kick = 0.045 * Math.exp(-sinceBeat(t) / 0.06), es = r * 0.17;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc * (1 + kick), sc * (1 - kick));
  switch (kind) {
    case 'works': { // Wasserwerk: Gebäude mit Wellen-Zeichen
      rrect(ctx, -r * 0.95, -r * 0.55, r * 1.9, r * 1.35, r * 0.12, C.BL);
      rrect(ctx, -r * 0.7, -r * 0.85, r * 0.5, r * 0.4, r * 0.06, C.BL);
      ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k <= 24; k++) { const f = k / 24, px = -r * 0.55 + f * r * 1.1, py = r * 0.45 + Math.sin(f * Math.PI * 4 + t * 3) * r * 0.08; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      eyesAt(ctx, expr, -r * 0.3, -r * 0.08, r * 0.3, -r * 0.12, es, '#000');
      break;
    }
    case 'well': { // Brunnen: Schacht mit Deckel, Pfeil nach oben
      rrect(ctx, -r * 0.7, -r * 0.4, r * 1.4, r * 1.2, r * 0.1, C.G);
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.ellipse(0, -r * 0.4, r * 0.7, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.ellipse(0, -r * 0.4, r * 0.7, r * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      line(ctx, [[0, -r * 0.7], [0, -r * 1.25]], C.WA, r * 0.12); line(ctx, [[-r * 0.2, -r * 1.05], [0, -r * 1.3], [r * 0.2, -r * 1.05]], C.WA, r * 0.12);
      eyesAt(ctx, expr, -r * 0.28, r * 0.15, r * 0.28, r * 0.12, es, '#000');
      break;
    }
    case 'meter': { // Wasserzähler: runde Uhr mit Zeiger und m³-Zählwerk
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.BL; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2); ctx.stroke();
      rrect(ctx, -r * 0.45, r * 0.18, r * 0.9, r * 0.3, r * 0.05, '#000');
      ctx.fillStyle = C.WA; ctx.font = `500 ${r * 0.22}px Inter`; ctx.textAlign = 'center'; ctx.fillText(o.digits ?? '0815', 0, r * 0.41); ctx.textAlign = 'left';
      const ang = (o.spin ?? t * 3);
      line(ctx, [[0, r * 0.62], [Math.cos(ang) * r * 0.18, r * 0.62 + Math.sin(ang) * r * 0.18]], C.RED, r * 0.06);
      eyesAt(ctx, expr, -r * 0.32, -r * 0.3, r * 0.32, -r * 0.33, es * 0.9, '#000');
      break;
    }
    case 'valve': { // Absperrventil: rotes Handrad mit Speichen
      const spin = o.spin ?? 0;
      ctx.strokeStyle = C.RED; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = r * 0.12;
      for (let k = 0; k < 4; k++) { const an = spin + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r * 0.45, Math.sin(an) * r * 0.45); ctx.lineTo(Math.cos(an) * r * 0.85, Math.sin(an) * r * 0.85); ctx.stroke(); }
      ctx.fillStyle = C.RED; ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2); ctx.fill();
      eyesAt(ctx, expr, -r * 0.18, -r * 0.02, r * 0.18, -r * 0.05, r * 0.1, C.W);
      break;
    }
    case 'filter': { // Filter: Becher mit Sieb
      ctx.strokeStyle = C.G; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.roundRect(-r * 0.6, -r * 0.8, r * 1.2, r * 1.6, r * 0.18); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.roundRect(-r * 0.55, -r * 0.75, r * 1.1, r * 1.5, r * 0.16); ctx.clip();
      ctx.globalAlpha *= 0.55; ctx.fillStyle = C.WA; ctx.fillRect(-r, -r * 0.2, r * 2, r * 1.2); ctx.globalAlpha /= 0.55;
      ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.03;
      for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.13, -r * 0.2); ctx.lineTo(k * r * 0.13, r * 0.8); ctx.stroke(); }
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-r, -r * 0.2 + k * r * 0.15); ctx.lineTo(r, -r * 0.2 + k * r * 0.15); ctx.stroke(); }
      ctx.restore();
      eyesAt(ctx, expr, -r * 0.24, -r * 0.45, r * 0.24, -r * 0.48, es * 0.85, C.W);
      break;
    }
    case 'gauge': { // Druckminderer / Manometer: Skala grün→rot, Zeiger
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = r * 0.14;
      ctx.strokeStyle = C.GR; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.72, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
      ctx.strokeStyle = C.RED; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.72, Math.PI * 1.6, Math.PI * 1.9); ctx.stroke();
      const nd = Math.PI * (1.15 + 0.7 * (o.needle ?? 0.3));
      line(ctx, [[0, r * 0.1], [Math.cos(nd) * r * 0.62, r * 0.1 + Math.sin(nd) * r * 0.62]], '#000', r * 0.08);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.fill();
      eyesAt(ctx, expr, -r * 0.25, r * 0.5, r * 0.25, r * 0.48, es * 0.7, '#000');
      break;
    }
    case 'tank': { // Warmwasserspeicher: oben warm (orange), unten kalt (blau)
      const hot = o.hot ?? 0.5;
      ctx.save(); ctx.beginPath(); ctx.roundRect(-r * 0.62, -r * 1.2, r * 1.24, r * 2.4, r * 0.4); ctx.clip();
      ctx.fillStyle = C.WA; ctx.fillRect(-r, -r * 1.3, r * 2, r * 2.6);
      const split = -r * 1.2 + r * 2.4 * hot, g = ctx.createLinearGradient(0, split - r * 0.25, 0, split + r * 0.25);
      g.addColorStop(0, C.O); g.addColorStop(1, C.WA); ctx.fillStyle = C.O; ctx.fillRect(-r, -r * 1.3, r * 2, split + r * 1.3 - r * 0.25);
      ctx.fillStyle = g; ctx.fillRect(-r, split - r * 0.25, r * 2, r * 0.5);
      ctx.restore();
      eyesAt(ctx, expr, -r * 0.22, -r * 0.1, r * 0.22, -r * 0.13, es * 0.9, '#000');
      break;
    }
    case 'heater': { // Durchlauferhitzer: Kasten mit Flammen-Zickzack
      rrect(ctx, -r * 0.7, -r * 0.9, r * 1.4, r * 1.8, r * 0.16, C.D);
      ctx.strokeStyle = C.O; ctx.lineWidth = r * 0.1; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let k = 0; k <= 8; k++) { const px = -r * 0.45 + k * r * 0.1125, py = r * 0.45 + (k % 2 ? -1 : 1) * r * (0.12 + 0.05 * Math.sin(t * 20 + k)); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      eyesAt(ctx, expr, -r * 0.25, -r * 0.35, r * 0.25, -r * 0.38, es * 0.9, C.W);
      break;
    }
    case 'sink': { // Waschbecken: Schale mit Hahn
      line(ctx, [[r * 0.35, -r * 0.35], [r * 0.35, -r * 0.8], [-r * 0.05, -r * 0.8], [-r * 0.05, -r * 0.6]], C.G, r * 0.14);
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.moveTo(-r, -r * 0.35); ctx.lineTo(r, -r * 0.35); ctx.quadraticCurveTo(r * 0.95, r * 0.75, 0, r * 0.75); ctx.quadraticCurveTo(-r * 0.95, r * 0.75, -r, -r * 0.35); ctx.fill();
      eyesAt(ctx, expr, -r * 0.3, r * 0.05, r * 0.3, r * 0.02, es, '#000');
      break;
    }
    case 'wc': { // Toilette mit Spülkasten (Füllstand o.level)
      rrect(ctx, -r * 0.55, -r * 1.1, r * 1.1, r * 0.75, r * 0.1, C.G);
      const lv = o.level ?? 0.8; ctx.globalAlpha *= 0.9; rrect(ctx, -r * 0.45, -r * 0.45 - r * 0.55 * lv, r * 0.9, r * 0.55 * lv, r * 0.05, C.WA); ctx.globalAlpha /= 0.9;
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.25); ctx.lineTo(r * 0.75, -r * 0.25); ctx.quadraticCurveTo(r * 0.7, r * 0.55, r * 0.2, r * 0.6);
      ctx.lineTo(r * 0.25, r * 0.95); ctx.lineTo(-r * 0.25, r * 0.95); ctx.lineTo(-r * 0.2, r * 0.6); ctx.quadraticCurveTo(-r * 0.7, r * 0.55, -r * 0.75, -r * 0.25); ctx.fill();
      rrect(ctx, -r * 0.8, -r * 0.33, r * 1.6, r * 0.12, r * 0.05, C.W);
      if (o.button) rrect(ctx, -r * 0.18, -r * 1.2, r * 0.36, r * 0.14 * (1 - o.button * 0.5), r * 0.05, C.O);
      eyesAt(ctx, expr, -r * 0.25, r * 0.12, r * 0.25, r * 0.09, es * 0.85, '#000');
      break;
    }
    case 'shower': { // Duschkopf mit Strahl (Farbe o.jet)
      line(ctx, [[r * 0.9, -r * 1.1], [r * 0.9, -r * 0.8], [r * 0.3, -r * 0.55]], C.G, r * 0.12);
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.ellipse(0, -r * 0.3, r * 0.7, r * 0.42, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.jet ?? C.WA;
      for (let k = 0; k < 12; k++) { const px = -r * 0.5 + (k % 6) * r * 0.2, py = r * 0.3 + fract(t * 2.2 + k * 0.37) * r * 0.9; ctx.beginPath(); ctx.arc(px, py, r * 0.05, 0, Math.PI * 2); ctx.fill(); }
      eyesAt(ctx, expr, -r * 0.25, -r * 0.33, r * 0.2, -r * 0.4, es * 0.8, '#000');
      break;
    }
    case 'siphon': { // Siphon: gebogenes Rohr, unten Sperrwasser (o.level)
      const P = [[-r * 0.55, -r * 1.1], [-r * 0.55, r * 0.25], [-r * 0.45, r * 0.6], [0, r * 0.75], [r * 0.45, r * 0.6], [r * 0.55, r * 0.25], [r * 0.55, -r * 0.1], [r * 1.2, -r * 0.1]];
      line(ctx, P, C.G, r * 0.34);
      const lv = o.level ?? 1;
      if (lv > 0.02) { ctx.save(); ctx.beginPath(); ctx.rect(-r, r * 0.75 - r * 0.85 * lv, r * 2, r); ctx.clip(); line(ctx, P.slice(1, 6), C.WA, r * 0.22); ctx.restore(); }
      eyesAt(ctx, expr, -r * 0.18, -r * 0.2, r * 0.18, -r * 0.23, es * 0.8, C.W);
      break;
    }
    case 'vent': { // Lüftung über Dach: Dach mit Rohr
      ctx.fillStyle = C.D; ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(0, -r * 0.2); ctx.lineTo(r, r * 0.6); ctx.closePath(); ctx.fill();
      rrect(ctx, r * 0.15, -r * 0.9, r * 0.36, r * 1.2, r * 0.05, C.G);
      rrect(ctx, r * 0.08, -r * 1.02, r * 0.5, r * 0.16, r * 0.05, C.G);
      eyesAt(ctx, expr, r * 0.26, -r * 0.55, r * 0.4, -r * 0.57, es * 0.5, '#000');
      break;
    }
    case 'sewer': { // Kläranlage: zwei runde Becken
      for (const [dx, rr] of [[-0.45, 0.6], [0.55, 0.45]]) { ctx.fillStyle = C.GR; ctx.beginPath(); ctx.arc(dx * r, 0, rr * r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.WASTE; ctx.beginPath(); ctx.arc(dx * r, 0, rr * r * 0.7, 0, Math.PI * 2); ctx.fill(); }
      eyesAt(ctx, expr, -r * 0.65, -r * 0.02, -r * 0.25, -r * 0.05, es * 0.8, C.W);
      break;
    }
    case 'cleanout': { // Reinigungsöffnung: Rohr mit Deckel-Kappe
      rrect(ctx, -r * 0.4, -r * 0.4, r * 0.8, r * 1.2, r * 0.05, C.D);
      ctx.save(); ctx.translate(-r * 0.5, -r * 0.45); ctx.rotate(-(o.open ?? 0) * 1.2); rrect(ctx, 0, -r * 0.2, r * 1.0, r * 0.22, r * 0.06, C.O); ctx.restore();
      eyesAt(ctx, expr, -r * 0.16, r * 0.1, r * 0.16, r * 0.08, es * 0.7, C.W);
      break;
    }
    case 'washer': { // Waschmaschine
      rrect(ctx, -r * 0.8, -r * 0.9, r * 1.6, r * 1.8, r * 0.14, C.G);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.WA; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.36, 0, Math.PI * 2); ctx.fill();
      eyesAt(ctx, expr, -r * 0.25, -r * 0.55, r * 0.25, -r * 0.57, es * 0.7, '#000');
      break;
    }
    case 'tap': { // Gartenhahn
      rrect(ctx, -r * 0.8, -r * 0.2, r * 1.3, r * 0.4, r * 0.1, C.GR);
      rrect(ctx, r * 0.3, -r * 0.2, r * 0.3, r * 0.8, r * 0.1, C.GR);
      ctx.fillStyle = C.GR; ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.45, r * 0.32, 0, Math.PI * 2); ctx.fill();
      eyesAt(ctx, expr, -r * 0.33, -r * 0.48, -r * 0.08, -r * 0.5, es * 0.55, '#000');
      break;
    }
    default: break;
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
function flow(ctx, P, t, { n = 10, speed = 260, r = 6, col = C.WA, a = 1, t0 = 0 } = {}) {
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
const fadeWin = (t, a, b, d = 0.35) => easeOut(seg(t, a, a + d)) * (1 - seg(t, b - d, b));
const MIX = '#b36bff'; // gemischtes Wasser (warm + kalt)

function house(ctx, x0, x1, ground, roofY, a = 1, basement = true) {
  line(ctx, [[x0, ground], [x0, roofY + 160], [(x0 + x1) / 2, roofY], [x1, roofY + 160], [x1, ground]], C.W, 10, a);
  if (basement) line(ctx, [[x0, ground], [x0, ground + 200], [x1, ground + 200], [x1, ground]], C.W, 5, a * 0.5);
}
function ground(ctx, y, a = 1, x0 = 80, x1 = 1840) {
  line(ctx, [[x0, y], [x1, y]], C.W, 6, a);
  for (let x = x0 + 40; x < x1; x += 80) line(ctx, [[x, y], [x + 18, y - 20]], C.W, 4, a * 0.5);
}

const SCENES = {
  0(ctx, t, c) { // Intro
    const E = ['oo', '--', 'oo', '><', '^^', 'oo'];
    const gather = easeIn(seg(t, Lt(c, 2) + 0.9, Lt(c, 2) + 1.4));
    const zoom = lerp(8, 1, easeOut(seg(t, 0.3, 1.9)));
    ctx.save(); ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-CX, -CY + 30 * (1 - 1 / zoom));
    const t1 = Lt(c, 1);
    [['sink', 470, 270, 140], ['wc', 1460, 300, 130], ['shower', 1560, 760, 130], ['tank', 450, 800, 110], ['siphon', 1120, 930, 100]].forEach(([k, x, y, r], i) => {
      const p = pop(t, onBeat(t1 + i * 0.25)) * (1 - gather);
      station(ctx, t, k, lerp(x, CX, gather), lerp(y, CY, gather) + bob(t, i), r, exprAt(t, ['oo', '--', 'oo', '><'], t1 + i * 0.25), { scale: p });
    });
    drop(ctx, t, CX, CY + 60 + bob(t, 0) * (zoom > 1.1 ? 0 : 1), lerp(190, 150, easeInOut(seg(t, t1, t1 + 0.6))), exprAt(t, E, 0.4), { scale: 1 - gather });
    ctx.restore();
    buildLine(ctx, [['Die Reise ', C.W], ['des Wassers.', C.WA]], CX, CY + 45, 130, t, Lt(c, 2) + 1.3, c.end - 0.5);
  },

  1(ctx, t, c) { // Wasserwerk
    const [T1, T2, T3] = [1, 2, 3].map((i) => Lt(c, i));
    const a0 = 1 - seg(t, T2 - 0.3, T2 + 0.1), a2 = fadeWin(t, T2, T3 + 0.2), a3 = easeOut(seg(t, T3, T3 + 0.4));
    withCamera(ctx, t, c, [760, 500], () => {
      if (a0 > 0) {
        flow(ctx, [[160, 500], [560, 500]], t, { n: 8, r: 8, col: C.WASTE, a: a0 });
        flow(ctx, [[960, 500], [1400, 500]], t, { n: 8, r: 8, a: a0 });
        station(ctx, t, 'works', 760, 500 + bob(t, 1), 180, exprAt(t, ['oo', '^^', 'oo', '**'], c.scene, 2), { a: a0 });
        drop(ctx, t, 1500, 470, 55, '^^', { scale: pop(t, c.scene + 1.2), a: a0 });
      }
    });
    buildLine(ctx, [['Leitungswasser ', C.W], ['[bestens kontrolliert]', C.GR]], CX, 900, 64, t, T1 + 0.2, T2 - 0.3);
    if (a2 > 0) { // Straße, Versorgungsleitung, Hausanschluss
      ground(ctx, 560, a2);
      station(ctx, t, 'works', 240, 420, 90, 'oo', { a: a2 });
      const main = [[240, 520], [240, 740], [1760, 740]], branch = [[1320, 740], [1320, 620], [1450, 620], [1450, 520]];
      line(ctx, main, C.D, 34, a2, easeOut(seg(t, T2, T2 + 0.8))); line(ctx, branch, C.D, 18, a2, easeOut(seg(t, T2 + 0.9, T2 + 1.4)));
      flow(ctx, main, t, { n: 16, r: 9, a: a2, speed: 320 }); if (t > T2 + 1.3) flow(ctx, branch, t, { n: 5, r: 7, a: a2 });
      house(ctx, 1320, 1640, 560, 330, a2, false);
      label(ctx, 'Versorgungsleitung', 700, 815, 40, a2); label(ctx, 'Hausanschluss', 1480, 700, 36, a2 * seg(t, T2 + 1.2, T2 + 1.6), C.W, 'left');
    }
    if (a3 > 0) { // Brunnen
      ground(ctx, 640, a3);
      ctx.globalAlpha = a3 * 0.9; ctx.fillStyle = C.WA; ctx.fillRect(560, 930, 800, 60); ctx.globalAlpha = 1;
      label(ctx, 'Grundwasser', 1360, 1030, 36, a3, C.WA, 'right');
      line(ctx, [[960, 960], [960, 640]], C.D, 20, a3); flow(ctx, [[960, 960], [960, 600]], t, { n: 6, r: 7, a: a3, speed: 200 });
      station(ctx, t, 'well', 960, 560, 110, exprAt(t, ['oo', '^^'], T3), { scale: pop(t, T3 + 0.2) });
    }
  },

  2(ctx, t, c) { // Zähler, Absperrventil, Filter, Druckminderer
    const [T1, T2, T3, T4, T5] = [1, 2, 3, 4, 5].map((i) => Lt(c, i));
    const closed = easeInOut(seg(t, inLine(c, 3, 0.25), inLine(c, 3, 0.45))) * (1 - easeInOut(seg(t, Le(c, 3) - 0.2, Le(c, 3) + 0.2)));
    const Y = 720;
    withCamera(ctx, t, c, [300, Y], () => {
      ground(ctx, 520);
      label(ctx, 'Keller', 1830, 1000, 36, 0.8, C.W, 'right');
      const pipe = [[80, Y], [1760, Y], [1760, 560]];
      line(ctx, pipe, C.D, 26, 1, easeOut(seg(t, c.scene, c.scene + 1.0)));
      flow(ctx, pipe, closed > 0.5 ? inLine(c, 3, 0.35) : t, { n: 26, r: 8, a: 1 - 0.75 * closed, speed: 260 });
      const items = [['valve', 330, 80, T2, { spin: closed * 2.4 }], ['meter', 610, 118, T1, { digits: String(815 + Math.floor((t - T1) * 0.6)).padStart(4, '0') }], ['valve', 880, 66, T2 + 0.3, { spin: 0 }],
        ['filter', 1140, 105, T4, {}], ['gauge', 1450, 110, T5, { needle: t < inLine(c, 5, 0.25) ? 0.35 : t < inLine(c, 5, 0.5) ? 0.95 : lerp(0.95, 0.3, easeInOut(seg(t, inLine(c, 5, 0.5), inLine(c, 5, 0.7)))) }]];
      items.forEach(([k, x, r, t0, o], i) => station(ctx, t, k, x, Y - (k === 'valve' ? r * 1.05 : 0), r, closed > 0.5 && i === 0 ? '><' : exprAt(t, ['oo', '^^', 'oo', '--'], t0 + i * 0.49), { ...o, scale: pop(t, t0) }));
      if (t > T4) { const R = rand(3); ctx.fillStyle = C.WASTE; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.arc(1090 + R() * 100, Y + 20 + R() * 50, 6, 0, Math.PI * 2); ctx.fill(); } }
      const names = [['Absperrung', 330, T2], ['Wasserzähler', 610, T1], ['Rückfluss-', 880, T2 + 0.3], ['Filter', 1140, T4], ['Druckminderer', 1450, T5]];
      names.forEach(([n, x, t0]) => label(ctx, n, x, Y + 190, 36, seg(t, t0 + 0.2, t0 + 0.5)));
      label(ctx, 'verhinderer', 880, Y + 234, 36, seg(t, T2 + 0.5, T2 + 0.8));
    });
    buildLine(ctx, [['Hauptabsperrventil ', C.W], ['[merken!]', C.RED]], CX, 300, 80, t, T3 + 0.1, T4 - 0.2);
    buildLine(ctx, [['Druck zu hoch? ', C.W], ['[Druckminderer]', C.GR]], CX, 300, 72, t, inLine(c, 5, 0.45), c.end - 0.5);
  },

  3(ctx, t, c) { // Kaltwasser
    const [T1, T2] = [1, 2].map((i) => Lt(c, i));
    const sh = easeInOut(seg(t, T1, T1 + 0.6));
    withCamera(ctx, t, c, [CX, 600], () => {
      ctx.save(); ctx.translate(lerp(0, -480, sh), lerp(0, 40, sh)); ctx.translate(CX, 600); ctx.scale(lerp(1, 0.62, sh), lerp(1, 0.62, sh)); ctx.translate(-CX, -600);
      house(ctx, 560, 1360, 900, 220, 1, false); line(ctx, [[560, 600], [1360, 600]], C.W, 6);
      const riser = [[600, 1000], [600, 880], [700, 880], [700, 380]];
      line(ctx, riser, C.D, 14); flow(ctx, riser, t, { n: 12, r: 6 });
      const users = [['wc', 1000, 480, 70, [[700, 520], [920, 520]], 0.05], ['sink', 1240, 460, 70, [[700, 440], [1170, 440]], 0.2], ['shower', 860, 740, 70, [[700, 780], [800, 780]], 0.35],
        ['washer', 1120, 800, 65, [[700, 840], [1050, 840]], 0.55], ['tap', 1480, 820, 60, [[700, 870], [1430, 870]], 0.75]];
      users.forEach(([k, x, y, r, P, f], i) => { const p = pop(t, onBeat(inLine(c, 0, f))); if (p > 0) { line(ctx, P, C.D, 10, Math.min(1, p)); flow(ctx, P, t, { n: 5, r: 5, a: Math.min(1, p) }); station(ctx, t, k, x, y, r, exprAt(t, ['oo', '^^'], inLine(c, 0, f) + i * 0.3), { scale: p }); } });
      ctx.restore();
    });
    const rp = fadeWin(t, T1 + 0.3, T2 + 0.1);
    [['Kunststoff-Verbund', C.W, 330], ['Kupfer', '#c87533', 540], ['verzinkter Stahl', '#8a8a8a', 750]].forEach(([n, col, y], i) => {
      const p = pop(t, onBeat(T1 + 0.4 + i * 0.49)) * rp; if (p <= 0) return;
      ctx.save(); ctx.translate(1350, y); ctx.scale(p, p); rrect(ctx, -300, -30, 600, 60, 30, col); ctx.restore();
      label(ctx, n, 1350, y + 90, 40, rp);
    });
    const ap = easeOut(seg(t, T2, T2 + 0.5));
    if (ap > 0) { const P = [[1100, 540], [1300, 540], [1300, 700]]; line(ctx, P, C.D, 14, ap, ap); flow(ctx, P, t, { n: 4, r: 6, a: ap }); station(ctx, t, 'tank', 1300, 800, 70, '^^', { scale: pop(t, T2 + 0.5), hot: 0.5 }); label(ctx, 'Warmwasser', 1420, 820, 40, ap, C.O, 'left'); }
  },

  4(ctx, t, c) { // Warmwasser
    const [T1, T2, T3, T4] = [1, 2, 3, 4].map((i) => Lt(c, i));
    const sh = easeInOut(seg(t, T4, T4 + 0.6));
    withCamera(ctx, t, c, [760, 540], () => {
      ctx.save(); ctx.translate(lerp(0, -300, sh), 0); ctx.translate(760, 540); ctx.scale(lerp(1, 0.7, sh), lerp(1, 0.7, sh)); ctx.translate(-760, -540);
      const heat = easeInOut(seg(t, T1, T1 + 2.5));
      if (t > T1) { flow(ctx, [[300, 760], [600, 760]], t, { n: 5, r: 8 }); line(ctx, [[300, 760], [620, 760]], C.D, 16, 0.6); }
      if (t > T2) { line(ctx, [[900, 320], [1250, 320]], C.D, 16, 0.6); flow(ctx, [[900, 320], [1250, 320]], t, { n: 5, r: 8, col: C.O }); }
      station(ctx, t, 'tank', 760, 540, 200, exprAt(t, ['oo', '^^', 'oo', '**'], c.scene, 2), { hot: lerp(0.2, 0.55, heat) });
      if (t > T1 && t < T4) for (let k = 0; k < 14; k++) { // Aufsteigen
        const f = fract(k / 14 + (t - T1) * 0.25), x = 700 + ((k * 37) % 120), y = lerp(760, 360, f);
        ctx.fillStyle = f > 0.5 ? C.O : C.WA; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      label(ctx, 'kalt rein', 300, 820, 36, seg(t, T1, T1 + 0.4), C.WA, 'left'); label(ctx, 'warm raus', 1250, 300, 36, seg(t, T2, T2 + 0.4), C.O, 'right');
      ctx.restore();
    });
    buildLine(ctx, [['Speicher ', C.W], ['[ca. 60 °C]', C.O]], 760, 1000, 76, t, T3 + 0.2, T4 - 0.2);
    const hp = pop(t, T4 + 0.3);
    if (hp > 0) {
      line(ctx, [[1050, 560], [1300, 560]], C.D, 14, hp); flow(ctx, [[1050, 560], [1300, 560]], t, { n: 4, r: 7, a: hp });
      line(ctx, [[1560, 560], [1820, 560]], C.D, 14, hp); flow(ctx, [[1560, 560], [1820, 560]], t, { n: 4, r: 7, a: hp, col: C.O });
      station(ctx, t, 'heater', 1430, 560, 120, exprAt(t, ['oo', '><'], T4), { scale: hp });
      label(ctx, 'Durchlauferhitzer', 1430, 800, 44, hp);
    }
  },

  5(ctx, t, c) { // Waschbecken, WC, Dusche
    const [T1, T2, T3, T4] = [1, 2, 3, 4].map((i) => Lt(c, i));
    const sinkA = 1 - seg(t, T2 - 0.3, T2 + 0.1), wcS = easeInOut(seg(t, T4, T4 + 0.5));
    withCamera(ctx, t, c, [CX, 480], () => {
      if (sinkA > 0) {
        ctx.globalAlpha = sinkA;
        line(ctx, [[860, 760], [860, 980]], C.RED, 12, sinkA); line(ctx, [[1060, 760], [1060, 980]], C.BL, 12, sinkA);
        station(ctx, t, 'valve', 860, 760, 34, 'oo', { a: sinkA }); station(ctx, t, 'valve', 1060, 760, 34, 'oo', { a: sinkA });
        if (t > T1) { for (let k = 0; k < 8; k++) { const f = fract(k / 8 + t * 0.9); ctx.fillStyle = MIX; ctx.globalAlpha = sinkA; ctx.beginPath(); ctx.arc(960 - 8, lerp(330, 520, f), 7, 0, Math.PI * 2); ctx.fill(); } }
        station(ctx, t, 'sink', 960, 520, 190, exprAt(t, ['oo', '^^', 'oo', '--'], c.scene, 2), { a: sinkA });
        ctx.globalAlpha = 1;
        label(ctx, 'Eckventile', 960, 1040, 40, sinkA * seg(t, c.scene + 0.8, c.scene + 1.2));
      }
    });
    if (t > T2 - 0.2) { // WC
      const flush = seg(t, inLine(c, 3, 0.1), inLine(c, 3, 0.35)), refill = seg(t, inLine(c, 3, 0.55), Le(c, 3) + 0.5);
      const flush2 = t > inLine(c, 4, 0.5) ? seg(t, inLine(c, 4, 0.5), inLine(c, 4, 0.65)) * (1 - seg(t, inLine(c, 4, 0.7), Le(c, 4))) : 0;
      const level = t < T3 ? lerp(0.1, 0.85, easeInOut(seg(t, T2 + 0.3, Le(c, 2)))) : Math.max(0.05, 0.85 * (1 - flush) + 0.8 * refill) * (1 - flush2 * 0.9);
      const x = lerp(1000, 520, wcS), r = lerp(190, 130, wcS);
      station(ctx, t, 'wc', x, 540, r, flush > 0 && flush < 1 ? '><' : exprAt(t, ['oo', '^^'], T2), { scale: pop(t, T2), level, button: flush > 0 && flush < 0.3 ? 1 : 0 });
      if (flush > 0 && flush < 1) { ctx.fillStyle = C.WA; for (let k = 0; k < 10; k++) { const f = fract(k / 10 + t * 2); ctx.beginPath(); ctx.arc(x - r * 0.3 + (k % 5) * r * 0.15, 540 - r * 0.3 + f * r * 0.9, 6, 0, Math.PI * 2); ctx.fill(); } }
      buildLine(ctx, [['Spülung ', C.W], ['[ca. 6 Liter]', C.WA]], lerp(1000, 520, wcS), 950, 64, t, inLine(c, 2, 0.5), T3 + 1.5);
    }
    if (t > T4 - 0.1) { // Dusche mit Thermostat
      const p = pop(t, T4 + 0.3);
      station(ctx, t, 'shower', 1380, 460, 170, t > inLine(c, 4, 0.5) ? '^^' : 'oo', { scale: p, jet: MIX });
      line(ctx, [[1560, 240], [1560, 900]], C.O, 10, p * 0.8); line(ctx, [[1620, 240], [1620, 900]], C.BL, 10, p * 0.8);
      buildLine(ctx, [['Thermostat ', C.W], ['[konstant]', MIX]], 1380, 950, 60, t, inLine(c, 4, 0.3), c.end - 0.5);
    }
  },

  6(ctx, t, c) { // Abwasser: Schwerkraft und Gefälle
    const [T1, T2, T3] = [1, 2, 3].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [CX, CY], () => {
      const brown = easeInOut(seg(t, c.scene + 0.6, c.scene + 1.2)), a0 = 1 - seg(t, T1 - 0.2, T1 + 0.2);
      drop(ctx, t, CX, CY + 60, 150, brown > 0.5 ? '><' : 'oo', { col: brown > 0.5 ? C.WASTE : C.WA, a: a0 });
    });
    const a1 = fadeWin(t, T1, T3 + 0.2);
    if (a1 > 0) {
      const P1 = [[200, 420], [860, 420]], P2 = [[1060, 330], [1720, 560]];
      line(ctx, P1, C.D, 40, a1); line(ctx, P2, C.D, 40, a1);
      flow(ctx, P1, t, { n: 16, r: 10, a: a1, speed: 520 });
      flow(ctx, P2, t, { n: 7, r: 11, a: a1, speed: 180, col: C.WASTE });
      label(ctx, 'Frischwasser: Druck', 530, 330, 44, a1); label(ctx, 'Abwasser: Schwerkraft', 1390, 300, 44, a1);
      station(ctx, t, 'gauge', 530, 620, 80, 'oo', { a: a1, needle: 0.55 }); drop(ctx, t, 1390, 720, 60, 'vv', { col: C.WASTE, a: a1 });
    }
    const a2 = fadeWin(t, T2, T3 + 0.2);
    if (a2 > 0) { // Gefälle-Dreieck
      line(ctx, [[560, 800], [1360, 860]], C.W, 10, a2); line(ctx, [[560, 800], [1360, 800], [1360, 860]], C.W, 4, a2 * 0.6);
      label(ctx, '1 m', 960, 780, 36, a2); label(ctx, '1 cm', 1380, 842, 36, a2, C.O, 'left');
    }
    buildLine(ctx, [['Gefälle ', C.W], ['[1 cm pro Meter]', C.O]], CX, 980, 70, t, T2 + 0.2, T3 - 0.2);
    const a3 = easeOut(seg(t, T3, T3 + 0.4)) * (1 - seg(t, c.end - 0.6, c.end - 0.2));
    if (a3 > 0) {
      line(ctx, [[360, 620], [1560, 620]], C.D, 110, a3); flow(ctx, [[360, 620], [1560, 620]], t, { n: 6, r: 22, a: a3, col: C.WASTE, speed: 220 });
      line(ctx, [[360, 850], [1560, 850]], C.D, 40, a3); flow(ctx, [[360, 850], [1560, 850]], t, { n: 6, r: 8, a: a3, col: C.WA, speed: 300 });
      label(ctx, 'WC: rund 10 cm', 360, 540, 44, a3, C.W, 'left'); label(ctx, 'Waschbecken: dünner', 360, 800, 40, a3, C.W, 'left');
      station(ctx, t, 'wc', 1720, 600, 90, '^^', { scale: pop(t, T3 + 0.3), level: 0.8 });
    }
  },

  7(ctx, t, c) { // Siphon
    const [T1, T2] = [1, 2].map((i) => Lt(c, i));
    const dry = t > T2 ? easeInOut(seg(t, inLine(c, 2, 0.05), inLine(c, 2, 0.35))) * (1 - easeInOut(seg(t, inLine(c, 2, 0.6), inLine(c, 2, 0.8)))) : 0;
    withCamera(ctx, t, c, [880, 520], () => {
      const ex = dry > 0.6 ? 'xx' : t > inLine(c, 2, 0.8) ? '^^' : exprAt(t, ['oo', '--', 'oo', '^^'], c.scene, 2);
      station(ctx, t, 'siphon', 880, 480, 230, ex, { level: 1 - dry * 0.95 });
      if (t > T1) { // Kanalgase prallen am Sperrwasser ab
        for (let k = 0; k < 8; k++) {
          const f = fract(k / 8 + (t - T1) * 0.35), stop = dry > 0.6 ? 1 : 0.45;
          const P = [[1560, 380], [1156, 380], [1006, 380], [1006, 560]];
          const L = polyLen(P), d = Math.min(f, stop) * L.at(-1), [px, py] = polyAt(P, L, d);
          ctx.globalAlpha = f > stop ? Math.max(0, 1 - (f - stop) * 6) : 0.9; ctx.fillStyle = C.GAS;
          ctx.beginPath(); ctx.arc(px, py - (dry > 0.6 ? f * 300 : 0), 10, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        label(ctx, 'Kanalgase', 1580, 330, 40, seg(t, T1, T1 + 0.4), C.GAS, 'right');
      }
      if (t > inLine(c, 2, 0.55) && t < inLine(c, 2, 0.85)) flow(ctx, [[754, 60], [754, 400]], t, { n: 6, r: 9, speed: 500 });
    });
    buildLine(ctx, [['Sperrwasser ', C.WA], ['[stoppt Gestank]', C.W]], CX, 1000, 64, t, inLine(c, 1, 0.3), T2 - 0.2);
    buildLine(ctx, [['Riecht es? ', C.W], ['[Wasser nachgießen]', C.WA]], CX, 1000, 64, t, inLine(c, 2, 0.5), c.end - 0.5);
  },

  8(ctx, t, c) { // Lüftung über Dach
    const [T1, T2, T3] = [1, 2, 3].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [1100, 500], () => {
      house(ctx, 560, 1400, 950, 190, 1, false); line(ctx, [[560, 600], [1400, 600]], C.W, 6);
      const stack = [[1100, 1040], [1100, 110]];
      line(ctx, stack, C.D, 36);
      rrect(ctx, 1080, 90, 40, 30, 6, C.G);
      station(ctx, t, 'sink', 820, 470, 70, T3 && t > T3 ? exprAt(t, ['><', 'oo'], T3) : 'oo');
      station(ctx, t, 'sink', 820, 820, 70, 'oo');
      line(ctx, [[860, 540], [1100, 560]], C.D, 14); line(ctx, [[860, 890], [1100, 910]], C.D, 14);
      if (t > c.scene) flow(ctx, [[1100, 200], [1100, 1040]], t, { n: 6, r: 10, col: C.WASTE, speed: 420, a: 0.9 });
      if (t > T1 && t < T2) { // Sog
        const k = 0.5 + 0.5 * Math.sin((t - T1) * 10);
        line(ctx, [[1000, 560], [1080, 560]], C.GAS, 8, k); line(ctx, [[1060, 540], [1080, 560], [1060, 580]], C.GAS, 8, k);
        label(ctx, 'Sog!', 980, 520, 44, 1, C.GAS, 'right');
      }
      if (t > T2) { // Luft rein, Gase raus
        for (let k = 0; k < 6; k++) { const f = fract(k / 6 + (t - T2) * 0.6); ctx.fillStyle = C.GAS; ctx.globalAlpha = 1 - f; ctx.beginPath(); ctx.arc(1100 + Math.sin(f * 8 + k) * 20, 90 - f * 90, 9, 0, Math.PI * 2); ctx.fill(); }
        for (let k = 0; k < 5; k++) { const f = fract(k / 5 + (t - T2) * 0.5); ctx.fillStyle = C.W; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(1070, lerp(80, 320, f), 6, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    });
    buildLine(ctx, [['Lüftung', C.W]], 1660, 460, 60, t, T2 + 0.2, c.end - 0.5);
    buildLine(ctx, [['[über Dach]', C.GR]], 1660, 540, 60, t, T2 + 0.2, c.end - 0.5);
    if (t > T3) label(ctx, 'gluck, gluck …', 820, 380, 40, seg(t, T3, T3 + 0.3), C.GAS);
  },

  9(ctx, t, c) { // Kanal, Kläranlage, Reinigungsöffnung
    const [T1, T2] = [1, 2].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [600, 700], () => {
      ground(ctx, 560);
      house(ctx, 200, 700, 560, 180, 1, true);
      const P = [[450, 760], [700, 760], [1300, 820], [1300, 900]];
      line(ctx, P, C.D, 28, 1, easeOut(seg(t, c.scene, c.scene + 0.8))); flow(ctx, P, t, { n: 10, r: 8, col: C.WASTE, speed: 240 });
      line(ctx, [[900, 940], [1840, 940]], C.D, 80); flow(ctx, [[900, 940], [1840, 940]], t, { n: 10, r: 14, col: C.WASTE, speed: 260 });
      label(ctx, 'Grundleitung', 700, 700, 36, 1, C.W, 'left'); label(ctx, 'öffentlicher Kanal', 1840, 1030, 40, 1, C.W, 'right');
      const kp = pop(t, T1 + 0.3);
      if (kp > 0) { station(ctx, t, 'sewer', 1580, 390, 120, exprAt(t, ['oo', '^^'], T1), { scale: kp }); label(ctx, 'Kläranlage', 1580, 520, 40, kp); }
      const cp = pop(t, T2 + 0.3), open = t > inLine(c, 2, 0.4) ? easeOut(seg(t, inLine(c, 2, 0.4), inLine(c, 2, 0.55))) : 0;
      if (cp > 0) { station(ctx, t, 'cleanout', 450, 700, 60, open > 0.5 ? '^^' : 'oo', { scale: cp, open }); label(ctx, 'Reinigungsöffnung', 450, 830, 36, cp); }
    });
  },

  10(ctx, t, c, avatar) { // Die ganze Reise + Outro
    const [T0, T1, T2] = [0, 1, 2].map((i) => Lt(c, i));
    const st = [['works', 'Wasserwerk', C.WA], ['meter', 'Zähler', C.WA], ['valve', 'Absperrventil', C.WA], ['tank', 'Warmwasser', C.O], ['sink', 'Hahn', MIX], ['wc', 'Toilette', C.WA], ['shower', 'Dusche', MIX], ['siphon', 'Siphon', C.WASTE], ['sewer', 'Kanal', C.WASTE]];
    const gather = easeIn(seg(t, T1 - 0.4, T1 + 0.1));
    withCamera(ctx, t, c, [CX, CY], () => {
      st.forEach(([k, name], i) => {
        const x = 170 + i * 197, pass = inLine(c, 0, (i + 0.5) / 9.5), hit = t > pass ? Math.exp(-(t - pass) / 0.12) : 0;
        const p = pop(t, onBeat(c.scene + i * 0.245)) * (1 - gather);
        station(ctx, t, k, lerp(x, CX, gather), CY + 20 + bob(t, i) * 0.5, k === 'tank' ? 45 : 55, t > pass ? exprAt(t, ['oo', '^^'], pass) : 'oo', { scale: p * (1 + 0.25 * hit), hot: 0.5, level: 0.8, spin: t * 2 });
        buildText(ctx, name, x - textModel(name, 28).w / 2, CY + 140 + (i % 2) * 44, 28, C.W, t, pass - 0.1, T1 - 0.4);
      });
      if (t > T0 && t < T1 - 0.2) {
        const k = seg(t, T0, Le(c, 0)), x = lerp(120, 1800, k), idx = Math.min(8, Math.floor(k * 9));
        drop(ctx, t, x, CY - 150, 48, '><', { tail: 1.2, dir: 0, col: st[idx][2] });
      }
    });
    const vp = pop(t, T1 + 0.1) * (1 - seg(t, T2 - 0.3, T2));
    if (vp > 0) { station(ctx, t, 'valve', CX, 420, 150, exprAt(t, ['oo', '><'], T1), { scale: vp, spin: (t - T1) * 1.5 }); }
    buildLine(ctx, [['Hauptabsperrventil? ', C.W], ['Heute suchen!', C.RED]], CX, 760, 84, t, T1 + 0.4, T2 - 0.2);
    const ap = pop(t, T2 + 0.1, 0.5);
    if (ap > 0) {
      const r = 170 * ap;
      ctx.save(); ctx.beginPath(); ctx.arc(CX, 420, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(avatar, CX - r, 420 - r, 2 * r, 2 * r); ctx.restore();
      [['valve', 690, 300, 55, 'oo'], ['wc', 1240, 270, 50, '^^'], ['siphon', 1280, 560, 50, 'oo'], ['tank', 640, 580, 42, '><']].forEach(([k, x, y, rr, e], i) =>
        station(ctx, t, k, x, y + bob(t, i), rr, exprAt(t, [e, '**', e, '--'], T2 + i * 0.49), { scale: pop(t, onBeat(T2 + 0.5 + i * 0.25)), hot: 0.5, level: 0.8 }));
      drop(ctx, t, 1180, 430, 40, '^^', { scale: pop(t, onBeat(T2 + 1.5)) });
      buildLine(ctx, [['Der Handwerksdoktor', C.W]], CX, 720, 80, t, T2 + 0.4);
      buildLine(ctx, [['[', C.P], ['@derhandwerksdoktor', C.GR], [']', C.P]], CX, 810, 48, t, T2 + 0.8, Infinity, 0.12);
    }
  },
};

// ---------- SFX-Cues ----------
function buildCues() {
  const cues = [], add = (t, type, gain) => cues.push({ t: +t.toFixed(3), type, gain });
  CH.forEach((c) => {
    if (c.title) { add(c.start, 'whoosh', 0.35); add(c.start + 0.05, 'pop', 0.35); add(c.scene, 'whoosh', 0.45); }
    add(c.end - 0.5, 'whoosh', 0.3);
  });
  add(0.35, 'whoosh', 0.5);
  const c0 = CH[0]; for (let i = 0; i < 5; i++) add(onBeat(Lt(c0, 1) + i * 0.25), 'pop', 0.4);
  const c1 = CH[1]; add(Lt(c1, 3) + 0.2, 'pop', 0.5);
  const c2 = CH[2]; add(Lt(c2, 1), 'pop', 0.5); add(Lt(c2, 2), 'pop', 0.5); add(inLine(c2, 3, 0.35), 'thump', 0.8); add(Le(c2, 3), 'click', 0.6); add(Lt(c2, 4), 'pop', 0.5); add(inLine(c2, 5, 0.3), 'thump', 0.5);
  const c3 = CH[3]; [0.05, 0.2, 0.35, 0.55, 0.75].forEach((f) => add(onBeat(inLine(c3, 0, f)), 'pop', 0.35));
  const c4 = CH[4]; add(Lt(c4, 4) + 0.3, 'pop', 0.5);
  const c5 = CH[5]; add(Lt(c5, 2), 'pop', 0.5); add(inLine(c5, 3, 0.1), 'click', 0.8); add(inLine(c5, 3, 0.15), 'whoosh', 0.6); add(Lt(c5, 4) + 0.3, 'pop', 0.5);
  const c7 = CH[7]; add(inLine(c7, 2, 0.35), 'thump', 0.5); add(inLine(c7, 2, 0.55), 'whoosh', 0.4);
  const c8 = CH[8]; add(Lt(c8, 1), 'whoosh', 0.5);
  const c9 = CH[9]; add(Lt(c9, 1) + 0.3, 'pop', 0.5); add(inLine(c9, 2, 0.4), 'click', 0.7);
  const c10 = CH[10]; for (let i = 0; i < 9; i++) add(inLine(c10, 0, (i + 0.5) / 9.5), 'pop', 0.3); add(Lt(c10, 1) + 0.1, 'thump', 0.7); add(Lt(c10, 2) + 0.1, 'thump', 0.8);
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

// Figuren auch für Thumbnails nutzbar; main() nur beim direkten Aufruf
export { face, drop, station, rrect, line, C, B as BEAT_TIMES };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
