# SEO-Plan: schnell zu natürlichem Traffic

Stand 30.09.2026. Ehrlich vorweg: Niemand kann Rankings garantieren. Eine neue Domain hat bei
Google null Vertrauen, und bei umkämpften Begriffen („beste Akkuschrauber“) kommt sie im ersten
Jahr nicht nach vorne. Schnell geht es nur über **Nischenfragen mit wenig Konkurrenz**, und genau
dafür ist euer Kanal gut aufgestellt.

## Die Strategie in einem Satz

Jedes Video beantwortet ein „Wie funktioniert …?“. Der Blog beantwortet die **konkreten
Folgefragen**, die Leute danach googeln („Heizung entlüften wie lange bis Wasser kommt“), und
empfiehlt dabei das passende Zubehör.

## 1. Wo wir schnell ranken können: Long-Tail-Fragen

`tools/keywords.py` holt echte Suchanfragen aus der Google-Autovervollständigung.
Ergebnis für 7 Kanalthemen: `blog/seo/keywords.md` (rund 1.300 Anfragen).

Warum Long-Tail schnell funktioniert:
- Große Seiten schreiben einen Artikel „Heizung entlüften“ und beantworten die Detailfrage in
  einem Nebensatz. Ein eigener Artikel **nur** zu „Pumpe an oder aus beim Entlüften?“ ist die
  bessere Antwort und rankt oft schon nach wenigen Wochen.
- Die Konkurrenz vorher prüfen: Frage bei Google eingeben. Stehen oben Foren (gutefrage.net,
  Reddit), alte Artikel oder Seiten, die die Frage nur nebenbei beantworten, ist sie leicht zu
  gewinnen.
- Faustregel „Keyword Golden Ratio“: Anzahl Treffer für `allintitle:"suchbegriff"` geteilt durch
  monatliches Suchvolumen < 0,25 (bei Volumen < 250) = sehr gute Chance.
  Suchvolumen kostenlos: Bing Webmaster Tools → Keyword-Recherche, später die eigene Search Console.

## 2. Die ersten 10 Artikel (aus echten Suchanfragen, passend zu euren Videos)

Reihenfolge nach Saison: Heizung jetzt (Oktober bis Februar), Klima im Frühjahr vorbereiten,
damit die Artikel im Sommer schon ranken.

| # | Artikel (Suchanfrage) | Video als Basis | Affiliate-Produkt | Saison |
|---|---|---|---|---|
| 1 | Heizung entlüften: Pumpe an oder aus? | heizung-video | Entlüftungsschlüssel mit Auffangbehälter | jetzt |
| 2 | Heizung entlüften ohne Schlüssel: 4 Wege, die funktionieren | heizung-video | Entlüftungsschlüssel-Set | jetzt |
| 3 | Heizung entlüften: Wie lange, bis Wasser kommt? | heizung-video | Entlüftungsschlüssel, Lappen/Behälter | jetzt |
| 4 | Heizkörper wird nicht warm: 6 Ursachen, von einfach bis Fachmann | heizung-video | Thermostatkopf, Entlüftungsschlüssel | jetzt |
| 5 | Heizung gluckert: Was bedeutet das? | heizung-video | Entlüftungsschlüssel, Manometer | jetzt |
| 6 | Stromverbrauch messen ohne Smart Meter | strom-video | Energiekostenmessgerät, smarte Steckdose | jetzt (Nebenkosten) |
| 7 | Wasserdruck zu niedrig in der Wohnung: Ursachen | wasser-video | Perlator/Strahlregler, Duschkopf | ganzjährig |
| 8 | Kaffeevollautomat entkalken ohne Entkalker? | kaffee-short | Entkalker, Reinigungstabletten (Nachkäufe!) | ganzjährig |
| 9 | Kaffeevollautomat entkalken trotz Wasserfilter? | kaffee-short | Wasserfilter-Kartuschen | ganzjährig |
| 10 | Mobile Klimaanlage ohne Abluftschlauch: Warum das nicht kühlt | klima-short | Klimagerät mit Schlauch, Fensterabdichtung | ab März |

Nr. 10 ist das perfekte Beispiel: Das Klima-Short erklärt schon, dass eine Klimaanlage Wärme nach
draußen schiebt. Genau das ist die Antwort auf die viel gesuchte Frage, warum Geräte ohne
Schlauch kaum kühlen.

Verbrauchsmaterial (Entkalker, Filter, Tabletten) ist besonders gut: Wer einmal über den Link
kauft, kauft oft wieder. Außerdem gibt es Provision auf alles, was innerhalb von 24 Stunden nach dem Klick
bei Amazon gekauft wird, nicht nur auf das verlinkte Produkt.

## 3. So muss jeder Artikel gebaut sein

- **Antwort in den ersten 2 Sätzen.** Google zeigt sie dann oft als hervorgehobenes Snippet.
- Titel = Suchfrage, unter 60 Zeichen. URL kurz: `/heizung-entlueften-pumpe/`.
- Zwischenüberschriften aus den Nebenfragen in `keywords.md`.
- Eigene Bilder: Frames und Grafiken aus euren Animationen, mit Alt-Text.
  Das ist echter Mehrwert, den andere Seiten nicht haben.
- „Erfahrung“ zeigen (E-E-A-T): wer schreibt, warum er sich auskennt, echte Fotos.
  Autorenbox mit Kanalbild, Link zum Kanal.
- Interne Links: Jeder Detailartikel verlinkt den Hauptartikel des Themas und umgekehrt
  („Themen-Cluster“ Heizung, Strom, Wasser, Klima, Kaffee).
- Affiliate-Box erst **nach** der Antwort. Seiten, die nur aus Produktlisten bestehen, stuft
  Google ab.
- **Nicht** massenhaft KI-Artikel veröffentlichen. Google straft „scaled content abuse“ ab.
  Rhythmus: 2–3 gute Artikel pro Woche schlagen 20 dünne.

## 4. Video-Trick: eigene Watch-Pages

Google zeigt Videos in den Suchergebnissen nur, wenn das Video der **Hauptinhalt** der Seite ist
(seit Dezember 2023). Also bekommt jedes Video zusätzlich eine eigene schlanke Seite
`/video/heizung-entlueften/`: Video oben, kurze Zusammenfassung, Kapitel, `VideoObject`-Markup.
So erscheinen die Videos in Googles Video-Ergebnissen, auch wenn der Blog noch jung ist.
Der ausführliche Artikel verlinkt auf diese Seite und umgekehrt.

## 5. Technik (alles kostenlos, im Blog-Setup eingebaut)

| Was | Werkzeug (GitHub) | Zweck |
|---|---|---|
| Blog-Gerüst | Astro (`withastro/astro`), Vorlage AstroPaper (`satnaing/astro-paper`) | schnelle statische Seiten, Top-Ladezeiten |
| Meta-Tags | `jonasmerlin/astro-seo` | Titel, Beschreibung, Canonical, Open Graph |
| Sitemap | `@astrojs/sitemap` (Teil von Astro) | Google findet alle Seiten |
| Strukturierte Daten | `google/schema-dts` oder `casoon/astro-structured-data` | Article, BreadcrumbList, VideoObject |
| Suche | `Pagefind/pagefind` | Suchfeld ohne externen Dienst (datenschutzfreundlich) |
| Ladezeit-Prüfung | `GoogleChrome/lighthouse-ci`, `harlan-zw/unlighthouse` | Core Web Vitals für jede Seite |
| Kaputte Links | `JustinBeckwith/linkinator` | 404er finden, vor allem bei Affiliate-Links |
| SEO-Crawler/Analyse | `eliasdabbas/advertools` (Python) | eigene Seite crawlen, Sitemaps und Titel prüfen |
| Keyword-Ideen | `tools/keywords.py` (hier im Repo) | echte Suchanfragen aus der Google-Autovervollständigung |
| Statistik (später) | `umami-software/umami` | ohne Cookies, selbst gehostet |

Die Versionen der Astro-, npm- und Python-Pakete habe ich am 30.09.2026 über npm bzw. PyPI
geprüft. AstroPaper als Vorlage empfehle ich aus Erfahrung, das Repo selbst konnte ich von hier
aus nicht aufrufen.

Bewusst **nicht** eingebaut: FAQ- und HowTo-Markup. Google zeigt dafür seit 2023 kaum noch
Rich Results für normale Seiten, der Aufwand lohnt nicht.

## 6. Schnell indexiert werden

1. **Google Search Console** einrichten (kostenlos), Sitemap einreichen, jeden neuen Artikel per
   „URL-Prüfung → Indexierung beantragen“ anstoßen.
2. **Bing Webmaster Tools** + IndexNow: Bing indexiert damit innerhalb von Stunden.
   Bing-Ergebnisse fließen auch in DuckDuckGo und zum Teil in KI-Suchen ein.
3. **YouTube als Zubringer:** Link zum passenden Artikel in jeder Beschreibung, im
   angehefteten Kommentar und in der Kanal-Info. Diese Links zählen nicht direkt fürs Ranking,
   bringen aber Besucher, und Google entdeckt die Seiten schneller.
4. Später: Gastbeiträge oder Erwähnungen in Heimwerker-Foren und -Blogs für erste Backlinks.

## 7. Die ersten 30 Tage

| Woche | Aufgabe |
|---|---|
| 1 | Markenrecherche „Handwerksdoktor“, Domain kaufen, Hoster, Postflex-Vollmacht, Gewerbe anmelden, Amazon-PartnerNet-Konto |
| 1 | Blog-Gerüst mit Rechtstexten, Search Console + Bing Webmaster verbinden |
| 2 | Artikel 1–3 (Heizung) + Watch-Page fürs Heizungsvideo |
| 3 | Artikel 4–6 |
| 4 | Artikel 7–9, erste Auswertung in der Search Console: Für welche Suchanfragen tauchen wir schon auf Seite 2–3 auf? Genau diese Artikel ausbauen. |

Nach 4–8 Wochen zeigt die Search Console, welche Fragen Google uns schon zutraut. Das ist die
wertvollste Keyword-Quelle überhaupt, weil sie auf unsere eigene Seite zugeschnitten ist.

## Quellen

- Google zu Videos als Hauptinhalt: https://developers.google.com/search/docs/appearance/video
- VideoObject-Markup: https://developers.google.com/search/docs/appearance/structured-data/video
- Astro-SEO-Projekte auf GitHub: https://github.com/topics/astro-seo
- advertools: https://advertools.readthedocs.io/

## Stand 01.10.2026

Veröffentlicht (Cluster Heizung + Strom):

| Artikel | Suchanfrage | Rolle |
|---|---|---|
| Heizkörper entlüften: Anleitung in 7 Schritten | heizkörper entlüften (anleitung) | Hauptartikel Heizung |
| Heizung entlüften: Pumpe an oder aus? | heizung entlüften pumpe an oder aus | Detailfrage |
| Heizung entlüften ohne Schlüssel | heizung entlüften ohne schlüssel | Detailfrage, Affiliate Schlüssel |
| Heizung gluckert: 6 Ursachen | heizung gluckert (was tun, trotz entlüften) | Problemlöser |
| Heizkörper wird nicht warm: 6 Ursachen | heizkörper wird nicht warm | Problemlöser, Affiliate Thermostatkopf |
| Stromverbrauch messen: 4 Wege | stromverbrauch messen (ohne smart meter) | Hauptartikel Strom, Affiliate Messgerät |

Eingebaut für Ranking und Klickrate: Themenseiten (`/thema/heizung/`, `/thema/strom/`), Inhaltsverzeichnis,
„Das könnte dich auch interessieren“, Breadcrumb mit Thema (auch als strukturierte Daten), RSS-Feed (`/rss.xml`),
IndexNow (`npm run indexnow`), eigene Titelbilder, Schnellkauf-Kasten direkt nach der Antwort, Affiliate-Link
im Fließtext genau dort, wo das Werkzeug gebraucht wird.

Nächste Artikel: Heizungsdruck zu niedrig (Wasser nachfüllen), Thermostatkopf wechseln, Stand-by-Stromfresser finden,
Kaffeevollautomat entkalken (ohne Entkalker / trotz Filter), ab März: mobile Klimaanlage ohne Abluftschlauch.

## Stand 01.10.2026, Runde 3

Neu: Abfluss verstopft · Schimmel entfernen · Waschmaschine reinigen · Spülmaschine reinigen · Kaffeevollautomat entkalken
(Themen 1–5 aus `themen-ranking.md`). Neue Themenseiten: Wasser, Haushaltsgeräte. Neues Design mit Themenfarben, Icons
(Lucide, ISC-Lizenz), gerenderten Titelbildern und frei lizenzierten Fotos von Wikimedia Commons.

Nächste Kandidaten aus dem Ranking: hydraulischer Abgleich · Wasserhahn tropft · smartes Thermostat · Heizkurve einstellen ·
Stand-by-Stromverbrauch · Duschkopf/Wasserkocher entkalken. Ab März: mobile Klimaanlage.

## Stand 01.10.2026, Runde 4

Neu: Hydraulischer Abgleich · Wasserhahn tropft · Smartes Thermostat · Heizkurve einstellen · Stand-by-Stromfresser
(Themen 9–12 und Stand-by aus `themen-ranking.md`).

Eigene Grafiken, ohne fremde Server, als HTML/SVG direkt in der Seite (Hover zeigt genaue Werte, Zahlen stehen immer auch als Text da):
`Balken` (eine Datenreihe in der Themenfarbe), `Skala` (Bereiche mit Statusfarbe, immer mit Symbol und Text), `DruckSkala`
(Heizungsdruck, in allen Heizungs-Artikeln gleich), `Ablauf` (Schritte mit Icons) und `Heizkurve` (Prinzip-Darstellung mit Tabelle).
Alle älteren Artikel haben jetzt mindestens eine Grafik, Artikel ohne Foto haben ein Commons-Foto bekommen, wo es ein brauchbares gab.

Nächste Kandidaten: Duschkopf entkalken · Wasserkocher entkalken · Heizung richtig einstellen · Heizkörper tauschen (Kosten) ·
ab März: mobile Klimaanlage.

## Stand 01.10.2026, Runde 5

**Suche:** Pagefind, läuft komplett im Browser, Suchbegriff bleibt im Browser (Übergabe per `#q=`). Suchfeld auf Startseite,
Artikelübersicht und 404-Seite, Lupe in der Kopfzeile. CSP um `'wasm-unsafe-eval'` erweitert.

**Produkte erklärt** (`/produkte/`): zentrale Liste `site/src/produkte.ts`, Komponente `ProduktFokus` mit Direktlink (ASIN + Tag).
Keine Test-Urteile, keine Preise, keine Amazon-Bilder. Jede Produktseite ist eine Anleitung zu einer Suchanfrage mit Kaufabsicht.

**Neue Kategorie:** Sicherheit (Rauchmelder, Video-Türklingel).

**15 neue Artikel:** Plissee ohne Bohren · Siemens EQ entkalken · De'Longhi entkalken · Jura reinigen und Filter · Philips AquaClean ·
Dampfglätter · Licht mit Bewegungsmelder · Lebensmittelmotten · Fruchtfliegen · Isopropanol · Sparduschkopf · Video-Türklingel ·
Rauchmelder · WAGO-Klemmen · Handy lädt langsam. Hub „Kaffeevollautomat entkalken“ verlinkt alle Marken-Anleitungen.

Nächste Ideen: Duschkopf entkalken (passt zu Sparduschkopf), Wasserkocher entkalken, Plissee mit oder ohne Bohren (Vergleich),
Rauchmelder piept (Fehlerbehebung), eigenes YouTube-Video zur Plissee-Montage mit echtem Produkt.

## Stand 01.10.2026, Runde 6

- Balkonkraftwerk-Rechner (`/rechner/balkonkraftwerk/`) auf Basis der Rechnung aus `projects/balkonkraftwerk-video/research.md`
  (Branch der Video-Sitzung): ohne/mit Speicher, Amortisation, Regel-Hinweis Schuko/Wieland/Anlage. Rechner-Übersicht `/rechner/`.
- 8 weitere Produkte mit Direktlink: Brennenstuhl PM 231 E, ThermoPro TP50 und TP30, tesamoll P-Profil, Heimeier K, Ei650,
  Dr. Beckmann Waschmaschinenreiniger, Finish Maschinenpfleger.
- Neue Artikel: Duschkopf entkalken, Rauchmelder piept, Plissee mit oder ohne Bohren.
- Nächster Schritt mit viel Suchvolumen: eigener Artikel „Balkonkraftwerk mit Speicher: lohnt sich das?“ passend zum Video.

## Stand 01.10.2026, Runde 7

- Artikel „Heizlüfter, Ölradiator oder Infrarotheizung“ mit Rowenta SO2320, De'Longhi Radia S, Könighaus Infrarot 600 W.
- 4 neue Rechner: Heizkosten sparen, Duschkosten, Stand-by, tropfender Wasserhahn. Rechner-Übersicht mit 6 Rechnern.
- Alle Rechner teilbar: Eingaben stehen im #-Teil der Adresse (geht nicht an den Server), „Link kopieren“ und „Teilen“ (Handy).
- Jeder Rechner mit passenden Amazon-Links, verlinkt aus den passenden Artikeln.

## Stand 01.10.2026, Runde 8 (Google Trends Heizperiode)

- Qualitätsprüfung: `npm run qualitaet` (html-validate, pa11y-ci WCAG 2 AA) und `npm run lighthouse` (Unlighthouse, alle Seiten 100 außer noindex).
- Anzeigename überall „Der Handwerksdoktor“, echter Name nur in Impressum und Datenschutz.
- Trend-Cluster „ab wann heizen“ (ab wann Heizung anmachen, ab welcher Außentemperatur, ab wie viel Grad, wann muss der Vermieter
  die Heizung einschalten): Artikel `/artikel/ab-wann-heizen/`. H2/FAQ nutzen die Suchformulierungen wörtlich. Jährlich ab September
  aktualisieren (Heizperiode-Jahreszahlen, Urteile).
- Trend-Cluster „heizen mit Klimaanlage“ (Split-Klimaanlage zum Heizen, mobile Split-Klimaanlage): Artikel `/artikel/heizen-mit-klimaanlage/`
  mit Midea PortaSplit (B0D3PP64JS) und neuer Rechner `/rechner/heizkosten-vergleich/` (Klimaanlage, Gas, Heizlüfter; deckt auch
  „was kostet Gas zum Heizen“ ab).
- Offen aus den Trends: „thermostat heizung wechseln“ und „heizung richtig entlüften“ in vorhandene Titel/H2 einarbeiten,
  „Strangregulierventil“ im Abgleich-Artikel, „Gartenhaus heizen / Heizstrahler“ im Heizgeräte-Vergleich, Short „Ab wann heizen?“.
