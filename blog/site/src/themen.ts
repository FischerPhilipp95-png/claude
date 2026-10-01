// Themen-Cluster: jede Themenseite sammelt ihre Artikel (interne Verlinkung, „Hub & Spoke“).
export const THEMEN = {
  Heizung: { slug: 'heizung', titel: 'Heizung', intro: 'Heizkörper entlüften, Gluckern, kalte Heizkörper, Druck: Alles, was du an deiner Heizung selbst prüfen und beheben kannst, und wann du besser einen Fachbetrieb rufst.' },
  Strom: { slug: 'strom', titel: 'Strom', intro: 'Stromverbrauch messen, Stromfresser finden, verstehen, wie der Strom ins Haus kommt. Ohne Fachchinesisch und ohne Arbeiten, die einer Elektrofachkraft vorbehalten sind.' },
  Wasser: { slug: 'wasser', titel: 'Wasser', intro: 'Wasserdruck, Armaturen, Leitungen: wie die Wasserversorgung im Haus funktioniert und was du selbst tun kannst.' },
  Klima: { slug: 'raumklima', titel: 'Raumklima', intro: 'Luftfeuchtigkeit, Lüften, Zugluft und Schimmel: wie du in deiner Wohnung ein gesundes Raumklima bekommst und dabei Heizkosten sparst.' },
  Küche: { slug: 'kueche', titel: 'Küche', intro: 'Kaffeevollautomat, Spülmaschine und Co.: Pflege, Entkalken und kleine Reparaturen.' },
} as const;
export type Thema = keyof typeof THEMEN;
