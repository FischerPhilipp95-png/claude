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

Für jeden Artikel erzeugt `npm run pins` ein Pin-Bild im Hochformat (`public/bilder/pins/<artikel>.jpg`, 1000×1500).
GitHub macht das bei jedem Push für neue Artikel selbst. Die Feeds unter `/pinterest/` liefern die Pins an Pinterest:

- `https://handwerksdoktor.de/pinterest/alle.xml`: alle Artikel
- `https://handwerksdoktor.de/pinterest/heizung.xml`, `strom.xml`, `wasser.xml`, `raumklima.xml`, `haushalt.xml`,
  `sicherheit.xml`, `werkzeug.xml`: je ein Thema, für eine eigene Pinnwand

Einmalig in Pinterest (Unternehmenskonto): Website beanspruchen (HTML-Tag, den Wert aus `content="…"` in `src/site.ts` bei
`pinterestVerify` eintragen), dann unter Einstellungen → „Pins in großer Menge erstellen“ → „RSS-Feed verbinden“ die Feeds
mit je einer Pinnwand verbinden. Pinterest holt neue Artikel danach selbst ab (innerhalb von 24 Stunden, bis 200 Pins pro Tag).

## Automatisch hochladen (GitHub Actions)

`.github/workflows/website.yml` (im Hauptordner des Repos) läuft bei jedem Push, der `blog/site/` ändert:

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
