// Saison-Bereich auf der Startseite: zeigt die Artikel, die gerade gesucht werden.
// Je nach Jahreszeit Titel, Text und Artikel-IDs (Dateiname ohne .mdx) austauschen, z. B. im Sommer Klima und Balkonkraftwerk.
export const SAISON = {
  titel: 'Geschenkideen für Heimwerker',
  text: 'Weihnachten rückt näher. Was sich Heimwerker wirklich wünschen, worauf du beim Kauf achtest und was du dir sparen kannst.',
  icon: 'gift',
  artikel: [
    'geschenke-fuer-heimwerker',
    'akkuschrauber-kaufen',
    'werkzeugkoffer-mit-akkuschrauber',
    'akkuschrauber-zubehoer',
    'smartes-thermostat',
    'licht-mit-bewegungsmelder',
  ],
  rechner: { href: '/rechner/duebel/', titel: 'Dübel-Finder: Welcher Dübel für welche Wand? Für den ersten Einsatz des neuen Akkuschraubers' },
};

// Startseite „Oft gelesen“: Artikel, die schon fast auf Seite 1 bei Google stehen und einen Schubs brauchen (Search Console),
// plus die Heizperiode-Artikel, solange der Saison-Block die Geschenkideen zeigt. Alle paar Wochen anpassen.
export const OFT_GELESEN = [
  'ab-wann-heizen',
  'heizkoerper-entlueften-anleitung',
  'heizungsventil-klemmt',
  'fenster-beschlagen',
  'dynamischer-stromtarif',
  'heizung-gluckert',
  'heizkoerper-reinigen',
  'luftentfeuchter',
];
