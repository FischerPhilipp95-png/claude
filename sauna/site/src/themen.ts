// Vier Bereiche der Seite (Briefing Abschnitt 4): zwei Kaufbereiche, Planung & Recht, Kosten & Technik. Jede Themenseite ist die Hauptseite
// ihres Bereichs und sammelt die Unterseiten („Hub & Spoke“). farbe: Akzent für Titelbilder, Icons und Chips. icon: Name aus lucide-static.
// Neuer Bereich: hier eintragen und in src/content.config.ts beim Feld „thema“ ergänzen.
export const THEMEN = {
  Kaufen: { slug: 'gartensauna-kaufen', titel: 'Gartensauna kaufen', nav: 'Gartensauna', icon: 'house', farbe: '#d08a3a',
    intro: 'Gartensauna, Außensauna, Saunahaus: mit Vorraum, Holzofen oder Dusche, klein oder günstig. Was die Modelle unterscheidet, was sie kosten und welcher Anbieter zu dir passt.' },
  Fasssauna: { slug: 'fasssauna', titel: 'Fasssauna', nav: 'Fasssauna', icon: 'cylinder', farbe: '#b8322f',
    intro: 'Fasssauna kaufen oder mieten: Thermoholz oder Fichte, mit Vorraum, auf dem Anhänger, und was Besitzer nach dem ersten Winter berichten.' },
  Planung: { slug: 'planung-recht', titel: 'Planung & Recht', nav: 'Planung & Recht', icon: 'scale', farbe: '#3b6ea5',
    intro: 'Baugenehmigung nach Bundesland, Holzofen und Schornstein, Abstand zum Nachbarn, Fundament und Aufbau: was vor dem Kauf geklärt sein muss.' },
  Kosten: { slug: 'kosten-technik', titel: 'Kosten & Technik', nav: 'Kosten & Technik', icon: 'flame', farbe: '#2f855a',
    intro: 'Was eine Gartensauna kostet: Anschaffung, Strom je Saunagang, Holzofen oder Elektroofen, Unterhalt. Mit Stromkosten-Rechner.' },
} as const;
export type Thema = keyof typeof THEMEN;
