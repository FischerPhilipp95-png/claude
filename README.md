# Motion-Design-Videos mit Claude

## Referenzvideo hochladen

**Weg 1: Datei hochladen (empfohlen)**
1. Auf GitHub dieses Repo öffnen, Branch wählen, in den Ordner `refs/` gehen.
2. **Add file → Upload files**.
3. Oben im Pfad einen neuen Ordnernamen eintippen, z. B. `refs/mtioon/`, dann das Video hineinziehen.
4. **Commit changes**.

Über den Browser gehen maximal **25 MB** pro Datei. Ein 15–30-Sekunden-Clip in 1080p passt meistens.
Ist er größer, vorher komprimieren (z. B. mit HandBrake oder einem Online-Kompressor).

**Weg 2: Link schicken**
Einfach den Link in den Chat schreiben (X, YouTube, Instagram, Vimeo …).
Dafür muss die Domain in den Netzwerk-Einstellungen der Cloud-Umgebung freigegeben sein.

## Dann an Claude schreiben

> Neue Referenz in `refs/mtioon`. Analysiere sie, schreib den Style Guide
> und eine Shotlist für ein 15-s-Video über [PRODUKT] ([URL]) in genau diesem Stil.
> Zeig mir beides und warte auf mein OK.

Mehrere Referenzen gehen auch, z. B. „Schnittrhythmus von `refs/a`, Typo von `refs/b`“.

## Was die Analyse liefert

`python3 tools/analyze_ref.py refs/<name>/video.mp4` erzeugt in `refs/<name>/`:

| Datei | Inhalt |
|---|---|
| `contact_sheet.png` | alle 0,5 s ein Frame auf einem Blatt |
| `frames/` | die Einzelbilder (nicht in Git) |
| `analysis.json` / `analysis.md` | Dauer, Format, Schnitte, Shot-Längen, Farbpalette, BPM, Beats |

Daraus schreibt Claude `docs/style_guide.md`. Neue Videos halten sich daran.
Übernommen wird nur der Stil, nie Inhalte, Logos oder Musik der Referenz.

## Ein Video bauen (Beispiel: `projects/klima-short`)

Jedes Video ist ein Ordner unter `projects/`. Die ganze Pipeline läuft mit einem Befehl:

```
bash projects/klima-short/build.sh
```

| Schritt | Datei | Ergebnis |
|---|---|---|
| Voiceover | `tools/tts.py` + `vo_script.json` | `audio/vo/*.wav` (Fish Audio mit `FISH_API_KEY`, sonst Piper) |
| Musik | `music.py` | `audio/music.wav`, 120 BPM, per Code |
| Beats | `tools/beats.py` | `beats.json`: bpm, beats, downbeats, hits |
| Timeline + SFX-Cues | `render.mjs --timeline` | `timeline.json`, `cues.json` |
| UI-Sounds | `tools/sfx.mjs` | `audio/sfx.wav` (click, pop, thump, whoosh) |
| Abnahme | `render.mjs --contact` | `out/contact_sheet.png`, ein Frame pro Abschnitt |
| Bild | `render.mjs` | `out/video.mp4` (stumm) |
| Mischen | `tools/mix.py` | `out/final.mp4` (Musik duckt unter der Stimme, −14 LUFS) |

Zustandswechsel liegen auf Beats, große Momente (Logo, CTA) auf Downbeats, SFX auf Hits.

**API-Keys nie ins Repo schreiben.** Fish Audio: den Key als Umgebungsvariable `FISH_API_KEY` in den
Einstellungen der Cloud-Umgebung hinterlegen (Environment variables).
