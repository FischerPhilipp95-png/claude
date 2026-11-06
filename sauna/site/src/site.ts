// Zentrale Angaben der Seite. Affiliate-Links (Awin-Partnerprogramme der Sauna-Shops) stehen in src/affiliate-links.ts, Amazon-Produkte in src/produkte.ts.
export const SITE = {
  name: 'Der Gartensauna-Doktor',
  url: 'https://gartensaunadoktor.de',
  description: 'Gartensauna, Außensauna und Fasssauna: unabhängiger Ratgeber zu Kauf, Baugenehmigung, Holzofen, Kosten und Aufbau, mit Quellen und Stand-Datum.',
  author: 'Der Gartensauna-Doktor',  // Anzeigename überall auf der Seite. Der echte Name steht nur im Impressum und in der Datenschutzerklärung.
  email: 'info@handwerksdoktor.de',  // gleicher Inhaber wie handwerksdoktor.de; so braucht die neue Domain keine eigenen E-Mail-Einstellungen
  youtube: 'https://www.youtube.com/@derhandwerksdoktor',
  kanal: 'Der Handwerksdoktor',
  // Amazon-Tracking-ID. Vorläufig die StoreID des Kontos (auch handwerksdoktor.de). Eigene ID in PartnerNet anlegen und hier eintragen.
  amazonTag: 'rechn24-21',
  // Bestätigungscode von Pinterest („Website beanspruchen“ → HTML-Tag), nur der Wert aus content="…". Leer = kein Tag.
  pinterestVerify: '',
};
