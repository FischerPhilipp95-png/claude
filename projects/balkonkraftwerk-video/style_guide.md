# Style Guide: Balkonkraftwerk-mit-Speicher-Video

**Gleiches Design wie Strom-, Wasser- und Heizungsvideo** (`projects/strom-video/style_guide.md`, Referenz `refs/ref-03`):
schwarzer Grund, flache bunte Kreis-Figuren mit Augen aus Satzzeichen, Ausdruckswechsel auf dem Beat, Close-up-Zoom zu Kapitelbeginn,
Titel aus orangen Konstruktionspunkten, Klammer-Zeilen für Zahlen, Kapitel-Label oben links, Musik 123 BPM.
Echte Fotos als Glas-Karten mit Bildquelle wie im Heizungsvideo (`projects/heizung-video/style_guide.md`).

Das YouTube-Video aus dem Auftrag ist **keine Stil-Referenz**, sondern nur Themenquelle (siehe `research.md`).

Hier stehen nur die **Unterschiede**.

## Hauptfiguren

- **Funke** (gelber Kreis `#ffd400` mit Blitz-Tolle) aus dem Stromvideo kommt zurück, diesmal als Solarstrom. Wiedererkennung auf dem Kanal.
- **Akku**: hochkant abgerundetes Rechteck in Dunkelgrau `#262626` mit weißem Gesicht. Innen ein **Füllstand** in Grün `#03b84c`,
  der im Takt steigt (Funken fliegen rein) und abends sinkt. Bei 100 % Augen `^ ^`, leer `- -`.
  Bewusst **neutral, ohne Herstellerlogo, ohne nachgezeichnete Geräte-UI** (Regel aus CLAUDE.md).
- **Sonne** (Orange `#ff741c`) und **Mond** (Lila `#924ef6`) zeigen Tag und Abend.

## Stations-Figuren

| Figur | Aussehen |
|---|---|
| Solarmodul | blaues Rechteck `#006aff` mit weißem Zellraster, Augen oben |
| Schuko-Steckdose | hellgrauer Kreis `#e0e0e0`, zwei Löcher als Augen `o o` |
| Wieland-Steckdose | hellgraues Rechteck mit drei Pins, Schraubring |
| Zähler / Smart Meter | hellgrauer Kasten mit Display-Ziffern, die hochzählen |
| Haus | Umriss mit Fenstern, die abends gelb werden |
| Waage | Kosten links, Ersparnis rechts, kippt auf dem Beat |
| Euro-Münze | gelber Kreis mit „€“, ploppt pro gesparter Summe |
| Elektriker | Schraubendreher-Figur mit Helm |

## Farben für Zahlen

- Ersparnis/ok: Grün `#03b84c`
- Kosten/Grenze: Orange `#ff741c`
- „Achtung, gilt nicht“: durchgestrichen in Lila `#924ef6`

## Neue Grafik-Elemente

- **Tageskurve**: Solarproduktion als gelber Hügel (mittags), Verbrauch als lila Linie (morgens + abends). Die Lücke füllt der Akku.
- **Regel-Treppe** für 960 Wp / 2.000 Wp / darüber, jede Stufe mit Steckdosen-Figur.
- **Rechen-Zeilen**: `850 kWh × 50 % × 37 ct = [157 €]`, Zahlen tippen sich im Takt ein.

## Fotos (Wikimedia Commons, `photos/credits.json`)

| Foto | Lizenz | Einsatz |
|---|---|---|
| `Balkonkraftwerk2.jpg`: Module an Balkonen eines Mehrfamilienhauses | CC BY 4.0, Nikolai Twin | Intro |
| `Balkonkraftwerk_08_22_32_022000.jpeg`: Hochhaus mit mehreren Balkonmodulen | CC0, Shisma | Kapitel Regeln, Thumbnail |
| `Balcony_solar_panels_in_Wesenberg__Germany_a.jpg`: Module über Tür und am Zaun | CC BY 4.0, RobbieIanMorrison | Kapitel Erweitern |
| `Logarex_smart_household_electricity_meter_build_year_2023.jpg`: digitaler Stromzähler | CC BY 4.0, RobbieIanMorrison | Kapitel Smart Meter / dynamischer Tarif |

## Sound

Gleicher Charakter (123 BPM), echte Instrumente per Soundfont wie `projects/havanola-promo/music.py`.
Dazu ein **„Kling“** (Münze), wenn eine Ersparnis erscheint, und ein aufsteigender **Lade-Blip**, wenn der Akku sich füllt.
