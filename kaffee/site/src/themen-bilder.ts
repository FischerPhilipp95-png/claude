// Fotos für die Themen-Kacheln (Startseite) und den Kopf der Themenseiten.
// Nur frei lizenzierte Fotos (CC0, gemeinfrei, CC BY, CC BY-SA), Nachweis steht immer sichtbar am Bild bzw. unter den Kacheln.
// Dateien: public/bilder/marken/<slug>.webp (960×720) und <slug>-klein.webp (480×360), auf 4:3 zugeschnitten.
// Neues Foto suchen: python3 tools/commons_bild.py suche "…" (Wikimedia Commons) oder Openverse (Flickr, nur echte Fotografen,
// keine umgelabelten Pressefotos). Bei Marken ohne freies Foto ein neutrales Kaffeefoto, nie die Maschine einer anderen Marke.
import type { Thema } from './themen';

export interface ThemenBild { alt: string; nachweis: string; markenfoto: boolean }

const commons = (datei: string) => `<a href="https://commons.wikimedia.org/wiki/File:${datei}" rel="noopener">Wikimedia Commons</a>`;
const BY_SA_4 = '<a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener">CC BY-SA 4.0</a>';
const BY_2 = '<a href="https://creativecommons.org/licenses/by/2.0/" rel="noopener">CC BY 2.0</a>';

export const THEMEN_BILDER: Record<Thema, ThemenBild> = {
  Pflege: { markenfoto: false, alt: 'Ausgebaute Brühgruppe eines Kaffeevollautomaten',
    nachweis: `Foto: Raimond Spekking, „Philips HD8823 - brewing unit-3024“, ${commons('Philips_HD8823_-_brewing_unit-3024.jpg')}, ${BY_SA_4}, zugeschnitten` },
  DeLonghi: { markenfoto: true, alt: 'De’Longhi Magnifica Kaffeevollautomat',
    nachweis: `Foto: Feťour, „Automatic espresso machine 02“, ${commons('Automatic_espresso_machine_02.JPG')}, gemeinfrei, zugeschnitten` },
  Philips: { markenfoto: true, alt: 'Philips-Kaffeevollautomat der Serie 2000 von vorn',
    nachweis: `Foto: Raimond Spekking, „Philips HD8823-3015“, ${commons('Philips_HD8823-3015.jpg')}, ${BY_SA_4}, zugeschnitten` },
  Siemens: { markenfoto: true, alt: 'Siemens EQ.3 Kaffeevollautomat in einer Küche',
    nachweis: `Foto: Pairmem, „SIEMENS-EQ.3-ESPRESSO-COFFEE-MACHINE“, ${commons('SIEMENS-EQ.3-ESPRESSO-COFFEE-MACHINE.jpg')}, ${BY_SA_4}, zugeschnitten` },
  Jura: { markenfoto: true, alt: 'Jura-Kaffeevollautomat mit Milchbehälter im Geschäft',
    nachweis: `Foto: Phillip Pessar, „$3000 Coffee Machine Sur La Table, Downtown Miami FL“, ${commons('$3000_Coffee_Machine_Sur_La_Table,_Downtown_Miami_FL.jpg')}, ${BY_2}, zugeschnitten` },
  Krups: { markenfoto: true, alt: 'Krups-Kaffeevollautomat mit Display, Nahaufnahme',
    nachweis: `Foto: MichalPL, „Krups Espresso machine“, ${commons('Krups_Espresso_machine.jpg')}, ${BY_SA_4}, zugeschnitten` },
  Melitta: { markenfoto: false, alt: 'Umgekippte Kaffeetasse mit Kaffeebohnen',
    nachweis: `Foto: Christoph, „Coffee beans spilling out of a cup“, ${commons('Coffee_beans_spilling_out_of_a_cup.jpg')}, CC0, zugeschnitten` },
  Tchibo: { markenfoto: false, alt: 'Cappuccino mit Milchschaum in weißer Tasse',
    nachweis: `Foto: Jazzbobrown, „Classic Cappuccino“, ${commons('Classic_Cappuccino.jpg')}, gemeinfrei, zugeschnitten` },
  Gaggia: { markenfoto: true, alt: 'Gaggia-Kaffeevollautomat auf einer Messe, Kaffee läuft in einen Becher',
    nachweis: `Foto: Elizabeth from Lansing, MI, USA, „Gaggia Coffee Machine with Milk Steamer“, ${commons('Gaggia_Coffee_Machine_with_Milk_Steamer_(4437752345).jpg')}, ${BY_2}, zugeschnitten` },
  Sage: { markenfoto: true, alt: 'Sage Barista Pro Siebträgermaschine im Geschäft',
    nachweis: `Foto: Bex.Walton, „Sage Barista Pro at LC“, <a href="https://www.flickr.com/photos/7831824@N04/32589072357" rel="noopener">Flickr</a>, ${BY_2}, zugeschnitten` },
};

// Kachel „Entkalker & Filter“ auf der Startseite
export const PRODUKTE_BILD: ThemenBild = { markenfoto: false, alt: 'Tasse schwarzer Kaffee auf Kaffeebohnen',
  nachweis: `Foto: Toni Cuenca, „Coffee cup on coffee beans“, ${commons('Coffee_cup_on_coffee_beans.jpg')}, CC0, zugeschnitten` };

export const themenBild = (name: Thema, slug: string) => ({
  ...THEMEN_BILDER[name],
  src: `/bilder/marken/${slug}.webp`,
  klein: `/bilder/marken/${slug}-klein.webp`,
});
