# Die 50 Maschinen: wie sie ausgewählt wurden (03.10.2026)

Echte Verkaufszahlen über 20 Jahre veröffentlichen Hersteller und Händler nicht (GfK-Daten sind kostenpflichtig).
Belegt ist nur: De’Longhi ist Marktführer in Deutschland (über 35 % Marktanteil), die Magnifica S seit über 15 Jahren
einer der meistverkauften Vollautomaten und aktuell Amazon-Bestseller (Quellen: brewww.de, MaxiCoffee, vergleich.org).

Deshalb ausgewählt nach **Hilfe-Nachfrage**: Wie oft werden Anleitungen zu einem Modell angesehen? Viele Aufrufe bei
„<Modell> entkalken“ heißen viele Besitzer, und genau die sind die Zielgruppe der Seite.

- `kandidaten.tsv`: 78 Modelle und Serien der letzten 20 Jahre (De’Longhi, Philips, Saeco, Siemens, Bosch, Jura, Melitta,
  Krups, Nivona, WMF, Tchibo, Gaggia, Miele, AEG).
- `messen.py` → `messung.json`: je Modell Google-Vorschläge (Modellname + a–z) und die Top-8-YouTube-Videos zu
  „<Modell> entkalken“ mit Aufrufen. Maß = Median der Aufrufe der Top 5.
- `top50.json`: die 50 Modelle mit der höchsten Nachfrage (aussortiert: „Bosch Serie 6“ und „Saeco Odea“, Suche lieferte nichts Passendes).
  Dazu kommen 4 Maschinen, zu denen es schon eigene Videos gibt (Rivelia, Philips 4300, Jura Impressa E, Sage Barista Express).

Grenzen:
- Bei wenigen Modellen passten nicht alle Suchtreffer zum Modell (Saeco Syntia 2 von 8, Melitta Purista und Barista 3 von 8).
  Deren Nachfrage ist wahrscheinlich zu hoch geschätzt.
- Jura-Geräte werden mit Filter seltener entkalkt. Ihre Nachfrage ist mit diesem Maß eher zu niedrig (Jura E8 ist ein Bestseller).
- Modellnummern stehen in `kaffee/site/src/maschinen.json` nur, wenn sie aus Herstellerseite, Anleitung oder eindeutigen Videotiteln stammen.
