// Saison-Bereich auf der Startseite: zeigt die Artikel, die gerade gesucht werden.
// Je nach Jahreszeit Titel, Text und Artikel-IDs (Dateiname ohne .mdx) austauschen, z. B. im Sommer Klima und Balkonkraftwerk.
export const SAISON = {
  titel: 'Jetzt in der Heizperiode',
  text: 'Die Heizung läuft wieder an. Das sind die Fragen, die gerade am häufigsten gestellt werden.',
  icon: 'thermometer-snowflake',
  artikel: [
    'ab-wann-heizen',
    'heizkoerper-entlueften-anleitung',
    'heizungsventil-klemmt',
    'fenster-beschlagen',
    'luftentfeuchter',
    'heizen-mit-klimaanlage',
  ],
  rechner: { href: '/rechner/heizkosten-vergleich/', titel: 'Heizkosten-Vergleich: Klimaanlage, Gas oder Heizlüfter' },
};
