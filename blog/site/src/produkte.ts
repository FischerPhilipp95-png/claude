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
  'sonello-plissee': {
    name: 'Sonello Plissee Klemmfix', marke: 'Sonello', asin: 'B0816L1M5X', thema: 'Klima', artikel: 'plissee-ohne-bohren',
    kurz: 'Plissee zum Klemmen: Sicht- und Sonnenschutz ohne Bohren, ideal für Mietwohnungen.',
    passt: 'Für Dreh-Kipp-Fenster mit Flügelrahmen. Breite nach Glasbreite wählen.',
  },
  'siemens-tz80002a': {
    name: 'Siemens Entkalkungstabletten TZ80002A', marke: 'Siemens', asin: 'B07WWGKRHL', thema: 'Küche', artikel: 'siemens-kaffeevollautomat-entkalken',
    kurz: 'Original-Entkalker für Siemens-Kaffeevollautomaten der EQ-Serie.',
    passt: 'Laut Händlerangaben für EQ-Serie, surpresso und Siemens-Einbauvollautomaten.',
  },
  'delonghi-ecodecalk': {
    name: "De'Longhi EcoDecalk", marke: "De'Longhi", asin: 'B008YETL18', thema: 'Küche', artikel: 'delonghi-kaffeevollautomat-entkalken',
    kurz: "Flüssiger Original-Entkalker für De'Longhi-Kaffeevollautomaten und Siebträger.",
  },
  'jura-reinigungstabletten': {
    name: 'JURA 3-Phasen-Reinigungstabletten', marke: 'JURA', asin: 'B09F98MMVC', thema: 'Küche', artikel: 'jura-kaffeevollautomat-reinigen',
    kurz: 'Für das Reinigungsprogramm: entfernt Kaffeefett aus Brüheinheit und Leitungen.',
  },
  'jura-claris-smart': {
    name: 'JURA CLARIS Smart+ Filterpatrone', marke: 'JURA', asin: 'B0BF9W3WC4', thema: 'Küche', artikel: 'jura-kaffeevollautomat-reinigen',
    kurz: 'Wasserfilter mit automatischer Filtererkennung, damit seltener entkalkt werden muss.',
    passt: 'Nur für JURA-Geräte, die für CLARIS Smart ausgelegt sind. Steht in der Anleitung.',
  },
  'philips-aquaclean': {
    name: 'Philips AquaClean CA6903', marke: 'Philips', asin: 'B074M9DZ4M', thema: 'Küche', artikel: 'philips-aquaclean-filter',
    kurz: 'Kalk- und Wasserfilter für Philips- und Saeco-Vollautomaten mit AquaClean.',
    passt: 'Nur für Geräte mit AquaClean-Filteranschluss.',
  },
  'philips-dampfglaetter': {
    name: 'Philips Dampfglätter 3000 Serie', marke: 'Philips', asin: 'B0CTS1WBTH', thema: 'Küche', artikel: 'dampfglaetter-richtig-benutzen',
    kurz: 'Kompakter Hand-Dampfglätter: Falten am Bügel glätten, ohne Bügelbrett.',
  },
  'auvon-nachtlicht': {
    name: 'AUVON Nachtlicht mit Bewegungsmelder', marke: 'AUVON', asin: 'B0C3M5MS3N', thema: 'Strom', artikel: 'licht-mit-bewegungsmelder',
    kurz: 'Steckdosen-Nachtlicht, das nur bei Dunkelheit und Bewegung angeht.',
  },
  'gritin-schranklicht': {
    name: 'Gritin LED-Schrankleuchte mit Bewegungsmelder', marke: 'Gritin', asin: 'B0F1C56SR1', thema: 'Strom', artikel: 'licht-mit-bewegungsmelder',
    kurz: 'Akku-Leuchte für Schrank, Küche und Flur, ohne Kabel und ohne Elektriker.',
  },
  'eqm-isopropanol': {
    name: 'EQM Isopropanol 99,9 %', marke: 'EQM', asin: 'B0DJKGG8P6', thema: 'Küche', artikel: 'isopropanol-im-haushalt',
    kurz: 'Reiner Alkohol zum Entfetten und Reinigen. Verdünnt auf 70 % auch gegen kleine Schimmelflecken.',
    passt: 'Leicht entzündlich. Gut lüften, nicht auf Acrylglas oder empfindlichem Lack verwenden.',
  },
  'ninja-fruchtfliegenfalle': {
    name: 'Super Ninja Fruchtfliegenfalle', marke: 'Super Ninja', asin: 'B0963J155G', thema: 'Küche', artikel: 'fruchtfliegen-loswerden',
    kurz: 'Fertige Falle mit Lockstoff gegen Fruchtfliegen in Küche und an der Obstschale.',
  },
  'anwerk-schlupfwespen': {
    name: 'anwerk Schlupfwespen gegen Lebensmittelmotten', marke: 'anwerk', asin: 'B0CQ592KD2', thema: 'Küche', artikel: 'lebensmittelmotten-loswerden',
    kurz: 'Nützlinge auf Kärtchen, die Motteneier unschädlich machen. Mit Pheromonfalle zur Kontrolle.',
    passt: 'Lebende Tiere: Lieferung bald nach Erhalt auslegen, nicht zusammen mit Insektensprays verwenden.',
  },
  'iniu-usbc-kabel': {
    name: 'INIU USB-C-Schnellladekabel (geflochten)', marke: 'INIU', asin: 'B0BR3L78XN', thema: 'Strom', artikel: 'handy-laedt-langsam',
    kurz: 'Robustes, geflochtenes Ladekabel. Ersetzt ausgeleierte oder zu schwache Kabel.',
    passt: 'Stecker (USB-C oder USB-A) und maximale Watt-Zahl auf der Produktseite mit deinem Netzteil vergleichen.',
  },
  'hama-steckdosenleiste': {
    name: 'Hama Steckdosenleiste Save Energy mit Schalter', marke: 'Hama', asin: 'B00006JCUB', thema: 'Strom', artikel: 'standby-stromfresser',
    kurz: 'Mehrfachsteckdose mit Schalter: Fernseher, Konsole und Co. mit einem Klick komplett vom Netz.',
    passt: 'Nicht für Heizlüfter oder andere Geräte mit hoher Leistung, keine Leisten hintereinander stecken.',
  },
  'hansgrohe-pulsify': {
    name: 'hansgrohe Pulsify Handbrause EcoSmart', marke: 'hansgrohe', asin: 'B09S151KNJ', thema: 'Wasser', artikel: 'sparduschkopf',
    kurz: 'Handbrause mit Durchflussbegrenzer: weniger Wasser und weniger Warmwasser-Energie beim Duschen.',
    passt: 'Passt auf übliche Brauseschläuche mit 1/2-Zoll-Anschluss. Bei älteren hydraulischen Durchlauferhitzern vorher prüfen, ob der Durchfluss zum Einschalten reicht.',
  },
  'blink-tuerklingel': {
    name: 'Blink Video-Türklingel (Outdoor)', marke: 'Blink', asin: 'B0GZQBXNP4', thema: 'Sicherheit', artikel: 'video-tuerklingel-erlaubt',
    kurz: 'Türklingel mit Kamera und Gegensprechen per App, mit Batterie oder an der vorhandenen Klingelleitung.',
    passt: 'Kamera nur auf den eigenen Eingangsbereich richten. Im Mehrfamilienhaus vorher mit Vermieter klären.',
  },
  'brennenstuhl-rauchmelder': {
    name: 'Brennenstuhl Rauchmelder mit austauschbarer Batterie', marke: 'Brennenstuhl', asin: 'B07N2259FJ', thema: 'Sicherheit', artikel: 'rauchmelder-anbringen',
    kurz: 'Rauchmelder für Wohnräume mit lautem Warnton und wechselbarer Batterie.',
    passt: 'Auf das Prüfzeichen nach DIN EN 14604 achten. Batterie und Funktion regelmäßig testen.',
  },
  'wago-221-413': {
    name: 'WAGO 221-413 Verbindungsklemmen (50 Stück)', marke: 'WAGO', asin: 'B00JB3U9CG', thema: 'Strom', artikel: 'wago-klemmen',
    kurz: 'Hebelklemmen für drei Leiter: Drähte ohne Werkzeug sicher verbinden, zum Beispiel beim Lampenanschluss.',
    passt: 'Für Leiter von 0,2 bis 4 mm². Arbeiten an der Elektroinstallation nur spannungsfrei und im Zweifel durch die Elektrofachkraft.',
  },
} satisfies Record<string, Produkt>;

export type ProduktId = keyof typeof PRODUKTE;

/** Direkter Amazon-Produktlink mit Partner-Tag. */
export function amazonProdukt(asin: string): string {
  return `https://www.amazon.de/dp/${asin}?tag=${SITE.amazonTag}`;
}
