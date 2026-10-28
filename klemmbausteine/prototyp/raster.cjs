// Übersetzt die Bildanalyse (Meter, relative Positionen) exakt ins Noppenraster. 1 Noppe = 0,6 m, Geschoss = 4 Steine.
const fs = require('node:fs');
const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NOPPE_M = 0.6, FLOOR_H = 4;
const even = v => Math.max(8, Math.round(v / 2) * 2);
const W = even(a.breite_m / NOPPE_M), D = even(a.tiefe_m / NOPPE_M);
const openings = [];
function place(side, len, items, kind) {
  const used = [];
  for (const it of items) {
    const w = Math.max(2, Math.round((it.breite_m || 1.2) / NOPPE_M / 2) * 2); // Fenster/Türen sind 2 oder 4 Noppen breit
    let pos = Math.round(it.pos * len - w / 2); pos = Math.min(len - 1 - w, Math.max(1, pos)); // nie in der Ecke
    const y = kind === 'door' ? 0 : (it.geschoss - 1) * FLOOR_H + 1, h = kind === 'door' ? 3 : 2;
    while (used.some(u => u.y === y && pos < u.pos + u.w + 1 && pos + w + 1 > u.pos)) pos++; // mindestens eine Noppe Abstand
    if (pos + w > len - 1) continue;
    used.push({ pos, w, y }); openings.push({ side, pos, w, y, h, door: kind === 'door' || undefined });
  }
}
for (const side of ['front', 'back', 'left', 'right']) {
  const f = a.fassaden[side]; if (!f) continue; const len = side === 'front' || side === 'back' ? W : D;
  if (f.tuer) place(side, len, [{ ...f.tuer, geschoss: 1 }], 'door');
  place(side, len, f.fenster || [], 'window');
}
const spec = { W, D, floors: a.geschosse, floorH: FLOOR_H, wall: a.farben.wand, roof: a.farben.dach, door: a.farben.tuer, openings };
fs.writeFileSync(process.argv[3], JSON.stringify(spec, null, 1));
console.log(`Raster: ${W} x ${D} Noppen (${(W*NOPPE_M).toFixed(1)} x ${(D*NOPPE_M).toFixed(1)} m), ${a.geschosse} Geschosse, ${openings.length} Öffnungen`);
