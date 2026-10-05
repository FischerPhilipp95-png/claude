// Short (1080x1920, 60 fps, ca. 17 s) zum Video „Thermostatkopf wechseln“: Kommt dabei Wasser raus?
// Bausteine aus render.mjs (Ventil im Schnitt, Thermostatkopf).
//   node projects/thermostatkopf-wechseln/short.mjs wasser [--still 3,8,15]
// Schreibt out/short_wasser_video.mp4 (ohne Ton) und short_wasser.json (Zeiten für Ton und Mischung).
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { valveSection, headSide, check, bell, loadAssets, IMG, C, cursor, text, rrect, shadow, noShadow, spring, seg, easeOut, easeInOut, lerp, clamp } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 60, GAP = 0.35;
const NAME = process.argv[2];
const PREFIX = { wasser: 's1_' }[NAME];
if (!PREFIX) { console.error('Aufruf: node short.mjs wasser'); process.exit(1); }

// ---------- Zeiten: Sätze nacheinander ----------
const DURS = JSON.parse(fs.readFileSync(path.join(DIR, 'audio/shorts/durations.json'), 'utf8'));
const ids = Object.keys(DURS).filter((k) => k.startsWith(PREFIX)).sort();
let cur = 0.5;
const L = ids.map((id) => { const l = { id, t: cur, d: DURS[id], e: cur + DURS[id] }; cur = l.e + GAP; return l; });
const DUR = +(L[L.length - 1].e + 1.8).toFixed(2);

// ---------- Untertitel (eigene Wortzeiten) ----------
const START = Object.fromEntries(L.map((l) => [l.id, l.t]));
const CAPLINES = JSON.parse(fs.readFileSync(path.join(DIR, 'shorts_captions.json'), 'utf8')).filter((l) => l.id.startsWith(PREFIX));
const CAPS = (() => {
  const chunks = [];
  for (const line of CAPLINES) {
    let c = []; const flush = () => { if (c.length) chunks.push(c); c = []; };
    for (const w of line.words) {
      const word = { w: w.w.toUpperCase(), s: START[line.id] + w.s };
      if (c.length && (c.length >= 3 || [...c, word].map((x) => x.w).join(' ').length > 22)) flush();
      c.push(word); if (/[.,:;?!]$/.test(w.w)) flush();
    }
    flush();
  }
  return chunks.map((ws, i) => { const n = chunks[i + 1], end = ws[ws.length - 1].s + 0.5; return { ws, t0: ws[0].s - 0.05, t1: n && n[0].s - end < 0.6 ? n[0].s - 0.05 : end + 0.3 }; });
})();
const WSTART = Object.fromEntries(CAPLINES.map((l) => [l.id, l.words.map((w) => ({ w: w.w.toLowerCase(), s: START[l.id] + w.s }))]));
const wt = (id, w, fb) => ((WSTART[id] || []).find((x) => x.w.startsWith(w.toLowerCase())) || { s: fb ?? START[id] }).s;
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

function header(ctx, t) {
  const a = easeOut(seg(t, 0.1, 0.5));
  ctx.save(); ctx.globalAlpha = a;
  ctx.save(); ctx.beginPath(); ctx.arc(110, 150, 34, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, 76, 116, 68, 68); ctx.restore();
  text(ctx, 'Der Handwerksdoktor', 160, 145, 30, 'IXB', C.ink); text(ctx, 'HEIZUNG · THERMOSTAT WECHSELN', 160, 180, 22, 'ISB', C.gray, 'left', 1, 2);
  ctx.restore();
}

function frameWasser(ctx, t) {
  header(ctx, t);
  const a = spring(seg(t, 0.2, 0.7)), tw = wt('s1_0', 'wasser'), b = spring(seg(t, tw - 0.1, tw + 0.4));
  ctx.save(); ctx.globalAlpha = clamp(a * 2); ctx.translate(76, 340); ctx.scale(lerp(0.9, 1, a), lerp(0.9, 1, a)); text(ctx, 'Kommt Wasser', 0, 0, 112, 'IXB', C.ink); ctx.restore();
  if (b > 0) {
    ctx.save(); ctx.globalAlpha = clamp(b * 2); ctx.translate(76, 490); ctx.scale(lerp(0.9, 1, b), lerp(0.9, 1, b));
    ctx.font = '124px IXB'; const w = ctx.measureText('raus?').width; ctx.fillStyle = '#2346E8'; rrect(ctx, -18, -104, w + 36, 140, 28); ctx.fill();
    text(ctx, 'raus?', 0, 0, 124, 'IXB', '#fff'); ctx.restore();
  }
  // Ventil mit Kopf; bei „Nein“ hebt der Kopf ab, das Wasser bleibt in der Leitung
  const fp = spring(seg(t, 0.4, 1.0));
  if (fp > 0) {
    const tN = L[1].t, lift = easeInOut(seg(t, tN - 0.2, tN + 0.8));
    ctx.save(); ctx.globalAlpha = clamp(fp * 2);
    ctx.fillStyle = C.panel; rrect(ctx, 40, 580, 1000, 680, 30); ctx.fill();
    valveSection(ctx, t, 540, 1030, 0.9, 1, { labels: false });
    ctx.save(); ctx.globalAlpha *= 1 - lift * 0.7; headSide(ctx, 540, lerp(955, 880, lift), 0.95, { num: 5 }); ctx.restore();
    const ok = spring(seg(t, wt('s1_1', 'außerhalb') - 0.1, wt('s1_1', 'außerhalb') + 0.4));
    if (ok > 0) { ctx.save(); ctx.globalAlpha *= clamp(ok * 2); ctx.fillStyle = C.lime; rrect(ctx, 250, 620, 580, 70, 35); ctx.fill(); text(ctx, 'kein Wasser tritt aus', 540, 668, 36, 'IXB', C.ink, 'center'); ctx.restore(); }
    text(ctx, 'Wasser bleibt in der Leitung', 540, 1228, 34, 'IXB', C.blue, 'center', easeOut(seg(t, wt('s1_1', 'leitung') - 0.1, wt('s1_1', 'leitung') + 0.3)));
    ctx.restore();
  }
  const fb = spring(seg(t, wt('s1_2', 'ventil') - 0.1, wt('s1_2', 'ventil') + 0.4)) * (1 - seg(t, L[3].t - 0.2, L[3].t + 0.2));
  if (fb > 0) {
    ctx.save(); ctx.globalAlpha = clamp(fb * 2); ctx.fillStyle = '#26262A'; rrect(ctx, 90, 720, 900, 150, 20); ctx.fill(); ctx.fillStyle = '#FF8A1C'; rrect(ctx, 90, 720, 12, 150, 6); ctx.fill();
    text(ctx, 'Nur beim Ventil-Tausch:', 130, 785, 40, 'IXB', '#fff'); text(ctx, 'Fachbetrieb', 130, 840, 36, 'IXB', '#FF8A1C'); ctx.restore();
  }
  // Abo-Aufruf
  const tEnd = L[3].t, sp = spring(seg(t, tEnd + 0.1, tEnd + 0.6)), subT = wt('s1_3', 'abonnier');
  if (sp > 0) {
    const subbed = t >= subT;
    ctx.save(); ctx.globalAlpha = clamp(sp * 2); ctx.translate(540, 1130); ctx.scale(sp, sp);
    shadow(ctx, 0.35, 40, 14); ctx.fillStyle = '#fff'; rrect(ctx, -400, -110, 800, 220, 40); ctx.fill(); noShadow(ctx);
    text(ctx, 'Die ganze Anleitung im langen Video', 0, -46, 32, 'IXB', C.ink, 'center');
    ctx.fillStyle = subbed ? '#E9E9E9' : C.yt; rrect(ctx, -170, 0, 340, 76, 38); ctx.fill();
    if (subbed) { bell(ctx, -100, 36, 34, C.ink, seg(t, subT + 0.2, subT + 1.6)); text(ctx, 'Abonniert', 22, 50, 32, 'IXB', C.ink, 'center'); } else text(ctx, 'ABONNIEREN', 0, 50, 30, 'IXB', '#fff', 'center', 1, 1);
    ctx.restore();
    const cu = easeOut(seg(t, subT - 0.9, subT - 0.05));
    cursor(ctx, lerp(980, 640, cu), lerp(1500, 1170, cu), 'Doc', clamp(sp * 2), t >= subT && t < subT + 0.2 ? Math.sin(Math.PI * seg(t, subT, subT + 0.2)) : 0);
  }
}
function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; noShadow(ctx);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  frameWasser(ctx, t);
  captions(ctx, t);
}

function cues() {
  const c = [], add = (t, type, gain) => c.push({ t: +t.toFixed(3), type, gain });
  add(0.25, 'pop', 0.25); add(wt('s1_0', 'wasser'), 'thump', 0.3); add(L[1].t, 'whoosh', 0.3);
  add(wt('s1_1', 'außerhalb'), 'blip', 0.25); add(wt('s1_1', 'leitung'), 'gluck', 0.2); add(wt('s1_2', 'ventil'), 'pop', 0.25);
  add(L[3].t + 0.1, 'bloop', 0.3); add(wt('s1_3', 'abonnier'), 'click', 0.5);
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
