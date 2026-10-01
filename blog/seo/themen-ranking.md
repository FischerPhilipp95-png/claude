# Themen-Ranking

Erstellt am 01.10.2026 mit `tools/themenfinder.py`. Punkte = Nachfrage × Saison × Amazon-Potenzial.
Nachfrage = Google-Vorschläge + 2 × Fragen + YouTube-Vorschläge (+ Bing-Volumen, falls API-Schlüssel gesetzt).
Saison: ×1,5, wenn die Trends-Spitze in den nächsten 2 Monaten liegt, ×0,7, wenn sie 6+ Monate entfernt ist.

| # | Begriff | Thema | Punkte | Google | Fragen | YouTube | Spitze | jetzt/Ø | Produkt | schon da? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | abfluss verstopft | Wasser | **666** | 263 | 39 | 29 | Dez | 58.5/67.3 | Rohrreinigungsspirale |  |
| 2 | schimmel entfernen | Klima | **549** | 260 | 10 | 25 | Dez | 34.5/54.8 | Schimmelentferner |  |
| 3 | waschmaschine reinigen | Küche | **547** | 245 | 13 | 33 | Okt | 69.5/77.5 | Waschmaschinenreiniger |  |
| 4 | spülmaschine reinigen | Küche | **511** | 233 | 9 | 33 | Dez | 55.0/63.8 | Spülmaschinenreiniger |  |
| 5 | balkonkraftwerk | Strom | **504** | 359 | 95 | 51 | Apr | 42.8/49.0 | Balkonkraftwerk |  |
| 6 | thermostat wechseln | Heizung | **416** | 204 | 3 | 21 | Nov | 23.5/42.7 | Thermostatkopf | ✅ |
| 7 | kaffeevollautomat entkalken | Küche | **403** | 170 | 17 | 20 | Dez | 56.0/71.3 | Entkalker |  |
| 8 | heizung wasser nachfüllen | Heizung | **386** | 194 | 24 | 15 | Okt | 13.0/29.3 | Füllset mit Systemtrenner | ✅ |
| 9 | hydraulischer abgleich | Heizung | **371** | 248 | 23 | 15 | Nov | 48.2/55.9 | – |  |
| 10 | wasserhahn tropft | Wasser | **371** | 230 | 30 | 19 | Mär | 48.8/64.7 | Dichtungsset Wasserhahn |  |
| 11 | mobile klimaanlage | Klima | **340** | 312 | 37 | 19 | Jun | 1.0/4.9 | mobile Klimaanlage |  |
| 12 | smartes thermostat | Heizung | **308** | 157 | 0 | 14 | Nov | 21.0/16.4 | smartes Heizkörperthermostat |  |
| 13 | tür abdichten | Klima | **275** | 142 | 1 | 9 | Nov | 24.2/22.7 | Zugluftstopper | ✅ |
| 14 | wasserkocher entkalken | Küche | **238** | 198 | 15 | 10 | Jan | 50.0/56.6 | Entkalker |  |
| 15 | fenster abdichten | Klima | **234** | 239 | 12 | 15 | Jun | 16.8/25.0 | Fensterdichtband | ✅ |
| 16 | heizkurve einstellen | Heizung | **223** | 159 | 6 | 15 | Dez | 11.2/25.7 | – |  |
| 17 | standby stromverbrauch | Strom | **209** | 110 | 1 | 4 | Nov | 27.2/26.8 | schaltbare Steckdosenleiste |  |
| 18 | duschkopf entkalken | Wasser | **184** | 130 | 6 | 11 | Jan | 47.0/38.9 | Duschkopf |  |
| 19 | luftfeuchtigkeit wohnung | Klima | **169** | 165 | 16 | 4 | Jun | 16.8/24.1 | Hygrometer | ✅ |
| 20 | richtig lüften | Klima | **169** | 209 | 11 | 11 | Jun | 7.8/18.8 | Hygrometer | ✅ |
| 21 | heizung richtig einstellen | Heizung | **160** | 91 | 2 | 12 | Okt | 8.8/16.3 | smartes Heizkörperthermostat |  |
| 22 | kühlschrank stromverbrauch | Strom | **139** | 188 | 0 | 10 | Jun | 42.8/58.1 | Energiekostenmessgerät |  |
| 23 | wasserdruck zu niedrig | Wasser | **139** | 153 | 18 | 10 | Sep | 41.5/23.9 | Strahlregler |  |
| 24 | luftfeuchtigkeit senken | Klima | **134** | 139 | 8 | 5 | Jun | 9.0/12.4 | Luftentfeuchter |  |
| 25 | heizlüfter stromverbrauch | Strom | **86** | 47 | 0 | 10 | Nov | 15.8/11.7 | Energiekostenmessgerät | ✅ |
| 26 | infrarotheizung stromverbrauch | Strom | **82** | 45 | 0 | 10 | Nov | 17.0/9.5 | Energiekostenmessgerät |  |
| 27 | perlator entkalken | Wasser | **34** | 26 | 3 | 9 | Jul | 9.2/2.6 | Perlator |  |
| 28 | wäschetrockner stromverbrauch | Strom | **30** | 33 | 0 | 10 | Sep | 46.8/3.5 | Energiekostenmessgerät |  |
| 29 | heizungsdruck zu niedrig | Heizung | **27** | 6 | 4 | 4 | Okt | 0.0/1.9 | Füllset mit Systemtrenner |  |
| 30 | ölradiator oder heizlüfter | Strom | **21** | 10 | 5 | 5 | Sep | 25.0/1.9 | Ölradiator |  |
| 31 | heizdecke stromverbrauch | Strom | **21** | 18 | 0 | 7 | Sep | 25.0/1.9 | Heizdecke |  |

## Beispiel-Suchanfragen (Top 10)

- **abfluss verstopft**: abfluss dusche wohnmobil verstopft · abfluss ist verstopft englisch · abfluss ist verstopft was tun · abfluss urinal verstopft · abfluss verstopft aachen · abfluss verstopft aber rohre frei · abfluss verstopft aber siphon frei · abfluss verstopft abflussreiniger hilft nicht
- **schimmel entfernen**: quartel schimmel entfernen · quietscheenten schimmel entfernen · schimmel am fenster wie entfernen · schimmel auf joghurt entfernen · schimmel auf quark entfernen · schimmel aus jausenbox entfernen · schimmel aus jeans entfernen · schimmel aus jutebeutel entfernen
- **waschmaschine reinigen**: hebeanlage waschmaschine reinigen youtube · miele waschmaschine reinigen youtube · putzmarie waschmaschine reinigen instagram · waschmaschine chemisch reinigen · waschmaschine flusensieb reinigen wie oft · waschmaschine indesit reinigen · waschmaschine innen reinigen hausmittel · waschmaschine laugenpumpe reinigen
- **spülmaschine reinigen**: _putzmarie_ spülmaschine reinigen instagram · aeg spülmaschine reinigen und trocknen blinkt · cappy spülmaschine reinigen · ignis spülmaschine reinigen · jemako spülmaschine reinigen · junker spülmaschine reinigen · juno spülmaschine reinigen · miele spülmaschine innen reinigen
- **balkonkraftwerk**: balkonkraftwerk 2000 watt · balkonkraftwerk 2000 watt mit speicher · balkonkraftwerk 800 watt · balkonkraftwerk amazon · balkonkraftwerk angebot · balkonkraftwerk anker · balkonkraftwerk anker mit speicher · balkonkraftwerk anmelden
- **thermostat wechseln**: danfoss thermostat einsatz wechseln · danfoss thermostat ra wechseln · danfoss thermostat rav wechseln · danfoss thermostat ravl wechseln · danfoss thermostat raw wechseln · danfoss thermostat wechseln youtube · e36 thermostat wechseln · e46 thermostat wechseln anleitung
- **kaffeevollautomat entkalken**: bosch kaffeevollautomat entkalken ohne anleitung · bosch kaffeevollautomat entkalken tabletten · bosch kaffeevollautomat verocafe entkalken · delonghi kaffeevollautomat cappuccino entkalken · delonghi kaffeevollautomat entkalken video · delonghi kaffeevollautomat entkalken wie oft · delonghi kaffeevollautomat entkalken zitronensäure · delonghi kaffeevollautomat entkalken zurücksetzen
- **heizung wasser nachfüllen**: brötje heizung therme wasser nachfüllen · brötje heizung wasser nachfüllen anleitung · brötje heizung wasser nachfüllen youtube · buderus heizung wasser nachfüllen anleitung · buderus logamax heizung wasser nachfüllen · cosmo heizung wasser nachfüllen · ctc heizung wasser nachfüllen · daikin heizung wasser nachfüllen
- **hydraulischer abgleich**: checkliste hydraulischer abgleich · co2online hydraulischer abgleich · hydraulischer abgleich a · hydraulischer abgleich a oder b · hydraulischer abgleich ab wann pflicht · hydraulischer abgleich ab wieviel wohneinheiten · hydraulischer abgleich ablauf · hydraulischer abgleich altbau
- **wasserhahn tropft**: camargue wasserhahn tropft · camping wasserhahn tropft · cecipa wasserhahn tropft · concept wasserhahn tropft · franke wasserhahn tropft was tun · garten wasserhahn tropft reparieren · jrg wasserhahn tropft · pössl wasserhahn tropft
