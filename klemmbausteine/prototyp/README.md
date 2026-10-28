# Prototyp „Dein Haus in Steinen“

Gebaut am 28.10.2026, läuft in der Cloud-Umgebung (Playwright und Chromium sind dort vorinstalliert).

1. `npm install`, dann `npm run generate`: `generator.cjs` baut aus den Parametern oben in der Datei (Breite, Tiefe in Noppen,
   Geschosse, Geschosshöhe, Farben) das Modell: Wände im Verband aus 1×1 bis 1×6, Fenster 1×2×2, Tür 1×2×3, Satteldach aus
   Schrägsteinen 45° und Firststeinen, Grundplatte 32×32. Ergebnis `model.json` (jedes Teil mit Position, Teilenummer, Farbe,
   Bauschritt), Stückliste in der Konsole und `wanted-list.xml` zum Hochladen bei BrickLink.
2. `npm run render`: `scene.html` zeichnet das Modell mit three.js (Noppen, Schrägen, Glas), `render.cjs` rendert je Bauschritt
   ein Bild, neue Teile orange, dazu Gesamtansichten.
3. `npm run shots`: `anleitung.html` wird zur PDF-Anleitung (Deckblatt, Teileliste, Schrittseiten).

Noch offen: Dachunterbau vollständig mit Steinen füllen (heute nur Giebel und Stützen alle vier Noppen), Preise live von
Pick a Brick (die Seite blockt Zugriffe aus der Cloud, Abfrage muss von einem normalen Anschluss laufen), Fotos als Eingabe
(heute Maße und Farben von Hand), 3D-Seite im Browser, Film.
