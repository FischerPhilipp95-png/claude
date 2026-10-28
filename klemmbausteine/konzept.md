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
