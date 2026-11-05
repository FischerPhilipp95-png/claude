// Alle Affiliate-Links an einer Stelle (Briefing Abschnitt 2 und 8). Partnerprogramme laufen über Awin, Anmeldung durch den Nutzer.
// Bis ein Programm freigeschaltet ist, bleibt `link` leer: Die Seite zeigt dann den Platzhalter #AFFILIATE-<shop>-<produkt>
// (kein echter Link, im Build als „noch nicht freigeschaltet“ erkennbar). Danach hier den Awin-Deeplink eintragen, fertig.
// Hinweis: Bezahlte Suchanzeigen auf Markennamen sind bei GartenHaus verboten, bei Gartenhausfabrik ganz ausgeschlossen. Wir schalten keine.
export interface Shop {
  id: string;
  name: string;
  website: string;         // öffentliche Shop-Adresse (nur zur Information, kein Affiliate-Link)
  programm: string;        // Awin-Programm, zur Orientierung
  provision: string;       // laut Programmbeschreibung, Stand 05.11.2026
  cookie: string;
  link?: string;           // Awin-Deeplink zur Startseite, sobald freigeschaltet
  produkte?: Record<string, string>;  // Produkt-Schlüssel → Awin-Deeplink auf die Produktseite
}

export const SHOPS: Record<string, Shop> = {
  gartenhaus: { id: 'gartenhaus', name: 'GartenHaus GmbH', website: 'https://www.gartenhaus-gmbh.de/', programm: 'Awin 22747', provision: '5 % (Content-Partner 7 %)', cookie: '30 Tage' },
  gartenhausfabrik: { id: 'gartenhausfabrik', name: 'Gartenhausfabrik', website: 'https://www.gartenhausfabrik.de/', programm: 'Awin 76696', provision: '7 %', cookie: '30 Tage' },
  bast: { id: 'bast', name: 'Bast Sauna', website: 'https://www.bast-sauna.de/', programm: 'Awin 119243', provision: '6 %', cookie: '30 Tage' },
  artsauna: { id: 'artsauna', name: 'Artsauna', website: 'https://www.artsauna.de/', programm: 'Awin 106021', provision: 'bis 6 %', cookie: '30 Tage' },
};

/** Affiliate-Link zu einem Shop (optional zu einem Produkt). Ohne freigeschalteten Link: Platzhalter nach Briefing. */
export function shopLink(shop: string, produkt?: string): string {
  const s = SHOPS[shop];
  if (!s) throw new Error(`Unbekannter Shop: ${shop}`);
  if (produkt && s.produkte?.[produkt]) return s.produkte[produkt];
  if (s.link) return s.link;
  return `#AFFILIATE-${shop}-${produkt ?? 'start'}`;
}
export const istPlatzhalter = (href: string) => href.startsWith('#AFFILIATE-');
