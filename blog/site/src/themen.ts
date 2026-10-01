// Themen-Cluster: jede Themenseite sammelt ihre Artikel (interne Verlinkung, „Hub & Spoke“).
// farbe: Akzent für Titelbilder, Themen-Kacheln und Chips. icon: Name aus lucide-static.
export const THEMEN = {
  Heizung: { slug: 'heizung', titel: 'Heizung', icon: 'heater', farbe: '#ff741c', intro: 'Heizkörper entlüften, Gluckern, kalte Heizkörper, Druck: Alles, was du an deiner Heizung selbst prüfen und beheben kannst, und wann du besser einen Fachbetrieb rufst.' },
  Strom: { slug: 'strom', titel: 'Strom', icon: 'zap', farbe: '#ffd400', intro: 'Stromverbrauch messen, Stromfresser finden, verstehen, wie der Strom ins Haus kommt. Ohne Fachchinesisch und ohne Arbeiten, die einer Elektrofachkraft vorbehalten sind.' },
  Wasser: { slug: 'wasser', titel: 'Wasser', icon: 'droplets', farbe: '#39a8ff', intro: 'Verstopfte Abflüsse, tropfende Hähne, Wasserdruck: wie die Wasserversorgung im Haus funktioniert und was du selbst tun kannst.' },
  Klima: { slug: 'raumklima', titel: 'Raumklima', icon: 'wind', farbe: '#03b84c', intro: 'Luftfeuchtigkeit, Lüften, Zugluft und Schimmel: wie du in deiner Wohnung ein gesundes Raumklima bekommst und dabei Heizkosten sparst.' },
  Küche: { slug: 'haushalt', titel: 'Haushaltsgeräte', icon: 'washing-machine', farbe: '#924ef6', intro: 'Waschmaschine, Spülmaschine, Kaffeevollautomat: reinigen, entkalken und pflegen, damit die Geräte lange halten und nichts müffelt.' },
} as const;
export type Thema = keyof typeof THEMEN;
