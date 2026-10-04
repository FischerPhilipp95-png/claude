// Fotos einzelner Maschinen (Kacheln im Maschinen-Finder, auf den Themenseiten und Kopfbild der Maschinenseite).
// Nur echte, frei lizenzierte Fotos GENAU dieses Modells (CC0, gemeinfrei, CC BY, CC BY-SA, Pexels-Lizenz), Nachweis immer sichtbar.
// Pexels-Suche: API-Schlüssel nur als Umgebungsvariable PEXELS_KEY, nie im Code. Modell muss auf dem Foto eindeutig erkennbar sein.
// Keine KI-Bilder, keine Fotos eines anderen Modells, keine Pressefotos ohne geprüfte Nutzungsrechte.
// Maschinen ohne Foto bekommen eine gestaltete Kachel in der Markenfarbe (MaschinenKarte.astro).
import { THEMEN_BILDER } from './themen-bilder';

export interface MaschinenBild { src: string; klein: string; alt: string; nachweis: string }

const BY_2 = '<a href="https://creativecommons.org/licenses/by/2.0/" rel="noopener">CC BY 2.0</a>';
const pexels = (pfad: string) => `<a href="https://www.pexels.com/photo/${pfad}/" rel="noopener">Pexels</a>`;
const PEXELS_LIZENZ = '<a href="https://www.pexels.com/license/" rel="noopener">Pexels-Lizenz</a>';
const flickr = (pfad: string) => `<a href="https://www.flickr.com/photos/${pfad}" rel="noopener">Flickr</a>`;
const eigen = (id: string, alt: string, nachweis: string): MaschinenBild =>
  ({ src: `/bilder/maschinen/${id}.webp`, klein: `/bilder/maschinen/${id}-klein.webp`, alt, nachweis });
const marke = (slug: string, b: { alt: string; nachweis: string }): MaschinenBild =>
  ({ src: `/bilder/marken/${slug}.webp`, klein: `/bilder/marken/${slug}-klein.webp`, alt: b.alt, nachweis: b.nachweis });

export const MASCHINEN_BILDER: Record<string, MaschinenBild> = {
  // Das Markenfoto zeigt genau diese Modelle:
  'delonghi-magnifica-esam': marke('delonghi', THEMEN_BILDER.DeLonghi),
  'siemens-eq3': marke('siemens', THEMEN_BILDER.Siemens),
  'delonghi-dinamica': eigen('delonghi-dinamica', 'De’Longhi Dinamica Kaffeevollautomat mit Bedienfeld, silber',
    `Foto: markolaz, „DeLonghi Dinamica ECAM35025SB Espresso Machine“, ${flickr('195403219@N08/51984340616')}, ${BY_2}, zugeschnitten`),
  'delonghi-magnifica-s': eigen('delonghi-magnifica-s', 'De’Longhi Magnifica S in Silber bereitet einen Latte macchiato zu',
    `Foto: Doğu Tuncer, ${pexels('view-of-a-coffee-machine-making-coffee-14764710')}, ${PEXELS_LIZENZ}, zugeschnitten`),
  'delonghi-dedica': eigen('delonghi-dedica', 'Rote De’Longhi Dedica Siebträgermaschine, Espresso läuft in eine Tasse',
    `Foto: Melike B, ${pexels('making-coffee-in-coffee-machine-10078423')}, ${PEXELS_LIZENZ}, zugeschnitten`),
};

export const maschinenBild = (id: string): MaschinenBild | undefined => MASCHINEN_BILDER[id];
