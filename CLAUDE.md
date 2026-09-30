# Motion-Design-Videos

Dieses Repo produziert Motion-Graphics-Videos (Produkt-, Website-, Launch- und YouTube-Videos) per Code.
Der Nutzer schreibt Deutsch, also antworte auf Deutsch.

## Referenzvideos (immer befolgen)

Referenzen liegen in `refs/<name>/` (Videodatei, z. B. `video.mp4`) oder kommen als Link.

Bevor du irgendetwas für ein Video planst oder animierst:

1. Jede Referenz ohne `analysis.json` analysieren:
   `python3 tools/analyze_ref.py refs/<name>/<datei>` (bei Links: `python3 tools/analyze_ref.py <url> --name <name>`).
2. `contact_sheet.png` und die Frames in `frames/` wirklich ansehen, nicht nur die Zahlen in `analysis.md`.
3. `projects/<projekt>/style_guide.md` schreiben (älteres Beispiel: `docs/style_guide.md` für ref-01): Palette (Hex), Typo (Familie, Gewicht, Tracking),
   Shot-Längen und Schnittrhythmus, Kamerabewegungen, Übergänge, Textur/Grain,
   wie Text rein- und rausgeht, Tempo/BPM und worauf Schnitte fallen.
4. Style Guide und `projects/<projekt>/shotlist.md` dem Nutzer zeigen und auf sein OK warten, bevor Animationscode entsteht.

Regeln:
- Von der Referenz nur die Grammatik übernehmen (Rhythmus, Bewegung, Typo-Verhalten, Farbstimmung),
  niemals ihren Inhalt, ihre Logos, Figuren oder ihre Musik.
- Produkt-UI nie aus der Fantasie nachzeichnen. Echte Screenshots, echtes Logo, echte Farben und Fonts
  des Kunden verwenden, gespeichert in `assets/`.
- Bei mehreren Referenzen ausdrücklich festhalten, welche Eigenschaft aus welcher Referenz kommt.

## Werkzeuge

`scripts/setup.sh` installiert ffmpeg, numpy, librosa, Pillow und yt-dlp und läuft automatisch beim Sitzungsstart.
Video-Ideen: `python3 tools/find_outliers.py` findet Outlier-Videos (Aufrufe weit über dem Kanal-Median)
zu `ideen/keywords.txt` und `ideen/channels.txt`, dazu Zuschauerfragen aus deren Kommentaren.
Bericht in `ideen/reports/<datum>.html`.
Websites (Kundenseiten, x.com, YouTube) sind nur erreichbar, wenn ihre Domain in den Netzwerk-Einstellungen
der Cloud-Umgebung freigegeben ist. Ein 403 beim Download bedeutet: Domain nicht freigegeben.

## Standards für neue Videos

- Voiceover: Piper-Stimme `de_DE-thorsten-high` (`tools/tts.py --engine piper`). Der Nutzer ist damit zufrieden.
  Fish Audio nur auf ausdrücklichen Wunsch (API-Guthaben ist getrennt vom App-Guthaben und steht auf 0).
- Kanal: „Der Handwerksdoktor“ (@derhandwerksdoktor), Profilbild in `assets/channel_avatar.jpg`.
- Shorts: 1080x1920, 60 fps, ca. 20 s, Labels über y = 1440 (Shorts-Oberfläche verdeckt unten).
- Zu jedem Video gehört eine `youtube.md` mit Titel, Beschreibung (inkl. Quelle), Tags und angeheftetem Kommentar.
- Vorlage für neue Projekte: `projects/klima-short/` (build.sh, render.mjs, music.py).
