// Zusätzliche Pinterest-Pins pro Artikel (Varianten 2 und 3) und wann sie erscheinen.
// Gemeinsam genutzt von scripts/pins.mjs (Bilder) und src/pages/pinterest/[feed].xml.js (Feeds),
// damit Bild und Pin-Text immer zusammenpassen. Alles wird aus dem Artikel selbst gelesen, nichts erfunden:
//   Variante 1  Titelbild-Pin (dunkel)                      /bilder/pins/<artikel>.jpg   sofort
//   Variante 2  erste Frage aus „Häufige Fragen“ (farbig)   /bilder/pins/<artikel>-2.jpg
//   Variante 3  Schritte (Ablauf), Checkliste oder Überblick (hell)   /bilder/pins/<artikel>-3.jpg
// Pinterest mag frische Bilder. Deshalb erscheinen die Varianten zeitversetzt im Feed: Variante 2 zwei Wochen nach dem
// Artikel, Variante 3 nach vier Wochen, je Artikel um bis zu 13 Tage gestreut, damit nicht alles am selben Tag kommt.
// Rechner bekommen einen eigenen Pin (/bilder/pins/rechner-<name>.jpg), gestreut über die erste Woche.

export const ABSTAND_TAGE = 14;
// Ab hier zählt der Zeitplan. Ältere Artikel starten so, als wären sie an diesem Tag erschienen.
const START = Date.UTC(2026, 9, 2);
const TAG = 86400000;

const streu = (id, tage) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % tage;
};

/** Ab wann eine Variante im Feed steht. */
export function freigabe(id, pubDate, nr) {
  if (nr === 1) return new Date(pubDate);
  const basis = Math.max(new Date(pubDate).valueOf(), START);
  return new Date(basis + ((nr - 1) * ABSTAND_TAGE + streu(id, ABSTAND_TAGE)) * TAG);
}

/** Ab wann der Pin eines Rechners im Feed steht. */
export const rechnerFreigabe = (name) => new Date(START + streu(name, 7) * TAG);

export const kuerzen = (s, max) => {
  if (s.length <= max) return s;
  const k = s.slice(0, max - 1);
  return k.slice(0, k.lastIndexOf(' ')).replace(/[,;:.–-]+$/, '') + ' …';
};

const sauber = (s) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|__/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/** Erste Frage mit Antwort aus „## Häufige Fragen“. */
function frage(body) {
  const teil = body.split(/^## Häufige Fragen\s*$/m)[1];
  if (!teil) return null;
  // Antwort bis zur nächsten Leerzeile oder Überschrift. Nicht „$“: Mit /m endet das schon nach der ersten Zeile.
  const m = teil.match(/^### (.+\?)[ \t]*\n([\s\S]*?)(?=\n[ \t]*\n|\n#|(?![\s\S]))/m);
  if (!m) return null;
  return { frage: sauber(m[1]), antwort: sauber(m[2]) };
}

/** Schritte aus <Ablauf>, sonst Punkte aus <Checkliste>, sonst die Zwischenüberschriften. */
function liste(body, kurztitel) {
  // Thema des Artikels ohne Zusatz: „Heizkörper entlüften: Anleitung in 7 Schritten“ → „Heizkörper entlüften“
  const thema = kurztitel.split(':')[0].replace(/\?$/, '').replace(/ in \d+ (Schritten|Minuten)$/, '').trim();
  const ablauf = body.match(/<Ablauf\s+titel="([^"]+)"\s+schritte=\{\[([\s\S]*?)\]\}/);
  if (ablauf) {
    const punkte = [...ablauf[2].matchAll(/titel: '((?:[^'\\]|\\.)+)', text: '((?:[^'\\]|\\.)+)'/g)]
      .map(([, titel, text]) => ({ titel: titel.replace(/\\'/g, "'"), text: text.replace(/\\'/g, "'") }));
    if (punkte.length >= 3) {
      const t = ablauf[1].replace(/\?$/, '');
      // Fängt der Titel schon mit dem Thema an („Fenster abdichten in 4 Schritten“), nicht doppelt davorsetzen.
      const erstesWort = thema.split(/[ -]/)[0].toLowerCase();
      const pinTitel = (t.toLowerCase().startsWith(erstesWort) ? t : `${thema}: ${t}`) + (/\d/.test(t) ? '' : ` (${punkte.length} Schritte)`);
      const kicker = t.toLowerCase().startsWith(erstesWort) ? 'Schritt für Schritt' : thema;
      return { art: 'schritte', kicker, ueberschrift: ablauf[1], pinTitel, punkte };
    }
  }
  const check = body.match(/<Checkliste[^>]*punkte=\{\[([\s\S]*?)\]\}/);
  if (check) {
    const punkte = [...check[1].matchAll(/'((?:[^'\\]|\\.)+)'/g)].map(([, t]) => ({ text: t.replace(/\\'/g, "'") }));
    if (punkte.length >= 3) return { art: 'checkliste', kicker: thema, ueberschrift: 'Checkliste zum Abhaken', pinTitel: `Checkliste: ${thema}`, punkte };
  }
  const h2 = [...body.matchAll(/^## (.+)$/gm)].map(([, t]) => sauber(t))
    .filter((t) => !/^(Häufige Fragen|Quellen|Checkliste|Fazit|Gleich mit erledigen)/.test(t));
  if (h2.length >= 3) {
    return { art: 'ueberblick', kicker: thema, ueberschrift: 'Das Wichtigste auf einen Blick', pinTitel: `${thema}: das Wichtigste auf einen Blick`, punkte: h2.map((text) => ({ text })) };
  }
  return null;
}

/**
 * Varianten 2 und 3 eines Artikels.
 * daten: Frontmatter (title, kurztitel, description), body: MDX-Text ohne Frontmatter.
 * Ergebnis: [{ nr, art, pinTitel, pinText, bild: {…} }]. pinTitel/pinText sind Titel (max. 100) und Beschreibung (max. 500) des Pins.
 */
export function varianten(daten, body) {
  const kurz = daten.kurztitel || daten.title;
  const out = [];
  const f = frage(body);
  if (f) {
    out.push({
      nr: 2, art: 'frage',
      pinTitel: kuerzen(f.frage, 100),
      pinText: kuerzen(`${f.antwort} Mehr dazu im Artikel „${daten.title}“.`, 500),
      bild: { kicker: 'Häufige Frage', titel: f.frage, text: f.antwort },
    });
  }
  const l = liste(body, kurz);
  if (l) {
    const aufzaehlung = l.punkte.map((p) => (p.titel ? `${p.titel}: ${p.text}` : p.text)).join(' · ');
    out.push({
      nr: 3, art: l.art,
      pinTitel: kuerzen(l.pinTitel, 100),
      pinText: kuerzen(`${aufzaehlung.replace(/[.!?]$/, '')}. ${daten.description}`, 500),
      bild: { kicker: l.kicker, titel: l.ueberschrift, punkte: l.punkte },
    });
  }
  return out;
}
