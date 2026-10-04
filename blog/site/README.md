# handwerksdoktor.de

Statische Seite mit [Astro](https://astro.build). Keine Cookies, kein Tracking, keine fremden Server:
Schriften, Bilder und Skripte kommen vom eigenen Webspace, YouTube lädt erst nach Klick.

## Befehle (in diesem Ordner)

```sh
npm install        # einmalig
npm run dev        # Vorschau unter http://localhost:4321
npm run build      # fertige Seite nach dist/
npm run check      # prüft dist/: keine Anfragen an fremde Server, nichts zu breit fürs Handy
npm run qualitaet  # html-validate (HTML-Fehler) und pa11y-ci (Barrierefreiheit, WCAG 2 AA) für alle Seiten
npm run lighthouse # Unlighthouse: Lighthouse-Werte jeder Seite, Bericht in .unlighthouse/
npm run rechtschreibung [-- artikel-name …]  # LanguageTool: Rechtschreibung und Grammatik der Artikel
```

Fachwörter und Marken, die die Rechtschreibprüfung nicht kennt, kommen in `scripts/woerterbuch.txt`
(eine Zeile pro Wort, `= …` für ganze Fehlalarm-Stellen). Kaputte Links prüft lychee automatisch auf GitHub.

Für `npm run lighthouse` muss die gebaute Seite lokal laufen: `python3 -m http.server 4399 -d dist`.
`qualitaet` startet seinen Server selbst. Beide nutzen das vorinstallierte Chromium (`CHROME_PATH` überschreibt den Pfad).
Seiten mit `noindex` (Impressum, Datenschutz, Werbung, Suche) bekommen bei Lighthouse-SEO absichtlich weniger Punkte.

## Neuer Artikel

1. Datei `src/content/artikel/<url-name>.mdx` anlegen, am besten den bestehenden Heizungsartikel kopieren.
   Der Dateiname wird die Adresse: `heizung-gluckert.mdx` → `handwerksdoktor.de/artikel/heizung-gluckert/`.
2. Oben im Kopf: `title` (max. 70 Zeichen, am besten die Suchfrage), `description` (max. 160 Zeichen),
   `pubDate`, `thema`, `bild` + `bildAlt` + `bildNachweis`, `affiliate: true`, wenn Amazon-Links drin sind.
3. Bausteine:
   - `<Antwort>` ganz oben: die Antwort in 2–3 Sätzen.
   - `<Schnellkauf items={[{ name, warum, suche }]}>` direkt nach der Antwort: „Das brauchst du“ mit Amazon-Buttons
     (höchste Klickrate, weil Leser hier schon wissen, dass sie das Werkzeug brauchen).
   - `<Warnung titel="...">` für Sicherheitshinweise.
   - `<ProduktBox titel suche kriterien>` für Produktempfehlungen (Amazon-Suchlink mit * und Hinweis).
   - `<AmazonLink suche="...">Text</AmazonLink>` für einen Link im Fließtext.
   - `<Bild>` für Fotos, **immer** mit Bildnachweis (Urheber, Titel, Quelle, Lizenz).
   - `<YouTube id="VIDEO-ID" titel="..." vorschau="/bilder/<thumbnail>.webp">` bettet ein Video erst nach Klick ein.
     Das Vorschaubild ist das eigene Thumbnail, als Datei in `public/bilder/`.
4. `entwurf: true` versteckt einen Artikel, bis er fertig ist.
5. Titelbild: `bild: /bilder/titel/<url-name>.webp` eintragen, optional `kurztitel` (kürzerer Text auf dem Bild) und
   `icon` (Name eines Lucide-Icons, siehe lucide.dev), dann `npm run titelbilder`. Rendert ein eigenes Bild im Kanal-Look
   mit Themenfarbe (eigenes Urheberrecht). Es erscheint oben im Artikel, auf den Karten und beim Teilen.
   Fotos im Text: `python3 tools/commons_bild.py suche "Begriff"` und `… laden "File:…" public/bilder/<name>.webp`
   (nur CC0/gemeinfrei/CC BY/CC BY-SA, der ausgegebene Bildnachweis kommt in `<Bild nachweis=…>`).
6. Pro Artikel mindestens 2 interne Links auf passende Artikel und 1 Link auf den Hauptartikel des Themas setzen.
   Inhaltsverzeichnis, „Das könnte dich auch interessieren“ und die Themenseite (`/thema/<thema>/`) entstehen automatisch.

Bilder: nur eigene oder frei lizenzierte (CC0, CC BY, CC BY-SA mit Nennung), als `.webp` mit max. 1200 px Breite
in `public/bilder/`. Nie Bilder von Amazon, Herstellern oder anderen Seiten.

## Startseite: Saison-Bereich

`src/saison.ts` legt fest, welche Artikel oben auf der Startseite stehen (Titel, Text, Artikel-IDs = Dateiname ohne `.mdx`).
Je nach Jahreszeit austauschen, zum Beispiel Heizung im Winter, Klima und Balkonkraftwerk im Sommer, Geschenke ab November.
Wird ein Artikel überarbeitet, `updatedDate: JJJJ-MM-TT` im Kopf setzen: Das Datum erscheint im Artikel und in der Sitemap.

## Pinterest (automatisch)

`npm run pins` erzeugt die Pin-Bilder im Hochformat (1000×1500) in `public/bilder/pins/`, GitHub macht das bei jedem Push
für fehlende Bilder selbst. Pro Artikel gibt es bis zu drei Designs, alle Texte stammen aus dem Artikel
(Logik und Zeitplan: `scripts/pin-varianten.mjs`):

| Datei | Design | Inhalt | im Feed ab |
|---|---|---|---|
| `<artikel>.jpg` | dunkel | Kurztitel und Beschreibung | Veröffentlichung |
| `<artikel>-2.jpg` | Themenfarbe | erste Frage aus „Häufige Fragen“ mit Antwort | +14 bis 27 Tage |
| `<artikel>-3.jpg` | hell | Schritte aus `<Ablauf>`, sonst `<Checkliste>`, sonst Zwischenüberschriften | +28 bis 41 Tage |
| `rechner-<name>.jpg` | dunkel | Rechner aus `src/rechner.ts` (Feld `thema` = Pinnwand) | erste Woche |

Artikel von vor dem 02.10.2026 zählen ab diesem Tag. Ändert sich eine FAQ oder ein Ablauf, das Bild löschen oder
`npm run pins -- --alle` ausführen. `PIN_STICHTAG=2026-12-01 npm run build` zeigt, wie die Feeds an einem Tag aussehen.

Die Feeds unter `/pinterest/` liefern die Pins an Pinterest (die Varianten mit eigener guid, Link immer zum Artikel):

- `https://handwerksdoktor.de/pinterest/heizung.xml`, `strom.xml`, `wasser.xml`, `raumklima.xml`, `haushalt.xml`,
  `sicherheit.xml`, `werkzeug.xml`: je ein Thema, verbunden mit der gleichnamigen Pinnwand (Haushalt → „Haushaltsgeräte“)
- `https://handwerksdoktor.de/pinterest/alle.xml`: alles (nicht zusätzlich verbinden, sonst kommen Pins doppelt)

Zeitversetzte Pins erscheinen nur, wenn die Website neu gebaut wird: bei jedem Push und jede Nacht (geplanter Lauf in
`.github/workflows/website-handwerksdoktor.yml`; GitHub führt geplante Läufe nur auf dem Standard-Branch des Repositorys aus).

Auf der Website selbst:
- **Artikel-Rich-Pins:** `article:published_time`, `article:modified_time`, `article:author`, `article:section` (Base.astro).
- **Hochformat beim Merken:** Das Titelbild trägt `data-pin-media` (Pin-Bild) und `data-pin-description`, Profilbilder
  `data-pin-nopin`.
- **„Auf Pinterest merken“** (`src/components/PinterestMerken.astro`) unter jedem Artikel und in der Teilen-Leiste der Rechner:
  ein einfacher Link ohne Pinterest-Skript, es wird nichts von Pinterest geladen (Datenschutzerklärung Nr. 8).

Einrichtung (erledigt): Website in Pinterest bestätigt (`pinterestVerify` in `src/site.ts`), Feeds unter Einstellungen →
„Inhalte importieren“ → „Automatisch veröffentlichen“ mit den Pinnwänden verbunden.

## YouTube-Videos in Artikeln (automatisch)

`npm run videos` (`scripts/videos.mjs`) holt die Videos des Kanals (yt-dlp, falls installiert, und den RSS-Feed des Kanals, kein
API-Schlüssel) und schreibt `src/videos.json`. Vorschaubilder landen auf dem eigenen Server (`public/bilder/videos/<id>.webp`),
YouTube lädt erst nach Klick (`src/components/YouTube.astro`, Datenschutzerklärung Nr. 7).

- Von Hand geprüfte Zuordnung: `src/videos-zuordnung.json` (Artikel → Video, Seiten wie `/thema/wasser/` → Video, `null` = nie ein Video).
- Neue Videos ordnet das Skript automatisch einem Artikel zu, wenn der Titel eindeutig passt (Stichwörter). GitHub führt das bei
  jedem Lauf aus, auch nachts. Neue Zuordnungen stehen in der Zusammenfassung des Laufs.
- Angezeigt wird das Video oben im Artikel („Lieber als Video?“, `VideoBox.astro`), mit VideoObject-Markup, wenn das Datum bekannt ist.

## Dübel-Finder

`/rechner/duebel/`: Wand (6 Arten) und Gewicht (4 Klassen) wählen, Empfehlung mit Größe, Bohrhinweis und Amazon-Suchlink.
Die Tabelle steht in `src/pages/rechner/duebel.astro` (Richtwerte nach Herstellerangaben, die Packung hat Vorrang).

## Checklisten zum Ausdrucken

Daten in `src/checklisten.mjs` (jeder Punkt stammt aus einem Artikel). `npm run checklisten` erzeugt daraus A4-PDFs mit QR-Code
zur Anleitung (`public/checklisten/<id>.pdf`, nur fehlende, `-- --alle` für alle). Seiten: `/checklisten/` und `/checklisten/<id>/`.
Artikel, die in `artikel` stehen, zeigen automatisch einen Hinweiskasten. Jede Checkliste hat einen Pin (`checkliste-<id>.jpg`)
im Feed ihres Themas. GitHub erzeugt fehlende PDFs beim Bauen selbst.

## Automatisch hochladen (GitHub Actions)

`.github/workflows/website-handwerksdoktor.yml` (im Hauptordner des Repos) läuft bei jedem Push, der `blog/site/` ändert:

1. **Prüfen:** `npm ci`, `npm run build`, `npm run check`, `npm run qualitaet`. Schlägt etwas fehl, wird nichts hochgeladen.
2. **Hochladen:** `dist/` per SFTP nach IONOS in den Hauptordner `/` (dort, wo `artikel/`, `bilder/` und `.htaccess` liegen). Es wird nur hinzugefügt und überschrieben, auf dem Server wird nichts gelöscht.
   Danach Live-Check der Startseite und IndexNow.

Einmalig einrichten (nur im Browser auf github.com, Passwörter nie in Chat oder Code):
Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Inhalt (aus IONOS → Hosting → SFTP & SSH) |
|---|---|
| `IONOS_SFTP_HOST` | Server, z. B. `access-123456.webspace-host.com` (ohne `sftp://`) |
| `IONOS_SFTP_USER` | Benutzername |
| `IONOS_SFTP_PASSWORD` | Passwort |

Liegt die Website in einem anderen Ordner, unter **Variables** `IONOS_SFTP_ZIEL` anlegen (z. B. `/mein-ordner`).
Ohne Secrets laufen nur die Prüfungen. Manuell starten: Reiter **Actions** → „Website prüfen und hochladen“ → **Run workflow**.
Gelöschte oder umbenannte Seiten bleiben auf dem Server liegen und müssen bei Bedarf per FileZilla entfernt werden.

## Hochladen zu IONOS (von Hand)

1. `npm run build && npm run check && npm run qualitaet`
2. Den **Inhalt** von `dist/` (nicht den Ordner selbst) per SFTP in den Webspace-Ordner **`/public`** laden
   (dorthin zeigt die Domain laut IONOS → Domains & SSL → handwerksdoktor.de → Ziel).
   Zugangsdaten: IONOS → Hosting → SFTP & SSH. Programm z. B. FileZilla (kostenlos).
   Die Datei `.htaccess` ist versteckt: in FileZilla unter „Server → Versteckte Dateien anzeigen“ einblenden,
   sie muss mit hochgeladen werden (https-Umleitung, Sicherheitsregeln).
3. In IONOS unter Domains prüfen, dass `handwerksdoktor.de` auf genau diesen Ordner zeigt und das
   SSL-Zertifikat aktiv ist.
4. `npm run indexnow` meldet alle URLs an Bing & Co. (erst nach dem Upload, die Schlüsseldatei muss online sein).
5. Kontaktformular einmal selbst ausprobieren. Die Mail kommt von `info@handwerksdoktor.de`
   (dieses Postfach muss in IONOS angelegt sein), beim ersten Mal auch im Spam-Ordner nachsehen.

## Wo was steht

| Datei | Zweck |
|---|---|
| `src/site.ts` | Name, E-Mail, YouTube-Link, **Amazon-Partner-Tag** (nach PartnerNet-Anmeldung eintragen) |
| `src/content/recht/` | Impressum, Datenschutz, Werbung (bei Änderungen der Seite anpassen!) |
| `public/kontakt.php` | Kontaktformular (PHP auf IONOS, kein externer Dienst) |
| `public/.htaccess` | https, Sicherheits-Header, Content-Security-Policy (blockiert fremde Server) |
| `scripts/check-external.mjs` | Datenschutz-Test mit Chromium |
