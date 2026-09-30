// Thumbnails für das Wasser-Video, 1280x720, im Stil der Referenz-Thumbnails (wie beim Strom-Video D/E/F),
// mit denselben Figuren wie im Video.  node projects/wasser-video/thumbnail.mjs
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drop, station, C, BEAT_TIMES } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');
const W = 1280, H = 720, RED = '#e8201c';
const T = BEAT_TIMES[40] + 0.05; // kurz nach einem Beat: der Tropfen spritzt
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));

function text(x, parts, px, py, size, align = 'left') {
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.03}px`;
  const total = parts.reduce((a, [s]) => a + x.measureText(s).width, 0);
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  for (const [s, col] of parts) { x.fillStyle = col; x.fillText(s, cx, py); cx += x.measureText(s).width; }
  x.letterSpacing = '0px';
}
function arrow(x, [[ax, ay], [cx, cy], [bx, by]], col, w, head = 26) {
  x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke();
  const ang = Math.atan2(by - cy, bx - cx);
  x.beginPath(); x.moveTo(bx - head * Math.cos(ang - 0.5), by - head * Math.sin(ang - 0.5)); x.lineTo(bx, by); x.lineTo(bx - head * Math.cos(ang + 0.5), by - head * Math.sin(ang + 0.5)); x.stroke();
}
function drawPerson(x, cx, faceY, h) {
  x.save(); x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 40; x.drawImage(person, cx - h / 2, faceY - h * 0.4, h, h); x.restore();
}
function frameAt(t) {
  const f = path.join(os.tmpdir(), `wasser_thumb_${t}.png`);
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', path.join(DIR, 'out/final.mp4'), '-frames:v', '1', f]);
  return loadImage(f);
}
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }
const timeline = JSON.parse(fs.readFileSync(path.join(DIR, 'timeline.json'), 'utf8'));
const ch = (n) => timeline.chapters.find((c) => c.ch === n).start;

// D: Schritt-Diagramm wie „How Houses Are Made“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  text(x, [['WIE WASSER', '#111']], 640, 170, 112, 'center');
  text(x, [['DURCHS HAUS', RED]], 640, 305, 118, 'center');
  text(x, [['FLIESST', '#111']], 640, 440, 112, 'center');
  const steps = [['1. WASSERWERK', 'works', 125, 150], ['2. ZÄHLER', 'meter', 125, 385], ['3. HAUPTHAHN', 'valve', 125, 620],
    ['4. WARMWASSER', 'tank', 470, 620], ['5. BAD', 'wc', 810, 620], ['6. SIPHON', 'siphon', 1155, 385], ['7. KANAL', 'sewer', 1155, 150]];
  steps.forEach(([label, kind, sx, sy]) => {
    x.fillStyle = '#111'; x.beginPath(); x.roundRect(sx - 62, sy - 52, 124, 124, 26); x.fill();
    const r = { works: 44, meter: 44, valve: 40, tank: 34, wc: 40, siphon: 38, sewer: 44 }[kind];
    station(x, T, kind, sx + (kind === 'siphon' ? -10 : 0), sy + 10, r, 'oo', { hot: 0.5, level: 0.8, spin: 0.3 });
    text(x, [[label, '#111']], sx, sy - 66, 23, 'center');
  });
  const A = (p) => arrow(x, p, RED, 9, 22);
  A([[125, 225], [118, 255], [125, 285]]); A([[125, 460], [118, 490], [125, 520]]);
  A([[195, 630], [260, 622], [398, 630]]); A([[540, 630], [620, 622], [738, 630]]);
  A([[880, 610], [1080, 560], [1130, 470]]); A([[1155, 320], [1170, 285], [1155, 245]]);
  drop(x, T, 1010, 480, 40, '^^');
  await save(c, 'thumbnail_D.png');
}

// E: Person + Objekt + Pfeil wie „Peptides“ – „Wo ist dein Haupthahn?“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(900, 300, 50, 700, 360, 900); g.addColorStop(0, '#22303a'); g.addColorStop(1, '#0a0d10');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  drawPerson(x, 990, 300, 800);
  text(x, [['WO IST DEIN', C.W]], 60, 150, 100);
  text(x, [['HAUPTHAHN?', C.WA]], 60, 270, 112);
  station(x, T, 'valve', 300, 520, 140, '><', { spin: 0.3 });
  drop(x, T, 520, 600, 60, 'oo');
  arrow(x, [[600, 300], [640, 420], [470, 470]], C.W, 10, 30);
  await save(c, 'thumbnail_E.png');
}

// F: Person vor leuchtenden Glas-Karten mit Video-Frames + 3D-Button wie „Motion Design“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(640, 330, 30, 640, 360, 760); g.addColorStop(0, '#39a8ff'); g.addColorStop(0.35, '#0b2f55'); g.addColorStop(1, '#04070b');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const cards = [[ch(2) + 20, 40, 45, -0.05], [ch(4) + 12, 40, 300, 0.03], [ch(5) + 20, 880, 45, 0.05], [ch(7) + 14, 880, 300, -0.03]];
  for (const [t, cx0, cy0, rot] of cards) {
    const img = await frameAt(t.toFixed(2)), w = 360, h = 203;
    x.save(); x.translate(cx0 + w / 2, cy0 + h / 2); x.rotate(rot);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 30; x.fillStyle = '#000'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.fill(); x.shadowBlur = 0;
    x.save(); x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.clip(); x.drawImage(img, -w / 2, -h / 2, w, h); x.restore();
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 5; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.stroke(); x.restore();
  }
  drawPerson(x, 640, 270, 700);
  const bx = 240, by = 520, bw = 800, bh = 150;
  x.save(); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 40; x.shadowOffsetY = 12;
  const pg = x.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#d9d9de');
  x.fillStyle = pg; x.beginPath(); x.roundRect(bx, by, bw, bh, bh / 2); x.fill(); x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.roundRect(bx + 4, by + 4, bw - 8, bh - 8, bh / 2); x.stroke();
  x.fillStyle = '#111'; x.beginPath(); x.roundRect(bx + 22, by + 20, 110, 110, 26); x.fill();
  drop(x, T, bx + 77, by + 88, 30, '^^');
  x.font = '800 100px InterXB'; x.letterSpacing = '-3px'; x.fillStyle = '#111'; x.fillText('Wasser', bx + 160, by + 110);
  const sw = x.measureText('Wasser ').width, tg = x.createLinearGradient(0, by + 20, 0, by + 120); tg.addColorStop(0, '#39a8ff'); tg.addColorStop(1, '#006aff');
  x.fillStyle = tg; x.fillText('erklärt', bx + 160 + sw, by + 110); x.letterSpacing = '0px';
  await save(c, 'thumbnail_F.png');
}
