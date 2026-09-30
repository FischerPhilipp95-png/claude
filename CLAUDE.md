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
Websites (Kundenseiten, x.com, YouTube) sind nur erreichbar, wenn ihre Domain in den Netzwerk-Einstellungen
der Cloud-Umgebung freigegeben ist. Ein 403 beim Download bedeutet: Domain nicht freigegeben.

## Standards für neue Videos

- Voiceover: Piper-Stimme `de_DE-thorsten-high` (`tools/tts.py --engine piper`). Der Nutzer ist damit zufrieden.
  Fish Audio nur auf ausdrücklichen Wunsch (API-Guthaben ist getrennt vom App-Guthaben und steht auf 0).
- Kanal: „Der Handwerksdoktor“ (@derhandwerksdoktor), Profilbild in `assets/channel_avatar.jpg`.
- Shorts: 1080x1920, 60 fps, ca. 20 s, Labels über y = 1440 (Shorts-Oberfläche verdeckt unten).
- Zu jedem Video gehört eine `youtube.md` mit Titel, Beschreibung (inkl. Quelle), Tags und angeheftetem Kommentar.
- Vorlage für neue Projekte: `projects/klima-short/` (build.sh, render.mjs, music.py).

## Thumbnails (Standard, vom Nutzer als „mega“ bestätigt)

Vorlage: `projects/heizung-video/thumbnail_real.mjs` (Thumbnails G/H/I). Zu jedem Video 3 solche Thumbnails, 1280x720:
- **Echtes Foto als Vollbild** (Wikimedia Commons, bevorzugt CC0/gemeinfrei; CC BY nur mit Nennung in der Beschreibung;
  CC BY-SA nicht beschneiden). Lizenz in `photos/credits.json` festhalten.
- **Riesige Schrift** Inter 800, weiß + eine Akzentfarbe (Gelb `#ffd400`, Rot `#e8201c`, Blau `#39a8ff`), dicke schwarze Kontur,
  max. 2–3 Wörter pro Zeile. Kurze Frage oder Neugier-Lücke: „OBEN KALT?“, „DIESES 1€-TEIL …“, „DAS HIER PRÜFEN!“.
- **Roter/gelber Kreis** um das entscheidende Detail im Foto, weißer Pfeil mit schwarzem Rand dorthin.
- **Pill-Badge** mit einer echten Zahl aus der Recherche (z. B. „BIS ZU −15 %“, „1,2–2 bar?“), keine erfundenen Werte.
- **Kanal-Person** (`assets/channel_person_cutout.png`) mit Schatten am Rand, dazu Vignette und Abdunklung hinter dem Text.
- Effekte passend zum Thema, z. B. Wärmebild-Look (Farbverlauf per `color`-Blend) oder Figur aus dem Video als Akzent.

## Amazon-Partnerlinks

- StoreID des Nutzers: `rechn24-21`. In jede `youtube.md` einen Block „🛒 Das brauchst du (Amazon)*“ mit passenden Produkten
  als Suchlinks `https://www.amazon.de/s?k=<Suchbegriff>&tag=rechn24-21`, plus Kennzeichnung
  „*Affiliate-Links: Als Amazon-Partner verdiene ich an qualifizierten Verkäufen. Für dich ändert sich der Preis nicht.“
- Zusätzlich eine Variante des angehefteten Kommentars mit dem wichtigsten Produktlink.
