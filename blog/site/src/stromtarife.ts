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

// ---------------------------------------------------------------------------------------------------------------
// Spezialtarife mit festem Preis: Autostromtarife (Wallbox) und Wärmepumpentarife. Vergleich unter /vergleich/autostromtarife/
// und /vergleich/waermepumpentarife/. Preise sind regional verschieden (Netzentgelte), deshalb steht bei vielen „nach PLZ“.
// Affiliate-Link: `link` setzen, sonst führt der Button zur Anbieter-Website.
export type TarifArt = 'eigener-zaehler' | 'haushalt-bonus' | 'zeitvariabel' | 'dynamisch';
export interface Spezialtarif {
  id: string;
  anbieter: string;
  tarif: string;
  website: string;
  link?: string;
  art: TarifArt;                 // eigener Zähler (§ 14a Modul 2), Haushaltstarif mit Bonus, zeitvariabel, dynamisch
  arbeitspreis: number | null;   // ct/kWh brutto, Beispielwert laut Quelle (null: nur nach PLZ)
  grundpreis: number | null;     // € pro Monat (null: nur nach PLZ)
  laufzeit: string;
  voraussetzung: string;         // Zähler, Smart Meter, Wallbox-Steuerung, Region
  bonus?: string;                // Ladeguthaben, Rabatt, Besonderheit
  stand: string;                 // JJJJ-MM-TT
  quelle: string;
}
export const TARIFART_TEXT: Record<TarifArt, string> = {
  'eigener-zaehler': 'eigener Zähler, reduzierte Netzentgelte (§ 14a Modul 2)',
  'haushalt-bonus': 'Haushaltstarif mit Bonus (Laden, Wärmepumpe, Speicher)',
  zeitvariabel: 'zeitvariabel (günstige Zeitfenster)',
  dynamisch: 'dynamisch (Börsenpreis) mit smartem Laden',
};

export const WAERMEPUMPENSTROM: Spezialtarif[] = [
  { id: 'vattenfall-waermestrom', anbieter: 'Vattenfall', tarif: 'Wärmestrom', website: 'https://www.vattenfall.de/strom/tarife/waermepumpen-stromtarife',
    art: 'eigener-zaehler', arbeitspreis: null, grundpreis: null, laufzeit: '12 oder 24 Monate Preisgarantie (Tarifvarianten)',
    voraussetzung: 'eigener Zähler für die Wärmepumpe', bonus: '100 % Ökostrom, Sofort- und Treuebonus laut Anbieter', stand: '2026-11-02', quelle: 'vattenfall.de, Preise nur im Tarifrechner' },
  { id: 'enbw-waermestrom', anbieter: 'EnBW', tarif: 'Wärmestrom', website: 'https://www.enbw.com/waermestrom/privatkunden/produkte/beratung',
    art: 'eigener-zaehler', arbeitspreis: null, grundpreis: null, laufzeit: 'je nach Tarif (Tariffinder)',
    voraussetzung: 'eigener, vom Netzbetreiber zugelassener Wärmestromzähler; bei gemeinsamer Messung kein Wärmestromtarif', bonus: 'Laut EnBW oft geringere Konzessionsabgabe, keine Offshore- und KWKG-Umlage bei separatem Zähler', stand: '2026-11-02', quelle: 'enbw.com, Preise nur nach PLZ' },
  { id: 'lichtblick-waermestrom', anbieter: 'LichtBlick', tarif: 'WärmeStrom', website: 'https://www.lichtblick.de/waermestrom/',
    art: 'eigener-zaehler', arbeitspreis: null, grundpreis: null, laufzeit: 'laut Anbieter „klare Vertragsbedingungen“, Details im Tarifrechner',
    voraussetzung: 'eigener Zähler', bonus: '§ 14a-Netzentgeltreduzierung wird laut LichtBlick im Tarif automatisch berücksichtigt', stand: '2026-11-02', quelle: 'lichtblick.de, Preise nur im Tarifrechner' },
  { id: 'octopus-heat', anbieter: 'Octopus Energy', tarif: 'Octopus Heat', website: 'https://octopusenergy.de/octopus-heat',
    art: 'zeitvariabel', arbeitspreis: null, grundpreis: null, laufzeit: '24 Monate Preisgarantie (ohne Steuern und Umlagen)',
    voraussetzung: 'Smart Meter (Einbau laut Anbieter kostenlos), eigener Zähler optional', bonus: 'Drei Preiszonen: günstig 2 bis 6 und 12 bis 16 Uhr, hoch 18 bis 21 Uhr. Messentgelt laut Anbieter 35 €/Jahr im Grundpreis enthalten.', stand: '2026-11-02', quelle: 'octopusenergy.de, Arbeitspreis erst nach PLZ-Eingabe' },
  { id: 'enbw-sparzeit', anbieter: 'EnBW', tarif: 'SparZeit', website: 'https://www.enbw.com/strom/intelligente-tarife',
    art: 'zeitvariabel', arbeitspreis: null, grundpreis: null, laufzeit: '12 Monate Netto-Preisgarantie',
    voraussetzung: 'Smart Meter (EnBW übernimmt laut Anbieter bis 100 € Einbaukosten bei mindestens 12 Monaten Bezug)', bonus: 'Günstige Zeitfenster für Wärmepumpe und Wallbox', stand: '2026-11-02', quelle: 'enbw.com, Preise nur nach PLZ' },
  { id: 'tibber-waermepumpe', anbieter: 'Tibber', tarif: 'Smart Dynamic', website: 'https://tibber.com/de/stromtarif',
    art: 'dynamisch', arbeitspreis: null, grundpreis: null, laufzeit: 'keine Mindestlaufzeit, 14 Tage Kündigungsfrist',
    voraussetzung: 'Smart Meter; Wärmepumpe über kompatibles Thermostat (Sensibo, Ngenic) steuerbar', bonus: 'Börsenpreis je Viertelstunde plus Tibber-Gebühr (laut FAQ 5,99 €/Monat); kein eigener Wärmepumpentarif', stand: '2026-11-02', quelle: 'tibber.com' },
  { id: 'spotmyenergy-smartfix', anbieter: 'spotmyenergy', tarif: 'Wärmepumpentarif SmartFix (angekündigt)', website: 'https://www.spotmyenergy.de/',
    art: 'haushalt-bonus', arbeitspreis: null, grundpreis: null, laufzeit: 'Anmeldung ab 1. Dezember 2026, Start Anfang 2027',
    voraussetzung: 'Smart Meter, steuerbare Wärmepumpe über das Energiemanagement des Anbieters', bonus: 'Festpreis plus Bonus laut Ankündigung: 6 ct/kWh für eine steuerbare Wärmepumpe, 10 ct/kWh für steuerbares Laden oder Speicher', stand: '2026-11-02', quelle: 'pv-magazine.de vom 02.11.2026 (Ankündigung, Eigenangaben des Anbieters)' },
];
export const AUTOSTROM: Spezialtarif[] = [
  { id: 'naturstrom-emobil', anbieter: 'naturstrom', tarif: 'naturstrom e mobil', website: 'https://www.naturstrom.de/privatkunden/mobilitaet/naturstrom-emobil',
    art: 'haushalt-bonus', arbeitspreis: 29.9, grundpreis: null, laufzeit: 'Preisgarantie bis 31.12.2027 bei Abschluss bis 31.12.2026',
    voraussetzung: 'vollelektrischer Pkw oder Leicht-Kfz, überwiegend zu Hause geladen (Zulassungsbescheinigung Teil 1 hochladen); läuft über den vorhandenen Zähler',
    bonus: 'Reduzierter Arbeitspreis gilt für den ganzen Haushaltsstrom, kein Zweitzähler nötig', stand: '2026-11-02', quelle: 'naturstrom.de (29,90 ct/kWh laut Tarifseite, Grundpreis nur im Tarifrechner)' },
  { id: 'enbw-strom-wallbox', anbieter: 'EnBW', tarif: 'Strom Wallbox', website: 'https://www.enbw.com/elektromobilitaet/zuhause-laden/enbw-strom-wallbox',
    art: 'eigener-zaehler', arbeitspreis: null, grundpreis: null, laufzeit: 'Netto-Preisgarantie bis 18 Monate',
    voraussetzung: 'separater, steuerbarer Zähler für die Wallbox (§ 14a, Rundsteuerempfänger); Installation nicht enthalten',
    bonus: '50 € Ladeguthaben laut Tarifseite (3 Jahre gültig), 25 € Rabatt auf eine Wallbox im EnBW-Shop', stand: '2026-11-02', quelle: 'enbw.com, Preise nur im Tarifrechner' },
  { id: 'enbw-flexbonus', anbieter: 'EnBW', tarif: 'Haushaltsstrom mit FlexBonus', website: 'https://www.enbw.com/elektromobilitaet/zuhause-laden',
    art: 'haushalt-bonus', arbeitspreis: null, grundpreis: null, laufzeit: 'je nach gewähltem Stromtarif',
    voraussetzung: 'kompatibles E-Auto, App EnBW Mavi, intelligentes Laden mit mindestens zwei gesteuerten Ladevorgängen pro Monat im ersten Jahr',
    bonus: '100 € einmalig nach 12 Belieferungsmonaten', stand: '2026-11-02', quelle: 'enbw.com' },
  { id: 'lichtblick-eauto', anbieter: 'LichtBlick', tarif: 'ÖkoStrom E-Auto', website: 'https://www.lichtblick.de/e-mobilitaet/e-auto-zuhause-laden/',
    art: 'haushalt-bonus', arbeitspreis: null, grundpreis: null, laufzeit: 'laut Tarifrechner',
    voraussetzung: 'ein Zähler für Haushalt und E-Auto, kein Zweitzähler',
    bonus: '§ 14a-Netzentgeltreduzierung (Modul 1) wird laut LichtBlick bei gemeinsamer Messung automatisch berücksichtigt', stand: '2026-11-02', quelle: 'lichtblick.de, Preise nur im Tarifrechner' },
  { id: 'tibber-simple-fix', anbieter: 'Tibber', tarif: 'Simple Fix mit Ladebonus', website: 'https://tibber.com/de',
    art: 'haushalt-bonus', arbeitspreis: null, grundpreis: null, laufzeit: '12 Monate Laufzeit und Preisgarantie, danach monatlich kündbar',
    voraussetzung: 'Tarif auch ohne Smart Meter; der Ladebonus braucht einen Smart Meter',
    bonus: 'Ladebonus laut Tibber 7 Cent je geladener Stunde, bis zu 15 € im Monat (Werbeangabe „bis zu 180 € im Jahr“); Wechselbonus 2026: 100 € Guthaben mit E-Auto oder Speicher', stand: '2026-11-02', quelle: 'tibber.com, Preise nur im Tarifrechner' },
  { id: 'octopus-intelligent', anbieter: 'Octopus Energy', tarif: 'Intelligent Octopus E-Auto', website: 'https://www.octopusenergy.de/intelligent-octopus/e-auto',
    art: 'haushalt-bonus', arbeitspreis: null, grundpreis: null, laufzeit: 'laut Tarifrechner',
    voraussetzung: 'Smart Meter (Einbau laut Anbieter kostenlos, in der Regel innerhalb von 3 Monaten, danach 2 bis 3 Monate Konfiguration); kompatibles E-Auto oder Wallbox',
    bonus: 'SmartConnect-Bonus 12 ct/kWh auf smart geladene Kilowattstunden, vor Aktivierung des Smart Meters 6 ct/kWh', stand: '2026-11-02', quelle: 'octopusenergy.de, fester Arbeitspreis nur nach PLZ' },
  { id: 'tibber-smart-dynamic', anbieter: 'Tibber', tarif: 'Smart Dynamic', website: 'https://tibber.com/de/stromtarif',
    art: 'dynamisch', arbeitspreis: null, grundpreis: null, laufzeit: 'keine Mindestlaufzeit, 14 Tage Kündigungsfrist',
    voraussetzung: 'Smart Meter (über Partner inexogy oder metrify; mit E-Auto, Wallbox, PV oder Speicher laut Tibber kostenlos)',
    bonus: 'Börsenpreis je Viertelstunde plus Tibber-Gebühr (laut FAQ 5,99 €/Monat); Wechselbonus 2026: 100 € mit E-Auto oder Speicher', stand: '2026-11-02', quelle: 'tibber.com' },
  { id: 'octopus-dynamic', anbieter: 'Octopus Energy', tarif: 'dynamicOctopus', website: 'https://www.octopusenergy.de/dynamic-octopus',
    art: 'dynamisch', arbeitspreis: null, grundpreis: null, laufzeit: 'keine Mindestlaufzeit',
    voraussetzung: 'Smart Meter, Installationskosten übernimmt laut Anbieter Octopus',
    bonus: '15-Minuten-Preise (Day-Ahead), monatliche Abrechnung ohne Abschlag', stand: '2026-11-02', quelle: 'octopusenergy.de, Grundgebühr und Aufschlag nur im Tarifrechner' },
  { id: 'naturstrom-smart', anbieter: 'naturstrom', tarif: 'naturstrom smart', website: 'https://www.naturstrom.de/privatkunden/oekostrom/naturstrom-smart',
    art: 'dynamisch', arbeitspreis: null, grundpreis: null, laufzeit: 'keine Mindestlaufzeit, 4 Wochen Kündigungsfrist',
    voraussetzung: 'Smart Meter, Einbau laut Anbieter kostenlos buchbar',
    bonus: 'Börsenpreis 1:1 plus Servicepauschale (Betrag nur im Tarifrechner)', stand: '2026-11-02', quelle: 'naturstrom.de' },
];
export const SPEZIAL_STAND = '2. November 2026';
