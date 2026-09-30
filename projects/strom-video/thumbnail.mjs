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
