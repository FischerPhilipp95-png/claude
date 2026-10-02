// Drei Thumbnails G/H/I im Kanal-Standard (echtes Foto, riesige Schrift, Kreis, Pill, Kanal-Person), 1280x720.
// node projects/klima-probleme/thumbnail_real.mjs
// G „ZU LAUT?“: Außengeräte an der Fassade, Schallwellen (CC BY 2.0, Shixart1985, Nennung in der Beschreibung)
// H „KÜHLT NICHT?“: Außengerät im Garten mit Wärmebild-Look (CC BY 2.0, Shixart1985)
// I „DARF ICH DAS?“: Fassade gespiegelt, BGH-Urteil als Pill (CC BY 2.0, Shixart1985)
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Inter-800.ttf'), 'InterXB');
const W = 1280, H = 720, WHITE = '#ffffff', RED = '#e8201c', YEL = '#ffd400', BLUE = '#39a8ff';
const person = await loadImage(path.join(ROOT, 'assets/channel_person_cutout.png'));
const photo = (f) => loadImage(path.join(DIR, 'photos', f));

// Text mit dicker schwarzer Kontur, damit er auf Fotos lesbar bleibt
function text(x, parts, px, py, size, align = 'left', stroke = size * 0.16) {
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.03}px`; x.lineJoin = 'round';
  const total = parts.reduce((a, [s]) => a + x.measureText(s).width, 0);
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  for (const [s, col] of parts) {
    if (stroke) { x.strokeStyle = '#000'; x.lineWidth = stroke; x.strokeText(s, cx, py); }
    x.fillStyle = col; x.fillText(s, cx, py); cx += x.measureText(s).width;
  }
  x.letterSpacing = '0px';
  return total;
}
function arrow(x, [[ax, ay], [cx, cy], [bx, by]], col, w, head = 30) {
  const draw = (c, lw) => {
    x.strokeStyle = c; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke();
    const ang = Math.atan2(by - cy, bx - cx);
    x.beginPath(); x.moveTo(bx - head * Math.cos(ang - 0.5), by - head * Math.sin(ang - 0.5)); x.lineTo(bx, by); x.lineTo(bx - head * Math.cos(ang + 0.5), by - head * Math.sin(ang + 0.5)); x.stroke();
  };
  draw('#000', w + 8); draw(col, w);
}
function ring(x, cx, cy, rx, ry, col = RED, w = 12) {
  for (const [c, lw] of [['#000', w + 8], [col, w]]) {
    x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.ellipse(cx, cy, rx, ry, -0.12, 0.2, Math.PI * 2 + 0.05); x.stroke();
  }
}
function pill(x, label, cx, cy, size, bg, fg = '#fff', rot = 0) {
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.font = `800 ${size}px InterXB`; x.letterSpacing = `${-size * 0.02}px`;
  const w = x.measureText(label).width + size * 0.9, h = size * 1.45;
  x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 24; x.shadowOffsetY = 6;
  x.fillStyle = bg; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * 0.28); x.fill(); x.shadowColor = 'transparent';
  x.strokeStyle = '#000'; x.lineWidth = 5; x.stroke();
  x.fillStyle = fg; x.textAlign = 'center'; x.fillText(label, 0, size * 0.36); x.textAlign = 'left'; x.letterSpacing = '0px';
  x.restore();
}
function drawPerson(x, cx, faceY, h) {
  x.save(); x.shadowColor = 'rgba(0,0,0,0.7)'; x.shadowBlur = 50; x.drawImage(person, cx - h / 2, faceY - h * 0.4, h, h); x.restore();
}
// Foto „cover“ in ein Rechteck, Fokuspunkt (fx, fy) in 0..1, optional gespiegelt und gezoomt
function cover(x, img, rx, ry, rw, rh, fx = 0.5, fy = 0.5, zoom = 1, mirror = false) {
  const s = Math.max(rw / img.width, rh / img.height) * zoom, w = img.width * s, h = img.height * s;
  const dx = rx + Math.min(0, Math.max(rw - w, rw / 2 - fx * w)), dy = ry + Math.min(0, Math.max(rh - h, rh / 2 - fy * h));
  x.save(); x.beginPath(); x.rect(rx, ry, rw, rh); x.clip();
  if (mirror) { x.translate(rx * 2 + rw, 0); x.scale(-1, 1); }
  x.drawImage(img, dx, dy, w, h); x.restore();
}
function vignette(x, strength = 0.55) {
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
// Schallwellen: Bögen mit schwarzer Kontur, die vom Gerät weglaufen
function waves(x, cx, cy, dir, col, n = 3) {
  for (let i = 0; i < n; i++) {
    const r = 70 + i * 55;
    for (const [c, lw] of [['#000', 18], [col, 10]]) {
      x.strokeStyle = c; x.lineWidth = lw; x.lineCap = 'round';
      x.beginPath(); x.arc(cx, cy, r, dir - 0.55, dir + 0.55); x.stroke();
    }
  }
}
async function save(c, name) { const f = path.join(DIR, 'out', name); fs.writeFileSync(f, await c.encode('png')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB'); }
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const fassade = await photo('fassade_klimageraete.jpg'), garten = await photo('aussengeraet_garten.jpg');

// G: „ZU LAUT?“ – Außengeräte an der Fassade, Schallwellen, roter Kreis
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, fassade, 0, 0, W, H, 0.5, 0.42);
  const lg = x.createLinearGradient(0, 0, 760, 0); lg.addColorStop(0, 'rgba(0,0,0,0.88)'); lg.addColorStop(0.6, 'rgba(0,0,0,0.5)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  vignette(x, 0.5);
  const ux = 885, uy = 775 - 448;                                  // Außengerät rechts oben im Bildausschnitt
  waves(x, ux + 110, uy - 20, -0.15, YEL);
  ring(x, ux, uy, 175, 135, RED, 14);
  drawPerson(x, 1120, 560, 430);
  text(x, [['ZU', WHITE]], 44, 190, 170);
  text(x, [['LAUT?', RED]], 44, 360, 170);
  pill(x, 'NACHTS NUR 40 dB(A)', 330, 520, 50, YEL, '#000', -0.03);
  text(x, [['AM NACHBARFENSTER', WHITE]], 46, 650, 52);
  await save(c, 'thumbnail_G.png');
}

// H: „KÜHLT NICHT?“ – Außengerät im Garten, Wärmebild-Look (heiß), gelber Kreis um die Lamellen
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, garten, 0, 0, W, H, 0.6, 0.36, 1.0, true);
  const tg = x.createLinearGradient(0, 0, W, H);
  tg.addColorStop(0, '#1b3cff'); tg.addColorStop(0.35, '#20b6ff'); tg.addColorStop(0.55, '#ffd000'); tg.addColorStop(0.75, '#ff5a00'); tg.addColorStop(1, '#e0001b');
  x.globalCompositeOperation = 'color'; x.fillStyle = tg; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.5; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  const lg = x.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, 'rgba(0,0,0,0.8)'); lg.addColorStop(0.35, 'rgba(0,0,0,0.1)'); lg.addColorStop(0.7, 'rgba(0,0,0,0.1)'); lg.addColorStop(1, 'rgba(0,0,0,0.85)');
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  vignette(x, 0.45);
  drawPerson(x, 1110, 360, 560);
  text(x, [['KÜHLT ', WHITE], ['NICHT?', BLUE]], 36, 130, 124);
  ring(x, 440, 500, 190, 130, YEL, 14);
  arrow(x, [[110, 330], [100, 470], [230, 500]], WHITE, 12, 32);
  pill(x, '60–100 W PRO m²', 640, 650, 54, RED, '#fff', -0.03);
  await save(c, 'thumbnail_H.png');
}

// I: „DARF ICH DAS?“ – Fassade gespiegelt, Gerät eingekreist, BGH-Pill
{
  const c = createCanvas(W, H), x = c.getContext('2d');
  cover(x, fassade, 0, 0, W, H, 0.5, 0.3, 1.0, true);
  const lg = x.createLinearGradient(W, 0, W - 760, 0); lg.addColorStop(0, 'rgba(0,0,0,0.88)'); lg.addColorStop(0.6, 'rgba(0,0,0,0.5)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  vignette(x, 0.5);
  const dy = 360 - 0.3 * 1924;
  // gespiegelter Herstellerschriftzug wäre lesbar verkehrt herum: weichzeichnen
  x.save(); x.beginPath(); x.rect(W - 1010, 690 + dy, 110, 70); x.clip(); x.filter = 'blur(7px)'; cover(x, fassade, 0, 0, W, H, 0.5, 0.3, 1.0, true); x.restore();
  ring(x, W - 885, 775 + dy, 170, 130, YEL, 14);
  drawPerson(x, 170, 560, 420);
  text(x, [['DARF ICH', WHITE]], W - 40, 170, 118, 'right');
  text(x, [['DAS?', YEL]], W - 40, 330, 170, 'right');
  arrow(x, [[W - 520, 270], [W - 680, 250], [W - 700, 470]], WHITE, 12, 32);
  pill(x, 'NEUES BGH-URTEIL', W - 300, 470, 50, RED, '#fff', -0.03);
  pill(x, '§ 20 WEG', W - 230, 600, 50, WHITE, '#000', 0.03);
  await save(c, 'thumbnail_I.png');
}
