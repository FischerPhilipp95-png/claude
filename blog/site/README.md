# handwerksdoktor.de

Statische Seite mit [Astro](https://astro.build). Keine Cookies, kein Tracking, keine fremden Server:
Schriften, Bilder und Skripte kommen vom eigenen Webspace, YouTube lädt erst nach Klick.

## Befehle (in diesem Ordner)

```sh
npm install        # einmalig
npm run dev        # Vorschau unter http://localhost:4321
npm run build      # fertige Seite nach dist/
npm run check      # prüft dist/: keine Anfragen an fremde Server, nichts zu breit fürs Handy
```

## Neuer Artikel

1. Datei `src/content/artikel/<url-name>.mdx` anlegen, am besten den bestehenden Heizungsartikel kopieren.
   Der Dateiname wird die Adresse: `heizung-gluckert.mdx` → `handwerksdoktor.de/artikel/heizung-gluckert/`.
2. Oben im Kopf: `title` (max. 70 Zeichen, am besten die Suchfrage), `description` (max. 160 Zeichen),
   `pubDate`, `thema`, `bild` + `bildAlt` + `bildNachweis`, `affiliate: true`, wenn Amazon-Links drin sind.
3. Bausteine:
   - `<Antwort>` ganz oben: die Antwort in 2–3 Sätzen.
   - `<Warnung titel="...">` für Sicherheitshinweise.
   - `<ProduktBox titel suche kriterien>` für Produktempfehlungen (Amazon-Suchlink mit * und Hinweis).
   - `<AmazonLink suche="...">Text</AmazonLink>` für einen Link im Fließtext.
   - `<Bild>` für Fotos, **immer** mit Bildnachweis (Urheber, Titel, Quelle, Lizenz).
   - `<YouTube id="VIDEO-ID" titel="..." vorschau="/bilder/<thumbnail>.webp">` bettet ein Video erst nach Klick ein.
     Das Vorschaubild ist das eigene Thumbnail, als Datei in `public/bilder/`.
4. `entwurf: true` versteckt einen Artikel, bis er fertig ist.

Bilder: nur eigene oder frei lizenzierte (CC0, CC BY, CC BY-SA mit Nennung), als `.webp` mit max. 1200 px Breite
in `public/bilder/`. Nie Bilder von Amazon, Herstellern oder anderen Seiten.

## Hochladen zu IONOS

1. `npm run build && npm run check`
2. Den **Inhalt** von `dist/` (nicht den Ordner selbst) per SFTP in den Webspace-Ordner der Domain laden.
   Zugangsdaten: IONOS → Hosting → SFTP & SSH. Programm z. B. FileZilla (kostenlos).
   Die Datei `.htaccess` ist versteckt: in FileZilla unter „Server → Versteckte Dateien anzeigen“ einblenden,
   sie muss mit hochgeladen werden (https-Umleitung, Sicherheitsregeln).
3. In IONOS unter Domains prüfen, dass `handwerksdoktor.de` auf genau diesen Ordner zeigt und das
   SSL-Zertifikat aktiv ist.
4. Kontaktformular einmal selbst ausprobieren. Die Mail kommt von `info@handwerksdoktor.de`
   (dieses Postfach muss in IONOS angelegt sein), beim ersten Mal auch im Spam-Ordner nachsehen.

## Wo was steht

| Datei | Zweck |
|---|---|
| `src/site.ts` | Name, E-Mail, YouTube-Link, **Amazon-Partner-Tag** (nach PartnerNet-Anmeldung eintragen) |
| `src/content/recht/` | Impressum, Datenschutz, Werbung (bei Änderungen der Seite anpassen!) |
| `public/kontakt.php` | Kontaktformular (PHP auf IONOS, kein externer Dienst) |
| `public/.htaccess` | https, Sicherheits-Header, Content-Security-Policy (blockiert fremde Server) |
| `scripts/check-external.mjs` | Datenschutz-Test mit Chromium |
