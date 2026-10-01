// Zentrale Angaben. Nach der Anmeldung beim Amazon-PartnerNet den Partner-Tag eintragen
// (z. B. 'handwerksdok-21'). Solange er leer ist, sind die Links normale Amazon-Suchlinks.
export const SITE = {
  name: 'Der Handwerksdoktor',
  url: 'https://handwerksdoktor.de',
  description: 'Haustechnik einfach erklärt: Heizung, Strom, Wasser und Geräte im Haushalt verstehen und kleine Probleme selbst lösen.',
  author: 'Der Handwerksdoktor',  // Anzeigename überall auf der Seite. Der echte Name steht nur im Impressum und in der Datenschutzerklärung.
  email: 'info@handwerksdoktor.de',
  youtube: 'https://www.youtube.com/@derhandwerksdoktor',
  amazonTag: 'rechn24-21',
};

/** Amazon-Suchlink für allgemeine Empfehlungen. Konkrete Produkte stehen in src/produkte.ts (Direktlink per ASIN). */
export function amazonSearch(query: string): string {
  const url = new URL('https://www.amazon.de/s');
  url.searchParams.set('k', query);
  if (SITE.amazonTag) url.searchParams.set('tag', SITE.amazonTag);
  return url.toString();
}
