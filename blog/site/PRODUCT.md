# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Heimwerker, Mieter und Hausbesitzer in Deutschland, die gerade ein konkretes Problem im Haus haben und es googeln: Die Heizung gluckert, der Heizkörper bleibt kalt, der Abfluss ist zu, der Stromtarif soll günstiger werden, die Wärmepumpe oder Wallbox braucht einen Tarif. Sie kommen fast immer über die Google-Suche auf einen einzelnen Artikel, meist am Handy, oft abends oder am Wochenende, und wollen in zwei Minuten wissen: Was ist los, kann ich das selbst machen, was brauche ich dafür, wann rufe ich den Fachbetrieb.

Zweite Gruppe: Zuschauer des YouTube-Kanals „Der Handwerksdoktor“ (@derhandwerksdoktor), die die Anleitung zum Video nachlesen wollen.

## Product Purpose

handwerksdoktor.de erklärt Haustechnik (Heizung, Strom, Wasser, Raumklima, Haushaltsgeräte, Sicherheit, Werkzeug, dynamische Stromtarife) so, dass Laien sie verstehen und kleine Probleme sicher selbst lösen. Erfolg heißt: Der Leser findet die Antwort oben im Artikel („Kurze Antwort“), traut sich die Schritte zu, nutzt Rechner und Checklisten und kauft das passende Werkzeug über die Amazon-Affiliate-Links (Tag rechn24-21). Die Seite finanziert sich allein über Affiliate-Provisionen; Reichweite kommt über Google, Discover und Pinterest.

## Positioning

Jede Aussage hat eine Quelle (Herstelleranleitungen, Verbraucherzentrale, Finanztip, Netzbetreiber-Preisblätter, Gesetze), keine erfundenen Tests, Noten oder Testsieger, keine Rankings. Die Rechner (Stromkosten, Heizkosten, dynamischer Stromtarif, § 14a Netzentgelt, Smart-Meter-Check, Balkonkraftwerk, Taupunkt, Dübel-Finder) rechnen mit echten Daten, bei Strom mit echten Börsenpreisen der letzten zwölf Monate, komplett im Browser. Es gibt einen echten Menschen dahinter: den Handwerksdoktor vom YouTube-Kanal, mit Porträt und Videos. Ton: Du-Ansprache, kurze Sätze, ehrlich auch beim „lohnt sich nicht“.

## Operating Context

Statische Astro-Site (Content Collections, MDX), gebaut und per GitHub Actions auf IONOS hochgeladen. Prüfungen vor jedem Upload: Build, keine Anfragen an fremde Server (Schriften und Bilder liegen lokal), kein horizontales Scrollen bei 390 px, html-validate, pa11y, interne Links, Rechtschreibung (LanguageTool). Jeder Artikel hat ein generiertes Titelbild (1200×675, Thema-Farbe, Lucide-Icon) und Pinterest-Pins; Checklisten gibt es als PDF. Die Suche läuft mit Pagefind im Browser. Videos werden erst nach Klick geladen (Zwei-Klick). Es gibt eine Schwesterseite im gleichen Baukasten: vollautomatendoktor.de (Kaffeevollautomaten) mit eigener Farbwelt; gemeinsame Komponenten und Skripte werden dorthin übertragen.

## Capabilities and Constraints

- 74 Artikel in 8 Themen, 15 Rechner, Anbieter-Vergleiche (dynamische Stromtarife, Autostromtarife, Wärmepumpentarife), Checklisten, Produktseite, Themenseiten (Hub & Spoke), Strompreis-heute-Seite.
- Keine externen Requests im Frontend (keine Google Fonts, kein Tracking, keine Amazon-Bilder); Schriften als lokale woff2.
- Barrierefreiheit: pa11y muss grün sein, Kontraste mindestens 4,5:1, `prefers-reduced-motion` wird respektiert, Fokus sichtbar.
- Mobil zuerst: fast alle Besucher kommen per Handy über Google; Shorts und Pinterest bringen Traffic auf Artikel, nie auf die Startseite.
- Titel bis 70 Zeichen, Beschreibung bis 160 Zeichen (Build bricht sonst ab).
- Affiliate-Hinweise („Anzeige“, Sternchen) sind Pflicht und müssen sichtbar bleiben.
- Offen: Affiliate-Programme der Stromanbieter (Links noch leer), Pexels-Schlüssel für Fotos.

## Brand Commitments

- Name „Der Handwerksdoktor“, Kanalfarben Gelb `#ffd400` und Schwarz bleiben die Markenfarben (vom Nutzer bestätigt, sparsamer und edler eingesetzt).
- Porträt des Handwerksdoktors (`public/bilder/autor.webp`, Freisteller `assets/channel_person_cutout.png`) ist das Gesicht der Marke; Thumbnails im Kanal-Stil nutzen Anton in Versalien mit gelber letzter Zeile.
- Visuelle Referenz, vom Nutzer gesetzt: kobu.co (Awwwards Honorable Mention 2023): warmes Off-White `#f9f5f1`, schwarze, sehr große Typografie als Hauptgestaltungsmittel, winzige Versal-Navigation mit Laufweite, Haarlinien statt Kästen, randlose große Bilder, viel Weißraum. Gewünscht: riesige mutige Typografie, Ruhe und Weißraum, große Bilder mit Kontrast; Startseite mit typografischem Hero und dem Porträt.
- Themenfarben (Heizung Orange, Strom Gelb, Wasser Blau, Raumklima Grün, Haushalt Violett, Sicherheit Pink, Stromtarif Blau, Werkzeug Türkis) bleiben als Erkennungsfarbe je Thema in Titelbildern und Chips.
- Deutsch, Du-Ansprache, keine Superlative, keine Testsiegel.

## Evidence on Hand

- Alle Artikel mit Quellenlisten, Rechner mit echten Börsenpreisen (`src/strompreise.json`), Anbieterdaten mit Stand und Quelle (`src/stromtarife.ts`).
- Videos des eigenen Kanals (`src/videos.ts`), Titelbilder unter `public/bilder/titel/`, Fotos unter `public/bilder/` (eigene oder CC0 mit Nachweis).
- Keine Kundenstimmen, keine Testimonials, keine Auszeichnungen: nichts davon darf erfunden werden.

## Product Principles

1. Die Antwort zuerst: Jede Seite beantwortet die Frage im ersten Bildschirm, Details danach.
2. Belegt statt behauptet: Zahl, Quelle, Stand; lieber „nach PLZ“ als eine geschätzte Zahl.
3. Ehrliche Empfehlung: „lohnt sich nicht“ steht genauso groß wie „lohnt sich“.
4. Selbst machen, sicher: Grenzen (Gas, Elektrik, Mietrecht) werden klar benannt.
5. Ein Mensch, kein Portal: der Handwerksdoktor spricht, nicht eine Redaktion.

## Accessibility & Inclusion

pa11y-geprüft, Kontraste mindestens 4,5:1 auch auf Gelb und Schwarz, Bewegung nur bei Bedarf und abschaltbar, Tastaturfokus sichtbar, Zwei-Klick für Videos, Texte in einfacher Sprache.
