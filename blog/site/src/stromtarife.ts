// Anbieter dynamischer Stromtarife für den Vergleich /vergleich/dynamische-stromtarife/ und die Rechner.
// Affiliate-Link eintragen: `link` auf die Partner-Adresse setzen. Bleibt `link` leer, führt der Button zur Anbieter-Website (ohne Provision).
// Grundgebühr und Aufschlag sind Anbieter-Anteile in Euro bzw. Cent brutto; Börsenpreis, Netzentgelte, Steuern und Umlagen kommen bei allen gleich dazu.
// `stand` ist das Datum, an dem die Zahl zuletzt geprüft wurde, `quelle` sagt woher. Preise ändern sich oft: alle paar Wochen prüfen.
export interface Stromtarif {
  id: string;
  anbieter: string;
  tarif: string;
  website: string;        // Anbieter-Seite (Fallback ohne Affiliate)
  link?: string;          // Affiliate-Link, wenn vorhanden
  grundgebuehr: number | null;  // € pro Monat, Anbieter-Anteil (null: nur nach PLZ-Eingabe)
  aufschlag: number | null;     // ct pro kWh auf den Börsenpreis, brutto (null: keine Angabe)
  smartMeterPflicht: boolean;   // true: nur mit intelligentem Messsystem
  ohneSmartMeter?: string;      // wie es ohne iMSys trotzdem geht
  laufzeit: string;             // Mindestlaufzeit / Kündigung
  intervall: 'viertelstündlich' | 'stündlich' | 'halbstündlich';
  fuer: ('e-auto' | 'waermepumpe' | 'pv' | 'haushalt')[];  // wofür der Tarif besonders ausgelegt ist
  app?: string;                 // Steuerung, API, Besonderheiten
  limit?: string;               // Preisdeckel o. Ä.
  stand: string;                // JJJJ-MM-TT
  quelle: string;               // woher die Zahlen stammen
}

export const STROMTARIFE: Stromtarif[] = [
  {
    id: 'tibber', anbieter: 'Tibber', tarif: 'Smart Dynamic', website: 'https://tibber.com/de/stromtarif',
    grundgebuehr: 5.99, aufschlag: 2.5, smartMeterPflicht: true,
    ohneSmartMeter: 'Tarif „Simple Fix“ mit Festpreis und 12 Monaten Laufzeit, Wechsel zu Smart Dynamic nach Smart-Meter-Einbau.',
    laufzeit: 'keine Mindestlaufzeit', intervall: 'viertelstündlich', fuer: ['e-auto', 'waermepumpe', 'haushalt'],
    app: 'App mit Echtzeitverbrauch (Tibber Pulse, optional), Wallbox-Steuerung, offene Schnittstelle (evcc).',
    stand: '2026-10-27', quelle: 'tibber.com (Gebühr 5,99 €/Monat, keine Bindung) und stromdiagnose.de, Stand Mai 2026 (Aufschlag)',
  },
  {
    id: 'octopus', anbieter: 'Octopus Energy', tarif: 'Dynamic Octopus', website: 'https://octopusenergy.de/dynamic-octopus',
    grundgebuehr: 7.99, aufschlag: 2.0, smartMeterPflicht: true,
    ohneSmartMeter: 'Bis zum Einbau fester Arbeitspreis; Octopus übernimmt laut Anbieter die Installationskosten des Smart Meters.',
    laufzeit: 'keine Mindestlaufzeit', intervall: 'viertelstündlich', fuer: ['e-auto', 'waermepumpe', 'haushalt'],
    app: 'Preise für den Folgetag ab ca. 17 Uhr im Dashboard, eigene Tarife für Wallbox (Intelligent Octopus) und Wärmepumpe (Octopus Heat).',
    stand: '2026-10-27', quelle: 'octopusenergy.de (15-Minuten-Preise, Smart Meter) und stromdiagnose.de, Stand Mai 2026 (Gebühren)',
  },
  {
    id: 'rabot', anbieter: 'Rabot Energy', tarif: 'rabot.dynamic', website: 'https://www.rabot.energy/',
    grundgebuehr: 9.99, aufschlag: 2.2, smartMeterPflicht: false,
    ohneSmartMeter: 'Geht auch mit altem Zähler: Zählerstand monatlich per App, dann zählt der Monatsdurchschnitt der Börse, Verschieben bringt dann nichts extra.',
    laufzeit: 'monatlich kündbar', intervall: 'stündlich', fuer: ['e-auto', 'haushalt'],
    app: 'App mit Wallbox-Anbindung (OCPP), früher Rabot Charge, auf E-Auto-Laden ausgelegt.',
    stand: '2026-10-27', quelle: 'rabot.energy (Tarife, Kündigung, ohne Smart Meter) und stromdiagnose.de, Stand Mai 2026 (Gebühren)',
  },
  {
    id: 'ostrom', anbieter: 'Ostrom', tarif: 'SimplyDynamic', website: 'https://www.ostrom.de/',
    grundgebuehr: 6.0, aufschlag: 1.8, smartMeterPflicht: true,
    ohneSmartMeter: 'Tarif „SimplyFair“: Preis folgt monatlich dem Markt, Zählerstand von Hand, monatlich kündbar.',
    laufzeit: 'monatlich kündbar', intervall: 'stündlich', fuer: ['e-auto', 'haushalt', 'pv'],
    app: 'Smart-Meter-Bestellung per App, aber nur in Partner-Netzgebieten; offene Kunden-API.',
    stand: '2026-10-27', quelle: 'ostrom.de (Tarife, Kündigung) und stromdiagnose.de, Stand Mai 2026 (Gebühren)',
  },
  {
    id: 'tado', anbieter: 'tado° Energy', tarif: 'Hourly (ehemals aWATTar)', website: 'https://www.tado.com/de-de/',
    grundgebuehr: 12.0, aufschlag: 1.5, smartMeterPflicht: true,
    laufzeit: 'keine Mindestlaufzeit', intervall: 'stündlich', fuer: ['waermepumpe', 'e-auto'],
    app: 'Offene Preis-API (seit aWATTar-Zeiten von vielen Wallboxen und Heizungen unterstützt), Kopplung mit tado°-Thermostaten.',
    stand: '2026-10-27', quelle: 'stromdiagnose.de, Stand Mai 2026',
  },
  {
    id: '1komma5', anbieter: '1KOMMA5°', tarif: 'Dynamic Pulse', website: 'https://1komma5.com/de/',
    grundgebuehr: 14.9, aufschlag: 3.0, smartMeterPflicht: true,
    laufzeit: 'bis 24 Monate im Hardware-Paket', intervall: 'viertelstündlich', fuer: ['pv', 'waermepumpe', 'e-auto'],
    app: 'Energiemanager „Heartbeat“ steuert PV, Speicher, Wallbox und Wärmepumpe automatisch nach Börsenpreis.',
    stand: '2026-10-27', quelle: 'stromdiagnose.de, Stand Mai 2026',
  },
  {
    id: 'enbw', anbieter: 'EnBW', tarif: 'Strom dynamisch', website: 'https://www.enbw.com/strom/dynamischer-stromtarif',
    grundgebuehr: null, aufschlag: null, smartMeterPflicht: true,
    ohneSmartMeter: 'Übergangstarif „Strom Startklar“ bis zum Einbau; EnBW veranlasst den Einbau (bis 100 €, bei 12 Monaten Belieferung übernommen).',
    laufzeit: 'keine lange Bindung, 4 Wochen Kündigungsfrist', intervall: 'stündlich', fuer: ['haushalt', 'e-auto', 'waermepumpe'],
    app: 'Börsenpreis laut EnBW ohne Aufschlag, Grundpreis und fester Preisanteil nach Postleitzahl (Beispiel Stand 08/2024: 17,63 €/Monat, 19,16 ct/kWh fest).',
    stand: '2026-10-27', quelle: 'enbw.com',
  },
  {
    id: 'vattenfall', anbieter: 'Vattenfall', tarif: 'Dynamischer Stromtarif', website: 'https://www.vattenfall.de/strom/tarife/dynamischer-stromtarif',
    grundgebuehr: null, aufschlag: null, smartMeterPflicht: true,
    laufzeit: 'laut Anbieter-AGB', intervall: 'stündlich', fuer: ['haushalt'],
    app: 'Variante „mit Limit“: Höchstpreis als Absicherung gegen Preisspitzen; Preisalarm per E-Mail; monatliche Abrechnung nach Verbrauch.',
    limit: 'Tarifvariante mit Preisdeckel',
    stand: '2026-10-27', quelle: 'vattenfall.de',
  },
];

export const TARIFE_STAND = '27. Oktober 2026';
