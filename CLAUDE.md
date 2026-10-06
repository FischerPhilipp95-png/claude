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
- Thumbnails IMMER im Kanal-Stil (Vorlage des Nutzers, Beispiele in `projects/thumbnail-beispiele/`):
  `node tools/thumbnail.mjs projects/<projekt>/thumbnail.json` → 1920x1080 JPEG.
  Aufbau: dunkel getöntes Hintergrundfoto (Tönung passend zum Thema), links riesige Frage in Anton, Großbuchstaben,
  weiße Zeilen und die letzte Zeile gelb `#ffd400` (z. B. „BLEIBT / KALT?“, „TEUER? LAUT? NASS?“), rechts das Kanal-Porträt
  (`assets/channel_person_cutout.png`) mit weichem Rand, gelbes schräges Badge unten links („5 URSACHEN“, „TOP 5“),
  optional Label oben (schwarz, z. B. Modellname), Leuchtlinie, Kreis-Ausschnitt, Wert-Tag („14 °C“) oder Leuchtpunkte.
  Unten rechts frei lassen (dort steht bei YouTube die Videolänge).
- Hintergrundbilder: kostenlose Fotos von Pexels über die API des Nutzers (`"bild": {"pexels": "Suchbegriff"}`,
  Umgebungsvariable `PEXELS_API_KEY`, nie im Chat). Fotos ohne fremde Logos oder Markennamen wählen; Fotograf und Link
  speichert das Skript in `thumbnail/pexels.json`.

## Websites (Affiliate-Geschäft)

Alle Seiten stehen in `websites/websites.json` (Ordner, Domain, Secrets, Amazon-Tag, Live-Check).
Der Nutzer nennt im Chat das Stichwort, dann wird in diesem Ordner gearbeitet:

| Stichwort | Seite | Ordner |
|---|---|---|
| „Handwerksdoktor“ | handwerksdoktor.de | `blog/site/` |
| „Kaffee-Website“ | vollautomatendoktor.de | `kaffee/site/` |

Gleiches Muster für alle Seiten (auch künftige):
- Upload und Prüfungen kommen aus EINER Vorlage: `websites/workflow-vorlage.yml` → `python3 websites/erzeugen.py`
  → `.github/workflows/website-<key>.yml`. Workflows nie einzeln von Hand ändern, sondern die Vorlage, dann neu erzeugen.
- Prüfungen je Seite identisch: Build, `npm run check`, `npm run qualitaet` (html-validate, pa11y), interne Links (lychee),
  danach Upload per SFTP, Live-Check, IndexNow; Berichte: externe Links, Rechtschreibung (LanguageTool), npm audit.
- Gemeinsame Verbesserungen (Skripte in `scripts/`, Komponenten, Checks, SEO-Bausteine) auf ALLE Seiten übertragen,
  nicht nur auf die gerade bearbeitete. Seitenspezifisch bleiben nur Inhalte, `src/site.ts`, Themen und Farben.
- Arbeitsbranch: `claude/peaceful-fermat-5yqdfd`. Hochgeladen wird von `claude/serene-darwin-f9rggj` (Standard-Branch,
  nur dort laufen die nächtlichen Builds). Nach jeder fertigen, geprüften Änderung: pushen und
  `claude/serene-darwin-f9rggj` per Fast-Forward nachziehen (vom Nutzer erlaubt), dann die Läufe prüfen und die Seite live ansehen.
- Passwörter nie im Chat oder Code, nur als GitHub-Secrets. Jede Seite hat eine eigene Amazon-Tracking-ID.

Neue Seite anlegen:
1. Nische und Domain prüfen (`blog/seo/naechste-seiten.md`, DENIC RDAP), Stichwort mit dem Nutzer festlegen.
2. `kaffee/site/` als Gerüst nach `<nische>/site/` kopieren, Inhalte, `src/site.ts`, Themen, Farben, robots.txt, .htaccess anpassen.
3. Eintrag in `websites/websites.json`, `python3 websites/erzeugen.py`, Stichwort in die Tabelle oben.
4. Einrichtung für den Nutzer nach `kaffee/EINRICHTUNG.md` (IONOS-Ordner, SFTP-Benutzer, Cloudflare, Secrets, PartnerNet,
   Search Console, Bing) und die offenen Punkte in `TODO-philipp.md`.
