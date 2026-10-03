// Saison-Bereich auf der Startseite. Im November/Dezember kommen viele neue Maschinen dazu (Black Friday, Weihnachten),
// dann „einrichten“ und „erste Pflege“ nach oben holen. Artikel-IDs = Dateiname ohne .mdx.
export const SAISON = {
  titel: 'Am häufigsten gesucht',
  text: 'Entkalken und Filter: die Fragen, die zu Kaffeevollautomaten am häufigsten gestellt werden.',
  icon: 'flame',
  artikel: [
    'kaffeevollautomat-entkalken',
    'delonghi-kaffeevollautomat-entkalken',
    'philips-aquaclean-filter',
    'siemens-kaffeevollautomat-entkalken',
    'jura-kaffeevollautomat-reinigen',
  ],
  rechner: null as null | { href: string; titel: string },
};
