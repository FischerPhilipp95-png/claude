// Börsenstrompreise (Day-Ahead, Gebotszone DE-LU) von SMARD.de (Bundesnetzagentur, CC BY 4.0) über die API von energy-charts.info
// zu Stundenprofilen verdichten: src/strompreise.json. Daraus speisen sich die Strompreis-Uhr und die Tarif-Rechner.
//   node scripts/strompreise.mjs            (letztes abgeschlossenes Jahr, laufendes Jahr und heute/morgen neu laden)
// Läuft im Upload-Workflow vor jedem Build (websites/workflow-vorlage.yml), auch um 12:25 UTC, wenn die Preise für morgen da sind.
import { writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url).pathname;
const heute = new Date();
const jahr = heute.getUTCFullYear();
const tz = 'Europe/Berlin';
const fmt = new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: 'numeric', month: 'numeric', weekday: 'short', hourCycle: 'h23' });
const datum = (t) => new Date(t * 1000).toLocaleDateString('sv-SE', { timeZone: tz }); // JJJJ-MM-TT in deutscher Zeit

async function laden(von, bis) {
  const url = `https://api.energy-charts.info/price?bzn=DE-LU&start=${von}&end=${bis}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  const d = await r.json();
  return d.unix_seconds.map((t, i) => [t, d.price[i]]).filter(([, p]) => p !== null);
}
const mittel = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const r2 = (x) => Math.round(x * 100) / 100;

function profil(rows) {
  // Alle Werte in ct/kWh (EUR/MWh ÷ 10). Stundenmittel über Jahr, Sommer (Apr–Sep) und Winter (Okt–Mär).
  const h = { alle: Array.from({ length: 24 }, () => []), sommer: Array.from({ length: 24 }, () => []), winter: Array.from({ length: 24 }, () => []) };
  const monate = {};
  const tage = {};
  let neg = 0;
  for (const [t, p] of rows) {
    const teile = Object.fromEntries(fmt.formatToParts(new Date(t * 1000)).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
    const st = +teile.hour, mo = +teile.month;
    const ct = p / 10;
    h.alle[st].push(ct);
    (mo >= 4 && mo <= 9 ? h.sommer : h.winter)[st].push(ct);
    (monate[mo] ??= []).push(ct);
    const tag = datum(t);
    (tage[tag] ??= []).push(ct);
    if (p < 0) neg++;
  }
  const alle = rows.map(([, p]) => p / 10);
  return {
    mittel: r2(mittel(alle)),
    min: r2(Math.min(...alle)),
    max: r2(Math.max(...alle)),
    negativAnteil: r2((100 * neg) / rows.length),
    ueber15Anteil: r2((100 * alle.filter((x) => x > 15).length) / alle.length),
    unter2Anteil: r2((100 * alle.filter((x) => x < 2).length) / alle.length),
    tagesspreizung: r2(mittel(Object.values(tage).map((x) => Math.max(...x) - Math.min(...x)))),
    stunden: { alle: h.alle.map((x) => r2(mittel(x))), sommer: h.sommer.map((x) => r2(mittel(x))), winter: h.winter.map((x) => r2(mittel(x))) },
    monate: Object.fromEntries(Object.entries(monate).map(([m, x]) => [m, r2(mittel(x))])),
    von: datum(rows[0][0]),
    bis: datum(rows[rows.length - 1][0]),
    werte: rows.length,
  };
}

// Tagesdaten für die Seite „Strompreis heute und morgen“: alle Viertelstunden von heute und, sobald die Börse sie veröffentlicht
// hat (werktags gegen 13 Uhr), von morgen. Zeiten in deutscher Zeit.
const heuteDe = heute.toLocaleDateString('sv-SE', { timeZone: tz });
const morgenDe = new Date(heute.getTime() + 86400e3).toLocaleDateString('sv-SE', { timeZone: tz });
const tagRows = await laden(heuteDe, morgenDe);
const tage = {};
for (const [t, p] of tagRows) {
  const d = datum(t);
  const uhr = new Date(t * 1000).toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  (tage[d] ??= []).push([uhr, r2(p / 10)]);
}
const tag = {
  _hinweis: 'Erzeugt von scripts/strompreise.mjs. Day-Ahead-Preise (DE-LU) je Viertelstunde in ct/kWh netto, Quelle: Bundesnetzagentur | SMARD.de (CC BY 4.0) über api.energy-charts.info.',
  stand: heute.toISOString(),
  tage: Object.entries(tage).filter(([, v]) => v.length >= 90).map(([datum, werte]) => ({ datum, werte })),
};
await writeFile(ROOT + 'src/strompreis-tag.json', JSON.stringify(tag) + '\n');
console.log(`geschrieben: src/strompreis-tag.json (${tag.tage.map((t) => t.datum).join(', ')})`);

const vorjahr = await laden(`${jahr - 1}-01-01`, `${jahr - 1}-12-31`);
const laufend = await laden(`${jahr}-01-01`, heute.toISOString().slice(0, 10));
const out = {
  _hinweis: 'Erzeugt von scripts/strompreise.mjs. Day-Ahead-Preise (DE-LU) in ct/kWh netto, ohne Netzentgelte, Steuern und Umlagen. Quelle: Bundesnetzagentur | SMARD.de (CC BY 4.0), abgerufen über api.energy-charts.info.',
  stand: heute.toISOString().slice(0, 10),
  [jahr - 1]: profil(vorjahr),
  [jahr]: profil(laufend),
};
await writeFile(ROOT + 'src/strompreise.json', JSON.stringify(out, null, 1) + '\n');
console.log(`geschrieben: src/strompreise.json (${jahr - 1}: ${vorjahr.length} Werte, ${jahr}: ${laufend.length} Werte)`);
