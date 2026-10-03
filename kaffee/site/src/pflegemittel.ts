// Pflegemittel je Marke für den Kasten „Pflege für deine …“ auf den Maschinenseiten (Amazon-Suchlinks mit Partner-Tag).
// Schlüssel = angezeigte Marke (markenname aus maschinen.json, sonst Thema). Bewusst Suchlinks statt fester Produkte:
// Welches Mittel genau passt, steht in der Anleitung der Maschine, und die Suche zeigt die passenden Varianten.
// Keine Kompatibilität behaupten, die nicht belegt ist.
interface Mittel { name: string; warum: string; suche: string }

export const PFLEGEMITTEL: Record<string, Mittel[]> = {
  'De’Longhi': [
    { name: 'De’Longhi EcoDecalk (Entkalker)', warum: 'Laut Bedienungsanleitung nur De’Longhi-Entkalker verwenden, sonst kann die Garantie entfallen.', suche: "De'Longhi EcoDecalk Entkalker" },
    { name: 'De’Longhi Wasserfilter', warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: "De'Longhi Wasserfilter Kaffeevollautomat" },
  ],
  Philips: [
    { name: 'Philips Entkalker für Kaffeevollautomaten', warum: 'Der Entkalker, den Philips für seine Vollautomaten vorsieht.', suche: 'Philips Entkalker Kaffeevollautomat' },
    { name: 'Philips AquaClean Filter', warum: 'Für Geräte mit AquaClean-Anschluss: bis zu einige Tausend Tassen ohne Entkalken.', suche: 'Philips AquaClean Filter' },
    { name: 'Fett für die Brühgruppe', warum: 'Die Brühgruppe läuft leichter und hält länger.', suche: 'Philips Saeco Fett Brühgruppe' },
  ],
  Saeco: [
    { name: 'Saeco Entkalker', warum: 'Der Entkalker, den Saeco für seine Vollautomaten vorsieht.', suche: 'Saeco Entkalker Kaffeevollautomat' },
    { name: 'Saeco Wasserfilter', warum: 'Welcher Filter passt (INTENZA+ oder AquaClean), steht in der Anleitung.', suche: 'Saeco Wasserfilter Kaffeevollautomat' },
    { name: 'Fett für die Brühgruppe', warum: 'Die Brühgruppe läuft leichter und hält länger.', suche: 'Philips Saeco Fett Brühgruppe' },
  ],
  Siemens: [
    { name: 'Siemens Entkalkungstabletten', warum: 'Original-Entkalker für die EQ-Serie.', suche: 'Siemens Entkalkungstabletten TZ80002A' },
    { name: 'Siemens Reinigungstabletten', warum: 'Für das Reinigungsprogramm der Maschine.', suche: 'Siemens Reinigungstabletten Kaffeevollautomat' },
    { name: 'Siemens Wasserfilter', warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: 'Siemens Wasserfilter Kaffeevollautomat' },
  ],
  Bosch: [
    { name: 'Bosch Entkalkungstabletten', warum: 'Original-Entkalker für Bosch-Vollautomaten.', suche: 'Bosch Entkalkungstabletten Kaffeevollautomat' },
    { name: 'Bosch Reinigungstabletten', warum: 'Für das Reinigungsprogramm der Maschine.', suche: 'Bosch Reinigungstabletten Kaffeevollautomat' },
    { name: 'Bosch Wasserfilter', warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: 'Bosch Wasserfilter Kaffeevollautomat' },
  ],
  Jura: [
    { name: 'Jura Reinigungstabletten', warum: 'Für das Reinigungsprogramm: entfernt Kaffeefett aus Brüheinheit und Leitungen.', suche: 'Jura Reinigungstabletten' },
    { name: 'Jura Filterpatrone', warum: 'Welche Patrone passt (CLARIS Smart, Blue …), steht in der Anleitung.', suche: 'Jura Filterpatrone' },
    { name: 'Jura Milchsystem-Reiniger', warum: 'Für Geräte mit Milchsystem.', suche: 'Jura Milchsystem Reiniger' },
  ],
  Melitta: [
    { name: 'Melitta Entkalker', warum: 'Der Entkalker, den Melitta für seine Vollautomaten vorsieht.', suche: 'Melitta Perfect Clean Entkalker Kaffeevollautomat' },
    { name: 'Melitta Wasserfilter', warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: 'Melitta Pro Aqua Wasserfilter' },
    { name: 'Melitta Milchsystem-Reiniger', warum: 'Für Geräte mit Milchsystem.', suche: 'Melitta Perfect Clean Milchsystem Reiniger' },
  ],
  Krups: [
    { name: 'Krups Entkalker', warum: 'Der Entkalker, den Krups für seine Vollautomaten vorsieht.', suche: 'Krups Entkalker Kaffeevollautomat' },
    { name: 'Krups Wasserfilter', warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: 'Krups Claris Wasserfilter' },
  ],
};

/** Allgemeine Mittel für Marken ohne eigene Liste (Tchibo, Gaggia, Sage …). */
export const pflegemittelFuer = (marke: string): Mittel[] => PFLEGEMITTEL[marke] ?? [
  { name: `${marke} Entkalker`, warum: 'Am besten das Mittel, das in deiner Bedienungsanleitung steht.', suche: `${marke} Entkalker` },
  { name: `${marke} Wasserfilter`, warum: 'Seltener entkalken. Ob dein Modell einen Filter nutzt, steht in der Anleitung.', suche: `${marke} Wasserfilter` },
];
