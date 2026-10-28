# Prototyp Möbelhack

Bewiesen am 28.10.2026 in der Cloud-Umgebung (Playwright und Chromium sind dort vorinstalliert):

- `scene.html` + `render.cjs`: parametrisches 3D-Modell der Flur-Sitzbank aus KALLAX in three.js, je Schritt ein Bild,
  neue Teile orange. `npm install`, dann `npm run render` → `step1.png` … `final.png`.
- `anleitung.html` + `startseite.html` + `shots.cjs`: PDF-Anleitung (Deckblatt, Teileliste, Schrittseiten) und
  Startseiten-Skizze. `npm run shots` → `anleitung.pdf`, `anleitung_*.png`, `startseite.png`.
- `ikea-lookup.cjs`: liest zu Suchbegriffen die ersten Treffer von ikea.de (Name, Artikelnummer, Preis, Aktionshinweis)
  und die Produktseite aus. Ergebnis vom 28.10.2026 in `ikea-lookup-ergebnis.json`. Vor dem Ausführen braucht die
  Umgebung Zugriff auf www.ikea.com.

Die Bilder in `../beispiel-flurbank/` stammen aus genau diesen Skripten.
