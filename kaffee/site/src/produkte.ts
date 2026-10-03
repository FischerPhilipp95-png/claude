// Zentrale Produktliste. Neue Amazon-Links hier eintragen: ASIN aus dem Link (…/dp/ASIN) übernehmen.
// Keine Preise, keine Amazon-Bilder (Datenschutz), keine Test-Urteile: Wir erklären, wofür und wie man ein Produkt nutzt.
import type { Thema } from './themen';
import { SITE } from './site';

export interface Produkt {
  name: string;        // so heißt es auf der Seite
  marke: string;
  asin: string;
  thema: Thema;        // Kategorie für die Produktseite
  artikel: string;     // Slug des Artikels, der das Produkt erklärt
  kurz: string;        // ein Satz: wofür
  passt?: string;      // wichtiger Hinweis zur Kompatibilität
}

export const PRODUKTE = {
  'siemens-tz80002a': {
    name: 'Siemens Entkalkungstabletten TZ80002A', marke: 'Siemens', asin: 'B07WWGKRHL', thema: 'Siemens', artikel: 'siemens-kaffeevollautomat-entkalken',
    kurz: 'Original-Entkalker für Siemens-Kaffeevollautomaten der EQ-Serie.',
    passt: 'Laut Händlerangaben für EQ-Serie, surpresso und Siemens-Einbauvollautomaten.',
  },
  'delonghi-ecodecalk': {
    name: "De'Longhi EcoDecalk", marke: "De'Longhi", asin: 'B008YETL18', thema: 'DeLonghi', artikel: 'delonghi-kaffeevollautomat-entkalken',
    kurz: "Flüssiger Original-Entkalker für De'Longhi-Kaffeevollautomaten und Siebträger.",
  },
  'jura-reinigungstabletten': {
    name: 'JURA 3-Phasen-Reinigungstabletten', marke: 'JURA', asin: 'B09F98MMVC', thema: 'Jura', artikel: 'jura-kaffeevollautomat-reinigen',
    kurz: 'Für das Reinigungsprogramm: entfernt Kaffeefett aus Brüheinheit und Leitungen.',
  },
  'jura-claris-smart': {
    name: 'JURA CLARIS Smart+ Filterpatrone', marke: 'JURA', asin: 'B0BF9W3WC4', thema: 'Jura', artikel: 'jura-kaffeevollautomat-reinigen',
    kurz: 'Wasserfilter mit automatischer Filtererkennung, damit seltener entkalkt werden muss.',
    passt: 'Nur für JURA-Geräte, die für CLARIS Smart ausgelegt sind. Steht in der Anleitung.',
  },
  'philips-aquaclean': {
    name: 'Philips AquaClean CA6903', marke: 'Philips', asin: 'B074M9DZ4M', thema: 'Philips', artikel: 'philips-aquaclean-filter',
    kurz: 'Kalk- und Wasserfilter für Philips- und Saeco-Vollautomaten mit AquaClean.',
    passt: 'Nur für Geräte mit AquaClean-Filteranschluss.',
  },
} satisfies Record<string, Produkt>;

export type ProduktId = keyof typeof PRODUKTE;

/** Direkter Amazon-Produktlink mit Partner-Tag. */
export function amazonProdukt(asin: string): string {
  return `https://www.amazon.de/dp/${asin}?tag=${SITE.amazonTag}`;
}
