// Themen-Cluster: Hersteller plus allgemeine Pflege. Jede Themenseite sammelt ihre Artikel („Hub & Spoke“).
// farbe: Akzent für Titelbilder, Themen-Kacheln und Chips. icon: Name aus lucide-static.
// Markennamen werden nur zur Beschreibung genutzt; die Seite gehört zu keinem Hersteller (siehe Fußzeile und /werbung/).
// Neue Marke (z. B. Melitta, Krups): hier eintragen und in src/content.config.ts beim Feld „thema“ ergänzen.
export const THEMEN = {
  Pflege: { slug: 'pflege', titel: 'Pflege & Entkalken', icon: 'sparkles', farbe: '#d08a3a', intro: 'Entkalken, reinigen, Wasserfilter: was jeder Kaffeevollautomat braucht, egal von welcher Marke, und welche Mittel die Maschine kaputtmachen.' },
  DeLonghi: { slug: 'delonghi', titel: 'De’Longhi', icon: 'coffee', farbe: '#e0573e', intro: 'Magnifica, Dinamica, Eletta: Anleitungen für De’Longhi-Kaffeevollautomaten, vom Entkalken bis zu den Warnlampen.' },
  Philips: { slug: 'philips', titel: 'Philips & Saeco', icon: 'cup-soda', farbe: '#3d8fd6', intro: 'Philips-Serien 1200 bis 5400 mit LatteGo und Saeco: Filter, Entkalken, Brühgruppe und blinkende Lampen.' },
  Siemens: { slug: 'siemens', titel: 'Siemens & Bosch', icon: 'settings', farbe: '#14a37f', intro: 'Siemens EQ-Serie und baugleiche Bosch-Geräte: Pflegeprogramme, Entkalken und Fehlermeldungen Schritt für Schritt.' },
  Jura: { slug: 'jura', titel: 'Jura', icon: 'droplets', farbe: '#9b6bd6', intro: 'Jura E-, S- und Z-Linie: Reinigung, Filterwechsel und Pflege der Milchsysteme nach Herstellerangaben.' },
  Krups: { slug: 'krups', titel: 'Krups', icon: 'coffee', farbe: '#c2410c', intro: 'Krups-Kaffeevollautomaten wie die Evidence: Entkalken, blinkende Lampen und Zurücksetzen Schritt für Schritt.' },
  Sage: { slug: 'sage', titel: 'Sage', icon: 'coffee', farbe: '#6b7280', intro: 'Siebträger von Sage wie die Barista Express: Pflege, Entkalken und die wichtigsten Einstellungen.' },
} as const;
export type Thema = keyof typeof THEMEN;
