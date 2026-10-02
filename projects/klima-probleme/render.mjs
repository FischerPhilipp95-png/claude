// „Die 5 häufigsten Probleme mit Klimaanlagen“, YouTube 16:9. Grammatik: refs/ref-08 (Design-Tool-Board mit
// Multiplayer-Cursorn, getippten Notizen, dunklem Prompt-Panel mit Limetten-Knopf, Kamerafahrten mit Unschärfe).
// Zeiten: sections.json (Sprecher), Fakten: shotlist.md, Fotos: photos/credits.json.
//   node projects/klima-probleme/render.mjs --timeline | --contact | --still 20,50 | [--from s --to s]
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
const P = { Doc: '#FF2E93', Nachbar: '#29A8F5', Mieterin: '#2FCB78', Techniker: '#FF8A00' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const quint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(10 * x));

// ---------- Zeiten aus sections.json ----------
const SEC = JSON.parse(fs.readFileSync(path.join(DIR, 'sections.json'), 'utf8'));
const DUR = SEC.total, BEAT = SEC.beat;
const CH = SEC.chapters.map((c) => ({ ...c, L: c.lines.map((l) => ({ t: l.t, d: l.dur, e: l.t + l.dur })) }));
const ZONES = [[0, 0], [2400, 350], [4800, -150], [7200, 300], [9600, -200], [12000, 250]];

// ---------- Kamera: fährt zu Kapitelbeginn in die nächste Zone, am Ende Übersicht ----------
const PAN = 1.15;
function camera(t) {
  let z = 0;
  for (let k = 1; k < ZONES.length; k++) if (t >= CH[k].start) z = k;
  const ch = CH[z], prev = Math.max(0, z - 1);
  let x = ZONES[z][0], y = ZONES[z][1], zoom = 1, blur = 0;
  if (z > 0 && t < ch.start + PAN) {
    const u = seg(t, ch.start, ch.start + PAN), q = quint(u);
    x = lerp(ZONES[prev][0], ZONES[z][0], q); y = lerp(ZONES[prev][1], ZONES[z][1], q);
    zoom = 1 - 0.32 * Math.sin(Math.PI * u); blur = Math.sin(Math.PI * u) ** 2 * 9;
  }
  const out = CH[6];
  if (t >= out.start) {   // Fazit: ganzes Board von oben
    const u = quint(seg(t, out.start, out.start + 1.8));
    x = lerp(ZONES[5][0], 6000, u); y = lerp(ZONES[5][1], 100, u); zoom = lerp(1, 0.128, u); blur = Math.sin(Math.PI * seg(t, out.start, out.start + 1.8)) ** 2 * 5;
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
// tippt Text in einem Zeichen-Tempo; gibt sichtbaren Teil zurück
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
  ctx.fillStyle = name === 'Mieterin' || name === 'Nachbar' ? '#06222e' : '#fff'; if (name === 'Mieterin') ctx.fillStyle = '#05301A';
  ctx.fillText(name, 27, 43);
  ctx.restore();
}

// ---------- Assets ----------
const IMG = {};
async function loadAssets() {
  IMG.fassade = await loadImage(path.join(DIR, 'photos/fassade_klimageraete.jpg'));
  IMG.garten = await loadImage(path.join(DIR, 'photos/aussengeraet_garten.jpg'));
  IMG.avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
}
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh); ctx.restore();
}

// ================= Inhalte der Kapitel =================
const DATA = {
  1: { title: 'Lärm', who: 'Nachbar', quote: 'Das Außengerät ist viel zu laut.', src: 'r/Handwerker · Reddit', prompt: 'Wie laut darf mein Außengerät sein?',
    visual: 'fassade', credit: 'Foto: Shixart1985, CC BY 2.0, Wikimedia Commons', result: 'db',
    check: ['Nicht in Schacht oder Ecke', 'Abstand zum Nachbarfenster', 'Schwingungsdämpfer', 'Nachts Flüstermodus'] },
  2: { title: 'Kühlt nicht richtig', who: 'Mieterin', quote: 'Die Klimaanlage hat seit Tag 1 nicht richtig funktioniert.', src: 'r/Apartmentliving · übersetzt', prompt: 'Warum kühlt meine Klimaanlage nicht?',
    visual: 'filter', result: 'causes', check: ['Filter reinigen', 'Kältemittel nur vom Fachbetrieb', 'Vereisung = Warnsignal', 'Leistung passend wählen'] },
  3: { title: 'Kosten', who: 'Nachbar', quote: '10.000 € hat das gekostet … und trotzdem fiel sie ständig aus.', src: 'r/hvacadvice · übersetzt', prompt: 'Was kostet eine Klimaanlage wirklich?',
    visual: 'garten', credit: 'Foto: Shixart1985, CC BY 2.0, Wikimedia Commons', result: 'costs', check: ['Max. 6 °C kühler als draußen', 'Tagsüber verschatten', 'Split statt Monoblock', 'Effizienzklasse beachten'] },
  4: { title: 'Fehler, die keiner findet', who: 'Mieterin', quote: 'Jedes Mal sagen sie, sie können nichts Falsches am System finden.', src: 'r/hvacadvice · übersetzt', prompt: 'Störung kommt nur manchmal. Was tun?',
    visual: 'error', result: 'log', check: ['Fehlercode fotografieren', 'Zeit & Wetter notieren', 'Jährlich warten lassen', 'Gewährleistung nutzen'] },
  5: { title: 'Erlaubnis', who: 'Techniker', quote: 'In meinem Haus musst du von allen eine Unterschrift bekommen …', src: 'r/wien · Reddit', prompt: 'Darf ich eine Klimaanlage einbauen?',
    visual: 'fassade', credit: 'Foto: Shixart1985, CC BY 2.0, Wikimedia Commons', result: 'law', check: ['Beschluss beantragen', 'Standort & Lärm vorab klären', 'Als Mieter: Vermieter fragen', 'Alles schriftlich'] },
};

// Ereignis-Zeiten eines Kapitels (auf die Sätze gelegt)
function times(k) {
  const c = CH[k], L = c.L, last = L[L.length - 1];
  const qStart = L[0].t + 1.6, qEnd = qStart + DATA[k].quote.length / 30;
  const pStart = L[1].t - 0.2, typeStart = L[1].t + 0.2, typeEnd = typeStart + DATA[k].prompt.length / 32, click = typeEnd + 0.25, result = click + 0.7;
  const checkStart = (k === 4 ? L[2].t : last.t) + 0.3, checkStep = Math.max(0.55, (last.e - checkStart - 0.4) / 4);
  return { c, qStart, qEnd, pStart, typeStart, typeEnd, click, result, checkStart, checkStep, end: c.end, start: c.start, L };
}

// ----- kleine Grafiken -----
function visualCard(ctx, t, k, x, y, w, h, tin) {
  const d = DATA[k], p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  ctx.save(); rrect(ctx, 0, 0, w, h, 14); ctx.clip();
  if (d.visual === 'fassade') cover(ctx, IMG.fassade, 0, 0, w, h, 0.6, 0.38);
  else if (d.visual === 'garten') cover(ctx, IMG.garten, 0, 0, w, h, 0.5, 0.45);
  else {
    ctx.fillStyle = '#F4F4F2'; ctx.fillRect(0, 0, w, h);
    if (d.visual === 'filter') {   // Innengerät mit herausgezogenem, verstaubtem Filter
      ctx.fillStyle = '#fff'; shadow(ctx, 0.1, 16, 6); rrect(ctx, w * 0.12, h * 0.16, w * 0.76, h * 0.3, 20); ctx.fill(); noShadow(ctx);
      ctx.strokeStyle = '#D9D9D9'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.18, h * 0.38); ctx.lineTo(w * 0.82, h * 0.38); ctx.stroke();
      const fy = h * 0.55 + Math.sin(t * 2) * 4;
      ctx.fillStyle = '#C8C3B5'; rrect(ctx, w * 0.2, fy, w * 0.6, h * 0.3, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(80,70,50,0.35)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(w * 0.2 + i * w * 0.6 / 18, fy); ctx.lineTo(w * 0.2 + i * w * 0.6 / 18, fy + h * 0.3); ctx.stroke(); }
      ctx.fillStyle = 'rgba(120,105,80,0.25)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(w * (0.22 + ((i * 37) % 56) / 100), fy + h * 0.02 + ((i * 53) % 26) / 100 * h, 3, 0, 7); ctx.fill(); }
      text(ctx, 'Filter', w * 0.5, h * 0.95, 20, 'ISB', C.gray, 'center');
    }
    if (d.visual === 'error') {    // Fernbedienung/Display mit Fehlercode
      ctx.fillStyle = C.panel; rrect(ctx, w * 0.2, h * 0.14, w * 0.6, h * 0.66, 22); ctx.fill();
      ctx.fillStyle = '#20221a'; rrect(ctx, w * 0.27, h * 0.22, w * 0.46, h * 0.26, 10); ctx.fill();
      const blink = Math.floor(t * 2.5) % 2 === 0;
      text(ctx, blink ? 'E5' : '', w * 0.5, h * 0.42, 64, 'IXB', C.lime, 'center');
      for (let i = 0; i < 6; i++) { ctx.fillStyle = '#2b2b2e'; ctx.beginPath(); ctx.arc(w * (0.35 + (i % 3) * 0.15), h * (0.58 + Math.floor(i / 3) * 0.1), 12, 0, 7); ctx.fill(); }
      text(ctx, 'Beispiel-Fehlercode', w * 0.5, h * 0.93, 18, 'ISB', C.gray, 'center');
    }
  }
  ctx.restore();
  ctx.restore();
  if (d.credit) text(ctx, d.credit, x, y + h + 22, 14, 'IM', C.gray);
  const sel = 1 - seg(t, tin + 0.9, tin + 1.2);
  selection(ctx, x, y, w, h, sel * clamp(p * 2));
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
  // Zeilen so umbrechen wie der fertige Text, damit nichts springt
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
  text(ctx, 'SO HILFST DU DIR', 28, 44, 16, 'ISB', C.gray, 'left', 1, 2.4);
  let cx = 0, cy = 0;
  d.check.forEach((s, i) => {
    const ti = T.checkStart + i * T.checkStep, on = easeOut(seg(t, ti, ti + 0.25)), yy = 82 + i * 58;
    ctx.globalAlpha = clamp(p * 2) * lerp(0.35, 1, on);
    ctx.fillStyle = on > 0.5 ? C.lime : '#fff'; ctx.strokeStyle = on > 0.5 ? '#9DBF13' : '#BDBDBD'; ctx.lineWidth = 2;
    rrect(ctx, 28, yy - 4, 30, 30, 8); ctx.fill(); ctx.stroke();
    if (on > 0) { ctx.strokeStyle = C.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(35, yy + 11); ctx.lineTo(41, yy + 17); ctx.lineTo(51 * 1 - (1 - on) * 6, yy + 4 + (1 - on) * 6); ctx.stroke(); }
    text(ctx, s, 74, yy + 20, 24, on > 0.5 ? 'ISB' : 'IM', C.ink);
    if (i === 0 || t >= ti) { cx = 50; cy = yy + 16; }   // Cursor bleibt auf dem zuletzt abgehakten Punkt
  });
  ctx.restore();
  return [x + cx, y + cy];
}

// ----- Ergebnisse im dunklen Panel -----
function resultView(ctx, t, k, x, y, w, h, t0) {
  const r = DATA[k].result, a = (dt, len = 0.5) => easeOut(seg(t, t0 + dt, t0 + dt + len));
  const L = CH[k].L;
  ctx.save();
  if (r === 'db') {
    text(ctx, 'TA LÄRM · ALLGEMEINES WOHNGEBIET', x, y + 28, 16, 'ISB', '#9A9A9A', 'left', a(0), 2);
    text(ctx, 'Grenzwerte am Fenster des Nachbarn', x, y + 70, 30, 'ISB', '#fff', 'left', a(0.1));
    const bx = x, bw = w - 20, by = y + 190, v2x = (db) => bx + (db - 30) / 40 * bw;
    ctx.globalAlpha = a(0.3); ctx.fillStyle = '#2A2A2D'; rrect(ctx, bx, by, bw, 18, 9); ctx.fill();
    for (let db = 30; db <= 70; db += 5) { ctx.fillStyle = '#5A5A5E'; ctx.fillRect(v2x(db) - 1, by + 26, 2, db % 10 ? 8 : 14); if (db % 10 === 0) text(ctx, `${db}`, v2x(db), by + 62, 18, 'IM', '#8A8A8E', 'center'); }
    ctx.globalAlpha = 1;
    const dev = a(L[2].t - t0 + 0.4, 0.7);  // Außengerät 45–60 dB(A)
    if (dev > 0) { ctx.globalAlpha = dev; ctx.fillStyle = 'rgba(255,90,78,0.35)'; rrect(ctx, v2x(45), by - 6, (v2x(60) - v2x(45)) * dev, 30, 8); ctx.fill(); text(ctx, 'Außengerät direkt am Gerät: 45–60 dB(A)', v2x(45), by - 24, 20, 'ISB', C.red); ctx.globalAlpha = 1; }
    for (const [db, lab, dt, col] of [[40, 'nachts 40 dB(A)', 0.6, C.lime], [55, 'tags 55 dB(A)', 1.0, '#fff']]) {
      const q = spring(seg(t, t0 + dt, t0 + dt + 0.5)); if (q <= 0) continue;
      ctx.globalAlpha = clamp(q * 2); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(v2x(db), by + 9, 15 * q, 0, 7); ctx.fill();
      text(ctx, lab, v2x(db), by + 120, 26, 'IXB', col, 'center'); ctx.globalAlpha = 1;
    }
    const z = spring(seg(t, t0 + L[2].t - t0 + 2.6, t0 + L[2].t - t0 + 3.1));
    if (z > 0) { ctx.globalAlpha = clamp(z * 2); ctx.fillStyle = C.panel2; rrect(ctx, x, y + h - 74, 420, 56, 28); ctx.fill(); text(ctx, '+ ca. 3 dB Zuschlag bei Pfeiftönen', x + 24, y + h - 37, 22, 'ISB', C.lime); }
  }
  if (r === 'causes') {
    text(ctx, 'Die 3 häufigsten Ursachen', x, y + 50, 30, 'ISB', '#fff', 'left', a(0));
    [['Filter verschmutzt', 'selbst reinigen'], ['Kältemittel fehlt', 'nur Fachbetrieb'], ['Gerät zu klein', 'falsch dimensioniert']].forEach(([h1, h2], i) => {
      const q = spring(seg(t, t0 + 0.3 + i * 0.35, t0 + 0.8 + i * 0.35)); if (q <= 0) return;
      const cx = x + i * ((w - 20) / 3), cw = (w - 20) / 3 - 16;
      ctx.save(); ctx.globalAlpha = clamp(q * 2); ctx.translate(0, (1 - q) * 20);
      ctx.fillStyle = C.panel2; rrect(ctx, cx, y + 80, cw, 130, 14); ctx.fill();
      text(ctx, `0${i + 1}`, cx + 18, y + 116, 20, 'IXB', C.lime); text(ctx, h1, cx + 18, y + 156, 23, 'ISB', '#fff'); text(ctx, h2, cx + 18, y + 188, 18, 'IM', '#9A9A9A');
      ctx.restore();
    });
    const c2 = a(L[2].t - t0 + 0.3, 0.6);
    if (c2 > 0) {
      ctx.globalAlpha = c2; text(ctx, 'FAUSTREGEL KÜHLLEISTUNG', x, y + 270, 16, 'ISB', '#9A9A9A', 'left', 1, 2);
      text(ctx, '25 m² × 60–100 W', x, y + 326, 40, 'IXB', '#fff');
      const q = easeOut(seg(t, L[2].t + 1.6, L[2].t + 2.2)); if (q > 0) { ctx.globalAlpha = q; text(ctx, '= 1,5–2,5 kW', x + 370, y + 326, 40, 'IXB', C.lime); }
      const q2 = easeOut(seg(t, L[2].t + 4.2, L[2].t + 4.8)); if (q2 > 0) { ctx.globalAlpha = q2; text(ctx, '+ ca. 250 W pro Person im Raum', x, y + 372, 24, 'ISB', '#CFCFCF'); }
      ctx.globalAlpha = 1;
    }
  }
  if (r === 'costs') {
    text(ctx, 'Realistische Kosten', x, y + 50, 30, 'ISB', '#fff', 'left', a(0));
    const rows = [['Split-Gerät für einen Raum, inkl. Montage', '1.500 – 3.500 €', 0.3, 1], ['Strom pro Sommer (gutes Split-Gerät, ca. 130 kWh)', 'ca. 40 – 80 €', L[2].t - t0 + 0.8, 0.12]];
    rows.forEach(([l, v, dt, frac], i) => {
      const q = easeOut(seg(t, t0 + dt, t0 + dt + 0.8)); if (q <= 0) return;
      const yy = y + 100 + i * 120;
      ctx.globalAlpha = q; text(ctx, l, x, yy, 20, 'IM', '#AFAFAF');
      ctx.fillStyle = '#2A2A2D'; rrect(ctx, x, yy + 18, w - 20, 22, 11); ctx.fill();
      ctx.fillStyle = i ? C.lime : '#fff'; rrect(ctx, x, yy + 18, (w - 20) * frac * q, 22, 11); ctx.fill();
      text(ctx, v, x, yy + 82, 32, 'IXB', i ? C.lime : '#fff'); ctx.globalAlpha = 1;
    });
    const q = spring(seg(t, L[3].t + 4.5, L[3].t + 5.1));
    if (q > 0) { ctx.globalAlpha = clamp(q * 2); ctx.fillStyle = C.panel2; rrect(ctx, x, y + h - 74, 520, 56, 28); ctx.fill(); text(ctx, 'Split statt Monoblock: 30–50 % weniger Strom', x + 24, y + h - 37, 21, 'ISB', C.lime); ctx.globalAlpha = 1; }
  }
  if (r === 'log') {
    text(ctx, 'Störungs-Protokoll (Beispiel)', x, y + 50, 30, 'ISB', '#fff', 'left', a(0));
    const cols = ['Datum', 'Uhrzeit', 'Außen', 'Code', 'Foto/Video'], cx = [0, 150, 290, 420, 540];
    cols.forEach((c, i) => text(ctx, c, x + cx[i], y + 110, 18, 'ISB', '#8A8A8E', 'left', a(0.2)));
    const rows = [['12.08.', '15:40', '34 °C', 'E5', '✓'], ['14.08.', '16:05', '35 °C', 'E5', '✓'], ['19.08.', '14:20', '33 °C', 'E5', '✓']];
    rows.forEach((r2, i) => {
      const q = easeOut(seg(t, t0 + 0.6 + i * 0.6, t0 + 1.0 + i * 0.6)); if (q <= 0) return;
      const yy = y + 160 + i * 62; ctx.globalAlpha = q; ctx.fillStyle = C.panel2; rrect(ctx, x - 12, yy - 38, w - 10, 52, 10); ctx.fill();
      r2.forEach((v, j) => text(ctx, v, x + cx[j], yy, 24, j === 3 ? 'IXB' : 'IM', j === 3 ? C.lime : '#fff'));
      ctx.globalAlpha = 1;
    });
    const q = easeOut(seg(t, t0 + 2.6, t0 + 3.1));
    if (q > 0) text(ctx, 'Muster erkennbar: immer bei über 33 °C → hilft dem Techniker.', x, y + h - 30, 20, 'IM', '#CFCFCF', 'left', q);
  }
  if (r === 'law') {
    text(ctx, 'So ist es in Deutschland', x, y + 50, 30, 'ISB', '#fff', 'left', a(0));
    const cards = [['§ 20 WEG', 'Beschluss der Eigentümer, einfache Mehrheit (seit 2020)', 0.3],
      ['BGH, 17.07.2026', 'V ZR 162/25: Anspruch auf Gestattung. Lärm-Sorgen allein reichen nicht.', L[2].t - t0 + 0.3],
      ['Mieter', 'brauchen immer die Zustimmung des Vermieters', L[3].t - t0 + 0.2]];
    cards.forEach(([h1, h2], i) => {
      const dt = cards[i][2], q = spring(seg(t, t0 + dt, t0 + dt + 0.55)); if (q <= 0) return;
      const yy = y + 86 + i * 104; ctx.save(); ctx.globalAlpha = clamp(q * 2); ctx.translate((1 - q) * 30, 0);
      ctx.fillStyle = C.panel2; rrect(ctx, x, yy, w - 20, 88, 14); ctx.fill();
      ctx.fillStyle = C.lime; rrect(ctx, x, yy, 8, 88, 4); ctx.fill();
      text(ctx, h1, x + 28, yy + 36, 24, 'IXB', '#fff'); ctx.font = '19px IM'; const lines = wrap(ctx, h2, w - 90);
      lines.slice(0, 2).forEach((ln, j) => text(ctx, ln, x + 28, yy + 64 + j * 22, 19, 'IM', '#BDBDBD'));
      ctx.restore();
    });
    text(ctx, 'Österreich: eigene Regeln im WEG 2002', x, y + h - 14, 18, 'IM', '#8A8A8E', 'left', a(0.6));
  }
  ctx.restore();
}

function panel(ctx, t, k, x, y, w, h, T) {
  const d = DATA[k], p = spring(seg(t, T.pStart, T.pStart + 0.6));
  if (p <= 0) return { bx: x, by: y };
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, 0, 0, w, h, 22); ctx.fill(); noShadow(ctx);
  // Kopfzeile mit Reitern (wie ein Tool-Panel)
  ctx.fillStyle = C.lime; rrect(ctx, 22, 20, 26, 26, 7); ctx.fill(); text(ctx, 'Doc', 58, 40, 17, 'ISB', '#fff');
  ['Diagnose', 'Fakten', 'Lösung'].forEach((s, i) => { const on = (i === 0 && t < T.result) || (i === 1 && t >= T.result); ctx.fillStyle = on ? '#2A2A2D' : 'transparent'; rrect(ctx, 150 + i * 120, 16, 110, 34, 17); ctx.fill(); text(ctx, s, 205 + i * 120, 39, 16, 'IM', on ? '#fff' : '#8A8A8E', 'center'); });
  // Ergebnis-Bereich: erst Lade-Punkte, dann Antwort
  const ax = 40, ay = 80, aw = w - 80, ah = h - 210;
  if (t >= T.click && t < T.result + 0.2) {
    const q = seg(t, T.click, T.result);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 6; j++) { const v = 0.5 + 0.5 * Math.sin(t * 9 - i * 0.6 - j * 0.4); ctx.globalAlpha = clamp(p * 2) * v * (1 - seg(t, T.result, T.result + 0.2)) * Math.min(1, q * 3); ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(ax + 40 + i * 48, ay + 80 + j * 40, 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = clamp(p * 2);
  }
  if (t >= T.result) resultView(ctx, t, k, ax, ay, aw, ah, T.result);
  // Eingabezeile
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
  return { tx: x + 54 + ctx.measureText(s).width, ty: y + iy + 50, bx: x + bxr, by: y + byr };
}

// ----- eine Problem-Zone -----
function zone(ctx, t, k) {
  const T = times(k), d = DATA[k];
  // Rahmen-Name wie im Design-Tool + großer Titel
  const tin = easeOut(seg(t, T.start + 0.5, T.start + 1.0));
  text(ctx, `Frame · 0${k} ${d.title}`, -900, -470, 17, 'IM', C.gray, 'left', tin);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -440, 88, 70, 16); ctx.fill(); text(ctx, `0${k}`, -856, -390, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -790, -385, 66, 'IXB', C.ink);
  ctx.restore();
  // linke Spalte: Zitat, Bild, Checkliste
  const q = quoteNote(ctx, t, k, -900, -330, 760, T);
  visualCard(ctx, t, k, -900, -90 + (q.h ? q.h - 170 : 0), 380, 300, T.L[0].t + 0.7);
  const ck = checklist(ctx, t, k, -490, -90 + (q.h ? q.h - 170 : 0), 400, T);
  // rechte Seite: dunkles Diagnose-Panel
  const pn = panel(ctx, t, k, 20, -400, 900, 760, T);
  // Cursor: Persona tippt das Zitat, Doc tippt die Frage und klickt, danach hakt Doc die Liste ab
  // nur Cursor zeigen, die gerade etwas tun: die Persona nur beim Tippen des Zitats
  const who = d.who;
  cursor(ctx, q.cx, q.cy, who, easeOut(seg(t, T.start + 0.3, T.start + 0.9)) * (1 - easeOut(seg(t, T.qEnd + 0.3, T.qEnd + 0.8))));
  let dx, dy, press = 0;
  if (t < T.pStart) { dx = 600; dy = 420; }
  else if (t < T.click) { const u = easeOut(seg(t, T.pStart, T.typeStart)); dx = lerp(600, pn.tx ?? 400, u); dy = lerp(420, (pn.ty ?? 300) + 10, u); }
  else if (t < T.click + 0.5) { const u = easeOut(seg(t, T.typeEnd, T.click)); dx = lerp(pn.tx ?? 400, pn.bx, u); dy = lerp((pn.ty ?? 300) + 10, pn.by, u); press = t >= T.click ? Math.sin(Math.PI * seg(t, T.click, T.click + 0.2)) : 0; }
  else if (t < T.checkStart) { dx = pn.bx - 60; dy = pn.by - 60; }
  else { const u = easeOut(seg(t, T.checkStart - 0.4, T.checkStart)); dx = lerp(pn.bx - 60, ck[0], u); dy = lerp(pn.by - 60, ck[1], u); }
  // Doc erscheint erst, wenn er die Frage tippt, und verschwindet nach dem letzten Häkchen
  const lastCheck = T.checkStart + (d.check.length - 1) * T.checkStep + 0.6;
  cursor(ctx, dx, dy, 'Doc', easeOut(seg(t, T.pStart - 0.4, T.pStart)) * (1 - easeOut(seg(t, lastCheck, lastCheck + 0.5))), press);
}

// ----- Intro-Zone -----
function zoneIntro(ctx, t) {
  const c = CH[0];
  // Doc zieht ein Textfeld auf und tippt
  const box = easeOut(seg(t, 0.3, 0.9));
  const w1 = 'Der Handwerksdoktor';
  const s1 = typed(w1, t, 0.9, 26);
  ctx.save();
  const av = spring(seg(t, 0.4, 1.0)), ax = -560, ay = -230;
  if (av > 0) { ctx.save(); ctx.translate(ax, ay); ctx.scale(av, av); ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -44, -44, 88, 88); ctx.restore(); }
  const tw = text(ctx, s1, -495, -212, 54, 'IXB', C.ink, 'left', box);
  if (t < 2.2) selection(ctx, -505, -270, Math.max(40, tw + 20), 80, box);
  const fp = easeOut(seg(t, 2.0, 2.4));
  ctx.font = '54px IXB'; const nx = -495 + ctx.measureText(w1).width + 22;
  ctx.font = '50px IR'; const ux = nx + ctx.measureText('über').width + 20;
  text(ctx, 'über', nx, -212, 50, 'IR', C.gray, 'left', fp);
  // Klima-Icon (Innengerät) + „Klimaanlagen“
  const ip = spring(seg(t, 2.3, 2.9));
  if (ip > 0) { ctx.save(); ctx.translate(ux + 40, -230); ctx.scale(ip, ip); ctx.fillStyle = '#fff'; shadow(ctx, 0.12, 14, 4); rrect(ctx, -40, -24, 80, 42, 12); ctx.fill(); noShadow(ctx); ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, 6); ctx.lineTo(28, 6); ctx.stroke(); ctx.strokeStyle = '#6EC3FF'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 16, 24); ctx.quadraticCurveTo(i * 16 + 6, 34, i * 16, 44); ctx.stroke(); } ctx.restore(); }
  text(ctx, typed('Klimaanlagen', t, 2.6, 26), ux + 100, -212, 54, 'IXB', C.ink, 'left', 1);
  // großer Titel
  const tp = seg(t, c.L[0].t + 0.3, c.L[0].t + 0.8);
  if (tp > 0) {
    ctx.globalAlpha = easeOut(tp);
    text(ctx, 'Die', -560, -40, 120, 'IXB', C.ink);
    ctx.fillStyle = C.lime; rrect(ctx, -330, -150, 130, 140, 26); ctx.fill(); text(ctx, '5', -265, -40, 120, 'IXB', C.ink, 'center');
    text(ctx, 'häufigsten', -170, -40, 120, 'IXB', C.ink);
    text(ctx, 'Probleme mit Klimaanlagen', -560, 70, 80, 'IXB', C.ink, 'left', easeOut(seg(t, c.L[0].t + 0.7, c.L[0].t + 1.2)));
    ctx.globalAlpha = 1;
  }
  // Fassaden-Foto wird abgelegt
  const pp = spring(seg(t, c.L[1].t, c.L[1].t + 0.6));
  if (pp > 0) {
    ctx.save(); ctx.translate(520, 260); ctx.rotate(0.03); ctx.scale(pp, pp); shadow(ctx, 0.18, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, -170, -120, 340, 240, 12); ctx.fill(); noShadow(ctx);
    ctx.beginPath(); ctx.roundRect(-170, -120, 340, 240, 12); ctx.clip(); cover(ctx, IMG.fassade, -170, -120, 340, 240, 0.65, 0.35); ctx.restore();
    if (t < c.L[1].t + 1.4) selection(ctx, 350, 140, 340, 240, 1);
    text(ctx, 'Foto: Shixart1985, CC BY 2.0, Wikimedia Commons', 350, 410, 13, 'IM', C.gray, 'left', pp);
  }
  // Problem-Chips
  ['Lärm', 'Kühlung', 'Kosten', 'Fehlersuche', 'Erlaubnis'].forEach((s, i) => {
    const q = spring(seg(t, c.L[1].t + 1.6 + i * 0.35, c.L[1].t + 2.1 + i * 0.35)); if (q <= 0) return;
    ctx.save(); ctx.translate(-560 + i * 172, 190); ctx.scale(q, q); ctx.font = '22px ISB'; const w = ctx.measureText(s).width + 36;
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -22, w, 44, 22); ctx.fill(); noShadow(ctx);
    text(ctx, `${i + 1}`, 14, 8, 18, 'IXB', C.gray); text(ctx, s, 34, 8, 22, 'ISB', C.ink); ctx.restore();
  });
  ctx.restore();
  // Cursor: Doc tippt, die anderen kommen dazu
  const dx = t < 3.4 ? -495 + tw + 10 : lerp(-495 + tw + 10, 500, easeOut(seg(t, 3.4, 4.2))), dy = t < 3.4 ? -230 : lerp(-230, 220, easeOut(seg(t, 3.4, 4.2)));
  cursor(ctx, dx, dy, 'Doc', 1 - easeOut(seg(t, 4.6, 5.1)));
}

// ----- Fazit: Übersicht + Checkliste + Endkarte (Bildschirm-Ebene) -----
function outroOverlay(ctx, t) {
  const c = CH[6];
  const p = spring(seg(t, c.L[0].t - 0.2, c.L[0].t + 0.4)), endP = spring(seg(t, c.L[1].t, c.L[1].t + 0.6));
  if (p > 0 && endP < 1) {
    const items = ['Richtig aufstellen', 'Richtig dimensionieren', 'Regelmäßig warten', 'Störungen dokumentieren', 'Erlaubnis klären'];
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * (1 - endP); ctx.translate(CX, CY); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p));
    shadow(ctx, 0.3, 60, 20); ctx.fillStyle = C.panel; rrect(ctx, -420, -300, 840, 600, 26); ctx.fill(); noShadow(ctx);
    text(ctx, 'KURZ GESAGT', -360, -230, 18, 'ISB', '#9A9A9A', 'left', 1, 3);
    items.forEach((s, i) => {
      const ti = c.L[0].t + 0.9 + i * 1.15, on = easeOut(seg(t, ti, ti + 0.3)), yy = -160 + i * 88;
      ctx.fillStyle = on > 0.5 ? C.lime : '#2A2A2D'; rrect(ctx, -360, yy - 30, 46, 46, 12); ctx.fill();
      if (on > 0) { ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-349, yy - 7); ctx.lineTo(-340, yy + 3); ctx.lineTo(-326, yy - 16); ctx.stroke(); }
      text(ctx, s, -290, yy + 6, 40, 'IXB', on > 0.5 ? '#fff' : '#6A6A6E');
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
    const bp = spring(seg(t, c.L[1].t + 2.5, c.L[1].t + 3.1));
    if (bp > 0) { ctx.save(); ctx.translate(0, 230); ctx.scale(bp, bp); ctx.fillStyle = C.ink; rrect(ctx, -170, -40, 340, 80, 40); ctx.fill(); text(ctx, 'Abonnieren', 0, 13, 32, 'IXB', C.lime, 'center'); ctx.restore(); }
    ctx.restore();
    const cu = easeOut(seg(t, c.L[1].t + 3.0, c.L[1].t + 3.8)), clickT = c.L[1].t + 3.9;
    if (cu > 0) cursor(ctx, lerp(1500, CX + 90, cu), lerp(1000, CY + 185, cu), 'Doc', 1, t > clickT ? Math.sin(Math.PI * seg(t, clickT, clickT + 0.2)) : 0);
  }
}

// ---------- Mitlaufende Untertitel (Wort-Timing aus captions.py / Whisper) ----------
// Häppchen aus max. 3 Wörtern, Umbruch nach Satzzeichen; das gesprochene Wort leuchtet Limette und ploppt.
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
function captions(ctx, t) {
  const c = CAPS.find((k) => t >= k.t0 && t < k.t1);
  if (!c) return;
  const size = 58, gap = 18, padX = 34, y = 1000;
  ctx.font = `${size}px IXB`; ctx.letterSpacing = '-1px';
  const ws = c.ws.map((w) => ({ ...w, wd: ctx.measureText(w.w).width }));
  const total = ws.reduce((a, w) => a + w.wd, 0) + gap * (ws.length - 1);
  const pop = spring(seg(t, c.t0, c.t0 + 0.18));
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(0.8, 1, pop), lerp(0.8, 1, pop)); ctx.globalAlpha = clamp(pop * 1.5);
  shadow(ctx, 0.28, 24, 8); ctx.fillStyle = C.panel; rrect(ctx, -total / 2 - padX, -size * 0.92, total + padX * 2, size * 1.5, 22); ctx.fill(); noShadow(ctx);
  let x = -total / 2;
  ws.forEach((w, i) => {
    const active = t >= w.s && (i === ws.length - 1 || t < ws[i + 1].s), said = t >= w.s;
    const sc = active ? 1 + 0.14 * (1 - easeOut(seg(t, w.s, w.s + 0.16))) : 1;
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
  // Unschärfe nicht pro Zeichenbefehl (sehr langsam), sondern einmal auf das fertige Board
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
    if (cam.zoom < 0.5) {   // in der Übersicht: Rahmen der Zonen
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, -960, -520, 1920, 1040, 30); ctx.fill();
      ctx.strokeStyle = 'rgba(76,141,255,0.6)'; ctx.lineWidth = 8; ctx.stroke();
    }
    const tt = k === 0 ? Math.min(t, CH[1].start + PAN) : k < 6 ? Math.min(t, (CH[k + 1] ?? CH[6]).start + PAN) : t;
    if (k === 0) zoneIntro(ctx, tt); else zone(ctx, tt, k);
    ctx.restore();
  });
  ctx.restore();
  if (blurred) {
    out.fillStyle = C.bg; out.fillRect(0, 0, W, H);
    out.filter = `blur(${cam.blur.toFixed(1)}px)`; out.drawImage(BLUR_CANVAS, 0, 0); out.filter = 'none';
  }
  if (t >= CH[6].start) outroOverlay(out, t);
  captions(out, t);
}

// ---------- Sounds ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  for (let i = 0; i < 19; i += 2) add(0.9 + i / 26, 'key', 0.18);
  for (let k = 1; k <= 5; k++) {
    const T = times(k);
    add(T.start + 0.1, 'whoosh', 0.35);
    for (let i = 0; i < DATA[k].quote.length; i += 3) add(T.qStart + i / 30, 'key', 0.14);
    add(T.L[0].t + 0.7, 'pop', 0.25);
    for (let i = 0; i < DATA[k].prompt.length; i += 3) add(T.typeStart + i / 32, 'key', 0.14);
    add(T.click, 'click', 0.45);
    for (let i = 0; i < 4; i++) add(T.checkStart + i * T.checkStep, 'blip', 0.18);
  }
  add(CH[6].start + 0.1, 'whoosh', 0.4);
  for (let i = 0; i < 5; i++) add(CH[6].L[0].t + 0.9 + i * 1.15, 'blip', 0.18);
  add(CH[6].L[1].t + 3.9, 'click', 0.45);
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
    const times_ = args[0] === '--still' ? args[1].split(',').map(Number)
      : SEC.chapters.flatMap((c) => c.lines.map((l) => l.t + l.dur * 0.85));
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
      const out = path.join(DIR, 'out', 'contact_sheet.png'); fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
