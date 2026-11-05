# gartensaunadoktor.de einrichten (einmalig, ca. 30 Minuten plus Awin-Anmeldungen)

Alles, was Geld kostet oder ein Passwort braucht, machst du. Danach lädt GitHub die Seite bei jedem Push selbst hoch.
Passwörter nie in den Chat oder in den Code, nur in GitHub-Secrets. Vorlage: `kaffee/EINRICHTUNG.md` (dort ausführlicher).

## 1. IONOS: Domain und Speicherplatz

1. **Domain bestellen:** IONOS → *Domains & SSL* → *Domain hinzufügen* → `gartensaunadoktor.de`
   (am 05.11.2026 laut DENIC frei; ebenfalls frei waren `gartensauna-doktor.de` und `sauna-doktor.de`, falls du sie zusätzlich sichern willst).
   In denselben Vertrag wie den Handwerksdoktor, dann liegt sie auf demselben Webspace.
2. **Ordner anlegen:** *Hosting* → *Webspace* → im **obersten** Verzeichnis einen neuen Ordner `gartensaunadoktor`
   (nicht in `/public` und nicht in `/vollautomatendoktor`).
3. **Domain auf den Ordner zeigen lassen:** *Domains & SSL* → `gartensaunadoktor.de` → *Ziel* / *Nutzungsart* → *Webspace* → Ordner `/gartensaunadoktor`.
4. **SSL:** nicht bei IONOS kaufen. https kommt kostenlos über Cloudflare (Schritt 1b, genau wie bei vollautomatendoktor.de).
5. **SFTP-Benutzer:** *Hosting* → *SFTP & SSH* → *Benutzer hinzufügen*, langes Passwort, Verzeichnis `/gartensaunadoktor`
   (bietet IONOS den Ordner nicht an, `/` wählen, der Upload wechselt dann selbst in `/gartensaunadoktor`).
6. **E-Mail:** nicht nötig. Die Seite nennt `info@handwerksdoktor.de` (gleicher Inhaber), ein Kontaktformular gibt es nicht.

## 1b. Cloudflare: kostenloses https

Genau wie bei vollautomatendoktor.de (`kaffee/EINRICHTUNG.md`, Abschnitt 1b): Domain in Cloudflare hinzufügen (Plan Free), A/AAAA-Einträge
`217.160.0.101` und `2001:8d8:100f:f000::200` für `@` und `www` mit orangener Wolke, Nameserver bei IONOS umstellen, dann in Cloudflare:
SSL/TLS **Flexible**, Always Use HTTPS an, Email Obfuscation aus, Rocket Loader aus, Web Analytics aus, Bot Fight Mode aus.

## 2. GitHub: Zugangsdaten hinterlegen

github.com → Repository `claude` → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

| Name | Wert |
|---|---|
| `SAUNA_SFTP_USER` | der Benutzername aus Schritt 1.5 |
| `SAUNA_SFTP_PASSWORD` | das Passwort aus Schritt 1.5 |

Den Servernamen musst du nicht eintragen (`IONOS_SFTP_HOST` ist schon da). Ohne diese zwei Secrets baut und prüft der Workflow
`website-sauna.yml` die Seite nur, lädt aber nichts hoch. Schutz eingebaut: Findet der Upload im Zielordner Dateien einer anderen Seite, bricht er ab.

## 3. Awin: Partnerprogramme beantragen (das ersetzt Amazon)

1. **Publisher-Konto:** https://www.awin.com/de → *Publisher werden* → Konto anlegen, `https://gartensaunadoktor.de` als Website eintragen
   (Awin verlangt eine einmalige Gebühr, die mit den ersten Provisionen verrechnet wird, Stand 2026 laut Awin 5 €; bitte beim Anmelden prüfen).
   Die Seite sollte dafür schon live sein, mit Impressum, Datenschutz und ein paar Beiträgen (deshalb Schritt 3 erst nach dem ersten Upload).
2. **Programme beantragen** (Namen und Provisionen laut Briefing, Stand 05.11.2026, bitte im Awin-Konto gegenprüfen):

   | Shop | Awin-Programm | Provision | Cookie |
   |---|---|---|---|
   | GartenHaus GmbH | 22747 | 5 % (Content-Partner 7 %) | 30 Tage |
   | Gartenhausfabrik | 76696 | 7 % | 30 Tage |
   | Bast Sauna | 119243 | 6 % | 30 Tage |
   | Artsauna | 106021 | bis 6 % | 30 Tage |

   Wichtig bei GartenHaus: keine Suchanzeigen auf den Markennamen; bei Gartenhausfabrik sind Anzeigen ganz verboten. Wir schalten keine.
3. **Links eintragen:** Sobald ein Programm freigeschaltet ist, im Awin-Konto den Deeplink zur Startseite des Shops erzeugen und mir schicken
   (das ist kein Geheimnis, nur ein Link). Ich trage ihn in `sauna/site/src/affiliate-links.ts` ein, dann verschwinden die Platzhalter.

## 4. Marke prüfen (5 Minuten)

- DPMA: https://register.dpma.de → *Marken* → *Einsteigerrecherche* → `Gartensaunadoktor` und `Gartensauna Doktor`
- EUIPO/TMview: https://www.tmdn.org/tmview → gleiche Suche

## 5. Sag mir Bescheid

Wenn Schritt 1, 1b und 2 erledigt sind, starte ich den ersten Upload und prüfe die Seite live. Danach Google Search Console und Bing
(Ablauf wie in `kaffee/EINRICHTUNG.md`, Abschnitt 6, TXT-Eintrag bei Cloudflare), Sitemap `https://gartensaunadoktor.de/sitemap-index.xml`.
