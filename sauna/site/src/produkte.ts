// Amazon-Produkte der Seite. Neue Produkte hier eintragen: ASIN aus dem Link (…/dp/ASIN) übernehmen.
// Saunen und Fasssaunen laufen über die Partnershops (src/affiliate-links.ts), Amazon nur für Zubehör und Infrarotkabinen.
// Keine Preise, keine Amazon-Bilder (Datenschutz), keine Test-Urteile. Technische Daten nur, wenn Hersteller oder Händler sie nennen.
import { SITE } from './site';

export interface Produkt {
  name: string;        // so heißt es auf der Seite
  marke: string;
  asin: string;
  kurz: string;        // ein Satz: wofür
  daten?: string[];    // belegte technische Daten (Herstellerangabe)
  passt?: string;      // wichtiger Hinweis (z. B. nur für innen)
}

export const PRODUKTE = {
} satisfies Record<string, Produkt>;

export type ProduktId = keyof typeof PRODUKTE;

/** Direkter Amazon-Produktlink mit Partner-Tag. */
export function amazonProdukt(asin: string): string {
  return `https://www.amazon.de/dp/${asin}?tag=${SITE.amazonTag}`;
}
