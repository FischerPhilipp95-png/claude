// Maschinen: Hersteller → Maschine → Beiträge. Die Daten stehen in src/maschinen.json (auch astro.config.mjs liest sie für die Sitemap).
//
// Felder je Maschine (Schlüssel = Adresse /maschine/<schluessel>/):
// - hersteller: Schlüssel aus src/themen.ts (Themenseite und Filter), z. B. „Siemens“ auch für Bosch-Geräte.
// - markenname: angezeigte Marke, falls anders als das Thema, z. B. „Bosch“ oder „Saeco“.
// - name: Modell oder Serie ohne Marke, z. B. „Magnifica S“.
// - suchwoerter: weitere Namen für die Modellsuche (Modellnummern nur, wenn belegt: Anleitung, Typenschild, Herstellerseite).
// - art: 'siebtraeger' oder 'kapsel', wenn es kein Vollautomat ist.
// - videos: IDs vom eigenen Kanal (src/videos.json), die genau zu dieser Maschine passen.
//
// Jede Maschine hat eine Seite. Ohne eigenen Beitrag und ohne Video steht sie auf „noindex“ und fehlt in der Sitemap,
// damit Google keine dünnen Seiten sieht. Sobald ein Beitrag (Feld „maschinen“ im Artikel) oder ein Video dazukommt, wird sie sichtbar.
import daten from './maschinen.json';
import type { Thema } from './themen';

export interface Maschine {
  hersteller: Thema;
  markenname?: string;
  name: string;
  suchwoerter?: string[];
  art?: 'vollautomat' | 'siebtraeger' | 'kapsel';
  videos?: string[];
}

export const MASCHINEN = daten as Record<string, Maschine>;
export type MaschinenId = keyof typeof MASCHINEN;
export const maschine = (id: string) => MASCHINEN[id];
