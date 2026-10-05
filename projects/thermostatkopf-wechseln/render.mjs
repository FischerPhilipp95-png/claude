// „Thermostatkopf wechseln: alt gegen neu oder smart (auch Danfoss)“, YouTube 16:9.
// Grammatik wie projects/heizungsdruck und projects/delonghi-kein-wasser: Board, feste Kamera (fährt nur beim Kapitelwechsel),
// nur aktive Cursor, dunkles Panel mit Limette, mitlaufende Untertitel, Abo-Aufrufe.
// Wiedererkennungsbild: der Gewinde-Check (M30 × 1,5 passt direkt, Klemmanschluss mit Adapter). Ventil-Schnitt und Kopf aus projects/heizungsventil-klemmt.
// Fakten: shotlist.md, Foto: photos/credits.json.
//   node projects/thermostatkopf-wechseln/render.mjs --timeline | --contact | --still 20,50 | [--from s --to s]
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { radiator, FIELD, thermalFrame } from '../heizungsdruck/render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const W = 1920, H = 1080, FPS = 60, CX = 960, CY = 540;
for (const [w, n] of [[400, 'IR'], [500, 'IM'], [600, 'ISB'], [800, 'IXB']]) GlobalFonts.registerFromPath(path.join(ROOT, `assets/fonts/Inter-${w}.ttf`), n);

const C = { bg: '#E4E4E4', ink: '#161616', gray: '#7A7A7A', line: '#CFCFCF', sel: '#4C8DFF', lime: '#CFF72A', red: '#FF5A4E', yt: '#E4302B', lamp: '#FF2D6F', panel: '#0C0C0D', panel2: '#1B1B1D', white: '#FFFFFF', view: '#15161A', blue: '#39A8FF', coffee: '#7A4A2A' };
const P = { Doc: '#FF2E93' };
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
const CH = SEC.chapters.map((c) => ({ ...c, L: c.lines.map((l) => ({ id: l.id, t: l.t, d: l.dur, e: l.t + l.dur })) }));
const OUT = CH.length - 1;   // letztes Kapitel = Fazit (Overlay)
const ZONES = [[0, 0], [2400, 300], [4800, -150], [7200, 250], [9600, -200]];

// ---------- Wort-Zeiten (captions.json, faster-whisper) ----------
const LINE_T = Object.fromEntries(SEC.chapters.flatMap((c) => c.lines.map((l) => [l.id, l.t])));
const CAPJSON = fs.existsSync(path.join(DIR, 'captions.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'captions.json'), 'utf8')) : [];
const WORDS = Object.fromEntries(CAPJSON.map((l) => [l.id, l.words.map((w) => ({ w: w.w.toLowerCase(), s: LINE_T[l.id] + w.s }))]));
// absolute Zeit, zu der im Satz <id> das n-te Wort beginnt, das mit <w> anfängt
function wordTime(id, w, n = 0, fallback = null) {
  const hits = (WORDS[id] || []).filter((x) => x.w.startsWith(w.toLowerCase()));
  return hits[n] ? hits[n].s : fallback ?? LINE_T[id];
}
const WT = (spec) => wordTime(...spec);

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
    x = lerp(last[0], 4800, u); y = lerp(last[1], 50, u); zoom = lerp(1, 0.14, u);
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
// Schriftgröße so weit verkleinern, dass der Text in maxW passt
function fitSize(ctx, s, size, font, maxW) { ctx.font = `${size}px ${font}`; const w = ctx.measureText(s).width; return w > maxW ? Math.floor(size * maxW / w) : size; }
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
  ctx.fillStyle = '#fff'; ctx.fillText(name, 27, 43);
  ctx.restore();
}
function pill(ctx, s, x, y, alpha, col = C.lime, size = 22, bg = C.panel2) {
  if (alpha <= 0) return 0;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${size}px ISB`; const w = ctx.measureText(s).width + 48;
  ctx.fillStyle = bg; rrect(ctx, x, y, w, size * 2.2, size * 1.1); ctx.fill(); text(ctx, s, x + 24, y + size * 1.45, size, 'ISB', col);
  ctx.restore();
  return w;
}
function check(ctx, x, y, s, on, col = C.ink) {   // Häkchen (x,y = Mitte), on 0..1 zeichnet es
  if (on <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.32, y); ctx.lineTo(x - s * 0.08, y + s * 0.24); ctx.lineTo(lerp(x - s * 0.08, x + s * 0.36, on), lerp(y + s * 0.24, y - s * 0.28, on)); ctx.stroke(); ctx.restore();
}


// ---------- Assets ----------
const IMG = {};
async function loadAssets() {
  IMG.hand = await loadImage(path.join(DIR, 'photos/pexels_thermostat_hand.jpg'));
  IMG.avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
}
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh); ctx.restore();
}

// ================= Ventil im Schnitt (Wiedererkennungsbild) =================
// pin: 0 = Stift drinnen (Ventil zu), 1 = Stift draußen (Ventil offen). stuck > 0: Stift zittert, rotes „klemmt“.
function valveSection(ctx, t, cx, cy, s, pin, { stuck = 0, labels = true } = {}) {
  const lift = clamp(pin), jit = stuck * Math.sin(t * 42) * 3;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  // Rohre: Zulauf unten links, Abgang oben rechts zum Heizkörper
  ctx.fillStyle = '#8A8F9A'; ctx.fillRect(-390, 96, 250, 40); ctx.fillRect(140, 0, 250, 40);
  // Gehäuse (Messing) und Innenraum
  ctx.fillStyle = '#B08D57'; rrect(ctx, -150, -60, 300, 220, 26); ctx.fill();
  ctx.fillStyle = '#1E2430'; rrect(ctx, -130, -40, 260, 180, 16); ctx.fill();
  // Wasser: unten immer (Zulauf), oben nur, wenn offen
  ctx.fillStyle = '#2F6FD6'; ctx.fillRect(-390, 100, 250, 32); ctx.fillRect(-130, 86, 260, 54);
  ctx.globalAlpha = lift; ctx.fillRect(-130, -40, 260, 110); ctx.fillRect(140, 4, 250, 32); ctx.globalAlpha = 1;
  // Ventilsitz mit Öffnung
  ctx.fillStyle = '#B08D57'; ctx.fillRect(-130, 70, 94, 16); ctx.fillRect(36, 70, 94, 16);
  // Ventilteller, Spindel, Stift
  const discY = 52 - lift * 46, pinTop = -60 - (14 + lift * 34);
  ctx.fillStyle = '#D9DCE3'; rrect(ctx, -56 + jit, discY, 112, 18, 5); ctx.fill();
  ctx.fillStyle = '#C9CCD4'; ctx.fillRect(-9 + jit, pinTop, 18, discY - pinTop);
  ctx.fillStyle = stuck > 0.5 ? C.red : C.lime; rrect(ctx, -11 + jit, pinTop - 4, 22, 22, 6); ctx.fill();   // Stiftkopf
  // Feder zwischen Stopfbuchse und Teller
  ctx.strokeStyle = '#E8C547'; ctx.lineWidth = 4; ctx.beginPath();
  const y0 = -36, y1 = discY - 2, n = 7;
  for (let i = 0; i <= n * 2; i++) { const yy = lerp(y0, y1, i / (n * 2)), xx = (i % 2 ? 24 : -24) + jit; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke();
  // Stopfbuchse
  ctx.fillStyle = '#7A6A4A'; rrect(ctx, -40, -86, 80, 30, 6); ctx.fill();
  // fließendes Wasser
  if (lift > 0.15) {
    const pts = [[-390, 116], [-40, 116], [0, 98], [0, 40], [140, 20], [390, 20]], segL = [];
    let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segL.push(d); tot += d; }
    ctx.fillStyle = '#BFE3FF';
    for (let i = 0; i < 22; i++) {
      let d = ((t * 0.28 * lift + i / 22) % 1) * tot, k = 0;
      while (k < segL.length - 1 && d > segL[k]) { d -= segL[k]; k++; }
      const q = d / segL[k], px = lerp(pts[k][0], pts[k + 1][0], q), py = lerp(pts[k][1], pts[k + 1][1], q);
      ctx.globalAlpha = lift; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (labels) {
    const lab = (s_, x, y, col = '#CFCFCF', al = 'left') => text(ctx, s_, x, y, 24, 'ISB', col, al);
    lab('Stift', 40, pinTop + 12, C.lime); lab('Feder', 64, -10, '#E8C547'); lab('Ventilteller', -150, discY - 14, '#D9DCE3', 'right');
    lab('Zulauf', -390, 170); lab('zum Heizkörper', 390, -14, '#CFCFCF', 'right');
    text(ctx, lift > 0.5 ? 'offen' : 'zu', 0, 210, 34, 'IXB', lift > 0.5 ? C.blue : '#8A8A8E', 'center');
  }
  if (stuck > 0) {
    ctx.save(); ctx.globalAlpha = clamp(stuck * 2);
    ctx.fillStyle = C.red; rrect(ctx, -130, pinTop - 70, 120, 44, 22); ctx.fill(); text(ctx, 'klemmt', -70, pinTop - 39, 24, 'IXB', '#fff', 'center');
    ctx.restore();
  }
  ctx.restore();
}

// Thermostatkopf von der Seite (steht senkrecht auf dem Ventil), Mutter unten
function headSide(ctx, cx, bottomY, s, { num = 3, nutRot = 0 } = {}) {
  ctx.save(); ctx.translate(cx, bottomY); ctx.scale(s, s);
  shadow(ctx, 0.35, 20, 6); ctx.fillStyle = '#F2F2F0'; rrect(ctx, -70, -190, 140, 170, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#DADAD6'; for (let i = 0; i < 6; i++) ctx.fillRect(-56 + i * 22, -176, 8, 110);
  ctx.fillStyle = '#9EA3AD'; rrect(ctx, -78, -24, 156, 28, 8); ctx.fill();
  ctx.strokeStyle = '#6E737D'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = -70 + ((i * 28 + nutRot * 60) % 150); ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x, 2); ctx.stroke(); }
  ctx.fillStyle = C.ink; rrect(ctx, -26, -60, 52, 40, 8); ctx.fill(); text(ctx, String(num), 0, -28, 32, 'IXB', C.lime, 'center');
  ctx.restore();
}

// Pfeil im Kreis (dir = -1 gegen, +1 im Uhrzeigersinn)
function turnArrow(ctx, cx, cy, r, dir, col, a = 1, t = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const a0 = -Math.PI * 0.85 + Math.sin(t * 3) * 0.08 * dir, a1 = a0 + Math.PI * 1.1;
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  const tip = dir < 0 ? a0 : a1, tx = cx + Math.cos(tip) * r, ty = cy + Math.sin(tip) * r, tang = tip + (dir < 0 ? -Math.PI / 2 : Math.PI / 2);
  ctx.beginPath(); ctx.moveTo(tx + Math.cos(tang) * 18, ty + Math.sin(tang) * 18); ctx.lineTo(tx + Math.cos(tang + 2.4) * 16, ty + Math.sin(tang + 2.4) * 16); ctx.lineTo(tx + Math.cos(tang - 2.4) * 16, ty + Math.sin(tang - 2.4) * 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Smarter Thermostatkopf von der Seite (Display oben), Mutter unten
function headSmart(ctx, cx, bottomY, s, { disp = '21°', nutRot = 0 } = {}) {
  ctx.save(); ctx.translate(cx, bottomY); ctx.scale(s, s);
  shadow(ctx, 0.35, 20, 6); ctx.fillStyle = '#F4F4F2'; rrect(ctx, -72, -200, 144, 180, 26); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#16181D'; rrect(ctx, -52, -176, 104, 62, 12); ctx.fill();
  text(ctx, disp, 0, -134, disp.length > 4 ? 22 : 34, 'IXB', C.lime, 'center');
  ctx.fillStyle = '#C9CCD4'; ctx.beginPath(); ctx.arc(0, -78, 16, 0, 7); ctx.fill();
  ctx.fillStyle = '#9EA3AD'; rrect(ctx, -78, -24, 156, 28, 8); ctx.fill();
  ctx.strokeStyle = '#6E737D'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = -70 + ((i * 28 + nutRot * 60) % 150); ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x, 2); ctx.stroke(); }
  ctx.restore();
}
// Ventil von vorn (Anschluss): kind 'm30' = Gewinde, 'klemm' = Klemmanschluss (z. B. Danfoss), adapter 0..1 = Adapterring sitzt
function valveFront(ctx, cx, cy, r, kind, adapter = 0) {
  ctx.fillStyle = '#B08D57'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  if (kind === 'm30') { ctx.strokeStyle = '#8C6F42'; ctx.lineWidth = 5; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, r - 8 - i * 9, 0, 7); ctx.stroke(); } }
  else { ctx.fillStyle = '#8C6F42'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, 7); ctx.fill(); ctx.fillStyle = '#B08D57'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#7A6A4A'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, 7); ctx.fill();
  ctx.fillStyle = '#C9CCD4'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.13, 0, 7); ctx.fill();
  if (adapter > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(adapter * 1.5); const rr = lerp(r * 1.7, r * 1.08, easeOut(adapter));
    ctx.strokeStyle = '#D0D3DA'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, rr - 5 + i * 5, 0, 7); ctx.stroke(); }
    ctx.restore();
  }
}

// ================= Inhalte der Kapitel =================
// steps: [Text, Satz-ID, Wort, n] → erscheint genau, wenn das Wort gesprochen wird
const DATA = {
  1: { tag: 'Zuerst', badge: '?', title: 'Passt der neue Kopf?', src: 'co2online, Verbraucherzentrale', card: 'SCHEMA · VENTILANSCHLUSS VON VORN',
    steps: [['Entscheidend ist das Ventil', 'c1_0', 'entscheidend'], ['Meist Gewinde M30 × 1,5', 'c1_0', 'gewinde'], ['Andere, z. B. Danfoss: Adapter', 'c1_1', 'adapter'], ['Oft liegen Adapter schon bei', 'c1_1', 'liegen']] },
  2: { tag: 'Schritt 1 bis 3', badge: '1', title: 'Alten Kopf ab, Stift prüfen', src: 'Verbraucherzentrale, co2online, thermondo', card: 'SCHRITT 1 · ALTEN KOPF AUF 5',
    steps: [['Alten Kopf auf 5 drehen', 'c2_0', 'drehen'], ['Entlastet den Stift', 'c2_0', 'entlastet'], ['Überwurfmutter: Zange', 'c2_1', 'überwurfmutter'], ['Schelle: Schraubendreher', 'c2_1', 'schelle'], ['Bajonett: ohne Werkzeug', 'c2_1', 'bajonett'], ['Stift muss zurückfedern', 'c2_2', 'zurückfedern']] },
  3: { tag: 'Schritt 4', badge: '4', title: 'Neuen Kopf aufsetzen', src: 'co2online', card: 'SCHRITT 4 · NEUER KOPF',
    steps: [['Falls nötig: Adapter zuerst', 'c3_0', 'adapter'], ['Kopf auf 5 bzw. Montageposition', 'c3_0', 'montageposition'], ['Batterien vorher einlegen', 'c3_0', 'batterien'], ['Im Uhrzeigersinn per Hand', 'c3_1', 'uhrzeigersinn'], ['Mit der Zange leicht nachziehen', 'c3_1', 'zange']] },
  4: { tag: 'Schritt 5 und Mietwohnung', badge: '5', title: 'Einstellen', src: 'Verbraucherzentrale', card: 'SCHRITT 5 · EINSTELLEN',
    steps: [['Stufe 3 ≈ 20 °C', 'c4_0', 'stufe'], ['Je Stufe ca. 4 °C', 'c4_0', 'jede'], ['Smart: Zeitplan programmieren', 'c4_1', 'programmieren'], ['Jedes Grad weniger: ca. 6 % Energie', 'c4_1', 'grad'], ['Mietwohnung: alten Kopf aufheben', 'c4_2', 'heb']] },
};
const stepTimes = (k) => DATA[k].steps.map((s) => wordTime(s[1], s[2], s[3] || 0) - 0.08);

function header(ctx, t, k) {
  const d = DATA[k], tin = easeOut(seg(t, CH[k].start + 0.5, CH[k].start + 1.0));
  text(ctx, d.tag, -900, -462, 18, 'ISB', C.gray, 'left', tin, 1);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -438, 80, 70, 16); ctx.fill(); text(ctx, d.badge, -860, -388, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -796, -383, 60, 'IXB', C.ink);
  ctx.restore();
}

// ----- linke Karte (weiß, dunkler Bildbereich 788 x 538) -----
const CARD = { x: -900, y: -330, w: 820, h: 600 };
function leftCard(ctx, t, k) {
  const tin = CH[k].start + 0.7, p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  const { x, y, w, h } = CARD;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  const vx = 16, vy = 46, vw = w - 32, vh = h - 62;
  const lab = cardLabel(t, k);
  text(ctx, lab, 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
  text(ctx, 'vereinfacht', w - 20, 32, 14, 'ISB', '#AAAAAA', 'right');
  ctx.fillStyle = C.view; rrect(ctx, vx, vy, vw, vh, 10); ctx.fill();
  ctx.save(); rrect(ctx, vx, vy, vw, vh, 10); ctx.clip(); ctx.translate(vx, vy);
  ({ 1: drawGewinde, 2: drawAlterKopf, 3: drawNeuerKopf, 4: drawEinstellen })[k](ctx, t, vw, vh);
  ctx.restore();
  ctx.restore();
  selection(ctx, x, y, w, h, (1 - seg(t, tin + 0.9, tin + 1.2)) * clamp(p * 2));
}
function cardLabel(t, k) {
  const L = CH[k].L;
  if (k === 2) return t < L[1].t - 0.2 ? 'SCHRITT 1 · ALTEN KOPF AUF 5' : t < L[2].t - 0.2 ? 'SCHRITT 2 · SO GEHT DER KOPF AB' : 'SCHRITT 3 · STIFT PRÜFEN';
  if (k === 4) return t < L[1].t - 0.2 ? 'SCHRITT 5 · STUFEN UND TEMPERATUR' : t < L[2].t - 0.2 ? 'SMARTER KOPF · ZEITPLAN' : 'MIETWOHNUNG';
  return DATA[k].card;
}
const fade = (t, a, b, len = 0.4) => easeInOut(seg(t, a - len / 2, a + len / 2)) * (1 - easeInOut(seg(t, b - len / 2, b + len / 2)));

// Kapitel 1: Gewinde-Check – M30 × 1,5 passt direkt, Klemmanschluss braucht einen Adapter
function drawGewinde(ctx, t, w, h) {
  const tE = wordTime('c1_0', 'entscheidend'), tG = wordTime('c1_0', 'gewinde'), tA = wordTime('c1_1', 'adapter'), tL = wordTime('c1_1', 'liegen');
  const e = easeOut(seg(t, tE - 0.1, tE + 0.3));
  if (e > 0) { ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = C.ink; rrect(ctx, 24, 20, 460, 50, 25); ctx.fill(); text(ctx, 'Entscheidend: das Ventil, nicht der Heizkörper', 254, 52, 19, 'IXB', '#fff', 'center'); ctx.restore(); }
  valveFront(ctx, 200, 270, 110, 'm30');
  text(ctx, 'Gewinde', 200, 430, 24, 'ISB', '#CFCFCF', 'center');
  const g = spring(seg(t, tG - 0.1, tG + 0.4));
  if (g > 0) {
    ctx.save(); ctx.globalAlpha = clamp(g * 2); ctx.strokeStyle = C.lime; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(200, 270, 128, 0, 7); ctx.stroke();
    ctx.fillStyle = C.lime; rrect(ctx, 80, 456, 240, 50, 25); ctx.fill(); text(ctx, 'M30 × 1,5: passt', 200, 489, 22, 'IXB', C.ink, 'center'); ctx.restore();
  }
  const a = seg(t, tA - 0.2, tA + 0.8);
  valveFront(ctx, 580, 270, 90, 'klemm', a);
  text(ctx, 'Klemmanschluss, z. B. Danfoss', 580, 430, 22, 'ISB', '#CFCFCF', 'center');
  const y1 = easeOut(seg(t, tA - 0.1, tA + 0.3));
  if (y1 > 0) { ctx.save(); ctx.globalAlpha = y1; const done = t > tA + 0.8; ctx.fillStyle = done ? C.lime : '#FFD400'; rrect(ctx, 460, 456, 240, 50, 25); ctx.fill(); text(ctx, done ? '+ Adapter: passt' : 'braucht Adapter', 580, 489, 22, 'IXB', C.ink, 'center'); ctx.restore(); }
  const l = easeOut(seg(t, tL - 0.1, tL + 0.3));
  if (l > 0) { ctx.save(); ctx.globalAlpha = l; ctx.fillStyle = '#26262A'; rrect(ctx, 470, 20, 290, 50, 25); ctx.fill(); text(ctx, 'oft schon im Karton', 615, 52, 20, 'ISB', C.lime, 'center'); ctx.restore(); }
}
// Kapitel 2: alter Kopf auf 5 und ab, drei Befestigungen, Stift prüfen
function drawAlterKopf(ctx, t, w, h) {
  const L = CH[2].L, tD = wordTime('c2_0', 'drehen'), tF = wordTime('c2_2', 'drück'), tK = wordTime('c2_2', 'klemmt');
  const a = 1 - easeInOut(seg(t, L[1].t - 0.4, L[1].t)), b = fade(t, L[1].t - 0.2, L[2].t - 0.2), c = easeInOut(seg(t, L[2].t - 0.4, L[2].t));
  if (a > 0) {
    ctx.save(); ctx.globalAlpha *= a;
    valveSection(ctx, t, 330, 380, 0.6, 1, { labels: false });
    const num = t < tD ? 3 : t < tD + 0.6 ? (t < tD + 0.3 ? 4 : 5) : 5;
    headSide(ctx, 330, 300, 0.85, { num });
    turnArrow(ctx, 330, 200, 120, 1, C.lime, easeOut(seg(t, tD - 0.1, tD + 0.2)) * (1 - seg(t, tD + 1.4, tD + 1.8)), t);
    { const ea = easeOut(seg(t, wordTime('c2_0', 'entlastet') - 0.1, wordTime('c2_0', 'entlastet') + 0.3)); text(ctx, 'auf 5:', 500, 150, 26, 'IXB', C.lime, 'left', ea); text(ctx, 'entlastet den Stift', 500, 184, 24, 'IXB', C.lime, 'left', ea); }
    ctx.restore();
  }
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    const cols = [['Überwurfmutter', 'Zange', wordTime('c2_1', 'überwurfmutter'), 'nut'], ['Schelle', 'Schraubendreher', wordTime('c2_1', 'schelle'), 'clamp'], ['Bajonett', 'ohne Werkzeug', wordTime('c2_1', 'bajonett'), 'bayonet']];
    cols.forEach(([name, tool, tt, kind], i) => {
      const cx = 131 + i * 263, cy = 250, on = t >= tt - 0.1, pop = spring(seg(t, tt - 0.1, tt + 0.4));
      ctx.save(); ctx.globalAlpha *= on ? 1 : 0.3;
      if (on) { ctx.strokeStyle = C.lime; ctx.lineWidth = 4; rrect(ctx, cx - 120, 24, 240, h - 48, 18); ctx.stroke(); }
      text(ctx, name, cx, 72, 26, 'IXB', '#fff', 'center');
      ctx.fillStyle = '#F2F2F0'; ctx.beginPath(); ctx.arc(cx, cy, 62, 0, 7); ctx.fill(); ctx.fillStyle = '#DADAD6'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill();
      if (kind === 'nut') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 14; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const an = j / 6 * Math.PI * 2 + Math.PI / 6; j ? ctx.lineTo(cx + Math.cos(an) * 84, cy + Math.sin(an) * 84) : ctx.moveTo(cx + Math.cos(an) * 84, cy + Math.sin(an) * 84); } ctx.stroke(); turnArrow(ctx, cx, cy, 104, -1, C.lime, on ? pop : 0, t); }
      if (kind === 'clamp') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, 78, 0, 7); ctx.stroke(); ctx.fillStyle = '#9EA3AD'; rrect(ctx, cx + 70, cy - 18, 40, 36, 6); ctx.fill(); ctx.fillStyle = '#5A5F69'; ctx.beginPath(); ctx.arc(cx + 90, cy, 12, 0, 7); ctx.fill(); }
      if (kind === 'bayonet') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 12; ctx.setLineDash([26, 12]); ctx.beginPath(); ctx.arc(cx, cy, 80, 0, 7); ctx.stroke(); ctx.setLineDash([]); turnArrow(ctx, cx, cy, 104, -1, C.lime, on ? pop : 0, t); }
      text(ctx, tool, cx, 410, 22, 'ISB', on ? C.lime : '#CFCFCF', 'center');
      if (kind !== 'clamp') text(ctx, 'gegen den Uhrzeigersinn', cx, 442, 17, 'IM', '#9A9A9A', 'center');
      ctx.restore();
    });
    ctx.restore();
  }
  if (c > 0) {
    ctx.save(); ctx.globalAlpha *= c;
    const cx = 300, base = 360, full = 90, press = Math.sin(Math.PI * seg(t, tF + 0.1, tF + 1.2)), len = full - press * 72;
    ctx.fillStyle = '#B08D57'; rrect(ctx, cx - 150, base, 300, 180, 18); ctx.fill();
    ctx.fillStyle = '#7A6A4A'; rrect(ctx, cx - 50, base - 30, 100, 34, 8); ctx.fill();
    ctx.fillStyle = '#C9CCD4'; rrect(ctx, cx - 14, base - 30 - len, 28, len + 4, 8); ctx.fill();
    ctx.fillStyle = C.lime; rrect(ctx, cx - 16, base - 34 - len, 32, 16, 6); ctx.fill();
    if (t > tF - 0.3 && t < tF + 1.6) {
      const fy = base - 34 - len - 70, fa = easeOut(seg(t, tF - 0.3, tF)) * (1 - seg(t, tF + 1.2, tF + 1.6));
      ctx.save(); ctx.globalAlpha *= fa; ctx.fillStyle = '#E7B38F'; rrect(ctx, cx - 40, fy - 120, 80, 190, 40); ctx.fill(); ctx.restore();
    }
    text(ctx, 'federt zurück ✓', cx + 120, 150, 28, 'IXB', C.lime, 'left', easeOut(seg(t, tF + 1.0, tF + 1.3)));
    const kk = easeOut(seg(t, tK - 0.1, tK + 0.3));
    if (kk > 0) { ctx.save(); ctx.globalAlpha *= kk; ctx.fillStyle = '#26262A'; rrect(ctx, 400, 300, 360, 110, 18); ctx.fill(); ctx.fillStyle = C.red; rrect(ctx, 400, 300, 10, 110, 5); ctx.fill(); text(ctx, 'Klemmt er?', 430, 345, 26, 'IXB', '#fff'); text(ctx, 'Video: Heizungsventil klemmt', 430, 385, 20, 'ISB', '#CFCFCF'); ctx.restore(); }
    ctx.restore();
  }
}
// Kapitel 3: Adapter, neuer (smarter) Kopf auf Montageposition, aufsetzen, per Hand, Zange
function drawNeuerKopf(ctx, t, w, h) {
  const tA = wordTime('c3_0', 'adapter'), tM = wordTime('c3_0', 'montageposition'), tB = wordTime('c3_0', 'batterien'), tS = wordTime('c3_1', 'aufsetzen'), tU = wordTime('c3_1', 'uhrzeigersinn'), tZ = wordTime('c3_1', 'zange');
  valveSection(ctx, t, 300, 400, 0.6, 1, { labels: false });
  // Adapterring setzt sich aufs Ventil
  const ad = easeOut(seg(t, tA - 0.1, tA + 0.6));
  if (ad > 0) { ctx.save(); ctx.globalAlpha = ad; ctx.fillStyle = '#D0D3DA'; rrect(ctx, 300 - 54, lerp(250, 338, ad), 108, 20, 6); ctx.fill(); ctx.restore(); text(ctx, 'Adapter (falls nötig)', 470, 490, 22, 'ISB', '#CFCFCF', 'left', ad); }
  const disp = t < tM - 0.1 ? '21°' : 'Montage';
  const down = easeInOut(seg(t, tS - 0.2, tS + 0.6)), nut = seg(t, tU, tU + 1.4);
  headSmart(ctx, 300, lerp(200, 330, down), 0.8, { disp, nutRot: nut });
  const bt = spring(seg(t, tB - 0.1, tB + 0.4)) * (1 - seg(t, tS, tS + 0.3));
  if (bt > 0) { ctx.save(); ctx.globalAlpha = clamp(bt * 2); for (let i = 0; i < 2; i++) { ctx.fillStyle = '#E8C547'; rrect(ctx, 480 + i * 70, 90, 46, 110, 10); ctx.fill(); ctx.fillStyle = '#8C6F42'; rrect(ctx, 494 + i * 70, 80, 18, 12, 3); ctx.fill(); } text(ctx, 'Batterien vorher rein', 470, 240, 22, 'ISB', '#CFCFCF'); ctx.restore(); }
  turnArrow(ctx, 300, 300, 130, 1, C.lime, easeOut(seg(t, tU - 0.1, tU + 0.2)) * (1 - seg(t, tZ + 1.4, tZ + 1.8)), t);
  { const ua = easeOut(seg(t, tU, tU + 0.3)); text(ctx, 'im Uhrzeigersinn,', 470, 280, 24, 'IXB', C.lime, 'left', ua); text(ctx, 'erst per Hand', 470, 312, 24, 'IXB', C.lime, 'left', ua); }
  text(ctx, 'dann leicht mit der Zange', 470, 358, 22, 'IXB', '#FFD400', 'left', easeOut(seg(t, tZ - 0.1, tZ + 0.3)));
  text(ctx, disp === 'Montage' ? 'Montageposition laut Anleitung' : '', 40, 60, 22, 'ISB', '#CFCFCF', 'left', easeOut(seg(t, tM - 0.1, tM + 0.3)) * (1 - seg(t, tS, tS + 0.3)));
}
// Kapitel 4: Skala 1–5 mit Temperaturen, Wochenplan, Mietwohnung
function drawEinstellen(ctx, t, w, h) {
  const L = CH[4].L, tS = wordTime('c4_0', 'stufe'), tJ = wordTime('c4_0', 'jede'), tG = wordTime('c4_1', 'grad'), tH = wordTime('c4_2', 'heb');
  const a = 1 - easeInOut(seg(t, L[1].t - 0.4, L[1].t)), b = fade(t, L[1].t - 0.2, L[2].t - 0.2), c = easeInOut(seg(t, L[2].t - 0.4, L[2].t));
  if (a > 0) {
    ctx.save(); ctx.globalAlpha *= a;
    const temps = [12, 16, 20, 24, 28], sel = easeOut(seg(t, tS - 0.1, tS + 0.4)), each = easeOut(seg(t, tJ - 0.1, tJ + 0.4));
    temps.forEach((tc, i) => {
      const x = 90 + i * 150, on = i === 2 && sel > 0;
      ctx.fillStyle = on ? C.lime : '#26262A'; ctx.beginPath(); ctx.arc(x, 220, 54, 0, 7); ctx.fill();
      text(ctx, String(i + 1), x, 240, 54, 'IXB', on ? C.ink : '#fff', 'center');
      text(ctx, `≈ ${tc} °C`, x, 320, 26, 'IXB', on ? C.lime : '#CFCFCF', 'center', i === 2 ? Math.max(sel, each) : each);
      if (i < 4) text(ctx, '+4', x + 75, 160, 20, 'ISB', '#FFD400', 'center', each);
    });
    text(ctx, 'Richtwerte, je nach Raum etwas anders', 394, 430, 20, 'IM', '#9A9A9A', 'center', each);
    ctx.restore();
  }
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    days.forEach((d, i) => {
      const y = 50 + i * 54; text(ctx, d, 40, y + 30, 22, 'ISB', '#CFCFCF');
      ctx.fillStyle = '#2A3A6A'; rrect(ctx, 100, y + 6, 640, 34, 8); ctx.fill();
      const blocks = i < 5 ? [[6, 8], [17, 22]] : [[8, 22]];
      blocks.forEach(([s, e]) => { ctx.fillStyle = '#FF8A1C'; rrect(ctx, 100 + s / 24 * 640, y + 6, (e - s) / 24 * 640, 34, 8); ctx.fill(); });
    });
    const g = spring(seg(t, tG - 0.1, tG + 0.4));
    if (g > 0) { ctx.save(); ctx.globalAlpha *= clamp(g * 2); ctx.fillStyle = C.lime; rrect(ctx, 420, h - 80, 330, 56, 28); ctx.fill(); text(ctx, '−1 °C ≈ −6 % Energie', 585, h - 42, 26, 'IXB', C.ink, 'center'); ctx.restore(); }
    ctx.restore();
  }
  if (c > 0) {
    ctx.save(); ctx.globalAlpha *= c;
    const hp = easeInOut(seg(t, tH - 0.2, tH + 0.8));
    ctx.fillStyle = '#8B6A3E'; rrect(ctx, 420, 260, 260, 190, 14); ctx.fill(); ctx.fillStyle = '#A07C4A'; rrect(ctx, 410, 240, 280, 40, 10); ctx.fill();
    text(ctx, 'aufheben bis zum Auszug', 550, 490, 24, 'IXB', C.lime, 'center', easeOut(seg(t, tH, tH + 0.4)));
    headSide(ctx, lerp(200, 550, hp), lerp(330, 300, hp), 0.6, { num: 3 });
    text(ctx, 'alter Kopf', lerp(200, 550, hp), 120, 22, 'ISB', '#CFCFCF', 'center', 1 - hp);
    ctx.restore();
  }
}

// ----- rechtes Panel: Schritte zum Wort -----
const PNL = { x: 20, y: -330, w: 900, h: 600 };
function panel(ctx, t, k) {
  const d = DATA[k], L = CH[k].L, t0 = L[0].t - 0.1, p = spring(seg(t, t0, t0 + 0.6));
  if (p <= 0) return null;
  const { x, y, w, h } = PNL;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, 0, 0, w, h, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = C.lime; rrect(ctx, 28, 24, 26, 26, 7); ctx.fill(); text(ctx, 'Doc', 64, 44, 17, 'ISB', '#fff');
  text(ctx, k === 1 ? 'ZUERST PRÜFEN' : 'SO GEHT’S', 40, 98, 15, 'ISB', '#8A8A8E', 'left', 1, 2.4);
  const ts = stepTimes(k), rowH = d.steps.length > 5 ? 72 : 80;
  let target = null;
  d.steps.forEach(([s], i) => {
    const a = spring(seg(t, ts[i], ts[i] + 0.45)); if (a <= 0) return;
    const yy = 118 + i * rowH;
    ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate((1 - a) * 30, 0);
    ctx.fillStyle = C.panel2; rrect(ctx, 32, yy, w - 64, rowH - 12, 16); ctx.fill();
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(72, yy + (rowH - 12) / 2, 21, 0, 7); ctx.fill();
    text(ctx, String(i + 1), 72, yy + (rowH - 12) / 2 + 8, 22, 'IXB', C.ink, 'center');
    const fs_ = fitSize(ctx, s, 28, 'ISB', w - 64 - 130);
    text(ctx, s, 112, yy + (rowH - 12) / 2 + 10, fs_, 'ISB', '#fff');
    ctx.restore();
    target = [x + 72, y + yy + (rowH - 12) / 2];
  });
  text(ctx, `Quelle: ${d.src}`, w - 32, h - 24, 17, 'ISB', '#6A6A6E', 'right', easeOut(seg(t, L[0].t + 0.8, L[0].t + 1.3)));
  ctx.restore();
  return target;
}

const DOC_POS = new Map();
function zone(ctx, t, k) {
  header(ctx, t, k);
  leftCard(ctx, t, k);
  const target = panel(ctx, t, k);
  const L = CH[k].L, last = L[L.length - 1].e;
  if (target) {
    const prev = DOC_POS.get(k) ?? target, pos = [lerp(prev[0], target[0], 0.18), lerp(prev[1], target[1], 0.18)];
    DOC_POS.set(k, pos);
    cursor(ctx, pos[0] + 8, pos[1] + 8, 'Doc', easeOut(seg(t, L[0].t, L[0].t + 0.4)) * (1 - easeOut(seg(t, last + 0.4, last + 0.9))));
  }
}


// ----- Intro: Foto, Titel, „alt raus, neu rein“, kein Wasser / 10 Minuten / ohne Fachbetrieb -----
function zoneIntro(ctx, t) {
  const c = CH[0];
  const box = easeOut(seg(t, 0.3, 0.9)), w1 = 'Der Handwerksdoktor', s1 = typed(w1, t, 0.9, 26);
  const av = spring(seg(t, 0.4, 1.0));
  if (av > 0) { ctx.save(); ctx.translate(-840, -420); ctx.scale(av, av); ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -36, -36, 72, 72); ctx.restore(); }
  const tw = text(ctx, s1, -786, -406, 40, 'IXB', C.ink, 'left', box);
  if (t < 2.2) selection(ctx, -796, -450, Math.max(40, tw + 20), 62, box);
  ctx.font = '40px IXB'; const nx = -786 + ctx.measureText(w1).width + 18;
  ctx.font = '36px IR'; const ux = nx + ctx.measureText('über').width + 16;
  text(ctx, 'über', nx, -406, 36, 'IR', C.gray, 'left', easeOut(seg(t, 2.0, 2.4)));
  text(ctx, typed('Heizung', t, 2.5, 22), ux, -406, 40, 'IXB', C.ink, 'left', 1);
  const tp = easeOut(seg(t, c.L[0].t + 0.1, c.L[0].t + 0.6));
  text(ctx, 'Thermostatkopf wechseln', -880, -230, 76, 'IXB', C.ink, 'left', tp);
  const tA = wordTime('c0_0', 'tauschen'), tN = wordTime('c0_0', 'smarten');
  const pillBig = (s, y, col, a) => {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.font = '92px IXB'; const pw = ctx.measureText(s).width;
    ctx.translate(-880, y); ctx.scale(lerp(0.8, 1, a), lerp(0.8, 1, a)); ctx.fillStyle = col; rrect(ctx, -16, -88, pw + 32, 116, 24); ctx.fill(); text(ctx, s, 0, 0, 92, 'IXB', '#fff'); ctx.restore();
  };
  pillBig('Alt raus,', -80, '#2346E8', spring(seg(t, tA - 0.1, tA + 0.4)));
  pillBig('neu oder smart rein', 66, '#1E9E55', spring(seg(t, tN - 0.1, tN + 0.4)));
  let px = -880;
  [['≈ 10 Minuten', wordTime('c0_0', 'zehn', 0, wordTime('c0_0', '10'))], ['ohne Fachbetrieb', wordTime('c0_0', 'fachbetrieb')], ['kein Wasser', wordTime('c0_1', 'wasser')]].forEach(([s, tt], i) => {
    ctx.font = '26px ISB'; const w = ctx.measureText(s).width + 64, x0 = px; px += w + 14;
    const q = spring(seg(t, tt - 0.1, tt + 0.4)); if (q <= 0) return;
    ctx.save(); ctx.translate(x0, 200); ctx.scale(q, q);
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -28, w, 56, 28); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(26, 0, 15, 0, 7); ctx.fill(); check(ctx, 26, 0, 20, 1);
    text(ctx, s, 50, 9, 26, 'ISB', C.ink); ctx.restore();
  });
  // rechts: echtes Foto (alter Kopf), daneben der neue smarte Kopf als Schema
  const cp = spring(seg(t, 0.2, 0.8)), x = 300, y = -390, w = 560, h = 372;
  if (cp > 0) {
    ctx.save(); ctx.globalAlpha = clamp(cp * 2); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.85, 1, cp), lerp(0.85, 1, cp)); ctx.translate(-w / 2, -h / 2);
    shadow(ctx, 0.3, 40, 14); ctx.fillStyle = '#fff'; rrect(ctx, -10, -10, w + 20, h + 20, 24); ctx.fill(); noShadow(ctx);
    ctx.save(); rrect(ctx, 0, 0, w, h, 16); ctx.clip(); cover(ctx, IMG.hand, 0, 0, w, h, 0.62, 0.4, 1.15); ctx.restore();
    ctx.fillStyle = C.ink; rrect(ctx, 20, 20, 150, 52, 26); ctx.fill(); text(ctx, 'alt', 95, 55, 26, 'IXB', '#fff', 'center');
    ctx.restore();
    text(ctx, 'Foto: BOOM Photography / Pexels', x, y + h + 34, 14, 'IM', C.gray, 'left', clamp(cp * 2));
    const sp = spring(seg(t, tN - 0.1, tN + 0.5));
    if (sp > 0) {
      ctx.save(); ctx.globalAlpha = clamp(sp * 2); shadow(ctx, 0.2, 30, 10); ctx.fillStyle = '#15161A'; rrect(ctx, 440, 40, 420, 230, 20); ctx.fill(); noShadow(ctx);
      headSmart(ctx, 560, 250, 0.95, { disp: '21°' }); text(ctx, 'neu: smart', 720, 150, 28, 'IXB', C.lime, 'center'); text(ctx, 'Schema', 720, 190, 18, 'ISB', '#8A8A8E', 'center');
      ctx.restore();
    }
  }
  const dx = t < 3.4 ? -786 + tw + 10 : lerp(-786 + tw + 10, -300, easeOut(seg(t, 3.4, 4.2))), dy = t < 3.4 ? -420 : lerp(-420, -200, easeOut(seg(t, 3.4, 4.2)));
  cursor(ctx, dx, dy, 'Doc', 1 - easeOut(seg(t, 4.4, 4.9)));
}

// ---------- Abo-Aufrufe ----------
function bell(ctx, x, y, s, col, wig = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(wig * 30) * 0.35 * (1 - clamp(wig))); ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.28); ctx.quadraticCurveTo(-s * 0.4, -s * 0.46, 0, -s * 0.48); ctx.quadraticCurveTo(s * 0.4, -s * 0.46, s * 0.42, s * 0.28); ctx.lineTo(s * 0.55, s * 0.4); ctx.lineTo(-s * 0.55, s * 0.4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, s * 0.52, s * 0.13, 0, 7); ctx.fill(); ctx.restore();
}
function thumb(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 34, s / 34); ctx.fillStyle = col;
  rrect(ctx, -15, -1, 8, 18, 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(2, -14); ctx.quadraticCurveTo(7, -18, 8, -11); ctx.lineTo(6, -3); ctx.lineTo(14, -3); ctx.quadraticCurveTo(18, -2, 17, 3); ctx.lineTo(14, 15); ctx.quadraticCurveTo(13, 17, 10, 17); ctx.lineTo(-4, 17); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Karte unten in der Mitte: Kanal + (Like) + Abonnieren; Cursor klickt genau auf das gesprochene Wort
function ctaCard(ctx, t, t0, t1, subT, likeT = null) {
  const p = spring(seg(t, t0, t0 + 0.5)) * (1 - easeOut(seg(t, t1 - 0.35, t1)));
  if (p <= 0) return;
  const w = likeT ? 700 : 600, h = 84, x = CX - w / 2, y = 812;
  const bx = x + w - 214, by = y + 16, lx = x + w - 290, ly = y + h / 2;
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(CX, y + h / 2); ctx.scale(lerp(0.85, 1, p), lerp(0.85, 1, p)); ctx.translate(-CX, -(y + h / 2));
  shadow(ctx, 0.3, 30, 10); ctx.fillStyle = '#fff'; rrect(ctx, x, y, w, h, 42); ctx.fill(); noShadow(ctx);
  ctx.save(); ctx.beginPath(); ctx.arc(x + 44, y + h / 2, 30, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, x + 14, y + h / 2 - 30, 60, 60); ctx.restore();
  text(ctx, 'Der Handwerksdoktor', x + 88, y + 38, 24, 'IXB', C.ink); text(ctx, '@derhandwerksdoktor', x + 88, y + 64, 17, 'IM', C.gray);
  if (likeT) {
    const liked = t >= likeT, pop = spring(seg(t, likeT, likeT + 0.4));
    ctx.fillStyle = liked ? '#E8F0FF' : '#F0F0F0'; ctx.beginPath(); ctx.arc(lx, ly, 28, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(lx, ly); const sc = liked ? lerp(1.5, 1, pop) : 1; ctx.scale(sc, sc); thumb(ctx, 0, 0, 30, liked ? '#2F6BFF' : C.ink); ctx.restore();
  }
  const subbed = t >= subT;
  ctx.fillStyle = subbed ? '#E9E9E9' : C.yt; rrect(ctx, bx, by, 194, 52, 26); ctx.fill();
  if (subbed) { bell(ctx, bx + 34, by + 25, 26, C.ink, seg(t, subT + 0.2, subT + 1.6)); text(ctx, 'Abonniert', bx + 116, by + 34, 21, 'IXB', C.ink, 'center'); }
  else text(ctx, 'ABONNIEREN', bx + 97, by + 34, 20, 'IXB', '#fff', 'center', 1, 1);
  if (subbed) { const r = seg(t, subT, subT + 0.6); ctx.strokeStyle = C.lime; ctx.lineWidth = 4; ctx.globalAlpha *= 1 - r; rrect(ctx, bx - r * 16, by - r * 16, 194 + r * 32, 52 + r * 32, 26 + r * 16); ctx.stroke(); }
  ctx.restore();
  // Cursor
  const start = [CX + 520, 1120], pLike = [lx + 6, ly + 4], pSub = [bx + 120, by + 30];
  let pos, press = 0;
  const go = (a, b, ta, tb) => [lerp(a[0], b[0], easeOut(seg(t, ta, tb))), lerp(a[1], b[1], easeOut(seg(t, ta, tb)))];
  if (likeT) pos = t < likeT + 0.15 ? go(start, pLike, likeT - 0.9, likeT - 0.05) : go(pLike, pSub, likeT + 0.15, subT - 0.05);
  else pos = go(start, pSub, subT - 1.0, subT - 0.05);
  for (const ct of likeT ? [likeT, subT] : [subT]) if (t >= ct && t < ct + 0.2) press = Math.sin(Math.PI * seg(t, ct, ct + 0.2));
  cursor(ctx, pos[0], pos[1], 'Doc', clamp(p * 2), press);
}
const CTA1 = { t0: wordTime('c0_1', 'wenn') - 0.2, t1: CH[0].L[1].e + 0.5, sub: wordTime('c0_1', 'abonnier') };
const CTA2 = { t0: CH[3].L[2].t - 0.2, t1: CH[3].L[2].e + 0.5, sub: wordTime('c3_2', 'abonnier'), like: wordTime('c3_2', 'like') };
// dezenter Abo-Hinweis oben rechts, leuchtet zweimal kurz auf
const HINT_PULSES = [45, 95];
function subHint(ctx, t) {
  const a = easeOut(seg(t, CH[1].start + 1.5, CH[1].start + 2.2)) * (1 - easeOut(seg(t, CH[OUT].start - 0.5, CH[OUT].start)));
  if (a <= 0) return;
  const pulse = Math.max(...HINT_PULSES.map((p) => Math.sin(Math.PI * seg(t, p, p + 2.4))));
  const w = 250, h = 54, x = W - w - 36, y = 34;
  ctx.save(); ctx.globalAlpha = a * lerp(0.6, 1, pulse); ctx.translate(x + w / 2, y + h / 2); ctx.scale(1 + 0.08 * pulse, 1 + 0.08 * pulse); ctx.translate(-(x + w / 2), -(y + h / 2));
  if (pulse > 0) { ctx.shadowColor = C.lime; ctx.shadowBlur = 30 * pulse; }
  ctx.fillStyle = 'rgba(12,12,13,0.82)'; rrect(ctx, x, y, w, h, 27); ctx.fill(); noShadow(ctx);
  ctx.save(); ctx.beginPath(); ctx.arc(x + 27, y + 27, 19, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, x + 8, y + 8, 38, 38); ctx.restore();
  ctx.fillStyle = C.yt; rrect(ctx, x + 56, y + 11, 142, 32, 16); ctx.fill(); text(ctx, 'ABONNIEREN', x + 127, y + 33, 15, 'IXB', '#fff', 'center', 1, 0.8);
  bell(ctx, x + 223, y + 26, 22, '#fff', pulse > 0 ? seg(t, HINT_PULSES.find((p) => t >= p && t < p + 2.4) ?? 0, (HINT_PULSES.find((p) => t >= p && t < p + 2.4) ?? 0) + 1.4) : 1);
  ctx.restore();
}

// ----- Fazit + Endkarte -----
function outroOverlay(ctx, t) {
  const c = CH[OUT];
  const p = spring(seg(t, c.L[0].t - 0.2, c.L[0].t + 0.4)), endP = spring(seg(t, c.L[1].t, c.L[1].t + 0.6));
  if (p > 0 && endP < 1) {
    const rows = [['prüfen', 'Ventil prüfen: M30 × 1,5 oder Adapter'], ['kopf', 'Alten Kopf auf 5 und ab'], ['testen', 'Stift testen'], ['drauf', 'Neuen Kopf drauf'], ['einstellen', 'Einstellen (Stufe 3 ≈ 20 °C)']];
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * (1 - endP); ctx.translate(CX, CY - 50); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p));
    shadow(ctx, 0.3, 60, 20); ctx.fillStyle = C.panel; rrect(ctx, -640, -310, 1280, 600, 26); ctx.fill(); noShadow(ctx);
    text(ctx, 'KURZ GESAGT', -570, -244, 18, 'ISB', '#9A9A9A', 'left', 1, 3);
    rows.forEach(([w, s], i) => {
      const ti = wordTime('c5_0', w, 0, c.L[0].t + 0.6 + i * 0.6) - 0.08, on = easeOut(seg(t, ti, ti + 0.3)), yy = -170 + i * 84;
      ctx.fillStyle = on > 0.5 ? C.lime : '#2A2A2D'; rrect(ctx, -570, yy - 30, 46, 46, 12); ctx.fill();
      check(ctx, -547, yy - 7, 30, on);
      text(ctx, s, -500, yy + 4, 36, 'IXB', on > 0.5 ? '#fff' : '#6A6A6E');
    });
    ctx.save(); rrect(ctx, 250, -270, 330, 500, 16); ctx.clip(); cover(ctx, IMG.hand, 250, -270, 330, 500, 0.66, 0.4); ctx.restore();
    ctx.fillStyle = C.lime; rrect(ctx, 266, -254, 250, 44, 22); ctx.fill(); text(ctx, 'Neuer Kopf', 391, -224, 22, 'IXB', C.ink, 'center');
    text(ctx, 'Foto: BOOM Photography / Pexels', 250, 256, 14, 'IM', '#8A8A8E');
    ctx.restore();
  }
  if (endP > 0) {
    ctx.save(); ctx.globalAlpha = clamp(endP * 2);
    ctx.fillStyle = 'rgba(228,228,228,0.88)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(CX, CY - 120); ctx.scale(endP, endP);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -110, 100, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -100, -210, 200, 200); ctx.restore();
    ctx.strokeStyle = C.lime; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -110, 104, 0, 7); ctx.stroke();
    text(ctx, 'Der Handwerksdoktor', 0, 50, 58, 'IXB', C.ink, 'center');
    text(ctx, 'Hilfe rund um Heizung und Haus', 0, 98, 28, 'IM', C.gray, 'center');
    // Kommentar-Frage
    const cq = spring(seg(t, c.L[1].t + 0.4, c.L[1].t + 0.9));
    if (cq > 0) { ctx.save(); ctx.translate(0, 168); ctx.scale(cq, cq); ctx.fillStyle = C.ink; rrect(ctx, -330, -32, 660, 64, 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(-290, 30); ctx.lineTo(-300, 54); ctx.lineTo(-262, 30); ctx.fill(); text(ctx, 'Welchen Thermostatkopf hast du?', 0, 10, 26, 'ISB', C.lime, 'center'); ctx.restore(); }
    const subT = wordTime('c5_1', 'abonnier'), bp = spring(seg(t, subT - 0.8, subT - 0.3)), subbed = t >= subT;
    if (bp > 0) {
      ctx.save(); ctx.translate(0, 262); ctx.scale(bp, bp); ctx.fillStyle = subbed ? '#D6D6D6' : C.yt; rrect(ctx, -170, -36, 340, 72, 36); ctx.fill();
      if (subbed) { bell(ctx, -100, -2, 30, C.ink, seg(t, subT + 0.2, subT + 1.6)); text(ctx, 'Abonniert', 20, 11, 30, 'IXB', C.ink, 'center'); } else text(ctx, 'ABONNIEREN', 0, 11, 28, 'IXB', '#fff', 'center', 1, 1);
      ctx.restore();
    }
    ctx.restore();
    const cu = easeOut(seg(t, subT - 0.9, subT - 0.05));
    if (cu > 0) cursor(ctx, lerp(1500, CX + 70, cu), lerp(1060, CY - 120 + 262 * endP + 8, cu), 'Doc', 1 - easeOut(seg(t, subT + 1.5, subT + 2)), t > subT && t < subT + 0.2 ? Math.sin(Math.PI * seg(t, subT, subT + 0.2)) : 0);
  }
}

// ---------- Mitlaufende Untertitel ----------
const CAPS = (() => {
  const chunks = [];
  for (const line of CAPJSON) {
    let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    for (const w of line.words) {
      const word = { w: w.w.toUpperCase(), s: LINE_T[line.id] + w.s, e: LINE_T[line.id] + w.e };
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
  const blurred = cam.blur > 0.4;   // Unschärfe einmal aufs fertige Board (pro Zeichenbefehl wäre sie sehr langsam)
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
  subHint(out, t);
  ctaCard(out, t, CTA1.t0, CTA1.t1, CTA1.sub);
  ctaCard(out, t, CTA2.t0, CTA2.t1, CTA2.sub, CTA2.like);
  if (t >= CH[OUT].start) outroOverlay(out, t);
  captions(out, t);
}

// ---------- Sounds ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  for (let i = 0; i < 19; i += 2) add(0.9 + i / 26, 'key', 0.18);
  add(wordTime('c0_0', 'tauschen'), 'thump', 0.3); add(wordTime('c0_0', 'smarten'), 'pop', 0.3);
  for (const [id, w] of [['c0_0', 'fachbetrieb'], ['c0_1', 'wasser']]) add(wordTime(id, w), 'blip', 0.2);
  for (let k = 1; k <= 4; k++) {
    add(CH[k].start + 0.1, 'whoosh', 0.35); add(CH[k].start + 0.7, 'pop', 0.22);
    for (const st of stepTimes(k)) add(st + 0.08, 'blip', 0.2);
  }
  add(wordTime('c1_0', 'gewinde'), 'click', 0.35); add(wordTime('c1_1', 'adapter') + 0.6, 'click', 0.35);
  add(wordTime('c2_0', 'drehen'), 'click', 0.4); add(wordTime('c2_2', 'drück') + 0.2, 'click', 0.4);
  add(wordTime('c3_1', 'aufsetzen') + 0.4, 'click', 0.4); for (let i = 0; i < 3; i++) add(wordTime('c3_1', 'uhrzeigersinn') + i * 0.35, 'key', 0.3);
  add(wordTime('c4_0', 'stufe'), 'blip', 0.25); add(wordTime('c4_2', 'heb') + 0.8, 'thump', 0.2);
  for (const cta of [CTA1, CTA2]) { add(cta.t0 + 0.1, 'bloop', 0.3); add(cta.sub, 'click', 0.5); if (cta.like) add(cta.like, 'click', 0.45); }
  add(CH[OUT].start + 0.1, 'whoosh', 0.4);
  for (const w of ['prüfen', 'kopf', 'testen', 'drauf', 'einstellen']) add(wordTime('c5_0', w), 'blip', 0.18);
  add(wordTime('c5_1', 'abonnier'), 'click', 0.5);
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
    for (const t of times_) { DOC_POS.clear(); drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
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

export { valveSection, headSide, headSmart, valveFront, turnArrow, DATA, CH, SEC, captions, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow, pill, cover, spring, seg, easeOut, easeInOut, lerp, clamp, wordTime, fitSize, check, bell, thumb };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
