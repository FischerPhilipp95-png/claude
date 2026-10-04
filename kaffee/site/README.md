# vollautomatendoktor.de

Zweite Seite neben handwerksdoktor.de: Hilfe für Kaffeevollautomaten (entkalken, reinigen, Filter, Fehler), sortiert nach Marke.
Technisch eine Kopie des Handwerksdoktor-Blogs (`blog/site`): Astro, keine Cookies, kein Tracking, keine fremden Server.
Bausteine, Titelbilder, Pins, Rechtschreibprüfung und alle Befehle funktionieren genauso, siehe `blog/site/README.md`.

## Befehle (in diesem Ordner)

```sh
npm install        # einmalig
npm run dev        # Vorschau unter http://localhost:4321
npm run build      # fertige Seite nach dist/
npm run check      # keine Anfragen an fremde Server, nichts zu breit fürs Handy
npm run qualitaet  # HTML und Barrierefreiheit
npm run titelbilder && npm run pins   # Titel- und Pinterest-Bilder für neue Artikel
npm run videos     # neue Videos vom Kanal holen, Vorschaubilder für Artikel und Mediathek laden
```

## Was anders ist als beim Handwerksdoktor

| Datei | Inhalt |
|---|---|
| `src/site.ts` | Name, Domain, E-Mail, Amazon-Tag (eigene Tracking-ID im PartnerNet anlegen und hier eintragen) |
| `src/themen.ts` | Themen = Marken (De’Longhi, Philips & Saeco, Siemens & Bosch, Jura) plus „Pflege & Entkalken“. Neue Marke hier und in `src/content.config.ts` ergänzen |
| `src/mediathek.json` | Video-Anleitungen vom Kanal je Marke, erscheinen auf `/videos/` und den Markenseiten |
| `src/produkte.ts` | Entkalker, Filter, Reinigungstabletten mit ASIN |
| `src/saison.ts` | „Am häufigsten gesucht“ auf der Startseite. Ab Mitte November: Einrichten und erste Pflege nach oben |
| Kontakt | kein Formular (Seite läuft über Cloudflare), nur E-Mail an `info@handwerksdoktor.de` |
| `veraltet.txt` | Dateien, die der Upload auf dem Server löscht (er löscht sonst nie etwas) |

Keine Rechner und keine Checklisten (die Technik dafür ist noch da, die Listen sind leer).

## Neue Anleitung für ein Modell

1. `src/content/artikel/<marke>-<modell>-<problem>.mdx`, Kopf wie in den vorhandenen Artikeln, `thema:` = Marke.
2. Schritte, Programme und Mittel **nur aus der Bedienungsanleitung oder von der Herstellerseite**, als Quelle am Ende nennen.
   Nichts aus der Fantasie, keine Herstellerbilder.
3. Passendes Video in `src/videos-zuordnung.json` eintragen, Produkte in `src/produkte.ts`.
4. `npm run titelbilder && npm run pins && npm run build && npm run check`.

## Automatisch hochladen

`.github/workflows/website-kaffee.yml` (erzeugt aus `websites/workflow-vorlage.yml`) läuft bei jedem Push, der `kaffee/site/` ändert: bauen, prüfen, per SFTP zu IONOS.
Secrets (Repository → Settings → Secrets and variables → Actions):

| Name | Inhalt |
|---|---|
| `KAFFEE_SFTP_USER` | eigener SFTP-Benutzer, dessen Startordner der Webspace-Ordner von vollautomatendoktor.de ist |
| `KAFFEE_SFTP_PASSWORD` | sein Passwort |
| `KAFFEE_SFTP_HOST` | optional; ohne diesen Eintrag wird `IONOS_SFTP_HOST` verwendet (gleicher Webspace) |

Variable `KAFFEE_SFTP_ZIEL` nur, wenn der Benutzer nicht direkt im Ordner der Seite landet. Liegt im Zielordner die
`robots.txt` von handwerksdoktor.de, bricht der Upload ab, damit der Handwerksdoktor nie überschrieben wird.

## Umzug vom Handwerksdoktor (03.10.2026)

Die fünf Kaffee-Artikel lagen vorher auf handwerksdoktor.de. Die `.htaccess` dort leitet die alten Adressen (und Titel- und Pin-Bilder)
mit 301 hierher um. Diese Umleitung erst live schalten, wenn vollautomatendoktor.de erreichbar ist.

## Maschinen: Hersteller → Maschine → Beiträge

- `src/maschinen.ts`: alle Maschinen mit Hersteller, Namen, Suchwörtern (Modellnummern) und passenden Videos.
- Im Artikelkopf `maschinen: [delonghi-magnifica-s]` setzen, wenn ein Beitrag nur für bestimmte Maschinen gilt. Ohne Eintrag gilt er für
  alle Maschinen der Marke (bzw. für alle, wenn `thema: Pflege`). Unbekannte Schlüssel brechen den Build ab.
- Seiten: `/maschinen/` (Finder mit Hersteller-Filter und Modellsuche), `/maschine/<schluessel>/` (nur wenn es einen Beitrag oder ein Video gibt),
  Markenseiten `/thema/<marke>/` zeigen zuerst die Maschinen.

## Jeder Beitrag wird geprüft

1. Recherche: `python3 tools/recherche.py <slug> --youtube "…" --reddit "…" --muss "regex"` → `kaffee/recherche/<slug>/quellen.md`
   (Rohtexte in `roh/` bleiben lokal, fremde Inhalte werden nie veröffentlicht).
2. Herstelleranleitung (PDF von dls.delonghigroup.com, philips.de/support usw.) ist **maßgeblich**. Videos und Reddit zeigen, was Leute
   falsch machen und welche Fragen offen bleiben.
3. Abgleich als Tabelle in `kaffee/recherche/<slug>/pruefbericht.md` (Aussage, Hersteller, Videos, Ergebnis).
4. Im Artikelkopf `pruefung:` ausfüllen (Datum, maßgebliche Quelle, Zahl der Videos und Threads, Korrekturen). Das erscheint als Kasten
   „Geprüft am …“ im Beitrag.
