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

## Nachtrag 28.10.2026, nachmittags

- Generator nimmt Parameter auf der Kommandozeile: `node generator.cjs --W 14 --D 10 --floors 1 --wall white --roof "dark bluish gray" --door black --out model_bungalow.json`.
  Farben: tan, white, red, dark red, black, dark bluish gray, light bluish gray, reddish brown, green. Beispiele Bungalow und
  Backsteinhaus liegen in `../beispiel-haus/`, gerendert mit `render_variants.cjs`.
- Startseite als Entwurf: `../startseite/template.html`, der Platzhalter `__MODEL__` wird mit dem gekürzten `model.json`
  gefüllt (Teile, Farben, Schritte, Schrittnamen); die Seite zeigt das Haus als lebendes 3D-Modell mit three.js, Reihe für
  Reihe, und das Bestellformular. Veröffentlicht als Artifact, Link im Chat.
- Freie Domains am 28.10.2026 laut DENIC: hausinsteinen.de, deinhausinsteinen.de, meinhausinsteinen.de, steinchenhaus.de,
  klemmhaus.de, hausbausteine.de, steinhaus-modell.de. Belegt: noppenhaus.de, noppenwerk.de, bauklotzhaus.de, steinfuerstein.de.
