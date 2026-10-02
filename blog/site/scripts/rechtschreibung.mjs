// Rechtschreib- und Grammatikprüfung aller Artikel mit LanguageTool (Open Source, languagetool.org).
// Geschickt wird nur der Artikeltext, der ohnehin öffentlich auf der Website steht.
//
//   npm run rechtschreibung                         alle Artikel
//   npm run rechtschreibung -- ab-wann-heizen ...   nur diese Artikel (Dateiname ohne .mdx)
//
// Fachwörter, Marken und Produktnamen, die LanguageTool nicht kennt, stehen in scripts/woerterbuch.txt.
// Die kostenlose Schnittstelle erlaubt etwa 20 Anfragen und 75 KB pro Minute, das Skript wartet entsprechend.
// Ergebnis: Liste der Funde. Exit-Code 1, wenn etwas gefunden wurde (außer mit --nur-bericht).
import { readFileSync, readdirSync, appendFileSync } from 'node:fs';

const ORDNER = new URL('../src/content/artikel/', import.meta.url);
const API = process.env.LANGUAGETOOL_API || 'https://api.languagetool.org/v2/check';
const args = process.argv.slice(2);
const nurBericht = args.includes('--nur-bericht');
const auswahl = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/\.mdx$/, '').replace(/^.*\//, ''));

// Regeln, die bei uns nur Fehlalarme liefern (Stil, Typografie, bewusst gewählte Schreibweisen).
const AUS = [
  'WHITESPACE_RULE', 'DE_DOUBLE_PUNCTUATION', 'TYPOGRAFISCHE_ANFUEHRUNGSZEICHEN', 'EINHEIT_LEERZEICHEN',
  'GERMAN_WORD_REPEAT_BEGINNING_RULE', 'DE_SENTENCE_WHITESPACE', 'LEERZEICHEN_HINTER_DOPPELPUNKT',
  'PUNCTUATION_PARAGRAPH_END', 'UNPAIRED_BRACKETS', 'DE_UNPAIRED_QUOTES', 'BISSTRICH', 'DOPPELTE_SATZZEICHEN',
  'ZEICHENSETZUNG_DOPPELPUNKT', 'F_ANSTATT_PF', 'DE_COMPOUND_COHERENCY', 'GERMAN_SPELLER_RULE_HYPHEN',
  'SENTENCE_WHITESPACE', 'EMPFOHLENE_ZUSAMMENSCHREIBUNG', 'MIO_ABKUERZUNG', 'ABKUERZUNG_LEERZEICHEN',
  'UPPERCASE_SENTENCE_START', 'ZAHL_IM_WORT_SPELLING_RULE', 'DE_CASE',
  // Fehlalarme bei Überschriften, Tabellenzellen und Aufzählungen ohne Verb:
  'SENT_START_SIN_PLU', 'FRAGEZEICHEN_STATT_PUNKT', 'DOPPELPUNKT_GROSS', 'FEHLERHAFTES_KOMMA_ALLG', 'SUBJUNKTION_KOMMA_2', 'AUFFORDERUNG_SIE',
];
// Ganze Kategorien ohne Nutzen für uns: Stilvorschläge (Wortwiederholungen, Synonyme) und Typografie.
const AUS_KATEGORIEN = ['STYLE', 'TYPOGRAPHY', 'REPETITIONS_STYLE', 'REDUNDANCY', 'COLLOQUIALISMS'];
const woerter = new Set(
  readFileSync(new URL('./woerterbuch.txt', import.meta.url), 'utf8')
    .split('\n').map((z) => z.trim()).filter((z) => z && !z.startsWith('#')).map((z) => z.toLowerCase()),
);

// Ganze Fundstellen, die LanguageTool fälschlich als Grammatikfehler meldet (Zeilen mit „= “ in woerterbuch.txt).
const ausnahmen = new Set(
  readFileSync(new URL('./woerterbuch.txt', import.meta.url), 'utf8')
    .split('\n').filter((z) => z.startsWith('= ')).map((z) => z.slice(2).trim().toLowerCase()),
);

/** Macht aus einer MDX-Datei reinen Fließtext, Absatz für Absatz. */
function text(mdx) {
  const teile = mdx.split(/^---$/m);
  const kopf = teile[1] ?? '';
  let rumpf = teile.slice(2).join('---');
  const absaetze = [];
  for (const feld of ['title', 'description']) {
    const m = kopf.match(new RegExp(`^${feld}: "(.*)"$`, 'm'));
    if (m) absaetze.push(m[1].endsWith('.') || m[1].endsWith('?') ? m[1] : `${m[1]}.`);
  }
  rumpf = rumpf.replace(/^import .*$/gm, '').replace(/^## Quellen[\s\S]*$/m, '');
  // Texte aus Komponenten-Attributen (Schnellkauf, Ablauf, Balken, ProduktBox …) einzeln prüfen.
  for (const m of rumpf.matchAll(/(?:titel|text|warum|untertitel|label|notiz|name|quelle)[=:]\s*["'`]([^"'`]{12,})["'`]/g)) absaetze.push(m[1]);
  for (const m of rumpf.matchAll(/^\s+'([^']{20,})',?$/gm)) absaetze.push(m[1]);
  // Komponenten entfernen, Inhalt zwischen öffnendem und schließendem Tag (Antwort, Warnung) bleibt.
  rumpf = rumpf.replace(/<[A-Z][A-Za-z]*\b[^>]*?\/>/gs, '\n').replace(/<\/?[A-Z][A-Za-z]*\b[^>]*>/gs, '\n');
  rumpf = rumpf
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/^#{1,6}\s+(.*)$/gm, '$1.')
    .replace(/^\|?\s*-{3,}.*$/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');
  // Tabellenzeilen: jede Zelle ein eigener Satz.
  rumpf = rumpf.replace(/^\|(.*)\|\s*$/gm, (_, z) => z.split('|').map((c) => c.trim()).filter(Boolean).join('.\n') + '.');
  for (const a of rumpf.split(/\n\s*\n/)) {
    const s = a.replace(/\s*\n\s*/g, ' ').trim();
    if (s.length > 1) absaetze.push(s);
  }
  return absaetze.join('\n\n');
}

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
let letzte = 0;

async function pruefe(abschnitt) {
  const bytes = Buffer.byteLength(abschnitt);
  const pause = Math.max(3200, (bytes / 70000) * 60000);
  const warten = letzte + pause - Date.now();
  if (warten > 0) await warte(warten);
  letzte = Date.now();
  const body = new URLSearchParams({ text: abschnitt, language: 'de-DE', disabledRules: AUS.join(','), disabledCategories: AUS_KATEGORIEN.join(','), level: 'default' });
  for (let versuch = 1; versuch <= 4; versuch++) {
    const res = await fetch(API, { method: 'POST', body });
    if (res.status === 429 || res.status >= 500) { await warte(15000 * versuch); continue; }
    if (!res.ok) throw new Error(`LanguageTool antwortet mit ${res.status}`);
    return (await res.json()).matches;
  }
  throw new Error('LanguageTool nicht erreichbar (zu viele Anfragen?)');
}

/** Teilt langen Text an Absatzgrenzen in Stücke unter 18 KB (Grenze der Schnittstelle: 20 KB). */
function stuecke(t) {
  const out = [];
  let akt = '';
  for (const a of t.split('\n\n')) {
    if (Buffer.byteLength(akt + a) > 18000 && akt) { out.push(akt); akt = ''; }
    akt += (akt ? '\n\n' : '') + a;
  }
  if (akt) out.push(akt);
  return out;
}

const dateien = readdirSync(ORDNER).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, -4))
  .filter((f) => auswahl.length === 0 || auswahl.includes(f)).sort();
let funde = 0;
const bericht = [];
for (const name of dateien) {
  const t = text(readFileSync(new URL(`${name}.mdx`, ORDNER), 'utf8'));
  for (const s of stuecke(t)) {
    for (const m of await pruefe(s)) {
      const wort = s.slice(m.offset, m.offset + m.length).replace(/[.,;:!?]+$/, '');
      if (m.rule.issueType === 'misspelling' && (woerter.has(wort.toLowerCase()) || /\d/.test(wort) || /-$/.test(wort))) continue;
      if (ausnahmen.has(wort.toLowerCase())) continue;
      const kontext = s.slice(Math.max(0, m.offset - 40), m.offset + m.length + 40).replace(/\s+/g, ' ');
      const vorschlag = m.replacements.slice(0, 3).map((r) => r.value).join(' / ');
      const zeile = `${name}: „${wort}“ – ${m.message}${vorschlag ? ` (Vorschlag: ${vorschlag})` : ''}\n    … ${kontext} …  [${m.rule.id}]`;
      console.log(zeile);
      bericht.push(zeile);
      funde++;
    }
  }
}
console.log(`\n${dateien.length} Artikel geprüft, ${funde} mögliche Fehler.`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Rechtschreibung (LanguageTool)\n\n${dateien.length} Artikel geprüft, ${funde} mögliche Fehler.\n\n${bericht.length ? '```\n' + bericht.join('\n') + '\n```\n' : ''}`);
}
if (funde && !nurBericht) process.exitCode = 1;
