// Maschinen: Hersteller → Maschine → Beiträge.
// Jede Maschine bekommt eine eigene Seite /maschine/<slug>/, sobald es mindestens einen Beitrag (Feld „maschinen“ im Artikel)
// oder ein Video dafür gibt. Beiträge, die für alle Geräte einer Marke gelten, stehen dort zusätzlich unter „Gilt auch für deine Maschine“.
//
// Regeln:
// - hersteller = Schlüssel aus src/themen.ts.
// - Nur Angaben eintragen, die belegt sind (Bedienungsanleitung, Herstellerseite). Modellnummern erst, wenn sie aus der
//   Anleitung oder vom Typenschild stammen, nicht raten.
// - videos = IDs vom eigenen Kanal (src/videos.json), die genau zu dieser Maschine passen.
// - art: 'vollautomat' oder 'siebtraeger' (Siebträger und Kapselmaschinen stehen bei „Weitere“).
import type { Thema } from './themen';

export interface Maschine {
  hersteller: Thema;
  name: string;            // Anzeigename ohne Hersteller, z. B. „Magnifica S“
  suchwoerter?: string[];  // weitere Namen für den Filter, z. B. Modellnummern
  art?: 'vollautomat' | 'siebtraeger' | 'kapsel';
  videos?: string[];
}

export const MASCHINEN = {
  // De'Longhi
  'delonghi-magnifica-s': { hersteller: 'DeLonghi', name: 'Magnifica S', videos: ['LLl4Ocv-0tM', '2T0Ww1Aycc8', '6kwmDU7H1Ls', '-x0obhkt8Ao'] },
  'delonghi-magnifica-evo': { hersteller: 'DeLonghi', name: 'Magnifica Evo', videos: ['97IogfXRj-I', 'OC4Wu6o4i8U', 'r-T06GQ8uv0'] },
  'delonghi-dinamica': { hersteller: 'DeLonghi', name: 'Dinamica', videos: ['njtMKj3Kaoo'] },
  'delonghi-rivelia': { hersteller: 'DeLonghi', name: 'Rivelia', videos: ['1ORLyvj4o4M', '6U2cRlkfBqM'] },
  'delonghi-dedica': { hersteller: 'DeLonghi', name: 'Dedica', art: 'siebtraeger', videos: ['qso2o4F3YBU'] },
  // Philips (LatteGo-Serien)
  'philips-2300': { hersteller: 'Philips', name: 'Serie 2300 LatteGo', suchwoerter: ['2300', 'LatteGo'], videos: ['KHLi12cGfT4'] },
  'philips-3300': { hersteller: 'Philips', name: 'Serie 3300 LatteGo', suchwoerter: ['3300', 'LatteGo'], videos: ['A7RKBatgaEU'] },
  'philips-4300': { hersteller: 'Philips', name: 'Serie 4300', suchwoerter: ['4300'], videos: ['5dq4lXIqNRo'] },
  'philips-5400': { hersteller: 'Philips', name: 'Serie 5400 LatteGo', suchwoerter: ['5400', 'LatteGo'], videos: ['5dq4lXIqNRo'] },
  'philips-5500': { hersteller: 'Philips', name: 'Serie 5500 LatteGo', suchwoerter: ['5500', 'LatteGo'], videos: ['KHLi12cGfT4'] },
  // Siemens
  'siemens-eq6-plus': { hersteller: 'Siemens', name: 'EQ.6 plus', suchwoerter: ['EQ6', 'EQ 6'], videos: ['VtUr64BkUqk'] },
  // Jura
  'jura-impressa-e': { hersteller: 'Jura', name: 'Impressa E10, E20, E25', suchwoerter: ['E10', 'E20', 'E25', 'Impressa'], videos: ['rb1vi2R1zs4'] },
  // Krups
  'krups-evidence-ea897b': { hersteller: 'Krups', name: 'Evidence EA897B', suchwoerter: ['EA897B', 'Evidence'], videos: ['jtJomDcrGVI', 'NWPy0G3jKjk'] },
  // Sage
  'sage-barista-express': { hersteller: 'Sage', name: 'Barista Express', art: 'siebtraeger', videos: ['JMi1KSIWnRM', 'ju6LOA2AvHI'] },
} satisfies Record<string, Maschine>;

export type MaschinenId = keyof typeof MASCHINEN;
export const maschine = (id: string) => (MASCHINEN as Record<string, Maschine>)[id];
