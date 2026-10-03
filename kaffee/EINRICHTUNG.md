# vollautomatendoktor.de einrichten (einmalig, ca. 20 Minuten)

Alles, was Geld kostet oder ein Passwort braucht, machst du. Danach lädt GitHub die Seite bei jedem Push selbst hoch.
Passwörter nie in den Chat oder in den Code, nur in GitHub-Secrets.

## 1. IONOS: Domain und Speicherplatz

1. **Domain bestellen:** IONOS → *Domains & SSL* → *Domain hinzufügen* → `vollautomatendoktor.de`
   (am 03.10.2026 laut DENIC frei). In denselben Vertrag wie den Handwerksdoktor, dann liegt sie auf demselben Webspace.
2. **Ordner anlegen:** *Hosting* → *Webspace* → im **obersten** Verzeichnis einen neuen Ordner `vollautomatendoktor`.
   Wichtig: **nicht** im Ordner von handwerksdoktor.de (`/public`), sonst wäre die Kaffee-Seite auch unter handwerksdoktor.de/… erreichbar.
3. **Domain auf den Ordner zeigen lassen:** *Domains & SSL* → `vollautomatendoktor.de` → *Ziel* / *Nutzungsart* → *Webspace* →
   Ordner `/vollautomatendoktor`.
4. **SSL:** nicht bei IONOS kaufen (kostet 48 €/Jahr). https kommt kostenlos über Cloudflare, siehe Abschnitt 1b.
5. **SFTP-Benutzer:** *Hosting* → *SFTP & SSH* → *Benutzer hinzufügen*, langes Passwort vergeben. Als Verzeichnis `/vollautomatendoktor`
   wählen. Bietet IONOS den Ordner nicht an (er entsteht erst beim ersten Upload), einfach `/` wählen: Der Upload erkennt das und
   lädt dann selbst in `/vollautomatendoktor`. Benutzername und Passwort brauchst du gleich für GitHub.
6. **E-Mail:** nicht nötig. Die Seite nennt `info@handwerksdoktor.de` (gleicher Inhaber), ein Kontaktformular gibt es nicht.

## 1b. Cloudflare: kostenloses https (ca. 20 Minuten)

Cloudflare stellt die verschlüsselte Verbindung her und holt die Seiten bei IONOS ab. Kein Cookie, keine Analyse.

1. **Konto:** https://dash.cloudflare.com/sign-up → mit E-Mail und Passwort registrieren, E-Mail bestätigen.
   Danach in den Konto-Einstellungen die **Zwei-Faktor-Anmeldung** einschalten.
2. **Domain hinzufügen:** *Add a domain* (Domain hinzufügen) → `vollautomatendoktor.de` → *Quick scan for DNS records* →
   Plan **Free** (0 $) wählen.
3. **DNS-Einträge prüfen:** Cloudflare liest die Einträge von IONOS ein. Es müssen mindestens diese da sein, mit
   **orangener Wolke** (Proxied):

   | Typ | Name | Inhalt |
   |---|---|---|
   | A | `vollautomatendoktor.de` (bzw. `@`) | `217.160.0.101` |
   | AAAA | `vollautomatendoktor.de` (bzw. `@`) | `2001:8d8:100f:f000::200` |
   | A | `www` | `217.160.0.101` |
   | AAAA | `www` | `2001:8d8:100f:f000::200` |

   Fehlt einer, mit *Add record* anlegen. MX-Einträge dürfen bleiben (grauer Wolke), sie stören nicht.
4. **Nameserver ablesen:** Cloudflare zeigt zwei Nameserver an, z. B. `xxx.ns.cloudflare.com` und `yyy.ns.cloudflare.com`.
5. **Bei IONOS umstellen:** *Domains & SSL* → `vollautomatendoktor.de` → Reiter **Nameserver** → *Eigene Nameserver verwenden*
   (bzw. „Andere Nameserver“) → die zwei von Cloudflare eintragen, die übrigen Felder leeren → speichern.
   Nur bei vollautomatendoktor.de! handwerksdoktor.de bleibt unverändert.
6. **Warten:** Cloudflare schickt eine E-Mail, sobald die Domain aktiv ist (meist 10 Minuten bis 2 Stunden, selten bis 24 Stunden).
7. **Einstellungen in Cloudflare** (Domain auswählen):
   - *SSL/TLS* → *Overview* → Modus **Flexible**. (Wichtig: nicht „Full“, IONOS hat für diese Domain kein Zertifikat.)
   - *SSL/TLS* → *Edge Certificates* → **Always Use HTTPS: an**.
   - *Scrape Shield* → **Email Address Obfuscation: aus** (sonst baut Cloudflare ein Skript in die Seiten ein).
   - *Speed* → *Optimization* → **Rocket Loader: aus**.
   - *Analytics & Logs* → *Web Analytics*: **nicht** einschalten (bzw. ausschalten, falls aktiv, auch „RUM“).
   - *Security* → *Bots* → **Bot Fight Mode: aus** (zeigt Besuchern sonst manchmal eine Prüfseite).
8. **Auftragsverarbeitung:** Der Vertrag (Data Processing Addendum) gilt für alle Cloudflare-Kunden automatisch.
   Unter https://www.cloudflare.com/cloudflare-customer-dpa/ die PDF herunterladen und zu den IONOS- und Postflex-Verträgen legen.

## 2. GitHub: Zugangsdaten hinterlegen

github.com → Repository `claude` → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

| Name | Wert |
|---|---|
| `KAFFEE_SFTP_USER` | der Benutzername aus Schritt 1.5 |
| `KAFFEE_SFTP_PASSWORD` | das Passwort aus Schritt 1.5 |

Den Servernamen musst du nicht eintragen: Es ist derselbe Webspace wie beim Handwerksdoktor (`IONOS_SFTP_HOST` ist schon da).

Schutz eingebaut: Findet der Upload im Zielordner die Dateien von handwerksdoktor.de, bricht er ab und lädt nichts hoch.

## 3. Amazon PartnerNet

1. *Konto* → *Website- und Mobile-App-Liste bearbeiten* → `https://vollautomatendoktor.de` hinzufügen.
   **Pflicht**, sonst darf der Partner-Tag auf der neuen Seite nicht verwendet werden.
2. Empfohlen: *Tracking-IDs verwalten* → neue ID anlegen, z. B. `vollautomat-21`, und mir schreiben.
   Dann sind die Verkäufe beider Seiten getrennt auswertbar. Bis dahin läuft die Seite mit `rechn24-21`.

## 4. Marke prüfen (5 Minuten)

Im Netz habe ich keinen Treffer für „Vollautomatendoktor“ gefunden. Die Registerprüfung kann ich von hier aus nicht machen:
- DPMA: https://register.dpma.de → *Marken* → *Einsteigerrecherche* → `Vollautomatendoktor` und `Vollautomaten Doktor`
- EUIPO/TMview: https://www.tmdn.org/tmview → gleiche Suche

## 5. Sag mir Bescheid

Wenn Schritt 1 und 2 erledigt sind, starte ich den Upload, prüfe die Seite live und schalte danach auf handwerksdoktor.de
die Umleitungen der fünf Kaffee-Artikel scharf. Erst dann, damit keine Umleitung ins Leere zeigt.
Danach: Search Console und Bing Webmaster Tools für die neue Domain, Sitemap `https://vollautomatendoktor.de/sitemap-index.xml`.

## 6. Google und Bing: Seite anmelden (ca. 15 Minuten)

### Google Search Console (für vollautomatendoktor.de)

1. https://search.google.com/search-console öffnen, mit deinem Google-Konto anmelden.
2. Oben links *Property hinzufügen* → linke Seite **„Domain“** → `vollautomatendoktor.de` eingeben → *Weiter*.
3. Google zeigt einen **TXT-Eintrag** an, der mit `google-site-verification=` beginnt → *Kopieren*.
4. **In Cloudflare** (nicht bei IONOS, die Domain läuft jetzt über Cloudflare): vollautomatendoktor.de → *DNS* → *Records* →
   *Add record* → Typ **TXT**, Name **`@`**, Inhalt = den kopierten Text → *Save*.
5. Zurück in der Search Console auf **Bestätigen** klicken. Klappt es nicht sofort, nach 10 Minuten noch einmal.
6. Links *Sitemaps* → bei „Neue Sitemap hinzufügen“ **`sitemap-index.xml`** eintragen → *Senden*.
7. Oben in die Suchleiste („URL prüfen“) nacheinander diese Adressen eingeben und jeweils **„Indexierung beantragen“**:
   - `https://vollautomatendoktor.de/`
   - `https://vollautomatendoktor.de/maschinen/`
   - `https://vollautomatendoktor.de/maschine/delonghi-magnifica-s/`
   - `https://vollautomatendoktor.de/artikel/delonghi-kaffeevollautomat-entkalken/`
   - `https://vollautomatendoktor.de/artikel/kaffeevollautomat-entkalken/`

   (Pro Tag gehen nur etwa 10 Anträge. Der Rest kommt über die Sitemap von selbst.)

Gleich mitmachen: **handwerksdoktor.de** hat noch keine Search Console. Gleiche Schritte, nur liegt der DNS dort weiter
bei **IONOS**: *Domains & SSL* → handwerksdoktor.de → *DNS* → *Record hinzufügen* → TXT, Hostname `@`, Wert = Google-Text.

### Bing Webmaster Tools (auch für DuckDuckGo, Ecosia, Copilot)

1. https://www.bing.com/webmasters öffnen, mit Google- oder Microsoft-Konto anmelden.
2. **„Import from Google Search Console“** wählen und zustimmen. Bing übernimmt beide Seiten samt Sitemaps,
   eine eigene Bestätigung ist dann nicht nötig. (Das geht erst, wenn Schritt 5 oben geklappt hat.)
3. Fertig. Neue Seiten meldet der Upload ab jetzt selbst per IndexNow an Bing.

### Was danach passiert

- Erste Seiten tauchen meist nach wenigen Tagen bis zwei Wochen bei Google auf, Bing ist oft schneller.
- Nach 4 bis 8 Wochen zeigt die Search Console unter *Leistung*, bei welchen Suchanfragen die Seite schon erscheint.
  Das ist die beste Liste für die nächsten Anleitungen.
- Maschinenseiten ohne eigenes Video oder eigene Anleitung stehen absichtlich auf „noindex“. In der Search Console erscheinen sie
  unter „Ausgeschlossen durch noindex“. Das ist so gewollt und kein Fehler.
