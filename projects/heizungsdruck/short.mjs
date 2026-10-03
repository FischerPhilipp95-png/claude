// Zwei Shorts (1080x1920, 60 fps, ca. 20 s) zum Video „Heizungsdruck“. Bausteine aus render.mjs.
//   node projects/heizungsdruck/short.mjs manometer|systemtrenner [--still 3,8,15]
// Schreibt out/short_<name>_video.mp4 (ohne Ton) und short_<name>.json (Zeiten für Ton und Mischung).
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manometer, trennerDrawing, loadAssets, IMG, C, P, cursor, text, rrect, shadow, noShadow, pill, spring, seg, easeOut, easeInOut, lerp, clamp } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 60, GAP = 0.35;
const NAME = process.argv[2];
const PREFIX = { manometer: 's1_', systemtrenner: 's2_' }[NAME];
if (!PREFIX) { console.error('Aufruf: node short.mjs manometer|systemtrenner'); process.exit(1); }

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
// Zeit, zu der im Satz <id> das erste Wort beginnt, das mit <w> anfängt
const WSTART = (() => {
  const start = Object.fromEntries(L.map((l) => [l.id, l.t]));
  return Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, 'shorts_captions.json'), 'utf8')).map((l) => [l.id, l.words.map((w) => ({ w: w.w.toLowerCase(), s: (start[l.id] ?? 0) + w.s }))]));
})();
const wt = (id, w, fb) => ((WSTART[id] || []).find((x) => x.w.startsWith(w.toLowerCase())) || { s: fb }).s;
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

// ---------- Short 1: Manometer lesen ----------
function frameManometer(ctx, t) {
  header(ctx, t, 'HEIZUNG · MANOMETER LESEN');
  bigTitle(ctx, t, 'Wie viel', 'Druck?', '#2346E8');
  const gp = spring(seg(t, L[0].t + 0.4, L[0].t + 1.0));
  if (gp <= 0) return;
  const cx = 540, cy = 905, r = 280;
  const val = lerp(0.6, 1.6, easeInOut(seg(t, L[1].t, L[1].t + 1.6)));
  ctx.save(); ctx.globalAlpha = clamp(gp * 2); ctx.translate(cx, cy); ctx.scale(lerp(0.8, 1, gp), lerp(0.8, 1, gp)); ctx.translate(-cx, -cy);
  const g = manometer(ctx, cx, cy, r, val, { t });
  ctx.restore();
  const tag = (s, ang2, rr, tt, col, side) => {
    const o = easeOut(seg(t, tt, tt + 0.4)); if (o <= 0) return;
    const px = cx + Math.cos(ang2) * rr, py = cy + Math.sin(ang2) * rr;
    ctx.save(); ctx.globalAlpha = o; ctx.font = '40px IXB'; const w = ctx.measureText(s).width + 40, bx = side > 0 ? 1040 - w : 40, by = py - 34;
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(side > 0 ? bx : bx + w, py); ctx.stroke();
    ctx.fillStyle = C.panel; rrect(ctx, bx, by, w, 68, 20); ctx.fill(); text(ctx, s, bx + 20, py + 14, 40, 'IXB', col); ctx.restore();
  };
  tag('aktueller Druck', g.an, r * 0.6, wt('s1_1', 'schwarze', L[1].t + 0.3), '#fff', -1);
  tag('Markierung', g.am, r * 0.75, wt('s1_1', 'rote', L[1].t + 2.4), '#FF6B5E', 1);
  const gr = easeOut(seg(t, wt('s1_2', '1,2', L[2].t + 1.2), wt('s1_2', '1,2', L[2].t + 1.2) + 0.4));
  if (gr > 0) { ctx.save(); ctx.globalAlpha = gr; ctx.fillStyle = C.panel; rrect(ctx, 270, 1215, 540, 90, 26); ctx.fill(); text(ctx, 'meist 1,2–2 bar', 540, 1277, 48, 'IXB', '#2FCB78', 'center'); ctx.restore(); }
}

// ---------- Short 2: Systemtrenner ----------
function frameTrenner(ctx, t) {
  header(ctx, t, 'HEIZUNG · DIE SYSTEMTRENNER-FRAGE');
  const q = '„Wozu ein Systemtrenner, wenn das Trinkwasser mehr Druck hat?“', qs = L[0].t + 0.2, n = Math.max(0, Math.floor((t - qs) * 34));
  const na = easeOut(seg(t, qs - 0.4, qs - 0.1));
  let cx = 120, cy = 380;
  if (na > 0) {
    ctx.save(); ctx.globalAlpha = na; shadow(ctx, 0.1, 24, 8); ctx.fillStyle = '#FBFBFB'; rrect(ctx, 60, 250, 960, 300, 16); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = P.Nachbar; ctx.fillRect(60, 250, 8, 300);
    const lines = ['„Wozu ein Systemtrenner,', 'wenn das Trinkwasser', 'mehr Druck hat?“']; let rem = q.slice(0, n), ly = 330;
    for (const ln of lines) { const part = rem.slice(0, ln.length); rem = rem.slice(ln.length + 1); if (part) { const w = text(ctx, part, 100, ly, 52, 'ISB', C.ink); cx = 100 + w + 6; cy = ly + 6; } ly += 66; }
    text(ctx, 'Häufige Frage aus den Kommentaren · sinngemäß', 100, 530, 22, 'ISB', C.gray, 'left', easeOut(seg(t, qs + q.length / 34, qs + q.length / 34 + 0.4)));
    ctx.restore();
  }
  cursor(ctx, cx, cy, 'Nachbar', easeOut(seg(t, qs - 0.4, qs)) * (1 - easeOut(seg(t, qs + q.length / 34 + 0.4, qs + q.length / 34 + 0.9))));
  const pIn = easeInOut(seg(t, L[1].t - 0.3, L[1].t + 0.4));
  if (pIn > 0) {
    ctx.save(); darkPanel(ctx, 60, 600, 960, 690, clamp(pIn * 1.5));
    text(ctx, 'DIN EN 1717', 110, 680, 22, 'ISB', '#9A9A9A', 'left', 1, 3);
    text(ctx, 'Heizungswasser darf', 110, 740, 46, 'IXB', '#fff', 'left', easeOut(seg(t, L[2].t, L[2].t + 0.4)));
    text(ctx, 'nie ins Trinkwasser', 110, 795, 46, 'IXB', '#fff', 'left', easeOut(seg(t, L[2].t, L[2].t + 0.4)));
    ctx.save(); ctx.translate(90, 840); ctx.scale(1.05, 1.05); trennerDrawing(ctx, t, 0, 0, 840, [L[0], { t: L[1].t - 0.6 }, { t: L[2].t - 0.8 }]); ctx.restore();
    ctx.restore();
  }
}
function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; noShadow(ctx);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  if (NAME === 'manometer') frameManometer(ctx, t); else frameTrenner(ctx, t);
  captions(ctx, t);
}

function cues() {
  const c = [], add = (t, type, gain) => c.push({ t: +t.toFixed(3), type, gain });
  add(0.25, 'pop', 0.25);
  if (NAME === 'manometer') { add(L[0].t + 0.4, 'thump', 0.25); add(L[1].t + 0.3, 'blip', 0.2); add(L[1].t + 2.4, 'blip', 0.2); add(L[2].t + 1.2, 'pop', 0.2); }
  else { for (let i = 0; i < 64; i += 3) add(L[0].t + 0.2 + i / 34, 'key', 0.14); add(L[1].t - 0.3, 'whoosh', 0.3); add(L[2].t + 1.5, 'click', 0.3); }
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
