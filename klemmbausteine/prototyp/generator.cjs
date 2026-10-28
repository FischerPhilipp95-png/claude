// Parametrisches Haus aus Klemmbausteinen. Einheiten: x/z in Noppen, y in Steinhöhen (1 Stein = 3 Platten).
// Ergebnis: Liste aller Teile mit Position, Größe, Farbe, BrickLink-Teilenummer und Schritt (Reihe).
const fs = require('node:fs');
const P = { W: 16, D: 12, floors: 2, floorH: 4, wall: 'tan', roof: 'dark red', door: 'reddish brown', base: 'green', out: 'model.json' };
for (let i = 2; i < process.argv.length; i += 2) { const k = process.argv[i].replace(/^--/, ''), v = process.argv[i + 1]; P[k] = isNaN(v) ? v : parseInt(v, 10); }
const COLORS = { tan: '#d9c48f', 'dark red': '#6b1f1f', 'reddish brown': '#5b3a1e', green: '#3c8f3c', white: '#f4f4f4', 'trans clear': '#cfe6f2', 'dark bluish gray': '#5b5f66', red: '#b40000', black: '#1f1f1f', 'light bluish gray': '#a0a5a9' };
const BL = { tan: 2, 'dark red': 59, 'reddish brown': 88, green: 6, white: 1, 'trans clear': 12, 'dark bluish gray': 85, red: 5, black: 11, 'light bluish gray': 86 };
const parts = []; let step = 0;
function add(part, name, color, x, y, z, w, h, d, kind) { parts.push({ part, name, color, x, y, z, w, h, d, kind: kind || 'brick', step }); }
// Grundplatte 32x32 (3811) unter dem Haus, Haus mittig
const BX = -8, BZ = -10; step = 1;
add('3811', 'Baseplate 32 x 32', 'green', BX, -0.4, BZ, 32, 0.4, 32, 'plate');
// Fenster- und Türöffnungen: {side: front|back|left|right, pos (Noppe entlang der Wand), w, y (Steinreihe), h}
const openings = [];
for (let f = 0; f < P.floors; f++) {
  const y0 = f * P.floorH + 1; // Fenster ab zweiter Reihe des Geschosses
  openings.push({ side: 'front', pos: 2, w: 2, y: y0, h: 2 }, { side: 'front', pos: P.W - 4, w: 2, y: y0, h: 2 });
  openings.push({ side: 'back', pos: 3, w: 2, y: y0, h: 2 }, { side: 'back', pos: P.W - 5, w: 2, y: y0, h: 2 });
  openings.push({ side: 'left', pos: 5, w: 2, y: y0, h: 2 }, { side: 'right', pos: 5, w: 2, y: y0, h: 2 });
}
openings.push({ side: 'front', pos: Math.floor(P.W / 2) - 1, w: 2, y: 0, h: 3, door: true }); // Tür 1x4x6 = 2 Noppen breit, 3 Steine hoch? (1x4x6: 4 Noppen breit, 6 Steine hoch). Vereinfachung: 2x3-Öffnung mit Tür 1x2x3 (3861/3860?) → wir nehmen Tür 1 x 2 x 3 (part 3861 + 3860 Rahmen)
// Wandzellen je Reihe als Ring
function isOpen(side, pos, row) { return openings.some(o => o.side === side && pos >= o.pos && pos < o.pos + o.w && row >= o.y && row < o.y + o.h); }
const H = P.floors * P.floorH;
const sizes = [6, 4, 3, 2, 1]; const partNo = { 1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009' };
function layRun(cells, row, color, place) { // cells: Array von {x,z,open}; legt Steine entlang, Verband je Reihe
  let i = 0; const offset = row % 2; // Verband
  while (i < cells.length) {
    if (cells[i].open) { i++; continue; }
    let len = 0; while (i + len < cells.length && !cells[i + len].open) len++;
    // Zerlegen in Steine, erster Stein je nach Reihe kürzer, damit Fugen versetzt sind
    let j = 0; let first = true;
    while (j < len) {
      let rest = len - j; let s = sizes.find(v => v <= rest);
      if (first && offset && rest > 2 && s >= 2) s = sizes.find(v => v <= s - 1);
      first = false;
      place(cells[i + j], s, color); j += s;
    }
    i += len;
  }
}
for (let row = 0; row < H; row++) {
  step = row + 2;
  // Vorderwand z = D-1 (x 0..W-1), Rückwand z = 0, linke Wand x = 0 (z 1..D-2), rechte Wand x = W-1. Ecken wechseln je Reihe.
  const cornerToX = row % 2 === 0; // gerade Reihen: Ecken gehören zu Vorder-/Rückwand
  const front = [], back = [], left = [], right = [];
  for (let x = 0; x < P.W; x++) { const corner = x === 0 || x === P.W - 1; if (corner && !cornerToX) continue; front.push({ x, z: P.D - 1, open: isOpen('front', x, row) }); back.push({ x, z: 0, open: isOpen('back', x, row) }); }
  for (let z = 0; z < P.D; z++) { const corner = z === 0 || z === P.D - 1; if (corner && cornerToX) continue; left.push({ x: 0, z, open: isOpen('left', z, row) }); right.push({ x: P.W - 1, z, open: isOpen('right', z, row) }); }
  layRun(front, row, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, row, c.z, s, 1, 1));
  layRun(back, row, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, row, c.z, s, 1, 1));
  layRun(left, row, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, row, c.z, 1, 1, s));
  layRun(right, row, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, row, c.z, 1, 1, s));
  // Fenster und Tür in der Startreihe der Öffnung einsetzen
  for (const o of openings) if (o.y === row) {
    const horiz = o.side === 'front' || o.side === 'back';
    const x = horiz ? o.pos : (o.side === 'left' ? 0 : P.W - 1), z = horiz ? (o.side === 'front' ? P.D - 1 : 0) : o.pos;
    if (o.door) { add('3860', 'Door Frame 1 x 2 x 3', 'white', x, row, z, horiz ? 2 : 1, 3, horiz ? 1 : 2, 'window'); add('3861', 'Door 1 x 2 x 3 with 6 Panes', P.door, x, row, z, horiz ? 2 : 1, 3, horiz ? 1 : 2, 'door'); }
    else { add('60592', 'Window 1 x 2 x 2 Flat Front', 'white', x, row, z, horiz ? 2 : 1, 2, horiz ? 1 : 2, 'window'); add('60601', 'Glass for Window 1 x 2 x 2', 'trans clear', x, row, z, horiz ? 2 : 1, 2, horiz ? 1 : 2, 'glass'); }
  }
}
// Dach: Giebel links/rechts aus Steinen, Dachhaut aus Schrägsteinen 45° (3040 1x2) vorne und hinten, First aus 3043 (2x2 Doppelschräge)
const roofRows = Math.floor(P.D / 2);
for (let r = 0; r < roofRows; r++) {
  const y = H + r; step = H + 2 + r;
  const z0 = r, z1 = P.D - 1 - r; // Dachhaut-Positionen dieser Reihe
  if (z1 - z0 >= 3) {
    for (let x = 0; x < P.W; x += 2) { add('3040', 'Slope 45 2 x 1', P.roof, x, y, z1, 2, 1, 1, 'slopeF'); add('3040', 'Slope 45 2 x 1', P.roof, x, y, z0, 2, 1, 1, 'slopeB'); }
    // Giebelwände dazwischen (x=0 und x=W-1), Innenstützen alle 4 Noppen
    const gl = [], gr = []; for (let z = z0 + 1; z <= z1 - 1; z++) { gl.push({ x: 0, z, open: false }); gr.push({ x: P.W - 1, z, open: false }); }
    layRun(gl, y, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, y, c.z, 1, 1, s));
    layRun(gr, y, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, y, c.z, 1, 1, s));
    for (let x = 4; x < P.W - 1; x += 4) { const cells = []; for (let z = z0 + 1; z <= z1 - 1; z++) cells.push({ x, z, open: false }); layRun(cells, y, P.wall, (c, s) => add(partNo[s], `Brick 1 x ${s}`, P.wall, c.x, y, c.z, 1, 1, s)); }
  } else {
    for (let x = 0; x < P.W; x += 2) add('3043', 'Slope 45 2 x 2 Double', P.roof, x, y, z0, 2, 1, 2, 'ridge');
    break;
  }
}
// Stückliste
const bom = {};
for (const p of parts) { const k = p.part + '|' + p.color; bom[k] = bom[k] || { part: p.part, name: p.name, color: p.color, blColor: BL[p.color], qty: 0 }; bom[k].qty++; }
const list = Object.values(bom).sort((a, b) => b.qty - a.qty);
const total = parts.length, steps = Math.max(...parts.map(p => p.step));
fs.writeFileSync(__dirname + '/' + P.out, JSON.stringify({ params: P, colors: COLORS, parts, bom: list, total, steps }, null, 1));
// BrickLink Wanted List (XML)
const xml = '<INVENTORY>\n' + list.map(b => `  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>${b.part}</ITEMID><COLOR>${b.blColor}</COLOR><MINQTY>${b.qty}</MINQTY></ITEM>`).join('\n') + '\n</INVENTORY>\n';
fs.writeFileSync(__dirname + '/' + P.out.replace('.json', '') + '-wanted-list.xml', xml);
console.log('Teile:', total, '| Schritte:', steps, '| Teilearten:', list.length);
for (const b of list) console.log(String(b.qty).padStart(4), b.part.padEnd(6), b.color.padEnd(14), b.name);
