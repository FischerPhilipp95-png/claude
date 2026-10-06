// Feuchte- und Schimmel-Diagnose (/rechner/feuchte-diagnose/). Jede Aussage stammt aus den Raumklima-Artikeln der Website
// (Quellen stehen dort: Umweltbundesamt, Verbraucherzentrale, ADAC). Neue Ursachen erst dort belegen, dann hier eintragen.
// Aufbau und Regeln: src/diagnose.ts.
import type { Diagnose, Ergebnis, Frage } from '../diagnose';

const fragen: Record<string, Frage> = {
  start: {
    frage: 'Was ist los in deiner Wohnung?',
    optionen: [
      { key: 'fenster', icon: 'app-window', text: 'Die Fenster beschlagen innen', frage: 'fenster' },
      { key: 'schimmel', icon: 'bug', text: 'Ich sehe Schimmel oder schwarze Flecken', frage: 'schimmel' },
      { key: 'feucht', icon: 'droplets', text: 'Die Luft fühlt sich feucht an oder es riecht muffig', frage: 'messen' },
      { key: 'keller', icon: 'warehouse', text: 'Der Keller ist feucht oder riecht muffig', ergebnis: 'keller' },
      { key: 'trocken', icon: 'sun', text: 'Die Luft ist sehr trocken', ergebnis: 'trocken' },
      { key: 'zugluft', icon: 'wind', text: 'Es zieht am Fenster', ergebnis: 'zugluft' },
      { key: 'scheiben', icon: 'layers', text: 'Das Fenster beschlägt außen oder zwischen den Scheiben', frage: 'scheiben' },
    ],
  },
  fenster: {
    frage: 'Wann beschlagen die Fenster?',
    optionen: [
      { key: 'morgens', text: 'Morgens, vor allem im Schlafzimmer', ergebnis: 'schlafzimmer' },
      { key: 'kochen', text: 'Nach dem Kochen oder Duschen', ergebnis: 'kochen' },
      { key: 'neu', text: 'Seit wir neue Fenster haben', ergebnis: 'neue-fenster' },
      { key: 'staendig', text: 'Fast jeden Tag, das Wasser bleibt stehen', frage: 'messen' },
    ],
  },
  messen: {
    frage: 'Was zeigt das Hygrometer im Raum?',
    hilfe: 'Gemeint ist der Dauerwert über ein paar Tage, nicht der Wert direkt nach dem Duschen oder Kochen.',
    optionen: [
      { key: 'ok', text: '40 bis 60 %', ergebnis: 'kalte-stellen' },
      { key: 'erhoeht', text: '60 bis 70 %', ergebnis: 'erhoeht' },
      { key: 'hoch', text: 'Dauerhaft über 70 %', ergebnis: 'zu-feucht' },
      { key: 'keins', text: 'Ich habe kein Hygrometer', ergebnis: 'hygrometer' },
    ],
  },
  schimmel: {
    frage: 'Wo ist der Schimmel, und wie groß ist die Fläche?',
    hilfe: '0,5 m² sind etwa ein Quadrat von 70 mal 70 Zentimetern.',
    optionen: [
      { key: 'klein', text: 'Kleine Stelle an der Wand, bis etwa 0,5 m²', ergebnis: 'schimmel-klein' },
      { key: 'fenster', text: 'Am Fensterrahmen oder in der Fensterlaibung', ergebnis: 'schimmel-fenster' },
      { key: 'fuge', text: 'In der Silikonfuge im Bad', ergebnis: 'schimmel-fuge' },
      { key: 'gross', text: 'Größer als 0,5 m² oder tief im Putz', ergebnis: 'schimmel-gross' },
      { key: 'wieder', text: 'Er kommt immer wieder, obwohl ich lüfte und heize', ergebnis: 'schimmel-wieder' },
    ],
  },
  scheiben: {
    frage: 'Wo genau beschlägt das Fenster?',
    optionen: [
      { key: 'aussen', text: 'Außen, morgens', ergebnis: 'aussen' },
      { key: 'zwischen', text: 'Zwischen den Glasscheiben', ergebnis: 'isolierglas' },
    ],
  },
};

const A = {
  beschlagen: ['/artikel/fenster-beschlagen/', 'Fenster beschlagen innen: Ursachen und was hilft'],
  feuchte: ['/artikel/luftfeuchtigkeit-wohnung/', 'Luftfeuchtigkeit in der Wohnung: Welcher Wert ist richtig?'],
  schimmel: ['/artikel/schimmel-entfernen/', 'Schimmel entfernen: Was du selbst darfst'],
  entfeuchter: ['/artikel/luftentfeuchter/', 'Luftentfeuchter: Kompressor, Adsorption oder Granulat?'],
  abdichten: ['/artikel/fenster-abdichten/', 'Fenster abdichten gegen Zugluft'],
  taupunkt: ['/rechner/taupunkt/', 'Taupunkt- und Schimmel-Rechner'],
  heizen: ['/artikel/ab-wann-heizen/', 'Ab wann heizen? Temperaturen für jeden Raum'],
  nichtWarm: ['/artikel/heizkoerper-wird-nicht-warm/', 'Heizkörper wird nicht warm'],
} satisfies Record<string, [string, string]>;
const LUEFTEN = 'Stoßlüften: 3- bis 4-mal am Tag Fenster ganz öffnen, im Winter je 3 bis 5 Minuten, im Frühling und Herbst 10 bis 20 Minuten. Nicht dauerhaft kippen.';
const MIETE_SCHIMMEL = 'Kleine Stellen darfst du selbst entfernen. Informiere den Vermieter, vor allem wenn der Schimmel größer ist oder wiederkommt. Schimmel kann ein Mietmangel sein.';

const ergebnisse: Record<string, Ergebnis> = {
  schlafzimmer: {
    titel: 'Feuchte Atemluft im kühlen Schlafzimmer', stufe: 'selbst',
    ursache: 'Ein Mensch gibt in einer Nacht bis zu einem halben Liter Wasser ab. Im meist kühlen Schlafzimmer schlägt sich das morgens an der kältesten Stelle nieder, und das ist im Winter oft die Fensterscheibe.',
    schritte: [
      'Direkt nach dem Aufstehen stoßlüften, Fenster ganz auf.',
      'Das Wasser auf der Scheibe abwischen, sonst entstehen Stockflecken und Schimmel am Rahmen.',
      'Das Schlafzimmer nicht unter 16 bis 18 °C auskühlen lassen und leicht mitheizen.',
      'Tür zum warmen Wohnzimmer zu lassen, sonst zieht warme, feuchte Luft hinein und kondensiert an den kalten Flächen.',
    ],
    artikel: [A.beschlagen, A.feuchte], produkt: ['Akku-Fenstersauger', 'Akku Fenstersauger'],
  },
  kochen: {
    titel: 'Kurzzeitig feucht nach Kochen oder Duschen', stufe: 'selbst',
    ursache: 'Beim Kochen und Duschen entsteht viel Wasserdampf. Dass die Scheiben dann kurz beschlagen, ist normal. Wichtig ist, dass die Feuchtigkeit danach durch Lüften wieder sinkt.',
    schritte: [
      'Nach dem Duschen und Kochen sofort lüften.',
      'Die Tür zum Rest der Wohnung dabei schließen, damit der Dampf nicht in kühle Räume zieht.',
      'Bleibt die Feuchtigkeit danach lange hoch, mit einem Hygrometer nachmessen.',
    ],
    artikel: [A.beschlagen, A.feuchte],
  },
  'neue-fenster': {
    titel: 'Dichte neue Fenster: Feuchtigkeit bleibt im Raum', stufe: 'selbst',
    ursache: 'Neue Fenster sind dicht, die Feuchtigkeit bleibt im Raum. Alte Fenster ließen ständig etwas Luft durch. Mit neuen Fenstern musst du deshalb bewusster lüften. Defekte Fenster sind dagegen nur selten schuld.',
    schritte: [LUEFTEN, 'Luftfeuchtigkeit mit einem Hygrometer im Blick behalten: 40 bis 60 % sind ideal.', 'Wasser auf der Scheibe morgens abwischen.'],
    artikel: [A.beschlagen, A.feuchte], produkt: ['Hygrometer', 'Hygrometer digital innen'],
  },
  'kalte-stellen': {
    titel: 'Luft in Ordnung, aber kalte Stellen', stufe: 'teils',
    ursache: 'Bei 40 bis 60 % ist die Raumluft in Ordnung. Wird es trotzdem nass, ist eine Fläche zu kalt: Fensterscheibe, Außenwand, Ecke oder die Wand hinter einem Schrank. Dort ist die Luft kühler und damit feuchter als in der Raummitte.',
    schritte: [
      'Mit dem Taupunkt-Rechner prüfen, ab welcher Wandtemperatur es bei deiner Luftfeuchtigkeit nass wird.',
      'Räume nicht unter 16 bis 18 °C auskühlen lassen, auch wenig genutzte nicht.',
      'Möbel ein paar Zentimeter von Außenwänden abrücken und Vorhänge nicht über den Heizkörper hängen.',
      'Zugluft am Fenster abstellen, sie kühlt die Laibung aus.',
      'Bleibt eine Stelle trotzdem nass oder schimmelt, kann eine Wärmebrücke oder ein Bauschaden dahinterstecken. Das sollte ein Fachmann prüfen.',
    ],
    hinweis: 'Bauschäden und Wärmebrücken sind Sache des Vermieters. Informiere ihn, wenn eine Stelle trotz Lüften und Heizen nass bleibt.',
    artikel: [A.taupunkt, A.feuchte, A.abdichten], produkt: ['Infrarot-Thermometer', 'Infrarot Thermometer'],
  },
  erhoeht: {
    titel: 'Luftfeuchtigkeit etwas zu hoch', stufe: 'selbst',
    ursache: 'Zwischen 60 und 70 % ist die Luft erhöht feucht. Das Umweltbundesamt nennt 65 bis 70 % als Obergrenze für den Dauerwert. Du solltest öfter lüften.',
    schritte: [
      LUEFTEN,
      'Nach Duschen und Kochen sofort lüften, Tür zum Rest der Wohnung zu.',
      'Wäsche möglichst draußen, im Keller oder im Trockner trocknen. Muss sie in die Wohnung, Tür zu und öfter lüften.',
      'Räume nicht auskühlen lassen.',
    ],
    artikel: [A.feuchte, A.beschlagen],
  },
  'zu-feucht': {
    titel: 'Luft dauerhaft zu feucht: Schimmelgefahr', stufe: 'teils',
    ursache: 'Dauerhaft über 70 % ist zu viel. An kalten Wänden liegt die Feuchtigkeit dann schnell über 80 %, und dort wächst Schimmel. Typische Quellen sind Atmen, Kochen, Duschen, Wäsche in der Wohnung, Pflanzen und zu wenig Lüften.',
    schritte: [
      'Sofort: mehrmals täglich kurz stoßlüften, wie es das Umweltbundesamt rät.',
      'Feuchtequellen verringern: Wäsche nicht in der Wohnung trocknen, nach Duschen und Kochen direkt lüften.',
      'Räume gleichmäßig warm halten und Möbel von Außenwänden abrücken.',
      'Reicht Lüften nicht, etwa beim Wäschetrocknen oder in einem Raum ohne Fenster: ein elektrischer Kompressor-Luftentfeuchter. Granulat-Entfeuchter ziehen nur sehr wenig Wasser aus der Luft.',
      'Ecken, Außenwände und die Wand hinter Schränken auf Schimmel prüfen.',
    ],
    artikel: [A.feuchte, A.entfeuchter, A.schimmel], produkt: ['Kompressor-Luftentfeuchter', 'Luftentfeuchter Kompressor'],
  },
  hygrometer: {
    titel: 'Erst messen: Hygrometer aufstellen', stufe: 'selbst',
    ursache: 'Ohne Messung weißt du nicht, ob die Luft zu feucht ist. Ein digitales Hygrometer kostet nur ein paar Euro und zeigt dir, wann du lüften musst.',
    schritte: [
      'Hygrometer in Brust- bis Kopfhöhe aufstellen, nicht direkt neben Heizkörper, Fenster oder Wasserkocher.',
      'Mehrere Tage beobachten, zu verschiedenen Tageszeiten, vor allem morgens im Schlafzimmer.',
      'Bewerten: 40 bis 60 % sind ideal, dauerhaft über 65 bis 70 % ist zu feucht. Dann diese Diagnose noch einmal mit dem Wert durchgehen.',
    ],
    artikel: [A.feuchte], produkt: ['Hygrometer mit Min-/Max-Speicher', 'Hygrometer digital Thermometer innen'],
  },
  keller: {
    titel: 'Feuchter Keller: Luftentfeuchter passend zur Temperatur', stufe: 'selbst',
    ursache: 'Ein Keller mit muffigem Geruch ist ein typischer Fall für einen elektrischen Luftentfeuchter. Welche Bauart passt, hängt von der Temperatur ab.',
    schritte: [
      'Erst messen: Bleibt die Luftfeuchtigkeit dauerhaft über 60 %, lohnt sich ein Entfeuchter.',
      'Beheizter Keller: Kompressor-Luftentfeuchter, er zieht je nach Gerät 10 bis 25 Liter Wasser am Tag aus der Luft.',
      'Kalter, unbeheizter Keller: Adsorptionsgerät oder Kompressorgerät mit Abtaufunktion. Adsorptionsgeräte brauchen aber mehr Strom.',
      'Granulat-Entfeuchter schaffen nur wenige Milliliter am Tag und reichen für einen Keller nicht.',
      'Nach einem Wasserschaden eher einen Bautrockner mieten. Schimmel an den Wänden sollte ein Fachbetrieb ansehen.',
    ],
    artikel: [A.entfeuchter, A.schimmel], produkt: ['Kompressor-Luftentfeuchter', 'Luftentfeuchter Kompressor 16 Liter'],
  },
  trocken: {
    titel: 'Luft zu trocken', stufe: 'selbst',
    ursache: 'Unter etwa 30 bis 40 % empfinden viele die Luft als unangenehm trocken, Augen und Schleimhäute reagieren. Das kommt im Winter bei viel Heizen vor.',
    schritte: [
      'Weiter stoßlüften, aber weniger lange.',
      'Nicht überheizen. Welche Temperatur für welchen Raum passt, steht im Artikel „Ab wann heizen?“.',
      'Mit einem Hygrometer prüfen: Liegt der Wert über 40 %, ist alles in Ordnung.',
    ],
    artikel: [A.feuchte, A.heizen],
  },
  zugluft: {
    titel: 'Zugluft: Dichtung, Fuge oder Beschlag', stufe: 'selbst',
    ursache: 'Zieht es am Fenster, liegt es fast immer an einer von drei Stellen: an der Dichtung am Flügel, an der Fuge zwischen Rahmen und Wand oder an einem zu locker eingestellten Beschlag. Zugluft kühlt außerdem die Laibung aus und begünstigt Schimmel.',
    schritte: [
      'Die undichte Stelle finden: Kerzenflamme bei geschlossenem Fenster am Rahmen entlangführen (Vorsicht bei Gardinen) oder ein Blatt Papier einklemmen. Lässt es sich leicht herausziehen, ist es dort undicht.',
      'Spalt am Flügel messen und passendes Dichtband kleben: E-Profil bis ca. 3,5 mm, P-Profil bis ca. 5 mm, D-Profil bis ca. 7 mm.',
      'Bei Dreh-Kipp-Fenstern den Beschlag nachstellen.',
      'Zieht es zwischen Rahmen und Mauer, hilft innen oft Acryl. Größere Fugen oder Fugen außen sind ein Fall für den Fachbetrieb.',
    ],
    hinweis: 'Bei undichten Fenstern zuerst den Vermieter informieren.',
    artikel: [A.abdichten], produkt: ['Fensterdichtband', 'Fensterdichtband selbstklebend'],
  },
  aussen: {
    titel: 'Beschlag außen: kein Mangel', stufe: 'normal',
    ursache: 'Beschlagen neue Fenster außen, ist das ein gutes Zeichen: Die Scheibe dämmt gut, die Wärme bleibt drinnen und die Außenseite ist so kalt wie die Luft draußen.',
    schritte: ['Nichts tun. Der Beschlag verschwindet, sobald es draußen wärmer wird.'],
    artikel: [A.beschlagen],
  },
  isolierglas: {
    titel: 'Isolierglas undicht', stufe: 'fachbetrieb',
    ursache: 'Beschlägt das Fenster zwischen den Scheiben, ist das Isolierglas undicht. Das lässt sich nicht von außen reparieren.',
    schritte: ['Das Glas vom Fachbetrieb tauschen lassen.'],
    hinweis: 'Das ist Sache des Vermieters. Melde den Schaden schriftlich.',
    artikel: [A.beschlagen],
  },
  'schimmel-klein': {
    titel: 'Kleine Schimmelstelle: selbst entfernen, Ursache finden', stufe: 'selbst',
    ursache: 'Oberflächlichen Schimmel bis etwa 0,5 m² darfst du selbst entfernen. Wichtig ist danach die Ursache, meist zu viel Feuchtigkeit an einer kalten Stelle.',
    schritte: [
      'Handschuhe, Schutzbrille und eine FFP2-Maske tragen, Fenster öffnen und Türen zu anderen Räumen schließen.',
      'Nicht trocken abbürsten, dabei wirbeln Sporen auf.',
      'Mit 70-prozentigem Alkohol abwischen, auf feuchten Flächen eher 80 %. Kein Essig: Der wirkt auf Wänden oft nicht.',
      'Tuch in einer Tüte im Restmüll entsorgen und die Stelle gut trocknen lassen.',
      'Ursache beheben: Luftfeuchtigkeit messen, stoßlüften, Räume nicht auskühlen lassen, Möbel abrücken.',
      'Allergiker, Asthmatiker, Schwangere und Kleinkinder sollten Schimmel nicht selbst entfernen.',
    ],
    hinweis: MIETE_SCHIMMEL,
    artikel: [A.schimmel, A.feuchte], produkt: ['Schimmelentferner auf Alkoholbasis', 'Schimmelentferner Alkohol chlorfrei'],
  },
  'schimmel-fenster': {
    titel: 'Schimmel am Fenster: Tauwasser ist die Ursache', stufe: 'selbst',
    ursache: 'Beschlägt die Scheibe, läuft das Tauwasser in die Dichtung und auf den Rahmen. Dort entstehen schnell schwarze Stockflecken. Auch Zugluft kühlt die Laibung aus.',
    schritte: [
      'Kleine Stellen bis 0,5 m² mit 70-prozentigem Alkohol entfernen, mit Handschuhen, Schutzbrille und FFP2-Maske.',
      'Das Wasser auf der Scheibe ab jetzt jeden Morgen abwischen.',
      LUEFTEN,
      'Zieht es am Fenster, die Dichtung erneuern.',
    ],
    hinweis: MIETE_SCHIMMEL,
    artikel: [A.beschlagen, A.schimmel, A.abdichten], produkt: ['Akku-Fenstersauger', 'Akku Fenstersauger'],
  },
  'schimmel-fuge': {
    titel: 'Schimmel in der Silikonfuge', stufe: 'selbst',
    ursache: 'Schimmel in Silikonfugen sitzt oft tief im Material. Abwischen hilft dann nur kurz.',
    schritte: [
      'Mit Schutz (Handschuhe, Brille, FFP2-Maske) und 70- bis 80-prozentigem Alkohol abwischen.',
      'Kommt er schnell wieder, die Fuge erneuern.',
      'Nach dem Duschen sofort lüften, Badtür dabei zu.',
    ],
    hinweis: MIETE_SCHIMMEL,
    artikel: [A.schimmel], produkt: ['Schimmelentferner auf Alkoholbasis', 'Schimmelentferner Alkohol chlorfrei'],
  },
  'schimmel-gross': {
    titel: 'Große Schimmelfläche: Fachbetrieb', stufe: 'fachbetrieb',
    ursache: 'Ab etwa 0,5 m² Befallsfläche oder wenn der Schimmel tief im Material sitzt, gehört die Sanierung in die Hand eines Fachbetriebs. Tapete mit Schimmel lässt sich kaum reinigen und muss entfernt werden.',
    schritte: [
      'Nicht selbst großflächig abkratzen oder abbürsten, dabei verteilen sich Sporen.',
      'Fachbetrieb für Schimmelsanierung beauftragen und die Ursache klären lassen.',
      'Bis dahin regelmäßig stoßlüften und den Raum gleichmäßig heizen.',
    ],
    hinweis: 'Den Vermieter informieren, bevor du großflächig etwas machst. Schimmel kann ein Mietmangel sein.',
    artikel: [A.schimmel],
  },
  'schimmel-wieder': {
    titel: 'Schimmel kommt immer wieder: Ursache klären lassen', stufe: 'fachbetrieb',
    ursache: 'Bleibt der Schimmel trotz richtigem Lüften und Heizen, steckt oft ein Bauschaden dahinter, etwa eine undichte Stelle oder eine Wärmebrücke.',
    schritte: [
      'Ein paar Tage die Luftfeuchtigkeit messen und notieren, das hilft bei der Ursachensuche.',
      'Mit dem Taupunkt-Rechner prüfen, ob die Wand an der Stelle zu kalt ist.',
      'Einen Fachmann die Ursache prüfen lassen (Feuchtigkeit, Wärmebrücke, Bauschaden).',
    ],
    hinweis: 'Den Vermieter informieren. Wiederkehrender Schimmel kann auf einen Bauschaden hinweisen und ein Mietmangel sein.',
    artikel: [A.schimmel, A.taupunkt, A.feuchte],
  },
};

export const FEUCHTE: Diagnose = { name: 'feuchte', fragen, ergebnisse, hinweisTitel: 'Mietwohnung' };
