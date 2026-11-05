# To-do für Philipp

Stand: 05.11.2026. Abhaken mit `[x]`. Ausführliche Anleitungen: `kaffee/EINRICHTUNG.md`.

## Jetzt (Einrichtung gartensaunadoktor.de, Anleitung: `sauna/EINRICHTUNG.md`)

- [x] **Domain bestellen:** `gartensaunadoktor.de` bei IONOS, Ordner `/gartensaunadoktor` verbunden, SFTP-Benutzer `su860681` (05.11.2026)
- [ ] **Cloudflare:** Domain hinzufügen, Nameserver umstellen, SSL Flexible (wie bei vollautomatendoktor.de)
- [ ] **GitHub-Secrets:** `SAUNA_SFTP_USER`, `SAUNA_SFTP_PASSWORD`, `SAUNA_SFTP_HOST` (erst dann lädt der Workflow hoch)
- [ ] **Awin:** Publisher-Konto anlegen, Programme GartenHaus (22747), Gartenhausfabrik (76696), Bast Sauna (119243), Artsauna (106021) beantragen,
      Deeplinks an Claude schicken (bis dahin stehen Platzhalter auf der Seite)
- [ ] **Marke prüfen:** „Gartensaunadoktor“ bei DPMA und TMview
- [ ] Danach: Search Console + Bing für gartensaunadoktor.de, Sitemap einreichen

## Jetzt (Einrichtung vollautomatendoktor.de)

- [x] **Google Search Console, vollautomatendoktor.de:** Property „Domain“ bestätigen (TXT-Eintrag bei Cloudflare ist schon da)
- [x] **Sitemap einreichen:** in der Search Console unter *Sitemaps* `sitemap-index.xml` → Senden
      (vollständig: https://vollautomatendoktor.de/sitemap-index.xml)
- [ ] **Indexierung beantragen** für: `/`, `/maschinen/`, `/maschine/delonghi-magnifica-s/`,
      `/artikel/delonghi-kaffeevollautomat-entkalken/`, `/artikel/kaffeevollautomat-entkalken/`
- [x] **Search Console für handwerksdoktor.de:** Property „Domain“, TXT-Eintrag bei **IONOS** (DNS), bestätigen,
      Sitemap `sitemap-index.xml` (https://handwerksdoktor.de/sitemap-index.xml)
- [x] **Bing Webmaster Tools:** beide Seiten importiert
- [x] **Bing:** links *Sitemaps* → für beide Seiten die Sitemap einreichen (Adressen siehe oben)
- [x] **Google:** prüfen, ob unter *Sitemaps* bei beiden Seiten „Erfolgreich“ steht
- [x] **Amazon PartnerNet:** `https://vollautomatendoktor.de` in die Website-Liste eintragen (Pflicht!)
- [x] Eigene Tracking-ID für die Kaffee-Seite: `vollautomat0e-21` (eingebaut am 04.10.2026)
- [ ] **Marke prüfen:** „Vollautomatendoktor“ bei https://register.dpma.de und https://www.tmdn.org/tmview
- [ ] **Blog-Sitzung informieren:** „Hol dir zuerst den neuesten Stand (git pull), die Kaffee-Artikel sind auf
      vollautomatendoktor.de umgezogen.“
- [ ] **Cloudflare-Vertrag (DPA) ablegen:** https://www.cloudflare.com/cloudflare-customer-dpa/ als PDF zu den Verträgen
- [ ] Falls die Seite an deinem Anschluss nicht lädt: über mobile Daten testen; morgen erneut (DNS-Umstellung)

## Danach (Inhalte und Einnahmen)

- [ ] **YouTube-Beschreibungen:** in jedes Kaffee-Video den Link zur Maschinenseite + Entkalker-Link
      (Textbausteine schreibt Claude auf Zuruf)
- [ ] **Nächste Kaffee-Videos nach Nachfrage** (`kaffee/maschinen-abdeckung.md`): Magnifica ESAM entkalken,
      Philips 1200/2200 entkalken, Magnifica Start entkalken, Melitta Solo & Perfect Milk entkalken, Philips 3200/5400 entkalken
- [ ] **Fotos der Maschinen:** Marken-Kacheln haben seit 04.10.2026 freie Fotos (Wikimedia/Flickr). Für **Melitta** und **Tchibo**
      gibt es keine freien Fotos (dort steht vorerst ein Kaffeefoto): eigenes Foto machen oder Pressestelle anfragen (Mail-Entwurf von Claude)
- [ ] **In 4–8 Wochen:** Search Console → *Leistung* ansehen und Claude die Suchanfragen schicken (beste Themenquelle)

## Ideen für weitere Seiten

Siehe `blog/seo/naechste-seiten.md` (Top 5 mit Daten).
