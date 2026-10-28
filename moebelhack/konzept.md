# Möbelhack: IKEA-Möbel nach Maß, selbst gebaut

Stand 28.10.2026. Arbeitstitel „Möbelhack“ (moebelhack.de war am 28.10.2026 laut DENIC frei, ebenso hackplan.de,
einbauhack.de, nischenplan.de). Vorbild ist Bricklane (bricklane.online): Der Kunde schickt etwas Persönliches,
bekommt Entwurf, 3D-Ansicht, Anleitung und eine geprüfte Teileliste, kauft die Teile selbst woanders und baut.

## 1. Die Idee in drei Sätzen

Jeder hat eine Nische, Dachschräge oder Ecke, für die es bei IKEA nichts Passendes gibt, und ein Schreiner kostet
vierstellig. Möbelhack plant das Möbel aus handelsüblichen IKEA-Teilen plus Zuschnitt, liefert 3D-Modell, Anleitung
und Einkaufsliste mit Artikelnummern, Preisen und Verfügbarkeit. Der Kunde zahlt 29 €, bestellt bei IKEA und im
Zuschnitt und baut an einem Nachmittag.

## 2. Das Produkt

**Der Kunde schickt:** Möbeltyp, Maße der Stelle (Breite, Höhe, Tiefe, bei Dachschräge Kniestock und Winkel),
bis zu 6 Fotos, Wandart (Vollziegel, Gipskarton, Beton), vorhandene IKEA-Teile, Stilwünsche, Postleitzahl für den
nächsten IKEA-Markt.

**Der Kunde bekommt** innerhalb von 3 Tagen:

1. **Interaktive 3D-Seite** mit privatem Link: Modell drehen, Schritt für Schritt durchklicken, neue Teile leuchten.
2. **PDF-Anleitung**: Deckblatt, „Bevor du anfängst“, Teileliste mit Bildern, je Schritt eine Seite mit den neuen
   Teilen links und dem Modell rechts, Maßzeichnung für jeden Zuschnitt, Wandbefestigung je Wandart.
3. **Einkaufsliste**: IKEA-Artikelnummern mit Preis und Verfügbarkeit, geprüft am Tag der Lieferung; Zuschnittliste
   als Direktlink für TOSIZE oder als Zettel für den Baumarkt; Schrauben, Winkel, Dübel; Auflagen und Beine mit
   Partnerlinks.
4. **Kurzer Film** (15 bis 20 s, Hochformat): Das Möbel baut sich selbst auf. Der Kunde teilt ihn, wir nutzen ihn
   als Werbung.

**Preise:** 29 € Standard. 49 € für Einbauschrank, Dachschräge und Hochbett (mehr Zuschnitt, mehr Prüfung) inklusive
einer Änderungsrunde. Nicht baubar: Geld zurück, wie bei Bricklane.

**Möbeltypen zum Start** (drei zuerst, die restlichen nachziehen):

| Typ | IKEA-Basis | Zuschnitt | Preis |
|---|---|---|---|
| Sitzbank für Flur oder Fenster | KALLAX liegend + Untergestell oder Beine | Deckplatte | 29 € |
| Regal in der Dachschräge | BILLY gekürzt oder IVAR | Schräge Wange, Füllstück | 49 € |
| Einbauschrank in der Nische | PLATSA oder PAX | Füllstücke, Blende oben | 49 € |
| Schreibtisch in der Nische | ALEX + LAGKAPTEN oder Zuschnittplatte | Platte nach Maß | 29 € |
| Wohnwand mit Einbau-Look | BESTÅ + Zuschnitt-Wangen | Wangen, Blende | 49 € |
| Garderobe | TRONES, BILLY, PAX | Hutablage | 29 € |
| Spielpodest oder Hochbett Kinderzimmer | KALLAX, IVAR | Rahmen, Leiter | 49 €, erst nach Sicherheitskonzept |

## 3. So sieht es aus

Skizzen in `beispiel-flurbank/`: `startseite.png` (Startseite), `anleitung.pdf` (Deckblatt, Teileliste, zwei
Schrittseiten), `final.jpg` und `step1.jpg` bis `step5.jpg` (3D-Renderings). Alles aus dem Prototyp in `prototyp/`
erzeugt, die IKEA-Daten darin sind echt (siehe Abschnitt 6).

**Startseite**, Aufbau wie Bricklane, eigener Inhalt:

1. Hero: lebendes 3D-Modell eines Beispiels, Überschrift „Die Nische, für die es nichts gibt. Jetzt schon.“,
   Knopf „Mein Möbel planen · 29 €“, darunter „Lieferung in 3 Tagen · Geld zurück, wenn es nicht passt · nicht
   mit IKEA verbunden“.
2. „So geht’s“ in vier Schritten: messen, wählen, wir planen, du baust.
3. Sieben Beispiele mit echten Dateien: erfundene Haushalte, klar als Beispiel markiert, jedes mit Materialpreis
   gegenüber Fertigpreis („151 € statt 250 bis 450 €“). Nach den ersten Kunden ersetzen echte Bauten die Beispiele.
4. „Was du bekommst“ mit den vier Dateien zum Anfassen (Bauseite öffnen, PDF blättern, Film abspielen).
5. „Warum nicht einfach der IKEA-Planer?“: Der plant nur IKEA-Standardmaße, keine Schräge, keinen Zuschnitt,
   keine Anleitung für den Umbau.
6. Preis, FAQ (Garantie, Statik, Dachschräge, was wenn ein Teil ausverkauft ist), Fußzeile mit Markenhinweis.

**Bestellformular** (eine Seite, Bestellung wird vor der Zahlung gespeichert):
Möbeltyp als Kacheln, Maße mit kleiner Skizze pro Typ, Fotos, Wandart, vorhandene IKEA-Teile, Stil (Farbe der
Fronten, Holz oder weiß), Budgetrahmen, PLZ, Name und E-Mail, zwei Häkchen (AGB und Widerrufsverzicht für digitale
Inhalte, Freigabe zur Veröffentlichung optional), Zahlung per Stripe.

**Gestaltung:** warmes Sand, Anthrazit, Terrakotta als Akzent. Kein Blau-Gelb, keine IKEA-Fotos, keine IKEA-Logos,
nur eigene Renderings. Schrift Inter.

## 4. Kunden gewinnen

Reihenfolge nach Aufwand und Wirkung. Die Punkte 1 bis 3 sind genau das, was du heute schon mit dem Handwerksdoktor
machst, nur mit anderem Thema.

1. **Suchmaschine, Long-Tail je Möbeltyp.** Eine Seite pro Hack mit freiem Beispielplan als Vorschau und dem
   Bestellknopf: „KALLAX Sitzbank nach Maß“, „PAX Dachschräge Lösung“, „BILLY Dachschräge kürzen“, „Einbauschrank
   Nische IKEA“, „IVAR Hochbett“, „BESTÅ Einbau-Look“. Dazu Ratgeber, die Käufer kurz vor dem Bau suchen:
   „KALLAX Tragkraft liegend“, „PAX an Dachschräge befestigen“, „Zuschnitt online bestellen Vergleich“. Gleiches
   Astro-Gerüst, gleiche Prüfungen und gleicher Upload wie die bestehenden Seiten.
2. **Pinterest.** IKEA-Hacks sind dort ein Dauerthema. Jedes Beispiel liefert fünf Pins (Render, Vorher-Nachher,
   Teileliste als Grafik, Schrittbild, Preisvergleich). Das Pin-Werkzeug aus `blog/site/scripts/pins.mjs` passt.
3. **Shorts und TikTok ohne Dreh.** Der Generator liefert den Film gratis: „Flurbank aus einem KALLAX, 151 € statt
   400 €, in 5 Schritten“. Jede Bestellung mit Freigabe wird ein Short. Dazu echte Bauvideos, sobald die ersten
   Kunden Fotos schicken.
4. **Gemeinschaften.** ikeahackers.net nimmt Hacks mit Link auf, die Rubrik „Hackers Help“ ist eine Liste offener
   Kundenfragen. Reddit r/ikeahacks und r/IKEA, deutsche Facebook-Gruppen zu IKEA-Hacks, Instagram und TikTok unter
   #ikeahack. Regel: Fragen mit einem kostenlosen Mini-Plan beantworten, nicht mit Werbung.
5. **Etsy.** „Individueller IKEA-Hack-Bauplan nach Maß“ als personalisierter digitaler Artikel. Dort ist die Suche
   schon da, die Zahlung auch. Die eigene Seite kommt trotzdem, weil Etsy Gebühren nimmt und keine Kundendaten gibt.
6. **Start wie Bricklane:** die ersten 20 Pläne kostenlos gegen Foto des fertigen Möbels und Erlaubnis zur
   Veröffentlichung. Daraus werden Beispiele, Pins, Shorts und die ersten Bewertungen.
7. **Partnerprogramme auf der Einkaufsliste.** IKEA hat keins. Dafür Amazon (Auflagen, Beschläge, Dübel), TOSIZE
   (Partnerprogramm prüfen), Prettypegs und New Swedish Design für Beine und Fronten. Jede Bestellung verdient so
   zweimal.
8. **Später:** englische Ausgabe, weil IKEA weltweit gleich ist („furniture hacks to measure“), und Einrichtungs-
   blogs als Multiplikatoren.

## 5. Rechnung

Pro Bestellung 29 €, davon etwa 1,20 € Stripe. Erzeugung automatisiert wenige Cent, anfangs 10 bis 15 Minuten
Prüfung durch dich oder mich je Plan. Partnerprovision auf der Einkaufsliste 2 bis 5 € zusätzlich. Bei 5 Bestellungen
am Tag sind das rund 4.000 € im Monat, ohne Lager, ohne Versand.

## 6. Technik, in unserem Stack

- **Website:** Astro, kopiert von `kaffee/site/`, Eintrag in `websites/websites.json`, Workflow über
  `websites/erzeugen.py`. Bestellformular mit Foto-Upload an ein PHP-Skript auf dem IONOS-Webspace (gleiches Muster
  wie `blog/site/public/kontakt.php`), danach Weiterleitung zu Stripe Checkout, Webhook zurück an PHP.
- **Generator:** parametrisches Möbelmodell als JSON (Module, Maße, Teile) → three.js in Playwright für Bilder je
  Schritt, für die 3D-Seite und für den Film (Einzelbilder → ffmpeg) → PDF aus HTML über Playwright.
- **IKEA-Prüfung:** Playwright liest Suchseite und Produktseite von ikea.de (Name, Artikelnummer, Preis, Aktion,
  Verfügbarkeit). Am 28.10.2026 geprüft und funktionsfähig: KALLAX 42 × 147 weiß 002.758.48 zu 39,99 € (Aktion bis
  31.10.2026, sonst 49,99 €), KALLAX Untergestell 146 × 39 × 18 weiß 405.018.92 zu 20,00 €, DRÖNA 33 × 38 × 33
  dunkelgrau 104.439.74 zu 2,99 € je Stück, online nur im 2er-Set. Das inoffizielle npm-Paket
  `ikea-availability-checker` liefert zusätzlich Bestände je Markt.
- **Zuschnitt:** TOSIZE-Konfigurator per Link mit Maßen, alternativ Zettel für toom, OBI, Hornbach.
- **Ablauf je Bestellung:** Bestellung → Generator → Freigabe-Mail mit allen Dateien an dich → ein Klick → Kunde
  bekommt Mail und privaten Link. Erst bei stabilem Volumen läuft der Generator ohne Freigabe.
- **Bewiesen im Prototyp:** Rendering je Schritt mit Hervorhebung, PDF im Zielformat, IKEA-Abfrage mit echten Daten.
  Offen: Modelle für weitere Möbeltypen, 3D-Seite im Browser, Film, Bestell- und Zahlungsstrecke.

## 7. Recht und Sicherheit

- **Marke.** Kein „IKEA“ im Namen, in der Domain oder im Logo. 2014 hat IKEA gegen ikeahackers.net wegen des
  Namens und der Werbung vorgehen lassen. Zulässig ist der beschreibende Hinweis „passend für IKEA®-Produkte“ mit
  Fußnote, wie bei Anbietern von Fronten und Beinen seit Jahren üblich. Keine IKEA-Fotos, keine Logos, kein Blau-Gelb.
- **Haftung.** Jede Anleitung nennt Traglast, Wandbefestigung je Wandart und die Kippsicherung. Umbauten können die
  IKEA-Garantie berühren, das steht in jeder Anleitung. Hochbetten und Podeste für Kinder erst mit eigenem
  Sicherheitskonzept (Absturzhöhe, Leiter, Norm DIN EN 747 als Maßstab) oder gar nicht.
- **Verträge.** Impressum, AGB, Widerrufsbelehrung mit Verzicht für digitale Inhalte, Datenschutz für hochgeladene
  Fotos (nur zur Planung, Löschung nach 90 Tagen), Preise inklusive Umsatzsteuer, Rechnungen über Stripe.

## 8. Fahrplan

| Woche | Schritt |
|---|---|
| 1 | Name und Domain festlegen, Generator für Sitzbank, Dachschrägenregal und Einbauschrank, drei Beispiele |
| 2 | Website mit Beispielen, Bestellformular, Stripe im Testmodus, AGB |
| 3 | Start: 20 kostenlose Pläne in Gruppen und Foren, Etsy-Listing, erste Shorts aus den Beispielfilmen |
| 4 | Suchseiten je Möbeltyp, Pins, Search Console |
| 5 bis 6 | Echte Bauten der ersten Kunden als Beispiele, Preise scharf, weitere Möbeltypen |

## 9. Entscheidungen für Philipp

1. Name und Domain (Vorschlag: moebelhack.de).
2. Preis 29 € und 49 € oder ein Einheitspreis.
3. Start mit oder ohne Etsy.
4. Deutsch zuerst, Englisch danach.
5. Hochbett und Kinderpodest anbieten oder vorerst weglassen.
