---
name: handwerksdoktor.de
description: Riesige schwarze Grotesk auf warmem Off-White, ein gelbes Band, Haarlinien statt Kästen.
colors:
  paper: "#f7f4ee"
  paper-bright: "#fffdf9"
  ink: "#0e0e0f"
  ink-muted: "#5e5a52"
  hairline: "#dcd7cc"
  yellow: "#ffd400"
  chart-night: "#17171a"
  footer-text: "#cfcbc2"
  thema-heizung: "#ff741c"
  thema-strom: "#ffd400"
  thema-wasser: "#39a8ff"
  thema-raumklima: "#03b84c"
  thema-haushalt: "#924ef6"
  thema-sicherheit: "#d6336c"
  thema-tarif: "#3b82f6"
  thema-werkzeug: "#12b5a5"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.7rem, 12.4vw, 11.6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  h1:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 5.6vw, 3.7rem)"
    fontWeight: 760
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3.2vw, 2.1rem)"
    fontWeight: 760
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  section-h:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.8vw, 3.6rem)"
    fontWeight: 760
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  h3:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.13em"
  nav:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.09em"
rounded:
  none: "0"
  tab: "3px"
  control: "4px"
  field: "5px"
  image: "8px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  page-bottom: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-small:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tab}"
    padding: "5px 10px"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  chip-filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  answer:
    backgroundColor: "{colors.paper-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.image}"
    padding: "30px 24px 20px"
  answer-tab:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tab}"
    padding: "6px 10px"
  warn:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.image}"
    padding: "30px 24px 18px"
  warn-tab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.tab}"
    padding: "6px 10px"
  box:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.image}"
    padding: "22px 24px"
  card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  card-image:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.image}"
  tile-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px 6px"
  tile-row-hover:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
  search:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "6px"
    padding: "5px 5px 5px 14px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  quick:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.image}"
    padding: "22px 24px"
  chart:
    backgroundColor: "{colors.chart-night}"
    textColor: "#f1f1f3"
    rounded: "{rounded.image}"
    padding: "20px 22px 16px"
  nav-rechner:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.nav}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
---

# Design System: handwerksdoktor.de

## Overview

**Creative North Star: "Das große, ruhige Schild"**

Die Seite ist eine Baumarkt-Beschilderung in der Grammatik eines Editorial-Portfolios: ein Satz in riesiger schwarzer Grotesk auf warmem Off-White sagt, worum es geht; darunter ein einziges gelbes Feld in Seitenbreite mit dem Mann, der es erklärt, und der Suche als Handlung. Alles Weitere ist Index: Zeilen mit großer Beschriftung, getrennt durch Haarlinien, mit einem gelben Schild, das beim Überfahren von links hereinfährt. Gelb und Schwarz bleiben die Kanalfarben, aber sparsam und edel: Gelb ist Band, Reiter, Nummernschild und Hover-Füllung, nie Dekoration.

Die Dichte ist niedrig und typografisch: Abschnitte beginnen mit einer schwarzen Haarlinie und einem großen Titel, Text läuft in 740 px Spaltenbreite bei 18 px / 1.7. Kästen sind Haarlinienrahmen mit Etikett-Reiter oben links, keine Flächen mit Schatten. Themenfarben (Orange, Blau, Grün, Violett …) erscheinen nur in Titelbildern, Icons und Chips; die Bedienoberfläche selbst kennt nur Tinte und Gelb.

Verworfen wurden (laut Richtungsvertrag): die Kachelwand aus Icon-Karten mit Schatten, der dunkle Hero mit Avatar-Kreis, Kicker über Überschriften.

**Key Characteristics:**
- Riesige Bricolage Grotesque (760–800, optische Größe, −0.03 bis −0.045 em) als Hauptgestaltungsmittel
- Warmes Off-White, Tinte, ein gelbes Farbfeld; Themenfarben nur in Bildern, Icons, Chips
- Haarlinien (1 px) statt Kästen und Schatten; Abschnitte beginnen mit einer schwarzen Linie
- Etiketten: 0.72 rem Versalien mit 0.13 em Laufweite, immer unter dem Titel, nie darüber
- Rechteckige Bedienelemente (3–5 px), Bilder mit 8 px, Porträts rund
- Bewegung nur beim Laden (Hero-Zeilen steigen auf, Band blendet ein), beim Überfahren (gelbes Schild, Bild-Zoom) und abschaltbar

## Colors

Warmes Papier, schwarze Tinte und ein einziges Gelb; der Rest ist Haarlinie und Themen-Erkennungsfarbe.

### Primary
- **Kanalgelb** (`yellow`): das einzige Farbfeld in Seitengröße. Hero-Band, Reiter „Kurze Antwort“, Nummernschilder nummerierter Schritte, Hover-Füllung von Buttons, Wegweiser-Zeilen und Filter-Chips, Wortmarke im Footer, Textauswahl (`::selection`), Button im schwarzen Schnellkauf-Kasten.

### Secondary
- **Themenfarben** (`thema-heizung` … `thema-werkzeug`): pro Seite als `--akzent` gesetzt (Artikel, Karte, Zeile, Navigationslink). Sichtbar nur in Titelbildern, in Icons (abgedunkelt per `color-mix(in srgb, var(--akzent) 65–70%, #000)` für Kontrast), in der Produktmarke, im Ablauf-Kreis und als Balkenfarbe in Grafiken. Niemals als Flächen- oder Button-Farbe.

### Neutral
- **Papier** (`paper`): Seitengrund, Kopfzeile (88 % mit Blur), Schrift auf Schwarz.
- **Helles Papier** (`paper-bright`): Fläche der Antwortbox und der Produkt-Fokusbox, die einzigen hell abgesetzten Flächen.
- **Tinte** (`ink`): Text, Links, Buttons, Footer, schwarze Haarlinien, Fokusring, Bildplatzhalter.
- **Gedämpfte Tinte** (`ink-muted`): Meta-Zeilen, Lead, Kartentexte, Tabellenköpfe, Bildunterschriften.
- **Haarlinie** (`hairline`): warme 1-px-Linien zwischen Zeilen, Tabellen, Byline, Kopfzeile.
- **Grafik-Nacht** (`chart-night`): Grund eigener Diagramme; Text darauf `#f1f1f3`, gedämpft `#b4b4bd` / `#9a9aa4`.
- **Footer-Text** (`footer-text`): Fließtext auf dem schwarzen Footer, Links `#ebe8e1`, Kleingedrucktes `#a39f96`.

Statusfarben existieren nur in Rechnern als Flächen mit 2-px-Rahmen plus Text (gut `#0ca30c` auf `#e9f7e9`, Achtung `#fab219` auf `#fff6dd`, erhöht `#ec835a`, kritisch `#d03b3b` auf `#fbe7e7`); Tarif-Rechner nutzen zusätzlich Blau `#1d4ed8`. Pinterest-Rot `#e60023` und YouTube-Rot `#e00` bleiben Markenfarben Dritter auf ihren Buttons.

### Named Rules
**Die Ein-Farbfeld-Regel.** Gelb ist das einzige großflächige Farbfeld einer Seite. Themenfarben erscheinen nie als Fläche, nur in Titelbild, Icon und Chip.
**Die Tinte-oder-Gelb-Regel.** Jedes Bedienelement ist schwarz, transparent mit schwarzem Rahmen oder gelb. Hover wechselt zwischen genau diesen Zuständen.
**Die Farbe-plus-Text-Regel.** Status wird nie allein durch Farbe getragen: jede Statusfläche hat Rahmen und Wortlaut („✓ Erlaubt“, „Achtung“).

## Typography

**Display Font:** Bricolage Grotesque (variabel 200–800, optische Größe, lokal als woff2; Fallback Inter, system-ui)
**Body Font:** Inter 400 / 500 / 800 (lokal, Fallback system-ui, -apple-system, Segoe UI)
**Label Font:** Inter 600, Versalien

**Character:** Eine charaktervolle, enge Grotesk in sehr großen Graden trägt die Seite; Inter bleibt neutral und klein für Text, Etiketten und Bedienung. Der Kontrast entsteht durch Größe, nicht durch Schriftmischung.

### Hierarchy
- **Display** (800, `clamp(2.7rem, 12.4vw, 11.6rem)`, 0.9, −0.04 em): nur die Hero-Zeile der Startseite („Haustechnik, / einfach erklärt.“), zwei Zeilen, jede Zeile steigt beim Laden aus der Linie. Die Footer-Wortmarke ist das Echo (800, `clamp(2.3rem, 7.6vw, 6.4rem)`, −0.045 em, Papier mit gelbem Nachnamen).
- **Section-H** (760, `clamp(2.1rem, 4.8vw, 3.6rem)`, 1.02): Abschnittstitel der Startseite, über einer schwarzen Haarlinie mit 28 px Luft.
- **H1** (760, `clamp(2.1rem, 5.6vw, 3.7rem)` im Artikel, global bis 4 rem, 1.02, −0.03 em): Seitentitel, direkt über dem Lead.
- **H2** (760, `clamp(1.6rem, 3.2vw, 2.1rem)`, 1.02): Artikelkapitel, im Artikel mit schwarzer Haarlinie darüber (26 px Luft, 2.6 em Abstand).
- **H3** (700, 1.3 rem, 1.15, −0.015 em): Unterkapitel; FAQ-Fragen bekommen eine warme Haarlinie darüber (1.15 rem).
- **Titel in Komponenten** (760, 1.2–1.65 rem, 1.05–1.2, −0.02 em): Wegweiser-Zeilen `clamp(1.3rem, 2vw, 1.65rem)`, Karten 1.32 rem, Aufmacher `clamp(1.5rem, 2.6vw, 2.2rem)`, Produkt-, Tarif-, Suchtreffer- und Ablauf-Titel 1.2–1.35 rem. Große Zahlen (Rechner-Ergebnis, Tarifkosten) 800, 1.6–2 rem, tabellarische Ziffern.
- **Body** (400, 18 px, 1.7): Fließtext in 740 px Spalte (etwa 70 Zeichen). Lead 1.1–1.25 rem gedämpft, Kartentext 0.95 rem, Kleingedrucktes 0.82 rem.
- **Label** (600, 0.72 rem, 0.13 em, VERSALIEN): Meta-Zeile unter dem Titel, Chips, Brotkrumen, „Weiterlesen“, Reiter von Antwort- und Warnbox, Footer-Spaltentitel, Fakten unter dem Hero, Tabellenköpfe (0.1 em, gedämpft). Buttons nutzen dieselbe Form mit 700 / 0.78 rem / 0.1 em.
- **Nav** (600, 0.68 rem, 0.09 em, VERSALIEN): Hauptmenü, zwischen 1241 und 1500 px auf 0.64 rem / 0.06 em verdichtet.

### Named Rules
**Die Etikett-unter-dem-Titel-Regel.** Die Versal-Beschriftung (Thema · Lesezeit, Datum) steht immer unter dem Titel, nie als Kicker darüber. Die Klasse `.eyebrow` ist im Stylesheet nur noch Altlast ohne Verwendung.
**Die Doppelhöhen-Regel.** Zwischen Abschnittstitel und Text liegen mindestens zwei Stufen (3.6 rem gegen 18 px); Zwischengrößen werden nicht erfunden.
**Die Silbentrennungs-Regel.** Wegweiser-Titel trennen nur unter 480 px (`hyphens: auto` erst im Media Query), sonst `hyphens: manual`.

## Layout

Eine Mittelachse. Lesespalte `.wrap` 740 px, breite Spalte `.wrap.wide` 1200 px, Seitenrand 16 px (ab 700 px: 24 px). Das Hero-Band bricht als einziges Element aus der Spalte und läuft bis an beide Ränder; sein Raster `minmax(gutter, 1fr) | minmax(0, 640px) | minmax(240px, 512px) | minmax(gutter, 1fr)` legt Text links und das Porträt (bis 520 px) rechts mit −170 px nach oben in die Headline-Zone, Freisteller mit weichem linken Rand per Maske.

Rhythmus: Hauptinhalt endet mit 96 px; Abschnittstitel tragen 2.4 em Abstand plus 28 px über der Haarlinie; Kästen 1.8–2.1 em; Kartenraster 44 px × 28 px, Wegweiser-Raster 0 × 48 px, Aufmacher 24 px × 48 px (2fr | 1fr, unter 900 px einspaltig). Wegweiser `repeat(auto-fill, minmax(320px, 1fr))`, Karten `minmax(300px, 1fr)`, verwandte Karten `minmax(220px, 1fr)`.

Kopfzeile sticky, 66 px, Papier mit 88 % Deckung und `blur(14px) saturate(140%)`, Haarlinie unten; bis 1240 px wandert das Menü unter die Wortmarke, scrollt waagerecht und läuft rechts per Maske weich aus. Breakpoints, wie sie tatsächlich vorkommen: 480 (Silbentrennung), 560 (Tabellen, Grafiken, Ablauf vertikal), 700 (Seitenrand), 760 (Hero einspaltig, Porträt 66 % rechts, Footer zweispaltig), 900 (Aufmacher), 1240 (Menü umbrechen), 1241–1500 (Menü verdichten). Fußzeile: schwarzes Feld, 64 px oben, Wortmarke in Display-Größe, Raster 1.4fr | 1fr | 1fr mit weißen 20-%-Linien.

## Elevation & Depth

Das System ist flach. Tiefe entsteht durch Haarlinien (warm `hairline` für Zeilen, schwarz `ink` für Abschnitts- und Rahmenlinien), durch zwei Papiertöne (Antwort- und Fokusbox auf `paper-bright`) und durch schwarze Felder (Schnellkauf-Kasten, Footer, Grafiken). Karten haben ausdrücklich `border: 0; box-shadow: none`; der Fokus ist ein 2-px-Ring in Tinte mit 3 px Abstand, bei Diagnose-Optionen 3 px.

### Shadow Vocabulary
- **Keiner im Rahmen.** `--shadow` (`0 1px 0 rgba(14,14,15,.04)`) ist definiert, aber nirgends verwendet.
- **Grafik-Schatten** (`box-shadow: 0 18px 40px -18px rgba(14,14,15,.28)`, `--shadow-lg`): einzige Verwendung ist die dunkle Diagramm-Figur `.chart`. Er widerspricht der Haarlinien-Doktrin und gilt nicht als Vorlage für neue Flächen.

### Named Rules
**Die Haarlinien-Regel.** Flächen sind flach; Trennung erfolgt mit 1-px-Linien, nie mit Schatten. Ein neuer Kasten bekommt einen Rahmen in Tinte, keinen Schatten.

## Shapes

Rechteckig mit minimal gebrochenen Ecken. Bedienelemente 3–5 px (Chip und Reiter 3 px, Button, Nummernschild und Menü 4 px, Eingabefeld 5 px, Suchfeld 6 px), Kästen und Bilder 8 px, Karten selbst ohne Radius (nur ihr Bild). Runde Form nur für Porträts (34–96 px), Hero-Fakten-Punkte (6 px) und den Ablauf-Kreis (44 px, 2 px Themenrahmen). Keine Pillen, keine 999-px-Radien. Balken in Grafiken sind links eckig und rechts 4 px gerundet. Rahmen sind 1 px Tinte; nur Status- und Ergebnisflächen in Rechnern tragen 2 px. Freisteller und Menü laufen per `mask-image` weich aus statt hart zu schneiden.

## Components

### Buttons
Rechteckig, klein beschriftet, laut im Kontrast: schwarzer Block, gelbes Icon, gelber Hover.
- **Shape:** 4 px Radius (`control`), 1 px Rahmen in Elementfarbe.
- **Primary** (`button-primary`): Tinte auf Papier, Inter 700, 0.78 rem, Versalien, 0.1 em; 14 px 20 px; Icon gelb. Hover: Gelb mit Tinte, Icon Tinte (`.2s`).
- **Ghost** (`button-ghost`): transparent, Tinte, Rahmen Tinte; Hover invertiert zu Tinte mit Papier und gelbem Icon.
- **Klein** (`button-small`): 10 px 14 px, 0.7 rem, für Checklisten- und Produktlinks.
- **Im schwarzen Kasten:** gelb mit Tinte, Hover weiß.
- **Preset-Buttons in Rechnern:** 0.88 rem, 7 px 12 px, Rahmen Tinte, Hover gelb.

### Chips
- **Themen-Chip** (`chip`): Etikett-Typo, 1 px Rahmen Tinte, 3 px, 5 px 10 px, Icon in abgedunkelter Themenfarbe; unter der Byline rechts.
- **Filter-Chip** (`chip-filter`): Inter 500, 0.86 rem, 4 px, 7 px 12 px; aktiv Tinte mit Papier, Hover gelb.

### Cards / Containers
- **Artikelkarte** (`card`): kein Rahmen, kein Schatten, kein Radius; Bild 16:9 auf Tinte mit 8 px, darunter 16 px Luft, Titel 1.32 rem, Etikettzeile (Icon · Thema · Minuten) unter dem Titel, Text gedämpft, „Weiterlesen“ als Etikett. Hover: Bild zoomt 1.035 in 0.7 s, Titel bekommt 2-px-Unterstreichung.
- **Aufmacher**: dieselbe Karte, Titel `clamp(1.5rem, 2.6vw, 2.2rem)`, Zoom 1.03.
- **Haarlinienkasten** (`box`, Produkt, Ablauf, Tarifkarte, Inhaltsverzeichnis): transparent, 1 px Tinte, 8 px, 22 px 24 px.
- **Kurze Antwort** (`answer` + `answer-tab`): helles Papier, 1 px Tinte, 8 px, 30 px 24 px 20 px; Reiter gelb mit Glühbirnen-Icon sitzt 13 px über dem oberen Rand, 16 px von links.
- **Warnung** (`warn` + `warn-tab`): transparent, gleicher Rahmen; Reiter Tinte mit Papier, Warn-Icon in `#ffb15c`.
- **Schnellkauf** (`quick`): Feld in Tinte, Titel-Etikett gelb, Zeilen mit weißen 16-%-Linien, gelbe Buttons.
- **Grafik** (`chart`): Nachtgrund, Titel Bricolage 1.3 rem weiß, Kicker in Themenfarbe unter dem Titel, Balken in Themenfarbe, Legenden 0.85–0.9 rem.
- **Anzeige-Hinweis**: 0.8 rem gedämpft, nur Haarlinie unten; bleibt immer sichtbar.

### Inputs / Fields
- **Style:** weiß, 1 px Tinte, 5 px, 12 px 14 px (Rechner 10 px 12 px), Schrift geerbt.
- **Suche** (`search`): weiße Leiste, 1 px Tinte, 6 px, Lupe gedämpft, Button als Primary (11 px 16 px) innen rechts; im Hero bis 560 px breit.
- **Focus:** 2-px-Ring in Tinte, 2–3 px Abstand (`:focus-within` auf der Suchleiste, Innenfeld ohne Outline).
- **Auswahlfelder (Diagnose):** weiß, 1 px, 5 px, min. 48 px; gewählt: Rahmen und Innenlinie in Themenfarbe auf 10 % Themenfarbe.
- **Status:** 2 px Rahmen plus Fläche plus Text (siehe Colors).

### Navigation
- **Kopfzeile:** Porträt-Punkt 34 px und Wortmarke in Bricolage 500/800, 1.22 rem; Menü Inter 600, 0.68 rem, Versalien, Hover 7 % Tinte, 4 px; „Rechner“ als schwarzer Block mit gelbem Icon, Hover gelb (`nav-rechner`); Suche nur als Icon.
- **Brotkrumen:** Etikett gedämpft, Chevron-Icon, Hover Tinte.
- **Footer:** Links `#ebe8e1`, Hover gelb; Spaltentitel gelb als Etikett.

### Wegweiser (Signatur)
Index-Zeilen statt Icon-Kacheln (`tile-row`): Raster 40 px Icon | Titel | Pfeil, 20 px 6 px, warme Haarlinie unten, schwarze Linie über der Liste. Titel Bricolage 760 `clamp(1.3rem, 2vw, 1.65rem)`, darunter die Zählung gedämpft 0.82 rem; Icon in abgedunkelter Themenfarbe; Pfeil „→“ in Bricolage 1.4 rem. Hover/Fokus: ein gelbes Schild fährt in 0.4 s mit `--ease` von links über die ganze Zeile (`scaleX(0 → 1)`, 6 px über den Rand), der Pfeil rückt 4 px nach rechts. Variante `tiles-liste` (Artikelzeilen) mit 32 px Icon und 16 px Zeilenhöhe.

### Hero (Signatur)
Zwei Display-Zeilen, die aus einer unsichtbaren Linie aufsteigen (`hero-rise`, 0.9 s, zweite Zeile 0.1 s später), darunter das gelbe Band, das 0.25 s später von unten einblendet (`hero-fade`). Links Lead in Bricolage 700 (eine Frage pro Zeile), Suche, zwei Buttons, Fakten-Etikett mit Punkten über einer 35-%-Linie; rechts das Porträt auf der Bandkante. Unter 760 px entfällt der Untertext, das Porträt rückt unter die Suche (66 %, max. 270 px).

### Nummerierte Schritte
Gelbes Nummernschild 32 px, 4 px Radius, Bricolage 800 1 rem; im Inhaltsverzeichnis 26 px, transparent mit 1 px Rahmen.

## Do's and Don'ts

### Do:
- **Do** Meta-Zeilen (Thema · Lesezeit, Datum) als Etikett (0.72 rem, 600, Versalien, 0.13 em) unter den Titel setzen.
- **Do** jeden neuen Abschnitt mit einer schwarzen 1-px-Haarlinie und einem Bricolage-Titel (760, −0.03 em) beginnen.
- **Do** Buttons rechteckig (4 px) in Tinte mit gelbem Hover bauen; Ghost-Varianten mit 1-px-Rahmen in Tinte.
- **Do** Themenfarbe nur per `--akzent` in Titelbild, Icon (abgedunkelt mit `color-mix` 65–70 % Schwarz) und Chip zeigen.
- **Do** Bilder mit 8 px Radius und 16:9 auf Tinte legen; Porträts rund.
- **Do** Bewegung auf Laden (Hero), Hover-Füllung (0.4 s `--ease`) und Bild-Zoom (0.7 s) beschränken und mit `prefers-reduced-motion` komplett abschalten.
- **Do** Status immer als Fläche plus 2-px-Rahmen plus Wortlaut ausgeben, nie als Farbe allein.
- **Do** Affiliate-Hinweise („Anzeige“, Sternchen) sichtbar lassen; der Anzeige-Hinweis bleibt gedämpfter Text mit Haarlinie, nie ausgeblendet.
- **Do** Schriften und Bilder ausschließlich lokal laden (`/fonts/*.woff2`, `/bilder/`).

### Don't:
- **Don't** Kicker oder Eyebrows über Überschriften setzen; `.eyebrow` nicht wiederbeleben.
- **Don't** farbige `border-left` dicker als 1 px als Kasten-Markierung verwenden; Kästen tragen 1 px Tinte rundum und einen Reiter.
- **Don't** Pillen oder 999-px-Radien; Bedienelemente bleiben bei 3–6 px, Flächen bei 8 px.
- **Don't** Schatten als Dekoration; neue Flächen trennen sich durch Haarlinien oder Papierton.
- **Don't** Themenfarben als Flächen, Buttons oder Rahmen der Bedienoberfläche einsetzen; UI ist Tinte oder Gelb.
- **Don't** ein zweites großes Farbfeld neben dem gelben Band auf dieselbe Seite setzen.
- **Don't** Silbentrennung oberhalb von 480 px in Titeln einschalten.
- **Don't** Icon-Kachelwände mit Schatten oder einen dunklen Hero mit Avatar-Kreis bauen; der Wegweiser ist die Zeile, der Hero ist Typografie plus Band.
- **Don't** Schriften, Bilder oder Skripte von fremden Hosts einbinden.
