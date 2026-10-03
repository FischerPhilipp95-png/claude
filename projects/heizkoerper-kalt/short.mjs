// Zwei Shorts (1080x1920, 60 fps, ca. 20 s) zum Video „Heizkörper wird nicht warm?“. Bausteine aus render.mjs.
//   node projects/heizkoerper-kalt/short.mjs ventilstift|mieter [--still 3,8,15]
// Schreibt out/short_<name>_video.mp4 (ohne Ton) und short_<name>.json (Zeiten für Ton und Mischung).
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  houseCard, thermalFrame, radiator, FIELD, fixed, valveDrawing, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow,
  pill, spring, seg, easeOut, easeInOut, lerp, clamp, heat,
} from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 60, GAP = 0.35;
const NAME = process.argv[2];
const PREFIX = { ventilstift: 's1_', mieter: 's2_' }[NAME];
if (!PREFIX) { console.error('Aufruf: node short.mjs ventilstift|mieter'); process.exit(1); }

// ---------- Zeiten: Sätze nacheinander ----------
const DURS = JSON.parse(fs.readFileSync(path.join(DIR, 'audio/shorts/durations.json'), 'utf8'));
const ids = Object.keys(DURS).filter((k) => k.startsWith(PREFIX)).sort();
let cur = 0.5;
const L = ids.map((id) => { const l = { id, t: cur, d: DURS[id], e: cur + DURS[id] }; cur = l.e + GAP; return l; });
const DUR = +(L[L.length - 1].e + 1.8).toFixed(2);

// ---------- Untertitel (wie im langen Video, eigene Wortzeiten) ----------
const CAPS = (() => {
  const start = Object.fromEntries(L.map((l) => [l.id, l.t])), chunks = [];
  for (const line of JSON.parse(fs.readFileSync(path.join(DIR, 'shorts_captions.json'), 'utf8')).filter((l) => l.id.startsWith(PREFIX))) {
    let c = []; const flush = () => { if (c.length) chunks.push(c); c = []; };
    for (const w of line.words) {
      const word = { w: w.w.toUpperCase(), s: start[line.id] + w.s };
      if (c.length && (c.length >= 3 || [...c, word].map((x) => x.w).join(' ').length > 18)) flush();
      c.push(word); if (/[.,:;?!]$/.test(w.w)) flush();
    }
    flush();
  }
  return chunks.map((ws, i) => { const n = chunks[i + 1], end = ws[ws.length - 1].s + 0.5; return { ws, t0: ws[0].s - 0.05, t1: n && n[0].s - end < 0.6 ? n[0].s - 0.05 : end + 0.3 }; });
})();
function captions(ctx, t, y = 1370, size = 66) {
  const c = CAPS.find((k) => t >= k.t0 && t < k.t1); if (!c) return;
  const gap = size * 0.3, padX = size * 0.55;
  ctx.font = `${size}px IXB`; ctx.letterSpacing = '-1px';
  const ws = c.ws.map((w) => ({ ...w, wd: ctx.measureText(w.w).width })), total = ws.reduce((a, w) => a + w.wd, 0) + gap * (ws.length - 1);
  const pop = spring(seg(t, c.t0, c.t0 + 0.18));
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(0.8, 1, pop), lerp(0.8, 1, pop)); ctx.globalAlpha = clamp(pop * 1.5);
  shadow(ctx, 0.28, 24, 8); ctx.fillStyle = C.panel; rrect(ctx, -total / 2 - padX, -size * 0.92, total + padX * 2, size * 1.5, size * 0.38); ctx.fill(); noShadow(ctx);
  let x = -total / 2;
  ws.forEach((w, i) => {
    const active = t >= w.s && (i === ws.length - 1 || t < ws[i + 1].s), said = t >= w.s, sc = active ? 1 + 0.14 * Math.min(1, 150 / w.wd) * (1 - easeOut(seg(t, w.s, w.s + 0.16))) : 1;
    ctx.save(); ctx.translate(x + w.wd / 2, -size * 0.17); ctx.scale(sc, sc); ctx.globalAlpha = clamp(pop * 1.5) * (said ? 1 : 0.42);
    ctx.fillStyle = active ? C.lime : C.white; ctx.fillText(w.w, -w.wd / 2, size * 0.36); ctx.restore();
    x += w.wd + gap;
  });
  ctx.letterSpacing = '0px'; ctx.restore();
}

// ---------- gemeinsame Teile ----------
function header(ctx, t, label) {
  const a = easeOut(seg(t, 0.1, 0.5));
  ctx.save(); ctx.globalAlpha = a;
  ctx.save(); ctx.beginPath(); ctx.arc(110, 150, 34, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, 76, 116, 68, 68); ctx.restore();
  text(ctx, 'Der Handwerksdoktor', 160, 145, 30, 'IXB', C.ink); text(ctx, label, 160, 180, 22, 'ISB', C.gray, 'left', 1, 2);
  ctx.restore();
}
function bigTitle(ctx, t, l1, chip, chipCol, y = 380) {
  const a = spring(seg(t, 0.2, 0.7)), b = spring(seg(t, 0.5, 1.0));
  ctx.save(); ctx.globalAlpha = clamp(a * 2); ctx.translate(76, y); ctx.scale(lerp(0.9, 1, a), lerp(0.9, 1, a)); text(ctx, l1, 0, 0, 140, 'IXB', C.ink); ctx.restore();
  if (b > 0) {
    ctx.save(); ctx.globalAlpha = clamp(b * 2); ctx.translate(76, y + 160); ctx.scale(lerp(0.9, 1, b), lerp(0.9, 1, b));
    ctx.font = '140px IXB'; const w = ctx.measureText(chip).width; ctx.fillStyle = chipCol; rrect(ctx, -18, -118, w + 36, 156, 30); ctx.fill();
    text(ctx, chip, 0, 0, 140, 'IXB', '#fff'); ctx.restore();
  }
}
function darkPanel(ctx, x, y, w, h, a) {
  ctx.globalAlpha = a; shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, x, y, w, h, 28); ctx.fill(); noShadow(ctx);
}

// ---------- Short 1: Ventilstift ----------
function frameVentil(ctx, t) {
  header(ctx, t, 'HEIZKÖRPER · URSACHE 2 VON 5');
  bigTitle(ctx, t, 'Ganz', 'kalt?', heat(0.18));
  const pIn = easeInOut(seg(t, L[1].t + 0.2, L[1].t + 1.0)), fixAt = L[3].t + 2.6;
  // Wärmebild: groß, dann klein in die Ecke
  const big = { x: 80, y: 640, w: 920, h: 620 }, small = { x: 690, y: 560, w: 330, h: 250 };
  const r = { x: lerp(big.x, small.x, pIn), y: lerp(big.y, small.y, pIn), w: lerp(big.w, small.w, pIn), h: lerp(big.h, small.h, pIn) };
  const ap = spring(seg(t, L[0].t + 0.2, L[0].t + 0.8));
  // dunkles Panel mit Ventil (unter der kleinen Wärmebild-Karte)
  if (pIn > 0) {
    ctx.save(); darkPanel(ctx, 60, 600, 960, 690, clamp(pIn * 1.5));
    text(ctx, 'URSACHE', 110, 680, 22, 'ISB', '#9A9A9A', 'left', 1, 3); text(ctx, 'Ventilstift klemmt', 110, 735, 46, 'IXB', '#fff');
    const Lv = [L[0], { t: L[1].t + 1.0 }, { t: L[3].t - 0.2 }];
    ctx.save(); ctx.beginPath(); ctx.rect(60, 770, 960, 520); ctx.clip(); ctx.translate(140, 790); ctx.scale(1.4, 1.4); valveDrawing(ctx, t, 0, 0, 400, 330, Lv); ctx.restore();
    pill(ctx, '▼  Alle 5 Ursachen: Video unten verlinkt', 110, 1170, spring(seg(t, L[3].t + 2.8, L[3].t + 3.3)), C.lime, 24);
    ctx.restore();
  }
  if (ap > 0) {
    ctx.save(); ctx.globalAlpha = clamp(ap * 2); ctx.translate(r.x, r.y); const s = r.w / big.w; ctx.scale(s, s);
    const f = thermalFrame(ctx, 0, 0, big.w, big.h);
    ctx.save(); rrect(ctx, f.vx, f.vy, f.vw, f.vh, 10); ctx.clip();
    radiator(ctx, f.vx + f.vw * 0.1, f.vy + f.vh * 0.14, f.vw * 0.7, f.vh * 0.72, fixed(FIELD.stuck(t), t, fixAt), 12, { level: 5 });
    ctx.restore(); ctx.restore();
  }
}

// ---------- Short 2: Mieter-Frage ----------
function frameMieter(ctx, t) {
  header(ctx, t, 'HEIZKÖRPER · DIE MIETER-FRAGE');
  // Frage als Notiz, die Mieterin tippt
  const q = '„Welchen Heizkörper muss ich zuerst entlüften?“', qs = L[0].t + 0.6, n = Math.max(0, Math.floor((t - qs) * 32));
  const na = easeOut(seg(t, qs - 0.5, qs - 0.2));
  let cx = 120, cy = 380;
  if (na > 0) {
    ctx.save(); ctx.globalAlpha = na; shadow(ctx, 0.1, 24, 8); ctx.fillStyle = '#FBFBFB'; rrect(ctx, 60, 250, 960, 300, 16); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = P.Mieterin; ctx.fillRect(60, 250, 8, 300);
    const lines = ['„Welchen Heizkörper muss', 'ich zuerst entlüften?“']; let rem = q.slice(0, n), ly = 340;
    for (const ln of lines) { const part = rem.slice(0, ln.length); rem = rem.slice(ln.length + 1); if (part) { const w = text(ctx, part, 100, ly, 56, 'ISB', C.ink); cx = 100 + w + 6; cy = ly + 6; } ly += 76; }
    text(ctx, 'Häufige Frage aus den Kommentaren · sinngemäß', 100, 520, 22, 'ISB', C.gray, 'left', easeOut(seg(t, qs + q.length / 32, qs + q.length / 32 + 0.4)));
    ctx.restore();
  }
  cursor(ctx, cx, cy, 'Mieterin', easeOut(seg(t, qs - 0.4, qs)) * (1 - easeOut(seg(t, qs + q.length / 32 + 0.4, qs + q.length / 32 + 0.9))));
  // Haus im Schnitt
  const hp = spring(seg(t, L[0].t + 1.6, L[0].t + 2.2)), out = easeInOut(seg(t, L[1].t + 0.6, L[1].t + 1.3));
  if (hp > 0 && out < 1) {
    ctx.save(); ctx.globalAlpha = clamp(hp * 2) * (1 - out); ctx.translate(140, 620); ctx.scale(lerp(0.8, 1, hp) * 1.9, lerp(0.8, 1, hp) * 1.9);
    houseCard(ctx, t, 420, 330, { L: [L[0], L[1]] }); ctx.restore();
  }
  // Antwort-Panel
  if (out > 0) {
    ctx.save(); darkPanel(ctx, 60, 600, 960, 690, clamp(out * 1.5));
    text(ctx, 'DIE EHRLICHE ANTWORT', 110, 680, 22, 'ISB', '#9A9A9A', 'left', 1, 3);
    const big = spring(seg(t, L[1].t + 1.0, L[1].t + 1.5));
    if (big > 0) { ctx.save(); ctx.globalAlpha *= clamp(big * 2); ctx.translate(110, 770); ctx.scale(lerp(0.85, 1, big), lerp(0.85, 1, big)); text(ctx, 'Musst du nicht', 0, 0, 70, 'IXB', C.lime); text(ctx, 'wissen.', 0, 80, 70, 'IXB', C.lime); ctx.restore(); }
    [['1', 'Alle Heizkörper deiner', 'Wohnung nacheinander entlüften', L[2].t + 0.2], ['2', 'Den höchsten am Schluss', 'noch einmal prüfen', L[2].t + 2.6],
      ['3', 'Druck und Abgleich:', 'Sache des Vermieters', L[3].t + 0.1]].forEach(([nr, a1, a2, tt], i) => {
      const p = spring(seg(t, tt, tt + 0.5)); if (p <= 0) return;
      const yy = 900 + i * 125; ctx.save(); ctx.globalAlpha *= clamp(p * 2); ctx.translate((1 - p) * 40, 0);
      ctx.fillStyle = C.panel2; rrect(ctx, 100, yy, 880, 110, 18); ctx.fill();
      ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(155, yy + 55, 30, 0, 7); ctx.fill(); text(ctx, nr, 155, yy + 67, 32, 'IXB', C.ink, 'center');
      text(ctx, a1, 210, yy + 48, 32, 'ISB', '#fff'); text(ctx, a2, 210, yy + 88, 32, 'ISB', '#CFCFCF'); ctx.restore();
    });
    ctx.restore();
  }
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; noShadow(ctx);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  if (NAME === 'ventilstift') frameVentil(ctx, t); else frameMieter(ctx, t);
  captions(ctx, t);
}

function cues() {
  const c = [], add = (t, type, gain) => c.push({ t: +t.toFixed(3), type, gain });
  add(0.25, 'pop', 0.25);
  if (NAME === 'ventilstift') { add(L[1].t + 0.25, 'whoosh', 0.3); add(L[1].t + 1.3, 'click', 0.3); add(L[3].t + 2.5, 'bloop', 0.25); add(L[3].t + 2.85, 'pop', 0.2); }
  else { for (let i = 0; i < 46; i += 3) add(L[0].t + 0.6 + i / 32, 'key', 0.14); add(L[1].t + 0.7, 'whoosh', 0.3); for (const tt of [L[2].t + 0.2, L[2].t + 2.6, L[3].t + 0.1]) add(tt, 'blip', 0.2); }
  return c.sort((a, b) => a.t - b.t);
}

async function main() {
  const args = process.argv.slice(3);
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, `short_${NAME}.json`), JSON.stringify({ duration: DUR, vo: L.map((l) => ({ id: l.id, t: l.t })), cues: cues() }, null, 1));
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still') {
    for (const t of args[1].split(',').map(Number)) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `short_${NAME}_${t}.png`); fs.writeFileSync(f, await canvas.encode('png')); console.log(f); }
    return;
  }
  const outFile = path.join(DIR, 'out', `short_${NAME}_video.mp4`);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(DUR * FPS); n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(outFile, `${DUR} s`);
}
main();
