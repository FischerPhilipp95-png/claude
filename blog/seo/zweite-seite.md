# Zweite Affiliate-Seite: welches Thema?

Stand 03.10.2026. Grundlage:
- `nischen-ranking.md`: 15 Themenfelder, 66 Suchbegriffe, Google-Vorschläge und YouTube-Aufrufe der Top-Videos
- Google Trends (Deutschland, 5 Jahre): Saison und Trend
- Kanal-Auswertung aller 68 Videos (`docs/kanal_strategie.md` auf dem Video-Branch)
- Amazon-PartnerNet-Provisionssätze (partnernet.amazon.de, abgerufen 03.10.2026)

## Ergebnis in einem Satz

**Kaffeevollautomaten (Modell + Problem)** ist das Thema, bei dem am schnellsten etwas gehen kann. Es ist das einzige Feld,
in dem schon eigene Belege vorliegen: Der Kanal rankt dort bereits, und solche Videos holen 20-mal mehr Aufrufe als der Rest.
**Pool & Garten-Wasser** ist die zweite Wahl: höchste Nachfrage im Scan und wachsend. Die Saison beginnt im Mai, man hätte also
genau die 6–7 Monate, die eine neue Domain zum Ranken braucht.

## Vergleich der Top-Kandidaten

| | Kaffeevollautomaten | Pool & Garten-Wasser | Grill & Pizzaofen | Waschmaschine-Fehlercodes |
|---|---|---|---|---|
| YouTube-Nachfrage (Median Top-5) | 267 Tsd | **306 Tsd** | 238 Tsd | 153 Tsd |
| Long-Tail (Google-Vorschläge je Begriff) | 62 | 136 | **164** | 148 |
| Saison (Trends-Spitze) | **Nov./Dez., ganzjährig** | Juni (5-mal Unterschied Sommer/Winter) | Mai | ganzjährig |
| Trend 12 Monate vs. davor | ±0 % | **+30 %** | ±0 % | +6 % |
| Amazon-Provision | 3–5 % (Kategorie im PartnerNet prüfen) | 3 % (Garten) | 3–5 % | **2,5 %** (Haushaltsgroßgeräte) |
| Wiederkäufe (Verbrauchsmaterial) | **Entkalker, Filter, Reinigungstabletten, Milchreiniger** | Chlor, Filterkartuschen, Sand | Pellets, Reinigung | kaum, Ersatzteile meist nicht bei Amazon |
| Eigener Vorsprung | **31 Videos, Kanal schon in Top 8** | keiner | keiner | keiner |
| Konkurrenz | Hersteller und Händler, aber Modell-Fehler sind dünn besetzt | Shops und Foren | sehr stark (Magazine, Grill-Blogs) | Ersatzteil-Shops |

Nicht empfohlen: Saugroboter, Smart Home, E-Bike, Mähroboter und Katze. Dort war die Nachfrage im Scan klein,
für Saugroboter teils auch wegen gesperrter YouTube-Abrufe (Wert 0). Wärmepumpe und Balkonkraftwerk passen besser als Cluster
in den Handwerksdoktor-Blog.

## Warum Kaffeevollautomaten am schnellsten sind

1. **Belegte Nachfrage:** „delonghi magnifica entkalken“ hat 873 Tsd Aufrufe im Median der Top-5-Videos und wird laut Trends (YouTube-Suche)
   ganzjährig etwa 25-mal so oft gesucht wie die anderen Video-Kandidaten des Kanals.
2. **Eigener Traffic ab Tag 1:** Jedes Kaffee-Video verlinkt die passende Seite. Google braucht Monate, YouTube liefert sofort.
3. **Zeitpunkt:** Die Spitze im November/Dezember sind neue Maschinen zu Weihnachten, also Einrichten, Fehler und Zubehör.
   Seiten, die jetzt online gehen, sind bis Dezember indexiert.
4. **Skalierbar ohne KI-Masse:** Jede Seite hat eine einzigartige Tatsache aus der Bedienungsanleitung: Fehlercode, Lampen-Muster,
   Entkalkungsprogramm und passender Filter je Modell. Das ergibt eine Datenbank Marke × Modell × Problem, aus der Astro
   (`getStaticPaths`) die Seiten baut. Hunderte Seiten mit echtem Inhalt statt umgeschriebener Allgemeinplätze.
5. **Wiederkäufe:** Wer über den Link Entkalker oder Filter kauft, kauft alle 2–3 Monate wieder. Dazu der Maschinenkauf
   (300–900 €) zu Black Friday und Weihnachten.

**Offene Entscheidung:** Der Handwerksdoktor-Blog hat schon 5 Kaffee-Artikel. Entweder ziehen sie auf die neue Seite um
(301-Umleitung, der Blog ist erst 2 Tage live, es geht also kaum etwas verloren), oder die neue Seite nimmt ein anderes Thema.
Zwei eigene Seiten mit demselben Thema würden sich gegenseitig Konkurrenz machen.

## Ehrliche Erwartung

- Eine neue Domain bekommt in den ersten 3–6 Monaten wenig Google-Traffic. „Echt schnell“ geht nur über YouTube als Zubringer
  und über sehr spezielle Fragen (Modell + Fehler), die große Seiten nicht einzeln beantworten.
- Google-Antworten mit KI-Übersicht kosten Klicks bei einfachen Fragen. Schritt-für-Schritt-Anleitungen mit Bildern
  oder Videos zu einem bestimmten Modell klicken die Leute trotzdem an.
- Massenhaft KI-Text ohne eigene Daten wird als „scaled content abuse“ abgestraft. Deshalb jede Seite aus echten Daten
  (Anleitung, eigenes Video, eigene Grafik).

## Technik: nichts Neues nötig

Der Handwerksdoktor-Blog (`blog/site`) ist schon das passende Gerüst: Astro, Pagefind, Sitemap, IndexNow, Rechtstexte,
Produktliste mit Partner-Tag, eigene Grafiken. Für Seite 2 wird er kopiert (eigene Farben und eigenes Logo),
dazu kommt eine Daten-Sammlung `modelle.json` (Marke, Modell, Fehler, Lampen, Entkalker, Filter, Quelle = Anleitung + Seite).
Die GitHub-Werkzeuge aus `seo-plan.md` (Astro, astro-seo, Pagefind, linkinator, unlighthouse, advertools, umami) gelten unverändert.

## Nächste Schritte nach deinem OK

1. Thema bestätigen (Kaffee oder Pool) und klären, ob die Kaffee-Artikel umziehen.
2. Domain wählen (Markenrecherche DPMA/EUIPO wie beim Handwerksdoktor), bei IONOS registrieren.
3. Modell-Datenbank: die 20 meistgesuchten Modelle (DeLonghi Magnifica S/Evo, Philips 2200/3200/5400 LatteGo, Siemens EQ.6/EQ.9,
   Jura E8, Melitta Barista …), Fehler und Lampen aus den offiziellen Anleitungen.
4. Erste 30 Seiten bauen, jede mit dem passenden Kanal-Video, dann Search Console und Bing.
