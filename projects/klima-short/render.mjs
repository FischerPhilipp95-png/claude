// Klima-Short: „Wie funktioniert eine Klimaanlage?“ – 1080x1920, 60 fps, 20 s.
// Stil: docs/style_guide.md (Referenz refs/ref-01), Ablauf: docs/shotlist.md.
//
//   node projects/klima-short/render.mjs --timeline       nur timeline.json + cues.json schreiben
//   node projects/klima-short/render.mjs --contact        Contact Sheet (ein Frame pro Abschnitt)
//   node projects/klima-short/render.mjs --still 5.5,12   einzelne Frames als PNG
//   node projects/klima-short/render.mjs                  ganzes Video (stumm) nach out/video.mp4
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
const C = {
  bg: '#f6f6f1', ink: '#111111', guide: '#9fa09c', grid: '#e4e3e1',
  warm: '#e8410f', cold: '#1a7fd1', violet: '#6f66cf', select: '#c6dbe9',
};

// ---------- Mathe-Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const backOut = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`;
};
function rand(seed) { // deterministisch, damit jeder Render identisch ist
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Timeline, auf beats.json eingerastet ----------
const beats = JSON.parse(fs.readFileSync(path.join(DIR, 'beats.json'), 'utf8'));
const vo = JSON.parse(fs.readFileSync(path.join(DIR, 'audio/vo/durations.json'), 'utf8'));
const snap = (t, list) => list.reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best), list[0]);
const onBeat = (t) => snap(t, beats.beats);        // Zustandswechsel
const onDown = (t) => snap(t, beats.downbeats);    // große Momente
const onHit = (t) => snap(t, beats.hits);          // SFX

const T = {
  type1: 0.1,              // „Eine Klimaanlage macht Kälte.“
  select: onBeat(1.5),     // markieren
  type2: onDown(2.0),      // „/wärme nach draußen“
  room: onBeat(3.0),       // Cursor -> Punkt -> Zimmer
  loop: onDown(4.0),       // Kreislauf + Schritt 1 Verdampfer
  step2: onBeat(7.0),      // Kompressor
  step3: onDown(10.0),     // Kondensator
  step4: onDown(12.0),     // Expansionsventil
  run: onBeat(15.0),       // alles läuft
  collapse: onBeat(16.5),  // Kollaps zum Punkt
  ring: onBeat(17.5),      // Punkt -> Kreis
  end: onDown(18.0),       // Schlussbild (Thump)
};
const CHAR = 0.042; // Sekunden pro getipptem Zeichen
const TEXT1 = 'Eine Klimaanlage macht Kälte.';
const TEXT2 = '/wärme nach draußen';
const NAME = 'Der Handwerksdoktor';
const HANDLE = '@derhandwerksdoktor';
const NAME_T = T.end + 0.1;

// Voiceover: jeder Satz startet kurz nach seinem Abschnitt
const VO = [
  ['vo1', 0.15], ['vo2', T.type2 + 0.1], ['vo3', T.loop + 0.1], ['vo4', T.step2 + 0.1],
  ['vo5', T.step3 + 0.1], ['vo6', T.step4 + 0.1], ['vo7', T.run + 0.1], ['vo8', T.end + 0.25],
].map(([id, t]) => ({ id, t: +t.toFixed(3), dur: vo[id] }));

const LABELS = [
  [T.loop, T.step2, '1 · Verdampfer nimmt Wärme auf'],
  [T.step2, T.step3, '2 · Kompressor: Druck rauf, heiß'],
  [T.step3, T.step4, '3 · Kondensator gibt Wärme ab'],
  [T.step4, T.run, '4 · Ventil: Druck runter, kalt'],
  [T.run, T.collapse + 0.3, '…und wieder von vorn'],
  [T.end + 0.5, DUR + 1, 'Folgen für mehr'],
];

// ---------- Layout ----------
const ROOM = { x: 96, y: 640, w: 424, h: 620 };
const OUT = { x: 560, y: 640, w: 424, h: 620 };
const LOOP = { x0: 250, y0: 760, x1: 830, y1: 1140, r: 60 };
const MID = (LOOP.y0 + LOOP.y1) / 2;
const CENTER = { x: 540, y: MID };
const LABEL_Y = 1390;
const LW = 3; // Linienstärke fürs Handy

// Kreislauf als Polylinie, im Uhrzeigersinn ab unten links nach oben
const loopPts = (() => {
  const { x0, y0, x1, y1, r } = LOOP, pts = [];
  const line = (ax, ay, bx, by, n) => { for (let i = 0; i < n; i++) pts.push([lerp(ax, bx, i / n), lerp(ay, by, i / n)]); };
  const arc = (cx, cy, a0, a1, n) => { for (let i = 0; i < n; i++) { const a = lerp(a0, a1, i / n); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  line(x0, y1 - r, x0, y0 + r, 300); arc(x0 + r, y0 + r, Math.PI, 1.5 * Math.PI, 60);
  line(x0 + r, y0, x1 - r, y0, 600); arc(x1 - r, y0 + r, 1.5 * Math.PI, 2 * Math.PI, 60);
  line(x1, y0 + r, x1, y1 - r, 300); arc(x1 - r, y1 - r, 0, 0.5 * Math.PI, 60);
  line(x1 - r, y1, x0 + r, y1, 600); arc(x0 + r, y1 - r, 0.5 * Math.PI, Math.PI, 60);
  const len = [0];
  for (let i = 1; i <= pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i % pts.length]];
    len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, len, total: len[len.length - 1] };
})();
function loopAt(u) {
  u = ((u % 1) + 1) % 1;
  const d = u * loopPts.total, { len, pts } = loopPts;
  let lo = 0, hi = len.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= d) lo = m; else hi = m; }
  const a = pts[lo], b = pts[(lo + 1) % pts.length], f = (d - len[lo]) / (len[lo + 1] - len[lo] || 1);
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
}
const uOf = (x, y) => {
  let best = 0, bd = Infinity;
  loopPts.pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } });
  return loopPts.len[best] / loopPts.total;
};
const U = {
  evapA: uOf(LOOP.x0, MID + 100), evapB: uOf(LOOP.x0, MID - 100), comp: uOf(700, LOOP.y0),
  condA: uOf(LOOP.x1, MID - 100), condB: uOf(LOOP.x1, MID + 100), valve: uOf(700, LOOP.y1),
};
const ST = {
  evap: { x: LOOP.x0, y: MID }, comp: { x: 700, y: LOOP.y0 },
  cond: { x: LOOP.x1, y: MID }, valve: { x: 700, y: LOOP.y1 },
};

// Geschwindigkeit entlang des Kreislaufs: Flüssigkeit langsam (dicht), Gas schnell (locker),
// am Kompressor staut es sich. Partikel sind zeitlich gleich verteilt -> Dichte ~ 1/Geschwindigkeit.
function speedAt(u) {
  const between = (a, b) => (a <= b ? u >= a && u < b : u >= a || u < b);
  const f = (a, b) => ((u - a + 1) % 1) / ((b - a + 1) % 1);
  let v;
  if (between(U.evapA, U.evapB)) v = lerp(0.55, 1.5, f(U.evapA, U.evapB));
  else if (between(U.evapB, U.comp)) v = 1.5;
  else if (between(U.comp, U.condA)) v = 1.05;
  else if (between(U.condA, U.condB)) v = lerp(1.05, 0.55, f(U.condA, U.condB));
  else v = 0.55;
  const dc = Math.min(Math.abs(u - U.comp), 1 - Math.abs(u - U.comp));
  return v * (1 - 0.65 * Math.exp(-((dc / 0.018) ** 2)));
}
const CYCLE = 6.0; // Sekunden pro Umlauf
const travel = (() => { // kumulierte Laufzeit über u
  const n = 4000, tau = [0];
  for (let i = 1; i <= n; i++) tau.push(tau[i - 1] + 1 / speedAt((i - 0.5) / n));
  return { n, tau: tau.map((x) => x / tau[n]) };
})();
function uFromPhase(p) {
  p = ((p % 1) + 1) % 1;
  const { tau, n } = travel;
  let lo = 0, hi = n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tau[m] <= p) lo = m; else hi = m; }
  return (lo + (p - tau[lo]) / (tau[lo + 1] - tau[lo] || 1)) / n;
}
function phaseFromU(u) { return travel.tau[Math.round(clamp(u) * travel.n)]; }

// Zustand des Kältemittels je Position
function refrigerant(u) {
  const between = (a, b) => (a <= b ? u >= a && u < b : u >= a || u < b);
  const f = (a, b) => ((u - a + 1) % 1) / ((b - a + 1) % 1);
  if (between(U.evapA, U.evapB)) { const k = f(U.evapA, U.evapB); return { col: C.cold, gas: k, r: lerp(9, 11, k), jit: k }; }
  if (between(U.evapB, U.comp)) return { col: C.cold, gas: 1, r: 11, jit: 1 };
  if (between(U.comp, U.condA)) { const k = f(U.comp, U.condA); return { col: mix(C.cold, C.warm, Math.min(1, k * 5)), gas: 1 - Math.min(1, k * 5), r: 11, jit: 0.6 }; }
  if (between(U.condA, U.condB)) { const k = f(U.condA, U.condB); return { col: mix(C.warm, C.ink, k), gas: 0, r: lerp(11, 9, k), jit: 0.3 * (1 - k) }; }
  if (between(U.condB, U.valve)) return { col: C.ink, gas: 0, r: 9, jit: 0 };
  const k = Math.min(1, f(U.valve, U.evapA) * 6);
  return { col: mix(C.ink, C.cold, k), gas: 0, r: 9, jit: 0 };
}

// Raumluft-Partikel
const rnd = rand(42);
const AIR = Array.from({ length: 34 }, () => ({
  x: ROOM.x + 34 + rnd() * (ROOM.w - 68), y: ROOM.y + 34 + rnd() * (ROOM.h - 68),
  a: rnd() * 6.28, b: rnd() * 6.28, f: 5 + rnd() * 5, d: rnd() * 0.25,
}));

// Wärme-Pakete: drinnen zum Verdampfer (Schritt 1), draußen weg vom Kondensator (Schritt 3 + Lauf)
const HEAT_IN = [], HEAT_OUT = [];
{
  const r2 = rand(7);
  // Jedes Luftteilchen gibt genau einmal seine Wärme ab, die nächsten zuerst
  const order = AIR.map((a, i) => [Math.hypot(a.x - LOOP.x0, a.y - MID) + r2() * 120, i]).sort((a, b) => a[0] - b[0]);
  const t0 = T.loop + 0.5, t1 = T.step2 - 0.5;
  order.forEach(([, i], k) => {
    const t = t0 + (k / AIR.length) * (t1 - t0);
    AIR[i].cool = t;
    HEAT_IN.push({ t, i, ty: MID - 70 + r2() * 140 });
  });
  for (let t = T.step3 + 0.25; t < T.collapse; t += t < T.step4 ? 0.25 : 0.5) {
    HEAT_OUT.push({ t, y: MID - 80 + r2() * 160, ang: -0.5 + r2(), dist: 170 + r2() * 90 });
  }
}

// ---------- SFX-Cues (für tools/sfx.mjs) ----------
function buildCues() {
  const cues = [];
  const typeClicks = (start, text) => [...text].forEach((ch, i) => { if (ch !== ' ') cues.push({ t: start + i * CHAR, type: 'click', gain: 0.35 }); });
  typeClicks(T.type1, TEXT1);
  cues.push({ t: T.select, type: 'click', gain: 0.8 });
  typeClicks(T.type2, TEXT2);
  for (const t of [T.room, T.loop, T.collapse, T.ring]) cues.push({ t, type: 'whoosh', gain: 0.55 });
  for (const t of [T.loop, T.step2, T.step3, T.step4]) cues.push({ t: t + 0.02, type: 'pop', gain: 0.6 });
  for (const t of [T.step2, onBeat(T.step2 + 1), onBeat(T.step2 + 2)]) cues.push({ t, type: 'thump', gain: 0.55 });
  for (const h of HEAT_OUT.filter((h) => h.t < T.step4)) cues.push({ t: onHit(h.t), type: 'pop', gain: 0.18 });
  for (let t = T.step4 + 0.5; t < T.run; t += 0.5) cues.push({ t: onHit(t), type: 'pop', gain: 0.22 });
  cues.push({ t: T.end, type: 'thump', gain: 1.0 });
  typeClicks(NAME_T, NAME);
  const seen = new Set();
  return cues
    .map((c) => ({ ...c, t: +c.t.toFixed(3) }))
    .filter((c) => { const k = `${c.type}@${c.t}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.t - b.t);
}

// ---------- Zeichnen ----------
function drawGrid(ctx) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grid;
  for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
}

function typed(text, start, t) { return text.slice(0, clamp(Math.floor((t - start) / CHAR), 0, text.length)); }

function cursor(ctx, x, y, size, t, alwaysOn) {
  if (!alwaysOn && Math.floor(t * 2.4) % 2 === 1) return;
  ctx.fillStyle = C.warm; ctx.fillRect(x + 4, y - size * 0.82, 4, size * 1.05);
}

// Label unten links: Buchstaben steigen aus einer Maske auf und gehen nach unten ab
function drawLabel(ctx, t) {
  const size = 40;
  ctx.font = `500 ${size}px Inter`;
  ctx.letterSpacing = '-0.4px';
  for (const [a, b, text] of LABELS) {
    if (t < a || t > b) continue;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, LABEL_Y - size * 1.05, W, size * 1.4); ctx.clip();
    let x = 96;
    [...text].forEach((ch, i) => {
      // altes Label ist vor dem Wechsel draußen, neues kommt kurz danach
      const inP = easeOut(seg(t, a + 0.08 + i * 0.015, a + 0.08 + i * 0.015 + 0.3));
      const outP = easeIn(seg(t, b - 0.3 + i * 0.006, b - 0.3 + i * 0.006 + 0.22));
      const dy = (1 - inP) * size * 1.2 + outP * size * 1.2;
      ctx.fillStyle = C.ink;
      ctx.fillText(ch, x, LABEL_Y + dy);
      x += ctx.measureText(ch).width - 0.4;
    });
    ctx.restore();
  }
  ctx.letterSpacing = '0px';
}

function drawHeadline(ctx, t) {
  if (t > T.room + 0.8) return;
  const size = 64, x = 96, y = 540;
  ctx.font = `500 ${size}px Inter`;
  ctx.letterSpacing = '-0.64px';
  const fade = 1 - easeInOut(seg(t, T.room, T.room + 0.6));
  ctx.globalAlpha = fade;
  let text, cx;
  if (t < T.type2) {
    text = typed(TEXT1, T.type1, t);
    const w = ctx.measureText(text).width;
    if (t >= T.select) { // Select-All
      const p = easeOut(seg(t, T.select, T.select + 0.12));
      ctx.fillStyle = C.select; ctx.fillRect(x - 4, y - size * 0.85, (w + 8) * p, size * 1.12);
    }
    ctx.fillStyle = C.ink; ctx.fillText(text, x, y);
    cx = x + w;
  } else {
    text = typed(TEXT2, T.type2, t);
    ctx.fillStyle = C.ink; ctx.fillText(text, x, y);
    cx = x + ctx.measureText(text).width;
  }
  const typing = (t > T.type1 && t < T.type1 + TEXT1.length * CHAR) || (t > T.type2 && t < T.type2 + TEXT2.length * CHAR);
  if (t < T.room) cursor(ctx, cx, y, size, t, typing);
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  return { cx, y };
}

function strokeRectProgress(ctx, r, p) { // Rechteck zeichnet sich im Uhrzeigersinn
  const per = 2 * (r.w + r.h);
  ctx.setLineDash([per * p, per]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
}

function tag(ctx, text, x, y, alpha) {
  ctx.globalAlpha = alpha;
  ctx.font = '400 28px InterRegular'; ctx.fillStyle = C.guide; ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

function zigzag(ctx, x, yA, yB, amp, n) {
  ctx.beginPath(); ctx.moveTo(x, yA);
  for (let i = 1; i < n; i++) ctx.lineTo(x + (i % 2 ? amp : -amp), lerp(yA, yB, i / n));
  ctx.lineTo(x, yB); ctx.stroke();
}

function ring(ctx, x, y, r, p) {
  if (p <= 0) return;
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r * backOut(p), 0, Math.PI * 2); ctx.stroke();
}

function focusOf(t) {
  if (t >= T.run) return 'all';
  if (t >= T.step4) return 'valve';
  if (t >= T.step3) return 'cond';
  if (t >= T.step2) return 'comp';
  if (t >= T.loop) return 'evap';
  return null;
}

function drawScene(ctx, t) {
  const focus = focusOf(t);
  const since = { evap: T.loop, comp: T.step2, cond: T.step3, valve: T.step4 };
  const shown = (k) => t >= since[k] || focus === 'all';
  const stAlpha = (k) => (focus === k || focus === 'all' ? 1 : shown(k) ? 0.45 : 0.18);

  // Boxen
  ctx.lineWidth = 2; ctx.strokeStyle = C.guide;
  const roomP = easeInOut(seg(t, T.room + 0.15, T.room + 0.8));
  if (roomP > 0) { strokeRectProgress(ctx, ROOM, roomP); tag(ctx, 'innen', ROOM.x, ROOM.y - 18, roomP); }
  const outP = easeInOut(seg(t, T.loop, T.loop + 0.7));
  if (outP > 0) { strokeRectProgress(ctx, OUT, outP); tag(ctx, 'außen', OUT.x, OUT.y - 18, outP); }

  // Raumluft
  const explode = easeOut(seg(t, T.room + 0.3, T.room + 0.9));
  if (t >= T.room + 0.3) {
    AIR.forEach((a, i) => {
      const e = easeOut(seg(t, T.room + 0.3 + a.d * 0.5, T.room + 0.9 + a.d * 0.5));
      const temp = 1 - easeOut(seg(t, a.cool, a.cool + 0.25));
      const amp = 3 + 15 * temp;
      const jx = amp * Math.sin(t * a.f + a.a) * Math.cos(t * a.f * 0.7 + a.b);
      const jy = amp * Math.cos(t * a.f * 1.1 + a.b);
      const x = lerp(CENTER.x - 250, a.x + jx, e), y = lerp(ROOM.y + ROOM.h / 2, a.y + jy, e);
      ctx.globalAlpha = explode;
      ctx.fillStyle = temp > 0.5 ? C.warm : C.guide;
      ctx.beginPath(); ctx.arc(x, y, lerp(6, 8, temp), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  if (t < T.loop) return;

  // Kreislauf-Leitung zeichnet sich
  const lp = easeInOut(seg(t, T.loop, T.loop + 1.0));
  ctx.strokeStyle = C.ink; ctx.lineWidth = LW;
  ctx.beginPath();
  const n = Math.floor(loopPts.pts.length * lp);
  loopPts.pts.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (lp >= 1) ctx.closePath();
  ctx.stroke();

  // Stationen
  const stP = (k) => easeOut(seg(t, Math.max(since[k], T.loop + 0.6), Math.max(since[k], T.loop + 0.6) + 0.4));
  const plain = (fn, k) => { const p = stP(k) || (lp > 0.9 ? 1 : 0); ctx.globalAlpha = stAlpha(k) * Math.min(1, lp * 1.2); fn(p); ctx.globalAlpha = 1; };
  ctx.lineWidth = 2;
  plain(() => { // Verdampfer: Zickzack links
    ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(LOOP.x0, MID - 90); ctx.lineTo(LOOP.x0, MID + 90); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = LW; zigzag(ctx, LOOP.x0, MID + 90, MID - 90, 20, 9);
  }, 'evap');
  plain(() => { // Kondensator: Zickzack rechts
    ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(LOOP.x1, MID - 90); ctx.lineTo(LOOP.x1, MID + 90); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = LW; zigzag(ctx, LOOP.x1, MID - 90, MID + 90, 20, 9);
  }, 'cond');
  plain(() => { // Kompressor: Kreis, pulsiert auf den Beats
    const beatPulse = focus === 'comp' ? Math.exp(-(((t - T.step2) % 0.5) / 0.08)) : 0;
    const r = 38 * (1 + 0.12 * beatPulse);
    ctx.fillStyle = C.bg; ctx.strokeStyle = C.ink; ctx.lineWidth = LW;
    ctx.beginPath(); ctx.arc(ST.comp.x, ST.comp.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ST.comp.x - 12, ST.comp.y - 12); ctx.lineTo(ST.comp.x + 12, ST.comp.y); ctx.lineTo(ST.comp.x - 12, ST.comp.y + 12); ctx.stroke();
  }, 'comp');
  plain(() => { // Ventil: zwei Dreiecke, die die Leitung verengen
    const { x, y } = ST.valve;
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 22); ctx.lineTo(x + 20, y - 22); ctx.lineTo(x, y - 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 20, y + 22); ctx.lineTo(x + 20, y + 22); ctx.lineTo(x, y + 4); ctx.fill();
  }, 'valve');

  // Mini-Beschriftungen an den Stationen
  ctx.font = '500 30px Inter';
  const mini = [['evap', 'Verdampfer', LOOP.x0 + 64, MID + 10, 'left'], ['comp', 'Kompressor', ST.comp.x, ST.comp.y - 70, 'center'],
    ['cond', 'Kondensator', LOOP.x1 - 64, MID + 10, 'right'], ['valve', 'Ventil', ST.valve.x, ST.valve.y + 70, 'center']];
  for (const [k, txt, x, y, align] of mini) {
    const p = easeOut(seg(t, since[k] + 0.2, since[k] + 0.6));
    if (p <= 0) continue;
    ctx.textAlign = align; ctx.globalAlpha = p * (focus === k || focus === 'all' ? 1 : 0.55);
    ctx.fillStyle = focus === k ? C.ink : C.guide; ctx.fillText(txt, x, y + (1 - p) * 10);
  }
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;

  // Schwarzer Ring um die Station im Fokus
  for (const k of ['evap', 'comp', 'cond', 'valve']) {
    const inP = seg(t, since[k], since[k] + 0.35);
    const outP = focus === 'all' ? seg(t, T.run, T.run + 0.3) : focus !== k && t > since[k] ? 1 : 0;
    ring(ctx, ST[k].x, ST[k].y, k === 'comp' ? 56 : 48, inP * (1 - outP));
  }

  // Wärme-Pakete drinnen -> Verdampfer
  for (const h of HEAT_IN) {
    const p = seg(t, h.t, h.t + 0.7);
    if (p <= 0 || p >= 1) continue;
    const e = easeIn(p);
    ctx.globalAlpha = 1 - seg(p, 0.8, 1);
    ctx.fillStyle = C.warm;
    const a = AIR[h.i];
    ctx.beginPath(); ctx.arc(lerp(a.x, LOOP.x0 + 8, e), lerp(a.y, h.ty, e), 7, 0, Math.PI * 2); ctx.fill();
  }
  // Wärme-Pakete Kondensator -> draußen
  for (const h of HEAT_OUT) {
    const p = seg(t, h.t, h.t + 0.9);
    if (p <= 0 || p >= 1) continue;
    const e = easeOut(p);
    ctx.globalAlpha = 1 - seg(p, 0.6, 1);
    ctx.fillStyle = C.warm;
    ctx.beginPath(); ctx.arc(LOOP.x1 + 10 + Math.cos(h.ang) * h.dist * e, h.y + Math.sin(h.ang) * h.dist * e * 0.6, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Kältemittel-Partikel
  const pAlpha = easeOut(seg(t, T.loop + 0.6, T.loop + 1.2));
  if (pAlpha > 0) {
    const N = 44;
    const flow = (t - T.loop) / CYCLE;
    for (let i = 0; i < N; i++) {
      const u = uFromPhase(i / N + flow);
      const s = refrigerant(u);
      let [x, y] = loopAt(u);
      const j = s.jit * 3;
      x += j * Math.sin(t * 23 + i * 1.7); y += j * Math.cos(t * 19 + i * 2.3);
      ctx.globalAlpha = pAlpha;
      if (s.gas > 0.5) {
        ctx.strokeStyle = s.col; ctx.lineWidth = 3; ctx.fillStyle = C.bg;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = s.col;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawEnd(ctx, t, avatar) {
  const cx = 540, cy = 860, R = 150;
  // Punkt wandert hoch und wird zum Kreis
  if (t >= T.collapse + 0.75 && t < T.end + 0.4) {
    const up = easeInOut(seg(t, T.collapse + 0.75, T.ring));
    const y = lerp(CENTER.y, cy, up);
    const r = lerp(6, R, easeInOut(seg(t, T.ring, T.end)));
    ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2);
    if (r < 10) ctx.fill(); else ctx.stroke();
  }
  if (t < T.end) return;
  const p = easeOut(seg(t, T.end, T.end + 0.35));
  const s = lerp(1.06, 1, easeOut(seg(t, T.end, T.end + 0.5)));
  ctx.save();
  ctx.globalAlpha = p;
  ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(avatar, cx - R * s, cy - R * s, 2 * R * s, 2 * R * s);
  ctx.restore();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, Math.PI * 2); ctx.stroke();

  // Name wird getippt (zentriert, von links aufgebaut)
  ctx.font = '500 64px Inter'; ctx.letterSpacing = '-0.64px';
  const full = ctx.measureText(NAME).width, x0 = cx - full / 2, y = cy + R + 110;
  const txt = typed(NAME, NAME_T, t);
  ctx.fillStyle = C.ink; ctx.fillText(txt, x0, y);
  cursor(ctx, x0 + ctx.measureText(txt).width, y, 64, t, txt.length < NAME.length);
  ctx.letterSpacing = '0px';
  const hp = easeOut(seg(t, NAME_T + NAME.length * CHAR, NAME_T + NAME.length * CHAR + 0.4));
  ctx.globalAlpha = hp; ctx.font = '400 36px InterRegular'; ctx.fillStyle = C.guide; ctx.textAlign = 'center';
  ctx.fillText(HANDLE, cx, y + 60 + (1 - hp) * 10);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}

function drawFrame(ctx, t, bgCanvas, avatar) {
  ctx.drawImage(bgCanvas, 0, 0);
  const head = drawHeadline(ctx, t);

  // Cursor -> Punkt, der ins Zimmer fällt
  if (head && t >= T.room && t < T.room + 0.45) {
    const p = easeIn(seg(t, T.room, T.room + 0.3));
    ctx.fillStyle = C.warm;
    ctx.beginPath(); ctx.arc(lerp(head.cx + 6, CENTER.x - 250, p), lerp(head.y - 20, ROOM.y + ROOM.h / 2, p), 7, 0, Math.PI * 2); ctx.fill();
  }

  // Szene, beim Kollaps in einen Punkt gezogen
  if (t < T.collapse + 0.8) {
    const k = easeIn(seg(t, T.collapse, T.collapse + 0.75));
    ctx.save();
    ctx.translate(CENTER.x, CENTER.y); ctx.scale(1 - k * 0.985, 1 - k * 0.985); ctx.rotate(k * 0.6);
    ctx.translate(-CENTER.x, -CENTER.y);
    ctx.globalAlpha = 1;
    drawScene(ctx, t);
    ctx.restore();
  }
  drawEnd(ctx, t, avatar);
  drawLabel(ctx, t);
}

// ---------- Ausgabe ----------
function writeTimeline() {
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, T, vo: VO }, null, 2));
}

async function setup() {
  const bg = createCanvas(W, H); drawGrid(bg.getContext('2d'));
  const avatar = await loadImage(path.join(DIR, 'avatar_gray.png'));
  const canvas = createCanvas(W, H);
  return { bg, avatar, canvas, ctx: canvas.getContext('2d') };
}

async function main() {
  const args = process.argv.slice(2);
  writeTimeline();
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  const { bg, avatar, canvas, ctx } = await setup();
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });

  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number)
      : [1.2, T.select + 0.3, T.type2 + 1.2, T.room + 0.8, T.loop + 1.8, T.step2 + 1.5, T.step3 + 1.2, T.step4 + 1.5, T.run + 0.8, T.collapse + 0.5, T.end + 1.5];
    const files = [];
    for (const t of times) {
      drawFrame(ctx, t, bg, avatar);
      const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`);
      fs.writeFileSync(f, await canvas.encode('png'));
      files.push([f, t]);
    }
    if (args[0] === '--contact') {
      const tw = 360, th = 640, cols = 6, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 40) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#111'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 40);
        sc.drawImage(img, x + 4, y + 40, tw - 8, th - 8);
        sc.fillStyle = '#fff'; sc.font = '500 24px Inter'; sc.fillText(`${t.toFixed(2)}s`, x + 10, y + 30);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png');
      fs.writeFileSync(out, await sheet.encode('png'));
      console.log(out);
    } else console.log(files.map((f) => f[0]).join('\n'));
    return;
  }

  const out = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`, '-r', `${FPS}`, '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = DUR * FPS;
  for (let f = 0; f < total; f++) {
    drawFrame(ctx, f / FPS, bg, avatar);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 120 === 0) process.stdout.write(`\r${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\r${out}`);
}

main();
