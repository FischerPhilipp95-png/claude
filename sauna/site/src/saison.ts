// Aufmacher auf der Startseite. Die Nachfrage ist im Herbst und Winter am höchsten (Briefing Abschnitt 9). Artikel-IDs = Dateiname ohne .mdx.
export const SAISON = {
  titel: 'Vor dem Kauf klären',
  text: 'Baugenehmigung, Holzofen, Kosten: die Fragen, die bei Gartensauna und Fasssauna am häufigsten gestellt werden.',
  icon: 'flame',
  artikel: ['gartensauna-baugenehmigung', 'sauna-holzofen-garten-erlaubt', 'fasssauna-kosten', 'fasssauna-erfahrungen-nachteile'] as string[],
  rechner: { href: '/rechner/sauna-stromkosten/', titel: 'Stromkosten-Rechner: Was kostet ein Saunagang?' } as null | { href: string; titel: string },
};
