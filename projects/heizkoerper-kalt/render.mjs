// „Heizkörper wird nicht warm? 5 Ursachen, die du selbst prüfen kannst“, YouTube 16:9.
// Grammatik wie projects/klima-probleme (refs/ref-08): Board mit Cursorn, getippten Notizen, dunklem Diagnose-Panel.
// Neu: animierter Wärmebild-Heizkörper, der pro Ursache das Symptom zeigt und nach der Lösung warm wird.
// Feste Kamera, nur aktive Cursor, mitlaufende Untertitel. Fakten: shotlist.md, Fotos: photos/credits.json.
//   node projects/heizkoerper-kalt/render.mjs --timeline | --contact | --still 20,50 | [--from s --to s]
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
const ZONES = [[0, 0], [2400, 350], [4800, -150], [7200, 300], [9600, -200], [12000, 250], [14400, -100]];

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
    x = lerp(last[0], 7200, u); y = lerp(last[1], 100, u); zoom = lerp(1, 0.112, u);
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
  IMG.radiator = await ph('Radiator-250558_1280.jpg');
  IMG.thermostat = await ph('247_Home_Rescue_radiator_thermostat.jpg');
  IMG.bleed = await ph('Bleedscrew_in_use.jpg');
  IMG.gauge = await ph('A_pressure_gauge_attached_to_a_heating_system.jpg');
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

// ================= Inhalte der Kapitel =================
const DATA = {
  1: { title: 'Luft', who: 'Mieterin', quote: 'Gluckert und bleibt oben kalt.', src: 'Symptom', mode: 'air', result: 'luft',
    prompt: 'Heizkörper gluckert, oben kalt. Warum?', check: ['Thermostat voll auf', 'Pumpe aus, kurz warten', 'Ventil öffnen, bis Wasser kommt', 'Danach Druck prüfen'] },
  2: { title: 'Ventilstift klemmt', who: 'Nachbar', quote: 'Seit dem Sommer komplett kalt, obwohl auf 5.', src: 'Symptom', mode: 'stuck', result: 'stift',
    prompt: 'Heizkörper bleibt ganz kalt. Was tun?', check: ['Thermostatkopf abschrauben', 'Stift ca. 5 mm? Federt er?', 'Vorsichtig mit Zange bewegen', 'Kopf wieder aufsetzen'] },
  3: { title: 'Zu wenig Druck', who: 'Mieterin', quote: 'Gleich mehrere Heizkörper nur lauwarm.', src: 'Symptom', mode: 'weak', result: 'druck',
    prompt: 'Mehrere Heizkörper werden nur lauwarm.', check: ['Manometer ablesen', 'Unter der Markierung?', 'Wasser nachfüllen', 'Mieter: Vermieter informieren'] },
  4: { title: 'Nur der letzte bleibt kalt', who: 'Nachbar', quote: 'Nur der hinterste Heizkörper wird nie warm.', src: 'Symptom', mode: 'last', result: 'abgleich',
    prompt: 'Nur der letzte Heizkörper bleibt kalt.', check: ['Ist es immer der letzte?', 'Dort Thermostat ganz auf', 'Fachbetrieb: hydr. Abgleich', 'Durchfluss je Heizkörper'] },
  5: { title: 'Unten dauerhaft kalt', who: 'Mieterin', quote: 'Oben warm, unten dauerhaft kalt.', src: 'Symptom', mode: 'sludge', result: 'schlamm',
    prompt: 'Unten bleibt der Heizkörper kalt.', check: ['Oben etwas wärmer = normal', 'Unten dauerhaft kalt?', 'Erst entlüften, Ventil prüfen', 'Spülen: Fachbetrieb'] },
  6: { title: 'Die Mieter-Frage', who: 'Mieterin', quote: 'Woher weiß ich als Mieter, welcher Heizkörper am nächsten an der Heizung ist?', src: 'Häufige Frage aus den Kommentaren · sinngemäß',
    mode: 'house', result: 'mieter', prompt: 'Welchen Heizkörper zuerst entlüften?', checkTitle: 'SCHNELLER CHECK', check: ['Thermostat nicht verdecken', 'Abstand zu Möbeln: ca. 30 cm'] },
};

function times(k) {
  const c = CH[k], L = c.L, last = L[L.length - 1], n = DATA[k].check.length;
  const qStart = L[0].t + 1.6, qEnd = qStart + DATA[k].quote.length / 30;
  const pStart = L[1].t - 0.2, typeStart = L[1].t + 0.2, typeEnd = typeStart + DATA[k].prompt.length / 32, click = typeEnd + 0.25, result = click + 0.7;
  const checkStart = last.t + 0.3, checkStep = Math.max(0.55, (last.e - checkStart - 0.4) / n);
  const fixAt = checkStart + (n - 1) * checkStep + 0.4;
  return { c, qStart, qEnd, pStart, typeStart, typeEnd, click, result, checkStart, checkStep, fixAt, end: c.end, start: c.start, L };
}

// ----- Symptom-Karte (Wärmebild) links -----
function symptomCard(ctx, t, k, x, y, w, h, tin, T) {
  const d = DATA[k], p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  if (d.mode === 'house') houseCard(ctx, t, w, h, T);
  else {
    const f = thermalFrame(ctx, 0, 0, w, h), fix = T.fixAt;
    ctx.save(); rrect(ctx, f.vx, f.vy, f.vw, f.vh, 10); ctx.clip();
    if (d.mode === 'air' || d.mode === 'stuck' || d.mode === 'sludge') {
      const rx = f.vx + f.vw * 0.12, ry = f.vy + f.vh * 0.16, rw = f.vw * 0.66, rh = f.vh * 0.68;
      radiator(ctx, rx, ry, rw, rh, fixed(FIELD[d.mode](t), t, fix), 11, { level: 5 });
      if (d.mode === 'air' && t < fix + 1) { ctx.globalAlpha = 1 - seg(t, fix, fix + 1); bubbles(ctx, rx, ry, rw, rh, t); ctx.globalAlpha = 1; }
      if (d.mode === 'sludge') sludgeDots(ctx, rx, ry + rh * 0.66, rw, rh * 0.34, 1 - seg(t, fix, fix + 2));
    }
    if (d.mode === 'weak') {
      for (let j = 0; j < 3; j++) radiator(ctx, f.vx + 18 + j * (f.vw - 36) / 3, f.vy + f.vh * 0.3 + (j % 2) * 10, (f.vw - 36) / 3 - 22, f.vh * 0.42, fixed(FIELD.weak(t, j), t, fix + j * 0.3), 6);
    }
    if (d.mode === 'last') lastRow(ctx, t, f.vx + 10, f.vy + 30, f.vw - 20, f.vh - 50, fix, false);
    ctx.restore();
  }
  ctx.restore();
  const sel = 1 - seg(t, tin + 0.9, tin + 1.2);
  selection(ctx, x, y, w, h, sel * clamp(p * 2));
}
function sludgeDots(ctx, x, y, w, h, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#7a4a1e';
  for (let i = 0; i < 46; i++) { ctx.beginPath(); ctx.arc(x + ((i * 61) % 100) / 100 * w, y + h * (0.35 + ((i * 37) % 60) / 100), 2 + (i % 3), 0, 7); ctx.fill(); }
  ctx.restore();
}
// Strang: Heizung links, 4 Heizkörper; der letzte bleibt kalt, bis der Abgleich kommt
function lastRow(ctx, t, x, y, w, h, fixAt, big) {
  const temps = [0.9, 0.82, 0.68, 0.14], after = [0.84, 0.82, 0.81, 0.8], q = fixAt == null ? 0 : easeInOut(seg(t, fixAt, fixAt + 2.2));
  const bw = w * 0.15, rw = (w - bw - 30) / 4 - 14, py = y + h * 0.86;
  ctx.fillStyle = '#3a3f52'; rrect(ctx, x, y + h * 0.35, bw, h * 0.55, 8); ctx.fill();
  text(ctx, 'Heizung', x + bw / 2, y + h * 0.35 - 10, big ? 18 : 12, 'ISB', '#AFB6C8', 'center');
  ctx.strokeStyle = heat(0.82); ctx.lineWidth = big ? 8 : 5; ctx.beginPath(); ctx.moveTo(x + bw, py); ctx.lineTo(x + w, py); ctx.stroke();
  // Wasser-Teilchen: viele vorn, wenige hinten (vor dem Abgleich)
  for (let i = 0; i < 24; i++) {
    const ph = (t * 0.35 + i / 24) % 1, reach = lerp(0.55 + 0.45 * ((i % 4) / 3) ** 3, 1, q);
    if (ph > reach) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x + bw + ph * (w - bw), py, big ? 4 : 2.5, 0, 7); ctx.fill();
  }
  for (let j = 0; j < 4; j++) {
    const rx = x + bw + 30 + j * (rw + 14), v = lerp(temps[j], after[j], q);
    radiator(ctx, rx, y + h * 0.3, rw, h * 0.46, (u, vv) => v - 0.1 * vv, big ? 7 : 5);
    ctx.strokeStyle = heat(0.7); ctx.lineWidth = big ? 4 : 3; ctx.beginPath(); ctx.moveTo(rx + rw / 2, y + h * 0.76); ctx.lineTo(rx + rw / 2, py); ctx.stroke();
    if (big && q > 0) {   // Voreinstell-Ventil über jedem Heizkörper dreht sich
      const a = clamp(q * 2), cx0 = rx + rw / 2, cy0 = y + h * 0.18;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.panel2; ctx.beginPath(); ctx.arc(cx0, cy0, 20, 0, 7); ctx.fill();
      ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx0, cy0, 20, 0, 7); ctx.stroke();
      const ang = -Math.PI / 2 + q * (1 + j * 0.9); ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + Math.cos(ang) * 14, cy0 + Math.sin(ang) * 14); ctx.stroke(); ctx.restore();
    }
  }
}
// Mieter-Frage: Haus im Schnitt, drei Wohnungen, Heizung im Keller, deine Wohnung markiert
function houseCard(ctx, t, w, h, T) {
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  text(ctx, 'MEHRFAMILIENHAUS', 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
  const hx = 40, hy = 70, hw = w - 80, fh = (h - 110) / 4;
  ctx.strokeStyle = '#2A2A2D'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(hx - 10, hy + 10); ctx.lineTo(hx + hw / 2, hy - 30); ctx.lineTo(hx + hw + 10, hy + 10); ctx.stroke();
  for (let f = 0; f < 4; f++) {
    const fy = hy + 10 + f * fh, mine = f === 1;
    ctx.fillStyle = mine ? 'rgba(207,247,42,0.35)' : '#F3F3F3'; ctx.fillRect(hx, fy, hw, fh - 6);
    ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 2; ctx.strokeRect(hx, fy, hw, fh - 6);
    if (f < 3) for (let r = 0; r < 3; r++) { ctx.fillStyle = heat(0.75 - 0.05 * r); rrect(ctx, hx + 24 + r * (hw - 60) / 3, fy + fh - 34, 56, 20, 4); ctx.fill(); }
    if (f === 3) { ctx.fillStyle = '#3a3f52'; rrect(ctx, hx + hw - 90, fy + 8, 60, fh - 22, 6); ctx.fill(); text(ctx, 'Heizung', hx + hw - 100, fy + fh / 2 + 4, 14, 'ISB', C.gray, 'right'); }
    if (mine) text(ctx, 'Deine Wohnung', hx + 14, fy + 26, 16, 'ISB', C.ink);
  }
  // Rohr vom Keller nach oben
  ctx.strokeStyle = heat(0.8); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx + hw - 60, hy + 10 + 3 * fh + 8); ctx.lineTo(hx + hw - 60, hy + 20); ctx.stroke();
  const qp = 0.6 + 0.4 * Math.sin(t * 3) ** 2, gone = seg(t, T.L[1].t + 1.2, T.L[1].t + 1.8);
  if (gone < 1) { ctx.save(); ctx.globalAlpha = 1 - gone; text(ctx, '?', hx + hw - 130, hy + 10 + fh * 1.7, 60 * qp + 10, 'IXB', P.Mieterin, 'center'); ctx.restore(); }
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

// ----- Ergebnisse im dunklen Panel -----
function resultView(ctx, t, k, x, y, w, h, t0) {
  const r = DATA[k].result, L = CH[k].L, T = times(k);
  const a = (tt, len = 0.5) => easeOut(seg(t, tt, tt + len));
  const sp = (tt) => spring(seg(t, tt, tt + 0.55));
  ctx.save();
  if (r === 'luft') {
    text(ctx, 'URSACHE', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Luft im Heizkörper', x, y + 72, 34, 'IXB', '#fff', 'left', a(t0 + 0.1));
    const q = a(t0 + 0.3, 0.6);
    if (q > 0) {
      ctx.globalAlpha = q;
      const rx = x + 10, ry = y + 130, rw = 380, rh = 250;
      radiator(ctx, rx, ry, rw, rh, fixed(FIELD.air(t), t, T.fixAt), 10, { level: 5 });
      if (t < T.fixAt + 1) { ctx.globalAlpha = q * (1 - seg(t, T.fixAt, T.fixAt + 1)); bubbles(ctx, rx, ry, rw, rh, t, 12); }
      ctx.globalAlpha = q; text(ctx, 'Luft sammelt sich oben', rx, ry - 18, 20, 'ISB', '#CFCFCF');
      ctx.globalAlpha = 1;
    }
    photoCard(ctx, IMG.bleed, x + 440, y + 110, 360, 290, a(L[2].t, 0.6), 'Entlüftungsventil mit Vierkantschlüssel · Foto: Noggo, CC0', 0.3, 0.5);
    pill(ctx, '▶  Ausführlich: Video „Heizkörper entlüften in 7 Schritten“', x, y + h - 70, sp(L[2].t + 3.6), C.lime, 21);
  }
  if (r === 'stift') {
    text(ctx, 'URSACHE', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Ventilstift klemmt', x, y + 72, 34, 'IXB', '#fff', 'left', a(t0 + 0.1));
    text(ctx, 'typisch nach dem Sommer (Thermostat lange auf 0)', x, y + 108, 20, 'IM', '#AFAFAF', 'left', a(t0 + 0.3));
    photoCard(ctx, IMG.thermostat, x, y + 140, 330, 230, a(t0 + 0.4, 0.6), 'Thermostatkopf · Foto: 247homerescue, CC0', 0.8, 0.45, 1.25);
    valveDrawing(ctx, t, x + 400, y + 140, 400, 330, L);
  }
  if (r === 'druck') {
    text(ctx, 'URSACHE', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Zu wenig Druck in der Anlage', x, y + 72, 34, 'IXB', '#fff', 'left', a(t0 + 0.1));
    const g = a(t0 + 0.3, 0.6);
    if (g > 0) { ctx.globalAlpha = g; gaugeDrawing(ctx, t, x + 190, y + 300, 150, L); ctx.globalAlpha = 1; }
    text(ctx, 'meist 1–2 bar', x + 190, y + 500, 30, 'IXB', C.lime, 'center', a(L[1].t + 1.2));
    text(ctx, 'maßgeblich: Markierung an deinem Gerät', x + 190, y + 536, 19, 'IM', '#CFCFCF', 'center', a(L[1].t + 3.4));
    photoCard(ctx, IMG.gauge, x + 470, y + 110, 300, 300, a(L[0].t + 3.5, 0.6), 'Manometer · Foto: Shixart1985, CC BY 2.0', 0.48, 0.5, 1.5);
    pill(ctx, 'Mietwohnung: Sache des Vermieters', x + 470, y + 448, sp(L[2].t + 3.0), C.lime, 17);
  }
  if (r === 'abgleich') {
    text(ctx, 'URSACHE', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Wasser nimmt den bequemsten Weg', x, y + 72, 34, 'IXB', '#fff', 'left', a(t0 + 0.1));
    const q = a(t0 + 0.3, 0.6);
    if (q > 0) { ctx.globalAlpha = q; lastRow(ctx, t, x, y + 110, w - 20, 330, L[2].t + 1.6, true); ctx.globalAlpha = 1; }
    text(ctx, 'Hydraulischer Abgleich: Fachbetrieb stellt den Durchfluss je Heizkörper ein', x, y + 490, 21, 'ISB', C.lime, 'left', a(L[2].t + 2.8));
  }
  if (r === 'schlamm') {
    text(ctx, 'URSACHE', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    text(ctx, 'Ablagerungen (Schlamm)', x, y + 72, 34, 'IXB', '#fff', 'left', a(t0 + 0.1));
    const n1 = a(t0 + 0.3, 0.6), n2 = a(L[1].t + 0.6, 0.6);
    if (n1 > 0) { ctx.globalAlpha = n1; radiator(ctx, x + 10, y + 150, 300, 200, FIELD.normal(), 8); text(ctx, 'normal: oben etwas wärmer', x + 10, y + 390, 20, 'ISB', '#CFCFCF'); ctx.globalAlpha = 1; }
    if (n2 > 0) {
      ctx.globalAlpha = n2; radiator(ctx, x + 400, y + 150, 300, 200, FIELD.sludge(t), 8); sludgeDots(ctx, x + 400, y + 150 + 200 * 0.66, 300, 200 * 0.34, 1);
      text(ctx, 'Problem: unten dauerhaft kalt', x + 400, y + 390, 20, 'ISB', C.red); ctx.globalAlpha = 1;
    }
    const b = a(L[2].t + 0.2, 0.8);
    if (b > 0) {
      ctx.globalAlpha = b; text(ctx, 'Leistung', x, y + 448, 18, 'ISB', '#9A9A9A');
      ctx.fillStyle = '#2A2A2D'; rrect(ctx, x + 100, y + 430, 520, 24, 12); ctx.fill();
      ctx.fillStyle = '#fff'; rrect(ctx, x + 100, y + 430, 520 * lerp(1, 0.7, easeOut(seg(t, L[2].t + 0.6, L[2].t + 1.6))), 24, 12); ctx.fill();
      text(ctx, 'bis zu −30 %', x + 640, y + 450, 24, 'IXB', C.red); ctx.globalAlpha = 1;
    }
    pill(ctx, 'Spülen: Fachbetrieb', x, y + h - 70, sp(L[2].t + 2.4), C.lime, 21);
  }
  if (r === 'mieter') {
    text(ctx, 'DIE EHRLICHE ANTWORT', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(t0), 2);
    const big = sp(L[1].t + 1.3);
    if (big > 0) { ctx.save(); ctx.globalAlpha = clamp(big * 2); ctx.translate(x, y + 96); ctx.scale(lerp(0.85, 1, big), lerp(0.85, 1, big)); text(ctx, 'Musst du nicht wissen.', 0, 0, 52, 'IXB', C.lime); ctx.restore(); }
    [['1', 'Alle Heizkörper deiner Wohnung nacheinander entlüften', L[1].t + 3.2], ['2', 'Den höchsten am Schluss noch einmal prüfen', L[1].t + 5.4],
      ['3', 'Druck und Abgleich: Sache des Vermieters', L[2].t + 0.2]].forEach(([n, s, tt], i) => {
      const q = sp(tt); if (q <= 0) return;
      const yy = y + 150 + i * 100; ctx.save(); ctx.globalAlpha = clamp(q * 2); ctx.translate((1 - q) * 30, 0);
      ctx.fillStyle = C.panel2; rrect(ctx, x, yy, w - 20, 80, 14); ctx.fill();
      ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(x + 44, yy + 40, 22, 0, 7); ctx.fill(); text(ctx, n, x + 44, yy + 49, 24, 'IXB', C.ink, 'center');
      text(ctx, s, x + 86, yy + 49, 25, 'ISB', '#fff'); ctx.restore();
    });
    text(ctx, 'Zur Reihenfolge sind sich Hersteller und Ratgeber uneins (unten vs. oben anfangen).', x, y + h - 18, 17, 'IM', '#8A8A8E', 'left', a(L[2].t + 1.0));
  }
  ctx.restore();
}
// Ventil mit Stift: Kopf ab, Maß ca. 5 mm, Zange bewegt den Stift, danach federt er
function valveDrawing(ctx, t, x, y, w, h, L) {
  const app = easeOut(seg(t, L[1].t - 0.2, L[1].t + 0.4)); if (app <= 0) return;
  ctx.save(); ctx.globalAlpha *= app;
  const cx = x + w * 0.45, base = y + h * 0.78;
  // Ventilkörper mit Gewinde
  ctx.fillStyle = '#5C6170'; rrect(ctx, cx - 70, base - 40, 140, 80, 12); ctx.fill();
  ctx.fillStyle = '#8A90A0'; rrect(ctx, cx - 46, base - 120, 92, 84, 8); ctx.fill();
  ctx.strokeStyle = '#6E7484'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx - 46, base - 112 + i * 13); ctx.lineTo(cx + 46, base - 106 + i * 13); ctx.stroke(); }
  // Stift: klemmt (rot) bis L2+2.6, dann federt er (Limette)
  const free = t > L[2].t + 2.6, wig = t > L[2].t + 0.4 && !free ? Math.sin(t * 22) * 3 : 0;
  const bounce = free ? Math.sin((t - L[2].t - 2.6) * 14) * Math.exp(-(t - L[2].t - 2.6) * 3) * 10 : 0;
  const pinTop = base - 120 - 50 + bounce;
  ctx.fillStyle = free ? C.lime : '#D9DCE3'; rrect(ctx, cx - 8 + wig, pinTop, 16, 52, 6); ctx.fill();
  if (!free && t > L[2].t - 0.4) { ctx.strokeStyle = C.red; ctx.lineWidth = 3; rrect(ctx, cx - 14 + wig, pinTop - 6, 28, 64, 8); ctx.stroke(); text(ctx, 'klemmt', cx + 30, pinTop + 20, 20, 'ISB', C.red); }
  if (free) text(ctx, 'federt ✓', cx + 80, base - 130, 26, 'IXB', C.lime);
  // Kopf: sitzt drauf, wird abgeschraubt (dreht und hebt ab)
  const off = easeInOut(seg(t, L[1].t + 0.2, L[1].t + 1.6)), back = easeInOut(seg(t, L[2].t + 3.6, L[2].t + 4.6));
  const lift = lerp(off * 180, 0, back), ha = 1 - off * 0.85 + back * 0.85;
  if (ha > 0.02) { ctx.save(); ctx.globalAlpha *= ha; ctx.translate(cx + off * 120 * (1 - back), base - 150 - lift); ctx.rotate(off * 0.5 * (1 - back)); ctx.fillStyle = '#F2F2F2'; rrect(ctx, -58, -110, 116, 130, 22); ctx.fill(); ctx.fillStyle = '#C9C9C9'; for (let i = -2; i <= 2; i++) rrect(ctx, i * 18 - 3, -96, 6, 70, 3), ctx.fill(); text(ctx, '5', 0, 2, 26, 'IXB', '#555', 'center'); ctx.restore(); }
  // Maß ca. 5 mm
  const m = easeOut(seg(t, L[1].t + 3.6, L[1].t + 4.2));
  if (m > 0 && !free) {
    ctx.save(); ctx.globalAlpha *= m; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; const mx = cx - 60;
    ctx.beginPath(); ctx.moveTo(mx, pinTop); ctx.lineTo(mx, base - 120); ctx.moveTo(mx - 8, pinTop); ctx.lineTo(mx + 8, pinTop); ctx.moveTo(mx - 8, base - 120); ctx.lineTo(mx + 8, base - 120); ctx.stroke();
    text(ctx, 'ca. 5 mm', mx - 14, (pinTop + base - 120) / 2 + 8, 22, 'IXB', '#fff', 'right'); ctx.restore();
  }
  // Zange greift den Stift
  const z = easeOut(seg(t, L[2].t + 0.1, L[2].t + 0.5)) * (1 - easeOut(seg(t, L[2].t + 2.6, L[2].t + 3.1)));
  if (z > 0) {
    ctx.save(); ctx.globalAlpha *= z; ctx.translate(cx + 14 + wig, pinTop + 18); ctx.rotate(-0.5);
    ctx.fillStyle = '#E4572E'; rrect(ctx, 30, -10, 150, 18, 8); ctx.fill(); rrect(ctx, 30, 8, 150, 18, 8); ctx.fill();
    ctx.fillStyle = '#9AA0AE'; rrect(ctx, 0, -8, 40, 14, 4); ctx.fill(); rrect(ctx, 0, 6, 40, 14, 4); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
// Manometer 0–4 bar, grüner Bereich 1–2 bar; Nadel steht zu tief und steigt nach dem Nachfüllen
function gaugeDrawing(ctx, t, cx, cy, r, L) {
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = (b) => lerp(a0, a1, b / 4);
  ctx.fillStyle = '#F4F4F2'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3A3A3D'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#2FCB78'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, r - 26, ang(1), ang(2)); ctx.stroke();
  ctx.strokeStyle = '#E4572E'; ctx.beginPath(); ctx.arc(cx, cy, r - 26, ang(3), ang(4)); ctx.stroke();
  for (let b = 0; b <= 4; b += 0.5) {
    const an = ang(b), r1 = r - 14, r2 = b % 1 ? r - 30 : r - 40;
    ctx.strokeStyle = '#2A2A2D'; ctx.lineWidth = b % 1 ? 2 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.lineTo(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2); ctx.stroke();
    if (!(b % 1)) text(ctx, String(b), cx + Math.cos(an) * (r - 64), cy + Math.sin(an) * (r - 64) + 9, 26, 'IXB', '#2A2A2D', 'center');
  }
  text(ctx, 'bar', cx, cy + 62, 22, 'ISB', '#6A6A6E', 'center');
  const val = lerp(0.6 + 0.04 * Math.sin(t * 5), 1.5, easeInOut(seg(t, L[2].t + 1.8, L[2].t + 3.3)));
  const an = ang(val); ctx.strokeStyle = val < 1 ? '#E4572E' : '#161616'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * (r - 44), cy + Math.sin(an) * (r - 44)); ctx.stroke();
  ctx.fillStyle = '#161616'; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
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
  text(ctx, k < 6 ? `Frame · Ursache ${k}` : 'Frame · Bonus', -900, -470, 17, 'IM', C.gray, 'left', tin);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -440, 88, 70, 16); ctx.fill(); text(ctx, k < 6 ? `0${k}` : '?', -856, -390, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -790, -385, 66, 'IXB', C.ink);
  ctx.restore();
  const q = quoteNote(ctx, t, k, -900, -330, 760, T);
  const y2 = -90 + (q.h ? q.h - 170 : 0);
  symptomCard(ctx, t, k, -900, y2, 420, 330, T.L[0].t + 0.6, T);
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

// ----- Intro: Titel, echtes Foto wechselt in die Wärmebild-Ansicht, fünf Symptome -----
function zoneIntro(ctx, t) {
  const c = CH[0];
  const box = easeOut(seg(t, 0.3, 0.9)), w1 = 'Der Handwerksdoktor', s1 = typed(w1, t, 0.9, 26);
  const av = spring(seg(t, 0.4, 1.0)), ax = -800, ay = -350;
  if (av > 0) { ctx.save(); ctx.translate(ax, ay); ctx.scale(av, av); ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -40, -40, 80, 80); ctx.restore(); }
  const tw = text(ctx, s1, -740, -334, 46, 'IXB', C.ink, 'left', box);
  if (t < 2.2) selection(ctx, -750, -384, Math.max(40, tw + 20), 70, box);
  ctx.font = '46px IXB'; const nx = -740 + ctx.measureText(w1).width + 20;
  ctx.font = '42px IR'; const ux = nx + ctx.measureText('über').width + 18;
  text(ctx, 'über', nx, -334, 42, 'IR', C.gray, 'left', easeOut(seg(t, 2.0, 2.4)));
  text(ctx, typed('Heizkörper', t, 2.5, 24), ux, -334, 46, 'IXB', C.ink, 'left', 1);
  const tp = seg(t, c.L[0].t + 0.2, c.L[0].t + 0.7);
  if (tp > 0) {
    ctx.save(); ctx.globalAlpha = easeOut(tp);
    text(ctx, 'Heizkörper wird', -860, -150, 112, 'IXB', C.ink);
    const t2 = easeOut(seg(t, c.L[0].t + 0.7, c.L[0].t + 1.2)); ctx.globalAlpha = t2;
    text(ctx, 'nicht', -860, -10, 112, 'IXB', C.ink);
    ctx.font = '112px IXB'; const nw = ctx.measureText('nicht ').width, ww = ctx.measureText('warm?').width;
    ctx.fillStyle = heat(0.18); rrect(ctx, -860 + nw - 16, -110, ww + 32, 132, 24); ctx.fill();
    text(ctx, 'warm?', -860 + nw, -10, 112, 'IXB', '#fff');
    ctx.restore();
  }
  // Karte rechts: echtes Foto, dann Scan in die Wärmebild-Ansicht
  const cp = spring(seg(t, c.L[0].t, c.L[0].t + 0.6));
  if (cp > 0) {
    const x = 300, y = -330, w = 580, h = 470;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.75, 1, cp), lerp(0.75, 1, cp)); ctx.globalAlpha = clamp(cp * 2); ctx.translate(-w / 2, -h / 2);
    const f = thermalFrame(ctx, 0, 0, w, h, 'FOTO → WÄRMEBILD');
    const scan = easeInOut(seg(t, c.L[0].t + 1.4, c.L[0].t + 2.6));
    ctx.save(); rrect(ctx, f.vx, f.vy, f.vw, f.vh, 10); ctx.clip();
    cover(ctx, IMG.radiator, f.vx, f.vy, f.vw, f.vh, 0.55, 0.5);
    if (scan > 0) {
      const sy = f.vy + f.vh * scan;
      ctx.save(); ctx.beginPath(); ctx.rect(f.vx, f.vy, f.vw, sy - f.vy); ctx.clip();
      ctx.fillStyle = '#0B0E1C'; ctx.fillRect(f.vx, f.vy, f.vw, f.vh);
      radiator(ctx, f.vx + f.vw * 0.1, f.vy + f.vh * 0.18, f.vw * 0.68, f.vh * 0.64, FIELD.cold(t), 13, { level: 5 });
      ctx.restore();
      if (scan < 1) { ctx.fillStyle = C.lime; ctx.fillRect(f.vx, sy - 2, f.vw, 4); }
    }
    ctx.restore();
    ctx.restore();
    text(ctx, 'Foto: ri, CC0, Wikimedia Commons', x, y + h + 24, 14, 'IM', C.gray, 'left', clamp(cp * 2) * (1 - seg(t, c.L[0].t + 1.4, c.L[0].t + 2.0)));
  }
  // fünf Symptome
  ['Oben kalt', 'Ganz kalt', 'Mehrere schwach', 'Der letzte kalt', 'Unten kalt'].forEach((s, i) => {
    const q = spring(seg(t, c.L[1].t + 0.6 + i * 0.35, c.L[1].t + 1.1 + i * 0.35)); if (q <= 0) return;
    ctx.save(); ctx.font = '26px ISB'; const w = ctx.measureText(s).width + 70;
    const px = [-860, -620, -380, -50, 270][i];
    ctx.translate(px, 250); ctx.scale(q, q);
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -28, w, 56, 28); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(26, 0, 15, 0, 7); ctx.fill(); text(ctx, `${i + 1}`, 26, 7, 18, 'IXB', C.lime, 'center');
    text(ctx, s, 52, 9, 26, 'ISB', C.ink); ctx.restore();
  });
  const dx = t < 3.4 ? -740 + tw + 10 : lerp(-740 + tw + 10, 560, easeOut(seg(t, 3.4, 4.2))), dy = t < 3.4 ? -350 : lerp(-350, 120, easeOut(seg(t, 3.4, 4.2)));
  cursor(ctx, dx, dy, 'Doc', 1 - easeOut(seg(t, 4.6, 5.1)));
}

// ----- Fazit: Symptom → Ursache, dann Endkarte -----
function outroOverlay(ctx, t) {
  const c = CH[OUT];
  const p = spring(seg(t, c.L[0].t - 0.2, c.L[0].t + 0.4)), endP = spring(seg(t, c.L[1].t, c.L[1].t + 0.6));
  if (p > 0 && endP < 1) {
    const rows = [['Gluckert, oben kalt', 'Luft'], ['Ganz kalt', 'Ventilstift'], ['Mehrere schwach', 'Druck'], ['Der letzte kalt', 'Abgleich'], ['Unten kalt', 'Ablagerungen']];
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * (1 - endP); ctx.translate(CX, CY - 40); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p));
    shadow(ctx, 0.3, 60, 20); ctx.fillStyle = C.panel; rrect(ctx, -520, -330, 1040, 640, 26); ctx.fill(); noShadow(ctx);
    text(ctx, 'KURZ GESAGT · SYMPTOM → URSACHE', -450, -262, 18, 'ISB', '#9A9A9A', 'left', 1, 3);
    const sym = ['gluckert', 'ganz', 'mehrere', 'der', 'unten'], cause = ['luft', 'ventilstift', 'druck', 'abgleich', 'ablagerungen'];
    rows.forEach(([s, u], i) => {
      const ti = wordTime('c7_0', sym[i], 0, c.L[0].t + 0.9 + i * 1.5) - 0.1, tc = wordTime('c7_0', cause[i], 0, ti + 0.8) - 0.1;
      const on = easeOut(seg(t, ti, ti + 0.3)), oc = easeOut(seg(t, tc, tc + 0.3)), yy = -190 + i * 98;
      const fld = [FIELD.air(t), FIELD.stuck(t), FIELD.weak(t), (uu, v) => 0.14, FIELD.sludge(t)][i];
      ctx.save(); ctx.globalAlpha *= lerp(0.3, 1, on);
      radiator(ctx, -450, yy - 34, 70, 50, fld, 5);
      text(ctx, s, -350, yy + 2, 36, 'IXB', '#fff');
      ctx.globalAlpha *= oc; text(ctx, '→', 120, yy + 2, 36, 'IXB', '#8A8A8E'); text(ctx, u, 190, yy + 2, 36, 'IXB', C.lime);
      ctx.restore();
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
  add(CH[0].L[0].t + 1.4, 'hiss', 0.2);
  for (let k = 1; k <= 6; k++) {
    const T = times(k);
    add(T.start + 0.1, 'whoosh', 0.35);
    for (let i = 0; i < DATA[k].quote.length; i += 3) add(T.qStart + i / 30, 'key', 0.14);
    add(T.L[0].t + 0.6, 'pop', 0.25);
    for (let i = 0; i < DATA[k].prompt.length; i += 3) add(T.typeStart + i / 32, 'key', 0.14);
    add(T.click, 'click', 0.45);
    for (let i = 0; i < DATA[k].check.length; i++) add(T.checkStart + i * T.checkStep, 'blip', 0.18);
    if (k === 1) for (let i = 0; i < 3; i++) add(T.L[0].t + 1.2 + i * 0.5, 'gluck', 0.22);
    if (k <= 5) add(T.fixAt + 0.2, 'bloop', 0.2);
  }
  add(CH[OUT].start + 0.1, 'whoosh', 0.4);
  for (const w of ['luft', 'ventilstift', 'druck', 'abgleich', 'ablagerungen']) add(wordTime('c7_0', w, 0, CH[OUT].L[0].t + 1), 'blip', 0.18);
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

export { houseCard, thermalFrame, DATA, CH, SEC, times, radiator, FIELD, fixed, heat, captions, valveDrawing, gaugeDrawing, lastRow, bubbles, sludgeDots, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow, pill, photoCard, cover, spring, seg, easeOut, easeInOut, lerp, clamp, WARM };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
