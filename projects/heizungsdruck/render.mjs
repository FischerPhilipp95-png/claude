// „Heizungsdruck zu niedrig oder zu hoch? Richtig nachfüllen und ablassen“, YouTube 16:9.
// Grammatik wie projects/heizkoerper-kalt: Board, Cursor, Diagnose-Panel, feste Kamera, Untertitel.
// Hauptmotiv: animiertes Manometer (schwarzer Zeiger = aktuell, roter = Markierung, grün 1,2–2 bar).
// Fakten: shotlist.md, Fotos: photos/credits.json.
//   node projects/heizungsdruck/render.mjs --timeline | --contact | --still 20,50 | [--from s --to s]
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const W = 1920, H = 1080, FPS = 60, CX = 960, CY = 540;
for (const [w, n] of [[400, 'IR'], [500, 'IM'], [600, 'ISB'], [800, 'IXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);

const C = { bg: '#E4E4E4', ink: '#161616', gray: '#7A7A7A', line: '#CFCFCF', sel: '#4C8DFF', lime: '#CFF72A', red: '#FF5A4E', panel: '#0C0C0D', panel2: '#1B1B1D', white: '#FFFFFF' };
const P = { Doc: '#FF2E93', Nachbar: '#29A8F5', Mieterin: '#2FCB78' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2);
const quint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(10 * x));

// ---------- Zeiten aus sections.json ----------
const SEC = JSON.parse(fs.readFileSync(path.join(DIR, 'sections.json'), 'utf8'));
const DUR = SEC.total;
const CH = SEC.chapters.map((c) => ({ ...c, L: c.lines.map((l) => ({ t: l.t, d: l.dur, e: l.t + l.dur })) }));
const OUT = CH.length - 1;   // letztes Kapitel = Fazit
const ZONES = [[0, 0], [2400, 350], [4800, -150], [7200, 300], [9600, -200], [12000, 250]];

// ---------- Kamera: steht fest, fährt nur beim Kapitelwechsel, am Ende Übersicht ----------
const PAN = 1.15;
function camera(t) {
  let z = 0;
  for (let k = 1; k < ZONES.length; k++) if (t >= CH[k].start) z = k;
  const prev = Math.max(0, z - 1);
  let x = ZONES[z][0], y = ZONES[z][1], zoom = 1, blur = 0;
  if (z > 0 && t < CH[z].start + PAN) {
    const u = seg(t, CH[z].start, CH[z].start + PAN), q = quint(u);
    x = lerp(ZONES[prev][0], ZONES[z][0], q); y = lerp(ZONES[prev][1], ZONES[z][1], q);
    zoom = 1 - 0.32 * Math.sin(Math.PI * u); blur = Math.sin(Math.PI * u) ** 2 * 9;
  }
  if (t >= CH[OUT].start) {   // Fazit: ganzes Board von oben
    const u = quint(seg(t, CH[OUT].start, CH[OUT].start + 1.8)), last = ZONES[ZONES.length - 1];
    x = lerp(last[0], 6000, u); y = lerp(last[1], 100, u); zoom = lerp(1, 0.13, u);
    blur = Math.sin(Math.PI * seg(t, CH[OUT].start, CH[OUT].start + 1.8)) ** 2 * 5;
  }
  return { x, y, zoom, blur };
}

// ---------- Grundformen ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function shadow(ctx, a = 0.12, b = 30, dy = 10) { ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = b; ctx.shadowOffsetY = dy; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
function text(ctx, s, x, y, size, font = 'IM', col = C.ink, align = 'left', alpha = 1, ls = 0) {
  if (alpha <= 0 || !s) return 0;
  ctx.font = `${size}px ${font}`; ctx.letterSpacing = `${ls}px`;
  const w = ctx.measureText(s).width;
  ctx.globalAlpha *= alpha; ctx.fillStyle = col; ctx.fillText(s, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y);
  ctx.globalAlpha /= alpha; ctx.letterSpacing = '0px';
  return w;
}
function wrap(ctx, s, maxW) {
  const out = []; let cur = '';
  for (const w of s.split(' ')) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > maxW && cur) { out.push(cur); cur = w; } else cur = tt; }
  if (cur) out.push(cur); return out;
}
const typed = (s, t, t0, cps = 30) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
function selection(ctx, x, y, w, h, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = C.sel; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  for (const [px, py] of [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]) { ctx.fillRect(px - 5, py - 5, 10, 10); ctx.strokeRect(px - 5, py - 5, 10, 10); }
  ctx.restore();
}
function cursor(ctx, x, y, name, alpha = 1, press = 0) {
  if (alpha <= 0) return;
  const col = P[name];
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(1 - press * 0.15, 1 - press * 0.15);
  shadow(ctx, 0.25, 6, 2);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 26); ctx.lineTo(10, 17); ctx.lineTo(21, 16); ctx.closePath(); ctx.fill();
  noShadow(ctx); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.font = '15px ISB'; const w = ctx.measureText(name).width + 22;
  ctx.fillStyle = col; rrect(ctx, 16, 24, w, 28, 14); ctx.fill();
  ctx.fillStyle = name === 'Doc' ? '#fff' : name === 'Mieterin' ? '#05301A' : '#06222e';
  ctx.fillText(name, 27, 43);
  ctx.restore();
}
function pill(ctx, s, x, y, alpha, col = C.lime, size = 22) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${size}px ISB`; const w = ctx.measureText(s).width + 48;
  ctx.fillStyle = C.panel2; rrect(ctx, x, y, w, size * 2.5, size * 1.25); ctx.fill(); text(ctx, s, x + 24, y + size * 1.6, size, 'ISB', col);
  ctx.restore();
}

// ---------- Assets ----------
const IMG = {};
async function loadAssets() {
  const ph = (f) => loadImage(path.join(DIR, 'photos', f));
  IMG.gauge = await ph('A_pressure_gauge_attached_to_a_heating_system.jpg');
  IMG.vessel = await ph('ausdehnungsgefaess.jpg');
  IMG.avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
}
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh); ctx.restore();
}
function photoCard(ctx, img, x, y, w, h, alpha, credit, fx = 0.5, fy = 0.5, zoom = 1, dark = true) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  shadow(ctx, 0.35, 24, 8); ctx.fillStyle = '#222'; rrect(ctx, x, y, w, h, 12); ctx.fill(); noShadow(ctx);
  ctx.save(); rrect(ctx, x, y, w, h, 12); ctx.clip(); cover(ctx, img, x, y, w, h, fx, fy, zoom); ctx.restore();
  if (credit) text(ctx, credit, x, y + h + 22, 14, 'IM', dark ? '#8A8A8E' : C.gray);
  ctx.restore();
}

// ================= Wärmebild =================
const HEAT = [[0, [20, 26, 92]], [0.18, [35, 70, 232]], [0.36, [31, 181, 224]], [0.5, [53, 214, 122]], [0.64, [255, 224, 46]], [0.8, [255, 138, 28]], [1, [255, 45, 26]]];
function heat(v) {
  v = clamp(v);
  for (let i = 1; i < HEAT.length; i++) if (v <= HEAT[i][0]) {
    const [a, ca] = HEAT[i - 1], [b, cb] = HEAT[i], q = (v - a) / (b - a);
    return `rgb(${Math.round(lerp(ca[0], cb[0], q))},${Math.round(lerp(ca[1], cb[1], q))},${Math.round(lerp(ca[2], cb[2], q))})`;
  }
  return 'rgb(255,45,26)';
}
const smooth = (e0, e1, x) => { const q = clamp((x - e0) / (e1 - e0)); return q * q * (3 - 2 * q); };
const WARM = (u, v) => 0.9 - 0.14 * v;
// Temperaturfeld je Symptom (u: links→rechts, v: oben→unten, Wert 0 = kalt … 1 = heiß)
const FIELD = {
  air: (t) => (u, v) => { const edge = 0.33 + 0.025 * Math.sin(t * 2.4 + u * 6); return lerp(0.14, 0.88 - 0.12 * v, smooth(edge - 0.05, edge + 0.05, v)); },
  stuck: (t) => (u, v) => 0.1 + 0.03 * Math.sin(u * 9 + v * 4 + t),
  weak: (t, j = 0) => (u, v) => 0.47 - 0.12 * v - 0.04 * j + 0.02 * Math.sin(t * 2 + u * 5),
  sludge: (t) => (u, v) => lerp(0.88 - 0.15 * v, 0.14, smooth(0.56, 0.68, v + 0.02 * Math.sin(u * 12 + t))),
  normal: () => (u, v) => 0.9 - 0.3 * v,
  cold: (t) => (u, v) => 0.12 + 0.02 * Math.sin(u * 7 + t),
};
// warm werden nach der Lösung: die Wärme läuft von oben nach unten durch
function fixed(base, t, fixAt, to = WARM) {
  if (fixAt == null || t < fixAt) return base;
  const p = seg(t, fixAt, fixAt + 2.4);
  return (u, v) => lerp(base(u, v), to(u, v), clamp(p * 1.7 - v * 0.7));
}
function radiator(ctx, x, y, w, h, field, ribs = 11, valve = null) {
  const gap = Math.max(2, w * 0.014), rw = (w - gap * (ribs - 1)) / ribs;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x - 6, y - 6, w + 12, h + 12, 10); ctx.fill();
  for (let i = 0; i < ribs; i++) {
    const u = ribs > 1 ? i / (ribs - 1) : 0.5, g = ctx.createLinearGradient(0, y, 0, y + h);
    for (let s = 0; s <= 10; s++) g.addColorStop(s / 10, heat(field(u, s / 10)));
    ctx.fillStyle = g; rrect(ctx, x + i * (rw + gap), y, rw, h, Math.min(rw / 2, 9)); ctx.fill();
  }
  if (valve) {   // Thermostatkopf rechts oben (im Wärmebild: kühl), mit Stufe
    const vx = x + w + 10, vy = y + 6, vw = Math.max(18, w * 0.08), vh = Math.max(34, h * 0.32);
    ctx.fillStyle = heat(0.3); rrect(ctx, vx, vy, vw, vh, vw / 2); ctx.fill();
    if (valve.level) text(ctx, String(valve.level), vx + vw / 2, vy + vh * 0.62, Math.max(12, vw * 0.7), 'IXB', '#fff', 'center');
  }
}
function bubbles(ctx, x, y, w, h, t, n = 9) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.45 + i * 0.37) % 1, bx = x + w * ((i * 0.13 + 0.07) % 0.95), by = y + h * (0.32 - ph * 0.26);
    ctx.globalAlpha = Math.sin(Math.PI * ph); ctx.beginPath(); ctx.arc(bx + Math.sin(t * 3 + i) * 4, by, 4 + (i % 3) * 2.5, 0, 7); ctx.stroke();
  }
  ctx.restore();
}
// Wärmebild-Karte (weiße Karte, dunkler Sucher, Skala rechts)
function thermalFrame(ctx, x, y, w, h, label = 'WÄRMEBILD · SYMPTOM') {
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, x, y, w, h, 14); ctx.fill(); noShadow(ctx);
  text(ctx, label, x + 20, y + 32, 14, 'ISB', C.gray, 'left', 1, 2);
  const vx = x + 16, vy = y + 46, vw = w - 32 - 34, vh = h - 62;
  ctx.fillStyle = '#0B0E1C'; rrect(ctx, vx, vy, vw, vh, 10); ctx.fill();
  const g = ctx.createLinearGradient(0, vy, 0, vy + vh); for (let s = 0; s <= 6; s++) g.addColorStop(s / 6, heat(1 - s / 6));
  ctx.fillStyle = g; rrect(ctx, x + w - 36, vy, 14, vh, 7); ctx.fill();
  text(ctx, 'warm', x + w - 29, vy - 6, 11, 'ISB', C.gray, 'center'); text(ctx, 'kalt', x + w - 29, vy + vh + 14, 11, 'ISB', C.gray, 'center');
  return { vx, vy, vw, vh };
}

// ================= Manometer (Hauptmotiv) =================
// Skala 0–4 bar, grüner Bereich 1,2–2,0 bar (Einfamilienhaus, Thermondo), roter Zeiger = Markierung bei 2,0 bar.
function manometer(ctx, cx, cy, r, val, { mark = 2.0, labels = 0, shake = 0, t = 0 } = {}) {
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = (b) => lerp(a0, a1, clamp(b, 0, 4) / 4);
  shadow(ctx, 0.25, r * 0.25, r * 0.08); ctx.fillStyle = '#2A2C33'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.06, 0, 7); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#F6F6F3'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2FCB78'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, ang(1.2), ang(2.0)); ctx.stroke();
  for (let b = 0; b <= 4.001; b += 0.2) {
    const an = ang(b), major = Math.abs(b - Math.round(b)) < 0.01, half = Math.abs(b * 2 - Math.round(b * 2)) < 0.01;
    const r1 = r * 0.93, r2 = major ? r * 0.74 : half ? r * 0.8 : r * 0.85;
    ctx.strokeStyle = '#2A2A2D'; ctx.lineWidth = major ? r * 0.025 : r * 0.012; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.lineTo(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2); ctx.stroke();
    if (major) text(ctx, String(Math.round(b)), cx + Math.cos(an) * r * 0.58, cy + Math.sin(an) * r * 0.58 + r * 0.06, r * 0.17, 'IXB', '#2A2A2D', 'center');
  }
  text(ctx, 'bar', cx, cy + r * 0.45, r * 0.13, 'ISB', '#6A6A6E', 'center');
  // roter Zeiger (Markierung)
  const am = ang(mark); ctx.strokeStyle = '#E4302B'; ctx.lineWidth = r * 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * r * 0.1, cy + Math.sin(am) * r * 0.1); ctx.lineTo(cx + Math.cos(am) * r * 0.86, cy + Math.sin(am) * r * 0.86); ctx.stroke();
  // schwarzer Zeiger (aktueller Druck)
  const v = val + shake * Math.sin(t * 23) * 0.03, an = ang(v);
  ctx.strokeStyle = '#111'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.moveTo(cx - Math.cos(an) * r * 0.16, cy - Math.sin(an) * r * 0.16); ctx.lineTo(cx + Math.cos(an) * r * 0.78, cy + Math.sin(an) * r * 0.78); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.08, 0, 7); ctx.fill();
  // Glanz auf dem Glas
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  return { ang, an, am };
}
// Zeiger-Wert je Kapitel (k) zur Zeit t
function gaugeValue(k, t, T) {
  const L = T.L;
  if (k === 1) return 1.55;
  if (k === 2) return lerp(0.7, 1.75, easeInOut(seg(t, L[2].t + 2.5, L[2].t + 6.0)));
  if (k === 3) return 1.6;
  if (k === 4) return lerp(2.6, 1.7, easeInOut(seg(t, L[1].t + 2.0, L[1].t + 5.5)));
  return 1.5;
}

// ================= Inhalte der Kapitel =================
const DATA = {
  1: { title: 'Manometer lesen', who: 'Mieterin', quote: 'Welcher Druck ist eigentlich richtig?', src: 'Häufige Frage', result: 'lesen',
    prompt: 'Welcher Druck ist richtig?', check: ['Schwarzer Zeiger = aktuell', 'Roter Zeiger = Markierung', 'Meist 1,2–2 bar', 'Markierung am Gerät zählt'] },
  2: { title: 'Zu wenig Druck: nachfüllen', who: 'Nachbar', quote: 'Nadel steht unter der Markierung.', src: 'Symptom', result: 'fuellen',
    prompt: 'Druck zu niedrig. Wie nachfüllen?', check: ['Schlauch volllaufen lassen', 'Dann an den Füllhahn', 'Langsam öffnen, beobachten', 'Zudrehen, Schlauch ab'] },
  3: { title: 'Die Systemtrenner-Frage', who: 'Nachbar', quote: 'Wozu ein Systemtrenner, wenn das Trinkwasser sowieso mehr Druck hat?', src: 'Häufige Frage aus den Kommentaren · sinngemäß', result: 'trenner',
    prompt: 'Warum ein Systemtrenner?', check: ['Nie zurück ins Trinkwasser', 'Trenner sperrt bei Unterdruck', 'Schlauch nach dem Füllen ab'] },
  4: { title: 'Zu viel Druck: ablassen', who: 'Mieterin', quote: 'Der Zeiger steht über dem roten.', src: 'Symptom', result: 'ablassen',
    prompt: 'Druck zu hoch. Was tun?', check: ['Schlauch an Entleerungshahn', 'Langsam in den Eimer', 'Oder: Entlüftungsventil', 'Vorsicht: heiß & schmutzig'] },
  5: { title: 'Fällt oder steigt ständig?', who: 'Mieterin', quote: 'Der Druck fällt immer wieder ab, oder steigt immer weiter.', src: 'Symptom', result: 'gefaess',
    prompt: 'Druck fällt oder steigt ständig.', check: ['Fällt: Leck, Ventil, Gefäß?', 'Steigt: Gefäß, Wärmetauscher?', 'Füllhahn ganz zu?', 'Fachbetrieb rufen'] },
};

function times(k) {
  const c = CH[k], L = c.L, last = L[L.length - 1], n = DATA[k].check.length;
  const qStart = L[0].t + 1.4, qEnd = qStart + DATA[k].quote.length / 30;
  const pStart = L[1].t - 0.2, typeStart = L[1].t + 0.2, typeEnd = typeStart + DATA[k].prompt.length / 32, click = typeEnd + 0.25, result = click + 0.7;
  const checkStart = last.t + 0.3, checkStep = Math.max(0.55, (last.e - checkStart - 0.4) / n);
  return { c, qStart, qEnd, pStart, typeStart, typeEnd, click, result, checkStart, checkStep, end: c.end, start: c.start, L };
}

// ----- linke Karte: Manometer bzw. Druckvergleich / zwei Manometer -----
function leftCard(ctx, t, k, x, y, w, h, tin, T) {
  const p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  if (k === 3) {   // Druckvergleich ohne Zahlen: Trinkwasser meist höher, fällt im Störfall ab
    text(ctx, 'DRUCK IM VERGLEICH', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
    const drop = easeInOut(seg(t, T.L[1].t + 1.6, T.L[1].t + 3.2)), base = h - 60, bw = 110;
    const hT = lerp(200, 40, drop), hH = 120;
    ctx.fillStyle = '#39A8FF'; rrect(ctx, 70, base - hT, bw, hT, 10); ctx.fill();
    ctx.fillStyle = '#FF8A1C'; rrect(ctx, 240, base - hH, bw, hH, 10); ctx.fill();
    text(ctx, 'Trinkwasser', 70 + bw / 2, base + 30, 18, 'ISB', C.ink, 'center'); text(ctx, 'Heizung', 240 + bw / 2, base + 30, 18, 'ISB', C.ink, 'center');
    if (drop > 0.5) text(ctx, 'Druckabfall im Netz!', 70, 70, 20, 'IXB', C.red, 'left', easeOut(seg(t, T.L[1].t + 2.4, T.L[1].t + 2.8)));
  } else if (k === 5) {   // zwei Manometer: eins fällt, eins steigt; dann das echte Ausdehnungsgefäß
    const ph = (t * 0.35) % 1, sw = easeInOut(seg(t, T.L[1].t + 0.6, T.L[1].t + 1.2));
    if (sw < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - sw;
      text(ctx, 'FÄLLT · STEIGT', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
      manometer(ctx, w * 0.27, h * 0.56, w * 0.21, lerp(1.6, 0.6, ph), { t });
      manometer(ctx, w * 0.73, h * 0.56, w * 0.21, lerp(1.6, 2.8, ph), { t });
      text(ctx, 'fällt', w * 0.27, h - 18, 18, 'ISB', C.ink, 'center'); text(ctx, 'steigt', w * 0.73, h - 18, 18, 'ISB', C.ink, 'center');
      ctx.restore();
    }
    if (sw > 0) {
      ctx.save(); ctx.globalAlpha *= sw; text(ctx, 'AUSDEHNUNGSGEFÄSS (ECHT)', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
      ctx.save(); rrect(ctx, 16, 46, w - 32, h - 62, 10); ctx.clip(); cover(ctx, IMG.vessel, 16, 46, w - 32, h - 62, 0.45, 0.4); ctx.restore();
      ctx.restore();
    }
  } else if (k === 1 && t < T.L[0].t + 3.2) {   // erst das echte Manometer, dann die Zeichnung
    const fo = 1 - easeInOut(seg(t, T.L[0].t + 2.4, T.L[0].t + 3.2));
    ctx.save(); ctx.globalAlpha *= fo; text(ctx, 'MANOMETER (ECHT)', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
    ctx.save(); rrect(ctx, 16, 46, w - 32, h - 62, 10); ctx.clip(); cover(ctx, IMG.gauge, 16, 46, w - 32, h - 62, 0.48, 0.5, 1.3); ctx.restore();
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= 1 - fo; manometer(ctx, w / 2, h / 2 + 16, Math.min(w, h) * 0.38, 1.55, { t }); ctx.restore();
  } else {
    text(ctx, 'MANOMETER', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
    const v = gaugeValue(k, t, T);
    manometer(ctx, w / 2, h / 2 + 16, Math.min(w, h) * 0.38, v, { t, shake: k === 4 && v > 2.2 ? 1 : 0 });
    const st = v < 1.2 ? ['zu niedrig', C.red] : v > 2.0 ? ['zu hoch', C.red] : ['ok', '#1E9E55'];
    ctx.font = '18px IXB'; const sw = ctx.measureText(st[0]).width + 28;
    ctx.fillStyle = st[1]; rrect(ctx, w - sw - 16, 14, sw, 30, 15); ctx.fill(); text(ctx, st[0], w - sw / 2 - 16, 35, 18, 'IXB', '#fff', 'center');
  }
  ctx.restore();
  if (k === 1) text(ctx, 'Foto: Shixart1985, CC BY 2.0, Wikimedia Commons', x, y + h + 22, 14, 'IM', C.gray, 'left', clamp(p * 2) * (1 - seg(t, T.L[0].t + 2.4, T.L[0].t + 3.2)));
  if (k === 5) text(ctx, 'Foto: Jahoe, gemeinfrei, Wikimedia Commons', x, y + h + 22, 14, 'IM', C.gray, 'left', easeOut(seg(t, T.L[1].t + 0.6, T.L[1].t + 1.2)));
  selection(ctx, x, y, w, h, (1 - seg(t, tin + 0.9, tin + 1.2)) * clamp(p * 2));
}

function quoteNote(ctx, t, k, x, y, w, T) {
  const d = DATA[k], p = easeOut(seg(t, T.qStart - 0.5, T.qStart - 0.2));
  if (p <= 0) return { cx: x, cy: y };
  ctx.font = '34px IM';
  const full = wrap(ctx, `„${d.quote}“`, w - 60), s = typed(`„${d.quote}“`, t, T.qStart, 30);
  const h = 70 + full.length * 46 + 46;
  ctx.save(); ctx.globalAlpha = p;
  shadow(ctx, 0.1, 24, 8); ctx.fillStyle = '#FBFBFB'; rrect(ctx, x, y, w, h, 12); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = P[d.who]; ctx.fillRect(x, y, 6, h);
  let rem = s, lx = x + 30, ly = y + 64, endX = lx, endY = ly;
  for (const line of full) { const part = rem.slice(0, line.length); rem = rem.slice(line.length + 1); if (part) { const ww = text(ctx, part, lx, ly, 34, 'IM', C.ink); endX = lx + ww; endY = ly; } ly += 46; }
  const typing = t < T.qEnd + 0.4;
  if (typing && Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = C.sel; ctx.fillRect(endX + 3, endY - 30, 2.5, 38); }
  const sp = easeOut(seg(t, T.qEnd, T.qEnd + 0.4));
  if (sp > 0) { ctx.font = '17px ISB'; const sw = ctx.measureText(d.src).width + 26; ctx.globalAlpha = p * sp; ctx.fillStyle = '#ECECEC'; rrect(ctx, x + 30, y + h - 52, sw, 32, 16); ctx.fill(); text(ctx, d.src, x + 43, y + h - 30, 17, 'ISB', C.gray); }
  ctx.restore();
  selection(ctx, x - 6, y - 6, w + 12, h + 12, p * (typing ? 1 : 1 - seg(t, T.qEnd + 0.4, T.qEnd + 0.8)));
  return { cx: endX + 6, cy: endY + 6, h };
}

function checklist(ctx, t, k, x, y, w, T) {
  const d = DATA[k], p = spring(seg(t, T.checkStart - 0.4, T.checkStart + 0.2));
  if (p <= 0) return [x, y];
  const h = 76 + d.check.length * 58;
  ctx.font = '24px ISB'; w = Math.max(w, 74 + Math.max(...d.check.map((c) => ctx.measureText(c).width)) + 30);
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(x, y + (1 - p) * 30);
  shadow(ctx, 0.12, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 16); ctx.fill(); noShadow(ctx);
  text(ctx, d.checkTitle || 'SO HILFST DU DIR', 28, 44, 16, 'ISB', C.gray, 'left', 1, 2.4);
  let cx = 0, cy = 0;
  d.check.forEach((s, i) => {
    const ti = T.checkStart + i * T.checkStep, on = easeOut(seg(t, ti, ti + 0.25)), yy = 82 + i * 58;
    ctx.globalAlpha = clamp(p * 2) * lerp(0.35, 1, on);
    ctx.fillStyle = on > 0.5 ? C.lime : '#fff'; ctx.strokeStyle = on > 0.5 ? '#9DBF13' : '#BDBDBD'; ctx.lineWidth = 2;
    rrect(ctx, 28, yy - 4, 30, 30, 8); ctx.fill(); ctx.stroke();
    if (on > 0) { ctx.strokeStyle = C.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(35, yy + 11); ctx.lineTo(41, yy + 17); ctx.lineTo(51 - (1 - on) * 6, yy + 4 + (1 - on) * 6); ctx.stroke(); }
    text(ctx, s, 74, yy + 20, 24, on > 0.5 ? 'ISB' : 'IM', C.ink);
    if (i === 0 || t >= ti) { cx = 50; cy = yy + 16; }
  });
  ctx.restore();
  return [x + cx, y + cy];
}


// ----- Grafiken im dunklen Panel -----
// Füllweg: Wasserhahn → Systemtrenner → Schlauch → Füllhahn (KFE) → Heizung. Teilchen zeigen, wie weit Wasser schon ist.
function fillPath(ctx, t, x, y, w, L) {
  const pts = [[x + 40, y + 60], [x + 200, y + 60], [x + 330, y + 60], [x + 330, y + 250], [x + 560, y + 250], [x + 720, y + 250]];
  const lab = [['Wasserhahn', 0], ['Systemtrenner', 1], ['Füllhahn (KFE)', 4], ['Heizung', 5]];
  // Schlauch (grau, füllt sich blau)
  const full = easeInOut(seg(t, L[1].t + 1.5, L[1].t + 5.0)), into = easeInOut(seg(t, L[2].t + 2.0, L[2].t + 6.0));
  const segLen = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segLen.push(d); tot += d; }
  const drawUpTo = (frac, col, lw) => {
    let rem = frac * tot; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length && rem > 0; i++) { const q = Math.min(1, rem / segLen[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)); rem -= segLen[i - 1]; }
    ctx.stroke();
  };
  drawUpTo(1, '#3A3C44', 18);
  const hoseEnd = (segLen[0] + segLen[1] + segLen[2] + segLen[3]) / tot;   // bis zum Füllhahn
  drawUpTo(full * hoseEnd + into * (1 - hoseEnd), '#39A8FF', 10);
  // Bauteile
  const box = (px, py, s, col) => { ctx.fillStyle = col; rrect(ctx, px - s / 2, py - s / 2, s, s, 10); ctx.fill(); };
  box(pts[0][0], pts[0][1], 46, '#8A90A0'); box(pts[1][0], pts[1][1], 54, C.lime); box(pts[4][0], pts[4][1], 40, '#C9A227');
  ctx.fillStyle = '#3a3f52'; rrect(ctx, pts[5][0] - 10, pts[5][1] - 110, 110, 170, 12); ctx.fill();
  lab.forEach(([s, i]) => text(ctx, s, pts[i][0] + (i === 5 ? 45 : 0), pts[i][1] + (i === 5 ? 90 : 52), 18, 'ISB', i === 1 ? C.lime : '#CFCFCF', 'center'));
  // Luft-Warnung, solange der Schlauch noch leer ist
  if (t > L[1].t + 0.8 && full < 1) text(ctx, 'erst volllaufen lassen, sonst kommt Luft rein', x + 40, y + 150, 19, 'ISB', '#FFD400', 'left', 1 - seg(t, L[1].t + 4.6, L[1].t + 5.2));
}
// Systemtrenner im Schnitt: Eingang | Mitte (entlüftet ins Freie) | Ausgang
function trennerDrawing(ctx, t, x, y, w, L) {
  const back = easeOut(seg(t, L[1].t + 2.0, L[1].t + 2.8)), open = easeOut(seg(t, L[2].t + 2.2, L[2].t + 3.0));
  const py = y + 160;
  ctx.fillStyle = '#3A3C44'; rrect(ctx, x, py - 16, w, 32, 16); ctx.fill();
  text(ctx, 'Trinkwasser', x, py - 34, 18, 'ISB', '#39A8FF'); text(ctx, 'Heizung', x + w, py - 34, 18, 'ISB', '#FF8A1C', 'right');
  // Trenner-Körper mit drei Zonen
  const tx = x + w / 2 - 140; ctx.fillStyle = '#2A2C33'; rrect(ctx, tx, py - 70, 280, 140, 18); ctx.fill();
  [['Eingang', 0], ['Mitte', 1], ['Ausgang', 2]].forEach(([s, i]) => { ctx.fillStyle = i === 1 ? (open > 0 ? C.lime : '#3E414B') : '#3E414B'; rrect(ctx, tx + 12 + i * 89, py - 56, 78, 112, 10); ctx.fill(); text(ctx, s, tx + 51 + i * 89, py + 92, 16, 'ISB', '#AFAFAF', 'center'); });
  // Teilchen: normal vorwärts (blau), bei Druckabfall rückwärts (rot) bis der Trenner sperrt
  for (let i = 0; i < 18; i++) {
    const ph = (t * 0.5 + i / 18) % 1, dir = back > 0.5 ? -1 : 1;
    let px = dir > 0 ? x + ph * w : x + w - ph * w;
    if (dir < 0 && open > 0 && px < tx + 280) continue;   // gesperrt: nichts kommt zurück ins Trinkwasser
    ctx.fillStyle = dir > 0 ? '#9BD4FF' : C.red; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
  }
  if (back > 0) text(ctx, '← zurückgesaugt?', x + w - 20, py + 50, 22, 'IXB', C.red, 'right', back * (1 - open));
  if (open > 0) {   // Mitte entleert ins Freie
    ctx.save(); ctx.globalAlpha = open;
    for (let i = 0; i < 5; i++) { const d = ((t * 1.4 + i / 5) % 1) * 90; ctx.fillStyle = '#9BD4FF'; ctx.beginPath(); ctx.arc(tx + 140 + Math.sin(i * 2) * 10, py + 70 + d, 5, 0, 7); ctx.fill(); }
    text(ctx, 'Mitte entleert ins Freie, Weg ist gesperrt', tx + 140, py + 190, 20, 'IXB', C.lime, 'center'); ctx.restore();
  }
}
// Ablassen: Entleerungshahn mit Schlauch in den Eimer, daneben Heizkörper mit Entlüftungsventil
function drainDrawing(ctx, t, x, y, L) {
  const flow = seg(t, L[1].t + 1.0, L[1].t + 6.0) > 0 && t < L[1].t + 6.0;
  ctx.fillStyle = '#3a3f52'; rrect(ctx, x, y, 120, 200, 12); ctx.fill(); text(ctx, 'Heizung', x + 60, y - 12, 18, 'ISB', '#CFCFCF', 'center');
  ctx.fillStyle = '#C9A227'; rrect(ctx, x + 120, y + 160, 40, 26, 6); ctx.fill(); text(ctx, 'Entleerungshahn', x + 140, y + 220, 16, 'ISB', '#CFCFCF', 'center');
  ctx.strokeStyle = '#39A8FF'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 160, y + 173); ctx.quadraticCurveTo(x + 260, y + 170, x + 270, y + 250); ctx.stroke();
  ctx.fillStyle = '#5C6170'; ctx.beginPath(); ctx.moveTo(x + 220, y + 250); ctx.lineTo(x + 330, y + 250); ctx.lineTo(x + 315, y + 340); ctx.lineTo(x + 235, y + 340); ctx.closePath(); ctx.fill();
  text(ctx, 'Eimer', x + 275, y + 372, 16, 'ISB', '#CFCFCF', 'center');
  if (flow) for (let i = 0; i < 6; i++) { const d = ((t * 1.6 + i / 6) % 1) * 60; ctx.fillStyle = '#9BD4FF'; ctx.beginPath(); ctx.arc(x + 270, y + 255 + d, 4, 0, 7); ctx.fill(); }
  const alt = easeOut(seg(t, L[1].t + 3.6, L[1].t + 4.2));
  if (alt > 0) {
    ctx.save(); ctx.globalAlpha *= alt;
    text(ctx, 'oder', x + 400, y + 120, 22, 'IXB', '#8A8A8E');
    radiator(ctx, x + 480, y + 40, 230, 160, (u, v) => 0.75 - 0.2 * v, 8);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 700, y + 52, 10, 0, 7); ctx.fill();
    text(ctx, 'Entlüftungsventil', x + 595, y + 240, 16, 'ISB', '#CFCFCF', 'center'); ctx.restore();
  }
}
// Ausdehnungsgefäß im Schnitt: Luftpolster oben, Membran, Wasser unten. Gesund: federt; defekt: Wasser im Luftraum
function vesselDrawing(ctx, t, x, y, L) {
  const defect = easeInOut(seg(t, L[1].t + 1.8, L[1].t + 3.4)), breath = Math.sin(t * 2.2) * 10 * (1 - defect);
  const cx = x + 120, cy = y + 170, rx = 110, ry = 150;
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.clip();
  ctx.fillStyle = '#2C3550'; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  const mem = cy + 10 + breath - defect * 120;   // Membran wandert nach oben, wenn Wasser in den Luftraum läuft
  ctx.fillStyle = '#39A8FF'; ctx.fillRect(cx - rx, mem, rx * 2, cy + ry - mem);
  ctx.strokeStyle = defect > 0.3 ? C.red : C.lime; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - rx, mem); ctx.quadraticCurveTo(cx, mem + 26 * (1 - defect), cx + rx, mem); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#E4302B'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.stroke();
  text(ctx, defect < 0.5 ? 'Luftpolster' : 'Wasser im Luftraum', cx, cy - ry - 18, 18, 'IXB', defect < 0.5 ? '#CFCFCF' : C.red, 'center');
  text(ctx, 'Wasser', cx, cy + 120, 18, 'IXB', '#06222e', 'center');
  text(ctx, defect < 0.5 ? 'gesund: Membran federt' : 'defekt: Druck steigt stark', cx, cy + ry + 34, 19, 'ISB', defect < 0.5 ? C.lime : C.red, 'center');
}

function resultView(ctx, t, k, x, y, w, h, t0) {
  const r = DATA[k].result, L = CH[k].L;
  const a = (tt, len = 0.5) => easeOut(seg(t, tt, tt + len)), sp = (tt) => spring(seg(t, tt, tt + 0.55));
  ctx.save();
  if (r === 'lesen') {
    text(ctx, 'SO LIEST DU ES', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    const q = a(t0 + 0.2, 0.6);
    if (q > 0) {
      ctx.globalAlpha = q; const g = manometer(ctx, x + 200, y + 250, 170, 1.55, { t }); ctx.globalAlpha = 1;
      // Beschriftungen auf festen Zeilen rechts, Hinweislinie zum Zeiger (die Zeiger liegen dicht beieinander)
      const tag = (s, ang2, rr, ty, tt, col) => {
        const o = a(tt); if (o <= 0) return;
        const px = x + 200 + Math.cos(ang2) * rr, py = y + 250 + Math.sin(ang2) * rr;
        ctx.save(); ctx.globalAlpha = o; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x + 400, ty - 8); ctx.lineTo(x + 420, ty - 8); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill(); text(ctx, s, x + 432, ty, 24, 'IXB', col); ctx.restore();
      };
      tag('schwarzer Zeiger = aktueller Druck', g.an, 100, y + 120, L[0].t + 2.0, '#fff');
      tag('roter Zeiger = Markierung', g.am, 140, y + 180, L[0].t + 4.2, '#FF6B5E');
      tag('grün = meist 1,2–2 bar', (g.ang(1.2) + g.ang(2.0)) / 2, 136, y + 240, L[1].t + 0.6, '#2FCB78');
    }
    const hp = a(L[1].t + 3.6, 0.6);
    if (hp > 0) { ctx.save(); ctx.globalAlpha = hp; ctx.fillStyle = C.panel2; rrect(ctx, x + 430, y + 330, 380, 110, 16); ctx.fill(); text(ctx, 'Faustregel', x + 452, y + 368, 18, 'ISB', '#9A9A9A'); text(ctx, 'ca. 1 bar je 10 m Höhe', x + 452, y + 412, 28, 'IXB', '#fff'); ctx.restore(); }
    pill(ctx, 'Maßgeblich: Markierung an deinem Gerät', x + 360, y + 470, sp(L[2].t + 0.6), C.lime, 20);
  }
  if (r === 'fuellen') {
    text(ctx, 'NACHFÜLLEN', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Schema', x + w - 20, y + 28, 16, 'ISB', '#6A6A6E', 'right', a(t0));
    const q = a(t0 + 0.2, 0.6); if (q > 0) { ctx.globalAlpha = q; fillPath(ctx, t, x, y + 60, w, L); ctx.globalAlpha = 1; }
    pill(ctx, 'Empfohlen: aufbereitetes Wasser (VES)', x, y + h - 140, sp(L[3].t + 0.2), '#9BD4FF', 20);
    pill(ctx, 'Mietwohnung: Sache des Vermieters', x, y + h - 70, sp(L[3].t + 2.8), C.lime, 20);
  }
  if (r === 'trenner') {
    text(ctx, 'DIN EN 1717', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Heizungswasser darf nie ins Trinkwasser', x, y + 72, 30, 'IXB', '#fff', 'left', a(L[2].t + 0.2));
    const q = a(t0 + 0.3, 0.6); if (q > 0) { ctx.globalAlpha = q; trennerDrawing(ctx, t, x + 20, y + 120, w - 60, L); ctx.globalAlpha = 1; }
  }
  if (r === 'ablassen') {
    text(ctx, 'ETWAS WASSER ABLASSEN', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    const q = a(t0 + 0.2, 0.6); if (q > 0) { ctx.globalAlpha = q; drainDrawing(ctx, t, x + 10, y + 80, L); ctx.globalAlpha = 1; }
    pill(ctx, '⚠  Heizungswasser kann heiß und stark verschmutzt sein', x, y + h - 70, sp(L[2].t + 0.2), '#FFD400', 21);
  }
  if (r === 'gefaess') {
    text(ctx, 'DIE ÜBLICHEN URSACHEN', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    const row = (h1, h2, yy, tt, col) => { const o = sp(tt); if (o <= 0) return; ctx.save(); ctx.globalAlpha = clamp(o * 2); ctx.fillStyle = C.panel2; rrect(ctx, x, yy, 470, 92, 14); ctx.fill(); ctx.fillStyle = col; rrect(ctx, x, yy, 8, 92, 4); ctx.fill(); text(ctx, h1, x + 26, yy + 36, 24, 'IXB', '#fff'); text(ctx, h2, x + 26, yy + 70, 19, 'IM', '#CFCFCF'); ctx.restore(); };
    row('Fällt ständig', 'Leck · Sicherheitsventil · Ausdehnungsgefäß', y + 60, t0 + 0.2, '#39A8FF');
    row('Steigt ständig', 'Ausdehnungsgefäß · Wärmetauscher', y + 170, L[1].t + 0.3, '#FF8A1C');
    row('Auch möglich', 'Füllhahn nicht ganz geschlossen', y + 280, L[2].t + 0.2, '#FFD400');
    const v = a(L[1].t + 1.0, 0.6);
    if (v > 0) { ctx.save(); ctx.globalAlpha = v; vesselDrawing(ctx, t, x + 520, y + 30, L); ctx.restore(); }
    pill(ctx, '→ In all diesen Fällen: Fachbetrieb', x, y + h - 70, sp(L[2].t + 2.6), C.lime, 22);
  }
  ctx.restore();
}

function panel(ctx, t, k, x, y, w, h, T) {
  const d = DATA[k], p = spring(seg(t, T.pStart, T.pStart + 0.6));
  if (p <= 0) return { bx: x, by: y };
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, 0, 0, w, h, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = C.lime; rrect(ctx, 22, 20, 26, 26, 7); ctx.fill(); text(ctx, 'Doc', 58, 40, 17, 'ISB', '#fff');
  ['Diagnose', 'Ursache', 'Lösung'].forEach((s, i) => { const on = (i === 0 && t < T.result) || (i === 1 && t >= T.result && t < T.checkStart) || (i === 2 && t >= T.checkStart); ctx.fillStyle = on ? '#2A2A2D' : 'transparent'; rrect(ctx, 150 + i * 120, 16, 110, 34, 17); ctx.fill(); text(ctx, s, 205 + i * 120, 39, 16, 'IM', on ? '#fff' : '#8A8A8E', 'center'); });
  const ax = 40, ay = 80, aw = w - 80, ah = h - 210;
  if (t >= T.click && t < T.result + 0.2) {
    const q = seg(t, T.click, T.result);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 6; j++) { const v = 0.5 + 0.5 * Math.sin(t * 9 - i * 0.6 - j * 0.4); ctx.globalAlpha = clamp(p * 2) * v * (1 - seg(t, T.result, T.result + 0.2)) * Math.min(1, q * 3); ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(ax + 40 + i * 48, ay + 80 + j * 40, 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = clamp(p * 2);
  }
  if (t >= T.result) resultView(ctx, t, k, ax, ay, aw, ah, T.result);
  const iy = h - 106;
  ctx.fillStyle = C.panel2; rrect(ctx, 24, iy, w - 48, 82, 18); ctx.fill();
  const s = typed(d.prompt, t, T.typeStart, 32);
  ctx.font = '26px IM';
  if (!s) text(ctx, 'Frag den Doc …', 52, iy + 50, 26, 'IM', '#6A6A6E');
  else text(ctx, s, 52, iy + 50, 26, 'IM', '#fff');
  if (t < T.click && t > T.typeStart - 0.3 && Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(54 + ctx.measureText(s).width, iy + 24, 2.5, 34); }
  const bxr = w - 70, byr = iy + 41, press = t >= T.click && t < T.click + 0.2 ? Math.sin(Math.PI * seg(t, T.click, T.click + 0.2)) : 0;
  ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(bxr, byr, 24 * (1 - press * 0.15), 0, 7); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bxr, byr + 10); ctx.lineTo(bxr, byr - 10); ctx.moveTo(bxr - 8, byr - 2); ctx.lineTo(bxr, byr - 10); ctx.lineTo(bxr + 8, byr - 2); ctx.stroke();
  ctx.restore();
  ctx.font = '26px IM';
  return { tx: x + 54 + ctx.measureText(s).width, ty: y + iy + 50, bx: x + bxr, by: y + byr };
}


function zone(ctx, t, k) {
  const T = times(k), d = DATA[k];
  const tin = easeOut(seg(t, T.start + 0.5, T.start + 1.0));
  text(ctx, `Frame · Schritt ${k}`, -900, -470, 17, 'IM', C.gray, 'left', tin);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -440, 88, 70, 16); ctx.fill(); text(ctx, `0${k}`, -856, -390, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -790, -385, 60, 'IXB', C.ink);
  ctx.restore();
  const q = quoteNote(ctx, t, k, -900, -330, 760, T);
  const y2 = -90 + (q.h ? q.h - 170 : 0);
  leftCard(ctx, t, k, -900, y2, 420, 330, T.L[0].t + 0.6, T);
  const ck = checklist(ctx, t, k, -460, y2, 400, T);
  const pn = panel(ctx, t, k, 20, -400, 900, 760, T);
  cursor(ctx, q.cx, q.cy, d.who, easeOut(seg(t, T.start + 0.3, T.start + 0.9)) * (1 - easeOut(seg(t, T.qEnd + 0.3, T.qEnd + 0.8))));
  let dx, dy, press = 0;
  if (t < T.pStart) { dx = 600; dy = 420; }
  else if (t < T.click) { const u = easeOut(seg(t, T.pStart, T.typeStart)); dx = lerp(600, pn.tx ?? 400, u); dy = lerp(420, (pn.ty ?? 300) + 10, u); }
  else if (t < T.click + 0.5) { const u = easeOut(seg(t, T.typeEnd, T.click)); dx = lerp(pn.tx ?? 400, pn.bx, u); dy = lerp((pn.ty ?? 300) + 10, pn.by, u); press = t >= T.click ? Math.sin(Math.PI * seg(t, T.click, T.click + 0.2)) : 0; }
  else if (t < T.checkStart) { dx = pn.bx - 60; dy = pn.by - 60; }
  else { const u = easeOut(seg(t, T.checkStart - 0.4, T.checkStart)); dx = lerp(pn.bx - 60, ck[0], u); dy = lerp(pn.by - 60, ck[1], u); }
  const lastCheck = T.checkStart + (d.check.length - 1) * T.checkStep + 0.6;
  cursor(ctx, dx, dy, 'Doc', easeOut(seg(t, T.pStart - 0.4, T.pStart)) * (1 - easeOut(seg(t, lastCheck, lastCheck + 0.5))), press);
}

// ----- Intro: Titel, großes Manometer zittert zu tief, springt ins Rote, dann ok -----
function zoneIntro(ctx, t) {
  const c = CH[0];
  const box = easeOut(seg(t, 0.3, 0.9)), w1 = 'Der Handwerksdoktor', s1 = typed(w1, t, 0.9, 26);
  const av = spring(seg(t, 0.4, 1.0));
  if (av > 0) { ctx.save(); ctx.translate(-800, -350); ctx.scale(av, av); ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -40, -40, 80, 80); ctx.restore(); }
  const tw = text(ctx, s1, -740, -334, 46, 'IXB', C.ink, 'left', box);
  if (t < 2.2) selection(ctx, -750, -384, Math.max(40, tw + 20), 70, box);
  ctx.font = '46px IXB'; const nx = -740 + ctx.measureText(w1).width + 20;
  ctx.font = '42px IR'; const ux = nx + ctx.measureText('über').width + 18;
  text(ctx, 'über', nx, -334, 42, 'IR', C.gray, 'left', easeOut(seg(t, 2.0, 2.4)));
  text(ctx, typed('Heizungsdruck', t, 2.5, 24), ux, -334, 46, 'IXB', C.ink, 'left', 1);
  const tp = seg(t, c.L[0].t + 0.2, c.L[0].t + 0.7);
  if (tp > 0) {
    ctx.save(); ctx.globalAlpha = easeOut(tp);
    text(ctx, 'Heizungsdruck:', -860, -150, 104, 'IXB', C.ink);
    const t2 = easeOut(seg(t, c.L[0].t + 1.2, c.L[0].t + 1.7)); ctx.globalAlpha = t2;
    ctx.font = '84px IXB'; const w2 = ctx.measureText('zu niedrig').width, w3 = ctx.measureText(' oder ').width, w4 = ctx.measureText('zu hoch?').width;
    ctx.fillStyle = '#2346E8'; rrect(ctx, -876, -84, w2 + 32, 108, 22); ctx.fill(); text(ctx, 'zu niedrig', -860, 0, 84, 'IXB', '#fff');
    text(ctx, ' oder ', -860 + w2, 0, 84, 'IXB', C.ink);
    ctx.fillStyle = '#E4302B'; rrect(ctx, -876 + w2 + w3, -84, w4 + 32, 108, 22); ctx.fill(); text(ctx, 'zu hoch?', -860 + w2 + w3, 0, 84, 'IXB', '#fff');
    ctx.restore();
  }
  const gp = spring(seg(t, c.L[0].t - 0.3, c.L[0].t + 0.3));
  if (gp > 0) {
    ctx.save(); ctx.globalAlpha = clamp(gp * 2); ctx.translate(560, -110); ctx.scale(gp, gp);
    const L0 = c.L[0].t, v = t < L0 + 1.4 ? 0.6 : lerp(2.8, 1.6, easeInOut(seg(t, c.L[1].t + 0.5, c.L[1].t + 2.0)));
    const jump = easeOut(seg(t, L0 + 1.4, L0 + 1.8)), val = t < L0 + 1.4 ? v : lerp(0.6, v, jump);
    manometer(ctx, 0, 0, 230, val, { t, shake: val < 1 || val > 2.2 ? 1 : 0 }); ctx.restore();
  }
  ['Lesen', 'Nachfüllen', 'Systemtrenner', 'Ablassen', 'Ständig?'].forEach((s, i) => {
    const q = spring(seg(t, c.L[1].t + 0.6 + i * 0.35, c.L[1].t + 1.1 + i * 0.35)); if (q <= 0) return;
    ctx.save(); ctx.font = '26px ISB'; const w = ctx.measureText(s).width + 70; const px = [-860, -650, -390, -50, 200][i];
    ctx.translate(px, 250); ctx.scale(q, q);
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -28, w, 56, 28); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(26, 0, 15, 0, 7); ctx.fill(); text(ctx, `${i + 1}`, 26, 7, 18, 'IXB', C.lime, 'center');
    text(ctx, s, 52, 9, 26, 'ISB', C.ink); ctx.restore();
  });
  const dx = t < 3.4 ? -740 + tw + 10 : lerp(-740 + tw + 10, 560, easeOut(seg(t, 3.4, 4.2))), dy = t < 3.4 ? -350 : lerp(-350, 120, easeOut(seg(t, 3.4, 4.2)));
  cursor(ctx, dx, dy, 'Doc', 1 - easeOut(seg(t, 4.6, 5.1)));
}

function outroOverlay(ctx, t) {
  const c = CH[OUT];
  const p = spring(seg(t, c.L[0].t - 0.2, c.L[0].t + 0.4)), endP = spring(seg(t, c.L[1].t, c.L[1].t + 0.6));
  if (p > 0 && endP < 1) {
    const rows = [['markierung', 'Markierung lesen'], ['mit', 'Mit gefülltem Schlauch nachfüllen'], ['bei', 'Zu viel Druck? Etwas ablassen'], ['wenn', 'Fällt oder steigt ständig? Fachbetrieb']];
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * (1 - endP); ctx.translate(CX, CY - 40); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p));
    shadow(ctx, 0.3, 60, 20); ctx.fillStyle = C.panel; rrect(ctx, -520, -290, 1040, 560, 26); ctx.fill(); noShadow(ctx);
    text(ctx, 'KURZ GESAGT', -450, -222, 18, 'ISB', '#9A9A9A', 'left', 1, 3);
    rows.forEach(([w, s], i) => {
      const ti = wordTime('c6_0', w, 0, c.L[0].t + 0.9 + i * 1.8) - 0.1, on = easeOut(seg(t, ti, ti + 0.3)), yy = -150 + i * 100;
      ctx.fillStyle = on > 0.5 ? C.lime : '#2A2A2D'; rrect(ctx, -450, yy - 30, 46, 46, 12); ctx.fill();
      if (on > 0) { ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-439, yy - 7); ctx.lineTo(-430, yy + 3); ctx.lineTo(-416, yy - 16); ctx.stroke(); }
      text(ctx, s, -380, yy + 6, 40, 'IXB', on > 0.5 ? '#fff' : '#6A6A6E');
    });
    ctx.restore();
  }
  if (endP > 0) {
    ctx.save(); ctx.globalAlpha = clamp(endP * 2);
    ctx.fillStyle = 'rgba(228,228,228,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(CX, CY - 60); ctx.scale(endP, endP);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -90, 110, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -110, -200, 220, 220); ctx.restore();
    ctx.strokeStyle = C.lime; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -90, 114, 0, 7); ctx.stroke();
    text(ctx, 'Der Handwerksdoktor', 0, 90, 60, 'IXB', C.ink, 'center');
    text(ctx, '@derhandwerksdoktor', 0, 140, 28, 'IM', C.gray, 'center');
    const bp = spring(seg(t, c.L[1].t + 3.0, c.L[1].t + 3.6));
    if (bp > 0) { ctx.save(); ctx.translate(0, 230); ctx.scale(bp, bp); ctx.fillStyle = C.ink; rrect(ctx, -170, -40, 340, 80, 40); ctx.fill(); text(ctx, 'Abonnieren', 0, 13, 32, 'IXB', C.lime, 'center'); ctx.restore(); }
    ctx.restore();
    const cu = easeOut(seg(t, c.L[1].t + 3.5, c.L[1].t + 4.3)), clickT = c.L[1].t + 4.4;
    if (cu > 0) cursor(ctx, lerp(1500, CX + 90, cu), lerp(1000, CY + 185, cu), 'Doc', 1, t > clickT ? Math.sin(Math.PI * seg(t, clickT, clickT + 0.2)) : 0);
  }
}

// ---------- Mitlaufende Untertitel (Wort-Timing aus captions.py / Whisper) ----------
const CAPS = (() => {
  const f = path.join(DIR, 'captions.json');
  if (!fs.existsSync(f)) return [];
  const start = Object.fromEntries(SEC.chapters.flatMap((c) => c.lines.map((l) => [l.id, l.t])));
  const chunks = [];
  for (const line of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    for (const w of line.words) {
      const word = { w: w.w.toUpperCase(), s: start[line.id] + w.s, e: start[line.id] + w.e };
      if (cur.length && (cur.length >= 3 || [...cur, word].map((x) => x.w).join(' ').length > 22)) flush();
      cur.push(word);
      if (/[.,:;?!]$/.test(w.w)) flush();
    }
    flush();
  }
  return chunks.map((ws, i) => {
    const next = chunks[i + 1], end = ws[ws.length - 1].e;
    return { ws, t0: ws[0].s - 0.05, t1: next && next[0].s - end < 0.6 ? next[0].s - 0.05 : end + 0.3 };
  });
})();
// absolute Zeit, zu der im Satz <id> das n-te Wort beginnt, das mit <w> anfängt (für Einblendungen genau auf das Wort)
const WORDS = (() => {
  const f = path.join(DIR, 'captions.json');
  if (!fs.existsSync(f)) return {};
  const start = Object.fromEntries(SEC.chapters.flatMap((c) => c.lines.map((l) => [l.id, l.t])));
  return Object.fromEntries(JSON.parse(fs.readFileSync(f, 'utf8')).map((l) => [l.id, l.words.map((w) => ({ w: w.w.toLowerCase(), s: start[l.id] + w.s }))]));
})();
function wordTime(id, w, n = 0, fallback = 0) {
  const hits = (WORDS[id] || []).filter((x) => x.w.startsWith(w.toLowerCase()));
  return hits[n] ? hits[n].s : fallback;
}
function captions(ctx, t, y = 1000, size = 58) {
  const c = CAPS.find((k) => t >= k.t0 && t < k.t1);
  if (!c) return;
  const gap = size * 0.31, padX = size * 0.58;
  ctx.font = `${size}px IXB`; ctx.letterSpacing = '-1px';
  const ws = c.ws.map((w) => ({ ...w, wd: ctx.measureText(w.w).width }));
  const total = ws.reduce((a, w) => a + w.wd, 0) + gap * (ws.length - 1);
  const pop = spring(seg(t, c.t0, c.t0 + 0.18));
  ctx.save(); ctx.translate(ctx.canvas.width / 2, y); ctx.scale(lerp(0.8, 1, pop), lerp(0.8, 1, pop)); ctx.globalAlpha = clamp(pop * 1.5);
  shadow(ctx, 0.28, 24, 8); ctx.fillStyle = C.panel; rrect(ctx, -total / 2 - padX, -size * 0.92, total + padX * 2, size * 1.5, size * 0.38); ctx.fill(); noShadow(ctx);
  let x = -total / 2;
  ws.forEach((w, i) => {
    const active = t >= w.s && (i === ws.length - 1 || t < ws[i + 1].s), said = t >= w.s;
    const sc = active ? 1 + 0.14 * Math.min(1, 150 / w.wd) * (1 - easeOut(seg(t, w.s, w.s + 0.16))) : 1;
    ctx.save(); ctx.translate(x + w.wd / 2, -size * 0.17); ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(pop * 1.5) * (said ? 1 : 0.42);
    ctx.fillStyle = active ? C.lime : C.white; ctx.fillText(w.w, -w.wd / 2, size * 0.36);
    ctx.restore();
    x += w.wd + gap;
  });
  ctx.letterSpacing = '0px'; ctx.restore();
}

let BLUR_CANVAS = null;
function drawFrame(out, t) {
  const cam = camera(t);
  // Unschärfe einmal auf das fertige Board (pro Zeichenbefehl wäre sie sehr langsam)
  const blurred = cam.blur > 0.4;
  if (blurred) BLUR_CANVAS ??= createCanvas(W, H);
  const ctx = blurred ? BLUR_CANVAS.getContext('2d') : out;
  for (const c of new Set([ctx, out])) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; noShadow(c); }
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(CX, CY); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  const viewW = W / cam.zoom / 2 + 1200, viewH = H / cam.zoom / 2 + 900;
  ZONES.forEach(([zx, zy], k) => {
    if (Math.abs(zx - cam.x) > viewW || Math.abs(zy - cam.y) > viewH) return;
    ctx.save(); ctx.translate(zx, zy);
    if (cam.zoom < 0.5) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, -960, -520, 1920, 1040, 30); ctx.fill(); ctx.strokeStyle = 'rgba(76,141,255,0.6)'; ctx.lineWidth = 8; ctx.stroke(); }
    const tt = k === 0 ? Math.min(t, CH[1].start + PAN) : Math.min(t, CH[k + 1].start + PAN);
    if (k === 0) zoneIntro(ctx, tt); else zone(ctx, tt, k);
    ctx.restore();
  });
  ctx.restore();
  if (blurred) { out.fillStyle = C.bg; out.fillRect(0, 0, W, H); out.filter = `blur(${cam.blur.toFixed(1)}px)`; out.drawImage(BLUR_CANVAS, 0, 0); out.filter = 'none'; }
  if (t >= CH[OUT].start) outroOverlay(out, t);
  captions(out, t);
}

// ---------- Sounds ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  for (let i = 0; i < 19; i += 2) add(0.9 + i / 26, 'key', 0.18);
  add(CH[0].L[0].t + 1.4, 'thump', 0.25);
  for (let k = 1; k <= 5; k++) {
    const T = times(k);
    add(T.start + 0.1, 'whoosh', 0.35);
    for (let i = 0; i < DATA[k].quote.length; i += 3) add(T.qStart + i / 30, 'key', 0.14);
    add(T.L[0].t + 0.6, 'pop', 0.25);
    for (let i = 0; i < DATA[k].prompt.length; i += 3) add(T.typeStart + i / 32, 'key', 0.14);
    add(T.click, 'click', 0.45);
    for (let i = 0; i < DATA[k].check.length; i++) add(T.checkStart + i * T.checkStep, 'blip', 0.18);
  }
  add(times(2).L[2].t + 2.6, 'gluck', 0.2); add(times(4).L[1].t + 1.2, 'gluck', 0.2); add(times(3).L[2].t + 2.3, 'hiss', 0.2);
  add(CH[OUT].start + 0.1, 'whoosh', 0.4);
  for (const w of ['markierung', 'mit', 'bei', 'wenn']) add(wordTime('c6_0', w, 0, CH[OUT].L[0].t + 1), 'blip', 0.18);
  add(CH[OUT].L[1].t + 4.4, 'click', 0.45);
  return c.sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  const vo = SEC.chapters.flatMap((c) => c.lines.map((l) => ({ id: l.id, t: l.t })));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, chapters: SEC.chapters.map((c) => ({ ch: c.ch, title: c.title, start: c.start })), vo }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times_ = args[0] === '--still' ? args[1].split(',').map(Number) : SEC.chapters.flatMap((c) => c.lines.map((l) => l.t + l.dur * 0.85));
    const files = [];
    for (const t of times_) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
    if (args[0] === '--contact') {
      const tw = 480, th = 270, cols = 5, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw - 4, th - 4); const m = Math.floor(t / 60); sc.fillStyle = '#fff'; sc.font = '20px IM'; sc.fillText(`${m}:${(t % 60).toFixed(1).padStart(4, '0')}`, x + 6, y + 22);
        fs.unlinkSync(f);
      }
      const o = path.join(DIR, 'out', 'contact_sheet.png'); fs.writeFileSync(o, await sheet.encode('png')); console.log(o);
    } else console.log(files.map(([f]) => f).join('\n'));
    return;
  }
  const from = arg('--from', 0), to = arg('--to', DUR);
  const outFile = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let n = Math.round(from * FPS); n < Math.round(to * FPS); n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 600 === 0) process.stdout.write(`\r${(n / FPS).toFixed(0)} / ${to.toFixed(0)} s (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

export { manometer, gaugeValue, fillPath, trennerDrawing, drainDrawing, vesselDrawing, thermalFrame, DATA, CH, SEC, times, radiator, FIELD, fixed, heat, captions, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow, pill, photoCard, cover, spring, seg, easeOut, easeInOut, lerp, clamp, WARM };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
