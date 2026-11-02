---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/styles/global.css","src/layouts/Base.astro","src/layouts/Artikel.astro","src/components/ArtikelKarte.astro"]
---

# Surface brief: Startseite und Seitenrahmen (handwerksdoktor.de)

Scope: Startseite `src/pages/index.astro` plus der Rahmen, den jede Seite trägt (Kopfzeile, Fußzeile, Artikelkopf, Karten, Kacheln, Kästen) in `src/styles/global.css`, `src/layouts/Base.astro`, `src/layouts/Artikel.astro`, `src/components/ArtikelKarte.astro`. Visitor mode: Persuade auf der Startseite (Hook, Suche als Handlung, Beweis durch echte Anleitungen), Read auf Artikeln.

Audience und Job: Heimwerker mit akutem Problem, meist am Handy über Google; die Startseite sehen Stammleser und Kanal-Zuschauer. Handlung: Suche starten oder ein Thema öffnen. Beweis: 74 Anleitungen mit Quellen, 15 Rechner, ein echter Mensch (Porträt).

Pinned vom Nutzer (2026-11-02): Referenz kobu.co (Off-White, riesige schwarze Typografie, winzige Versal-Navigation, Haarlinien, randloses Bild). Gewählt: riesige mutige Typografie, viel Weißraum, große Bilder mit Kontrast; Gelb/Schwarz bleiben, sparsamer und edler; typografischer Hero mit Porträt; nur handwerksdoktor.de.

Grounded list (Welt der Heimwerker, nach Resonanz): 1 Thumbnail-Grammatik des Kanals, 2 Bedienungsanleitung der Therme, 3 Wartungsprotokoll am Klemmbrett, 4 Baumarkt-Beschilderung und Regaletikett, 5 Typenschild, 6 Werkzeugkoffer-Einsatz, 7 Stromrechnung. Seed b0097461 weist Kandidat 4 zu; die gepinnte Referenz setzt Palette, Typo und Komposition, Kandidat 4 liefert Topologie und Ritual: Wegweiser-Index mit großen Beschriftungen, Etiketten-Raster als Meta-Zeile, das Preisschild als „Kurze Antwort“-Reiter.

Challenger-Urteile: Trikotwand declined (Nummern-Typo zu laut, verliert Klarheit); Stickmustertuch declined; Versailles declined (Raise: eine Mittelachse, Haarlinien als Sichtachsen); Sneaker-Boxen competitive auf Produktklarheit (Raise: Etiketten-Raster Name · Thema · Zeit auf jeder Karte); Teletext declined (Raise: strenge Doppelhöhen-Stufen zwischen Abschnittstitel und Text); ASCII declined.

## Direction contract

THESIS: Die Seite ist ein großes, ruhiges Schild: ein Satz in riesiger Schrift sagt, was hier passiert, darunter ein gelbes Feld mit dem Mann, der es erklärt, und der Suche als einziger Handlung. Verweigert wird die Kachelwand aus Icon-Karten mit Schatten und der dunkle Hero mit Avatar-Kreis.

OWN-WORLD: Warmes Off-White #f7f4ee als Grund, Tinte #0e0e0f, Gelb #ffd400 als einziges Farbfeld in Seitengröße (Hero-Band, Antwort-Reiter, Hover-Füllung), Themenfarben nur in Titelbildern, Icons und Chips. Display: Bricolage Grotesque 760–800, optische Größe, Laufweite −0,03 bis −0,045 em; Text und Bedienelemente: Inter. Beschriftungen in Versalien 0,72 rem mit 0,12–0,14 em Laufweite. Haarlinien (1 px, warm) statt Kästen und Schatten; Bilder mit 8 px Radius, Buttons rechteckig 4 px, schwarz mit gelbem Hover. Ohne Inhalt erkennbar an: riesige schwarze Grotesk auf Off-White, gelbes Band, Linienraster.

STORY: Der Besucher versteht in einer Sekunde „Haustechnik, einfach erklärt“, sieht den Menschen dahinter, tippt sein Problem in die Suche oder wählt sein Thema aus dem Wegweiser; die Artikelkarten beweisen mit echten Titelbildern und Quellen-Versprechen, dass die Antwort da ist.

FIRST VIEWPORT: Oben die Kopfzeile auf Off-White mit Haarlinie: Porträt-Punkt und Wortmarke links, winzige Versal-Navigation rechts, „Rechner“ als schwarzer Block. Darunter über die volle Breite die Zeile „Haustechnik, / einfach erklärt.“ in Bricolage ExtraBold (Desktop ~125 px, Handy ~42 px), zwei Zeilen, enge Laufweite, Einblendung von unten. Darunter das gelbe Band bis an beide Ränder: links Lead (eine Zeile pro Frage), das Suchfeld (weiß, schwarzer Button) als primäre Handlung und zwei Buttons, rechts der freigestellte Handwerksdoktor, der mit der Unterkante auf der Bandkante steht und oben in die Headline-Zone ragt; am Fuß des Bandes die Etikettzeile „74 Anleitungen · 15 Rechner · alle mit Quellen“.

FORM: Gepinnte Referenz-Grammatik (kobu.co) über Kandidat 4 „Baumarkt-Beschilderung“ (Index-Zeilen mit großer Beschriftung, gelbe Hover-Füllung als Schild, Etikett-Reiter an Kästen); Seed b0097461, zugewiesener Index 4; signature interaction: die gelbe Füllung, die beim Überfahren einer Themenzeile von links hereinfährt, und die Hero-Zeilen, die beim Laden aus der Linie steigen; Motion sonst nur Bild-Zoom auf Karten.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Unresolved: Affiliate-Links der Stromanbieter bleiben leer; die Kaffee-Seite bekommt den Look erst nach Freigabe.
