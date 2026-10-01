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
  'brennenstuhl-pm231e': {
    name: 'Brennenstuhl Energiemessgerät PM 231 E', marke: 'Brennenstuhl', asin: 'B007459MH6', thema: 'Strom', artikel: 'stromverbrauch-messen',
    kurz: 'Zwischenstecker, der Watt, Verbrauch und Kosten eines Geräts anzeigt. Zwei Stromtarife einstellbar.',
  },
  'thermopro-tp50': {
    name: 'ThermoPro TP50 Hygrometer (2er-Set)', marke: 'ThermoPro', asin: 'B07P996ZKJ', thema: 'Klima', artikel: 'luftfeuchtigkeit-wohnung',
    kurz: 'Digitales Thermo-Hygrometer mit Komfortanzeige und Min-/Max-Werten, im Doppelpack für zwei Räume.',
  },
  'thermopro-tp30': {
    name: 'ThermoPro TP30 Infrarot-Thermometer', marke: 'ThermoPro', asin: 'B0BGGJH3G2', thema: 'Heizung', artikel: 'hydraulischer-abgleich',
    kurz: 'Misst Oberflächentemperaturen per Laser, etwa oben und unten am Heizkörper. Emissionsgrad einstellbar.',
  },
  'tesamoll-p-profil': {
    name: 'tesamoll P-Profil Gummidichtung', marke: 'tesa', asin: 'B000QB303W', thema: 'Klima', artikel: 'fenster-abdichten',
    kurz: 'Selbstklebendes Dichtband für Spalten von etwa 2 bis 5 mm an Fenstern und Türen.',
    passt: 'Erst die Spaltbreite messen: Für größere Spalten gibt es andere Profile.',
  },
  'heimeier-k': {
    name: 'Heimeier Thermostatkopf K', marke: 'IMI Heimeier', asin: 'B002BESA6Y', thema: 'Heizung', artikel: 'thermostatkopf-wechseln',
    kurz: 'Klassischer Thermostatkopf mit Flüssigkeitsfühler für Ventile mit Gewinde M30x1,5.',
    passt: 'Nur für Ventile mit M30x1,5-Gewinde, für andere Ventile Adapter nötig.',
  },
  'ei650-rauchmelder': {
    name: 'Ei Electronics Ei650 Rauchmelder', marke: 'Ei Electronics', asin: 'B007IGQ5SK', thema: 'Sicherheit', artikel: 'rauchmelder-piept',
    kurz: 'Rauchmelder mit fest eingebauter 10-Jahres-Batterie: kein Batteriewechsel, kein nächtliches Piepen wegen leerer Batterie.',
  },
  'dr-beckmann-waschmaschine': {
    name: 'Dr. Beckmann Waschmaschinen Hygiene-Reiniger', marke: 'Dr. Beckmann', asin: 'B082VPYRJH', thema: 'Küche', artikel: 'waschmaschine-reinigen',
    kurz: 'Reiniger für einen Leerlauf-Waschgang gegen Gerüche und Beläge in Trommel und Leitungen.',
  },
  'finish-maschinenpfleger': {
    name: 'Finish Maschinenpfleger (2er-Pack)', marke: 'Finish', asin: 'B013P0SJ5O', thema: 'Küche', artikel: 'spuelmaschine-reinigen',
    kurz: 'Flüssiger Reiniger für einen Leerlauf der Spülmaschine gegen Fett und Kalk.',
  },
  'rowenta-so2320': {
    name: 'Rowenta Heizlüfter Instant Comfort Compact SO2320', marke: 'Rowenta', asin: 'B00MFEHQMO', thema: 'Heizung', artikel: 'heizluefter-oelradiator-infrarot',
    kurz: 'Kompakter Heizlüfter mit 2.000 W, zwei Heizstufen, Thermostat und Frostschutz. Für schnelle Wärme zwischendurch.',
  },
  'delonghi-radia-s': {
    name: "De'Longhi Ölradiator Radia S TRRS0920", marke: "De'Longhi", asin: 'B00ZUUEBOQ', thema: 'Heizung', artikel: 'heizluefter-oelradiator-infrarot',
    kurz: 'Ölradiator mit 2.000 W und drei Leistungsstufen. Leise, gibt die Wärme gleichmäßig und mit Nachwärme ab.',
  },
  'koenighaus-infrarot-600': {
    name: 'Könighaus Infrarotheizung 600 W (Standgerät)', marke: 'Könighaus', asin: 'B01A3L5S3E', thema: 'Heizung', artikel: 'heizluefter-oelradiator-infrarot',
    kurz: 'Mobile Infrarotheizung mit Füßen und Thermostat. Wärmt Personen und Flächen, lautlos, ohne Luftzug.',
    passt: 'Laut Hersteller für etwa 10 bis 18 m². Für größere Räume reicht die Leistung nicht.',
  },
} satisfies Record<string, Produkt>;

export type ProduktId = keyof typeof PRODUKTE;

/** Direkter Amazon-Produktlink mit Partner-Tag. */
export function amazonProdukt(asin: string): string {
  return `https://www.amazon.de/dp/${asin}?tag=${SITE.amazonTag}`;
}
