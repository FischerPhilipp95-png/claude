// Amazon-Produkte der Seite. Neue Produkte hier eintragen: ASIN aus dem Link (…/dp/ASIN) übernehmen.
// Saunen und Fasssaunen laufen über die Partnershops (src/affiliate-links.ts), Amazon nur für Zubehör und Infrarotkabinen.
// Keine Preise, keine Amazon-Bilder (Datenschutz), keine Test-Urteile. Technische Daten nur, wenn Hersteller oder Händler sie nennen.
import { SITE } from './site';

export const GRUPPEN = {
  oefen: 'Saunaöfen',
  steine: 'Saunasteine',
  messen: 'Thermometer und Hygrometer',
  aufguss: 'Aufguss',
  infrarot: 'Infrarot',
} as const;
export type Gruppe = keyof typeof GRUPPEN;

export interface Produkt {
  name: string;        // so heißt es auf der Seite
  marke: string;
  asin: string;
  gruppe: Gruppe;      // Abschnitt auf der Seite „Öfen & Zubehör“
  kurz: string;        // ein Satz: wofür
  daten?: string[];    // belegte technische Daten (Herstellerangabe)
  passt?: string;      // wichtiger Hinweis (z. B. nur für innen)
}

export const PRODUKTE = {
  'dewello-pierson': {
    name: 'Dewello Infrarotkabine Pierson 160 × 105', marke: 'Dewello', asin: 'B07NWT5HFF',
    gruppe: 'infrarot',
    kurz: 'Infrarotkabine aus Hemlock für 2 bis 3 Personen mit Vollspektrum- und Karbonstrahlern, auch am Boden.',
    daten: ['Maße laut Hersteller 160 × 105 × 190 cm', 'Leistung laut Hersteller 2.400 W (6 Vollspektrum- und 3 Karbonstrahler)', 'Anschluss 230 V, laut Anleitung eigener Stromkreis mit 16 A'],
    passt: 'Für trockene Innenräume. Nicht für den Garten.',
  },
  'dewello-lakefield': {
    name: 'Dewello Infrarotkabine Lakefield 120 × 120', marke: 'Dewello', asin: 'B07P837V9J',
    gruppe: 'infrarot',
    kurz: 'Eckkabine aus Hemlock für 1 bis 2 Personen mit Vollspektrum- und Karbonstrahlern.',
    daten: ['Maße laut Hersteller 120 × 120 × 190 cm', 'Leistung laut Datenblatt 2.050 W', 'Anschluss 230 V, laut Anleitung eigener Stromkreis mit 16 A'],
    passt: 'Für trockene Innenräume. Nicht für den Garten.',
  },
  'elbe-hygge': {
    name: 'Elbe Infrarotkabine Hygge 150 × 150', marke: 'Elbe', asin: 'B07HNWGXBT',
    gruppe: 'infrarot',
    kurz: 'Größere Kabine aus Hemlock für 3 bis 5 Personen mit 8 Vollspektrumstrahlern und einem Carbonstrahler.',
    daten: ['Maße laut Angebot 150 × 150 × 200 cm', 'Ein Datenblatt des Herstellers mit der Leistung haben wir nicht gefunden: vor dem Kauf beim Verkäufer erfragen'],
    passt: 'Für Innenräume. Nicht für den Garten.',
  },
  'harvia-vega-bc90': {
    name: 'Harvia Vega BC90 mit eingebauter Steuerung', marke: 'Harvia', asin: 'B005LG9SXS',
    gruppe: 'oefen',
    kurz: 'Elektro-Saunaofen mit 9 kW und Bedienung direkt am Ofen, ohne separates Steuergerät.',
    daten: ['Leistung 9 kW', 'laut Harvia für Kabinen von 8 bis 14 m³', 'laut Harvia 400 V, rund 20 kg Saunasteine'],
    passt: 'Für die meisten Fasssaunen mit 6 bis 7 m³ zu groß, eher für Saunahäuser. Anschluss nur durch eine Elektrofachkraft.',
  },
  'harvia-pro-20': {
    name: 'Harvia Pro 20 Holz-Saunaofen', marke: 'Harvia', asin: 'B0B3Y4LZ63',
    gruppe: 'oefen',
    kurz: 'Holzofen für Gartensaunen, laut Angebot mit Nachweis für die Stufe 2 der 1. BImSchV.',
    daten: ['laut Harvia für Kabinen von 8 bis 20 m³', 'laut Harvia rund 40 kg Steine mit 10 bis 15 cm', 'Schornstein und Abnahme durch den Schornsteinfeger zusätzlich'],
    passt: 'Vor dem Kauf mit dem Bezirksschornsteinfeger klären. Schornstein ist nicht dabei.',
  },
  'harvia-steine-5-10': {
    name: 'Harvia Saunasteine 20 kg, 5 bis 10 cm', marke: 'Harvia', asin: 'B00TWQF648',
    gruppe: 'steine',
    kurz: 'Olivin-Diabas-Steine in der kleineren Größe, laut Harvia für Elektroöfen und als obere Lage im Holzofen.',
  },
  'harvia-steine-10-15': {
    name: 'Harvia Saunasteine 20 kg, 10 bis 15 cm', marke: 'Harvia', asin: 'B0BCT2B3HY',
    gruppe: 'steine',
    kurz: 'Größere Steine, wie sie Harvia für Holzöfen wie den Pro 20 nennt.',
  },
  'fischer-thermohygrometer': {
    name: 'Fischer Sauna-Thermohygrometer 196TH-03', marke: 'Fischer', asin: 'B007W2AXD8',
    gruppe: 'messen',
    kurz: 'Zeigt Temperatur (30 bis 120 °C) und Luftfeuchte (0 bis 60 %) in einem Holzgehäuse.',
  },
  'tfa-thermohygrometer': {
    name: 'TFA Dostmann Sauna-Thermohygrometer 40.1028', marke: 'TFA Dostmann', asin: 'B000TQ4JJS',
    gruppe: 'messen',
    kurz: 'Hitzebeständiges Thermo-Hygrometer im Holzgehäuse, laut Angebot in Deutschland gefertigt.',
  },
  'eliga-aufgusseimer': {
    name: 'Eliga Aufgusseimer Edelstahl, 4 Liter', marke: 'Eliga', asin: 'B00TTWRUM6',
    gruppe: 'aufguss',
    kurz: 'Aufgusseimer aus Edelstahl mit Holzgriff.',
  },
  'eliga-kelle': {
    name: 'Eliga Schöpfkelle Holz, etwa 30 cm', marke: 'Eliga', asin: 'B005GC7GP4',
    gruppe: 'aufguss',
    kurz: 'Gewinkelte Kelle aus Holz für den Aufguss.',
  },
  'infrarotmed-max-500': {
    name: 'InfraROTmed Max Rückenstrahler 500 W', marke: 'Gurtner Wellness', asin: 'B0CS396K51',
    gruppe: 'infrarot',
    kurz: 'Vollspektrum-Rückenstrahler mit 500 W zum Nachrüsten, laut Angebot für Sauna und Infrarotkabine.',
    passt: 'Vor dem Kauf beim Hersteller bestätigen lassen, dass der Strahler für den Einbau in deine Sauna und ihre Temperatur zugelassen ist. Anschluss durch eine Elektrofachkraft.',
  },
} satisfies Record<string, Produkt>;

export type ProduktId = keyof typeof PRODUKTE;

/** Direkter Amazon-Produktlink mit Partner-Tag. */
export function amazonProdukt(asin: string): string {
  return `https://www.amazon.de/dp/${asin}?tag=${SITE.amazonTag}`;
}
