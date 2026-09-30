# Style Guide: Referenz `refs/ref-01`

Quelle: `refs/ref-01/video.mp4` (32,9 s, 1920x1080, 60 fps, ohne Ton).
Übernommen wird nur die Grammatik. Inhalte, Texte und das Logo am Ende der Referenz werden nicht verwendet.

## Grundidee

**Eine einzige durchgehende Einstellung, kein einziger Schnitt.** Alles ist ein Morph:
Jede Szene zieht sich am Ende zu **einem Punkt oder einem Kreis** zusammen, und die nächste Grafik wächst genau daraus heraus.
Das Video wirkt wie ein Gedanke, der sich ständig umformt.

## Palette

| Rolle | Hex | Einsatz |
|---|---|---|
| Hintergrund | `#f6f6f1` | warmes Off-White, 87 % der Fläche |
| Tinte | `#111111` | Text, Standard-Punkte, Kreisumrisse |
| Hilfslinien | `#9fa09c` | gestrichelte Verbindungen, Gitter, Achsen |
| Punktraster | `#e4e3e1` | Hintergrund-Textur |
| Akzent warm | `#e8410f` | Orange-Rot: Hervorhebung, „heiß“, wichtigster Cluster |
| Akzent kalt | `#1a7fd1` | Blau: zweiter Cluster, „kalt“ |
| Akzent 3 | `#6f66cf` | Violett: dritter Cluster, Drittgröße |
| Selektion | `#c6dbe9` | Textmarkierung (wie markierter Text im Editor) |

Regel: **Farbe bedeutet etwas.** Erst ist alles schwarze Tinte. Farbe kommt erst, wenn Gruppen oder Zustände entstehen.
Nie mehr als drei Akzente gleichzeitig.

## Typografie

- Familie: neutrale Grotesk (Referenz wirkt wie SF Pro). Wir nutzen **Inter** (frei lizenziert).
- Headline/Eingabe: Medium 500, ca. 44 px bei 1080 p, Tracking −1 %, schwarz, linksbündig.
- Label: Medium 500, ca. 22 px, Tracking −0,5 %, unten links, fester Platz für das ganze Video.
- Keine Großbuchstaben-Headlines, keine Fettschrift, keine Schatten, keine Verläufe.

## Wie Text rein- und rausgeht

1. **Tippen:** Buchstabe für Buchstabe mit einem **dünnen orange-roten Cursor** `|` (ca. 25 Zeichen/s, blinkt in Pausen).
2. **Markieren und ersetzen:** Der ganze Satz wird blau hinterlegt (Select-All), dann durch neuen Text überschrieben, der wie ein Befehl mit `/` beginnt.
3. **Labels unten links** steigen buchstabenweise von unten aus einer Maske auf (ca. 20 ms Versatz pro Zeichen) und gehen auf demselben Weg nach unten weg.
4. Die Headline verblasst auf ca. 10 %, während die erste Grafik schon wächst.

## Grafiksprache

- Dünne Linien (1,5 px), gefüllte Punkte (Ø ca. 10 px), keine Flächen außer Punkten.
- Wichtige Knoten bekommen einen **schwarzen Ring** um den Punkt.
- Beziehungen = **gestrichelte graue Linien**.
- Formen: Punktwolken, Netzwerke, sich überlappende Kreise, Drahtgitter-Kugel, Molekül-Ketten, Torus, Spirale im Strömungsfeld.
- Pseudo-3D: Drahtgitter mit langsamer Rotation, keine Beleuchtung.

## Bewegung

- Keine Kamerafahrten, keine Zooms. Die Kamera steht, nur die Objekte bewegen sich.
- Easing: weich rein und raus (ease-in-out, cubic). Punkte starten leicht versetzt (Stagger ca. 15 ms).
- Übergänge: **Kollaps zu einem Punkt → Explosion in die nächste Form** (ca. 0,5 s).
- Viel Luft: Die Grafik belegt höchstens ca. 40 % der Bildbreite, Mitte leicht über der Bildmitte.

## Timing

| Abschnitt der Referenz | Zeit | Dauer |
|---|---|---|
| Satz tippen, markieren, `/befehl` tippen | 0,0–3,5 s | 3,5 s |
| „See the data“ | 3,5–6,0 s | 2,5 s |
| „Explore systems“ | 6,0–10,0 s | 4,0 s |
| „Find cause and effect“ | 10,0–16,0 s | 6,0 s |
| „From molecules…“ | 16,0–21,0 s | 5,0 s |
| „to mathematics…“ | 21,0–24,5 s | 3,5 s |
| „and more“ | 24,5–28,0 s | 3,5 s |
| `/befehl` erneut tippen | 28,0–30,0 s | 2,0 s |
| Logo | 30,0–33,0 s | 3,0 s |

Abschnitte dauern **2,5 bis 6 s**, im Schnitt ca. 4 s. Bei 120 BPM sind das 2 Takte pro Abschnitt:
Abschnittswechsel auf Downbeats, Zustandswechsel innerhalb eines Abschnitts auf Beats.

## Textur

- Kein Grain, kein Rauschen, keine Vignette.
- Feines **Punktraster** im Hintergrund (Abstand ca. 48 px, Farbe `#e4e3e1`), kaum sichtbar.

## Ton

Die Referenz hat keinen Ton. Für uns gilt (aus den Prompts): eigene Musik mit 120 BPM, per Code erzeugt, minimal,
keine Synth-Flächen, dazu UI-Sounds (Klick beim Tippen, Whoosh beim Morph, Thump beim Schlussbild).

## Anpassung für 9:16 (YouTube Shorts)

- 1080x1920, 60 fps.
- Grafik mittig bei ca. 40 % Bildhöhe, max. 75 % Bildbreite.
- Die Labels **nicht ganz unten**: Die Shorts-Oberfläche verdeckt die unteren ca. 25 % und den rechten Rand.
  Deshalb liegen die Labels links bei ca. y = 1350 px.
- Headline-Schrift auf ca. 64 px vergrößern (Handy-Bildschirm).
