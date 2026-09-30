# Style Guide: Referenz `refs/ref-03`

Quelle: `refs/ref-03/video.mp4` (12,2 s, 1920x1080, 60 fps, mit Ton).
Übernommen wird nur die Grammatik (Bewegung, Formen, Typo-Verhalten, Klangcharakter).
Nicht übernommen: Texte, Marken und Logos der Referenz, ihre Musik.

## Grundidee

**Flache, knallbunte Kreise als Figuren mit Gesichtern aus Satzzeichen.**
Die Augen sind Zeichen wie `* *`, `- -`, `o o`, `> <`, `+ +`, `^ ^`, `v`, `/`. Sie **wechseln den Ausdruck auf dem Beat**.
Eine durchgehende Einstellung ohne Schnitt. Übergänge laufen über Zoom, Schrumpfen und Aufploppen.

Typischer Ablauf der Referenz:
1. **Extremer Close-up** auf ein Gesicht (nur zwei riesige `* *` im Bild), dann **zoomt es heraus** und wird ein Kreis in der Bildmitte.
2. Das Gesicht wechselt auf jedem Beat den Ausdruck: `* *` → `- -` → `o o` → `> <`.
3. Weitere Kreise in anderen Farben **ploppen mit Überschwinger** rund um die Mitte auf, jeder mit eigenem Gesicht. Die Gesichter wechseln weiter im Takt.
4. Alle Kreise **schrumpfen zu Punkten** und fliegen auseinander.
5. **Text baut sich aus Punkten**: Orange Punkte schwärmen ein und setzen sich auf die Eckpunkte der Buchstaben. Dann erscheint ein dünner weißer Umriss, dann die weiße Füllung, und die orange Punkte verschwinden.
6. Weitere Wörter hängen sich auf dieselbe Weise an. Am Ende steht eine **Zeile mit farbigen Wörtern und eckigen Klammern**.

## Palette

| Rolle | Hex | Einsatz |
|---|---|---|
| Grund | `#000000` | reines Schwarz, immer |
| Figur Hellgrau | `#e0e0e0` | die Hauptfigur („der Strom“) |
| Lila | `#924ef6` | Figur, Akzentwort |
| Orange | `#ff741c` | Figur, **Konstruktionspunkte der Schrift** |
| Grün | `#03b84c` | Figur, Akzentwort (sicher, an) |
| Blau | `#006aff` | Figur |
| Dunkelgrau | `#262626` | Figur mit **weißem** Gesicht |
| Gesichtszeichen | `#000000` bzw. `#ffffff` | Schwarz auf hellen Kreisen, Weiß auf Dunkelgrau |
| Text | `#ffffff` | Schrift weiß, einzelne Wörter in Grün oder Lila |

Kreise sind **vollflächig**, ohne Kontur, ohne Schatten, ohne Verlauf.

## Typografie

- Neutrale Grotesk (wirkt wie Söhne/Inter). Wir nutzen **Inter Medium**.
- Gesichtszeichen: dieselbe Schrift, sehr fett wirkend (dicke Striche), leicht gedreht (±10°).
- Text klein bis mittel und zentriert. Große Headlines (ca. 200 px) nur beim Punkt-Aufbau.
- Klammer-Zeile: `Wort [Zahl]`. Wort in Grün, Klammern und Zahl in Lila, Rest weiß.

## Wie Text rein- und rausgeht

- **Rein:** Punkt-Schwarm (orange, Punkte ca. 8–10 px) → Punkte auf die Eckpunkte → Umriss (1,5 px weiß) → Füllung. Etwa 0,8 s pro Wort, von links nach rechts versetzt.
- **Raus:** Wörter zerfallen wieder in Punkte und fliegen weg, oder alles schrumpft zu einem Punkt.

## Bewegung

- **Kamera:** Zooms, vor allem zu Beginn eines Abschnitts (vom Close-up heraus).
- **Pop-in:** Kreise skalieren von 0 auf 1 mit Überschwinger (ca. 1,08), ca. 0,35 s.
- **Gesichter:** Ausdruckswechsel hart auf dem Beat, ohne Überblendung, dazu ein kleiner Squash (Kreis kurz 4 % breiter).
- **Wimmeln:** Kreise schweben leicht (±6 px) und drehen die Zeichen minimal.
- **Ausgang:** Alle Kreise schrumpfen gleichzeitig und driften zur Mitte.

## Timing der Referenz

| Abschnitt | Zeit |
|---|---|
| Close-up `* *`, Zoom heraus | 0,0–1,0 s |
| Ein Gesicht, Ausdruck wechselt pro Beat (≈ 0,49 s) | 1,0–2,4 s |
| Fünf weitere Kreise ploppen auf, alle wechseln im Takt | 2,4–4,3 s |
| Schrumpfen zu Punkten | 4,3–4,8 s |
| Wort 1 baut sich aus Punkten | 4,8–5,8 s |
| Wörter 2 und 3 hängen sich an | 5,8–7,5 s |
| Klammer-Zeile baut sich auf und steht | 8,0–12,2 s |

## Textur

Keine. Flache Farben auf Schwarz, gestochen scharf.

## Sound (vermessen, `refs/ref-03`)

- **123 BPM**, Beat = 0,488 s. Ausdruckswechsel und Pop-ins liegen genau auf den Beats.
- **Sehr bassig:** 31 % der Energie unter 80 Hz, 23 % zwischen 80 und 250 Hz.
- **Tonal statt Schlagzeug:** Harmonisch zu perkussiv ≈ 19 : 1. Ein obertonreicher Synth-Bass mit gehaltenen Tönen, die im Takt wechseln.
- **Viele kurze, knackige Klicks und Blips** darüber (glitchig, im 16tel-Raster), das sind die „Stimmen“ der Figuren.
- **Tonart** um Fis-Pentatonik (Fis, Gis, Cis, Dis), verspielt und freundlich.
- **Pausen:** Beim Text-Aufbau wird es kurz leiser (6–7 s, 9 s), am Ende steht ein langer Sub-Ton.

**Unser Track:** eigene Musik per Code in genau diesem Charakter. 123 BPM, Fis-Pentatonik, Saw-/Sub-Bass mit
gehaltenen Tönen, Glitch-Klicks im 16tel-Raster, Blips bei Ausdruckswechseln, Breaks bei den Text-Aufbauten, langer Sub-Ton am Ende.
Kein Sample und keine Melodie aus der Referenz.

## Anpassung für ein langes Video (16:9, ca. 4–5 min)

- 1920x1080, 60 fps.
- Die Referenz ist ein 12-s-Trailer. Für Erklärinhalte kommen **Stationen als Figuren** dazu (Kraftwerk, Mast, Umspannwerk usw.),
  gebaut aus demselben Vokabular: flache Kreise und abgerundete Rechtecke, dicke Zeichen-Striche, Gesichter.
- Jedes Kapitel beginnt mit dem Referenz-Muster: Close-up → Zoom heraus → Kapiteltitel aus Punkten.
- Wichtige Zahlen (380 kV, 230 V, 30 mA) kommen als **Klammer-Zeile** aus Punkten.
- Die Musik läuft das ganze Video und wird unter der Stimme leiser. Bei jedem Kapiteltitel gibt es einen kurzen Break.
