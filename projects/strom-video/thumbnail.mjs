// Thumbnails für das Strom-Video, 1280x720, mit denselben Figuren wie im Video (Funke + Stations-Figuren).
// Drei Varianten für YouTubes „Testen und vergleichen“.
//   node projects/strom-video/thumbnail.mjs  ->  out/thumbnail_A.png, _B.png, _C.png
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spark, station, C, BEAT_TIMES } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');
const W = 1280, H = 720;
const T = BEAT_TIMES[40] + 0.04; // kurz nach einem Beat: Funken knistern, Tolle wippt

function text(x, parts, px, py, size, align = 'left') {
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.03}px`;
  const total = parts.reduce((a, [s]) => a + x.measureText(s).width, 0);
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  for (const [s, col] of parts) { x.fillStyle = col; x.fillText(s, cx, py); cx += x.measureText(s).width; }
  x.letterSpacing = '0px';
}
function canvas() { const c = createCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); return [c, x]; }
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }

// A: Zahl als Neugier-Lücke – 380.000 V -> 230 V, staunender Funke, Mast und Steckdose als Anfang und Ende
{
  const [c, x] = canvas();
  station(x, T, 'pylon', 105, 120, 85, '^^');
  station(x, T, 'socket', 90, 640, 80, 'oo');
  spark(x, T, 330, 420, 200, 'oo');
  text(x, [['380.000 V', C.W]], 1230, 300, 120, 'right');
  text(x, [['↓', C.S]], 1000, 440, 120, 'center');
  text(x, [['230 V', C.S]], 1230, 600, 170, 'right');
  await save(c, 'thumbnail_A.png');
}
// B: Frage – „Woher kommt dein Strom?“, Funke guckt aus der Steckdose
{
  const [c, x] = canvas();
  station(x, T, 'socket', 1110, 490, 240, 'oo');
  spark(x, T, 1110, 250, 105, '><');
  text(x, [['Woher kommt', C.W]], 70, 250, 112);
  text(x, [['dein ', C.W], ['Strom?', C.S]], 70, 390, 132);
  station(x, T, 'turbine', 150, 580, 58, 'oo', { spin: 0.4 });
  station(x, T, 'pylon', 340, 585, 62, '^^');
  station(x, T, 'house', 520, 600, 58, 'oo');
  await save(c, 'thumbnail_B.png');
}
// C: Die Reise – Turbine -> Funke mit Schweif -> Steckdose
{
  const [c, x] = canvas();
  text(x, [['Vom Kraftwerk', C.W]], 640, 150, 104, 'center');
  text(x, [['bis zur ', C.W], ['Steckdose', C.S]], 640, 270, 104, 'center');
  station(x, T, 'turbine', 200, 520, 110, 'oo', { spin: 0.4 });
  station(x, T, 'socket', 1090, 520, 145, 'oo');
  x.fillStyle = C.S; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(390 + i * 34, 520, 8, 0, Math.PI * 2); x.fill(); }
  spark(x, T, 720, 520, 120, '><', { tail: 1.0 });
  await save(c, 'thumbnail_C.png');
}

// ---------- Varianten im Stil erfolgreicher YouTube-Thumbnails (Person, Pfeil, Schritte, Glas-Karten) ----------
import { loadImage } from '@napi-rs/canvas';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const RED = '#e8201c';
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png')); // freigestelltes Kanalbild

function frameAt(t) { // Standbild aus dem fertigen Video
  const f = path.join(os.tmpdir(), `strom_thumb_${t}.png`);
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', path.join(DIR, 'out/final.mp4'), '-frames:v', '1', f]);
  return loadImage(f);
}
function arrow(x, pts, col, w, head = 26) { // Pfeil entlang einer Kurve (Start, Kontrollpunkt, Ende)
  const [[ax, ay], [cx, cy], [bx, by]] = pts;
  x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke();
  const ang = Math.atan2(by - cy, bx - cx);
  x.beginPath(); x.moveTo(bx - head * Math.cos(ang - 0.5), by - head * Math.sin(ang - 0.5)); x.lineTo(bx, by);
  x.lineTo(bx - head * Math.cos(ang + 0.5), by - head * Math.sin(ang + 0.5)); x.stroke();
}
function drawPerson(x, cx, faceY, h, { shadow = true } = {}) { // Gesicht liegt im Bild bei ca. (50 %, 40 %)
  const w = h, left = cx - w / 2, top = faceY - h * 0.4;
  x.save(); if (shadow) { x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 40; }
  x.drawImage(person, left, top, w, h); x.restore();
}

// D: Schritt-Diagramm wie „How Houses Are Made“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  text(x, [['WIE STROM', '#111']], 640, 170, 118, 'center');
  text(x, [['INS HAUS', RED]], 640, 310, 132, 'center');
  text(x, [['KOMMT', '#111']], 640, 445, 118, 'center');
  const steps = [
    ['1. KRAFTWERK', 'turbine', 125, 150], ['2. HOCHSPANNUNG', 'pylon', 125, 385], ['3. UMSPANNWERK', 'transformer', 125, 620],
    ['4. TRAFOSTATION', 'house', 470, 620], ['5. ZÄHLER', 'meter', 810, 620],
    ['6. SICHERUNG', 'breaker', 1155, 385], ['7. STECKDOSE', 'socket', 1155, 150],
  ];
  steps.forEach(([label, kind, sx, sy]) => {
    x.fillStyle = '#111'; x.beginPath(); x.roundRect(sx - 62, sy - 52, 124, 124, 26); x.fill();
    station(x, T, kind, sx, sy + 10, kind === 'pylon' || kind === 'meter' || kind === 'breaker' ? 44 : 40, 'oo', { spin: 0.4 });
    text(x, [[label, '#111']], sx, sy - 66, 23, 'center');
  });
  const A = (p) => arrow(x, p, RED, 9, 22);
  A([[125, 225], [118, 255], [125, 285]]); A([[125, 460], [118, 490], [125, 520]]);
  A([[195, 630], [260, 622], [398, 630]]); A([[540, 630], [620, 622], [738, 630]]);
  A([[880, 610], [1080, 560], [1130, 470]]); A([[1155, 320], [1170, 285], [1155, 245]]);
  spark(x, T, 1010, 470, 40, '^^');
  await save(c, 'thumbnail_D.png');
}

// E: Person + Objekt + Pfeil wie „Peptides“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(900, 300, 50, 700, 360, 900); g.addColorStop(0, '#2a2a2d'); g.addColorStop(1, '#0d0d0e');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const R = (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${R() * 0.035})`; x.fillRect(R() * W, R() * H, 2, 2); } // leichte Textur
  drawPerson(x, 990, 300, 800);
  text(x, [['380.000', C.W]], 60, 170, 150);
  text(x, [['VOLT?', C.S]], 60, 310, 150);
  station(x, T, 'socket', 330, 555, 130, 'oo');
  spark(x, T, 330, 400, 50, '><');
  arrow(x, [[560, 250], [640, 380], [500, 500]], C.W, 10, 30);
  await save(c, 'thumbnail_E.png');
}

// F: Person vor leuchtenden Glas-Karten mit Video-Frames + 3D-Button wie „Motion Design“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(640, 330, 30, 640, 360, 760); g.addColorStop(0, '#ff741c'); g.addColorStop(0.35, '#5a2208'); g.addColorStop(1, '#0b0705');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const cards = [[14, 40, 45, 360, 203, -0.05], [31, 40, 300, 360, 203, 0.03], [63, 880, 45, 360, 203, 0.05], [104, 880, 300, 360, 203, -0.03]];
  for (const [t, cx0, cy0, w, h, rot] of cards) {
    const img = await frameAt(t);
    x.save(); x.translate(cx0 + w / 2, cy0 + h / 2); x.rotate(rot);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 30; x.fillStyle = '#000'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.fill(); x.shadowBlur = 0;
    x.save(); x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.clip(); x.drawImage(img, -w / 2, -h / 2, w, h); x.restore();
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 5; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.stroke();
    x.restore();
  }
  drawPerson(x, 640, 270, 700);
  // 3D-Button
  const bx = 250, by = 520, bw = 780, bh = 150;
  x.save(); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 40; x.shadowOffsetY = 12;
  const pg = x.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#d9d9de');
  x.fillStyle = pg; x.beginPath(); x.roundRect(bx, by, bw, bh, bh / 2); x.fill(); x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.roundRect(bx + 4, by + 4, bw - 8, bh - 8, bh / 2); x.stroke();
  x.fillStyle = '#111'; x.beginPath(); x.roundRect(bx + 22, by + 20, 110, 110, 26); x.fill();
  spark(x, T, bx + 77, by + 86, 30, '^^');
  x.font = '800 100px InterXB'; x.letterSpacing = '-3px';
  x.fillStyle = '#111'; x.fillText('Strom', bx + 160, by + 110);
  const sw = x.measureText('Strom ').width;
  const tg = x.createLinearGradient(0, by + 20, 0, by + 120); tg.addColorStop(0, '#ff7a3d'); tg.addColorStop(1, '#e8201c');
  x.fillStyle = tg; x.fillText('erklärt', bx + 160 + sw, by + 110); x.letterSpacing = '0px';
  await save(c, 'thumbnail_F.png');
}
