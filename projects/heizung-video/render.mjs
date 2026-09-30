// Heizkörper-Video: „Heizkörper gluckert? SO entlüftest du ihn richtig!“ – 1920x1080, 60 fps, ca. 3:17.
// Gleiches Design wie projects/strom-video (refs/ref-03), dazu echte Fotos (photos/, freie Lizenzen): style_guide.md.
// Stil: style_guide.md (refs/ref-03), Skript und Bild: shotlist.md, Zeiten: sections.json + beats.json.
//
//   node projects/heizung-video/render.mjs --timeline        timeline.json + cues.json
//   node projects/heizung-video/render.mjs --contact         ein Frame pro Satz als Übersicht
//   node projects/heizung-video/render.mjs --still 12.5,40   einzelne Frames
//   node projects/heizung-video/render.mjs [--from s --to s] Video (stumm) nach out/video.mp4
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
const C = { bg: '#000000', G: '#e0e0e0', P: '#924ef6', O: '#ff741c', GR: '#03b84c', BL: '#006aff', D: '#262626', W: '#ffffff', WA: '#39a8ff', COLD: '#39a8ff', GAS: '#9a9a9a', RED: '#e8201c', Y: '#ffd400' };

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

// Hauptfigur „Luftblase“: weißer Ring mit durchsichtiger Füllung und Glanzpunkt, wabbelt auf dem Beat.
// o.trail zeichnet kleine Bläschen darunter (beim Aufsteigen).
function bubble(ctx, t, x, y, r, expr, o = {}) {
  const sc = o.scale ?? 1, a = o.a ?? 1;
  if (sc <= 0.001 || a <= 0.001) return;
  const kick = Math.exp(-sinceBeat(t) / 0.08), wob = Math.sin(t * 7 + x * 0.01) * 0.03;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
  if (o.trail) { ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.06; for (let k = 1; k <= 3; k++) { ctx.globalAlpha = a * (1 - k * 0.25); ctx.beginPath(); ctx.arc(Math.sin(t * 5 + k) * r * 0.2, r * (1.1 + k * 0.5), r * (0.28 - k * 0.06), 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = a; }
  ctx.scale(1 + 0.07 * kick + wob, 1 - 0.07 * kick - wob);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.09; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  if (expr) { ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.085; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; eye(ctx, expr[0], -r * 0.34, r * 0.05, r * 0.2, -0.12); eye(ctx, expr[1] ?? expr[0], r * 0.34, 0, r * 0.2, 0.1); }
  ctx.restore();
}

// Echte Fotos als Glas-Karte: Bild wird eingepasst (nicht beschnitten), darunter die Bildquelle.
const PHOTOS = {};
const CREDITS = {
  radiator: ['Radiator-250558_1280.jpg', 'Foto: ri · CC0 · Wikimedia Commons'],
  inside: ['Heizk_rper_innen.jpg', 'Foto: HTL-Mödchen23 · CC BY-SA 4.0 · Wikimedia Commons'],
  key: ['Entl_ftungsschl_ssel_01.jpg', 'Foto: Nicbou · CC0 · Wikimedia Commons'],
  thermo: ['247_Home_Rescue_radiator_thermostat.jpg', 'Foto: 247homerescue · CC0 · Wikimedia Commons'],
  screw: ['Radiator_bleedscrew.jpg', 'Foto: Noggo · gemeinfrei · Wikimedia Commons'],
  keyvalve: ['Radiator_sleutel.jpg', 'Foto: Sil10napel · CC BY-SA 4.0 · Wikimedia Commons'],
  gauge: ['A_pressure_gauge_attached_to_a_heating_system.jpg', 'Foto: Shixart1985 · CC BY 2.0 · Wikimedia Commons'],
};
function photoCard(ctx, t, name, cx, cy, w, h, t0, t1 = Infinity, rot = -0.03) {
  const img = PHOTOS[name]; if (!img) return;
  const p = pop(t, t0, 0.45) * (Number.isFinite(t1) ? 1 - easeIn(seg(t, t1 - 0.3, t1)) : 1);
  if (p <= 0.001) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * (2 - p)); ctx.scale(p, p);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.shadowBlur = 0;
  const s = Math.min(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.clip(); ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.stroke();
  ctx.font = '500 20px Inter'; ctx.fillStyle = '#9a9a9a'; ctx.textAlign = 'center'; ctx.fillText(CREDITS[name][1], 0, h / 2 + 34); ctx.textAlign = 'left';
  ctx.restore();
}

// Stations-Figuren fürs Heizen
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
    case 'radiator': { // Flach-Heizkörper: oben kalt (blau) je nach o.cold, unten warm
      const w = r * 2.2, h = r * 1.3, cold = o.cold ?? 0;
      ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r * 0.1); ctx.clip();
      ctx.fillStyle = C.O; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (cold > 0) { const g = ctx.createLinearGradient(0, -h / 2 + h * cold - r * 0.15, 0, -h / 2 + h * cold + r * 0.15); g.addColorStop(0, C.COLD); g.addColorStop(1, C.O); ctx.fillStyle = C.COLD; ctx.fillRect(-w / 2, -h / 2, w, h * cold - r * 0.15); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2 + h * cold - r * 0.15, w, r * 0.3); }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = r * 0.05;
      for (let k = 1; k < 10; k++) { const px = -w / 2 + (k * w) / 10; ctx.beginPath(); ctx.moveTo(px, -h / 2 + r * 0.12); ctx.lineTo(px, h / 2 - r * 0.12); ctx.stroke(); }
      ctx.restore();
      rrect(ctx, w / 2 - r * 0.05, -h / 2 + r * 0.05, r * 0.16, r * 0.16, r * 0.03, C.G); // Entlüftungsventil oben rechts
      rrect(ctx, -w / 2 - r * 0.2, -h / 2 + r * 0.02, r * 0.22, r * 0.3, r * 0.06, C.G); // Thermostat oben links
      eyesAt(ctx, expr, -r * 0.3, 0, r * 0.3, -r * 0.03, es, '#000');
      break;
    }
    case 'thermo': { // Thermostatkopf mit Stufe o.level (0–5)
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.04;
      for (let k = 0; k < 24; k++) { const an = (k / 24) * Math.PI * 2 + (o.level ?? 3) * 0.5; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r * 0.85, Math.sin(an) * r * 0.85); ctx.lineTo(Math.cos(an) * r * 0.97, Math.sin(an) * r * 0.97); ctx.stroke(); }
      ctx.fillStyle = C.RED; ctx.font = `800 ${r * 0.5}px Inter`; ctx.textAlign = 'center'; ctx.fillText(String(Math.round(o.level ?? 3)), 0, r * 0.62); ctx.textAlign = 'left';
      eyesAt(ctx, expr, -r * 0.3, -r * 0.2, r * 0.3, -r * 0.23, es, '#000');
      break;
    }
    case 'boiler': { // Heizkessel mit Flamme (o.on)
      rrect(ctx, -r * 0.8, -r, r * 1.6, r * 2, r * 0.14, C.G);
      rrect(ctx, -r * 0.45, r * 0.05, r * 0.9, r * 0.75, r * 0.08, '#000');
      if ((o.on ?? 1) > 0.02) { ctx.globalAlpha *= o.on ?? 1; ctx.fillStyle = C.O; ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.75);
        for (let k = 0; k <= 6; k++) { const px = -r * 0.3 + k * r * 0.1, py = r * (0.2 + (k % 2 ? 0.2 : 0)) - Math.sin(t * 18 + k) * r * 0.08; ctx.lineTo(px, py); }
        ctx.lineTo(r * 0.3, r * 0.75); ctx.closePath(); ctx.fill(); ctx.globalAlpha /= o.on ?? 1; }
      eyesAt(ctx, expr, -r * 0.3, -r * 0.5, r * 0.3, -r * 0.53, es, '#000');
      break;
    }
    case 'pump': { // Umwälzpumpe mit drehendem Laufrad (o.spin = Winkel)
      ctx.fillStyle = C.GR; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.rotate(o.spin ?? t * 6); ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.12;
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.3, r * 0.1, r * 0.6, -r * 0.1); ctx.stroke(); }
      ctx.restore();
      eyesAt(ctx, expr, -r * 0.35, -r * 0.55, r * 0.35, -r * 0.57, es * 0.7, '#000');
      break;
    }
    case 'valve': { // Entlüftungsventil: Sechskant mit Vierkant
      ctx.fillStyle = C.G; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; k ? ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r) : ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill();
      ctx.save(); ctx.rotate(o.spin ?? 0); rrect(ctx, -r * 0.3, -r * 0.3, r * 0.6, r * 0.6, r * 0.05, '#000'); ctx.restore();
      eyesAt(ctx, expr, -r * 0.55, -r * 0.6, r * 0.55, -r * 0.62, es * 0.7, '#000');
      break;
    }
    case 'key': { // Entlüftungsschlüssel: zwei Ohren + Hülse
      ctx.save(); ctx.rotate(o.spin ?? 0);
      ctx.fillStyle = C.P; ctx.strokeStyle = C.P; ctx.lineWidth = r * 0.22;
      for (const dx of [-0.45, 0.45]) { ctx.beginPath(); ctx.arc(dx * r, -r * 0.3, r * 0.34, 0, Math.PI * 2); ctx.stroke(); }
      rrect(ctx, -r * 0.2, -r * 0.35, r * 0.4, r * 1.2, r * 0.08, C.P);
      ctx.restore();
      eyesAt(ctx, expr, -r * 0.45, -r * 0.3, r * 0.45, -r * 0.32, es * 0.6, C.W);
      break;
    }
    case 'cup': { // Becher
      rrect(ctx, -r * 0.6, -r * 0.6, r * 1.2, r * 1.3, r * 0.14, C.BL);
      ctx.strokeStyle = C.BL; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(r * 0.68, 0, r * 0.28, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      eyesAt(ctx, expr, -r * 0.25, -r * 0.1, r * 0.25, -r * 0.13, es, '#000');
      break;
    }
    case 'rag': { // Lappen
      ctx.fillStyle = C.GR; ctx.beginPath(); ctx.moveTo(-r, -r * 0.3); ctx.quadraticCurveTo(0, -r * 0.55, r, -r * 0.3); ctx.lineTo(r * 0.9, r * 0.45); ctx.quadraticCurveTo(0, r * 0.2, -r * 0.9, r * 0.45); ctx.closePath(); ctx.fill();
      line(ctx, [[-r * 0.6, r * 0.05], [r * 0.6, r * 0.05]], 'rgba(0,0,0,0.3)', r * 0.05);
      eyesAt(ctx, expr, -r * 0.3, -r * 0.1, r * 0.3, -r * 0.13, es * 0.8, '#000');
      break;
    }
    case 'clock': { // Uhr, Zeiger laufen im Zeitraffer
      ctx.strokeStyle = C.W; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      const sp = o.spin ?? t; line(ctx, [[0, 0], [Math.cos(sp * 6 - 1.57) * r * 0.7, Math.sin(sp * 6 - 1.57) * r * 0.7]], C.O, r * 0.08); line(ctx, [[0, 0], [Math.cos(sp * 0.5 - 1.57) * r * 0.45, Math.sin(sp * 0.5 - 1.57) * r * 0.45]], C.W, r * 0.1);
      eyesAt(ctx, expr, -r * 0.35, r * 0.35, r * 0.35, r * 0.33, es * 0.6, C.W);
      break;
    }
    case 'mano': { // Manometer: grau (zu wenig) – grün – rot, Zeiger o.needle 0..1
      ctx.fillStyle = C.G; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = r * 0.14; const a0 = Math.PI * 0.85, span = Math.PI * 1.3;
      [[0, 0.3, '#8a8a8a'], [0.3, 0.7, C.GR], [0.7, 1, C.RED]].forEach(([f0, f1, col]) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, r * 0.78, a0 + span * f0, a0 + span * f1); ctx.stroke(); });
      const nd = a0 + span * (o.needle ?? 0.5);
      line(ctx, [[0, 0], [Math.cos(nd) * r * 0.66, Math.sin(nd) * r * 0.66]], '#000', r * 0.07);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.font = `800 ${r * 0.22}px Inter`; ctx.textAlign = 'center'; ctx.fillText('bar', 0, r * 0.6); ctx.textAlign = 'left';
      eyesAt(ctx, expr, -r * 0.28, -r * 0.35, r * 0.28, -r * 0.37, es * 0.7, '#000');
      break;
    }
    case 'calendar': {
      rrect(ctx, -r * 0.85, -r * 0.8, r * 1.7, r * 1.6, r * 0.12, C.G); rrect(ctx, -r * 0.85, -r * 0.8, r * 1.7, r * 0.45, r * 0.12, C.RED);
      ctx.fillStyle = C.W; ctx.font = `800 ${r * 0.32}px Inter`; ctx.textAlign = 'center'; ctx.fillText(o.text ?? 'OKT', 0, -r * 0.47); ctx.textAlign = 'left';
      eyesAt(ctx, expr, -r * 0.3, r * 0.2, r * 0.3, r * 0.17, es, '#000');
      break;
    }
    case 'wrench': { // Heizungsbauer: Schraubenschlüssel
      ctx.save(); ctx.rotate(-0.6); rrect(ctx, -r * 0.18, -r * 0.2, r * 0.36, r * 1.3, r * 0.1, C.O);
      ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(0, -r * 0.45, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillRect(-r * 0.16, -r * 1.0, r * 0.32, r * 0.45); ctx.restore();
      eyesAt(ctx, expr, -r * 0.15, -r * 0.2, r * 0.2, -r * 0.35, es * 0.7, '#000');
      break;
    }
    case 'warn': { // Warndreieck
      ctx.fillStyle = C.Y; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 1.05, r * 0.75); ctx.lineTo(-r * 1.05, r * 0.75); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000'; ctx.font = `800 ${r * 0.9}px Inter`; ctx.textAlign = 'center'; ctx.fillText('!', 0, r * 0.6); ctx.textAlign = 'left';
      break;
    }
    case 'block': { // Mietshaus
      rrect(ctx, -r * 0.7, -r, r * 1.4, r * 2, r * 0.08, C.BL);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) ctx.fillRect(-r * 0.5 + i * r * 0.38, -r * 0.8 + j * r * 0.42, r * 0.22, r * 0.24);
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
function check(ctx, x, y, s, p) { if (p <= 0) return; line(ctx, [[x - s * 0.5, y], [x - s * 0.1, y + s * 0.4], [x + s * 0.6, y - s * 0.45]], C.GR, s * 0.22, 1, p); }
function puff(ctx, t, x, y, t0, dir = 1) { // Zisch-Wölkchen
  const k = seg(t, t0, t0 + 1.2); if (k <= 0 || k >= 1) return;
  for (let i = 0; i < 6; i++) { const f = fract(k + i / 6); ctx.globalAlpha = (1 - f) * 0.8; ctx.fillStyle = C.GAS; ctx.beginPath(); ctx.arc(x + dir * f * 160, y - f * 60 + Math.sin(i * 2 + t * 6) * 10, 8 + f * 14, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
}

const SCENES = {
  0(ctx, t, c) { // Intro
    const T1 = Lt(c, 1), sh = easeInOut(seg(t, T1, T1 + 0.6)), gather = easeIn(seg(t, inLine(c, 1, 0.55), inLine(c, 1, 0.75)));
    const zoom = lerp(8, 1, easeOut(seg(t, 0.3, 1.9)));
    ctx.save(); ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-CX, -CY + 30 * (1 - 1 / zoom));
    ctx.translate(CX, CY); ctx.scale(1 - gather, 1 - gather); ctx.translate(-CX, -CY);
    ctx.translate(lerp(0, -380, sh), 0);
    station(ctx, t, 'radiator', CX, 640, 260, exprAt(t, ['--', 'oo', '><', 'oo'], 1.5), { cold: 0.42, scale: easeOut(seg(t, 1.2, 1.8)) });
    bubble(ctx, t, CX, CY - 60 + bob(t, 0), 150, exprAt(t, ['><', '^^', '><', 'oo'], 0.4), {});
    ctx.restore();
    photoCard(ctx, t, 'radiator', 1380, 460, 620, 412, T1 + 0.3, inLine(c, 1, 0.7), 0.04);
    buildLine(ctx, [['Heizkörper ', C.W], ['entlüften.', C.O]], CX, CY + 45, 140, t, inLine(c, 1, 0.72), c.end - 0.5);
  },

  1(ctx, t, c) { // Warum Luft?
    const [T1, T2, T3] = [1, 2, 3].map((i) => Lt(c, i));
    const collect = easeInOut(seg(t, T2 + 0.3, Le(c, 2)));
    withCamera(ctx, t, c, [420, 560], () => {
      const loop = [[520, 470], [1100, 470], [1100, 700], [520, 700]];
      line(ctx, [...loop, loop[0]], C.D, 20);
      flow(ctx, [...loop, loop[0]], t, { n: 18, r: 8, col: C.O, speed: 240 });
      station(ctx, t, 'boiler', 420, 585, 130, exprAt(t, ['oo', '^^'], c.scene, 2), { on: 1 });
      station(ctx, t, 'radiator', 1350, 585, 190, collect > 0.6 ? '><' : 'oo', { cold: 0.4 * collect });
      if (t > T1) for (let k = 0; k < 5; k++) { // Luftblasen im Kreislauf, später oben im Heizkörper
        const p = pop(t, onBeat(T1 + 0.3 + k * 0.25)); if (p <= 0) continue;
        const f = fract(k / 5 + (t - T1) * 0.15), L = polyLen([...loop, loop[0]]), [fx, fy] = polyAt([...loop, loop[0]], L, f * L.at(-1));
        const tx = 1170 + k * 45, ty = 470 + (k % 2) * 30;
        bubble(ctx, t, lerp(fx, tx, collect), lerp(fy, ty, collect), 22, null, { scale: p });
      }
      if (t > T3) for (let k = 0; k < 3; k++) { const s = sinceBeat(t); if (s < 0.2 && (beatIndex(t) + k) % 3 === 0) label(ctx, 'gluck', 1350 + (k - 1) * 150, 380 - s * 80, 38, 1 - s * 5, C.W); }
    });
    photoCard(ctx, t, 'inside', 1500, 230, 380, 253, T2 + 0.5, T3, 0.05);
    buildLine(ctx, [['Heizkosten ', C.W], ['[bis zu −15 %]', C.GR]], CX, 940, 76, t, inLine(c, 3, 0.55), c.end - 0.5);
    label(ctx, 'laut ADAC', CX, 1000, 30, seg(t, inLine(c, 3, 0.65), inLine(c, 3, 0.8)) * (1 - seg(t, c.end - 0.6, c.end - 0.3)), '#9a9a9a');
  },

  2(ctx, t, c) { // Werkzeug
    const [T1, T2] = [1, 2].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [CX, CY], () => {
      [[480, 'key'], [CX, 'cup'], [1440, 'rag']].forEach(([x, k], i) => {
        const p = pop(t, onBeat(c.scene + 0.2 + i * 0.25));
        const show = k === 'key' ? T1 + 0.2 : T2 + 0.2 + (i - 1) * 0.5;
        if (t < show) { ctx.globalAlpha = 0.25 * p; ctx.fillStyle = C.W; ctx.beginPath(); ctx.arc(x, 620, 90 * p, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; label(ctx, String(i + 1), x, 645, 70, p, '#000'); }
        else station(ctx, t, k, x, 620, k === 'key' ? 110 : 100, exprAt(t, ['oo', '^^'], show), { scale: pop(t, show) });
      });
      label(ctx, 'Entlüftungsschlüssel', 480, 820, 40, seg(t, T1 + 0.3, T1 + 0.6)); label(ctx, 'Becher', CX, 820, 40, seg(t, T2 + 0.3, T2 + 0.6)); label(ctx, 'Lappen', 1440, 820, 40, seg(t, T2 + 0.8, T2 + 1.1));
    });
    photoCard(ctx, t, 'key', 480, 300, 380, 277, T1 + 0.5, c.end - 0.3, -0.04);
    buildLine(ctx, [['[ca. 1–2 €]', C.GR]], 800, 330, 56, t, inLine(c, 1, 0.5), c.end - 0.5, 0.18, 'left');
  },

  3(ctx, t, c) { // Vorbereitung
    const [T1, T2, T3] = [1, 2, 3].map((i) => Lt(c, i));
    const a0 = fadeWin(t, c.scene, T1 + 0.1), a1 = fadeWin(t, T1, T2 + 0.1), a2 = fadeWin(t, T2, T3 + 0.1), a3 = easeOut(seg(t, T3, T3 + 0.4));
    withCamera(ctx, t, c, [1300, 560], () => {
      if (a0 > 0) { const lv = lerp(3, 5, easeInOut(seg(t, Lt(c, 0) + 0.8, Lt(c, 0) + 1.8))); station(ctx, t, 'thermo', 1300, 560, 170, lv > 4.9 ? '^^' : 'oo', { level: lv, a: a0 }); label(ctx, 'Stufe 5', 1300, 820, 48, a0 * seg(t, Lt(c, 0) + 1.8, Lt(c, 0) + 2.2)); }
    });
    photoCard(ctx, t, 'thermo', 560, 520, 620, 349, c.scene + 0.3, T1, -0.03);
    if (a1 > 0) {
      const off = easeInOut(seg(t, T1 + 0.5, inLine(c, 1, 0.55)));
      station(ctx, t, 'boiler', 700, 560, 170, off > 0.9 ? '--' : 'oo', { on: 1 - off, a: a1 });
      station(ctx, t, 'pump', 1200, 580, 120, off > 0.9 ? '--' : '><', { spin: T1 * 6 + (t - T1) * 6 * (1 - off * 0.95) - off * off * 2, a: a1 });
      label(ctx, off > 0.9 ? 'Heizung aus' : 'Heizung', 700, 820, 44, a1); label(ctx, off > 0.9 ? 'Pumpe steht' : 'Umwälzpumpe', 1200, 780, 44, a1);
    }
    if (a2 > 0) {
      const rise = easeInOut(seg(t, T2 + 0.3, Le(c, 2)));
      station(ctx, t, 'clock', 520, 520, 130, 'oo', { spin: (t - T2) * 3, a: a2 });
      station(ctx, t, 'radiator', 1250, 560, 200, 'oo', { cold: 0.35 * rise, a: a2 });
      for (let k = 0; k < 5; k++) bubble(ctx, t, 1060 + k * 95, lerp(680, 460, rise) + Math.sin(k * 3) * 30 * (1 - rise), 20, null, { a: a2, trail: rise < 0.9 });
      buildLine(ctx, [['Warten ', C.W], ['[30–60 min]', C.O]], 520, 800, 64, t, T2 + 0.4, T3 - 0.1);
    }
    if (a3 > 0) {
      station(ctx, t, 'block', 640, 560, 170, null, { scale: pop(t, T3 + 0.2) });
      const lv = t > inLine(c, 3, 0.6) ? lerp(3, 0, easeInOut(seg(t, inLine(c, 3, 0.6), inLine(c, 3, 0.8)))) : 3;
      station(ctx, t, 'thermo', 1250, 560, 150, lv < 0.1 ? '--' : 'oo', { level: lv, scale: pop(t, T3 + 0.5) });
      label(ctx, 'Mietwohnung', 640, 820, 44, a3); label(ctx, 'Thermostate zu', 1250, 820, 44, seg(t, inLine(c, 3, 0.6), inLine(c, 3, 0.8)));
    }
  },

  4(ctx, t, c) { // Entlüften
    const [T1, T2, T3, T4, T5] = [1, 2, 3, 4, 5].map((i) => Lt(c, i));
    const VX = 1175, VY = 505; // Ventil in der Nahaufnahme (rechte obere Ecke des Heizkörpers)
    photoCard(ctx, t, 'screw', 560, 520, 700, 473, c.scene + 0.2, T1 + 0.1, -0.03);
    if (t < T1 + 0.1) { const p = pop(t, c.scene + 0.9); if (p > 0) { line(ctx, [[1350, 300], [1150, 380], [960, 440]], C.O, 12, p, p); label(ctx, 'Entlüftungsventil', 1360, 280, 48, p, C.O, 'left'); } }
    const a = easeOut(seg(t, T1, T1 + 0.4));
    if (a > 0) {
      ctx.globalAlpha = a;
      station(ctx, t, 'radiator', 560, 800, 520, null, { cold: t > inLine(c, 4, 0.3) ? 0 : 0.3, a });
      rrect(ctx, 1120, VY - 22, 40, 44, 8, C.G);
      station(ctx, t, 'valve', VX, VY, 62, null, { a });
      ctx.globalAlpha = 1;
      station(ctx, t, 'cup', VX + 10, 660, 70, exprAt(t, ['oo', '^^'], T1), { scale: pop(t, inLine(c, 1, 0.5)) });
      station(ctx, t, 'rag', VX + 10, 840, 120, 'oo', { scale: pop(t, T1 + 0.3) });
      const turn = t < T2 ? 0 : t < T4 ? easeInOut(seg(t, inLine(c, 2, 0.4), inLine(c, 2, 0.8))) : 1 - easeInOut(seg(t, inLine(c, 4, 0.55), inLine(c, 4, 0.8)));
      if (t > T2) {
        station(ctx, t, 'key', VX + 190, VY - 10, 110, turn > 0.5 ? '><' : 'oo', { scale: pop(t, T2 + 0.2), spin: -turn * Math.PI * 0.75 });
        ctx.strokeStyle = C.O; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(VX + 190, VY - 10, 185, -0.3, -0.3 - 1.8 * seg(t, inLine(c, 2, 0.4), inLine(c, 2, 0.8)), true); ctx.stroke();
      }
      // Die Luftblase sitzt oben im Heizkörper und entkommt mit Zisch
      const esc = seg(t, T3 + 0.1, T3 + 0.9);
      if (t < T3 + 0.9) bubble(ctx, t, lerp(1000, VX + 60, esc), lerp(560, VY - 150, esc), 80 * (1 - esc * 0.6), t > T3 ? 'xx' : exprAt(t, ['><', '^^'], T1), { a: 1 - seg(esc, 0.7, 1) });
      puff(ctx, t, VX + 40, VY - 30, T3 + 0.2, 1);
      if (t > T3 && t < Le(c, 3) + 0.5) buildLine(ctx, [['Zisch!', C.W]], VX + 120, 250, 96, t, T3 + 0.2, Le(c, 3) + 0.2);
      if (t > T4 && t < inLine(c, 4, 0.7)) for (let k = 0; k < 5; k++) { const f = fract(k / 5 + t * 1.6); ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(VX + Math.sin(k) * 6, lerp(VY + 50, 620, f), 9, 0, Math.PI * 2); ctx.fill(); }
    }
    buildLine(ctx, [['[¼ bis ½ Drehung]', C.O]], 520, 250, 72, t, inLine(c, 2, 0.5), T3);
    buildLine(ctx, [['Nur noch Wasser? ', C.W], ['[zu]', C.GR]], 520, 250, 64, t, inLine(c, 4, 0.4), T5 - 0.1);
    const w = easeOut(seg(t, T5, T5 + 0.4));
    if (w > 0) {
      station(ctx, t, 'warn', 400, 250, 80, null, { scale: pop(t, T5) });
      buildLine(ctx, [['heiß ', C.O], ['& schmutzig', C.W]], 520, 280, 60, t, T5 + 0.2, c.end - 0.5, 0.18, 'left');
      photoCard(ctx, t, 'keyvalve', 1640, 330, 420, 315, T5 + 0.4, c.end - 0.2, 0.04);
      label(ctx, 'So sieht es echt aus', 1640, 150, 34, w * (1 - seg(t, c.end - 0.5, c.end - 0.2)), '#9a9a9a');
    }
  },

  5(ctx, t, c) { // Reihenfolge
    const [T1] = [1].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [CX, 560], () => {
      line(ctx, [[560, 960], [560, 300], [CX, 120], [1360, 300], [1360, 960], [560, 960]], C.W, 10);
      line(ctx, [[560, 740], [1360, 740]], C.W, 6); line(ctx, [[560, 520], [1360, 520]], C.W, 6);
      [0, 1, 2].forEach((fl) => {
        const y = 880 - fl * 220, done = inLine(c, fl === 0 ? 0 : 1, fl === 0 ? 0.55 : fl === 1 ? 0.2 : 0.65);
        station(ctx, t, 'radiator', CX, y, 70, t > done ? '^^' : 'oo', { cold: t > done ? 0 : 0.35 });
        if (t < done + 0.8) bubble(ctx, t, CX + 50, y - 50 - (t > done ? seg(t, done, done + 0.8) * 100 : 0), 18, null, { a: 1 - seg(t, done, done + 0.8) });
        check(ctx, 1210, y - 10, 70, easeOut(seg(t, done, done + 0.3)));
        label(ctx, ['Erdgeschoss', '1. Stock', '2. Stock'][fl], 620, y + 10, 32, 1, '#9a9a9a', 'left');
      });
      const up = easeOut(seg(t, Lt(c, 0) + 0.4, Lt(c, 0) + 1.2));
      if (up > 0) { line(ctx, [[1500, 900], [1500, 900 - 600 * up]], C.O, 14, 1); if (up > 0.95) line(ctx, [[1470, 330], [1500, 295], [1530, 330]], C.O, 14); label(ctx, 'unten anfangen', 1540, 880, 40, up, C.O, 'left'); }
    });
  },

  6(ctx, t, c) { // Druck prüfen
    const [T1, T2] = [1, 2].map((i) => Lt(c, i));
    photoCard(ctx, t, 'gauge', 520, 520, 400, 600, c.scene + 0.2, c.end - 0.2, -0.03);
    withCamera(ctx, t, c, [1300, 540], () => {
      const drop = t < T1 ? 0.55 - 0.25 * easeInOut(seg(t, Lt(c, 0) + 0.8, Le(c, 0))) : t < T2 ? lerp(0.3, 0.5, easeInOut(seg(t, T1, T1 + 1))) : t < inLine(c, 2, 0.5) ? lerp(0.5, 0.15, easeInOut(seg(t, T2, T2 + 0.8))) : lerp(0.15, 0.5, easeInOut(seg(t, inLine(c, 2, 0.5), inLine(c, 2, 0.8))));
      station(ctx, t, 'mano', 1300, 520, 230, drop < 0.3 ? '><' : '^^', { needle: drop });
    });
    buildLine(ctx, [['Druck ', C.W], ['[meist 1,2–2 bar]', C.GR]], 1300, 880, 64, t, inLine(c, 1, 0.4), T2 - 0.1);
    buildLine(ctx, [['zu niedrig? ', C.W], ['[nachfüllen]', C.O]], 1300, 880, 64, t, inLine(c, 2, 0.3), c.end - 0.5);
  },

  7(ctx, t, c) { // Heizung an
    const [T1] = [1].map((i) => Lt(c, i));
    withCamera(ctx, t, c, [500, 560], () => {
      const on = easeInOut(seg(t, Lt(c, 0) + 0.3, Lt(c, 0) + 1.2));
      station(ctx, t, 'boiler', 420, 560, 150, on > 0.5 ? '^^' : '--', { on });
      station(ctx, t, 'pump', 420, 830, 70, 'oo', { spin: t * 6 * on });
      const lv = lerp(5, 3, easeInOut(seg(t, inLine(c, 0, 0.5), inLine(c, 0, 0.8))));
      station(ctx, t, 'thermo', 820, 380, 80, 'oo', { level: lv });
      const warm = easeInOut(seg(t, T1, Le(c, 1)));
      station(ctx, t, 'radiator', 1300, 600, 250, warm > 0.8 ? '^^' : 'oo', { cold: 0.35 * (1 - warm) });
      const loop = [[570, 560], [1020, 560]]; line(ctx, loop, C.D, 18, on); flow(ctx, loop, t, { n: 6, r: 8, col: C.O, a: on });
      if (warm > 0.8) { check(ctx, 1300, 330, 110, easeOut(seg(warm, 0.8, 1))); label(ctx, 'oben warm', 1300, 1000, 48, seg(warm, 0.8, 1), C.O); }
    });
  },

  8(ctx, t, c) { // Wann & Fachmann
    const [T1] = [1].map((i) => Lt(c, i));
    const a0 = fadeWin(t, c.scene, T1 + 0.1);
    withCamera(ctx, t, c, [CX, 520], () => {
      if (a0 > 0) { station(ctx, t, 'calendar', 760, 520, 150, 'oo', { text: 'OKT', a: a0 }); station(ctx, t, 'calendar', 1160, 520, 150, '^^', { text: 'NOV', a: a0, scale: pop(t, Lt(c, 0) + 1.2) }); }
    });
    buildLine(ctx, [['vor der ', C.W], ['[Heizperiode]', C.O]], CX, 820, 70, t, Lt(c, 0) + 0.8, T1 - 0.1);
    if (t > T1) {
      const items = [['bubble', 'gluckert immer wieder', 0.15], ['mano', 'Druck fällt ständig', 0.35], ['drip', 'Ventil tropft', 0.55]];
      items.forEach(([k, n, f], i) => {
        const x = 330 + i * 380, p = pop(t, onBeat(inLine(c, 1, f)));
        if (k === 'bubble') bubble(ctx, t, x, 480, 100, '><', { scale: p });
        else if (k === 'mano') station(ctx, t, 'mano', x, 480, 115, '><', { scale: p, needle: 0.1 });
        else { station(ctx, t, 'valve', x, 460, 85, '><', { scale: p }); if (p > 0.5) { const f2 = fract(t * 1.4); ctx.fillStyle = C.O; ctx.beginPath(); ctx.arc(x, 560 + f2 * 90, 11, 0, Math.PI * 2); ctx.fill(); } }
        label(ctx, n, x, 690, 40, Math.min(1, p));
      });
      const wp = pop(t, onBeat(inLine(c, 1, 0.75)));
      station(ctx, t, 'wrench', 1560, 470, 150, '^^', { scale: wp }); label(ctx, 'Heizungsbauer', 1560, 720, 48, Math.min(1, wp), C.O);
    }
  },

  9(ctx, t, c, avatar) { // Checkliste + Outro
    const [T0, T1] = [0, 1].map((i) => Lt(c, i));
    const items = [['thermo', 'Thermostate auf', { level: 5 }], ['boiler', 'Heizung aus', { on: 0 }], ['clock', 'warten', {}], ['radiator', 'unten anfangen', { cold: 0.3 }], ['key', 'Ventil auf', {}], ['cup', 'bei Wasser zu', {}], ['mano', 'Druck prüfen', { needle: 0.5 }], ['boiler', 'Heizung an', { on: 1 }]];
    const gather = easeIn(seg(t, T1 - 0.4, T1 + 0.1));
    withCamera(ctx, t, c, [CX, CY], () => {
      items.forEach(([k, n, o], i) => {
        const x = 190 + i * 220, f = (i + 0.6) / 8.6, done = inLine(c, 0, f), p = pop(t, onBeat(c.scene + i * 0.245)) * (1 - gather);
        const r = { radiator: 40, key: 50, boiler: 45, clock: 50, cup: 50, mano: 55, thermo: 55 }[k];
        station(ctx, t, k, lerp(x, CX, gather), CY - 20, r, t > done ? '^^' : 'oo', { ...o, scale: p });
        check(ctx, x, CY + 80, 50, easeOut(seg(t, done, done + 0.25)) * (1 - gather));
        buildText(ctx, n, x - textModel(n, 28).w / 2, CY + 170 + (i % 2) * 44, 28, C.W, t, done - 0.1, T1 - 0.4);
      });
    });
    const ap = pop(t, T1 + 0.1, 0.5);
    if (ap > 0) {
      const r = 170 * ap;
      ctx.save(); ctx.beginPath(); ctx.arc(CX, 420, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(avatar, CX - r, 420 - r, 2 * r, 2 * r); ctx.restore();
      [['radiator', 690, 300, 40, 'oo'], ['key', 1240, 270, 50, '^^'], ['mano', 1280, 560, 50, 'oo'], ['thermo', 640, 580, 45, '><']].forEach(([k, x, y, rr, e], i) =>
        station(ctx, t, k, x, y + bob(t, i), rr, exprAt(t, [e, '**', e, '--'], T1 + i * 0.49), { scale: pop(t, onBeat(T1 + 0.5 + i * 0.25)), level: 5, needle: 0.5 }));
      bubble(ctx, t, 1180, 430, 34, '^^', { scale: pop(t, onBeat(T1 + 1.5)) });
      buildLine(ctx, [['Der Handwerksdoktor', C.W]], CX, 720, 80, t, T1 + 0.4);
      buildLine(ctx, [['[', C.P], ['@derhandwerksdoktor', C.GR], [']', C.P]], CX, 810, 48, t, T1 + 0.8, Infinity, 0.12);
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
  for (let t = 0.8; t < 3.2; t += 0.49) add(onBeat(t), 'gluck', 0.5);
  const c1 = CH[1]; for (let i = 0; i < 5; i++) add(onBeat(Lt(c1, 1) + 0.3 + i * 0.25), 'gluck', 0.35); for (let t = Lt(c1, 3); t < Lt(c1, 3) + 2; t += 0.49) add(onBeat(t), 'gluck', 0.3);
  const c2 = CH[2]; add(Lt(c2, 1) + 0.2, 'pop', 0.5); add(Lt(c2, 2) + 0.2, 'pop', 0.5); add(Lt(c2, 2) + 0.7, 'pop', 0.5);
  const c3 = CH[3]; add(Lt(c3, 0) + 1.8, 'click', 0.7); add(inLine(c3, 1, 0.55), 'thump', 0.5); add(inLine(c3, 3, 0.8), 'click', 0.7);
  const c4 = CH[4]; add(Lt(c4, 2) + 0.2, 'pop', 0.5); add(inLine(c4, 2, 0.45), 'click', 0.8); add(Lt(c4, 3) + 0.15, 'hiss', 1.0); add(inLine(c4, 4, 0.6), 'click', 0.8); add(Lt(c4, 5), 'thump', 0.5);
  const c5 = CH[5]; [inLine(c5, 0, 0.55), inLine(c5, 1, 0.2), inLine(c5, 1, 0.65)].forEach((t) => { add(t, 'hiss', 0.5); add(t + 0.1, 'pop', 0.4); });
  const c6 = CH[6]; add(Lt(c6, 2) + 0.4, 'thump', 0.5);
  const c7 = CH[7]; add(Lt(c7, 0) + 0.4, 'whoosh', 0.5);
  const c9 = CH[9]; for (let i = 0; i < 8; i++) add(inLine(c9, 0, (i + 0.6) / 8.6), 'click', 0.5); add(Lt(c9, 1) + 0.1, 'thump', 0.8);
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
  for (const [k, [file]] of Object.entries(CREDITS)) PHOTOS[k] = await loadImage(path.join(DIR, 'photos', file));
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
export { face, bubble, station, rrect, line, C, B as BEAT_TIMES, PHOTOS };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
