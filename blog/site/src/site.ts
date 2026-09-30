// Zentrale Angaben. Nach der Anmeldung beim Amazon-PartnerNet den Partner-Tag eintragen
// (z. B. 'handwerksdok-21'). Solange er leer ist, sind die Links normale Amazon-Suchlinks.
export const SITE = {
  name: 'Der Handwerksdoktor',
  url: 'https://handwerksdoktor.de',
  description: 'Haustechnik einfach erklärt: Heizung, Strom, Wasser und Geräte im Haushalt verstehen und kleine Probleme selbst lösen.',
  author: 'Philipp Fischer',
  email: 'flpspring@gmail.com',
  youtube: 'https://www.youtube.com/@derhandwerksdoktor',
  amazonTag: '',
};

/** Amazon-Suchlink. Bewusst Suche statt einzelner Produkte, solange keine Produkte selbst geprüft sind. */
export function amazonSearch(query: string): string {
  const url = new URL('https://www.amazon.de/s');
  url.searchParams.set('k', query);
  if (SITE.amazonTag) url.searchParams.set('tag', SITE.amazonTag);
  return url.toString();
}
