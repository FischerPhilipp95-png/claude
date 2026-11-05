# Projekt-Briefing: Affiliate-Ratgeberseite „Gartensauna & Fasssauna“

> **An Claude Code:** Dies ist das vollständige Briefing für ein neues Website-Projekt. Lies es komplett, bevor du anfängst. Die Datei `sauna-keywords.csv` (1.260 Suchbegriffe, Google Keyword Planner, Export 05.11.2026) gehört dazu. Erfinde keine Fakten, Preise, Testergebnisse oder Erfahrungen. Wenn etwas fehlt, frag nach oder markiere es als offen.

Stand: 05.11.2026 · Sprache der Website: Deutsch · Zielmarkt: Deutschland

---

## 1. Ziel

Eine unabhängige Ratgeber-Website rund um **Gartensauna, Außensauna und Fasssauna**. Sie verdient Geld über **Affiliate-Links** (Provision pro Verkauf) zu Sauna-Shops. Die Besucher kommen über **Google (SEO)**, nicht über bezahlte Werbung.

**Warum diese Nische** (Ergebnis unserer Recherche, siehe Abschnitt 9):
- Sehr hohe Nachfrage: „gartensauna“ 100.000–1 Mio. Suchen/Monat, „fasssauna“ 10.000–100.000, 207 Suchbegriffe mit ≥100 Suchen/Monat.
- Hohe Provision: 5–7 % auf Saunen für ca. 2.000–11.000 €, also etwa **280 € pro Verkauf** (Annahme: 4.000 € Warenkorb × 7 %).
- Schwache Konkurrenz bei Ratgeber-Fragen: Bei Google stehen Shops, Foren, Reddit und schwache Seiten (DR 0,7–24). Einen unabhängigen Ratgeber gibt es auf Seite 1 kaum.

---

## 2. Technik und Veröffentlichung

- Statische Website (z. B. Astro) im verbundenen GitHub-Repository, automatisches Deployment über den eingerichteten Hoster.
- **Ablauf pro Artikel:** Artikel schreiben → als eigener Branch/Pull Request hochladen → der Nutzer gibt frei → live. Nicht ungeprüft direkt veröffentlichen, außer der Nutzer sagt es ausdrücklich.
- Anforderungen:
  - Schnell (Core Web Vitals), mobil zuerst, kein unnötiges JavaScript.
  - Saubere URLs (`/fasssauna/mit-vorraum/`), Breadcrumbs, automatische `sitemap.xml`, `robots.txt`, Canonical-Tags.
  - Pro Seite: eigener Title (≤ 60 Zeichen), Meta-Description (≤ 155 Zeichen), eine H1.
  - Strukturierte Daten: `Article`, `BreadcrumbList`, `FAQPage` wo FAQ vorhanden.
  - Inhaltsverzeichnis bei langen Artikeln, Datum „zuletzt aktualisiert“ sichtbar.
  - Autorenbox und „Über uns“-Seite (Inhalt vom Nutzer, nichts erfinden).
  - Affiliate-Links: `rel="sponsored nofollow"`, in einer zentralen Datei gepflegt (z. B. `src/data/affiliate-links.ts`), damit sie an einer Stelle ausgetauscht werden können. Bis die Partnerprogramme freigeschaltet sind: Platzhalter `#AFFILIATE-<shop>-<produkt>`.
  - Kein Cookie-Tracking ohne Einwilligung. Analyse wenn überhaupt datenschutzfreundlich (z. B. ohne Cookies).
- Platzhalter, die der Nutzer füllt: `[DOMAIN]`, `[SEITENNAME]`, `[IMPRESSUM-DATEN]`, `[AUTOR]`.

---

## 3. Rechtliches (Deutschland) – Pflicht vor dem Livegang

- **Impressum** und **Datenschutzerklärung** (Inhalte vom Nutzer; keine Fantasiedaten).
- **Kennzeichnung der Affiliate-Links:** Hinweis oben in jedem Artikel mit Affiliate-Links (z. B. „Dieser Artikel enthält Affiliate-Links. Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht.“) und Markierung der Links (z. B. „*“ oder „Anzeige“).
- **Keine erfundenen Tests oder Erfahrungen.** Wir testen Saunen nicht selbst. Erfahrungen von Besitzern (Reddit, Foren, YouTube) werden offen als Auswertung mit Quellenangabe dargestellt, in eigenen Worten zusammengefasst, nie wörtlich kopiert.
- **Baugenehmigung:** nur allgemeine Information mit Quelle (Landesbauordnung) und Stand-Datum, Hinweis „keine Rechtsberatung, beim zuständigen Bauamt nachfragen“.
- Keine Bilder, Texte oder Logos von Shops ohne Erlaubnis übernehmen (u. a. in den GartenHaus-Bedingungen ausdrücklich verboten).

---

## 4. Seitenstruktur

```
Startseite
├── Gartensauna kaufen (Hauptseite = Artikel 20)
│   ├── 9  Gartensauna mit Vorraum
│   ├── 11 Gartensauna mit Holzofen
│   ├── 12 Kleine Gartensauna
│   ├── 13 Gartensauna mit Dusche
│   ├── 14 Sauna mit Whirlpool / Badefass
│   ├── 16 Günstige Gartensauna (Lidl, Netto, Fachhandel)
│   └── 19 Anbieter im Vergleich
├── Fasssauna (Hauptseite = Artikel 17)
│   ├── 18 Fasssauna-Vergleich
│   ├── 10 Fasssauna mit Vorraum
│   ├── 15 Mobile Fasssauna auf Anhänger
│   ├── 8  Thermoholz oder Fichte
│   ├── 4  Erfahrungen und Nachteile
│   └── 7  Fasssauna mieten
├── Planung & Recht (Linkmagnet: Baugenehmigungs-Tabelle)
│   ├── 1  Baugenehmigung nach Bundesland
│   ├── 2  Sauna mit Holzofen im Garten erlaubt?
│   └── 6  Gartensauna selber bauen
└── Kosten & Technik (Linkmagnet: Stromkosten-Rechner)
    ├── Stromkosten-Rechner
    ├── 3  Fasssauna Kosten
    └── 5  Holzofen oder Elektroofen
```

**Interne Verlinkung:** Jede Unterseite verlinkt auf ihre Hauptseite und auf 2–3 passende Geschwister. Ratgeber-Seiten (Planung, Kosten) verlinken auf die passenden Kaufseiten. Die Hauptseiten verlinken auf alle Unterseiten.

---

## 5. Die ersten 20 Artikel (Reihenfolge = Priorität)

Suchen = Spannen aus dem Google Keyword Planner. Klickpreis = obere Gebotsspanne für den Seitenanfang; hoher Klickpreis = viel Geld im Begriff. Weitere Varianten je Artikel stehen in `sauna-keywords.csv`.

### Phase 1 – Ratgeber (Monat 1–2, leicht zu ranken)

| # | Artikel (Arbeitstitel) | Hauptbegriff | Suchen/Monat | Klickpreis max. |
|---|---|---|---|---|
| 1 | Baugenehmigung für die Gartensauna: Regeln nach Bundesland | „wie groß darf eine sauna im garten sein ohne baugenehmigung“ (Google „Weitere Fragen“) | nicht im Export | – |
| 2 | Sauna mit Holzofen im Garten: Was ist erlaubt? | sauna mit holzofen im garten erlaubt | 100–1.000 | 1,02 € |
| 3 | Fasssauna Kosten: Anschaffung, Strom, Unterhalt | fasssauna kosten | 100–1.000 | 0,93 € |
| 4 | Fasssauna Erfahrungen und Nachteile: Was Besitzer berichten | fasssauna test erfahrungen | nicht im Export | – |
| 5 | Holzofen oder Elektroofen für die Außensauna? | holz saunaofen / fasssauna mit elektroofen | 1.000–10.000 / 100–1.000 | 0,93 € / 1,62 € |
| 6 | Gartensauna selber bauen: Bausatz oder Eigenbau? | gartensauna selber bauen | 1.000–10.000 | 1,11 € |
| 7 | Fasssauna mieten: Anbieter, Preise, Ablauf | fasssauna mieten | 1.000–10.000 | 1,41 € |
| 8 | Fasssauna aus Thermoholz oder Fichte? | fasssauna thermoholz | 100–1.000 | 2,21 € |

### Phase 2 – Kaufberatung (ab Monat 2)

| # | Artikel (Arbeitstitel) | Hauptbegriff | Suchen/Monat | Klickpreis max. |
|---|---|---|---|---|
| 9 | Gartensauna mit Vorraum: Modelle und Kaufberatung | gartensauna / außensauna / saunahaus mit vorraum | je 1.000–10.000 | 2,25–2,48 € |
| 10 | Fasssauna mit Vorraum | fasssauna mit vorraum | 1.000–10.000 | 1,47 € |
| 11 | Gartensauna mit Holzofen kaufen | gartensauna mit holzofen | 1.000–10.000 | 1,48 € |
| 12 | Kleine Gartensauna: Modelle für wenig Platz | kleine gartensauna / aussensauna klein | je 100–1.000 | 1,61–1,81 € |
| 13 | Gartensauna mit Dusche | gartensauna mit dusche | 100–1.000 | 1,55 € |
| 14 | Sauna mit Whirlpool oder Badefass kombinieren | sauna mit whirlpool | 1.000–10.000 | 2,83 € |
| 15 | Mobile Fasssauna auf Anhänger | fasssauna auf anhänger | 100–1.000 | 1,54 € |
| 16 | Günstige Gartensauna: Lidl, Netto oder Fachhandel? | günstige sauna / fasssauna lidl / netto | je 100–1.000 | 1,01–1,61 € |

### Phase 3 – Hauptseiten (ab Monat 4, wenn erste Links da sind)

| # | Artikel (Arbeitstitel) | Hauptbegriff | Suchen/Monat | Klickpreis max. |
|---|---|---|---|---|
| 17 | Fasssauna kaufen: der große Ratgeber | fasssauna / fasssauna kaufen | 10.000–100.000 / 1.000–10.000 | 1,33 € |
| 18 | Fasssauna-Vergleich: die besten Modelle | fasssauna testsieger | 100–1.000 | 2,18 € |
| 19 | Anbieter im Vergleich: Karibu, Finnwerk, Pineca, Bast, FinnTherm | karibu fasssauna (+ weitere Marken) | 100–1.000 | 2,42 € |
| 20 | Gartensauna kaufen: der große Kaufratgeber | gartensauna | 100.000–1 Mio. | 1,55 € |

**Fragen, die Google bei „gartensauna“ und „fasssauna“ zeigt** (unbedingt beantworten, z. B. als FAQ):
- Wie groß darf eine Sauna im Garten sein ohne Baugenehmigung?
- Lohnt sich eine Gartensauna?
- Ist es erlaubt, eine Sauna im Garten zu haben?
- Ist eine Außensauna genehmigungspflichtig?
- Was sind die Nachteile einer Fasssauna?
- Lohnt sich eine Fasssauna?
- Wie hoch sind die Unterhaltskosten für eine Fasssauna?

---

## 6. Regeln für jeden Artikel

1. **Vor dem Schreiben die Google-Ergebnisse prüfen:** Welches Format wollen die Top 10 (Liste, Ratgeber, Vergleich)? Was fehlt allen? Das liefern wir.
2. **Die Antwort zuerst:** Die Kernaussage steht in den ersten 2–3 Sätzen. Danach Details.
3. **Konkret statt allgemein:** Maße, Preise mit Quelle und Datum, kW-Angaben, Holzstärken. Preise ändern sich, daher immer „Stand: Monat Jahr“.
4. **Vergleichstabellen** bei Kaufberatungen (Modell, Größe, Holz, Ofen, Preis ab, Shop-Link).
5. **Ehrliche Nachteile** nennen. Keine Werbesprache, keine Superlative ohne Beleg.
6. **FAQ-Block** am Ende mit den passenden Fragen aus Abschnitt 5 und aus `sauna-keywords.csv`.
7. **Länge nach Bedarf**, nicht nach Wortzahl. Ratgeber eher 1.200–2.000 Wörter, Hauptseiten länger.
8. **Quellen** am Ende verlinken (Hersteller, Landesbauordnung, Foren-Threads).
9. **Anrede:** „du“, sofern der Nutzer nichts anderes festlegt.

---

## 7. Linkmagneten (sollen Links von anderen Seiten holen)

Ziel: 30–50 verlinkende Seiten im ersten Jahr (entspricht ungefähr Domain Rating 15–25).

**A) Stromkosten-Rechner für die Gartensauna** (eigene Seite, interaktiv, ohne Tracking)
- Eingaben: Ofenleistung (kW), Aufheizzeit (min), Saunadauer (min), Saunagänge pro Woche, Strompreis (ct/kWh, voreingestellt aktueller Durchschnitt mit Quelle).
- Ausgabe: Kosten pro Saunagang, pro Monat, pro Jahr.
- Hinweis: Der echte Verbrauch liegt unter „Leistung × Zeit“, weil der Thermostat den Ofen taktet. Optional einen Faktor (z. B. Einschaltdauer in %) einstellbar machen und erklären.
- Rechenbeispiel als Obergrenze: 9 kW × 1,5 h × 0,37 €/kWh ≈ 5 € pro Saunagang.
- Strompreis: laut BDEW 2026 im Schnitt 37,0 ct/kWh (zitiert von solaranlage-tipps.de) – vor Veröffentlichung an der BDEW-Originalquelle prüfen.

**B) Baugenehmigung nach Bundesland** (Tabelle mit allen 16 Ländern)
- Spalten: Bundesland · Grenze für verfahrensfreie Gebäude · Abstandsregeln · Hinweise zu Holzöfen/Schornstein · Quelle (Link zur Landesbauordnung) · Stand-Datum.
- Jeden Wert an der Originalquelle prüfen. Unklares als offen markieren. Hinweis „keine Rechtsberatung“.

**C) „Was Besitzer nach einem Jahr sagen“**
- Erfahrungsberichte aus Reddit (r/Sauna), saunafans.de, grillsportverein.de und YouTube auswerten, nach Problemen gruppieren (Feuchtigkeit, Holz, Ofen, Lieferung, Aufbau).
- In eigenen Worten, mit Link zur Quelle, keine wörtlichen Übernahmen.

---

## 8. Partnerprogramme (alle über Awin, Anmeldung durch den Nutzer)

| Programm | Provision | Cookie | Bezahlte Suchanzeigen |
|---|---|---|---|
| GartenHaus GmbH (DE) – ui.awin.com/merchant-profile/22747 | 5 % Standard, 7 % Content und Top-Partner | 30 Tage | Werbung auf Marken-/Produktnamen verboten; allgemeine Begriffe vorher schriftlich klären |
| Gartenhausfabrik (DE) – ui.awin.com/merchant-profile/76696 | 7 % Standard, mehr für Top-Publisher | 30 Tage | SEA laut Programmbedingungen ausgeschlossen |
| Bast Sauna (DE) – ui.awin.com/merchant-profile/119243 | 6 % | 30 Tage | nicht geregelt, beim Affiliate-Manager anfragen |
| Artsauna (DE) – ui.awin.com/merchant-profile/106021 | bis 6 % | 30 Tage | nicht geregelt, bei adseed anfragen |

- Preisrahmen laut Google-Ergebnis von Pineca: 2.196–11.004 €. Einstiegs-Fasssaunen (z. B. FasssaunaFreunde) ab 2.999 €.
- Zusätzliche Einnahmen: Saunaöfen, Zubehör, Badefässer über dieselben Shops.
- **Wichtig:** Die Kaufentscheidung dauert oft länger als 30 Tage Cookie. Deshalb Schwerpunkt auf Seiten für Leser kurz vor dem Kauf (Modelle, Vorraum, Holzofen, Vergleich) und später eine E-Mail-Liste.

---

## 9. Recherche-Grundlagen (damit du die Entscheidungen nachvollziehen kannst)

**Google-Suche „gartensauna“ (05.11.2026):**
- Anzeigen: Finnwerk, Armstark, Karibu-Saunen, Optirelax, Gartenhaus.com.
- Top 10: nur Shops/Hersteller (Karibu, Polhus, Scandinavic Wood Art, Pineca, Finnwerk, KLAFS, myGartenhaus24, vitkonwood), Videos (Garten Fuchs, MDR, corso sauna manufaktur). Kein unabhängiger Ratgeber.

**Google-Suche „fasssauna test erfahrungen“:**
- testsieger.de, Reddit r/Sauna, saunova.de, Foren (saunafans.de, grillsportverein.de), haus-garten-insider.de, wohn-blogger.de, baltresto.de.

**Stärke dieser Seiten (Ahrefs Domain Rating):**

| Seite | DR | Verlinkende Websites |
|---|---|---|
| saunova.de | 0,7 | 409 (14 % dofollow) |
| haus-garten-insider.de | 14 | 671 (9 % dofollow) |
| wohn-blogger.de | 24 | 833 (19 % dofollow) |
| testsieger.de | 61 | 2.000 (44 % dofollow) |

→ Ratgeber-Themen sind sofort angreifbar. Für Kaufbegriffe braucht die Seite DR 15–25.

**Größte Suchbegriff-Gruppen** (Details in `sauna-keywords.csv`):
- Mit Vorraum: viele Varianten je 1.000–10.000, Klickpreise bis 2,48 € (höchster Geldwert).
- Mit Holzofen: gartensauna/outdoorsauna/fasssauna mit holzofen je 1.000–10.000.
- Selber bauen: mehrere Varianten je 1.000–10.000.
- Mieten: fasssauna mieten 1.000–10.000.
- Klein, mit Dusche, günstig, Lidl/Netto, gebraucht, auf Anhänger: je 100–1.000.
- Sauna mit Whirlpool: 1.000–10.000, Klickpreis bis 2,83 €.

**Saison:** Die Nachfrage ist im Herbst und Winter am höchsten. Ziel: bis Sommer 2027 ranken, damit die Seite zur Saison Herbst 2027 bereit ist.

---

## 10. Reihenfolge der Arbeit

1. Grundgerüst der Website (Layout, Navigation, Startseite, Hauptseiten als Gerüst, Impressum/Datenschutz mit Platzhaltern, Affiliate-Hinweis, Sitemap).
2. Artikel 1–4, je als eigener Pull Request.
3. Stromkosten-Rechner.
4. Artikel 5–8.
5. Baugenehmigungs-Tabelle.
6. Artikel 9–16.
7. Ab Monat 4: Artikel 17–20 und Besitzer-Auswertung.
8. Nach jedem Schritt kurz berichten: was ist live, was ist offen, was braucht der Nutzer (z. B. Affiliate-Links, Impressumsdaten).

**Offene Punkte, die der Nutzer liefert:** Domain, Seitenname, Impressums-/Autorendaten, freigeschaltete Affiliate-Links, Antwort von GartenHaus zu Suchanzeigen.
