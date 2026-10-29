# Prompt: Website „Haus in Steinen“

Baue die Website für „Haus in Steinen“, einen deutschen Dienst, der aus den Maßen und Fotos eines echten Hauses ein Modell
aus handelsüblichen Klemmbausteinen entwirft und dafür eine Bauanleitung, eine Teileliste mit echten Teilenummern, eine
3D-Seite und einen kurzen Film verkauft. Die Steine kauft der Kunde selbst bei LEGO® Pick a Brick oder bei
BrickLink-Händlern. Vorbild für das Prinzip ist bricklane.online, der Unterschied: Der Kunde sieht sein Haus im Browser,
bevor er zahlt, alles ist deutsch, und es gibt Anlässe und Vertriebswege für Makler.

## 1. Versprechen und Ton

- Überschrift der Startseite: „Bau dein Haus in 60 Sekunden. Erst dann entscheidest du.“
- Versprechen in jeder Fußzeile und auf jedem Deckblatt: Lieferung in 3 Tagen, Geld zurück, wenn es nicht baubar ist,
  „baubar geprüft: kein loser Stein“.
- Ton: klar, warm, ohne Werbesprache, Du-Form, kurze Sätze. Keine Emojis, keine Ausrufezeichen.
- Markenregel: Das Wort LEGO erscheint nie im Namen, in der Domain, im Logo oder in Überschriften. Nur beschreibend mit ®
  und diesem Hinweis in jeder Fußzeile: „Kein offizielles LEGO® Produkt. LEGO® ist eine Marke der LEGO Gruppe, die diese
  Seite weder unterstützt noch genehmigt.“ Keine LEGO-Fotos, keine Minifiguren, keine Verpackungen im LEGO-Look, nur eigene
  Renderings. Fremdsteine heißen „Klemmbausteine“, nie „Legosteine“.

## 2. Gestaltung

- Farben: Papier #f4f1ea, Band #e9e3d6, Karte #fffdf8, Text #1d2326, Nebentext #5e6569, Linie #d7d0c2, Akzent #e0612e
  (das Orange der neuen Steine in jeder Anleitung). Dunkelmodus mit denselben Rollen: Hintergrund #16191b, Karte #1c2124,
  Text #ebe8e0, Akzent #ea7a4c. Die Bühne der 3D-Renderings bleibt in beiden Modi hell (#e9ebe4).
- Schrift: Bricolage Grotesque für Überschriften, IBM Plex Sans für Text, IBM Plex Mono für Teilenummern, Maße und Labels.
- Layout: eine Bauanleitung als Website. Linksbündig, maximale Breite 1120 px, Karten nur, wo etwas ein eigenes Objekt ist.
  Funktioniert bei 400 px Breite ohne Querscrollen und im Dunkelmodus.

## 3. Aufbau der Startseite, in dieser Reihenfolge

1. Hinweisleiste (nur im Entwurf), Kopf mit Logo „Haus in Steinen“, Navigation, Knopf „Mein Haus in 60 Sekunden“.
2. Hero: Überschrift, zwei Sätze Erklärung, Zeile mit dem Versprechen.
3. **Konfigurator** (Abschnitt 4).
4. Anlässe: Einzug, Richtfest-Edition (Rohbau ohne Dach, Dach später als zweite Anleitung), Abschied vom Elternhaus (eine
   Anleitung, bis zu vier Widmungsseiten), Jubiläum („40 Jahre Musterstraße 4“). Jede Karte setzt Edition und Anlass im
   Bestellformular, Rohbau schaltet den Konfigurator auf Rohbau.
5. So geht’s in vier Schritten: Adresse und Fotos, wir setzen die Details, Steine bestellen, bauen.
6. Was du bekommst: PDF-Anleitung (eine Seite je Reihe, neue Steine orange, Teile der Reihe links, Widmungsseite,
   Prüfsiegel), Teileliste (Pick-a-Brick-Liste und BrickLink-Wunschliste), 3D-Seite mit privatem Link, Film 15 Sekunden
   Hochformat. Darunter die Teileliste des gerade konfigurierten Hauses, live.
7. Für Makler, Bauträger, Fertighaus, Architekten: Abschlussgeschenk zur Schlüsselübergabe, Haustypen als Modell,
   Staffelpreise 19 € je Haus ab 10 und 15 € ab 25, Rechnung mit Umsatzsteuer, Co-Branding (Logo auf Deckblatt und
   3D-Seite, Übergabekarte), kostenloses Musterhaus als Einstieg.
8. Preise: Haus 29 € (ein Gebäude bis 32 × 32 Noppen, alle vier Dateien, Widmung, Gutscheinkarte), Haus mit Umfeld 49 €
   (Garten, Garage, Anbau, Carport oder Innenleben, eine Änderungsrunde, Richtfest- und Abschieds-Edition), Firmensitz
   149 € (bis 48 × 48 Noppen, zwei Änderungsrunden, Rechnung mit Umsatzsteuer).
9. Fragen: Ist das LEGO®? Wie genau wird mein Haus? Was heißt baubar geprüft? Woher die Steine? Was, wenn ein Teil fehlt?
   Wie lange dauert es?
10. Bestellformular (Abschnitt 6), Fußzeile mit Markenhinweis, Impressum, AGB, Widerruf, Datenschutz, OpenStreetMap-Hinweis.

## 4. Konfigurator

Eingaben, in dieser Reihenfolge: Straße mit Hausnummer und Ort; Fotos (bis zu 8, Vorschau); Breite und Tiefe in Metern;
Geschosse 1 bis 3; Dach (Satteldach, Flachdach, Rohbau); Fenster vorne und hinten je Geschoss 1 bis 4; Wandfarbe (Weiß,
Sand, Rot, Hellgrau, Gelb, Ocker); Dachfarbe (Dunkelrot, Anthrazit, Schwarz, Braun); Türfarbe.

- **Adresse:** Beim Verlassen des Feldes, bei Enter oder per Knopf „Maße holen“ wird OpenStreetMap befragt (Nominatim mit
  polygon_geojson und extratags, auf der echten Seite über den eigenen Server mit Zwischenspeicher, höchstens eine Anfrage
  je Sekunde; Overpass als zweite Quelle, wenn die Adresse nur ein Punkt ist). Aus dem Gebäudepolygon wird das kleinste
  umschließende Rechteck berechnet, Breite und Tiefe werden übernommen, ebenso building:levels als Geschosse und
  roof:shape als Dachform, wenn vorhanden. Ohne Umriss sagt die Seite das und der Kunde tippt die Maße ein.
- **Fotos:** Vorschaubilder, aus dem ersten Foto ein Vorschlag für Wand- und Dachfarbe (Medianfarbe der Bildmitte und
  des oberen Bereichs, nächste Steinfarbe), als Vorschlag gekennzeichnet. Fensterraster, Tür, Anbau und Garage werden
  nach der Bestellung aus den Fotos gesetzt.
- **Generator, deterministisch, läuft im Browser:** 1 Noppe = 0,6 m. Breite und Tiefe werden auf gerade Noppenzahlen
  zwischen 8 und 32 gerundet. Ein Geschoss ist 4 Steine hoch. Wände sind eine Noppe dick, Reihen im Verband (Fugen je
  Reihe versetzt, Ecken wechseln je Reihe die Wand), Steine 1×1, 1×2, 1×3, 1×4, 1×6 (Teilenummern 3005, 3004, 3622,
  3010, 3009). Fenster 1×2×2 (60592 mit Glas 60601) ab der zweiten Reihe jedes Geschosses, gleichmäßig verteilt, nie in
  der Ecke, mit mindestens einer Noppe Abstand; die Tür 1×2×3 (3860 Rahmen, 3861 Tür) mittig vorne, Fenster weichen ihr
  aus. Satteldach: je Reihe eine Noppe nach innen und einen Stein nach oben, Schrägsteine 45° 2×1 (3040) vorne und
  hinten, Giebelwände und Stützen alle vier Noppen dazwischen, First aus 3043. Flachdach: Platten 2×4, 2×2, 1×4, 1×2, 1×1
  (3020, 3022, 3710, 3023, 3024). Rohbau: keine Dachreihen. Grundplatte 32×32 (3811) bis 26 Noppen, sonst 48×48 (4186).
  Jede Reihe ist ein Bauschritt mit Namen („Erdgeschoss, Reihe 2, Fenster einsetzen“, „Dach, Reihe 3“, „First setzen“).
- **Ausgabe, live bei jeder Änderung:** Steine gesamt, Teilearten, Reihen, Richtpreis der Steine (Einzelpreise je
  Teilenummer, Grundplatte eingerechnet, als Richtwert gekennzeichnet), 3D-Modell, Teileliste als Tabelle mit Teil,
  Farbe, Nummer, Stück, Einzelpreis, Summe.
- **3D-Modell:** three.js, orthografische Kamera, Modell mit Noppen, Schrägen und Glas, ziehen zum Drehen, Reihen vor
  und zurück, Fortschrittsbalken, „Aufbau abspielen“, neue Steine der aktuellen Reihe orange. Ohne WebGL ein Standbild
  und ein Hinweis, Zahlen und Teileliste rechnen trotzdem.
- Knopf „Anleitung für dieses Haus · 29 €“ übernimmt alle Werte ins Bestellformular.

## 5. Beispiele

Drei fertig gerechnete Häuser mit echten Teilelisten, erfundene Familien, als Beispiel gekennzeichnet: Elternhaus
(16 × 12 Noppen, zwei Geschosse, Sand und Dunkelrot, 256 Steine), Bungalow (14 × 10, ein Geschoss, Weiß und Anthrazit,
154 Steine), Backsteinhaus (12 × 10, zwei Geschosse, Rot und Schwarz, 190 Steine). Später Kirche, Ferienhaus, Firmensitz.

## 6. Bestellformular und Zahlung

Edition (Komplett 29 €, Richtfest-Rohbau 49 €, Abschied 49 €), Anlass (Einzug, Richtfest, Abschied, Jubiläum, Hochzeit,
Makler), Zusammenfassung des konfigurierten Hauses, Fotos aus dem Konfigurator, Widmung (80 Zeichen), Geschichte,
Name, E-Mail, drei Häkchen (Fotorechte und Steine nicht enthalten; Planung beginnt sofort und Verzicht auf Widerruf für
digitale Inhalte; freiwillige Erlaubnis, das Modell als Beispiel zu zeigen). Der Knopf zeigt den Preis der Edition.
Auf der echten Seite: Formular an PHP mit Foto-Upload in einen Ordner außerhalb des Webroots, Weiterleitung zu Stripe
Checkout mit Stripe Tax, Webhook zurück an PHP, Bestellung als Datei mit Nummer, Mails an Betreiber und Kunde,
Gutscheincodes für Makler und die ersten 20 kostenlosen Häuser.

## 7. Auslieferung nach der Bestellung

Ein Lauf holt die Bestellung, liest aus Fotos und Maßen das Haus als Daten (Geschosse, Fenster je Fassade mit relativer
Position und Breite, Tür, Dachform, Farben, Anbau, Garage), übersetzt sie ins Noppenraster und erzeugt: PDF-Anleitung
(Deckblatt mit Widmung und Prüfsiegel, „Bevor du anfängst“, Teileliste mit Bildern, eine Seite je Reihe), Teileliste
als Pick-a-Brick-Liste und BrickLink-Wunschliste (XML), 3D-Seite unter privatem Link, Film 15 Sekunden Hochformat.
Vor dem Versand eine Freigabe durch den Betreiber mit Modell neben Foto, danach Mail an den Kunden. Preise der Teile
werden am Liefertag geprüft.

## 8. Recht

Impressum, AGB (Lieferfrist 3 Tage, Ablehnung mit voller Erstattung, Nutzung privat, Haftung auf den Kaufpreis
begrenzt), Widerrufsbelehrung mit Verzicht für digitale Inhalte, Datenschutz (Fotos nur zur Planung, Löschung nach 90
Tagen, Stripe, Mailversand, OpenStreetMap-Abfrage), Hinweis „© OpenStreetMap-Mitwirkende“ beim Adressabruf, LEGO®-Hinweis
wie oben. Preise brutto.

## 9. Technik

Astro-Seite nach dem Muster der bestehenden Seiten im Repo (Ordner `klemmbausteine/site/`, Eintrag in
`websites/websites.json`, Upload und Prüfungen über `websites/erzeugen.py`), Hosting auf IONOS-Webspace mit PHP für
Adressabruf, Bestellung und Webhook, Cloudflare davor. Der Generator liegt als JavaScript in der Seite und zusätzlich als
Node-Skript für die Auslieferung (`klemmbausteine/prototyp/`), Rendering mit three.js in Playwright, PDF aus HTML.
Geheimnisse nur als GitHub-Secrets. Qualität: keine Skriptfehler, Lighthouse-Prüfung, html-validate, pa11y, Dunkelmodus.

## 10. Nicht-Ziele

Keine Steine im Paket, kein Versand, keine Lagerhaltung. Keine beliebigen Orte wie bei Bricklane, nur Gebäude. Keine
Mosaike als Hauptprodukt, höchstens als Zusatz im Warenkorb. Keine LEGO-Marken, Figuren oder Set-Nachbauten.
