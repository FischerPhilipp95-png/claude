# Motion-Design-Videos

Dieses Repo produziert Motion-Graphics-Videos (Produkt-, Website-, Launch- und YouTube-Videos) per Code.
Der Nutzer schreibt Deutsch, also antworte auf Deutsch.

## Referenzvideos (immer befolgen)

Referenzen liegen in `refs/<name>/` (Videodatei, z. B. `video.mp4`) oder kommen als Link.

Bevor du irgendetwas für ein Video planst oder animierst:

1. Jede Referenz ohne `analysis.json` analysieren:
   `python3 tools/analyze_ref.py refs/<name>/<datei>` (bei Links: `python3 tools/analyze_ref.py <url> --name <name>`).
2. `contact_sheet.png` und die Frames in `frames/` wirklich ansehen, nicht nur die Zahlen in `analysis.md`.
3. `docs/style_guide.md` schreiben bzw. aktualisieren: Palette (Hex), Typo (Familie, Gewicht, Tracking),
   Shot-Längen und Schnittrhythmus, Kamerabewegungen, Übergänge, Textur/Grain,
   wie Text rein- und rausgeht, Tempo/BPM und worauf Schnitte fallen.
4. Style Guide und Shotlist dem Nutzer zeigen und auf sein OK warten, bevor Animationscode entsteht.

Regeln:
- Von der Referenz nur die Grammatik übernehmen (Rhythmus, Bewegung, Typo-Verhalten, Farbstimmung),
  niemals ihren Inhalt, ihre Logos, Figuren oder ihre Musik.
- Produkt-UI nie aus der Fantasie nachzeichnen. Echte Screenshots, echtes Logo, echte Farben und Fonts
  des Kunden verwenden, gespeichert in `assets/`.
- Bei mehreren Referenzen ausdrücklich festhalten, welche Eigenschaft aus welcher Referenz kommt.

## Werkzeuge

`scripts/setup.sh` installiert ffmpeg, numpy, librosa, Pillow und yt-dlp und läuft automatisch beim Sitzungsstart.
Websites (Kundenseiten, x.com, YouTube) sind nur erreichbar, wenn ihre Domain in den Netzwerk-Einstellungen
der Cloud-Umgebung freigegeben ist. Ein 403 beim Download bedeutet: Domain nicht freigegeben.
