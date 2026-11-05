---
name: vollautomatendoktor.de
description: Riesige schwarze Grotesk auf Creme, ein kaffeebraunes Band, Haarlinien statt Kästen; dasselbe Gerüst wie handwerksdoktor.de in eigenen Farben.
colors:
  paper: "#f6f1e9"
  paper-bright: "#fffaf3"
  ink: "#15100c"
  ink-muted: "#5f564d"
  hairline: "#ddd2c3"
  kaffee: "#4b2e1d"
  crema: "#e9cfa6"
  chart-night: "#17171a"
  footer-text: "#cfcbc2"
  marke-pflege: "#d08a3a"
  marke-delonghi: "#e0573e"
  marke-philips: "#3d8fd6"
  marke-siemens: "#14a37f"
  marke-jura: "#9b6bd6"
  marke-krups: "#c2410c"
  marke-melitta: "#b8322f"
  marke-tchibo: "#7a5a2f"
  marke-gaggia: "#2b6cb0"
  marke-sage: "#6b7280"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.7rem, 11.4vw, 10.6rem)"
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
    backgroundColor: "{colors.kaffee}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.kaffee}"
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
    backgroundColor: "{colors.kaffee}"
    textColor: "{colors.paper}"
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
    backgroundColor: "{colors.kaffee}"
    textColor: "{colors.paper}"
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
    backgroundColor: "{colors.kaffee}"
    textColor: "{colors.paper}"
    typography: "{typography.nav}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  material-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 0"
  kennzahl:
    backgroundColor: "transparent"
    textColor: "{colors.kaffee}"
    rounded: "{rounded.none}"
    padding: "26px 0 22px"
  maschinen-box:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.image}"
    padding: "30px 24px 22px"
  photo-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
---

# Design System: vollautomatendoktor.de

## Overview

**Creative North Star: „Die Werkstatt-Anleitung“**

Die Seite übernimmt das Gerüst von handwerksdoktor.de (siehe `blog/site/DESIGN.md`: riesige Bricolage Grotesque auf warmem Papier,
ein einziges großes Farbfeld, Haarlinien statt Kästen, Etiketten unter dem Titel) und tauscht die Farbwelt: Creme statt Off-White,
dunkles Kaffeebraun statt Gelb als Band, Reiter, Nummernschild und Hover-Füllung, Crema als heller Ton auf dunklen Flächen.
Die Markenfarben (De’Longhi-Rot, Philips-Blau, Siemens-Grün …) erscheinen nur in Titelbildern, Icons und Chips.

Der Artikelaufbau folgt der Grammatik der Referenz kaffeevollautomaten-guide.de (nur Aufbau, nie Inhalt): Titel, Lead, Byline,
dann das passende Kanal-Video (sonst das Titelbild), Anzeige-Hinweis, Inhaltsverzeichnis, kurze Antwort, „Das brauchst du“ als
Haarlinienzeilen mit Kaufbuttons, Ablauf-Grafik und nummerierte Schritte, eine belegte Kennzahl als große Zahl, Bildpaare mit
Unterschrift, Warnkästen, häufige Fragen, Quellen, die Maschinen-Box (Modell, belegte Fakten, Link zur Maschinenseite,
Amazon-Button ohne Preis), Prüfprotokoll, Pinterest, verwandte Artikel, Autor. Kommentare gibt es nicht (statische Seite).

**Key Characteristics:**
- Bricolage Grotesque 760–800 in sehr großen Graden; Inter für Text, Etiketten und Bedienung
- Creme `#f6f1e9`, Tinte `#15100c`, ein kaffeebraunes Farbfeld `#4b2e1d`, Crema `#e9cfa6` nur auf Braun und Schwarz
- Haarlinien 1 px (warm `#ddd2c3`, schwarz für Abschnitte und Rahmen), keine Schatten, keine Pillen
- Marken-Fotos als flache Karten (4:3, 8 px), Maschinen ohne Foto als ruhige, leicht getönte Fläche
- Bewegung nur beim Laden (Hero), beim Überfahren (braunes Schild, Bild-Zoom), abschaltbar

## Colors

### Primary
- **Kaffeebraun** (`kaffee`): das einzige Farbfeld in Seitengröße. Hero-Band, Reiter „Kurze Antwort“, Nummernschilder, Primär-Buttons
  und „Maschinen“-Block im Menü, Hover-Füllung der Wegweiser-Zeilen (Schrift wird dann Creme), Zahl der Kennzahl, Punkte der Maschinen-Box.
- **Crema** (`crema`): heller Ton auf Braun und Schwarz: Icons in Buttons, Fakten-Zeile im Band, Spaltentitel und Nachname der
  Wortmarke im Footer, Buttons im schwarzen Schnellkauf-Kasten, Textauswahl, Hervorhebung in der Explosionszeichnung.

### Secondary
- **Markenfarben** (`marke-*`): je Seite als `--akzent`, sichtbar nur in Titelbildern, Icons (abgedunkelt per `color-mix` 65–70 % Schwarz),
  Chips, Ablauf-Kreisen und der getönten Fläche von Maschinen ohne Foto. Nie als Button, Rahmen oder Fläche der Bedienoberfläche.

### Neutral
- **Papier** (`paper`), **helles Papier** (`paper-bright`, Antwort- und Fokusbox), **Tinte** (`ink`), **gedämpfte Tinte** (`ink-muted`),
  **Haarlinie** (`hairline`), Footer-Text `#cfcbc2`. Statusfarben nur in Diagnose und Prüfprotokoll als Icon plus Wortlaut.

### Named Rules
**Die Ein-Farbfeld-Regel.** Braun ist das einzige große Farbfeld. Markenfarben nie als Fläche.
**Die Tinte-oder-Braun-Regel.** Bedienelemente sind braun, schwarz oder transparent mit schwarzem Rahmen; Hover wechselt genau
zwischen diesen Zuständen. Auf dem braunen Band sind Buttons creme mit Tinte, Hover schwarz.
**Die Crema-nur-auf-dunkel-Regel.** Crema steht nie auf Papier als Text, nur als Fläche (Auswahl, Hover-Hintergrund) oder auf Braun und Schwarz.

## Typography

Wie handwerksdoktor.de: Display `clamp(2.7rem, 11.4vw, 10.6rem)` (kürzer wegen „Vollautomat,“), Section-H, H1, H2, H3, Body 18 px / 1.7,
Label 0.72 rem Versalien 0.13 em, Nav 0.68 rem. Neu: Kennzahl 800 `clamp(3rem, 8vw, 5rem)` in Braun mit Einheit in 0.42 em;
Materialname 760 / 1.12 rem; Maschinen-Box-Titel 760 `clamp(1.35rem, 2.4vw, 1.7rem)`.

**Die Etikett-unter-dem-Titel-Regel** gilt auch hier: Thema · Lesezeit unter Karten- und Videotiteln, nie als Kicker darüber.
Die Klassen `.eyebrow` und `.chip-lg` sind entfernt.

## Layout

Lesespalte 740 px, breite Spalte 1200 px, Seitenrand 16 px (ab 700 px 24 px). Hero-Band wie beim Handwerksdoktor (Porträt rechts auf der
Bandkante, −170 px in die Headline-Zone, Freisteller mit weichem linken Rand). Startseite: Hero, Marken als Fotokarten
(`tiles-foto`, 2 Spalten, ab 600 px `minmax(200px, 1fr)`), Aufmacher plus Zeilen, drei Videokarten, neueste Anleitungen als Zeilen.
Material-Zeilen: Raster `1fr auto`, unter 480 px einspaltig. Bildpaar zwei Spalten, unter 560 px eine. Maschinen-Box `1fr auto`,
unter 560 px einspaltig mit Buttons nebeneinander.

## Elevation & Depth

Flach. Haarlinien und zwei Papiertöne; schwarze Felder für Schnellkauf, Brühablauf und Footer. Einzige Schatten: Vergrößerungs-Dialog
der Explosionszeichnung und die Nummern auf der Zeichnung (echte Überlagerung), sonst keine.

## Shapes

Bedienelemente 3–5 px, Kästen und Bilder 8 px, Porträts und Nummern der Zeichnung rund. Ansicht-Umschalter der Zeichnung 4 px
statt Pille. Keine 999-px-Radien.

## Components

- **Buttons:** Primär braun mit Creme-Icon, Hover schwarz; Ghost transparent mit schwarzem Rahmen, Hover braun; `btn-dark` schwarz,
  Hover braun; im Band creme/Tinte; im schwarzen Kasten crema/Tinte, Hover weiß.
- **Wegweiser-Zeile:** wie Handwerksdoktor, Hover-Schild braun, Schrift und Icon werden creme (`transition: color`).
- **Fotokarte** (`tiles-foto`): Foto 4:3 mit 8 px, Marke als Etikett, Name Bricolage mit 2-px-Unterstreichung beim Überfahren, Zählung gedämpft.
  Ohne Foto: `tile-flaeche`, 9 % Markenfarbe auf hellem Papier, 1 px Haarlinie, Icon in abgedunkelter Markenfarbe.
- **Material** (`material`): schwarze Linie oben, warme Linien zwischen den Zeilen, Name 1.12 rem, Zweck gedämpft, rechts „Preis prüfen*“
  (klein) oder „liegt der Maschine bei“ mit Paket-Icon; Sternchen-Hinweis darunter nur, wenn es Links gibt.
- **Kennzahl** (`kennzahl`): Linie oben schwarz, unten warm, Zahl in Braun, Bedeutung in Bricolage 700, Quelle als Link in 0.8 rem. Nur belegte Zahlen.
- **Bildpaar** (`bildpaar`): zwei Figuren, Bild 4:3 auf Tinte, Unterschrift 0.78 rem mit Nachweis.
- **Maschinen-Box** (`maschinen-box`): Haarlinienrahmen, Reiter in Tinte mit Crema-Icon, Modellname als Link, Fakten mit braunen Punkten
  (nur aus `maschinen.json`: weitere Namen, Zahl der Kanal-Videos, Bauart), Buttons „Alle Anleitungen“ (Ghost) und „Preis prüfen*“ nur bei
  Affiliate-Artikeln. Keine Preise, keine Bewertungen.
- **Maschinen-Finder** (`finder`): Haarlinienkasten, Hersteller als Filter-Chips (aktiv Tinte, Hover Crema), Modellsuche als Feld 5 px.
- **Explosionszeichnung** (`qs-*`): Umschalter und Vergrößern als Versal-Buttons 4 px, Hervorhebung Crema, Brühablauf als schwarzes Feld
  mit Crema-Etikett, Bauteil-Akkordeons mit 1 px Tinte.
- Antwort, Warnung, Schnellkauf, Produkt-Fokus, Inhaltsverzeichnis, Tabellen, FAQ, Karten, Footer: wie handwerksdoktor.de, Gelb durch Braun/Crema ersetzt.

## Do's and Don'ts

### Do:
- **Do** jede Anleitung nach dem Referenz-Aufbau gliedern: Antwort, „Das brauchst du“, Ablauf, Schritte, Kennzahl (wenn belegt), Warnung, FAQ, Quellen.
- **Do** Kaufbuttons nur in Material, Schnellkauf, Produkt-Fokus und Maschinen-Box; immer mit Sternchen und Hinweis.
- **Do** Markenfarbe nur per `--akzent` in Titelbild, Icon, Chip und Ablauf-Kreis zeigen.
- **Do** Zahlen in der Kennzahl mit Quelle und Link belegen; ohne Quelle keine Kennzahl.
- **Do** Bewegung mit `prefers-reduced-motion` komplett abschalten.

### Don't:
- **Don't** Kicker oder Chips über Überschriften; Meta-Zeilen gehören unter den Titel.
- **Don't** Gelb, Orange oder Markenfarben als Button-, Rahmen- oder Flächenfarbe der Bedienoberfläche.
- **Don't** Preise, Testurteile oder Bewertungen in Produkt- oder Maschinen-Boxen.
- **Don't** farbige Kanten dicker als 1 px, Schatten als Dekoration, Pillen.
- **Don't** fremde Schriften, Bilder oder Skripte einbinden; Videos nur per Zwei-Klick.
