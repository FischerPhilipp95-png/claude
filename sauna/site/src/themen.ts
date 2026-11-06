// Fünf Bereiche der Seite (Briefing Abschnitt 4 plus „Öfen & Zubehör“ seit 6.11.2026 für Amazon-Produkte): zwei Kaufbereiche, Planung & Recht, Kosten & Technik, Öfen & Zubehör. Jede Themenseite ist die Hauptseite
// ihres Bereichs und sammelt die Unterseiten („Hub & Spoke“). farbe: Akzent für Titelbilder, Icons und Chips. icon: Name aus lucide-static.
// bild: Alt-Text des Bereichsfotos /bilder/bereiche/<slug>.webp (960 px) und <slug>-klein.webp (480 px), KI-generiert.
// Neuer Bereich: hier eintragen und in src/content.config.ts beim Feld „thema“ ergänzen.
export const THEMEN = {
  Kaufen: { slug: 'gartensauna-kaufen', titel: 'Gartensauna kaufen', icon: 'house', farbe: '#d08a3a', nav: 'Gartensauna', bild: 'Kleines Saunahaus aus hellem Fichtenholz mit Vorraum im herbstlichen Garten',
    intro: 'Gartensauna, Außensauna, Saunahaus: mit Vorraum, Holzofen oder Dusche, klein oder günstig. Was die Modelle unterscheidet, was sie kosten und welcher Anbieter zu dir passt.' },
  Fasssauna: { slug: 'fasssauna', titel: 'Fasssauna', icon: 'cylinder', farbe: '#b8322f', nav: 'Fasssauna', bild: 'Fasssauna mit Edelstahl-Spannbändern auf einer Holzterrasse im Abendlicht',
    intro: 'Fasssauna kaufen oder mieten: Thermoholz oder Fichte, mit Vorraum, auf dem Anhänger, und was Besitzer nach dem ersten Winter berichten.' },
  Planung: { slug: 'planung-recht', titel: 'Planung & Recht', icon: 'scale', farbe: '#3b6ea5', nav: 'Planung & Recht', bild: 'Mit Pflöcken und Schnur abgesteckter Standort einer Gartensauna am Gartenzaun',
    intro: 'Baugenehmigung nach Bundesland, Holzofen und Schornstein, Abstand zum Nachbarn, Fundament und Aufbau: was vor dem Kauf geklärt sein muss.' },
  Kosten: { slug: 'kosten-technik', titel: 'Kosten & Technik', icon: 'flame', farbe: '#2f855a', nav: 'Kosten & Technik', bild: 'Elektro-Saunaofen mit Saunasteinen und Holzbänken in einer kleinen Saunakabine',
    intro: 'Was eine Gartensauna kostet: Anschaffung, Strom je Saunagang, Holzofen oder Elektroofen, Unterhalt. Mit Stromkosten-Rechner.' },
  Zubehoer: { slug: 'oefen-zubehoer', titel: 'Öfen & Zubehör', icon: 'package', farbe: '#8c5a3c', nav: 'Öfen & Zubehör', bild: 'Schwarzer Saunaofen mit Saunasteinen, davor auf der Holzbank ein Aufgusseimer aus Edelstahl, Holzkelle, Sanduhr und Handtücher',
    intro: 'Holzofen oder Elektroofen, Saunasteine, Thermometer, Aufguss und Infrarotstrahler: was in die Gartensauna gehört, mit Herstellerdaten und ohne erfundene Tests.' },
} as const;
export type Thema = keyof typeof THEMEN;
