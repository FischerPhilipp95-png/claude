// HECH Vorstellungs-Video für Instagram (Grammatik: refs/ref-06, Kinetic Typography).
// 1080x1920, 60 fps, 10 Takte à 108 BPM = 22,2 s. Ablauf: shotlist.md, Stil: style_guide.md, Assets: assets/hech/.
//   node projects/hech-promo/render.mjs --timeline        timeline.json + cues.json
//   node projects/hech-promo/render.mjs --contact         Übersicht zur Abnahme
//   node projects/hech-promo/render.mjs --still 5,12.5    einzelne Frames
//   node projects/hech-promo/render.mjs [--from s --to s] Video (stumm) nach out/video.mp4
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const A = (f) => path.join(ROOT, 'assets/hech', f);
const W = 1080, H = 1920, FPS = 60, CX = 540;
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/BarlowCondensed-800.ttf'), 'Barlow');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Manrope-800.ttf'), 'ManropeXB');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Manrope-600.ttf'), 'ManropeSB');

// ---------- Marke (hech-bau.de) ----------
const C = { or: '#EC641E', orL: '#FFB27A', dark: '#17191C', gray: '#34373A', mid: '#8A8D90', white: '#FFFFFF', paper: '#F6F5F2', wa: '#25D366', waD: '#0B5C3B' };

// ---------- Helfer ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(10 * x));
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- Takt ----------
const BPM = 108, BEAT = 60 / BPM, BAR = 4 * BEAT, N_BARS = 10, DUR = N_BARS * BAR;
const bar = (b) => b * BAR;
const S = { intro: [0, 1.5], bagger: [1.5, 3], zaun: [3, 4.5], mehr: [4.5, 5.5], sterne: [5.5, 6.5], chat: [6.5, 8.5], ende: [8.5, 10] };
for (const k in S) S[k] = S[k].map(bar);
const sinceBeat = (t) => t - Math.floor(t / BEAT + 1e-6) * BEAT;
const kickPunch = (t) => Math.exp(-sinceBeat(t) / 0.08) * 0.025;   // kleiner Zoom-Stoß auf jedem Beat

// ---------- Zeichnen ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + clamp(w / 2 - fx * dw, w - dw, 0), y + clamp(h / 2 - fy * dh, h - dh, 0), dw, dh);
}
function shadow(ctx, a = 0.35, blur = 40, dy = 18) { ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
// Foto als Chip: abgerundet, weißer Rand, Schatten, Drehung, Skalierung um die Mitte
function chip(ctx, img, cx, cy, w, h, { rot = 0, scale = 1, alpha = 1, border = 8, radius = 28, fx = 0.5, fy = 0.5 } = {}) {
  if (alpha <= 0 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(scale, scale);
  shadow(ctx, 0.3, 40, 16); ctx.fillStyle = '#fff'; rrect(ctx, -w / 2, -h / 2, w, h, radius); ctx.fill(); noShadow(ctx);
  rrect(ctx, -w / 2 + border, -h / 2 + border, w - 2 * border, h - 2 * border, radius - border); ctx.clip();
  cover(ctx, img, -w / 2, -h / 2, w, h, fx, fy);
  ctx.restore();
}
function setFont(ctx, size, fam) { ctx.font = `${size}px ${fam}`; }
// Wort mit einzeln federnden Buchstaben (Referenz: Buchstaben springen einzeln)
function bouncyWord(ctx, t, word, cx, y, size, fam, fill, t0, stagger = 0.035, out = Infinity, ls = 0) {
  setFont(ctx, size, fam); ctx.letterSpacing = `${ls}px`;
  const total = ctx.measureText(word).width;
  let x = cx - total / 2;
  const o = easeIn(seg(t, out, out + 0.25));
  [...word].forEach((ch, i) => {
    const w = ctx.measureText(ch).width + ls;
    const p = spring(seg(t, t0 + i * stagger, t0 + i * stagger + 0.55));
    if (p > 0) {
      ctx.save(); ctx.translate(x + w / 2, y - (1 - p) * 120 - o * 60); ctx.scale(lerp(0.4, 1, clamp(p * 1.2)), p);
      ctx.globalAlpha = clamp(p * 3) * (1 - o); ctx.fillStyle = typeof fill === 'function' ? fill(x + w / 2) : fill; ctx.fillText(ch, -w / 2 + ls / 2, 0); ctx.restore();
    }
    x += w;
  });
  ctx.letterSpacing = '0px';
  return total;
}
function textC(ctx, s, x, y, size, fam, col, alpha = 1, align = 'center') {
  if (alpha <= 0) return 0;
  setFont(ctx, size, fam); const w = ctx.measureText(s).width;
  ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fillText(s, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y); ctx.globalAlpha = 1;
  return w;
}
// Wechselnde Wörter: das alte rutscht nach oben weg, das neue kommt von unten (auf dem Beat)
function swapWords(ctx, t, words, t0, step, draw) {
  const k = Math.floor((t - t0) / step);
  if (t < t0) return;
  const i = Math.min(k, words.length - 1), tin = t0 + i * step, p = easeOut(seg(t, tin, tin + 0.22));
  if (i > 0 && p < 1) draw(words[i - 1], i - 1, -p, 1 - p);
  draw(words[i], i, 1 - p, p);
}

// ---------- Assets ----------
const IMG = {};
async function loadAssets() {
  for (const k of ['logo', 'logo_dark', 'logo_symbol', 'logo_symbol_dark']) IMG[k] = await loadImage(A(k + '.png'));
  for (const k of ['bagger_garten', 'aushub_gebaeude', 'bagger_eng', 'toranlage', 'tor_blickdicht', 'sichtschutz', 'gabionen', 'zaun_mauer', 'zaun_stein']) IMG[k] = await loadImage(A(k + '.jpg'));
}

// ================= Szenen =================
// 1 Weiß: „Das ist [Symbol] HECH“, Symbol wird zum Bagger-Foto
function sceneIntro(ctx, t) {
  const [a, b] = S.intro;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const y = 880, size = 92;
  const pop = spring(seg(t, a + 0.05, a + 0.6));
  const row = easeInOut(seg(t, a + BEAT, a + BEAT + 0.45));       // Satz baut sich auf
  const toChip = easeInOut(seg(t, a + 4 * BEAT, a + 4 * BEAT + 0.4));
  const zoomOut = easeIn(seg(t, b - 0.35, b));
  setFont(ctx, size, 'ManropeXB');
  const wDas = ctx.measureText('Das ist').width, wHech = ctx.measureText('HECH').width;
  const symW = lerp(lerp(420, 180, row), 210, toChip), symH = lerp(symW * IMG.logo_symbol.height / IMG.logo_symbol.width, 140, toChip);
  const gap = 22, total = wDas * row + gap * row + symW + gap * row + wHech * row;
  let x = CX - total / 2;
  ctx.save(); ctx.translate(CX, y - 30); ctx.scale(1 + zoomOut * 1.4, 1 + zoomOut * 1.4); ctx.translate(-CX, -(y - 30));
  ctx.globalAlpha = 1 - zoomOut;
  if (row > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 140, wDas * row + 10, 200); ctx.clip();
    textC(ctx, 'Das ist', x + wDas * row - wDas, y, size, 'ManropeXB', C.dark, 1, 'left'); ctx.restore();
  }
  x += wDas * row + gap * row;
  const sx = x + symW / 2, sy = y - 36;
  // Symbol -> Foto-Chip mit Bagger
  if (toChip < 1) {
    const s = pop * (1 + 0.04 * Math.sin(t * 6) * (1 - row));
    ctx.save(); ctx.translate(sx, sy); ctx.scale(s, s); ctx.globalAlpha = (1 - toChip) * (1 - zoomOut);
    ctx.drawImage(IMG.logo_symbol_dark, -symW / 2, -symW * IMG.logo_symbol.height / IMG.logo_symbol.width / 2, symW, symW * IMG.logo_symbol.height / IMG.logo_symbol.width); ctx.restore();
  }
  if (toChip > 0) chip(ctx, IMG.bagger_eng, sx, sy, symW, symH, { rot: lerp(0.3, -0.06, spring(toChip)), scale: spring(toChip), radius: 30, border: 7, fy: 0.45 });
  x += symW + gap * row;
  // HECH tippt sich Buchstabe für Buchstabe (orange)
  const n = Math.floor(4 * seg(t, a + 2 * BEAT, a + 3 * BEAT));
  if (row > 0.5) textC(ctx, 'HECH'.slice(0, n), x, y, size, 'ManropeXB', C.or, 1, 'left');
  if (row > 0.5 && n < 4 && Math.floor(t * 4) % 2 === 0 && t > a + 1.4 * BEAT) { ctx.fillStyle = C.or; setFont(ctx, size, 'ManropeXB'); ctx.fillRect(x + ctx.measureText('HECH'.slice(0, n)).width + 4, y - 80, 6, 90); }
  // Unterzeile
  const sub = easeOut(seg(t, a + 4.5 * BEAT, a + 4.5 * BEAT + 0.4));
  textC(ctx, 'Baggerarbeiten & Zaunbau', CX, y + 110 + (1 - sub) * 20, 50, 'ManropeSB', '#5A5D60', sub);
  ctx.restore();
}

// 2 Orange: BAGGERN. + Foto + wechselnde Leistungen
const BAGGER = ['Pool-Ausschachtung', 'Fundamentaushub', 'Wurzelentfernung', 'Geländemodellierung', 'Entwässerung'];
function sceneBagger(ctx, t) {
  const [a, b] = S.bagger;
  ctx.fillStyle = C.or; ctx.fillRect(0, 0, W, H);
  const punch = 1 + kickPunch(t);
  ctx.save(); ctx.translate(CX, 860); ctx.scale(punch, punch); ctx.translate(-CX, -860);
  // Foto-Chip oben (wechselt zur Hälfte)
  const ph = spring(seg(t, a + 0.15, a + 0.75)), sw = spring(seg(t, a + 4 * BEAT, a + 4 * BEAT + 0.6));
  chip(ctx, IMG.bagger_garten, CX - 20, 520, 560, 400, { rot: -0.06 + 0.02 * Math.sin(t * 2), scale: ph * (1 - sw), fy: 0.4 });
  chip(ctx, IMG.aushub_gebaeude, CX + 20, 520, 560, 400, { rot: 0.05 + 0.02 * Math.sin(t * 2), scale: sw, fy: 0.5 });
  // BAGGERN mit springendem Punkt
  const out = b - 0.25;
  bouncyWord(ctx, t, 'BAGGERN', CX - 30, 1010, 230, 'Barlow', C.white, a, 0.04, out, 2);
  setFont(ctx, 230, 'Barlow'); ctx.letterSpacing = '2px'; const wb = ctx.measureText('BAGGERN').width; ctx.letterSpacing = '0px';
  const dt = t - (a + 2 * BEAT), dotY = dt < 0 ? -400 : 1010 - 300 * Math.exp(-dt * 4) * Math.abs(Math.cos(dt * 9));
  if (dt > 0 && t < out + 0.25) { ctx.fillStyle = C.dark; ctx.fillRect(CX - 30 + wb / 2 + 10, dotY - 38, 38, 38); }
  // Pille mit wechselnder Leistung
  const pill = spring(seg(t, a + BEAT, a + BEAT + 0.5));
  if (pill > 0) {
    ctx.save(); ctx.translate(CX, 1170); ctx.scale(pill, pill);
    shadow(ctx, 0.2, 30, 10); ctx.fillStyle = C.white; rrect(ctx, -420, -62, 840, 124, 62); ctx.fill(); noShadow(ctx);
    ctx.beginPath(); ctx.rect(-410, -60, 820, 120); ctx.clip();
    swapWords(ctx, t, BAGGER, a + BEAT, BEAT, (w, i, off, al) => textC(ctx, w, 0, 20 + off * 90, 58, 'ManropeXB', C.dark, al));
    ctx.restore();
  }
  ctx.restore();
}

// 3 Anthrazit: ZÄUNE. mit wanderndem Verlauf + gedrehtes Wechselwort + Foto
const ZAUN = [['Doppelstabmatten', 'zaun_mauer'], ['Sichtschutz', 'sichtschutz'], ['Toranlagen', 'toranlage'], ['Gabionen', 'gabionen'], ['Blickdichte Tore', 'tor_blickdicht']];
function sceneZaun(ctx, t) {
  const [a, b] = S.zaun;
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
  const punch = 1 + kickPunch(t);
  ctx.save(); ctx.translate(CX, 860); ctx.scale(punch, punch); ctx.translate(-CX, -860);
  // Fotos wechseln mit dem Wort, fliegen schräg herein
  const k = clamp(Math.floor((t - (a + BEAT)) / BEAT), -1, ZAUN.length - 1);
  for (let i = Math.max(0, k - 1); i <= k; i++) {
    const tin = a + BEAT + i * BEAT, p = spring(seg(t, tin, tin + 0.55)), gone = i < k ? easeIn(seg(t, tin + BEAT, tin + BEAT + 0.2)) : 0;
    chip(ctx, IMG[ZAUN[i][1]], CX + (1 - p) * 500 - gone * 600, 520, 580, 420, { rot: lerp(0.35, i % 2 ? 0.05 : -0.05, p), scale: 1, alpha: clamp(p * 2) * (1 - gone) });
  }
  // ZÄUNE. mit Orange-Verlauf, der durchläuft
  const sh = ((t - a) * 420) % 1600 - 800;
  const grad = (xc) => {        // Verlauf in Buchstaben-Koordinaten, damit er über das ganze Wort läuft
    const g = ctx.createLinearGradient(CX - 500 + sh - xc, 0, CX + 500 + sh - xc, 0);
    g.addColorStop(0, C.white); g.addColorStop(0.4, C.orL); g.addColorStop(0.55, C.or); g.addColorStop(0.75, C.white); g.addColorStop(1, C.white);
    return g;
  };
  bouncyWord(ctx, t, 'ZÄUNE.', CX, 1020, 240, 'Barlow', grad, a, 0.045, b - 0.25, 2);
  // gedrehtes Wechselwort (Referenz: „Limited drop“)
  const rw = spring(seg(t, a + BEAT, a + BEAT + 0.5));
  if (rw > 0) {
    ctx.save(); ctx.translate(CX + 40, 1160); ctx.rotate(-0.09 * rw); ctx.scale(rw, rw);
    ctx.beginPath(); ctx.rect(-520, -80, 1040, 120); ctx.clip();
    swapWords(ctx, t, ZAUN.map((z) => z[0]), a + BEAT, BEAT, (w, i, off, al) => textC(ctx, w, 0, 10 + off * 100, 70, 'ManropeXB', C.or, al * (1 - easeIn(seg(t, b - 0.25, b)))));
    ctx.restore();
  }
  ctx.restore();
}

// 4 & MEHR.: drei Fotos fächern sich auf
function sceneMehr(ctx, t) {
  const [a, b] = S.mehr;
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
  const cards = [['bagger_garten', -1], ['zaun_stein', 1], ['aushub_gebaeude', 0]];
  cards.forEach(([k, d], i) => {
    const p = spring(seg(t, a + i * 0.12, a + 0.6 + i * 0.12)), out = easeIn(seg(t, b - 0.3, b));
    chip(ctx, IMG[k], CX + d * 230 * p, 560 + Math.abs(d) * 40 * p - out * 900, 470, 600, { rot: d * 0.16 * p, scale: lerp(0.3, 1, p), alpha: clamp(p * 2) });
  });
  bouncyWord(ctx, t, '& MEHR.', CX, 1090, 230, 'Barlow', C.white, a + BEAT, 0.04, b - 0.25, 2);
  const s = easeOut(seg(t, a + 2 * BEAT, a + 2 * BEAT + 0.4)) * (1 - easeIn(seg(t, b - 0.25, b)));
  textC(ctx, 'Garten · Wegebau · Abriss', CX, 1200 + (1 - s) * 20, 52, 'ManropeSB', C.or, s);
}

// 5 Weiß: 5,0 ★★★★★, 15 Google-Bewertungen
function star(ctx, x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  ctx.closePath(); ctx.fill();
}
function sceneSterne(ctx, t) {
  const [a, b] = S.sterne;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const out = easeIn(seg(t, b - 0.25, b));
  const v = (5 * easeOut(seg(t, a + 0.05, a + 0.7))).toFixed(1).replace('.', ',');
  const p = spring(seg(t, a, a + 0.5));
  ctx.save(); ctx.translate(CX, 760); ctx.scale(p * (1 - out * 0.3), p * (1 - out * 0.3)); ctx.globalAlpha = 1 - out;
  textC(ctx, v, 0, 110, 330, 'Barlow', C.dark); ctx.restore();
  for (let i = 0; i < 5; i++) {
    const ts = a + BEAT * 0.5 + i * BEAT * 0.4, sp = spring(seg(t, ts, ts + 0.45));
    if (sp <= 0) continue;
    ctx.save(); ctx.translate(CX + (i - 2) * 150, 980); ctx.rotate((1 - sp) * 1.2); ctx.scale(sp, sp); ctx.globalAlpha = 1 - out;
    star(ctx, 0, 0, 62, C.or); ctx.restore();
  }
  const s = easeOut(seg(t, a + 3 * BEAT, a + 3 * BEAT + 0.4)) * (1 - out);
  textC(ctx, '15 echte Google-Bewertungen', CX, 1140 + (1 - s) * 20, 52, 'ManropeSB', '#5A5D60', s);
}

// 6 WhatsApp-Chat
function wrap(ctx, s, maxW) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines;
}
function bubble(ctx, t, tin, side, lines, y, bg, fg, avatar) {
  const p = spring(seg(t, tin, tin + 0.45));
  if (p <= 0) return 0;
  setFont(ctx, 46, 'ManropeSB');
  const lw = Math.max(...lines.map((l) => ctx.measureText(l).width)), bw = lw + 70, bh = lines.length * 60 + 44;
  const x = side === 'right' ? W - 150 - bw : 150;
  ctx.save(); ctx.translate(side === 'right' ? x + bw : x, y + bh); ctx.scale(p, p); ctx.translate(-(side === 'right' ? x + bw : x), -(y + bh));
  shadow(ctx, 0.3, 30, 10); ctx.fillStyle = bg; rrect(ctx, x, y, bw, bh, 34); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = fg; lines.forEach((l, i) => ctx.fillText(l, x + 35, y + 72 + i * 60));
  ctx.restore();
  // Avatar
  const ax = side === 'right' ? W - 85 : 85, ay = y + bh - 40, ap = spring(seg(t, tin - 0.1, tin + 0.35));
  if (ap > 0) {
    ctx.save(); ctx.translate(ax, ay); ctx.scale(ap, ap);
    ctx.fillStyle = side === 'right' ? '#DDE3E0' : C.gray; ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
    if (avatar) { const w = 74, h = w * avatar.height / avatar.width; ctx.drawImage(avatar, -w / 2, -h / 2, w, h); }
    else { ctx.fillStyle = '#9AA5A0'; ctx.beginPath(); ctx.arc(0, -10, 16, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, 30, 28, Math.PI, 0); ctx.fill(); }
    ctx.restore();
  }
  return bh;
}
function typing(ctx, t, tin, tout, side, y) {
  const p = spring(seg(t, tin, tin + 0.35)) * (1 - easeIn(seg(t, tout - 0.1, tout)));
  if (p <= 0) return;
  const bw = 150, bh = 92, x = side === 'right' ? W - 150 - bw : 150;
  ctx.save(); ctx.translate(x + bw / 2, y + bh / 2); ctx.scale(p, p);
  ctx.fillStyle = side === 'right' ? C.wa : C.gray; rrect(ctx, -bw / 2, -bh / 2, bw, bh, 40); ctx.fill();
  for (let i = 0; i < 3; i++) { const j = Math.max(0, Math.sin(t * 12 - i * 0.9)) * 10; ctx.fillStyle = side === 'right' ? C.waD : '#C9CCCF'; ctx.beginPath(); ctx.arc((i - 1) * 32, -j, 11, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function waIcon(ctx, x, y, r, col) {
  ctx.strokeStyle = col; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(x, y, r, 0.65 * Math.PI, 2.55 * Math.PI); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - r * 0.62, y + r * 0.62); ctx.lineTo(x - r * 1.0, y + r * 1.0); ctx.lineTo(x - r * 0.25, y + r * 0.9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.38, r * 0.2, -0.8, 0, Math.PI * 2); ctx.fill();
}
function sceneChat(ctx, t) {
  const [a, b] = S.chat;
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
  // Kopfzeile
  const h1 = spring(seg(t, a, a + 0.5)), h2 = spring(seg(t, a + BEAT, a + BEAT + 0.5)), out = easeIn(seg(t, b - 0.25, b));
  ctx.save(); ctx.globalAlpha = 1 - out;
  ctx.save(); ctx.translate(CX, 400); ctx.scale(h1, h1); textC(ctx, 'ANFRAGEN?', 0, 0, 170, 'Barlow', C.white); ctx.restore();
  if (h2 > 0) { ctx.save(); ctx.translate(CX, 500); ctx.scale(h2, h2); setFont(ctx, 64, 'ManropeXB'); const tw = ctx.measureText('Einfach per WhatsApp.').width; waIcon(ctx, -tw / 2 - 20, -24, 30, C.wa); textC(ctx, 'Einfach per WhatsApp.', 30, 0, 64, 'ManropeXB', C.wa); ctx.restore(); }
  // Chat
  setFont(ctx, 46, 'ManropeSB');
  const t1 = a + 2 * BEAT, t2 = a + 3 * BEAT, t3 = a + 4.5 * BEAT, t4 = a + 5.5 * BEAT, t5 = a + 6.5 * BEAT;
  typing(ctx, t, t1, t2, 'right', 640);
  const l1 = wrap(ctx, 'Hallo Herr Hech, ich möchte mein Projekt kurz besprechen.', 620);
  const h = bubble(ctx, t, t2, 'right', l1, 640, C.wa, '#0B2E1E', null);
  typing(ctx, t, t3, t4, 'left', 680 + h + 40);
  const l2 = ['Foto senden.', 'Kurz abstimmen.', 'Angebot erhalten.'];
  bubble(ctx, t, t4, 'left', l2, 680 + h + 40, C.gray, C.white, IMG.logo_symbol);
  // Button
  const bp = spring(seg(t, t5, t5 + 0.45)), press = t > t5 + 0.75 ? 1 - 0.06 * Math.exp(-(t - t5 - 0.75) * 8) * Math.sin((t - t5 - 0.75) * 30) - 0.05 * (seg(t, t5 + 0.75, t5 + 0.8) - seg(t, t5 + 0.85, t5 + 0.95)) : 1;
  if (bp > 0) {
    ctx.save(); ctx.translate(CX, 1320); ctx.scale(bp * press, bp * press);
    shadow(ctx, 0.4, 40, 14); ctx.fillStyle = C.wa; rrect(ctx, -440, -70, 880, 140, 70); ctx.fill(); noShadow(ctx);
    waIcon(ctx, -360, -4, 28, '#0B2E1E');
    textC(ctx, 'Projekt per WhatsApp anfragen', 30, 16, 46, 'ManropeXB', '#0B2E1E');
    const rp = seg(t, t5 + 0.75, t5 + 1.35);
    if (rp > 0 && rp < 1) { ctx.globalAlpha = 1 - rp; ctx.strokeStyle = C.wa; ctx.lineWidth = 6; rrect(ctx, -440 - rp * 60, -70 - rp * 60, 880 + rp * 120, 140 + rp * 120, 70 + rp * 60); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}

// 7 Schluss: Logo schwebt, Partikel fallen, Link in der Bio
function sceneEnde(ctx, t) {
  const [a] = S.ende;
  const g = ctx.createRadialGradient(CX, 700, 50, CX, 900, 1300);
  g.addColorStop(0, '#5A2E14'); g.addColorStop(0.45, '#2A1E18'); g.addColorStop(1, C.dark);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // fallende orange Partikel (wie die Münzen der Referenz), vorne größer und unscharf
  const r = rand(7);
  for (let i = 0; i < 26; i++) {
    const depth = r(), x0 = r() * W, sp = 380 + depth * 520, ph = r() * 2000, sz = 14 + depth * 38;
    const y = ((t - a) * sp + ph) % (H + 200) - 100, rot = (t - a) * (1 + r() * 2) + i;
    ctx.save(); ctx.translate(x0 + Math.sin(t + i) * 30, y); ctx.rotate(rot); ctx.globalAlpha = 0.35 + depth * 0.6;
    if (depth > 0.75) ctx.filter = `blur(${((depth - 0.75) * 16).toFixed(1)}px)`;
    ctx.fillStyle = i % 3 ? C.or : C.orL; rrect(ctx, -sz / 2, -sz / 4, sz, sz / 2, sz / 6); ctx.fill(); ctx.restore();
  }
  ctx.filter = 'none';
  // Logo
  const p = spring(seg(t, a, a + 0.7)), bob = Math.sin((t - a) * 2.2) * 12;
  const lw = 820 * lerp(0.6, 1, p), lh = lw * IMG.logo.height / IMG.logo.width;
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(CX, 590 + bob); ctx.rotate(Math.sin((t - a) * 1.6) * 0.02);
  ctx.shadowColor = 'rgba(236,100,30,0.45)'; ctx.shadowBlur = 80; ctx.drawImage(IMG.logo, -lw / 2, -lh / 2, lw, lh); ctx.restore(); noShadow(ctx);
  // Link in der Bio + Pfeil
  const s1 = spring(seg(t, a + BEAT, a + BEAT + 0.5)), s2 = easeOut(seg(t, a + 2 * BEAT, a + 2 * BEAT + 0.4)), s3 = easeOut(seg(t, a + 3 * BEAT, a + 3 * BEAT + 0.4));
  if (s1 > 0) {
    ctx.save(); ctx.translate(CX, 1130); ctx.scale(s1, s1);
    textC(ctx, 'LINK IN DER BIO', 0, 0, 120, 'Barlow', C.white);
    const ay = -135 + Math.sin(t * 7) * 10;
    ctx.strokeStyle = C.or; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, ay + 50); ctx.lineTo(0, ay - 30); ctx.moveTo(-30, ay); ctx.lineTo(0, ay - 30); ctx.lineTo(30, ay); ctx.stroke();
    ctx.restore();
  }
  textC(ctx, '@hech.bau', CX, 1215 + (1 - s2) * 16, 58, 'ManropeXB', C.or, s2);
  if (s3 > 0) { waIcon(ctx, CX - 300, 1287 + (1 - s3) * 16, 20, C.wa); textC(ctx, 'WhatsApp 0170 8122657', CX + 20, 1303 + (1 - s3) * 16, 48, 'ManropeSB', C.white, s3); }
  textC(ctx, 'Erlenbach am Main', CX, 1366, 38, 'ManropeSB', C.mid, s3);
}

function drawFrame(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; noShadow(ctx);
  const scenes = [['intro', sceneIntro], ['bagger', sceneBagger], ['zaun', sceneZaun], ['mehr', sceneMehr], ['sterne', sceneSterne], ['chat', sceneChat], ['ende', sceneEnde]];
  for (const [k, fn] of scenes) if (t >= S[k][0] && t < S[k][1]) return fn(ctx, t);
  sceneEnde(ctx, t);
}

// ---------- Sounds ----------
function buildCues() {
  const c = [], add = (t, type, gain = 0.5) => c.push({ t: +t.toFixed(3), type, gain });
  const a1 = S.intro[0];
  add(a1 + 0.05, 'pop', 0.5); add(a1 + BEAT, 'whoosh', 0.35);
  for (let i = 0; i < 4; i++) add(a1 + 2 * BEAT + i * BEAT / 4, 'key', 0.45);
  add(a1 + 4 * BEAT, 'pop', 0.55); add(S.intro[1] - 0.2, 'whoosh', 0.5);
  add(S.bagger[0] + 0.15, 'pop', 0.4); BAGGER.forEach((_, i) => add(S.bagger[0] + BEAT * (1 + i), 'click', 0.35));
  add(S.bagger[0] + 2 * BEAT + 0.05, 'pop', 0.35); add(S.bagger[0] + 4 * BEAT, 'whoosh', 0.3);
  ZAUN.forEach((_, i) => add(S.zaun[0] + BEAT * (1 + i), 'whoosh', 0.3));
  [0, 0.12, 0.24].forEach((d) => add(S.mehr[0] + d, 'pop', 0.35));
  for (let i = 0; i < 5; i++) add(S.sterne[0] + BEAT * 0.5 + i * BEAT * 0.4, 'blip', 0.35);
  const a6 = S.chat[0];
  add(a6, 'pop', 0.4); add(a6 + BEAT, 'pop', 0.35);
  add(a6 + 3 * BEAT, 'bloop', 0.6); add(a6 + 5.5 * BEAT, 'bloop', 0.55);
  add(a6 + 6.5 * BEAT, 'pop', 0.45); add(a6 + 6.5 * BEAT + 0.75, 'click', 0.7);
  add(S.ende[0], 'whoosh', 0.5);
  return c.sort((p, q) => p.t - q.t);
}

async function main() {
  const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cues.json'), JSON.stringify(buildCues(), null, 1));
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ fps: FPS, duration: DUR, width: W, height: H, scenes: S, vo: [] }, null, 2));
  if (args[0] === '--timeline') return console.log('timeline.json + cues.json geschrieben');
  await loadAssets();
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  if (args[0] === '--still' || args[0] === '--contact') {
    const times = args[0] === '--still' ? args[1].split(',').map(Number) : Array.from({ length: 24 }, (_, i) => 0.4 + i * 0.92);
    const files = [];
    for (const t of times) { drawFrame(ctx, t); const f = path.join(DIR, 'out', `still_${t.toFixed(2)}.png`); fs.writeFileSync(f, await canvas.encode('png')); files.push([f, t]); }
    if (args[0] === '--contact') {
      const tw = 270, th = 480, cols = 8, rows = Math.ceil(files.length / cols);
      const sheet = createCanvas(tw * cols, (th + 30) * rows), sc = sheet.getContext('2d');
      sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
      for (const [i, [f, t]] of files.entries()) {
        const img = await loadImage(f), x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 30);
        sc.drawImage(img, x + 2, y + 30, tw - 4, th - 4);
        sc.fillStyle = '#fff'; sc.font = '20px ManropeSB'; sc.fillText(`${t.toFixed(1)} s`, x + 6, y + 22);
        fs.unlinkSync(f);
      }
      const out = path.join(DIR, 'out', 'contact_sheet.png'); fs.writeFileSync(out, await sheet.encode('png')); console.log(out);
    } else console.log(files.map(([f]) => f).join('\n'));
    return;
  }
  const from = arg('--from', 0), to = arg('--to', DUR);
  const outFile = path.join(DIR, 'out', 'video.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = Math.round(from * FPS); n < Math.round(to * FPS); n++) {
    drawFrame(ctx, n / FPS);
    const buf = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 300 === 0) process.stdout.write(`\r${(n / FPS).toFixed(1)} / ${to.toFixed(1)} s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n${outFile}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
