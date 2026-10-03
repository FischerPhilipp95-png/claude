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

`scripts/setup.sh` installiert ffmpeg, numpy, librosa, Pillow, yt-dlp, mido und FluidSynth mit der Soundfont FluidR3_GM
(MIT-Lizenz) und läuft automatisch beim Sitzungsstart.

Musik: Standard ist jetzt echte Instrumente per Soundfont (Vorlage `projects/havanola-promo/music.py`: MIDI komponieren,
Stems mit FluidSynth rendern, eigene Kick/Sub/Riser dazu, Sidechain, Hall, Mastering). Der Nutzer fand reine Sinus-Synthese zu schwach.
Für orchestral/episch: Soundfont MuseScore General (`/usr/share/sounds/sf2/MuseScore_General_Full.sf2`, Sektionen wie Violins Fast,
Celli Trem usw.), Vorlage `projects/wika-radar/music.py`. Für „hochwertig“: Bewegungsunschärfe, Filmkorn, Spiegelungen,
echte Perspektive, Beschriftungen aus Datenblättern (Vorlage `projects/wika-radar/render.mjs`).
Websites (Kundenseiten, x.com, YouTube) sind nur erreichbar, wenn ihre Domain in den Netzwerk-Einstellungen
der Cloud-Umgebung freigegeben ist. Ein 403 beim Download bedeutet: Domain nicht freigegeben.

## Themenwahl und Kanal-Strategie (vor jedem neuen YouTube-Video)

Strategie und Daten: `docs/kanal_strategie.md`. Kurz: Ein kleiner Kanal wächst über die **Suche**. Konkrete Probleme
(„Heizkörper wird nicht warm“, „DeLonghi Magnifica Evo entkalken“) laufen etwa 20-mal besser als allgemeine Erklär- oder Neugier-Themen.
Zwei Säulen: Kaffeevollautomaten (ganzjährig) sowie Heizung & Klima (nach Saison: Heizung Okt.–Jan., Klima Mai–Aug.).

1. `python3 tools/themen_radar.py "<stichwort>" … --out docs/radar/<name>`
   - Holt YouTube-Suchvorschläge und die Nachfrage (Aufrufe der Top-Videos).
   - Sammelt Fragen aus den Kommentaren.
   - Bestimmt die Saison per Google Trends (trendspyg; bei „RateLimitError“ später erneut, `--no-trends` überspringt).
2. Thema mit hoher Nachfrage, passender Saison und einer offenen Zuschauerfrage wählen. Titel = Suchbegriff vorn.
3. `python3 tools/kanal_check.py --out docs/radar/kanal` zeigt, welche eigenen Videos laufen (auch für Konkurrenz-Kanäle: `@name`).

## Standards für neue Videos

- Voiceover: Piper-Stimme `de_DE-thorsten-high` (`tools/tts.py --engine piper`). Der Nutzer ist damit zufrieden.
  Fish Audio nur auf ausdrücklichen Wunsch (API-Guthaben ist getrennt vom App-Guthaben und steht auf 0).
- Kanal: „Der Handwerksdoktor“ (@derhandwerksdoktor), Profilbild in `assets/channel_avatar.jpg`.
- Shorts: 1080x1920, 60 fps, ca. 20 s, Labels über y = 1440 (Shorts-Oberfläche verdeckt unten).
- Zu jedem Video gehört eine `youtube.md` mit Titel, Beschreibung (inkl. Quelle), Tags und angeheftetem Kommentar.
- Vorlage für neue Projekte: `projects/klima-short/` (build.sh, render.mjs, music.py).

## Thumbnails (Standard: Profi-Look J/K/L, vom Nutzer so festgelegt)

Vorlage: `projects/klima-probleme/thumbnail_pro.mjs` (Thumbnails J/K/L). Zu jedem Video 3 Thumbnails, 1280x720.
Der ältere Stil G/H/I (`projects/heizung-video/thumbnail_real.mjs`, dicke schwarze Konturen, Kreise und Pfeile) war dem Nutzer
zu unprofessionell und wird nicht mehr verwendet.

Aufbau, Ebenen von hinten nach vorn:
1. **Hintergrund:** echtes Foto zum Thema, stark unscharf (`blur` 14–20 px) und abgedunkelt. Farbgrading in einer Themenfarbe
   per `color`-Blend (z. B. Blau = Nacht/Lärm, Orange = Hitze, Grün = Geld), dazu ein weiches Licht (`screen`).
2. **Hauptmotiv:** ein Gegenstand, mit rembg freigestellt (`isnet-general-use`, Modelle in `.rembg/`), scharf, groß, leicht gedreht.
   Dazu Bodenschatten (flache radiale Ellipse) und ein farbiger Glow in der Themenfarbe dahinter.
   Optional ein grafischer Effekt zum Thema (z. B. leuchtende Schallwellen).
3. **Vignette**, und zwar vor Person und Schrift, damit die Schrift reinweiß bleibt.
4. **Kanal-Person** (`assets/channel_person_cutout.png`) rechts, groß und unten angeschnitten, als **Sticker**:
   - weiße Kontur ca. 9 px
   - weicher Schlagschatten
   - farbige Lichtkante in der Themenfarbe
5. **Schrift:** Inter 800, max. 2 Wörter pro Zeile, ca. 140–150 px. Weiß plus ein Akzentwort mit Farbverlauf
   (Gelb `#ffd400`, Blau `#39a8ff`, Rot `#e8201c`, Limette `#CFF72A`).
   Tiefe durch dunkle Extrusion und weichen Schatten, **keine** dicke schwarze Kontur.
   Kurze Frage oder Neugier-Lücke: „ZU LAUT?“, „KÜHLT NICHT?“, „10.000 €“ durchgestrichen.
6. **Ein Glas-Badge:** dunkel, halbtransparent, mit farbigem Akzentstrich, kleinem Label in Versalien und einer **echten Zahl**
   aus der Recherche (z. B. „NACHTS ERLAUBT · nur 40 dB(A)“). Keine erfundenen Werte.
7. **Leichtes Filmkorn** zum Schluss.

Regeln:
- Wenige Elemente: ein Motiv, eine Schrift, ein Badge, die Person. Keine Kreise und Pfeile.
- Fotos von Wikimedia Commons (bevorzugt CC0/gemeinfrei; CC BY nur mit Nennung in der Beschreibung; CC BY-SA nicht beschneiden),
  Lizenz in `photos/credits.json`.
- Eigene Fotos des Nutzers mit Ausdruck (genervt, schwitzend …) wirken noch stärker, wenn vorhanden.

## Amazon-Partnerlinks

- StoreID des Nutzers: `rechn24-21`. In jede `youtube.md` einen Block „🛒 Das brauchst du (Amazon)*“ mit passenden Produkten
  als Suchlinks `https://www.amazon.de/s?k=<Suchbegriff>&tag=rechn24-21`, plus Kennzeichnung
  „*Affiliate-Links: Als Amazon-Partner verdiene ich an qualifizierten Verkäufen. Für dich ändert sich der Preis nicht.“
- Zusätzlich eine Variante des angehefteten Kommentars mit dem wichtigsten Produktlink.
