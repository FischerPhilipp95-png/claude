# Style Guide: Artikel-Shorts (Serie)

Eine Serie von YouTube-Shorts, die aus den Artikeln von handwerksdoktor.de entsteht: ein Short pro Artikel, gleicher Aufbau,
gleiche Optik. Damit sie sich automatisch bauen lassen, ist alles **datengesteuert**. Pro Short gibt es eine kleine Datei mit
Hook, 3 Punkten und Schluss, der Rest kommt aus der Vorlage.

## Referenz

**Nur `refs/ref-03`** (Analyse: `refs/ref-03/analysis.md`, bereits genutzt für `projects/strom-video`).
Grund: Die Website, die Pins und die Themenfarben stammen aus derselben Palette. So sieht der Short aus wie die Seite, auf die er verweist.
Von der Referenz übernommen wird nur die Grammatik: flache Kreise mit Gesichtern aus Satzzeichen, Ausdruckswechsel auf dem Beat,
Pop-ins mit Überschwinger, Text, der sich aus Punkten aufbaut, schwarzer Grund, kein Schnitt.
Nicht übernommen: Texte, Figuren im Detail, Marken, Musik der Referenz.

## Palette

| Rolle | Hex | Einsatz |
|---|---|---|
| Grund | `#000000` | immer |
| Themenfarbe | aus `blog/site/src/themen.ts` | Hauptfigur und Akzentwort, z. B. Heizung `#ff741c`, Strom `#ffd400`, Wasser `#39a8ff`, Raumklima `#03b84c`, Haushalt `#924ef6`, Sicherheit `#d6336c`, Werkzeug `#12b5a5` |
| Nebenfiguren | `#e0e0e0`, `#262626` | zweite und dritte Figur (helles bzw. dunkles Gesicht) |
| Punkte für Schrift | `#ff741c` | Konstruktionspunkte beim Text-Aufbau (wie Referenz), bei Heizung stattdessen `#ffd400`, damit sie sich von der Figur abheben |
| Text | `#ffffff` | Schrift, ein Akzentwort pro Zeile in der Themenfarbe |

Kreise vollflächig, ohne Kontur, Schatten oder Verlauf. Pro Short nur **eine** Themenfarbe plus die zwei Grautöne.

## Typografie

- **Inter** (Medium 500 für Text, ExtraBold 800 für die Hook-Zeile), wie auf der Website.
- Hook: 120 px, max. 2 Zeilen, zentriert, Akzentwort in der Themenfarbe.
- Punkt-Titel: 84 px, darunter eine graue Erklärzeile (`#9a9a9a`, 44 px), max. 2 Zeilen.
- Zahlen als Klammer-Zeile wie in der Referenz: `Druck [1–2 bar]`, Klammern und Zahl in der Themenfarbe.
- Gesichtszeichen in derselben Schrift, sehr fett, leicht gedreht.

## Wie Text rein- und rausgeht

- Rein: Punkt-Schwarm → Punkte setzen sich auf die Buchstaben → Umriss → Füllung (ca. 0,6 s, Wort für Wort).
- Raus: Wörter zerfallen in Punkte, die Punkte fliegen zur nächsten Figur und werden zu deren Pop-in.

## Bewegung

- Kamera steht, nur zu Beginn ein Zoom aus dem Close-up (zwei riesige Augen `o o`) heraus.
- Pop-in mit Überschwinger 1,08 in ca. 0,35 s. Ausdruckswechsel hart auf dem Beat, dazu 4 % Squash.
- Figuren schweben leicht (±6 px). Jede Figur trägt das Icon des Punkts (Lucide, wie auf der Website) über dem Kopf.
- Ausgang: alles schrumpft zur Mitte und wird zum Profilbild.

## Aufbau jedes Shorts (ca. 20 s, 123 BPM, 1 Takt = 1,95 s)

| Teil | Takte | Zeit | Inhalt |
|---|---|---|---|
| Hook | 2 | 0,0–3,9 s | Close-up Augen, Zoom heraus, Hauptfigur schaut „erschrocken“ `o o`, Hook-Frage aus Punkten |
| Punkt 1 | 2 | 3,9–7,8 s | Figur 1 ploppt auf, Titel + graue Zeile |
| Punkt 2 | 2 | 7,8–11,7 s | Figur 2 ploppt auf, Figur 1 rückt zur Seite |
| Punkt 3 | 2 | 11,7–15,6 s | Figur 3, ggf. Klammer-Zeile mit Zahl |
| Schluss | 2,3 | 15,6–20,0 s | Alles schrumpft, Profilbild, „Alle Ursachen: handwerksdoktor.de“, „@derhandwerksdoktor“ |

Schnitte fallen nicht an, jeder Teilwechsel liegt auf einem Downbeat, jeder Ausdruckswechsel auf einem Beat.

## Format und Ton

- 1080x1920, 60 fps, ca. 20 s. Alle Texte und Labels oberhalb von y = 1440 (unten verdeckt die Shorts-Oberfläche).
- Stimme: Piper `de_DE-thorsten-high` (`tools/tts.py --engine piper`).
- Musik per Code im Charakter der Referenz: 123 BPM, Fis-Pentatonik, Sub-Bass mit gehaltenen Tönen, Glitch-Klicks, Blips bei
  Ausdruckswechseln, unter der Stimme leiser. Kein Sample aus der Referenz.
- Textur: keine.

## Inhaltliche Regeln

- Jeder Satz stammt aus dem Artikel, den der Short bewirbt. Quelle steht in `youtube.md`.
- Keine Produkte, keine Marken im Bild. Keine echte Geräte-UI nachzeichnen.
- Schluss verweist auf den Artikel (Text im Bild) und in YouTube auf das passende lange Video („Ähnliches Video“), denn Links in
  Shorts-Beschreibungen sind nicht anklickbar.
