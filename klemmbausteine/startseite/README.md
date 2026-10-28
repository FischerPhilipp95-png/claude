# Startseite „Haus in Steinen“

`index.html` ist die veröffentlichte Entwurfsseite (Artifact-Format: ohne eigenen Doctype und Head, Bilder liegen daneben:
`haus_final.jpg`, `anleitung-schritt-09.png`, `anleitung-teileliste.png` aus `../beispiel-haus/`).

Stand 28.10.2026, abends:
- Konfigurator im Browser: Der Haus-Generator aus `../prototyp/generator.cjs` ist in die Seite übernommen. Maße, Geschosse,
  Dach (Satteldach, Flachdach, Rohbau), Fensterzahl und Farben erzeugen sofort das Modell mit Steinzahl, Teilearten, Reihen,
  Richtpreis und der Teileliste weiter unten. 1 Noppe = 0,6 m, Grundplatte 32 × 32 oder 48 × 48.
- Anlässe: Einzug, Richtfest-Edition (Rohbau ohne Dach), Abschied vom Elternhaus (bis zu vier Widmungen), Jubiläum.
- Makler, Bauträger, Fertighaus: Staffelpreise, Co-Branding, kostenloses Musterhaus.
- Bestellformular mit Edition, Anlass, Widmung; Zahlung noch nicht angeschlossen.
- Geprüft lokal mit Playwright: keine Skriptfehler, Varianten rechnen, keine Querscrollung bei 400 px.
