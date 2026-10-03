// Zentrale Angaben der Seite. Amazon-Partner-Tag: eigene Tracking-ID für diese Seite im PartnerNet anlegen
// (Konto → Tracking-IDs verwalten), damit die Verkäufe getrennt vom Handwerksdoktor auswertbar sind.
export const SITE = {
  name: 'Der Vollautomaten-Doktor',
  url: 'https://vollautomatendoktor.de',
  description: 'Hilfe für deinen Kaffeevollautomaten: entkalken, reinigen, Filter wechseln und Fehler beheben, Modell für Modell erklärt.',
  author: 'Der Vollautomaten-Doktor',  // Anzeigename überall auf der Seite. Der echte Name steht nur im Impressum und in der Datenschutzerklärung.
  email: 'info@vollautomatendoktor.de',
  youtube: 'https://www.youtube.com/@derhandwerksdoktor',
  kanal: 'Der Handwerksdoktor',
  amazonTag: 'rechn24-21',
  // Bestätigungscode von Pinterest („Website beanspruchen“ → HTML-Tag), nur der Wert aus content="…". Leer = kein Tag.
  pinterestVerify: '',
};

/** Amazon-Suchlink für allgemeine Empfehlungen. Konkrete Produkte stehen in src/produkte.ts (Direktlink per ASIN). */
export function amazonSearch(query: string): string {
  const url = new URL('https://www.amazon.de/s');
  url.searchParams.set('k', query);
  if (SITE.amazonTag) url.searchParams.set('tag', SITE.amazonTag);
  return url.toString();
}
