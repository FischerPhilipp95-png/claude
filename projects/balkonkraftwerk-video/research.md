# Recherche + Faktencheck: „Erweiterbares Balkonkraftwerk mit 5-kWh-Speicher“

Ausgangspunkt: Transkript des YouTube-Videos https://www.youtube.com/watch?v=WFoJBK7BIsg (fremder Kanal, Thema EcoFlow STREAM 5000).
Das Video selbst ließ sich nicht laden (YouTube verlangt Login/Bot-Check, HTTP 429). Geprüft wurde deshalb nur das Transkript.
Von dort übernehmen wir **nur das Thema**, keine Formulierungen, keine Bilder, keine Musik. Alle Zahlen unten sind neu recherchiert.

## 1. Was im Transkript stimmt

| Aussage im Transkript | Stand der Quellen | Quelle |
|---|---|---|
| STREAM 5000: 5 kWh Speicher, Wechselrichter eingebaut | 5,024 kWh LFP, Wechselrichter integriert | EcoFlow-Blog, teltarif |
| 4 MPPT, bis 5.000 W Solareingang | 4 × 1.250 W = 5.000 W | teltarif, EcoFlow |
| Am Stecker 800 W Einspeisung | „Die für ein Steckersolargerät geltende Wechselrichter-Einspeiseleistung von 800 W darf nicht überschritten werden.“ | EcoFlow-Blog |
| Bis 3.000 W AC möglich | nur mit Festanschluss; laut EcoFlow „unter Anleitung einer Elektrofachkraft“ | EcoFlow-Blog |
| Bis zu 6 Haupteinheiten, bis 90 kWh | „bis zu sechs Geräte pro System“, „bis zu 90 kWh ausbaubar“ | EcoFlow-Blog |
| STREAM AC 5000: auch ca. 5 kWh, ohne PV-Eingang | 5,024 kWh, AC-gekoppelt, kein PV-Eingang | EcoFlow-Blog |
| 2 × 450 W ≈ 900 Wp | stimmt, und liegt **unter 960 Wp**, also am Schuko-Stecker zulässig | DIN VDE V 0126-95 (via balkon-kraft-werke.de) |
| 900 Wp → 800–900 kWh/Jahr, im Mittel gut 2 kWh/Tag | plausibel für guten Südbalkon (850 kWh ÷ 365 = 2,3 kWh/Tag); senkrecht am Geländer eher weniger | eigene Rechnung |
| 850 kWh × 50 % × 32 ct = 136 € | rechnerisch richtig | eigene Rechnung |
| 850 kWh × 80 % = 680 kWh × 32 ct = 218 € | rechnerisch richtig (217,60 €) | eigene Rechnung |
| Smart Meter im Zählerschrank braucht Elektriker | Hutschienen-Montage im Zählerschrank → Elektrofachkraft | yuma.de |

## 2. Was falsch oder irreführend ist (darf so nicht in unser Video)

1. **„Mein Balkonkraftwerk rechnet sich in unter zwei Jahren“** – gilt höchstens für ein einfaches Set **ohne** Speicher
   (ca. 300–450 €). Das gezeigte Setup kostet rund 1.750 € (Speicher ca. 1.499 €, UVP 1.599 €, plus Module/Halterung)
   und spart ca. 218–252 € im Jahr → **rund 7 Jahre**.
2. **„Nur für den Smart Meter braucht man einen Elektriker, danach erweitere ich ohne Elektriker“** – falsch.
   Über 960 Wp braucht es eine Wieland-Steckdose, gesetzt von einer Elektrofachkraft. Über 2.000 Wp ist es **kein Steckersolargerät mehr**,
   sondern eine normale PV-Anlage (Anmeldung beim Netzbetreiber, Elektriker). Die 3.000 W AC gibt es nur per Festanschluss.
3. **„Bis zu 1.000 € im Jahr sparen, nur mit einem Balkonkraftwerk“** – nicht nachvollziehbar. Dafür müsste man bei 37 ct
   rund 2.700 kWh im Jahr selbst verbrauchen. Ein Steckersolargerät am Maximum (2.000 Wp) erzeugt grob 1.900 kWh.
4. **„Die Geräte kommunizieren über das Hausnetz“** – die Geräte **sprechen per WLAN** miteinander. Über die Hausleitungen
   fließt der **Strom** (AC-Kopplung). Jede Umwandlung Akku → Netz → Akku kostet Verluste, die im Video nicht vorkommen.
5. **Echtzeit-/dynamischer Tarif** – braucht ein **intelligentes Messsystem vom Messstellenbetreiber**, nicht den EcoFlow-Zähler.
   Außerdem Widerspruch: Wer für 25–26 ct einkauft, spart pro selbst genutzter kWh auch nur 25–26 ct, nicht 32 ct.
6. **Verluste und Standby** des Speichers sind in der Rechnung nicht enthalten (Herstellerwert für Standby nicht gefunden → offen).
7. Kleinere Fehler: „noch mal 80 €“ (es sind 82 €), „1–2 Kilowattstunden mehr PV“ (gemeint kWp), Punkt 4 fehlt in der Zählung,
   „VLAN-Steckdose“ = Wieland-Steckdose, „Stream 5000 statt Balkonkraftwerk“ ist technisch trotzdem ein Steckersolargerät, solange ≤ 2.000 Wp / 800 W.
8. Strompreis 32 ct ist niedrig angesetzt: BDEW nennt für 2026 im Schnitt **37,0 ct/kWh** (Neukunden, 3.500 kWh).

## 3. Unsere eigene Rechnung (für das Video)

Annahmen: 2 Module, 900 Wp, guter Südbalkon → **850 kWh/Jahr**. Strompreis **37 ct** (BDEW 2026). Eigenverbrauch 50 % ohne, 80 % mit Speicher
(beides Annahmen, je nach Haushalt sehr verschieden; im Video so kennzeichnen).

| | ohne Speicher | mit 5-kWh-Speicher | Ausbau auf 2.000 Wp + Speicher |
|---|---|---|---|
| selbst genutzt | 425 kWh | 680 kWh | ca. 1.520 kWh (1.900 × 80 %) |
| Ersparnis/Jahr | **ca. 157 €** | **ca. 252 €** | **ca. 560 €** |
| Kosten (ca.) | 300–450 € (Set) | ca. 1.750 € | zzgl. weitere Module + Wieland-Steckdose/Elektriker |
| Amortisation | **ca. 2 Jahre** | **ca. 7 Jahre** | offen (Preise für Elektriker vor Ort einholen) |

Kernaussage: **Mit nur zwei Modulen bringt der große Speicher ca. 95 € mehr im Jahr. Er lohnt sich erst, wenn man ausbaut**
(mehr Module, dynamischer Tarif mit intelligentem Messsystem, Notstrom als Extra).

## Quellen

- EcoFlow: STREAM 5000 – die wichtigsten Fragen: https://www.ecoflow.com/de/blog/ecoflow-stream-5000
- teltarif: 5.000 Watt Solarleistung – EcoFlow STREAM 5000: https://www.teltarif.de/ecoflow-stream5000-speicher/news/106234.html
- smarthome-kompass: STREAM 5000 im Launch-Check (UVP 1.599 €, Marktstart 15.09.2026): https://www.smarthome-kompass.de/tests/ecoflow-stream-5000
- yuma.de: STREAM 5000, Smart Meter im Schaltschrank: https://yuma.de/blogs/news/ecoflow-stream-5000
- Schuko oder Wieland 2026 (DIN VDE V 0126-95): https://balkon-kraft-werke.de/ratgeber/schuko-oder-wieland-vde-0126-95/
- DKE-FAQ zur DIN VDE V 0126-95: https://www.dke.de/resource/blob/2436538/acdd2607c6e6cf6681ca12a663b6ad70/faq-zur-din-vde-v-0126-95---download-data.pdf
- BDEW-Strompreisanalyse Herbst 2026 (37,0 ct/kWh): https://www.bdew.de/service/daten-und-grafiken/bdew-strompreisanalyse/
- ADAC: Speicher für Balkonkraftwerk: https://www.adac.de/rund-ums-haus/energie/versorgung/balkonkraftwerk-speicher/
- ADAC: Balkonkraftwerk kaufen 2026: https://www.adac.de/rund-ums-haus/energie/versorgung/balkonkraftwerk/

Vor dem Rendern nochmal prüfen: aktueller Straßenpreis STREAM 5000, Standby-Verbrauch, Pflichten zur Anmeldung (Marktstammdatenregister).
