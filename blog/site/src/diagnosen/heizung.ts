// Heizungs-Diagnose (/rechner/heizung-diagnose/). Jede Aussage stammt aus den Heizungsartikeln der Website (Quellen stehen dort).
// Neue Ursachen erst dort belegen, dann hier eintragen. Aufbau und Regeln: src/diagnose.ts.
import type { Diagnose, Ergebnis, Frage } from '../diagnose';

const fragen: Record<string, Frage> = {
  start: {
    frage: 'Was ist los mit deiner Heizung?',
    optionen: [
      { key: 'einer', icon: 'thermometer-snowflake', text: 'Ein Heizkörper wird nicht richtig warm', frage: 'einer' },
      { key: 'nicht-kalt', icon: 'thermometer-sun', text: 'Ein Heizkörper wird nicht mehr kalt', ergebnis: 'ventilstift-offen' },
      { key: 'mehrere', icon: 'layers', text: 'Mehrere Heizkörper bleiben kalt', frage: 'mehrere' },
      { key: 'alle', icon: 'snowflake', text: 'Alle Heizkörper bleiben kalt', frage: 'alle' },
      { key: 'geraeusch', icon: 'audio-lines', text: 'Die Heizung gluckert, rauscht, pfeift oder klopft', frage: 'geraeusch' },
      { key: 'druck', icon: 'gauge', text: 'Der Druck am Manometer stimmt nicht', frage: 'druck' },
      { key: 'temperatur', icon: 'house', text: 'Die ganze Wohnung ist zu kalt oder zu warm', frage: 'temperatur' },
    ],
  },
  einer: {
    frage: 'Wie fühlt sich der Heizkörper an?',
    hilfe: 'Thermostat ganz aufdrehen, ein paar Minuten warten und dann oben und unten anfassen.',
    optionen: [
      { key: 'oben-kalt', text: 'Oben kalt, unten warm', ergebnis: 'luft' },
      { key: 'ganz-kalt', text: 'Ganz kalt, obwohl das Thermostat voll auf ist', frage: 'ventil' },
      { key: 'unten-kalt', text: 'Unten dauerhaft kalt, und der Raum wird nicht warm', ergebnis: 'ablagerungen' },
      { key: 'unten-lauwarm', text: 'Oben warm, unten lauwarm, der Raum ist fast warm', ergebnis: 'normal' },
      { key: 'raum-kalt', text: 'Der Heizkörper wird warm, aber der Raum nicht', ergebnis: 'waerme' },
      { key: 'entlueftet', text: 'Ich habe schon entlüftet, er bleibt trotzdem kalt', ergebnis: 'nach-entlueften' },
    ],
  },
  ventil: {
    frage: 'Hast du den Ventilstift unter dem Thermostatkopf schon geprüft?',
    hilfe: 'Der Stift sitzt unter dem Thermostatkopf. Drückst du ihn hinein, sollte er locker zurückfedern.',
    optionen: [
      { key: 'nein', text: 'Noch nicht', kurz: 'Stift noch nicht geprüft', ergebnis: 'ventilstift' },
      { key: 'ohne-kopf-warm', text: 'Ja, der Stift federt. Ohne Kopf wird der Heizkörper warm, mit Kopf nicht', kurz: 'Stift federt, nur ohne Kopf wird er warm', ergebnis: 'thermostatkopf' },
      { key: 'bleibt-kalt', text: 'Ja, der Stift federt, aber der Heizkörper bleibt auch ohne Kopf kalt', kurz: 'Stift federt, auch ohne Kopf kalt', ergebnis: 'ventil-frei' },
    ],
  },
  mehrere: {
    frage: 'Welche Heizkörper bleiben kalt?',
    optionen: [
      { key: 'oben', text: 'Vor allem die oben im Haus', ergebnis: 'druck-niedrig' },
      { key: 'weit-weg', text: 'Die weit weg von der Heizung, die nahen werden heiß', ergebnis: 'abgleich' },
      { key: 'kein-muster', text: 'Kein klares Muster', ergebnis: 'mehrere' },
    ],
  },
  alle: {
    frage: 'Was zeigt die Heizung?',
    hilfe: 'Schau aufs Display der Heizung bzw. Therme und auf das Manometer.',
    optionen: [
      { key: 'stoerung', text: 'Eine Störung oder einen Fehlercode', ergebnis: 'stoerung' },
      { key: 'druck', text: 'Der Druck liegt unter dem grünen Bereich', ergebnis: 'druck-niedrig' },
      { key: 'nichts', text: 'Nichts Auffälliges', ergebnis: 'alle-kalt' },
    ],
  },
  geraeusch: {
    frage: 'Was hörst du, und wann?',
    optionen: [
      { key: 'gluckert', text: 'Es gluckert, der Heizkörper ist oben kalt', ergebnis: 'luft' },
      { key: 'wieder', text: 'Es gluckert wieder, obwohl ich entlüftet habe', frage: 'pumpe' },
      { key: 'rauscht', text: 'Es rauscht laut oder pfeift an den Ventilen oder in den Rohren', ergebnis: 'pumpe-abgleich' },
      { key: 'klopft', text: 'Es klopft oder knackt in den Rohren', ergebnis: 'klopfen' },
      { key: 'brummt', text: 'Es brummt an der Heizung oder Pumpe', ergebnis: 'brummen' },
    ],
  },
  pumpe: {
    frage: 'Lief beim Entlüften die Heizung bzw. die Pumpe?',
    optionen: [
      { key: 'ja', text: 'Ja, oder ich weiß es nicht', kurz: 'Pumpe lief beim Entlüften', ergebnis: 'pumpe-lief' },
      { key: 'nein', text: 'Nein, die Pumpe war aus', kurz: 'Pumpe war aus', ergebnis: 'gluckern-trotz' },
    ],
  },
  druck: {
    frage: 'Was zeigt das Manometer?',
    optionen: [
      { key: 'niedrig', text: 'Zu wenig: unter dem grünen Bereich', ergebnis: 'druck-niedrig' },
      { key: 'hoch', text: 'Zu viel: über der Markierung oder im roten Bereich', ergebnis: 'druck-hoch' },
      { key: 'faellt', text: 'Er fällt immer wieder, ich muss ständig nachfüllen', ergebnis: 'druck-faellt' },
      { key: 'steigt', text: 'Er steigt immer weiter', ergebnis: 'druck-steigt' },
    ],
  },
  temperatur: {
    frage: 'Wann ist es zu kalt oder zu warm?',
    hilfe: 'Gilt für Heizungen mit Außenfühler, die nach Heizkurve regeln, also die meisten Gas- und Ölheizungen und Wärmepumpen.',
    optionen: [
      { key: 'frost-kalt', text: 'Nur bei Frost zu kalt, sonst okay', ergebnis: 'steilheit-hoch' },
      { key: 'frost-warm', text: 'Nur bei Frost zu warm, sonst okay', ergebnis: 'steilheit-runter' },
      { key: 'immer-kalt', text: 'Immer etwas zu kalt', ergebnis: 'niveau-hoch' },
      { key: 'immer-warm', text: 'Immer etwas zu warm', ergebnis: 'niveau-runter' },
      { key: 'ein-raum', text: 'Nur ein Raum ist zu kalt', frage: 'einer' },
    ],
  },
};

const A = {
  entlueften: ['/artikel/heizkoerper-entlueften-anleitung/', 'Heizkörper entlüften in 7 Schritten'],
  pumpe: ['/artikel/heizung-entlueften-pumpe-an-oder-aus/', 'Entlüften: Pumpe an oder aus?'],
  ohneSchluessel: ['/artikel/heizung-entlueften-ohne-schluessel/', 'Entlüften ohne Schlüssel'],
  nichtWarm: ['/artikel/heizkoerper-wird-nicht-warm/', 'Heizkörper wird nicht warm: 6 Ursachen'],
  klemmt: ['/artikel/heizungsventil-klemmt/', 'Heizungsventil klemmt: Ventilstift lösen (mit Video)'],
  gluckert: ['/artikel/heizung-gluckert/', 'Heizung gluckert: 6 Ursachen'],
  rauscht: ['/artikel/heizung-rauscht-pfeift/', 'Heizung rauscht, pfeift oder klopft'],
  ausdehnung: ['/artikel/ausdehnungsgefaess-heizung/', 'Ausdehnungsgefäß: Defekt erkennen'],
  nachfuellen: ['/artikel/heizung-wasser-nachfuellen/', 'Heizung Wasser nachfüllen und richtiger Druck'],
  abgleich: ['/artikel/hydraulischer-abgleich/', 'Hydraulischer Abgleich: Kosten und Förderung'],
  kurve: ['/artikel/heizkurve-einstellen/', 'Heizkurve einstellen'],
  thermostat: ['/artikel/thermostatkopf-wechseln/', 'Thermostatkopf wechseln'],
  smart: ['/artikel/smartes-thermostat/', 'Smartes Thermostat'],
  reinigen: ['/artikel/heizkoerper-reinigen/', 'Heizkörper innen reinigen'],
  verkleidung: ['/artikel/heizkoerperverkleidung/', 'Heizkörperverkleidung'],
  abWann: ['/artikel/ab-wann-heizen/', 'Ab wann heizen? Was der Vermieter muss'],
} satisfies Record<string, [string, string]>;
const MIETE_ANLAGE = 'Alles, was die ganze Anlage betrifft (Druck, Pumpe, Abgleich, Spülen), ist Sache des Vermieters.';
const ergebnisse: Record<string, Ergebnis> = {
  luft: {
    titel: 'Luft im Heizkörper', stufe: 'selbst',
    ursache: 'Luft sammelt sich oben im Heizkörper und blockiert die Heizfläche. Typisch: oben kalt, unten warm, oft mit Gluckern.',
    schritte: [
      'Thermostate voll aufdrehen.',
      'Heizung bzw. Umwälzpumpe ausschalten und 30 bis 60 Minuten warten, damit die Luft nach oben steigt.',
      'Am untersten Heizkörper anfangen: Entlüftungsventil ¼ bis ½ Umdrehung gegen den Uhrzeigersinn öffnen und schließen, sobald nur noch Wasser kommt.',
      'Heizung wieder einschalten und den Druck am Manometer prüfen.',
    ],
    hinweis: 'Kannst du die Pumpe nicht abschalten, dreh vor dem Entlüften das Thermostatventil zu.',
    artikel: [A.entlueften, A.pumpe, A.ohneSchluessel], produkt: ['Entlüftungsschlüssel-Set', 'Entlüftungsschlüssel Heizkörper Set'],
  },
  ventilstift: {
    titel: 'Der Ventilstift klemmt', stufe: 'selbst',
    ursache: 'Unter dem Thermostatkopf sitzt ein kleiner Stift, der das Ventil öffnet. Nach dem Sommer setzt er sich oft fest, dann kommt kein heißes Wasser in den Heizkörper.',
    schritte: [
      'Thermostat auf Stufe 5 drehen und den Kopf abnehmen: Überwurfmutter lösen, meist von Hand, sonst vorsichtig mit einer kleinen Zange.',
      'Den Stift hineindrücken. Er sollte locker zurückfedern.',
      'Klemmt er, ein paarmal hineindrücken oder mit einer Zange sachte hin und her bewegen, bis er wieder federt. Nie mit Kraft daran ziehen oder fest draufschlagen, sonst kann die Dichtung undicht werden.',
      'Bewegt er sich gar nicht, muss ein Fachbetrieb das Ventiloberteil tauschen.',
      'Kopf auf Stufe 5 wieder aufsetzen und festdrehen.',
      'Vorbeugen: Im Sommer die Thermostate ab und zu auf- und zudrehen.',
    ],
    hinweis: 'Kopf abnehmen und Stift gängig machen ist in der Regel unproblematisch. Das Ventil selbst ist Sache des Vermieters.',
    artikel: [A.klemmt, A.nichtWarm], produkt: ['Kleine Wasserpumpenzange', 'Wasserpumpenzange klein'],
  },
  'ventilstift-offen': {
    titel: 'Der Ventilstift klemmt und hält das Ventil offen', stufe: 'selbst',
    ursache: 'Wird ein Heizkörper nicht mehr kalt, obwohl das Thermostat auf 0 steht, steckt der Stift unter dem Thermostatkopf draußen fest. Dann bleibt das Ventil offen.',
    schritte: [
      'Thermostat auf Stufe 5 drehen und den Kopf abnehmen.',
      'Den Stift ein paarmal hineindrücken, bis er wieder locker zurückfedert. Er steht normalerweise etwa 5 mm heraus.',
      'Nie mit Kraft daran ziehen oder fest draufschlagen, sonst kann die Dichtung undicht werden.',
      'Kopf auf Stufe 5 wieder aufsetzen, festdrehen, dann die gewünschte Stufe einstellen und prüfen, ob der Heizkörper kalt wird.',
      'Bewegt sich der Stift gar nicht, muss ein Fachbetrieb das Ventiloberteil tauschen.',
    ],
    hinweis: 'Kopf abnehmen und Stift gängig machen ist in der Regel unproblematisch. Das Ventil selbst ist Sache des Vermieters.',
    artikel: [A.klemmt],
  },
  thermostatkopf: {
    titel: 'Der Thermostatkopf ist defekt', stufe: 'selbst',
    ursache: 'Der Stift ist frei, aber mit aufgesetztem Kopf öffnet das Ventil nicht. Dann ist der Kopf selbst kaputt.',
    schritte: [
      'Prüfen, welchen Anschluss dein Ventil hat. Am häufigsten ist M30 × 1,5, für andere Ventile, etwa von Danfoss, gibt es Adapter.',
      'Alten Kopf auf Stufe 5 drehen und abnehmen.',
      'Neuen Kopf auf Stufe 5 aufsetzen und handfest anziehen. Der Kopf sitzt außerhalb des Rohrsystems, es läuft kein Wasser aus.',
    ],
    hinweis: 'Vorher den Vermieter fragen und den alten Kopf aufheben.',
    artikel: [A.thermostat, A.smart], produkt: ['Neuer Thermostatkopf', 'Thermostatkopf Heizkörper M30x1,5'],
  },
  'ventil-frei': {
    titel: 'Ventil frei, Heizkörper bleibt kalt', stufe: 'teils',
    ursache: 'Stift und Kopf sind nicht schuld. Dann kommt das heiße Wasser aus einem anderen Grund nicht an: Luft, zu wenig Druck, ein fehlender hydraulischer Abgleich oder Ablagerungen im Heizkörper.',
    schritte: [
      'Heizkörper entlüften, falls noch nicht geschehen, mit ausgeschalteter Pumpe.',
      'Druck am Manometer prüfen und bei Bedarf Wasser nachfüllen.',
      'Bleibt er kalt: Fachbetrieb rufen. Er prüft Ventil und Abgleich und spült den Heizkörper bei Bedarf.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.nichtWarm, A.entlueften, A.nachfuellen],
  },
  ablagerungen: {
    titel: 'Ablagerungen im Heizkörper (Heizkörperschlamm)', stufe: 'fachbetrieb',
    ursache: 'Rost, Kalk und Schmutz aus dem Heizungswasser setzen sich über die Jahre unten im Heizkörper ab und bremsen den Durchfluss. Er bleibt unten dauerhaft kalt, obwohl das Ventil offen ist und der Raum nicht warm wird.',
    schritte: [
      'Erst Luft und den Ventilstift ausschließen.',
      'Von außen lässt sich Schlamm nicht beheben: Ein Fachbetrieb spült den Heizkörper oder die ganze Anlage und bereitet das Heizungswasser danach auf.',
    ],
    hinweis: 'Das Spülen ist Sache des Vermieters.',
    artikel: [A.nichtWarm], produkt: ['Infrarot-Thermometer', 'Infrarot Thermometer Heizung'],
  },
  normal: {
    titel: 'Wahrscheinlich alles in Ordnung', stufe: 'normal',
    ursache: 'Das warme Wasser kommt oben an und kühlt beim Durchfließen ab. Ist der Raum fast warm, drosselt das Thermostat, und der Heizkörper wird unten noch kühler.',
    schritte: [
      'Nichts tun. Erst wenn der Heizkörper unten dauerhaft kalt bleibt und der Raum nicht warm wird, lohnt sich ein genauerer Blick (Ablagerungen).',
    ],
    artikel: [A.nichtWarm],
  },
  waerme: {
    titel: 'Die Wärme kommt nicht im Raum an', stufe: 'selbst',
    ursache: 'Der Heizkörper wird warm, aber die Wärme wird gebremst: von Staub zwischen den Lamellen, einer Verkleidung, Möbeln oder langen Vorhängen davor.',
    schritte: [
      'Möbel und lange Vorhänge vom Heizkörper wegrücken. Das Thermostat darf nicht verdeckt sein, sonst regelt es zu früh ab.',
      'Heizkörper innen reinigen: Gitter ab, mit langer Bürste und Föhn auf kalter Stufe den Staub zwischen den Lamellen lösen.',
      'Eine Verkleidung braucht mindestens 10 cm Abstand und große Öffnungen oben und unten, das Thermostat muss frei bleiben.',
    ],
    artikel: [A.reinigen, A.verkleidung], produkt: ['Heizkörperbürste', 'Heizkörperbürste lang'],
  },
  'nach-entlueften': {
    titel: 'Trotz Entlüften kalt: Ventilstift prüfen', stufe: 'selbst',
    ursache: 'Ist die Luft raus und der Heizkörper bleibt kalt, ist der Ventilstift der nächste Kandidat. Lief beim Entlüften die Pumpe, ist außerdem nur ein Teil der Luft herausgekommen.',
    schritte: [
      'Thermostatkopf abnehmen und prüfen, ob der Stift darunter locker zurückfedert. Klemmt er, sachte mit der Zange hin und her bewegen, nicht ziehen.',
      'Lief beim Entlüften die Pumpe: noch einmal entlüften, diesmal mit ausgeschalteter Pumpe und 30 bis 60 Minuten Wartezeit.',
      'Danach den Druck prüfen. Beim Entlüften geht Wasser verloren.',
    ],
    artikel: [A.klemmt, A.pumpe], produkt: ['Kleine Wasserpumpenzange', 'Wasserpumpenzange klein'],
  },
  'druck-niedrig': {
    titel: 'Der Druck ist zu niedrig', stufe: 'teils',
    ursache: 'Ist zu wenig Wasser im System, kommt es oben im Haus nicht mehr an. Typisch: Die oberen Heizkörper bleiben kalt oder gluckern, oft einige Tage oder Wochen nach dem Entlüften.',
    schritte: [
      'Manometer an der Heizung ablesen. Im Einfamilienhaus sind meist 1 bis 2 bar richtig, maßgeblich ist der grüne Bereich bzw. die Anleitung deiner Heizung.',
      'Zu niedrig: Wasser nachfüllen, mit Füllschlauch und Systemtrenner am KFE-Hahn der Heizung.',
      'Danach die Heizkörper entlüften und den Druck noch einmal prüfen.',
      'Musst du ständig nachfüllen, verliert die Anlage Wasser: dann den Fachbetrieb rufen.',
    ],
    hinweis: 'In der Mietwohnung füllt der Vermieter nach.',
    artikel: [A.nachfuellen, A.gluckert], produkt: ['Füllset mit Systemtrenner', 'Heizung Füllschlauch Systemtrenner'],
  },
  'druck-hoch': {
    titel: 'Der Druck ist zu hoch', stufe: 'teils',
    ursache: 'Steht der Zeiger über der Markierung oder im roten Bereich, ist zu viel Wasser im System.',
    schritte: [
      'Am Entleerungshahn (KFE-Hahn) einen Schlauch anschließen, das andere Ende in einen Eimer, den Hahn langsam öffnen und das Manometer beobachten.',
      'Für kleine Mengen geht es auch am Entlüftungsventil eines Heizkörpers, mit einem Gefäß darunter.',
      'Vorsicht: Heizungswasser kann heiß und stark verschmutzt sein. Immer nur wenig ablassen und zwischendurch den Druck prüfen.',
      'Steigt der Druck danach wieder: Fachbetrieb rufen.',
    ],
    hinweis: 'In der Mietwohnung ist auch das Sache des Vermieters.',
    artikel: [A.nachfuellen],
  },
  'druck-faellt': {
    titel: 'Der Druck fällt immer wieder', stufe: 'fachbetrieb',
    ursache: 'Musst du ständig nachfüllen, verliert die Anlage irgendwo Wasser, oder das Ausdehnungsgefäß ist defekt.',
    schritte: [
      'Auf Wasser an Heizkörpern, Ventilen und Rohren achten.',
      'Druck kalt und nach dem Aufheizen ablesen und notieren. Steigt er beim Aufheizen stark oder tropft dabei das Sicherheitsventil, ist oft das Ausdehnungsgefäß defekt.',
      'Den Heizungsbauer rufen. Dauerndes Nachfüllen bringt immer wieder frisches, sauerstoffreiches Wasser ins System, und das ist auf Dauer schlecht für die Anlage.',
    ],
    hinweis: 'Vermieter oder Hausverwaltung informieren.',
    artikel: [A.ausdehnung, A.nachfuellen],
  },
  'druck-steigt': {
    titel: 'Der Druck steigt immer weiter', stufe: 'fachbetrieb',
    ursache: 'Oft ist das Ausdehnungsgefäß defekt, oder über einen Wärmetauscher gelangt Trinkwasser in den Heizkreis. Auch ein nicht ganz geschlossener Füllhahn kann der Grund sein.',
    schritte: [
      'Prüfen, ob der Füllhahn ganz geschlossen ist.',
      'Ist der Druck im roten Bereich, etwas Wasser ablassen (siehe „Druck zu hoch“).',
      'Den Heizungsbauer rufen.',
    ],
    hinweis: 'Vermieter oder Hausverwaltung informieren.',
    artikel: [A.ausdehnung, A.nachfuellen],
  },
  stoerung: {
    titel: 'Die Heizung selbst meldet eine Störung', stufe: 'fachbetrieb',
    ursache: 'Sind alle Heizkörper kalt und zeigt die Heizung einen Fehler, liegt es nicht an den Heizkörpern, sondern an der Heizung.',
    schritte: [
      'Fehlercode in der Anleitung der Heizung nachschlagen.',
      'Druck am Manometer prüfen.',
      'Bei einer Störungsmeldung den Heizungsbauer rufen.',
    ],
    hinweis: 'Vermieter oder Hausverwaltung sofort informieren.',
    artikel: [A.nichtWarm, A.abWann],
  },
  'alle-kalt': {
    titel: 'Alle Heizkörper kalt: Einstellung der Heizung prüfen', stufe: 'teils',
    ursache: 'Sind alle Heizkörper kalt, liegt es nicht an einem Ventil, sondern an der Heizung oder ihrer Einstellung.',
    schritte: [
      'Ist die Heizung im Winterbetrieb und nicht nur auf Warmwasser?',
      'Ist der Druck im grünen Bereich?',
      'Hilft das nicht: Anleitung der Heizung zur Hand nehmen oder den Heizungsbauer rufen.',
    ],
    hinweis: 'In der Heizperiode (1. Oktober bis 30. April) muss der Vermieter dafür sorgen, dass du tagsüber mindestens 20 °C erreichst. Schriftlich melden und eine Frist setzen.',
    artikel: [A.nichtWarm, A.abWann],
  },
  mehrere: {
    titel: 'Mehrere Heizkörper kalt: erst Druck, dann Luft', stufe: 'teils',
    ursache: 'Werden mehrere Heizkörper nicht warm, steckt meist die Anlage dahinter: zu wenig Druck, Luft in mehreren Heizkörpern, die Pumpe oder ein fehlender Abgleich.',
    schritte: [
      'Druck am Manometer prüfen und bei Bedarf Wasser nachfüllen.',
      'Alle Heizkörper entlüften, mit ausgeschalteter Pumpe, unten anfangen.',
      'Hilft beides nicht: Pumpe und hydraulischen Abgleich vom Fachbetrieb prüfen lassen.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.nichtWarm, A.nachfuellen, A.abgleich],
  },
  abgleich: {
    titel: 'Der hydraulische Abgleich fehlt', stufe: 'fachbetrieb',
    ursache: 'Ohne Abgleich nimmt das Wasser den kürzesten Weg. Heizkörper nah an der Heizung werden sehr heiß, weit entfernte bleiben kühl.',
    schritte: [
      'Erst Luft und Druck ausschließen: entlüften und das Manometer prüfen.',
      'Hydraulischen Abgleich beim Fachbetrieb anfragen. Nach dem genaueren Verfahren B kostet er im Einfamilienhaus grob 650 bis 1.200 Euro und lässt sich fördern.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.abgleich, A.nichtWarm], produkt: ['Infrarot-Thermometer', 'Infrarot Thermometer Heizung'],
  },
  'pumpe-lief': {
    titel: 'Beim Entlüften lief die Pumpe', stufe: 'selbst',
    ursache: 'Läuft die Umwälzpumpe beim Entlüften weiter, wirbelt sie die Luftblasen durch den Kreislauf. Dann kommt nur ein Teil der Luft heraus, und wenige Tage später gluckert es wieder.',
    schritte: [
      'Heizung bzw. Pumpe ausschalten und 30 bis 60 Minuten warten.',
      'Noch einmal entlüften, am untersten Heizkörper anfangen.',
      'Danach Heizung einschalten und den Druck prüfen.',
    ],
    hinweis: 'Kannst du die Pumpe nicht abschalten, dreh vor dem Entlüften das Thermostatventil zu.',
    artikel: [A.pumpe, A.entlueften], produkt: ['Entlüftungsschlüssel mit Auffangbehälter', 'Entlüftungsschlüssel mit Auffangbehälter'],
  },
  'gluckern-trotz': {
    titel: 'Gluckert trotz richtigem Entlüften', stufe: 'teils',
    ursache: 'Dann ist der Druck danach oft zu niedrig, oder es wurden nicht alle Heizkörper entlüftet, und die Luft sitzt jetzt im nächsten.',
    schritte: [
      'Druck prüfen, denn beim Entlüften geht Wasser verloren. Bei Bedarf nachfüllen.',
      'Alle Heizkörper entlüften und den obersten am Schluss noch einmal.',
      'Gluckert es weiter, läuft oft die Pumpe zu stark oder der Abgleich fehlt. Das stellt der Fachbetrieb ein.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.gluckert, A.nachfuellen],
  },
  'pumpe-abgleich': {
    titel: 'Rauschen oder Pfeifen: Pumpe, Abgleich oder Ventil', stufe: 'fachbetrieb',
    ursache: 'Ein leises Rauschen ist normal. Lautes Rauschen oder Pfeifen kommt meist von einer zu hoch eingestellten Umwälzpumpe, die das Wasser mit zu viel Tempo durch die Rohre drückt. Fehlt der hydraulische Abgleich, bekommen manche Heizkörper zu viel Durchfluss. Auch alte Thermostatventile können Geräusche machen.',
    schritte: [
      'Erst Luft und Druck ausschließen: entlüften und das Manometer ablesen. Pfeifen kann auch von Luft oder zu wenig Druck kommen.',
      'Thermostatköpfe prüfen. Als Faustregel gelten 10 bis 15 Jahre, dann ist ein Tausch fällig.',
      'Pumpenstufe und hydraulischen Abgleich vom Fachbetrieb prüfen und einstellen lassen.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.rauscht, A.abgleich],
  },
  klopfen: {
    titel: 'Klopfen oder Knacken: Rohre und Überströmventil', stufe: 'fachbetrieb',
    ursache: 'Heizungsrohre dehnen sich beim Aufheizen aus und ziehen sich beim Abkühlen zusammen. Reiben sie an Halterungen, knackt es. Beim starken Aufheizen ist das normal. Dauerhaftes Klopfen kann auch von einem falsch eingestellten Überströmventil oder vertauschtem Vor- und Rücklauf kommen.',
    schritte: [
      'Beobachten: Knackt es nur beim Aufheizen und Abkühlen, ist das meist harmlos.',
      'Test für den Fachbetrieb: Heizung abkühlen lassen und prüfen, welches Rohr am Heizkörper zuerst warm wird.',
      'Klopft es dauerhaft: Fachbetrieb rufen. Er prüft Rohrhalterungen, Überströmventil und Anschlüsse.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.rauscht],
  },
  brummen: {
    titel: 'Brummen: meist die Umwälzpumpe', stufe: 'fachbetrieb',
    ursache: 'Brummen kommt meist von der Umwälzpumpe. Sie arbeitet zu stark, ist alt und verschmutzt oder hat einen Lagerschaden. Auch lockere Rohrleitungen können brummen.',
    schritte: [
      'Pumpe nicht selbst verstellen, die richtige Stufe hängt von der ganzen Anlage ab.',
      'Fachbetrieb rufen: Er prüft die Pumpe und tauscht sie bei Bedarf.',
    ],
    hinweis: MIETE_ANLAGE,
    artikel: [A.rauscht],
  },
  'steilheit-hoch': {
    titel: 'Heizkurve: Steilheit etwas erhöhen', stufe: 'teils',
    ursache: 'Ist es nur bei Frost zu kalt, legt die Heizung bei Kälte zu wenig nach. Das regelt die Steilheit (Neigung) der Heizkurve.',
    schritte: [
      'Aktuelle Einstellung fotografieren, damit du zurückkommst.',
      'Im Wohnzimmer das Thermostat ganz aufdrehen.',
      'An einem kalten Tag (unter etwa 5 °C) die Steilheit etwas erhöhen. Nur diese eine Größe ändern.',
      'Mindestens 12 bis 24 Stunden abwarten, bei Fußbodenheizung länger, dann nachjustieren.',
    ],
    hinweis: 'In Mietwohnungen mit Zentralheizung ist die Heizkurve Sache des Vermieters oder der Hausverwaltung.',
    artikel: [A.kurve],
  },
  'steilheit-runter': {
    titel: 'Heizkurve: Steilheit etwas senken', stufe: 'teils',
    ursache: 'Ist es nur bei Frost zu warm, legt die Heizung bei Kälte zu stark nach. Das regelt die Steilheit (Neigung) der Heizkurve.',
    schritte: [
      'Aktuelle Einstellung fotografieren, damit du zurückkommst.',
      'Im Wohnzimmer das Thermostat ganz aufdrehen.',
      'An einem kalten Tag (unter etwa 5 °C) die Steilheit etwas senken. Nur diese eine Größe ändern.',
      'Mindestens 12 bis 24 Stunden abwarten, bei Fußbodenheizung länger, dann nachjustieren.',
    ],
    hinweis: 'In Mietwohnungen mit Zentralheizung ist die Heizkurve Sache des Vermieters oder der Hausverwaltung.',
    artikel: [A.kurve],
  },
  'niveau-hoch': {
    titel: 'Heizkurve: Niveau etwas erhöhen', stufe: 'teils',
    ursache: 'Ist es bei jedem Wetter etwas zu kalt, liegt die ganze Heizkurve zu tief. Das verschiebt das Niveau.',
    schritte: [
      'Aktuelle Einstellung fotografieren, damit du zurückkommst.',
      'Im Wohnzimmer das Thermostat ganz aufdrehen.',
      'Das Niveau um ein bis zwei Stufen erhöhen. Nur diese eine Größe ändern.',
      'Mindestens 12 bis 24 Stunden abwarten, bei Fußbodenheizung länger, dann nachjustieren.',
    ],
    hinweis: 'In Mietwohnungen mit Zentralheizung ist die Heizkurve Sache des Vermieters oder der Hausverwaltung.',
    artikel: [A.kurve],
  },
  'niveau-runter': {
    titel: 'Heizkurve: Niveau etwas senken', stufe: 'teils',
    ursache: 'Ist es bei jedem Wetter etwas zu warm, liegt die ganze Heizkurve zu hoch. Das verschiebt das Niveau, und eine niedrigere Kurve spart Energie.',
    schritte: [
      'Aktuelle Einstellung fotografieren, damit du zurückkommst.',
      'Im Wohnzimmer das Thermostat ganz aufdrehen.',
      'Das Niveau um ein bis zwei Stufen senken. Nur diese eine Größe ändern.',
      'Mindestens 12 bis 24 Stunden abwarten, bei Fußbodenheizung länger, dann nachjustieren.',
    ],
    hinweis: 'In Mietwohnungen mit Zentralheizung ist die Heizkurve Sache des Vermieters oder der Hausverwaltung.',
    artikel: [A.kurve],
  },
};

export const HEIZUNG: Diagnose = { name: 'heizung', fragen, ergebnisse, hinweisTitel: 'Mietwohnung' };
