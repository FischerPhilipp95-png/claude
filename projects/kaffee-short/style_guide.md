# Style Guide: Referenz `refs/ref-02`

Quelle: `refs/ref-02/video.mp4` (35 s, 1920x1080, 60 fps, ohne Ton).
Übernommen wird nur die Grammatik. Texte, der Würfel und die Marke der Referenz werden nicht verwendet.

## Grundidee

**Alles ist aus leuchtenden Punkten gebaut, und alles zerfällt zu Staub und setzt sich neu zusammen.**
Eine durchgehende Einstellung ohne Schnitt, dunkler Grund. Jede Form (Kugel, Karten, Schrift) löst sich
am Ende ihres Abschnitts in eine Punktwolke auf, die Wolke driftet und formt die nächste Grafik.
Am Schluss **kippt das Bild**: Ein heller Kreis wächst aus der Mitte und macht den Grund hell. Darauf steht das Logo.

## Palette

| Rolle | Hex | Einsatz |
|---|---|---|
| Grund dunkel | `#18171a` | fast Schwarz mit leichtem Violett-Stich, bis kurz vor Schluss |
| Punkte / Headline | `#f1efec` | warmes Weiß, alle Punkte und die erste Headline-Zeile |
| Unterzeile | `#8a8a8c` | Grau, kleine Erklärzeile unter dem Titel |
| Akzent Lavendel | `#a4acec` | zweite Headline-Zeile, einzelne Punkte in Formen (Farbverlauf an der Kante) |
| Grund hell (Schluss) | `#f4f4ec` | Off-White nach dem Kippen |
| Akzent Blau (Schluss) | `#3454d4` | Logo-Linien, kleine Zeile unter dem Namen |

Regel: Auf dunklem Grund ist alles Weiß, nur **eine** Sache ist Lavendel. Auf hellem Grund ist alles Schwarz, nur **eine** Sache ist Blau.

## Typografie

- Neutrale Grotesk (wirkt wie SF Pro). Wir nutzen **Inter**.
- Titel: Regular/Medium, groß (ca. 120 px bei 1080 p), Tracking −2 %.
- Headline aus zwei Zeilen: Zeile 1 weiß, Zeile 2 lavendel, beide gleich groß.
- Unterzeile: ca. 34 px, grau, direkt unter dem Titel.
- **Punktschrift:** große Wörter aus einem Punktraster (wie eine Anzeigetafel). Einzelne Buchstaben zerfallen und setzen sich neu zusammen („move“ → „more“).

## Wie Text rein- und rausgeht

- Rein: **Zeilen steigen aus einer Maske auf** (von unten, weich, ca. 0,4 s), Zeile 2 kurz nach Zeile 1.
- Raus: dieselbe Bewegung weiter nach oben aus der Maske, während die Grafik schon zerfällt.
- Text steht links, die Grafik rechts. **Im 9:16-Format: Text oben, Grafik darunter.**

## Grafiksprache

- **Nur Punkte**, keine durchgehenden Linien. Kanten von Formen sind Punktreihen.
- Kugel aus ca. 2000 Punkten mit leichter Drehung. Punkte an der Kante kleiner und dunkler, das gibt Tiefe.
- Flache Formen (Karten, Listen) mit leichter 3D-Neigung, Umriss aus Punkten.
- Kleine Punktkugeln als Nebenelemente, mit Mini-Beschriftung darunter.
- Zerfall: Punkte fliegen mit Zufallsversatz auseinander und driften nach, dann ziehen sie in die neue Form.

## Bewegung

- Die Kamera steht. Formen drehen sich langsam (Kugel) oder schweben leicht.
- Zerfall ca. 0,6 s, Drift ca. 0,4 s, Aufbau ca. 0,8 s mit weichem Ausklang.
- Neue Formen bauen sich punktweise auf, nicht alle auf einmal (Stagger).

## Timing der Referenz

| Abschnitt | Zeit | Dauer |
|---|---|---|
| Kreis → Punkt → Punktkugel | 0–1,5 s | 1,5 s |
| Headline „Zeile 1 / Zeile 2 (Lavendel)“ + Kugel | 1,5–5,0 s | 3,5 s |
| Zerfall, Drift | 5,0–7,0 s | 2,0 s |
| Titel 1 + Karten | 7,0–10,0 s | 3,0 s |
| Titel 2 + Karten | 10,5–12,5 s | 2,0 s |
| Titel 3 + Punktschrift-Morph | 13,5–18,0 s | 4,5 s |
| Titel 4 + Karten | 19,5–22,5 s | 3,0 s |
| Nebenkugeln mit Beschriftung | 23,0–26,5 s | 3,5 s |
| Zerfall → Kugel → Würfel | 27,0–29,5 s | 2,5 s |
| Heller Kreis wächst, Logo, Name, URL | 29,5–35,0 s | 5,5 s |

## Textur

Kein Grain, keine Vignette. Die Tiefe entsteht nur über Punktgröße und Helligkeit.

## Ton

Die Referenz hat keinen Ton. Wir nutzen wie beim Klima-Short: 120 BPM per Code, Voiceover (Piper), UI-Sounds.
Zum dunklen Look passt eine etwas tiefere, weichere Musik als beim Klima-Short.

## Anpassung für 9:16

- 1080x1920, 60 fps, Titel oben links bei ca. y = 420, Grafik mittig bei ca. y = 1000.
- Nichts Wichtiges unter y = 1440 (Shorts-Oberfläche).
