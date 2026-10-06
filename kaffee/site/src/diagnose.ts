// Diagnosen („Was hat meine Heizung?“): Fragen führen Schritt für Schritt zu einem Ergebnis.
// Gemeinsamer Baustein für alle Seiten (gleiche Datei in blog/site und kaffee/site). Angezeigt von components/Diagnose.astro,
// die Übersichtstabelle kommt aus components/DiagnoseUebersicht.astro. Daten je Diagnose in src/diagnosen/<name>.ts.
//
// Fragen: jede Antwort führt zu einer weiteren Frage (frage) oder zu einem Ergebnis (ergebnis). Die erste Frage heißt „start“.
// Der gewählte Weg steht als Schlüsselkette im #-Teil der Adresse (#pfad=einer.ganz-kalt.nein), so lässt sich jedes Ergebnis verlinken.
// kurz: Text für die Übersichtstabelle, wenn die Antwort allein nicht verständlich ist.

export type Option = { key: string; text: string; kurz?: string; icon?: string; frage?: string; ergebnis?: string };
export type Frage = { frage: string; hilfe?: string; optionen: Option[] };
export type Stufe = 'selbst' | 'teils' | 'fachbetrieb' | 'normal';
export type Ergebnis = {
  titel: string;
  stufe: Stufe;
  ursache: string;
  schritte: string[];
  /** Zusatzhinweis, Überschrift kommt aus Diagnose.hinweisTitel (z. B. „Mietwohnung“). */
  hinweis?: string;
  /** Weiterlesen: [Adresse, Linktext]. Der erste Link steht auch in der Übersichtstabelle. */
  artikel: [string, string][];
  /** Passendes Produkt: [Name, Amazon-Suchbegriff]. */
  produkt?: [string, string];
};
export type Diagnose = {
  name: string;
  fragen: Record<string, Frage>;
  ergebnisse: Record<string, Ergebnis>;
  hinweisTitel?: string;
  /** Texte der Stufen, falls „Fachbetrieb“ nicht passt (z. B. „Kundendienst“). */
  stufen?: Partial<Record<Stufe, { text?: string; kurz?: string }>>;
};

const STUFE_STANDARD: Record<Stufe, { status: string; text: string; kurz: string; icon: string }> = {
  selbst: { status: 'gut', text: 'Kannst du selbst beheben', kurz: 'selbst machbar', icon: 'wrench' },
  teils: { status: 'achtung', text: 'Teils selbst, teils Fachbetrieb', kurz: 'teils selbst, teils Fachbetrieb', icon: 'triangle-alert' },
  fachbetrieb: { status: 'erhoeht', text: 'Fall für den Fachbetrieb', kurz: 'Fachbetrieb', icon: 'phone' },
  normal: { status: 'gut', text: 'Kein Fehler', kurz: 'kein Fehler', icon: 'circle-check' },
};

export const stufe = (d: Diagnose, s: Stufe) => ({ ...STUFE_STANDARD[s], ...d.stufen?.[s] });

/** Bricht den Build ab, wenn eine Antwort ins Leere führt oder ein Ergebnis nicht erreichbar ist. */
export function pruefen(d: Diagnose) {
  if (!d.fragen.start) throw new Error(`Diagnose ${d.name}: Frage „start“ fehlt`);
  const erreicht = new Set<string>();
  for (const [id, f] of Object.entries(d.fragen)) {
    const keys = new Set<string>();
    for (const o of f.optionen) {
      if (keys.has(o.key)) throw new Error(`Diagnose ${d.name}: Antwort ${id}.${o.key} doppelt`);
      keys.add(o.key);
      if (!!o.frage === !!o.ergebnis) throw new Error(`Diagnose ${d.name}: ${id}.${o.key} braucht genau eins von frage oder ergebnis`);
      if (o.frage && !d.fragen[o.frage]) throw new Error(`Diagnose ${d.name}: Frage ${o.frage} fehlt (${id}.${o.key})`);
      if (o.ergebnis && !d.ergebnisse[o.ergebnis]) throw new Error(`Diagnose ${d.name}: Ergebnis ${o.ergebnis} fehlt (${id}.${o.key})`);
      if (o.ergebnis) erreicht.add(o.ergebnis);
    }
  }
  for (const e of Object.keys(d.ergebnisse)) if (!erreicht.has(e)) throw new Error(`Diagnose ${d.name}: Ergebnis ${e} ist nicht erreichbar`);
}

/** Alle Wege mit Ergebnis, gruppiert nach der ersten Antwort. Fragen, die schon direkt vom Start erreichbar sind, stehen in ihrer eigenen Gruppe. */
export function uebersicht(d: Diagnose) {
  const direkt = new Set(d.fragen.start.optionen.map((o) => o.frage).filter(Boolean));
  const gruppen: { titel: string; zeilen: { anzeichen: string; e: Ergebnis }[] }[] = [];
  const sammeln = (id: string, praefix: string[], zeilen: { anzeichen: string; e: Ergebnis }[], besucht: Set<string>) => {
    for (const o of d.fragen[id].optionen) {
      const weg = [...praefix, o.kurz ?? o.text];
      if (o.ergebnis) zeilen.push({ anzeichen: weg.join(': '), e: d.ergebnisse[o.ergebnis] });
      else if (o.frage && !besucht.has(o.frage) && !direkt.has(o.frage)) sammeln(o.frage, weg, zeilen, new Set([...besucht, o.frage]));
    }
  };
  for (const o of d.fragen.start.optionen) {
    const zeilen: { anzeichen: string; e: Ergebnis }[] = [];
    if (o.ergebnis) zeilen.push({ anzeichen: o.text, e: d.ergebnisse[o.ergebnis] });
    else sammeln(o.frage!, [], zeilen, new Set([o.frage!]));
    gruppen.push({ titel: o.text, zeilen });
  }
  return gruppen;
}

/** Nur das, was das Skript im Browser braucht: welche Antwort wohin führt. */
export const wege = (d: Diagnose) =>
  Object.fromEntries(Object.entries(d.fragen).map(([id, f]) => [id, f.optionen.map(({ key, frage, ergebnis }) => ({ key, frage, ergebnis }))]));
