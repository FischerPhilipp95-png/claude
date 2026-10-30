// Bauteile je Bauart für die Schnittzeichnung (src/components/Querschnitt.astro).
// Die Zeichnung selbst erzeugt scripts/querschnitt.py (src/querschnitte/<bauart>.svg und .json mit Ankerpunkten).
// Welche Maschine welche Bauart hat, steht in src/maschinen.json (Feld „bauart“).
//
// Regeln: Jedes Symptom hat eine Quelle (Anleitung, Herstellerseite oder Reparaturforum), wie in den Fehler-Artikeln.
// „stufe“: selbst = ohne Werkzeug, werkstatt = Gehäuse öffnen oder Fachbetrieb, normal = kein Defekt.
export type Stufe = 'selbst' | 'werkstatt' | 'normal';
export interface Symptom { text: string; ursache: string; stufe: Stufe; loesung: string; quelle: string }
export type Gruppe = 'wasser' | 'heiss' | 'kaffee' | 'milch' | 'strom';
export interface Bauteil {
  id: string;
  /** Farbgruppe des Labels: Wasserweg, Hitze, Kaffeeweg, Milch, Strom */
  gruppe: Gruppe;
  name: string;
  /** kürzerer Name für das Label in der Zeichnung */
  kurz?: string;
  aufgabe: string;
  symptome: Symptom[];
  /** [Anzeigename, Amazon-Suche] für ein passendes Ersatz- oder Pflegeteil */
  ersatzteil?: [string, string];
  /** [Adresse, Linktext] ausführliche Anleitungen */
  artikel?: [string, string][];
}
export interface Bauart { name: string; beispiele: string; hinweis: string; teile: Bauteil[] }

export const STUFEN: Record<Stufe, { text: string; icon: string; status: string }> = {
  selbst: { text: 'Selbst machbar', icon: 'circle-check', status: 'ok' },
  werkstatt: { text: 'Werkstatt oder Kundendienst', icon: 'wrench', status: 'warn' },
  normal: { text: 'Kein Defekt', icon: 'info', status: 'ok' },
};

const FEHLER = '/artikel/delonghi-magnifica-s-fehler/';

export const BAUARTEN: Record<string, Bauart> = {
  'delonghi-ecam': {
    name: 'De’Longhi ECAM-Bauart',
    beispiele: 'Magnifica S, Magnifica Evo, Dinamica, Eletta',
    hinweis: 'Schematische Darstellung, keine Konstruktionszeichnung: Das Gehäuse ist durchsichtig gezeichnet, die Lage der Teile ist vereinfacht.',
    teile: [
      {
        id: 'wassertank', gruppe: 'wasser', name: 'Wassertank', aufgabe: 'Sitzt rechts hinten und wird seitlich herausgezogen. Ein Magnetschwimmer meldet der Elektronik, wann Wasser fehlt. Unten passt der Wasserfilter hinein.',
        symptome: [
          { text: 'Wassertank-Lampe blinkt', ursache: 'Zu wenig Wasser im Tank.', stufe: 'selbst', loesung: 'Tank füllen und einsetzen, bis er hörbar einrastet.', quelle: 'Anleitung' },
          { text: 'Wassertank-Lampe leuchtet dauerhaft', ursache: 'Tank fehlt oder sitzt nicht richtig.', stufe: 'selbst', loesung: 'Tank fest nach unten drücken.', quelle: 'Anleitung' },
          { text: '„Wasser nachfüllen“ geht trotz vollem Tank nicht aus', ursache: 'Magnetschwimmer im Tank hängt.', stufe: 'selbst', loesung: 'Schwimmer im Tank reinigen und gängig machen.', quelle: 'kaffee-netz.de' },
          { text: 'Pumpe rattert, es kommt kein Wasser (mit Wasserfilter)', ursache: 'Luft im Wasserfilter.', stufe: 'selbst', loesung: 'Filter unter Wasser entlüften, einsetzen, dann den Dampfknopf öffnen, bis Wasser gleichmäßig fließt.', quelle: 'Anleitung ECAM 11, elektroda.com' },
        ],
        ersatzteil: ['Wasserfilter DLSC002', "De'Longhi Wasserfilter DLSC002"],
        artikel: [['/artikel/delonghi-magnifica-s-kein-wasser/', 'Magnifica S: kein Wasser kommt']],
      },
      {
        id: 'pumpe', gruppe: 'wasser', name: 'Pumpe', aufgabe: 'Eine Schwingkolbenpumpe hinten links baut den Brühdruck auf. Ihr Brummen hörst du bei jedem Bezug, das Rattern ohne Wasser ist Luft im System.',
        symptome: [
          { text: 'Pumpe brummt laut, aber es kommt nichts', ursache: 'Luft im Wasserkreislauf, zum Beispiel nach leerem Tank.', stufe: 'selbst', loesung: 'Dampfdrehknopf öffnen und Heißwasser laufen lassen, bis es gleichmäßig fließt.', quelle: 'Anleitung' },
          { text: 'Pumpe läuft, aber kein Wasser kommt an', ursache: 'Schlauch zum oder vom Erhitzer verstopft.', stufe: 'werkstatt', loesung: 'Schlauch am Erhitzerausgang abziehen, prüfen, ob Wasser kommt, Verstopfung mit einer Nadel freistoßen.', quelle: 'elektroda.com' },
        ],
        artikel: [['/artikel/delonghi-magnifica-s-kein-wasser/', 'Die Pumpe brummt, aber es kommt nichts']],
      },
      {
        id: 'flowmeter', gruppe: 'wasser', name: 'Durchflussmesser', aufgabe: 'Ein kleines Flügelrad zählt, wie viel Wasser zur Tasse fließt. Danach stoppt die Maschine den Bezug und zählt die Bezüge bis zum Entkalken.',
        symptome: [
          { text: 'Tassenmenge schwankt stark oder Bezug stoppt zu früh', ursache: 'Flügelrad verkalkt oder Sensor gestört. In Reparaturforen ein häufiger Verdacht, aber ohne Öffnen nicht zu prüfen.', stufe: 'werkstatt', loesung: 'Erst entkalken und den Tank-Schwimmer prüfen. Bleibt es dabei, Durchflussmesser in der Werkstatt prüfen lassen.', quelle: 'kaffee-netz.de' },
        ],
      },
      {
        id: 'thermoblock', gruppe: 'heiss', name: 'Thermoblock (Durchlauferhitzer)', aufgabe: 'Ein Aluminiumblock mit Heizwendel erhitzt das Wasser in Sekunden. Hier setzt sich der meiste Kalk ab, deshalb mahnt die Maschine regelmäßig zum Entkalken.',
        symptome: [
          { text: 'Entkalkungs-Lampe blinkt', ursache: 'Kalk im Erhitzer, die Maschine zählt die Bezüge.', stufe: 'selbst', loesung: 'Entkalkungsprogramm starten: Taste Spülen/Entkalken 5 Sekunden halten.', quelle: 'Anleitung' },
          { text: 'Kaffee nicht heiß', ursache: 'Tassen kalt, Brühgruppe abgekühlt oder Temperatur niedrig eingestellt.', stufe: 'selbst', loesung: 'Tassen vorwärmen, vor dem Bezug die Spültaste drücken, Kaffeetemperatur höher stellen.', quelle: 'Anleitung' },
          { text: 'Spülen, Kaffee und Heißwasser kommen nur als Tropfen', ursache: 'Erhitzer verstopft.', stufe: 'werkstatt', loesung: 'Schläuche am Erhitzer abziehen, Erhitzer durchblasen, intensiv entkalken, notfalls tauschen.', quelle: 'iFixit' },
          { text: 'Maschine heizt nicht mehr', ursache: 'Wackelkontakt am Stecker des Heizelements.', stufe: 'werkstatt', loesung: 'Stecker am Heizelement fest aufstecken, dann beide unteren Tasten halten und einschalten.', quelle: 'coffeeforums.co.uk' },
        ],
        ersatzteil: ['Entkalker EcoDecalk', "De'Longhi EcoDecalk Entkalker"],
        artikel: [['/artikel/delonghi-magnifica-s-entkalken/', 'Magnifica S entkalken, Schritt für Schritt']],
      },
      {
        id: 'ventil', gruppe: 'wasser', name: 'Magnetventil', aufgabe: 'Schaltet den Wasserweg um: zur Brühgruppe, zur Dampfdüse oder beim Spülen in die Abtropfschale. Hängt das Ventil, läuft Wasser am falschen Ort heraus.',
        symptome: [
          { text: 'Entkalken bricht immer mit „Wasser nachfüllen“ ab', ursache: 'Ventilstück im oberen Brühkopf verstopft, der Abzweig zur Dampfdüse ist zu.', stufe: 'werkstatt', loesung: 'Oberen Brühkopf komplett tauschen, das Ventil gibt es nicht einzeln.', quelle: 'kaffee-netz.de' },
          { text: 'Wasser tritt links unten am roten Überlauf aus', ursache: 'Überdruck- oder Expansionsventil öffnet.', stufe: 'werkstatt', loesung: 'Keine eindeutige Lösung aus Foren, Fall für den Kundendienst.', quelle: 'Reparaturforen' },
        ],
      },
      {
        id: 'bohnen', gruppe: 'kaffee', name: 'Bohnenbehälter mit Mahlgradregler', kurz: 'Bohnenbehälter', aufgabe: 'Oben unter dem Deckel. Der Drehregler im Behälter verstellt den Abstand der Mahlscheiben, aber nur bei laufendem Mahlwerk und nur eine Stufe auf einmal.',
        symptome: [
          { text: 'Kaffee läuft zu langsam oder tröpfchenweise', ursache: 'Mahlgrad zu fein.', stufe: 'selbst', loesung: 'Regler bei laufendem Mahlwerk eine Stufe nach rechts (Richtung 7) drehen, Wirkung erst nach 2 Kaffees.', quelle: 'Anleitung, De’Longhi-Support' },
          { text: 'Kaffee dünn, wässrig, wenig Crema', ursache: 'Zu grob gemahlen, zu wenig Pulver, zu viel Wasser.', stufe: 'selbst', loesung: 'Regler bei laufendem Mahlwerk eine Stufe nach links, Aroma höher, Tassenmenge kleiner, Espressobohnen verwenden.', quelle: 'Anleitung' },
          { text: 'Neue Maschine: Kaffee entweder bitter oder wässrig', ursache: 'Alte Supermarktbohnen, Temperatur zu hoch.', stufe: 'selbst', loesung: 'Frische Bohnen, Mahlgrad und Menge anpassen, bei Bitterkeit Temperatur auf Stufe 1.', quelle: 'kaffee-netz.de' },
        ],
        artikel: [['/artikel/kaffeevollautomat-zu-wenig-kaffee/', 'Zu wenig Kaffee: Mahlgrad, Auslauf, Luft']],
      },
      {
        id: 'mahlwerk', gruppe: 'kaffee', name: 'Mahlwerk', aufgabe: 'Kegelmahlwerk aus Stahl direkt unter dem Bohnenbehälter. Ein Sensor misst die Mahlzeit, daraus ergibt sich die Pulvermenge pro Tasse.',
        symptome: [
          { text: 'Nach Werksreset: Kaffee wässrig, Kaffeepuck höchstens 8 mm', ursache: 'Maschine muss die Mahlmenge neu lernen.', stufe: 'selbst', loesung: 'Bohnenbehälter leeren, 10 Bezüge hintereinander ohne Bohnen machen.', quelle: 'kaffee-netz.de' },
          { text: 'Mahlwerk mahlt unter 1 Sekunde, Kaffeepuck hauchdünn', ursache: 'Kabelbruch am Kabel zur Sensorplatine des Mahlwerks.', stufe: 'werkstatt', loesung: 'Defektes Kabelstück herausschneiden und neu verlöten.', quelle: 'kaffeestudio.de' },
          { text: 'Satzbehälter-Symbol rot, Warndreieck blinkt, Maschine bleibt stehen', ursache: 'Starke Verschmutzung im Inneren, auch im Mahlwerk.', stufe: 'werkstatt', loesung: 'Komplett zerlegen und reinigen, danach Werksreset.', quelle: 'kaffee-netz.de' },
        ],
        ersatzteil: ['Kaffeefettlöser-Tabs', 'Kaffeefettlöser Tabs Kaffeevollautomat'],
      },
      {
        id: 'pulverschacht', gruppe: 'kaffee', name: 'Pulverschacht (vorgemahlen)', aufgabe: 'Die Klappe neben dem Bohnenbehälter führt direkt zur Brühgruppe, am Mahlwerk vorbei. Nur für einen gestrichenen Messlöffel gemahlenen Kaffee.',
        symptome: [
          { text: 'Pulverkaffee fällt in die Maschine, statt gebrüht zu werden', ursache: 'Pulver zu früh oder zu viel eingefüllt.', stufe: 'selbst', loesung: 'Funktion „vorgemahlen“ wählen, erst einen Messlöffel einfüllen, wenn die Maschine fehlendes Pulver meldet, Getränk erneut wählen.', quelle: 'elektroda.com' },
          { text: 'Zu viel Pulver: Alarm, kein Kaffee', ursache: 'Mehr als ein gestrichener Messlöffel.', stufe: 'selbst', loesung: 'Pulvermenge verringern, Kaffee neu anfordern.', quelle: 'Anleitung' },
        ],
      },
      {
        id: 'bruehgruppe', gruppe: 'kaffee', name: 'Brühgruppe', aufgabe: 'Hinter der rechten Klappe. Nimmt das Pulver auf, presst es und lässt das heiße Wasser hindurch. Herausnehmbar, nur mit Wasser spülen, drei große Dichtringe halten den Druck.',
        symptome: [
          { text: 'Viel Wasser im Kaffeesatzbehälter, Kaffee schwach', ursache: 'Die drei großen O-Ringe der Brühgruppe sind verschlissen.', stufe: 'selbst', loesung: 'O-Ringe tauschen und mit lebensmittelechtem Silikonfett fetten.', quelle: 'coffeeforums.co.uk, iFixit' },
          { text: 'Tasse wird nur halb voll, der Rest läuft in die Abtropfschale', ursache: 'Brühkolben verschmutzt oder Dichtringe verschlissen, Druck geht verloren.', stufe: 'selbst', loesung: 'Brühgruppe zerlegen und reinigen, große Dichtringe und Dichtring am Kolben erneuern.', quelle: 'kaffeestudio.de' },
          { text: 'Brühgruppe lässt sich nicht einsetzen', ursache: 'Antrieb steht nicht in der Grundstellung.', stufe: 'selbst', loesung: 'Klappe schließen, Maschine ein- und ausschalten, dann erneut einsetzen. Nicht mit Gewalt drücken.', quelle: 'Anleitung' },
          { text: 'Lautes Knallen, wenn die Brühgruppe in Position fährt', ursache: 'Abstreifhebel nach dem Reinigen falsch montiert.', stufe: 'selbst', loesung: 'Brühgruppe zerlegen, Hebel richtig einsetzen.', quelle: 'coffeeforums.co.uk' },
          { text: 'Neue Maschine: nach wenigen Tassen nur noch Tropfen', ursache: 'Werksfehler, zwei Siebe übereinander in der Brühgruppe.', stufe: 'selbst', loesung: 'Brühgruppe zerlegen, überzähliges Sieb entfernen, bei Garantie besser reklamieren.', quelle: 'coffeeforums.co.uk' },
          { text: 'Weiße Paste an Brühgruppe und im Satzbehälter einer neuen Maschine', ursache: 'Lebensmittelechtes Schmierfett aus dem Werk.', stufe: 'normal', loesung: 'Fett abwischen, die Maschine ist in Ordnung.', quelle: 'kaffee-netz.de' },
          { text: 'Nach Tausch der Brühgruppe fährt der Antrieb nicht in die obere Position', ursache: 'Position nach dem Tausch nicht gespeichert.', stufe: 'selbst', loesung: 'Reset: Netzstecker ziehen, Ein-Taste und die Espresso-Taste darunter halten, Stecker einstecken, loslassen, sobald die Tasten blinken.', quelle: 'kaffeestudio.de' },
        ],
        ersatzteil: ['Dichtungsset Brühgruppe', "Dichtungsset De'Longhi Brühgruppe ECAM"],
        artikel: [['/artikel/delonghi-bruehgruppe-reinigen/', 'Brühgruppe ausbauen, reinigen, fetten']],
      },
      {
        id: 'bruehkopf', gruppe: 'kaffee', name: 'Oberer Brühkolben', aufgabe: 'Fest im Gerät, drückt von oben auf die Brühgruppe und leitet das Wasser ein. Das normale Entkalken erreicht ihn nicht, deshalb verkalkt er mit den Jahren.',
        symptome: [
          { text: 'Kaffee kommt nur tröpfchenweise, Heißwasser läuft normal', ursache: 'Oberer Brühkolben verkalkt.', stufe: 'werkstatt', loesung: 'Entkalker im Testmodus durch den oberen Brühkolben pumpen, einwirken lassen, mehrmals wiederholen, mit klarem Wasser spülen. Kein von De’Longhi beschriebenes Verfahren.', quelle: 'kaffee-netz.de' },
          { text: 'Durchfluss wird immer weniger bis null, Wasser läuft in die Abtropfschale', ursache: 'Dichtung am oberen Brühkolben verschlissen, oft nach etwa 4.500 Bezügen.', stufe: 'werkstatt', loesung: 'Gehäuse öffnen, oberen Kolben ausbauen, O-Ringe erneuern.', quelle: 'elektroda.com, coffeeforums.co.uk' },
        ],
      },
      {
        id: 'auslauf', gruppe: 'kaffee', name: 'Kaffeeauslauf', aufgabe: 'Höhenverstellbar, mit zwei Düsen. Die feinen Löcher setzen sich mit Kaffeeöl zu, dann kommt aus einer Seite weniger.',
        symptome: [
          { text: 'Aus einem Auslauf kommt kein Kaffee', ursache: 'Löcher im Auslauf verstopft.', stufe: 'selbst', loesung: 'Ausläufe mit einem Zahnstocher frei machen, Auslauf abnehmen und spülen.', quelle: 'Anleitung' },
        ],
        artikel: [['/artikel/kaffeevollautomat-zu-wenig-kaffee/', 'Auslauf verstopft: so wird er frei']],
      },
      {
        id: 'aufschaeumer', gruppe: 'milch', name: 'Milchaufschäumer und Dampfventil', kurz: 'Milchaufschäumer', aufgabe: 'Die Dampfdüse rechts vorn zieht Luft und Milch an und schäumt sie auf. Der Drehknopf darüber öffnet das Dampfventil im Gerät.',
        symptome: [
          { text: 'Milch wird nicht aufgeschäumt', ursache: 'Aufschäumer verschmutzt, Löcher zu.', stufe: 'selbst', loesung: 'Aufschäumer abnehmen, zerlegen, reinigen, Löcher frei machen.', quelle: 'Anleitung' },
          { text: 'Milchschaum mit großen Blasen', ursache: 'Milch nicht kalt genug.', stufe: 'selbst', loesung: 'Teilentrahmte Milch direkt aus dem Kühlschrank, sonst andere Marke probieren.', quelle: 'Anleitung' },
          { text: 'Dampf hört mitten im Aufschäumen auf', ursache: 'Sicherheitsabschaltung nach 3 Minuten Dampf.', stufe: 'normal', loesung: 'Einige Minuten warten, dann Dampf neu starten.', quelle: 'Anleitung' },
          { text: 'Dampf bei der 1. Tasse gut, danach nur noch schwach', ursache: 'Dampfventil verschlissen.', stufe: 'werkstatt', loesung: 'Dampfventil tauschen.', quelle: 'productreview.com.au' },
          { text: 'Aufsatz der Dampfdüse rutscht ab', ursache: 'O-Ringe am Aufsatz verschlissen.', stufe: 'selbst', loesung: 'Passende Ersatz-O-Ringe oder neuen Aufsatz einsetzen.', quelle: 'productreview.com.au' },
        ],
        ersatzteil: ['Ersatz-Aufschäumer', "De'Longhi Milchaufschäumer Düse ECAM Ersatz"],
        artikel: [['/artikel/delonghi-milchschaum-geht-nicht/', 'De’Longhi: Milchschaum geht nicht']],
      },
      {
        id: 'satzbehaelter', gruppe: 'kaffee', name: 'Kaffeesatzbehälter', aufgabe: 'Sitzt in der Abtropfschale und fängt die Kaffeepucks auf. Ein Zähler meldet, wann er voll ist, deshalb nur leeren, wenn die Maschine eingeschaltet ist.',
        symptome: [
          { text: 'Satzbehälter-Lampe blinkt', ursache: 'Behälter voll.', stufe: 'selbst', loesung: 'Satzbehälter und Abtropfschale leeren. Wer die Schale herausnimmt, leert immer auch den Satzbehälter, sonst stimmt der Zähler nicht.', quelle: 'Anleitung' },
          { text: 'Satzbehälter-Lampe leuchtet dauerhaft', ursache: 'Behälter fehlt nach dem Reinigen.', stufe: 'selbst', loesung: 'Abtropfschale herausnehmen, Satzbehälter einsetzen.', quelle: 'Anleitung' },
          { text: 'Etwas Wasser im Kaffeesatzbehälter', ursache: 'Kondenswasser wird absichtlich dorthin geleitet.', stufe: 'normal', loesung: 'Leeren, wenn die Maschine es verlangt, spätestens alle 72 Stunden.', quelle: 'De’Longhi-FAQ' },
        ],
      },
      {
        id: 'abtropfschale', gruppe: 'wasser', name: 'Abtropfschale', aufgabe: 'Fängt Spülwasser und Tropfen auf. Der rote Schwimmer zeigt, wann sie voll ist. Läuft sie über, steht Wasser unter der Maschine.',
        symptome: [
          { text: 'Pfütze unter der Maschine', ursache: 'Abtropfschale übergelaufen oder nicht richtig eingesetzt.', stufe: 'selbst', loesung: 'Schale leeren und einsetzen, bis sie einrastet. Kommt das Wasser aus dem Gerät selbst, ist meist eine Dichtung undicht.', quelle: 'Anleitung' },
        ],
        artikel: [['/artikel/wasser-unter-kaffeevollautomat/', 'Wasser unter dem Kaffeevollautomaten']],
      },
      {
        id: 'bedienfeld', gruppe: 'strom', name: 'Bedienfeld', aufgabe: 'Tasten und Kontrolllampen. Blinkt eine Lampe, musst du etwas tun. Leuchtet sie dauerhaft, fehlt ein Teil oder ein Programm läuft.',
        symptome: [
          { text: 'Alle Lampen blinken gleichzeitig', ursache: 'Maschine meldet einen Fehler, oft nach Stromausfall oder Transport.', stufe: 'selbst', loesung: 'Ausschalten, Netzstecker ziehen, nach einer Minute neu starten. Bleibt es dabei, Reset nach Anleitung.', quelle: 'Anleitung' },
          { text: 'Rotes Warndreieck blinkt', ursache: 'Allgemeiner Fehler, meist Brühgruppe falsch eingesetzt oder starke Verschmutzung.', stufe: 'selbst', loesung: 'Brühgruppe herausnehmen, reinigen, richtig einsetzen, Klappe schließen.', quelle: 'Anleitung' },
        ],
        artikel: [[FEHLER, 'Alle Warnleuchten der Magnifica S erklärt']],
      },
      {
        id: 'elektronik', gruppe: 'strom', name: 'Elektronik (Leistungsplatine)', aufgabe: 'Steuert Pumpe, Heizung, Mahlwerk und Antrieb der Brühgruppe. Sitzt an der linken Gehäusewand. Der Hauptschalter dahinter trennt alles vom Netz.',
        symptome: [
          { text: 'Gerät schaltet sich nicht ein', ursache: 'Stecker nicht drin oder Hauptschalter auf der Rückseite aus.', stufe: 'selbst', loesung: 'Stecker prüfen, Hauptschalter hinten auf I stellen.', quelle: 'Anleitung, De’Longhi-FAQ' },
          { text: 'Totalausfall, keine Lampe leuchtet (älteres Gerät)', ursache: 'Bauteile auf der Leistungsplatine defekt.', stufe: 'werkstatt', loesung: 'Leistungsplatine tauschen, danach alle Steckverbindungen prüfen und neu stecken.', quelle: 'kaffee-netz.de' },
        ],
        artikel: [[FEHLER, 'Magnifica S: 46 Fehler mit Lösung']],
      },
    ],
  },
};

export const bauart = (id?: string) => (id ? BAUARTEN[id] : undefined);
