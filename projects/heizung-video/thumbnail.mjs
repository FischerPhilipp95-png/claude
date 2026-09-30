// Thumbnails für das Heizkörper-Video, 1280x720, im Stil der Referenz-Thumbnails (wie beim Strom-Video D/E/F),
// mit denselben Figuren wie im Video.  node projects/wasser-video/thumbnail.mjs
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bubble, station, C, BEAT_TIMES, PHOTOS } from './render.mjs';

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
  const f = path.join(os.tmpdir(), `heizung_thumb_${t}.png`);
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', path.join(DIR, 'out/final.mp4'), '-frames:v', '1', f]);
  return loadImage(f);
}
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }
const timeline = JSON.parse(fs.readFileSync(path.join(DIR, 'timeline.json'), 'utf8'));
const ch = (n) => timeline.chapters.find((c) => c.ch === n).start;

for (const [k, f] of [['key', 'Entl_ftungsschl_ssel_01.jpg']]) PHOTOS[k] = await loadImage(path.join(DIR, 'photos', f)); // CC0

// D: Schritt-Diagramm wie „How Houses Are Made“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  text(x, [['HEIZKÖRPER', '#111']], 640, 170, 112, 'center');
  text(x, [['ENTLÜFTEN', RED]], 640, 305, 124, 'center');
  text(x, [['IN 7 SCHRITTEN', '#111']], 640, 440, 86, 'center');
  const steps = [['1. THERMOSTAT AUF', 'thermo', 125, 150, { level: 5 }], ['2. HEIZUNG AUS', 'boiler', 125, 385, { on: 0 }], ['3. WARTEN', 'clock', 125, 620, {}],
    ['4. VENTIL AUF', 'key', 470, 620, {}], ['5. BEI WASSER ZU', 'cup', 810, 620, {}], ['6. DRUCK PRÜFEN', 'mano', 1155, 385, { needle: 0.5 }], ['7. HEIZUNG AN', 'radiator', 1155, 150, { cold: 0 }]];
  steps.forEach(([label, kind, sx, sy, o]) => {
    x.fillStyle = '#111'; x.beginPath(); x.roundRect(sx - 62, sy - 52, 124, 124, 26); x.fill();
    const r = { thermo: 44, boiler: 40, clock: 42, key: 40, cup: 44, mano: 46, radiator: 34 }[kind];
    station(x, T, kind, sx, sy + 10, r, 'oo', o);
    text(x, [[label, '#111']], sx, sy - 66, 21, 'center');
  });
  const A = (p) => arrow(x, p, RED, 9, 22);
  A([[125, 225], [118, 255], [125, 285]]); A([[125, 460], [118, 490], [125, 520]]);
  A([[195, 630], [260, 622], [398, 630]]); A([[540, 630], [620, 622], [738, 630]]);
  A([[880, 610], [1080, 560], [1130, 470]]); A([[1155, 320], [1170, 285], [1155, 245]]);
  bubble(x, T, 1010, 480, 40, '><');
  await save(c, 'thumbnail_D.png');
}

// E: Person + Objekt + Pfeil wie „Peptides“ – „Gluckert's? So geht's!“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(900, 300, 50, 700, 360, 900); g.addColorStop(0, '#3a2418'); g.addColorStop(1, '#0d0a08');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  drawPerson(x, 1000, 300, 800);
  text(x, [['GLUCKERT’S?', C.W]], 50, 150, 112);
  text(x, [['SO GEHT’S!', C.O]], 50, 270, 112);
  station(x, T, 'radiator', 270, 560, 140, '><', { cold: 0.45 });
  bubble(x, T, 330, 450, 55, '><');
  const img = PHOTOS.key; x.save(); x.translate(590, 470); x.rotate(0.08); const w = 230, h = w * img.height / img.width;
  x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 30; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 16); x.clip(); x.drawImage(img, -w / 2, -h / 2, w, h); x.restore();
  x.save(); x.translate(590, 470); x.rotate(0.08); x.strokeStyle = C.W; x.lineWidth = 5; x.beginPath(); x.roundRect(-115, -h / 2, 230, h, 16); x.stroke(); x.restore();
  arrow(x, [[520, 310], [500, 360], [440, 400]], C.W, 9, 26);
  await save(c, 'thumbnail_E.png');
}

// F: Person vor leuchtenden Glas-Karten mit Video-Frames + 3D-Button wie „Motion Design“
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(640, 330, 30, 640, 360, 760); g.addColorStop(0, '#ff741c'); g.addColorStop(0.35, '#5a2208'); g.addColorStop(1, '#0b0705');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const L = (n, i) => timeline.vo.find((v) => v.id === `c${n}_${i}`);
  const cards = [[L(1, 2).t + 2.5, 40, 45, -0.05], [L(3, 2).t + 2, 40, 300, 0.03], [L(4, 3).t + 0.6, 880, 45, 0.05], [L(6, 1).t + 3, 880, 300, -0.03]];
  for (const [t, cx0, cy0, rot] of cards) {
    const img = await frameAt(t.toFixed(2)), w = 360, h = 203;
    x.save(); x.translate(cx0 + w / 2, cy0 + h / 2); x.rotate(rot);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 30; x.fillStyle = '#000'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.fill(); x.shadowBlur = 0;
    x.save(); x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.clip(); x.drawImage(img, -w / 2, -h / 2, w, h); x.restore();
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 5; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 18); x.stroke(); x.restore();
  }
  drawPerson(x, 640, 270, 700);
  const bx = 200, by = 520, bw = 880, bh = 150;
  x.save(); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 40; x.shadowOffsetY = 12;
  const pg = x.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#d9d9de');
  x.fillStyle = pg; x.beginPath(); x.roundRect(bx, by, bw, bh, bh / 2); x.fill(); x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.roundRect(bx + 4, by + 4, bw - 8, bh - 8, bh / 2); x.stroke();
  x.fillStyle = '#111'; x.beginPath(); x.roundRect(bx + 22, by + 20, 110, 110, 26); x.fill();
  bubble(x, T, bx + 77, by + 75, 34, '><');
  x.font = '800 92px InterXB'; x.letterSpacing = '-3px'; x.fillStyle = '#111'; x.fillText('Heizung', bx + 160, by + 108);
  const sw = x.measureText('Heizung ').width, tg = x.createLinearGradient(0, by + 20, 0, by + 120); tg.addColorStop(0, '#ff7a3d'); tg.addColorStop(1, '#e8201c');
  x.fillStyle = tg; x.fillText('entlüften', bx + 160 + sw, by + 108); x.letterSpacing = '0px';
  await save(c, 'thumbnail_F.png');
}
