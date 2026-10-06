// Vollautomat-Diagnose (/rechner/vollautomat-diagnose/). Ursachen und Abhilfen aus den Störungstabellen der Hersteller
// (De'Longhi Bedienungsanleitung ECAM29X, Kapitel „Problemlösung“; Siemens Kundendienst EQ.6 plus und „Kaffee schmeckt sauer
// oder bitter“) sowie den Anleitungen dieser Website. Quellen stehen auf der Seite. Aufbau und Regeln: src/diagnose.ts.
import type { Diagnose, Ergebnis, Frage } from '../diagnose';

const fragen: Record<string, Frage> = {
  start: {
    frage: 'Was stimmt nicht mit deinem Kaffeevollautomaten?',
    optionen: [
      { key: 'geschmack', icon: 'coffee', text: 'Der Kaffee schmeckt nicht (dünn, sauer, bitter)', frage: 'geschmack' },
      { key: 'kalt', icon: 'thermometer', text: 'Der Kaffee ist nicht heiß genug', ergebnis: 'nicht-heiss' },
      { key: 'langsam', icon: 'hourglass', text: 'Der Kaffee läuft langsam oder gar nicht', frage: 'langsam' },
      { key: 'milch', icon: 'milk', text: 'Der Milchschaum klappt nicht', frage: 'milch' },
      { key: 'wasser', icon: 'droplet-off', text: 'Kein Wasser, rote Lampen blinken', ergebnis: 'kein-wasser' },
      { key: 'schwankt', icon: 'shuffle', text: 'Der Kaffee ist mal gut, mal schlecht', ergebnis: 'kalk' },
      { key: 'pfuetze', icon: 'droplets', text: 'Wasser unter der Maschine oder Dampf aus der Abtropfschale', ergebnis: 'abtropfschale' },
    ],
  },
  geschmack: {
    frage: 'Wie schmeckt der Kaffee?',
    optionen: [
      { key: 'duenn', text: 'Dünn und wässrig, mit wenig Crema', ergebnis: 'duenn' },
      { key: 'sauer', text: 'Sauer', ergebnis: 'sauer' },
      { key: 'bitter', text: 'Bitter', ergebnis: 'bitter' },
      { key: 'verbrannt', text: 'Verbrannt', ergebnis: 'verbrannt' },
      { key: 'crema', text: 'Er hat gar keine Crema', ergebnis: 'crema' },
    ],
  },
  langsam: {
    frage: 'Was passiert genau?',
    optionen: [
      { key: 'tropfen', text: 'Der Kaffee kommt nur langsam oder tröpfchenweise', ergebnis: 'zu-fein' },
      { key: 'einseitig', text: 'Aus einem der beiden Ausgüsse kommt nichts', ergebnis: 'duesen' },
      { key: 'nichts', text: 'Die Maschine arbeitet, aber es kommt kein Kaffee', ergebnis: 'kein-kaffee' },
      { key: 'filter', text: 'Seit dem Filterwechsel läuft das Wasser schlecht', ergebnis: 'filter-luft' },
    ],
  },
  milch: {
    frage: 'Welche Milch nimmst du?',
    optionen: [
      { key: 'kalt', text: 'Kuhmilch direkt aus dem Kühlschrank', ergebnis: 'milchsystem' },
      { key: 'warm', text: 'Kuhmilch, die nicht ganz kalt ist oder sehr wenig Fett hat', ergebnis: 'milch-eignung' },
      { key: 'pflanze', text: 'Hafer-, Soja- oder einen anderen Pflanzendrink', ergebnis: 'pflanzendrink' },
    ],
  },
};

const A = {
  maschinen: ['/maschinen/', 'Anleitungen für deine Maschine'],
  entkalken: ['/artikel/kaffeevollautomat-entkalken/', 'Kaffeevollautomat entkalken: richtig, und warum nicht mit Essig'],
  delonghiEntkalken: ['/artikel/delonghi-kaffeevollautomat-entkalken/', 'De’Longhi entkalken mit EcoDecalk'],
  siemensEntkalken: ['/artikel/siemens-kaffeevollautomat-entkalken/', 'Siemens EQ entkalken'],
  magnifica: ['/artikel/delonghi-magnifica-s-kein-wasser/', 'De’Longhi Magnifica S: kein Wasser, 6 Lösungen'],
  jura: ['/artikel/jura-kaffeevollautomat-reinigen/', 'Jura reinigen und Filter wechseln'],
  aquaclean: ['/artikel/philips-aquaclean-filter/', 'Philips AquaClean Filter einsetzen'],
} satisfies Record<string, [string, string]>;
const MAHLGRAD = 'Den Mahlgrad nur verstellen, während das Mahlwerk läuft. Die Wirkung siehst du erst nach mindestens zwei Kaffees.';
const ANLEITUNG = 'Wo Mahlgrad, Temperatur und Programme sitzen, steht in der Anleitung deines Modells.';

const ergebnisse: Record<string, Ergebnis> = {
  'nicht-heiss': {
    titel: 'Tassen kalt, Leitungen abgekühlt oder Temperatur zu niedrig', stufe: 'selbst',
    ursache: 'Laut De’Longhi sind die häufigsten Gründe: Die Tassen wurden nicht vorgewärmt, die Leitungen in der Maschine sind seit dem letzten Kaffee abgekühlt, die eingestellte Kaffeetemperatur ist zu niedrig, oder die Maschine muss entkalkt werden.',
    schritte: [
      'Tassen vorwärmen: mit heißem Wasser ausspülen, zum Beispiel über die Heißwasser-Funktion.',
      'Sind seit dem letzten Kaffee zwei bis drei Minuten vergangen, vorher einen Spülvorgang starten. Das heizt die Leitungen vor.',
      'Im Menü eine höhere Kaffeetemperatur einstellen.',
      'Hilft das nicht: entkalken und prüfen, ob die Wasserhärte in der Maschine richtig eingestellt ist.',
    ],
    artikel: [A.entkalken, A.maschinen],
  },
  duenn: {
    titel: 'Zu grob gemahlen, falsche oder alte Bohnen', stufe: 'selbst',
    ursache: 'Dünner Kaffee mit wenig Crema ist laut De’Longhi meist zu grob gemahlen. Weitere Gründe: Die Bohnen eignen sich nicht für Espresso, oder die Packung ist schon zu lange offen und der Kaffee hat sein Aroma verloren.',
    schritte: [
      'Mahlgrad eine Stufe feiner stellen. ' + MAHLGRAD,
      'Kaffee für Espressomaschinen verwenden.',
      'Frische Bohnen nehmen, eine offene Packung nicht zu lange stehen lassen.',
      'Nutzt du gemahlenen Kaffee und er ist wässrig: Laut De’Longhi ist dann oft der Einfüllschacht für Kaffeepulver verstopft. Klappe öffnen und den Schacht mit einem Pinsel reinigen.',
    ],
    hinweis: ANLEITUNG,
    artikel: [A.maschinen],
  },
  sauer: {
    titel: 'Zu grob gemahlen oder zu helle Röstung', stufe: 'selbst',
    ursache: 'Sauer schmeckender Kaffee ist laut Siemens meist zu grob gemahlen. Auch eine zu helle Röstung kann der Grund sein.',
    schritte: [
      'Mahlgrad feiner stellen. ' + MAHLGRAD,
      'Eine stärkere, also dunklere Röstung probieren.',
    ],
    hinweis: ANLEITUNG,
    artikel: [A.maschinen],
  },
  bitter: {
    titel: 'Zu fein gemahlen oder ungeeignete Sorte', stufe: 'selbst',
    ursache: 'Bitterer Kaffee ist laut Siemens meist zu fein gemahlen. Passt der Mahlgrad, kann die Kaffeesorte der Grund sein.',
    schritte: [
      'Mahlgrad gröber stellen. ' + MAHLGRAD,
      'Eine andere Kaffeesorte probieren.',
    ],
    hinweis: ANLEITUNG,
    artikel: [A.maschinen],
  },
  verbrannt: {
    titel: 'Brühtemperatur zu hoch oder zu fein gemahlen', stufe: 'selbst',
    ursache: 'Schmeckt der Kaffee verbrannt, ist laut Siemens die Brühtemperatur zu hoch oder der Mahlgrad zu fein.',
    schritte: [
      'Im Menü eine niedrigere Kaffeetemperatur einstellen.',
      'Mahlgrad gröber stellen. ' + MAHLGRAD,
    ],
    hinweis: ANLEITUNG,
    artikel: [A.maschinen],
  },
  crema: {
    titel: 'Keine Crema: Bohnen, Mahlgrad oder Sorte', stufe: 'selbst',
    ursache: 'Fehlt die Crema, sind die Bohnen laut Siemens oft nicht mehr frisch geröstet, der Mahlgrad passt nicht zu den Bohnen, oder die Sorte eignet sich nicht.',
    schritte: [
      'Frische Bohnen verwenden.',
      'Mahlgrad feiner stellen. ' + MAHLGRAD,
      'Eine Kaffeesorte mit höherem Anteil an Robusta-Bohnen probieren.',
    ],
    hinweis: ANLEITUNG,
    artikel: [A.maschinen],
  },
  'zu-fein': {
    titel: 'Zu fein gemahlen oder verkalkt', stufe: 'selbst',
    ursache: 'Läuft der Kaffee nur langsam oder tröpfchenweise, ist er laut De’Longhi und Siemens meist zu fein gemahlen. Siemens nennt außerdem starke Kalkablagerungen.',
    schritte: [
      'Mahlgrad gröber stellen. ' + MAHLGRAD,
      'Verwendest du gemahlenen Kaffee, ein gröberes Pulver nehmen.',
      'Hilft das nicht: entkalken, am besten mit dem Entkalker des Herstellers und dem Programm der Maschine.',
    ],
    artikel: [A.entkalken, A.magnifica], produkt: ['Entkalker für Kaffeevollautomaten', 'Entkalker Kaffeevollautomat'],
  },
  duesen: {
    titel: 'Düsen am Kaffeeauslauf verstopft', stufe: 'selbst',
    ursache: 'Kommt aus einem oder beiden Ausgüssen kein Kaffee, sind laut De’Longhi die kleinen Düsen am Kaffeeauslauf verstopft.',
    schritte: [
      'Die Düsen mit einem Tuch reinigen.',
      'Verkrustungen vorsichtig mit einem Zahnstocher entfernen.',
    ],
    artikel: [A.magnifica],
  },
  'kein-kaffee': {
    titel: 'Maschine arbeitet, aber kein Kaffee', stufe: 'teils',
    ursache: 'Meist ist der Mahlgrad zu fein, die Ausgüsse sind verstopft, die Maschine ist verkalkt oder die Brüheinheit verschmutzt. Manche Geräte von De’Longhi erkennen auch Verunreinigungen im Inneren und sperren sich kurz.',
    schritte: [
      'Warten, bis die Maschine wieder betriebsbereit ist, und das Getränk neu wählen.',
      'Mahlgrad gröber stellen. ' + MAHLGRAD,
      'Düsen am Kaffeeauslauf mit einem Tuch oder Zahnstocher freimachen.',
      'Leuchtet die Entkalken-Anzeige, das Entkalkungsprogramm starten.',
      'Brüheinheit herausnehmen (falls herausnehmbar) und ohne Spülmittel unter fließendem Wasser abspülen.',
      'Hilft nichts davon: technischen Kundendienst des Herstellers kontaktieren. Nicht selbst das Gehäuse öffnen.',
    ],
    artikel: [A.magnifica, A.entkalken],
  },
  'filter-luft': {
    titel: 'Luft im neuen Wasserfilter', stufe: 'selbst',
    ursache: 'Läuft das Wasser nach einem Filterwechsel schlecht, ist meist noch Luft im Filter.',
    schritte: [
      'Filter herausnehmen.',
      'Kopfüber in Wasser entlüften, bis keine Bläschen mehr aufsteigen.',
      'Wieder einsetzen und, falls die Maschine danach fragt, den Filter im Menü aktivieren.',
    ],
    artikel: [A.aquaclean, A.jura],
  },
  'kein-wasser': {
    titel: 'Kein Wasser: Tank, Luft im System oder Kalk', stufe: 'teils',
    ursache: 'Kommt kein Wasser und blinken die roten Lampen, sitzt oft der Wassertank nicht richtig, es ist Luft im Wasserkreislauf, der Mahlgrad ist zu fein oder die Maschine ist verkalkt.',
    schritte: [
      'Wassertank füllen und fest hineindrücken, bis er hörbar einrastet.',
      'Luft aus dem Kreislauf lassen: Bei der Magnifica S den Dampfdrehknopf auf I stellen und etwas Wasser aus dem Milchaufschäumer laufen lassen.',
      'Mahlgrad eine Stufe gröber stellen.',
      'Ausgüsse freimachen, entkalken und die Brüheinheit abspülen.',
      'Hilft nichts davon: technischer Kundendienst. Nicht selbst das Gehäuse öffnen.',
    ],
    artikel: [A.magnifica, A.delonghiEntkalken],
  },
  kalk: {
    titel: 'Schwankende Qualität: Kalk in der Maschine', stufe: 'selbst',
    ursache: 'Schwankt die Qualität des Kaffees stark, sind laut Siemens oft Kalkablagerungen der Grund.',
    schritte: [
      'Die Maschine entkalken, mit dem Entkalker des Herstellers und dem Entkalkungsprogramm. Kein Essig.',
      'Danach prüfen, ob die Wasserhärte in der Maschine richtig eingestellt ist.',
      'Ein Wasserfilter verlängert die Abstände zum nächsten Entkalken deutlich.',
    ],
    artikel: [A.entkalken, A.delonghiEntkalken, A.siemensEntkalken], produkt: ['Entkalker für Kaffeevollautomaten', 'Entkalker Kaffeevollautomat'],
  },
  abtropfschale: {
    titel: 'Rost der Abtropfschale fehlt oder Kondenswasser', stufe: 'selbst',
    ursache: 'Kommt Dampf aus der Abtropfschale oder steht Wasser unter der Maschine, wurde laut De’Longhi oft der Rost der Abtropfschale nach dem Reinigen nicht wieder eingesetzt. Geräusche und etwas Dampf kurz nach dem Ausschalten sind dagegen normal: Kondenswasser tropft in den noch warmen Dampferzeuger.',
    schritte: [
      'Den Rost wieder in die Abtropfschale einsetzen.',
      'Die Abtropfschale regelmäßig leeren, das verringert auch das Kondenswasser.',
      'Tritt trotzdem Wasser aus, den technischen Kundendienst fragen.',
    ],
    artikel: [A.maschinen],
  },
  milchsystem: {
    titel: 'Milchsystem verschmutzt', stufe: 'selbst',
    ursache: 'Ist die Milch kalt und geeignet, liegt es laut Siemens und De’Longhi meist an einem verschmutzten Milchsystem, etwa dem Deckel der Milchkaraffe oder ihrem Anschluss an der Maschine.',
    schritte: [
      'Milchsystem bzw. Milchkaraffe zerlegen und gründlich reinigen, besonders den Anschluss an der Maschine.',
      'Das Milchsystem am besten nach jedem Gebrauch reinigen, wie in der Anleitung beschrieben.',
      'Prüfen, ob die Milchkaraffe richtig eingesetzt ist.',
    ],
    artikel: [A.maschinen, A.jura], produkt: ['Milchsystemreiniger', 'Milchsystemreiniger Kaffeevollautomat'],
  },
  'milch-eignung': {
    titel: 'Milch nicht kalt genug oder ungeeignet', stufe: 'selbst',
    ursache: 'Für guten Schaum muss die Milch kalt sein. Siemens empfiehlt kalte Milch mit mindestens 1,5 % Fett, De’Longhi teilentrahmte oder entrahmte Milch mit Kühlschranktemperatur (etwa 5 °C).',
    schritte: [
      'Milch direkt aus dem Kühlschrank nehmen.',
      'Milch mit mindestens 1,5 % Fett verwenden.',
      'Wird der Schaum trotzdem nicht gut, eine andere Milchmarke probieren und das Milchsystem reinigen.',
    ],
    artikel: [A.maschinen],
  },
  pflanzendrink: {
    titel: 'Pflanzendrinks schäumen unterschiedlich', stufe: 'selbst',
    ursache: 'Bei pflanzlichen Getränken fällt das Ergebnis je nach Nährwerten sehr unterschiedlich aus. De’Longhi empfiehlt die „Barista“-Varianten.',
    schritte: [
      'Eine „Barista“-Variante des Pflanzendrinks verwenden.',
      'Das Milchsystem danach gründlich reinigen.',
    ],
    artikel: [A.maschinen], produkt: ['Barista-Haferdrink', 'Haferdrink Barista'],
  },
};

export const VOLLAUTOMAT: Diagnose = {
  name: 'vollautomat', fragen, ergebnisse, hinweisTitel: 'Gut zu wissen',
  stufen: { teils: { text: 'Teils selbst, teils Kundendienst', kurz: 'teils selbst, teils Kundendienst' }, fachbetrieb: { text: 'Fall für den Kundendienst', kurz: 'Kundendienst' } },
};
