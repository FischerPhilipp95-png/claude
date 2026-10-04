// „DeLonghi Magnifica S: kein Wasser, rote Lampen blinken? 6 Lösungen“, YouTube 16:9.
// Grammatik wie projects/heizungsdruck: Board, feste Kamera (fährt nur beim Kapitelwechsel), nur aktive Cursor,
// dunkles Panel mit Limette, mitlaufende Untertitel. Neu: Lampen-Decoder, Szenen aus dem eigenen Video, Abo-Aufrufe.
// Fakten: shotlist.md (Bedienungsanleitung ECAM22.110.SB), Fotos: photos/credits.json, Video: footage/original.mp4.
//   node projects/delonghi-kein-wasser/render.mjs --timeline | --contact | --still 20,50 | [--from s --to s]
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const ZONES = [[0, 0], [2400, 300], [4800, -150], [7200, 250], [9600, -200], [12000, 250], [14400, -150], [16800, 200]];

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
    x = lerp(last[0], 8400, u); y = lerp(last[1], 30, u); zoom = lerp(1, 0.105, u);
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
  IMG.espresso = await loadImage(path.join(DIR, 'photos/pexels_magnifica_espresso.jpg'));
  IMG.cappu = await loadImage(path.join(DIR, 'photos/pexels_magnifica_cappuccino.jpg'));
  IMG.avatar = await loadImage(path.join(ROOT, 'assets/channel_avatar.jpg'));
}
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh); ctx.restore();
}

// ---------- Eigenes Video: kurze Szenen als Einzelbilder (build.sh extrahiert sie nach out/frames) ----------
// A: Tasse bleibt leer (Quelle 2–10,6 s) · B: rote Lampen, ganze Maschine (29,5–36,5 s) · C: dieselbe Stelle, Zoom aufs Bedienfeld
const CLIPS = { A: { n: 258 }, B: { n: 210 }, C: { n: 210 } };
const FCACHE = new Map(), MISSING = new Map();
// gibt das Bild zurück, wenn es geladen ist; sonst merkt es sich den Wunsch (main lädt nach und zeichnet neu)
function clipFrame(name, s, loop = true) {
  const n = CLIPS[name].n, i = Math.max(0, Math.floor(s * 30)), per = 2 * (n - 1);
  const idx = loop ? (i % per < n ? i % per : per - (i % per)) : Math.min(n - 1, i);   // Schleife vor und zurück, damit nichts springt
  const key = name + idx;
  if (FCACHE.has(key)) return FCACHE.get(key);
  MISSING.set(key, path.join(DIR, 'out/frames', name, `${String(idx + 1).padStart(4, '0')}.jpg`));
  return null;
}
async function loadMissing() {
  const n = MISSING.size;
  for (const [key, f] of MISSING) { FCACHE.set(key, await loadImage(f)); while (FCACHE.size > 60) FCACHE.delete(FCACHE.keys().next().value); }
  MISSING.clear(); return n;
}
async function drawFrameLoaded(ctx, t, draw = drawFrame) {
  MISSING.clear(); draw(ctx, t);
  if (await loadMissing()) draw(ctx, t);
}
// Maschinengeräusch aus dem Originalvideo: wann (t) welcher Ausschnitt (src) läuft – build.sh mischt es in sfx.wav
const T_BLINK = wordTime('c0_1', 'blinken');
const FOOT_AUDIO = [{ t: 0.3, src: 2.0, dur: T_BLINK - 0.35 - 0.3, gain: 0.9 }, { t: T_BLINK - 0.35, src: 29.5, dur: CH[0].L[2].t + 0.4 - (T_BLINK - 0.35), gain: 0.9 }];
function recTag(ctx, x, y, t, label = 'ECHTE AUFNAHME') {
  ctx.font = '15px IXB'; ctx.letterSpacing = '1.5px'; const w = ctx.measureText(label).width + 50; ctx.letterSpacing = '0px';
  ctx.fillStyle = 'rgba(12,12,13,0.78)'; rrect(ctx, x, y, w, 32, 16); ctx.fill();
  ctx.fillStyle = Math.floor(t * 1.6) % 2 ? '#FF3B30' : '#7A1E19'; ctx.beginPath(); ctx.arc(x + 18, y + 16, 6, 0, 7); ctx.fill();
  text(ctx, label, x + 32, y + 21, 15, 'IXB', '#fff', 'left', 1, 1.5);
}

// ================= Lampen-Symbole (wie auf dem Bedienfeld im Video) =================
function lampIcon(ctx, kind, cx, cy, s, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.09; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'tank') {   // Behälter mit Laschen oben und Wasserwellen
    ctx.beginPath(); ctx.moveTo(-s * 0.42, -s * 0.38); ctx.lineTo(-s * 0.32, -s * 0.38); ctx.lineTo(-s * 0.32, s * 0.38); ctx.lineTo(s * 0.32, s * 0.38); ctx.lineTo(s * 0.32, -s * 0.38); ctx.lineTo(s * 0.42, -s * 0.38); ctx.stroke();
    for (const yy of [-0.08, 0.14]) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = lerp(-0.22, 0.22, i / 12) * s, y = (yy + 0.035 * Math.sin(i * 1.6)) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  } else if (kind === 'descale') {   // Kanne, die ausgießt
    ctx.rotate(-0.35);
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.12, -s * 0.3); ctx.lineTo(s * 0.18, s * 0.36); ctx.lineTo(-s * 0.3, s * 0.36); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.22); ctx.quadraticCurveTo(s * 0.42, -s * 0.2, s * 0.36, s * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.46, -s * 0.44); ctx.stroke();
  } else {   // Warndreieck mit !
    ctx.beginPath(); ctx.moveTo(0, -s * 0.42); ctx.lineTo(s * 0.46, s * 0.38); ctx.lineTo(-s * 0.46, s * 0.38); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = s * 0.1; ctx.beginPath(); ctx.moveTo(0, -s * 0.14); ctx.lineTo(0, s * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, s * 0.25, s * 0.055, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// Lampe in dunkler Kachel: state 0 = aus, 'on' = leuchtet, 'blink' = blinkt (Takt wie im Video: ca. 1,4 Hz)
function lampTile(ctx, kind, x, y, s, state, t) {
  ctx.fillStyle = '#070708'; rrect(ctx, x, y, s, s, s * 0.18); ctx.fill();
  const lit = state === 'on' || (state === 'blink' && (t * 1.45) % 1 < 0.5);
  if (lit) { ctx.save(); ctx.shadowColor = C.lamp; ctx.shadowBlur = s * 0.35; lampIcon(ctx, kind, x + s / 2, y + s / 2, s * 0.62, C.lamp); ctx.restore(); }
  else lampIcon(ctx, kind, x + s / 2, y + s / 2, s * 0.62, '#2E2E33');
}

// ================= Inhalte der Kapitel =================
// steps: [Text, Satz-ID, Wort, n]  → erscheint genau, wenn das Wort gesprochen wird
const DATA = {
  1: { tag: 'Zuerst', badge: '!', title: 'Was die Lampen bedeuten', src: 'Bedienungsanleitung S. 17' },
  2: { tag: 'Lösung 1 von 6', badge: '1', title: 'Wassertank', cause: 'Zu wenig Wasser oder Tank nicht eingerastet', src: 'Bedienungsanleitung S. 17', card: 'SCHEMA · TANK EINSETZEN',
    steps: [['Frisches Wasser einfüllen', 'c2_0', 'füllen'], ['Fest hineindrücken', 'c2_0', 'fest'], ['Bis er hörbar einrastet', 'c2_0', 'hörbar'], ['Tank-Lampe leuchtet? Sitzt nicht richtig', 'c2_1', 'leuchtet']] },
  3: { tag: 'Lösung 2 von 6', badge: '2', title: 'Luft im System', cause: 'Luft im Wasserkreislauf: es kommt kein Wasser', src: 'Bedienungsanleitung S. 18', card: 'SCHEMA · ENTLÜFTEN',
    steps: [['Dampfdrehknopf auf I stellen', 'c3_1', 'dampfdrehknopf'], ['Etwas Wasser aus dem Milchaufschäumer laufen lassen', 'c3_1', 'lass'], ['So steht es in der Anleitung', 'c3_1', 'empfiehlt']] },
  4: { tag: 'Lösung 3 von 6', badge: '3', title: 'Mahlgrad zu fein', cause: 'Kaffee läuft zu langsam oder gar nicht', src: 'Bedienungsanleitung S. 18', card: 'SCHEMA · MAHLGRAD-DREHKNOPF IM BOHNENBEHÄLTER',
    steps: [['Eine Stufe Richtung 7 drehen', 'c4_1', 'eine'], ['Nur, während das Mahlwerk läuft', 'c4_1', 'während'], ['Wirkung nach 2 Kaffees', 'c4_1', 'wirkung']] },
  5: { tag: 'Lösung 4 von 6', badge: '4', title: 'Ausgüsse verstopft', cause: 'Kaffee kommt nicht aus den Ausgüssen', src: 'Bedienungsanleitung S. 19', card: 'SCHEMA · KAFFEEAUSLAUF VON UNTEN',
    steps: [['Kleine Löcher am Kaffeeauslauf', 'c5_1', 'kleinen'], ['Mit einem Zahnstocher freistechen', 'c5_1', 'zahnstocher']] },
  6: { tag: 'Lösung 5 von 6', badge: '5', title: 'Entkalken', cause: 'Entkalken-Lampe: Maschine muss entkalkt werden', src: 'Anleitung S. 16 · DeLonghi-FAQ', card: 'DEIN BEDIENFELD · ENTKALKEN-LAMPE',
    steps: [['Entkalkungsprogramm starten', 'c6_0', 'starte'], ['Entkalker von DeLonghi nehmen', 'c6_1', 'entkalker'], ['Dauer: ca. 45 Minuten', 'c6_1', '45']] },
  7: { tag: 'Lösung 6 von 6', badge: '6', title: 'Brüheinheit reinigen', cause: 'Maschine innen verschmutzt', src: 'Bedienungsanleitung S. 16, 19', card: 'SCHEMA · BRÜHEINHEIT AUSSPÜLEN',
    steps: [['Brüheinheit herausnehmen', 'c7_0', 'brüheinheit'], ['Unter fließendem Wasser abspülen', 'c7_0', 'spül'], ['Ohne Spülmittel!', 'c7_0', 'ohne'], ['Hilft nichts? Kundendienst', 'c7_1', 'kundendienst']] },
};
const stepTimes = (k) => (DATA[k].steps || []).map((s) => wordTime(s[1], s[2], s[3] || 0) - 0.08);

// ----- Kopf jeder Zone -----
function header(ctx, t, k) {
  const d = DATA[k], tin = easeOut(seg(t, CH[k].start + 0.5, CH[k].start + 1.0));
  text(ctx, d.tag, -900, -462, 18, 'ISB', C.gray, 'left', tin, 1);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -438, 80, 70, 16); ctx.fill(); text(ctx, d.badge, -860, -388, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -796, -383, 60, 'IXB', C.ink);
  ctx.restore();
}

// ----- linke Karte (weiß, dunkler Bildbereich) -----
const CARD = { x: -900, y: -330, w: 820, h: 600 };
function leftCard(ctx, t, k) {
  const tin = CH[k].start + 0.7, p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  const { x, y, w, h } = CARD, L = CH[k].L;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  const vx = 16, vy = 46, vw = w - 32, vh = h - 62;
  if (k === 1 || k === 6) {   // Zoom aufs echte Bedienfeld
    text(ctx, k === 1 ? 'DEIN VIDEO · BEDIENFELD' : DATA[k].card, 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
    const fh = vw * 540 / 960;
    ctx.save(); rrect(ctx, vx, vy, vw, fh, 10); ctx.clip(); const fr = clipFrame('C', t - tin); if (fr) ctx.drawImage(fr, vx, vy, vw, fh); ctx.restore();
    recTag(ctx, vx + 14, vy + 14, t);
    const sc = vw / 960;
    if (k === 6) {   // Ring um die Entkalken-Lampe
      const r = spring(seg(t, wordTime('c6_0', 'entkalken') - 0.1, wordTime('c6_0', 'entkalken') + 0.5));
      if (r > 0) { ctx.save(); ctx.strokeStyle = C.lime; ctx.lineWidth = 6; ctx.globalAlpha = clamp(r * 2); ctx.beginPath(); ctx.arc(vx + 637 * sc, vy + 164 * sc, 62 * sc * lerp(1.6, 1, r), 0, 7); ctx.stroke(); ctx.restore(); }
    }
    const ly = vy + fh + 24;
    if (k === 1) {   // Legende: was im Video zu sehen ist
      text(ctx, 'IN DIESEM VIDEO', vx, ly + 12, 14, 'ISB', C.gray, 'left', 1, 2);
      const row = [['tank', 'blinkt'], ['descale', 'leuchtet'], ['alarm', 'blinkt']];
      row.forEach(([kind, st], i) => { const bx = vx + i * 262; lampTile(ctx, kind, bx, ly + 28, 56, st === 'blinkt' ? 'blink' : 'on', t); text(ctx, st, bx + 70, ly + 66, 24, 'ISB', C.ink); });
    } else {
      text(ctx, 'Im Video: die Entkalken-Lampe leuchtet dauerhaft', vx, ly + 40, 24, 'ISB', C.ink, 'left', easeOut(seg(t, wordTime('c6_0', 'entkalken'), wordTime('c6_0', 'entkalken') + 0.4)));
    }
  } else {
    text(ctx, DATA[k].card, 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
    text(ctx, 'vereinfacht', w - 20, 32, 14, 'ISB', '#AAAAAA', 'right');
    ctx.fillStyle = C.view; rrect(ctx, vx, vy, vw, vh, 10); ctx.fill();
    ctx.save(); rrect(ctx, vx, vy, vw, vh, 10); ctx.clip(); ctx.translate(vx, vy);
    ({ 2: tankDrawing, 3: airDrawing, 4: grindDrawing, 5: spoutDrawing, 7: brewDrawing })[k](ctx, t, vw, vh, L);
    ctx.restore();
  }
  ctx.restore();
  selection(ctx, x, y, w, h, (1 - seg(t, tin + 0.9, tin + 1.2)) * clamp(p * 2));
}

// ----- Schemata (im dunklen Bildbereich, 788 x 538) -----
function tankDrawing(ctx, t, w, h, L) {
  const tF = wordTime('c2_0', 'füllen'), tP = wordTime('c2_0', 'fest'), tK = wordTime('c2_0', 'einrastet'), tUp = wordTime('c2_1', 'sitzt'), tLamp = wordTime('c2_1', 'leuchtet');
  const level = easeInOut(seg(t, tF - 0.3, tF + 1.2)), down = easeInOut(seg(t, tP, tK)), up = easeOut(seg(t, tUp, tUp + 0.5));
  const bx = 250, by = 120, tw = 230, th = 300, lift = lerp(70, 0, down) + up * 26;
  // Aufnahme in der Maschine (Sockel mit Ventil)
  ctx.fillStyle = '#2A2C33'; rrect(ctx, bx - 30, by + th - 10, tw + 60, 90, 14); ctx.fill();
  ctx.fillStyle = '#3E414B'; rrect(ctx, bx + tw / 2 - 22, by + th - 18, 44, 24, 6); ctx.fill();
  text(ctx, 'Aufnahme in der Maschine', bx + tw / 2, by + th + 62, 18, 'ISB', '#8A8A8E', 'center');
  // Tank
  const ty = by - lift;
  ctx.save(); rrect(ctx, bx, ty, tw, th, 18); ctx.clip();
  ctx.fillStyle = 'rgba(155,212,255,0.12)'; ctx.fillRect(bx, ty, tw, th);
  const wl = ty + th - level * (th - 70);
  ctx.fillStyle = 'rgba(57,168,255,0.75)'; ctx.beginPath(); ctx.moveTo(bx, wl);
  for (let i = 0; i <= 20; i++) ctx.lineTo(bx + tw * i / 20, wl + Math.sin(t * 4 + i * 0.9) * 4 * (1 - down * 0.7));
  ctx.lineTo(bx + tw, ty + th); ctx.lineTo(bx, ty + th); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#9BD4FF'; ctx.lineWidth = 4; rrect(ctx, bx, ty, tw, th, 18); ctx.stroke();
  ctx.fillStyle = '#9BD4FF'; rrect(ctx, bx + tw / 2 - 50, ty - 22, 100, 26, 10); ctx.fill();   // Griff
  // Druckpfeil
  const pa = seg(t, tP - 0.4, tP) * (1 - seg(t, tK + 0.3, tK + 0.6));
  if (pa > 0) {
    ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = C.lime; const ax = bx + tw / 2, ay = ty - 120 + Math.sin(t * 10) * 6;
    ctx.fillRect(ax - 9, ay, 18, 50); ctx.beginPath(); ctx.moveTo(ax - 30, ay + 46); ctx.lineTo(ax + 30, ay + 46); ctx.lineTo(ax, ay + 84); ctx.closePath(); ctx.fill();
    text(ctx, 'fest drücken', ax + 50, ay + 50, 24, 'IXB', C.lime); ctx.restore();
  }
  // Klick
  const kp = seg(t, tK, tK + 0.5);
  if (kp > 0 && up < 0.5) {
    ctx.save(); ctx.globalAlpha = 1 - seg(t, tK + 1.6, tK + 2.2);
    ctx.strokeStyle = C.lime; ctx.lineWidth = 4; ctx.globalAlpha *= 1 - kp;
    ctx.beginPath(); ctx.arc(bx + tw / 2, by + th, 40 + kp * 120, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1 - seg(t, tK + 1.6, tK + 2.2);
    text(ctx, 'KLICK!', bx + tw + 60, by + th - 20, 52, 'IXB', C.lime, 'left', spring(seg(t, tK, tK + 0.4)));
    ctx.restore();
  }
  // nicht eingerastet: Spalt + Lampe leuchtet
  if (up > 0) {
    ctx.save(); ctx.globalAlpha = up;
    ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(bx - 40, by + th - 26); ctx.lineTo(bx + tw + 40, by + th - 26); ctx.stroke(); ctx.setLineDash([]);
    text(ctx, 'nicht eingerastet', bx + tw + 50, by + th - 18, 24, 'IXB', C.red);
    ctx.restore();
    const lp = easeOut(seg(t, tLamp, tLamp + 0.3));
    if (lp > 0) { ctx.save(); ctx.globalAlpha = lp; lampTile(ctx, 'tank', w - 150, 40, 100, 'on', t); text(ctx, 'leuchtet', w - 100, 170, 20, 'ISB', '#CFCFCF', 'center'); ctx.restore(); }
    const kw = easeOut(seg(t, wordTime('c2_1', 'kein'), wordTime('c2_1', 'kein') + 0.3));
    text(ctx, 'kein Wasser', w - 100, 205, 22, 'IXB', C.red, 'center', kw);
  }
}
function airDrawing(ctx, t, w, h, L) {
  const tKnob = wordTime('c3_1', 'auf'), tRun = wordTime('c3_1', 'laufen') - 0.9;
  const turn = easeInOut(seg(t, tKnob - 0.2, tKnob + 0.5));
  // Dampfdrehknopf: 0 rechts oben, I links oben (Anleitung: „ganz nach rechts auf Position 0“)
  const kx = 210, ky = 250, r = 105;
  text(ctx, '0', kx + Math.cos(-Math.PI * 0.32) * (r + 34), ky + Math.sin(-Math.PI * 0.32) * (r + 34) + 12, 34, 'IXB', turn < 0.5 ? C.lime : '#8A8A8E', 'center');
  text(ctx, 'I', kx + Math.cos(-Math.PI * 0.68) * (r + 34), ky + Math.sin(-Math.PI * 0.68) * (r + 34) + 12, 34, 'IXB', turn >= 0.5 ? C.lime : '#8A8A8E', 'center');
  shadow(ctx, 0.5, 20, 6); ctx.fillStyle = '#3A3C44'; ctx.beginPath(); ctx.arc(kx, ky, r, 0, 7); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#4A4D57'; ctx.beginPath(); ctx.arc(kx, ky, r * 0.8, 0, 7); ctx.fill();
  const ang = lerp(-Math.PI * 0.32, -Math.PI * 0.68, turn);
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(ang); ctx.fillStyle = '#C9CCD4'; rrect(ctx, 0, -11, r * 0.95, 22, 11); ctx.fill(); ctx.restore();
  text(ctx, 'Dampfdrehknopf', kx, ky + r + 50, 22, 'ISB', '#CFCFCF', 'center');
  // Milchaufschäumer mit Wasser (erst mit Luftblasen, dann gleichmäßig)
  const nx = 560, top = 60, bot = 330;
  ctx.fillStyle = '#8A90A0'; rrect(ctx, nx - 14, top, 28, bot - top, 10); ctx.fill();
  ctx.fillStyle = '#2A2C33'; rrect(ctx, nx - 26, bot - 80, 52, 96, 14); ctx.fill();
  text(ctx, 'Milchaufschäumer', nx - 34, top + 40, 22, 'ISB', '#CFCFCF', 'right');
  ctx.strokeStyle = '#8A90A0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(nx - 70, 420); ctx.lineTo(nx - 60, 515); ctx.lineTo(nx + 60, 515); ctx.lineTo(nx + 70, 420); ctx.stroke();
  const run = seg(t, tRun, tRun + 0.4), air = 1 - seg(t, tRun + 1.0, tRun + 2.6);
  if (run > 0) {
    for (let i = 0; i < 14; i++) {
      const ph = (t * 1.8 + i / 14) % 1, y = bot + 18 + ph * 175;
      ctx.globalAlpha = run; ctx.fillStyle = '#9BD4FF'; ctx.beginPath(); ctx.arc(nx + Math.sin(i * 7) * 3, y, 5, 0, 7); ctx.fill();
      if (air > 0 && i % 3 === 0) { ctx.globalAlpha = run * air; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx + 14 + Math.sin(i) * 8, y - 10, 7, 0, 7); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    const fill = seg(t, tRun, tRun + 6); ctx.fillStyle = 'rgba(57,168,255,0.7)'; ctx.fillRect(nx - 58, 512 - fill * 50, 116, fill * 50);
    text(ctx, air > 0.5 ? 'Luft raus' : 'Wasser kommt', nx + 90, 470, 24, 'IXB', air > 0.5 ? '#fff' : C.blue, 'left', run);
  }
}
function grindDrawing(ctx, t, w, h, L) {
  const tGar = wordTime('c4_0', 'gar'), tStep = wordTime('c4_1', 'eine'), tRun = wordTime('c4_1', 'während'), tW = wordTime('c4_1', 'wirkung');
  const pos = lerp(2, 3, easeInOut(seg(t, tStep, tStep + 0.6)));
  // Drehknopf mit Skala 1 (fein) … 7 (grob)
  const kx = 270, ky = 290, r = 150, ang = (v) => lerp(Math.PI * 0.8, Math.PI * 2.2, (v - 1) / 6);
  ctx.fillStyle = '#3B2A20'; ctx.beginPath(); ctx.arc(kx, ky, r + 60, 0, 7); ctx.fill();   // Bohnen ringsum
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = r + 32; ctx.save(); ctx.translate(kx + Math.cos(a) * rr, ky + Math.sin(a) * rr); ctx.rotate(a); ctx.fillStyle = C.coffee; ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#3B2A20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#2A2C33'; ctx.beginPath(); ctx.arc(kx, ky, r, 0, 7); ctx.fill();
  for (let v = 1; v <= 7; v++) text(ctx, String(v), kx + Math.cos(ang(v)) * r * 0.74, ky + Math.sin(ang(v)) * r * 0.74 + 10, 28, 'IXB', Math.round(pos) === v ? C.lime : '#8A8A8E', 'center');
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(ang(pos)); ctx.fillStyle = '#C9CCD4'; rrect(ctx, -10, -14, r * 0.5, 28, 14); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#C9CCD4'; ctx.beginPath(); ctx.arc(kx, ky, 26, 0, 7); ctx.fill();
  text(ctx, 'fein', kx - 175, ky + 150, 22, 'ISB', '#CFCFCF', 'center'); text(ctx, 'grob', kx + 175, ky + 150, 22, 'ISB', '#CFCFCF', 'center');
  const sp = easeOut(seg(t, tStep, tStep + 0.3)) * (1 - seg(t, tStep + 2.2, tStep + 2.6));
  text(ctx, '+1 Stufe', kx, ky - r - 75, 30, 'IXB', C.lime, 'center', sp);
  // Mahlwerk läuft
  const mr = easeOut(seg(t, tRun - 0.2, tRun + 0.2)) * (1 - seg(t, tW + 1.5, tW + 2));
  if (mr > 0) {
    ctx.save(); ctx.globalAlpha = mr; ctx.translate(w - 190, 110); ctx.rotate(t * 8); ctx.fillStyle = '#FFD400';
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-7, -38, 14, 16); }
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctx.fillStyle = C.view; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.restore();
    text(ctx, 'Mahlwerk läuft', w - 190, 185, 22, 'IXB', '#FFD400', 'center', mr);
  }
  // Tasse: erst nichts, nach zwei Kaffees läuft es
  const cx = w - 190, cy = 430, flow = seg(t, tW + 0.6, tW + 1.0);
  ctx.fillStyle = '#2A2C33'; rrect(ctx, cx - 60, 250, 120, 40, 10); ctx.fill();
  ctx.fillStyle = '#F2F2F2'; ctx.beginPath(); ctx.moveTo(cx - 60, cy - 50); ctx.lineTo(cx + 60, cy - 50); ctx.lineTo(cx + 48, cy + 50); ctx.lineTo(cx - 48, cy + 50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#F2F2F2'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx + 66, cy - 6, 22, -1.2, 1.2); ctx.stroke();
  if (flow > 0) {
    ctx.fillStyle = C.coffee; ctx.fillRect(cx - 4, 290, 8, (cy - 50 - 290) * flow);
    const lv = seg(t, tW + 1.0, tW + 4); ctx.fillStyle = C.coffee; ctx.fillRect(cx - 52 + (1 - lv) * 6, cy + 46 - lv * 80, 104 - (1 - lv) * 12, lv * 80);
    text(ctx, 'läuft wieder', cx, cy + 92, 22, 'IXB', C.lime, 'center', flow);
  } else if (t > tGar - 0.2) text(ctx, 'nichts kommt', cx, cy + 92, 22, 'IXB', C.red, 'center', easeOut(seg(t, tGar - 0.2, tGar + 0.2)));
}
function spoutDrawing(ctx, t, w, h, L) {
  const tPick = wordTime('c5_1', 'stich'), tZ = wordTime('c5_1', 'zahnstocher');
  // Auslauf von unten: Gehäuse mit zwei Düsen, je 5 kleine Löcher
  ctx.fillStyle = '#2A2C33'; rrect(ctx, 134, 120, 520, 260, 60); ctx.fill();
  const holes = [];
  for (const nx of [264, 524]) {
    ctx.fillStyle = '#4A4D57'; ctx.beginPath(); ctx.arc(nx, 250, 82, 0, 7); ctx.fill();
    ctx.fillStyle = '#3A3C44'; ctx.beginPath(); ctx.arc(nx, 250, 66, 0, 7); ctx.fill();
    holes.push([nx, 250]); for (let i = 0; i < 4; i++) holes.push([nx + Math.cos(i * Math.PI / 2 + 0.78) * 36, 250 + Math.sin(i * Math.PI / 2 + 0.78) * 36]);
  }
  // Zahnstocher wandert von Loch zu Loch
  const dur = Math.max(2.4, CH[5].end - tPick - 0.4), per = dur / holes.length;
  holes.forEach(([hx, hy], i) => {
    const done = t > tPick + (i + 0.6) * per;
    ctx.fillStyle = done ? '#050506' : C.coffee; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 7); ctx.fill();
    if (!done) { ctx.fillStyle = '#A0703F'; ctx.beginPath(); ctx.arc(hx - 2, hy - 2, 4, 0, 7); ctx.fill(); }
  });
  text(ctx, 'verstopft', 394, 92, 24, 'IXB', C.red, 'center', 1 - seg(t, tPick + dur * 0.5, tPick + dur * 0.7));
  text(ctx, 'frei', 394, 92, 24, 'IXB', C.lime, 'center', seg(t, tPick + dur * 0.6, tPick + dur * 0.8));
  if (t > tPick - 0.4) {
    const f = clamp((t - tPick) / per, 0, holes.length - 0.01), i = Math.floor(f), q = f - i;
    const [hx, hy] = holes[i], poke = Math.sin(Math.PI * clamp(q * 1.6));
    const tipx = hx + 6 - poke * 8, tipy = hy + 6 - poke * 8, a = easeOut(seg(t, tPick - 0.4, tPick));
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#E8C88E'; ctx.lineCap = 'round'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(tipx + 10, tipy + 10); ctx.lineTo(tipx + 230, tipy + 230); ctx.stroke();
    ctx.fillStyle = '#E8C88E'; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(tipx + 16, tipy + 4); ctx.lineTo(tipx + 4, tipy + 16); ctx.closePath(); ctx.fill(); ctx.restore();
    text(ctx, 'Zahnstocher', 650, 470, 22, 'ISB', '#E8C88E', 'center', easeOut(seg(t, tZ - 0.2, tZ + 0.2)));
  }
}
function brewDrawing(ctx, t, w, h, L) {
  const tSp = wordTime('c7_0', 'spül'), tOhne = wordTime('c7_0', 'ohne'), tK = CH[7].L[1].t;
  const sw = easeInOut(seg(t, tK - 0.1, tK + 0.5));
  if (sw < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - sw;
    // Wasserhahn
    ctx.fillStyle = '#8A90A0'; rrect(ctx, 150, 40, 200, 34, 12); ctx.fill(); rrect(ctx, 300, 40, 40, 80, 10); ctx.fill();
    // Brüheinheit (vereinfacht: Block mit Kolben oben)
    const bx = 230, by = 230;
    ctx.fillStyle = '#9A9EA8'; rrect(ctx, bx, by, 200, 270, 18); ctx.fill();
    ctx.fillStyle = '#7A7E88'; rrect(ctx, bx + 40, by - 34, 120, 50, 12); ctx.fill();
    ctx.fillStyle = '#C0392B'; rrect(ctx, bx + 150, by + 90, 34, 90, 10); ctx.fill();
    text(ctx, 'Brüheinheit', bx + 80, by + 240, 22, 'IXB', '#2A2C33', 'center');
    const run = seg(t, tSp - 0.2, tSp + 0.2);
    if (run > 0) {
      ctx.fillStyle = 'rgba(155,212,255,0.8)'; ctx.fillRect(312, 120, 16, (by - 34 - 120) * run);
      for (let i = 0; i < 10; i++) { const ph = (t * 1.5 + i / 10) % 1; ctx.globalAlpha = (1 - sw) * run * (1 - ph); ctx.fillStyle = '#9BD4FF'; ctx.beginPath(); ctx.arc(bx + 20 + (i * 37) % 160, by + ph * 260, 5, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1 - sw;
      text(ctx, 'fließendes Wasser', 380, 110, 22, 'ISB', '#9BD4FF', 'left', run);
    }
    // Spülmittel durchgestrichen
    const o = spring(seg(t, tOhne - 0.1, tOhne + 0.4));
    if (o > 0) {
      ctx.save(); ctx.translate(610, 340); ctx.scale(o, o);
      ctx.fillStyle = '#3FB7A0'; rrect(ctx, -45, -60, 90, 150, 20); ctx.fill(); rrect(ctx, -18, -95, 36, 40, 8); ctx.fill();
      text(ctx, 'SPÜL', 0, 20, 22, 'IXB', '#fff', 'center');
      ctx.strokeStyle = C.red; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 105, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-74, -74); ctx.lineTo(74, 74); ctx.stroke(); ctx.restore();
      text(ctx, 'ohne Spülmittel', 610, 490, 24, 'IXB', C.red, 'center', clamp(o * 2));
    }
    ctx.restore();
  }
  if (sw > 0) {   // Kundendienst
    ctx.save(); ctx.globalAlpha *= sw; const cx = w / 2, cy = 220;
    ctx.strokeStyle = C.lime; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, 90, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = C.lime; rrect(ctx, cx - 112, cy - 20, 44, 84, 18); ctx.fill(); rrect(ctx, cx + 68, cy - 20, 44, 84, 18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 90, cy + 64); ctx.quadraticCurveTo(cx + 80, cy + 120, cx + 10, cy + 122); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy + 122, 12, 0, 7); ctx.fill();
    text(ctx, 'DeLonghi-Kundendienst', cx, cy + 210, 40, 'IXB', '#fff', 'center');
    text(ctx, 'wenn keine der 6 Lösungen hilft', cx, cy + 254, 24, 'IM', '#CFCFCF', 'center');
    ctx.restore();
  }
}

// ----- rechtes Panel: Ursache + Schritte bzw. Lampen-Decoder -----
const PNL = { x: 20, y: -330, w: 900, h: 600 };
function panel(ctx, t, k) {
  const d = DATA[k], L = CH[k].L, t0 = L[0].t - 0.1, p = spring(seg(t, t0, t0 + 0.6));
  if (p <= 0) return null;
  const { x, y, w, h } = PNL;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, 0, 0, w, h, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = C.lime; rrect(ctx, 28, 24, 26, 26, 7); ctx.fill(); text(ctx, 'Doc', 64, 44, 17, 'ISB', '#fff');
  let target = null;
  if (k === 1) target = decoder(ctx, t, w, h);
  else {
    text(ctx, 'URSACHE', 40, 104, 15, 'ISB', '#8A8A8E', 'left', 1, 2.4);
    const cs = fitSize(ctx, d.cause, 28, 'IXB', w - 80);
    text(ctx, d.cause, 40, 144, cs, 'IXB', '#FFD400', 'left', easeOut(seg(t, t0 + 0.2, t0 + 0.6)));
    text(ctx, 'SO GEHT’S', 40, 206, 15, 'ISB', '#8A8A8E', 'left', 1, 2.4);
    const ts = stepTimes(k), rowH = d.steps.length > 3 ? 74 : 84;
    d.steps.forEach(([s], i) => {
      const a = spring(seg(t, ts[i], ts[i] + 0.45)); if (a <= 0) return;
      const yy = 228 + i * rowH;
      ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate((1 - a) * 30, 0);
      ctx.fillStyle = C.panel2; rrect(ctx, 32, yy, w - 64, rowH - 12, 16); ctx.fill();
      ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(72, yy + (rowH - 12) / 2, 21, 0, 7); ctx.fill();
      text(ctx, String(i + 1), 72, yy + (rowH - 12) / 2 + 8, 22, 'IXB', C.ink, 'center');
      const fs_ = fitSize(ctx, s, 28, 'ISB', w - 64 - 130);
      text(ctx, s, 112, yy + (rowH - 12) / 2 + 10, fs_, 'ISB', '#fff');
      ctx.restore();
      target = [x + 72, y + yy + (rowH - 12) / 2];
    });
    if (k === 6) {   // Hinweis auf das Entkalken-Video
      const ta = wordTime('c6_1', 'anleitung') - 0.1, a = spring(seg(t, ta, ta + 0.5));
      if (a > 0) {
        const yy = 228 + 3 * 84 + 4;
        ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate(0, (1 - a) * 20);
        ctx.fillStyle = '#26262A'; rrect(ctx, 32, yy, w - 64, 70, 16); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(72, yy + 35, 22, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, 50, yy + 13, 44, 44); ctx.restore();
        ctx.fillStyle = C.yt; rrect(ctx, 108, yy + 20, 44, 30, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(124, yy + 27); ctx.lineTo(138, yy + 35); ctx.lineTo(124, yy + 43); ctx.closePath(); ctx.fill();
        text(ctx, 'Anleitung: Magnifica S entkalken · auf meinem Kanal', 166, yy + 44, 23, 'ISB', '#fff');
        ctx.restore();
        target = [x + 72, y + yy + 35];
      }
    }
  }
  const sp = easeOut(seg(t, L[0].t + 0.8, L[0].t + 1.3));
  text(ctx, `Quelle: ${d.src}`, w - 32, h - 28, 17, 'ISB', '#6A6A6E', 'right', sp);
  ctx.restore();
  return target;
}
// Lampen-Decoder: drei Lampen, jede bekommt ihre Bedeutung laut Anleitung genau zum Wort
function decoder(ctx, t, w, h) {
  text(ctx, 'LAMPEN-DECODER', 40, 104, 15, 'ISB', '#8A8A8E', 'left', 1, 2.4);
  const tBl = wordTime('c1_0', 'blinkt'), tLe = wordTime('c1_0', 'leuchtet'), tEn = wordTime('c1_1', 'entkalken'), tDr = wordTime('c1_1', 'dreieck'), tMe = wordTime('c1_2', 'mehrere');
  const all = t >= tMe;   // am Ende: Muster wie im Video
  const rows = [
    { kind: 'tank', name: 'Wassertank', st: all ? 'blink' : t >= tLe ? 'on' : t >= tBl ? 'blink' : 0, lines: [['blinkt: zu wenig Wasser im Tank', tBl], ['leuchtet: Tank sitzt nicht richtig', tLe]] },
    { kind: 'descale', name: 'Entkalken', st: t >= tEn ? 'on' : 0, lines: [['Maschine muss entkalkt werden', tEn]] },
    { kind: 'alarm', name: 'Warndreieck', st: t >= tDr ? 'blink' : 0, lines: [['allgemeiner Alarm', tDr]] },
  ];
  let target = null;
  rows.forEach((r, i) => {
    const yy = 130 + i * 128, act = r.lines[0][1];
    ctx.save(); ctx.globalAlpha *= t >= act - 0.1 ? 1 : 0.45;
    lampTile(ctx, r.kind, 40, yy, 104, r.st, t);
    text(ctx, r.name, 172, yy + 38, 30, 'IXB', '#fff');
    r.lines.forEach(([s, tt], j) => { const a = easeOut(seg(t, tt - 0.05, tt + 0.3)); text(ctx, s, 172 + (1 - a) * 20, yy + 76 + j * 32, 24, 'ISB', j === 0 && r.lines.length > 1 && t >= tLe && !all ? '#8A8A8E' : '#CFCFCF', 'left', a); });
    ctx.restore();
    if (t >= act - 0.1) target = [PNL.x + 92, PNL.y + yy + 82];
  });
  const a = spring(seg(t, tMe - 0.1, tMe + 0.4));
  if (a > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.fillStyle = C.lime; rrect(ctx, 40, 512, w - 80, 46, 23); ctx.fill();
    text(ctx, 'Mehrere gleichzeitig? Einzeln abarbeiten: Lösung 1 bis 6', w / 2, 543, 22, 'IXB', C.ink, 'center'); ctx.restore();
    target = [PNL.x + 60, PNL.y + 535];
  }
  return target;
}

// Cursor „Doc“ zeigt immer auf den neuesten Eintrag im Panel
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

// ----- Intro: echte Aufnahme (Tasse bleibt leer, dann rote Lampen), Titel, 6 Lösungen -----
const INTRO_CARD = { x: 430, y: -380, w: 432, h: 650 };
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
  text(ctx, typed('Kaffeevollautomaten', t, 2.5, 22), ux, -406, 40, 'IXB', C.ink, 'left', 1);
  // Titel
  const tp = easeOut(seg(t, c.L[0].t + 0.1, c.L[0].t + 0.6));
  text(ctx, 'DeLonghi Magnifica S', -880, -230, 70, 'IXB', C.ink, 'left', tp);
  const tk = wordTime('c0_0', 'kein'), tl = T_BLINK;
  const pillBig = (s, y, col, a) => {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.font = '96px IXB'; const pw = ctx.measureText(s).width;
    ctx.translate(-880, y); ctx.scale(lerp(0.8, 1, a), lerp(0.8, 1, a)); ctx.fillStyle = col; rrect(ctx, -16, -92, pw + 32, 120, 24); ctx.fill(); text(ctx, s, 0, 0, 96, 'IXB', '#fff'); ctx.restore();
  };
  pillBig('Kein Wasser?', -80, '#2346E8', spring(seg(t, tk - 0.1, tk + 0.4)));
  pillBig('Alle Lampen rot?', 70, C.yt, spring(seg(t, tl - 0.1, tl + 0.4)));
  // 6 Lösungen als Chips
  const tz = wordTime('c0_1', 'zeige');
  let px = -880;
  ['Tank', 'Luft', 'Mahlgrad', 'Ausgüsse', 'Entkalken', 'Brüheinheit'].forEach((s, i) => {
    ctx.font = '24px ISB'; const w = ctx.measureText(s).width + 64, x0 = px; px += w + 12;
    const q = spring(seg(t, tz + i * 0.28, tz + 0.5 + i * 0.28)); if (q <= 0) return;
    ctx.save(); ctx.translate(x0, 210); ctx.scale(q, q);
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -26, w, 52, 26); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(24, 0, 14, 0, 7); ctx.fill(); text(ctx, `${i + 1}`, 24, 6, 16, 'IXB', C.lime, 'center');
    text(ctx, s, 46, 8, 24, 'ISB', C.ink); ctx.restore();
  });
  // Handy-Karte mit der echten Aufnahme, später das Pexels-Foto „so soll's laufen“
  const { x, y, w, h } = INTRO_CARD, cp = spring(seg(t, 0.2, 0.8));
  if (cp > 0) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.85, 1, cp), lerp(0.85, 1, cp)); ctx.globalAlpha = clamp(cp * 2); ctx.translate(-w / 2, -h / 2);
    shadow(ctx, 0.3, 40, 14); ctx.fillStyle = '#111'; rrect(ctx, -10, -10, w + 20, h + 20, 30); ctx.fill(); noShadow(ctx);
    ctx.save(); rrect(ctx, 0, 0, w, h, 22); ctx.clip();
    const img = t < tl - 0.35 ? clipFrame('A', t - 0.3, false) : clipFrame('B', t - (tl - 0.35), false);
    if (img) ctx.drawImage(img, 0, 0, w, h);
    const ph = easeInOut(seg(t, c.L[2].t - 0.2, c.L[2].t + 0.5));
    if (ph > 0) { ctx.globalAlpha = clamp(cp * 2) * ph; cover(ctx, IMG.cappu, 0, 0, w, h, 0.5, 0.45); ctx.globalAlpha = clamp(cp * 2); }
    ctx.restore();
    if (ph < 1) { ctx.save(); ctx.globalAlpha *= 1 - ph; recTag(ctx, 16, 16, t); ctx.restore(); }
    // „Tasse bleibt leer“ an der Tasse
    const cupA = spring(seg(t, tk, tk + 0.4)) * (1 - seg(t, tl - 0.5, tl - 0.2));
    if (cupA > 0) { ctx.save(); ctx.globalAlpha *= clamp(cupA * 2); ctx.fillStyle = C.yt; rrect(ctx, 96, 300, 240, 50, 25); ctx.fill(); text(ctx, 'Tasse bleibt leer', 216, 333, 22, 'IXB', '#fff', 'center'); ctx.restore(); }
    if (ph > 0) { ctx.save(); ctx.globalAlpha *= ph; ctx.fillStyle = C.lime; rrect(ctx, 16, 16, 220, 44, 22); ctx.fill(); text(ctx, 'So soll’s laufen', 126, 46, 22, 'IXB', C.ink, 'center'); ctx.restore(); }
    ctx.restore();
    text(ctx, ph > 0.5 ? 'Foto: Doğu Tuncer / Pexels' : 'Aufnahme: Der Handwerksdoktor', x, y + h + 40, 15, 'IM', C.gray, 'left', clamp(cp * 2));
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
const CTA1 = { t0: CH[0].L[2].t - 0.2, t1: CH[0].L[2].e + 0.5, sub: wordTime('c0_2', 'abonnier') };
const CTA2 = { t0: CH[4].L[2].t - 0.2, t1: CH[4].L[2].e + 0.5, sub: wordTime('c4_2', 'abonnier'), like: wordTime('c4_2', 'like') };
// dezenter Abo-Hinweis oben rechts, leuchtet zweimal kurz auf
const HINT_PULSES = [47.5, 101.5];
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
    const rows = [['tank', 'Tank fest einrasten'], ['luft', 'Luft raus: Dampfknopf auf I'], ['mahlgrad', 'Mahlgrad gröber'], ['ausgüsse', 'Ausgüsse freistechen'], ['entkalken', 'Entkalken'], ['brüheinheit', 'Brüheinheit ausspülen']];
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * (1 - endP); ctx.translate(CX, CY - 50); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p));
    shadow(ctx, 0.3, 60, 20); ctx.fillStyle = C.panel; rrect(ctx, -640, -310, 1280, 600, 26); ctx.fill(); noShadow(ctx);
    text(ctx, 'KURZ GESAGT', -570, -244, 18, 'ISB', '#9A9A9A', 'left', 1, 3);
    rows.forEach(([w, s], i) => {
      const ti = wordTime('c8_0', w, 0, c.L[0].t + 0.6 + i * 0.6) - 0.08, on = easeOut(seg(t, ti, ti + 0.3)), yy = -180 + i * 72;
      ctx.fillStyle = on > 0.5 ? C.lime : '#2A2A2D'; rrect(ctx, -570, yy - 30, 46, 46, 12); ctx.fill();
      check(ctx, -547, yy - 7, 30, on);
      text(ctx, s, -500, yy + 4, 36, 'IXB', on > 0.5 ? '#fff' : '#6A6A6E');
    });
    ctx.save(); rrect(ctx, 250, -270, 330, 500, 16); ctx.clip(); cover(ctx, IMG.espresso, 250, -270, 330, 500, 0.5, 0.42); ctx.restore();
    ctx.fillStyle = C.lime; rrect(ctx, 266, -254, 250, 44, 22); ctx.fill(); text(ctx, 'So läuft’s wieder', 391, -224, 22, 'IXB', C.ink, 'center');
    text(ctx, 'Foto: Doğu Tuncer / Pexels', 250, 256, 14, 'IM', '#8A8A8E');
    ctx.restore();
  }
  if (endP > 0) {
    ctx.save(); ctx.globalAlpha = clamp(endP * 2);
    ctx.fillStyle = 'rgba(228,228,228,0.88)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(CX, CY - 120); ctx.scale(endP, endP);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -110, 100, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -100, -210, 200, 200); ctx.restore();
    ctx.strokeStyle = C.lime; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -110, 104, 0, 7); ctx.stroke();
    text(ctx, 'Der Handwerksdoktor', 0, 50, 58, 'IXB', C.ink, 'center');
    text(ctx, 'Hilfe für deinen Kaffeevollautomaten', 0, 98, 28, 'IM', C.gray, 'center');
    // Kommentar-Frage
    const cq = spring(seg(t, c.L[1].t + 0.4, c.L[1].t + 0.9));
    if (cq > 0) { ctx.save(); ctx.translate(0, 168); ctx.scale(cq, cq); ctx.fillStyle = C.ink; rrect(ctx, -330, -32, 660, 64, 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(-290, 30); ctx.lineTo(-300, 54); ctx.lineTo(-262, 30); ctx.fill(); text(ctx, 'Welche Lösung hat geholfen? Lösung …', 0, 10, 26, 'ISB', C.lime, 'center'); ctx.restore(); }
    const subT = wordTime('c8_1', 'abonnier'), bp = spring(seg(t, subT - 0.8, subT - 0.3)), subbed = t >= subT;
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
  add(wordTime('c0_0', 'kein'), 'thump', 0.3); add(T_BLINK, 'thump', 0.3);
  for (let i = 0; i < 6; i++) add(wordTime('c0_1', 'zeige') + i * 0.28, 'pop', 0.18);
  for (let k = 1; k <= 7; k++) {
    add(CH[k].start + 0.1, 'whoosh', 0.35);
    add(CH[k].start + 0.7, 'pop', 0.22);
    for (const st of stepTimes(k)) add(st + 0.08, 'blip', 0.2);
  }
  for (const w of [['c1_0', 'blinkt'], ['c1_0', 'leuchtet'], ['c1_1', 'entkalken'], ['c1_1', 'dreieck'], ['c1_2', 'mehrere']]) add(WT(w), 'blip', 0.2);
  add(wordTime('c2_0', 'füllen'), 'gluck', 0.25); add(wordTime('c2_0', 'einrastet'), 'click', 0.6);
  add(wordTime('c3_1', 'auf'), 'click', 0.4); add(wordTime('c3_1', 'laufen') - 0.9, 'hiss', 0.25);
  add(wordTime('c4_1', 'eine'), 'click', 0.4);
  add(wordTime('c6_1', 'anleitung'), 'bloop', 0.3);
  add(wordTime('c7_0', 'spül'), 'gluck', 0.2); add(wordTime('c7_0', 'ohne'), 'thump', 0.25);
  for (const cta of [CTA1, CTA2]) { add(cta.t0 + 0.1, 'bloop', 0.3); add(cta.sub, 'click', 0.5); if (cta.like) add(cta.like, 'click', 0.45); }
  add(CH[OUT].start + 0.1, 'whoosh', 0.4);
  for (const w of ['tank', 'luft', 'mahlgrad', 'ausgüsse', 'entkalken', 'brüheinheit']) add(wordTime('c8_0', w), 'blip', 0.18);
  add(wordTime('c8_1', 'abonnier'), 'click', 0.5);
  return c.sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  const vo = SEC.chapters.flatMap((c) => c.lines.map((l) => ({ id: l.id, t: l.t })));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, chapters: SEC.chapters.map((c) => ({ ch: c.ch, title: c.title, start: c.start })), vo, footage_audio: FOOT_AUDIO }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times_ = args[0] === '--still' ? args[1].split(',').map(Number) : SEC.chapters.flatMap((c) => c.lines.map((l) => l.t + l.dur * 0.85));
    const files = [];
    for (const t of times_) { DOC_POS.clear(); await drawFrameLoaded(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
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
    await drawFrameLoaded(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 600 === 0) process.stdout.write(`\r${(n / FPS).toFixed(0)} / ${to.toFixed(0)} s (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

export { drawFrameLoaded, lampTile, lampIcon, clipFrame, tankDrawing, airDrawing, grindDrawing, spoutDrawing, brewDrawing, ctaCard, bell, thumb, DATA, CH, SEC, captions, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow, pill, cover, recTag, spring, seg, easeOut, easeInOut, lerp, clamp, wordTime, fitSize, check };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
