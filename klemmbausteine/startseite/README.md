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

Nachtrag, später am 28.10.2026:
- Adresse im Konfigurator: „Maße holen“ fragt Nominatim (OpenStreetMap) mit `polygon_geojson=1&extratags=1` ab, nimmt das
  Gebäudepolygon, rechnet das kleinste umschließende Rechteck (Breite × Tiefe in Metern) und übernimmt Geschosse
  (`building:levels`) und Dachform (`roof:shape`), wenn vorhanden. Geprüft aus der Cloud: Goethestraße 12, Heidelberg
  → 16,9 × 11,9 m. Im Artifact ist der Abruf durch die Sandbox gesperrt, dort greift ein Zwischenspeicher mit diesem
  Ergebnis. Auf der echten Seite läuft die Abfrage über unseren Server mit Zwischenspeicher, Nominatim erlaubt nur
  eine Anfrage je Sekunde; Overpass als zweite Quelle, wenn die Adresse nur ein Punkt ist.
- Fotos im Konfigurator: bis zu acht Bilder mit Vorschau, aus dem ersten Foto Vorschlag für Wand- und Dachfarbe
  (Medianfarbe der Bildmitte und des oberen Bereichs, nächste Steinfarbe). Fensterraster, Tür, Anbau und Garage werden
  nach der Bestellung aus den Fotos gesetzt (Abschnitt 10 im Konzept).
