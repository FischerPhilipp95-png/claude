# Dein Haus in Steinen: Klemmbaustein-Modelle nach Maß

Stand 28.10.2026. Das Bricklane-Prinzip (bricklane.online) fast eins zu eins, mit zwei Unterschieden: Wir beginnen mit dem
Objekt, das sich wirklich berechnen lässt, dem eigenen Haus, und wir verkaufen auf Deutsch an Menschen, Makler und Firmen.

## 1. Produkt

**Der Kunde schickt:** Fotos jeder Hausseite, grobe Maße (Breite, Tiefe, Geschosse, Dachform), Farben, auf Wunsch die Geschichte
(„das Haus, in dem wir groß geworden sind“) und den Anlass (Einzug, Richtfest, Hochzeit, Geburtstag der Großeltern).

**Der Kunde bekommt** innerhalb von 3 Tagen, wie bei Bricklane:

1. 3D-Bauseite mit privatem Link: drehen, Schritt für Schritt durchklicken, jeder Stein antippbar.
2. PDF-Anleitung, eine Seite je Reihe, neue Teile orange, Teileliste mit Bildern.
3. Teileliste mit echten Teilenummern und Farben: BrickLink-Wunschliste (XML) zum Hochladen und Pick-a-Brick-Liste, Preise am
   Liefertag geprüft. Die Steine kauft der Kunde selbst, meist 40 bis 120 €.
4. Film, 15 Sekunden Hochformat: Das Haus baut sich selbst.

**Preis:** 29 € je Haus. 49 € mit Garten, Garage, Anbau oder Innenleben, inklusive einer Änderungsrunde. Firmensitz als
Modell für Mitarbeiter oder Messe 149 € mit größerem Maßstab. Nicht baubar: Geld zurück.

**Beispiel:** `beispiel-haus/`: 256 Steine, 12 Teilearten, 15 Bauschritte, Steine geschätzt rund 46 € bei Pick a Brick. Zum
Vergleich bauen Auftragsbauer in den USA Hausmodelle für 1.500 bis 3.800 Dollar bei zehn Wochen Lieferzeit, in Deutschland hat
die Suche keinen Anbieter gefunden.

## 2. Warum das Haus zuerst

Bricklane baut beliebige Orte, dafür braucht es eine KI, die aus Fotos ein 3D-Modell macht, und das wird ungenau. Ein Haus ist
ein Kasten mit Dach: Maße, Geschosse, Fensterraster, Dachform. Daraus entsteht das Modell deterministisch, jeder Stein hat eine
Teilenummer, jede Reihe ist ein Bauschritt. Das ist dieselbe Genauigkeit wie bei einem offiziellen Set. Später kommen dazu:
Kirche und Hochzeitslocation (gleiches Prinzip, mehr Dachformen), Ferienhaus, Vereinsheim, Firmensitz, Schule.

## 3. Besser als Bricklane in drei Punkten

- **Deutsch und europäisch.** Bricklane ist englisch und aus Singapur. Teilelisten mit Pick a Brick DE und BrickLink-Händlern in
  Europa, Preise in Euro, Versandkosten eingerechnet.
- **Kanäle, die Bricklane nicht hat.** Immobilienmakler schenken Käufern das Modell ihres neuen Hauses (Abschlussgeschenk,
  150 € Wert, 29 € Kosten). Fertighaushersteller zeigen ihre Haustypen als Modell. Architekten legen es zum Entwurf. Dazu die
  Privatkunden über Pinterest, Shorts und Suche („Haus als LEGO nachbauen“).
- **Provision auf die Steine.** LEGO hat ein Partnerprogramm (laut Quellen über Rakuten, etwa 3 %, in Deutschland verfügbar).
  Die Pick-a-Brick-Liste verlinkt darüber.

## 4. Aussehen

Wie die Möbelhack-Seite, Aufbau wie Bricklane: lebendes 3D-Haus im Hero, Geschichte des eigenen Elternhauses, sieben
Beispielhäuser (erfundene Familien, klar markiert), die vier Dateien zum Anfassen, Preis, FAQ, Bestellformular mit Fotos,
Maßen, Farben, Anlass. Markenhinweis in jeder Fußzeile. Keine LEGO-Fotos, keine Minifiguren, keine Logos, nur eigene
Renderings. Namen ohne „LEGO“, Vorschläge: Steinhaus, Hausbausteine, Noppenhaus (Domains noch nicht geprüft).

## 5. Kunden gewinnen

1. Shorts und TikTok: „Mein Elternhaus aus 256 Steinen“, der Film kommt gratis aus dem Generator. Reale Bauvideos der
   ersten Kunden danach.
2. Pinterest: jedes Beispielhaus als Pin, Vorher-Nachher mit Foto und Modell.
3. Suchseiten: „Haus aus LEGO nachbauen“, „eigenes Haus als LEGO Modell“, „Haus Bauanleitung Klemmbausteine“.
4. Makler: zwanzig Makler in einer Stadt anschreiben, ein Musterhaus als Geschenk, Staffelpreis ab zehn Häusern.
5. Start wie Bricklane: die ersten 20 Häuser kostenlos gegen Foto des gebauten Modells.
6. Etsy-Listing als personalisierter digitaler Artikel, Nebenkanal.
7. Gemeinschaften: Klemmbaustein-Foren und Facebook-Gruppen (dort heißt es „Klemmbausteine“, nicht LEGO), AFOL-Gruppen,
   Reddit r/lego mit Vorsicht.

## 6. Technik

- Generator (`prototyp/generator.cjs`): Parameter → Steine mit BrickLink-Nummern, Verband, Fenster, Tür, Dach, Schritte,
  Wunschliste. Bewiesen am 28.10.2026.
- Rendering (`prototyp/scene.html`, `render.cjs`): three.js, Noppen, Schrägen, Glas, Bilder je Schritt. Bewiesen.
- Anleitung (`prototyp/anleitung.html`): PDF im Bricklane-Format. Bewiesen.
- Fotos als Eingabe: Schritt 1 ich lese Maße, Fensterraster und Farben aus den Fotos und trage sie ein (Mensch in der
  Schleife wie bei Bricklane), Schritt 2 automatisch über Bilderkennung.
- Preise: Pick a Brick blockt die Cloud, die Live-Prüfung läuft von einem normalen Anschluss oder über die BrickLink-Preise.
- Bestellung, Zahlung, Freigabe: gleiches Gerüst wie bei Möbelhack (PHP auf IONOS, Stripe, Freigabe-Mail).

## 7. Recht

Kein „LEGO“ im Namen, in der Domain, im Logo. Hinweis in jeder Fußzeile wie bei Bricklane: kein offizielles LEGO® Produkt,
LEGO® ist eine Marke der LEGO Gruppe, die diese Seite weder unterstützt noch genehmigt. Teilenummern und Farbnamen sind
Katalogdaten, Anleitungen für eigene Modelle sind erlaubt und werden auf BrickLink in großer Zahl verkauft. Keine Nachbauten
von offiziellen Sets oder geschützten Gebäuden mit Markenrechten (Stadien, Markenlogos am Firmensitz nur mit Freigabe des
Kunden, der die Rechte hält).

## 8. Fahrplan

| Woche | Schritt |
|---|---|
| 1 | Generator erweitern: Walmdach, Flachdach, Anbau, Garage, Dachunterbau vollständig, Fensterraster aus Fotos von Hand |
| 2 | Sieben Beispielhäuser, 3D-Seite im Browser, Film |
| 3 | Website, Bestellformular, Stripe, AGB, Name und Domain |
| 4 | Start: 20 Häuser kostenlos, erste Shorts, Pinterest, Makler-Anschreiben |

## 9. Entscheidungen für Philipp

1. Name und Domain.
2. Nur Häuser zum Start oder gleich auch Kirchen und Locations.
3. Makler als Vertriebsweg sofort oder nach den ersten Privatkunden.
4. Preis 29 € und 49 € oder Einheitspreis.

## 10. Vom Foto zur Anleitung (Stand 28.10.2026, nachmittags)

Ein Foto allein hat keinen Maßstab. Exakt wird es durch drei Quellen, die der Generator zusammenführt:

1. **Maße aus der Adresse.** Der Gebäudeumriss kommt aus OpenStreetMap (Overpass-Abfrage), oft auf den halben Meter genau,
   bei vielen Häusern mit Dachform. Fehlt er, tippt der Kunde Breite und Tiefe ein, oder wir skalieren über die Haustür,
   die in Deutschland fast immer 2,0 bis 2,1 m hoch ist.
2. **Fassaden aus den Fotos.** Ein Bildmodell beschreibt jede Seite als Daten: Geschosse, Fenster je Geschoss mit relativer
   Position und Breite, Tür, Dachform, Farben, Besonderheiten wie Gaube, Balkon, Garage. Anfangs mache ich das je Bestellung
   selbst in wenigen Minuten (Mensch in der Schleife wie bei Bricklane), danach läuft derselbe Schritt automatisch über die
   Claude-API mit festem Ausgabeformat. Beispiel der Ausgabe: `beispiel-haus/analyse_beispiel.json`.
3. **Raster.** `prototyp/raster.cjs` übersetzt Meter und relative Positionen exakt in Noppen: 1 Noppe = 0,6 m, ein Geschoss
   = 4 Steine, Fenster 2 oder 4 Noppen breit, nie in der Ecke, mindestens eine Noppe Abstand. Daraus baut der Generator
   das Modell wie bisher, Stein für Stein mit Teilenummer.

Beweis: `analyse_beispiel.json` (10,5 × 8,2 m, zwei Geschosse, 13 Öffnungen) → 18 × 14 Noppen, 319 Steine, 16 Reihen,
Bilder `foto_front.jpg` und `foto_final.jpg`. Fenster und Tür sitzen dort, wo die Beschreibung sie setzt.

Was „exakt“ bedeutet: Die Anleitung ist exakt für das Modell. Das Modell ist das Haus in Noppenauflösung, so wie ein
LEGO-Architecture-Set ein Gebäude zeigt. Der Kunde sieht vor dem Bau das Modell neben seinem Foto und kann eine
Korrekturrunde nehmen.

Noch offen: Overpass-Abfrage einbauen, Dachformen Walm und Flach, Gauben, Anbau und Garage als zweiter Baukörper, die
automatische Fotoanalyse mit Vergleichsbild zur Kontrolle.

## 11. Katzen, Hunde, Gesichter (Stand 28.10.2026, abends)

Zwei Wege, beide mit exakter Anleitung:

1. **Mosaik aus 1×1-Platten.** Foto → Kopfausschnitt → Raster 48 × 48 oder 64 × 64 → jede Noppe eine echte Steinfarbe
   (24 Farben, die es als Platte 3024 gibt) → Teileliste je Farbe, Wunschliste, Bauabschnitte 16 × 16 mit Koordinaten wie
   bei den großen Mosaik-Sets. Rein rechnerisch, deshalb exakt. Prototyp `prototyp/mosaik.py`, Beispiel `beispiel-katze/`:
   64 × 64 = 4.096 Platten in 15 Farben, Richtpreis rund 250 €, 48 × 48 rund 140 €. Grenzen: Das Foto muss ein naher Kopf
   mit ruhigem Hintergrund sein, bei 48 × 48 wird ein Tier gerade noch erkannt, 64 × 64 ist die sinnvolle Größe. Für ein
   gutes Ergebnis gehört ein Freistellen des Hintergrunds dazu, das ist noch nicht gebaut. Konkurrenz: Brick Me verkauft
   Mosaik-Sets ab 50 £, LEGO selbst ein Porträt-Set für 130 $. Als Zusatzprodukt im selben Shop trotzdem sinnvoll, weil
   Fotos von Haustier und Familie der häufigste Wunsch sind.
2. **Figur im Blockstil.** Für eine dreidimensionale Katze gibt es zwei Möglichkeiten: eine Vorlage je Tierart (sitzende
   Katze, liegender Hund) mit festem Bauplan, bei der nur Farben und Zeichnung aus dem Foto kommen, exakt und immer
   baubar; oder eine KI, die aus Fotos ein 3D-Modell macht, das wir in Steine zerlegen, flexibler, aber unsicher in Form und
   Stabilität. Empfehlung: Vorlagen, drei bis fünf Tierhaltungen reichen für den Start. Noch nicht gebaut.

Für Gesichter von Menschen gilt dasselbe wie für Tiere: Mosaik ja, Figur nur als Vorlage.
