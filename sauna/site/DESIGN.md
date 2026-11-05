# Design gartensaunadoktor.de

Gleiches Gerüst wie handwerksdoktor.de (`blog/site/DESIGN.md`, Referenz kobu.co) und vollautomatendoktor.de (`kaffee/site/DESIGN.md`).
Alle Regeln von dort gelten (Bricolage Grotesque als Display-Schrift, Inter als Textschrift, ein Farbfeld, Haarlinien, Label unter dem Titel,
keine Kicker, keine Pillen, 4 px Bedienelemente, 8 px Bilder). Eigen sind nur Farben und Bausteine.

## Farben

| Token | Wert | Verwendung |
|---|---|---|
| `--bg` | `#f6f1e9` | Grund (Creme) |
| `--ink` | `#15100c` | Text |
| `--tanne` | `#1f4a3a` | einziges großes Farbfeld: Hero-Band, Reiter, Nummernschilder, Hover-Füllung |
| `--birke` | `#e8d9b5` | heller Ton auf dunklen Flächen (Icons im Band, Hover auf Reitern) |
| `--akzent` | je Bereich | nur Icons, Chips, Titelbilder: Kaufen `#d08a3a`, Fasssauna `#b8322f`, Planung `#3b6ea5`, Kosten `#2f855a` |

## Bausteine

- Bilder: fotorealistisch, KI-generiert über die Manus-API (Stil: skandinavisches Architektur-/Lifestyle-Magazin, natürliches Licht,
  Tanne, Birke, Creme, Anthrazit). Kein Text, keine Logos, keine echten Produkte, keine erkennbaren Gesichter. Immer mit Nachweis
  „Bild: KI-generiert für den Gartensauna-Doktor“. Ablage: `public/bilder/start/`, `public/bilder/bereiche/<slug>(-klein).webp` (4:3),
  `public/bilder/fotos/<artikel>.webp` (1200 × 675). Grafische Titelbilder aus `scripts/titelbilder.mjs` nur noch als Notlösung.
- Startseite: Hero „Gartensauna, / einfach erklärt.“ mit drei Fragen, Porträt-Freisteller, großes Gartensauna-Foto, vier Bereichs-Fotokacheln,
  Saison-Block, Rechner-Kacheln, neueste Ratgeber.
- Themenseite: Kopf mit Bereichsfoto (4:3), Ratgeber-Karten, Rechner des Bereichs.
- Artikel: Titelfoto mit Nachweis darunter, Affiliate-Hinweis oben, bei `rechtshinweis: true` zusätzlich der Kasten „Keine Rechtsberatung“,
  Inhaltsverzeichnis ab drei Abschnitten, `Material.astro` („Das brauchst du“, Shop-Buttons), `Kennzahl.astro` nur für belegte Zahlen,
  `Geprueft.astro`, Pinterest, verwandte Beiträge, Autorenbox.
- Affiliate: `src/affiliate-links.ts`, Platzhalter `#AFFILIATE-<shop>-<produkt>` bis zur Freischaltung, im Browser rot gestrichelt umrandet
  (`a[data-affiliate="offen"]`), damit nichts Unfertiges übersehen wird.
- Rechner: `.calc`-Kasten wie beim Handwerksdoktor (Vorlagen-Chips, Eingabe-Raster, Ergebnistabelle, Teilen-Leiste).
