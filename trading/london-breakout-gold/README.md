# London Breakout Gold (XAUUSD) – TradingView-Backtest & Indikator

Die Strategie: Zum London-Open werden High und Low der ersten zwei 15-Minuten-Kerzen als Box markiert.
Bricht der Kurs danach aus der Box aus, wird in Ausbruchsrichtung gehandelt. Der Stop-Loss liegt auf der anderen
Seite der Box, der Take-Profit im gleichen Abstand (CRV 1:1).

| Datei | Wofür |
|---|---|
| `london_breakout_strategy.pine` | **Backtest** im TradingView-Strategietester (echte Orders, Kontostand, Kennzahlen) |
| `london_breakout_indicator.pine` | **Indikator**: Box, Einstieg/SL/TP-Zonen, Ergebnis je Trade, Alarme, Statistik-Tabelle |
| `backtest.py` | Backtest über viele Jahre mit eigenen Kursdaten (CSV), gleiche Regeln |

## Die Regeln, so wie sie umgesetzt sind

1. **London-Open** = 08:00 Londoner Zeit (= 09:00 deutsche Zeit). Sommer-/Winterzeit wird automatisch berücksichtigt.
2. **Box** = höchstes Hoch und tiefstes Tief der 15-Min-Kerzen 08:00 und 08:15, also 08:00–08:30.
3. **Einstieg**, sobald der Kurs über das Box-High (Long) bzw. unter das Box-Low (Short) läuft.
   Technisch eine Stop-Order 1 Tick jenseits der Box. Alternativ einstellbar: erst wenn eine 15-Min-Kerze außerhalb der Box schließt.
4. **Stop-Loss** = die andere Seite der Box (Long: Box-Low, Short: Box-High).
5. **Take-Profit** = Einstieg ± Abstand zum Stop-Loss (CRV 1:1).
6. **Ein Trade pro Tag.** Löst eine Seite aus, wird die Order auf der anderen Seite gelöscht (kein Umkehr-Trade).

Was du nicht festgelegt hattest, habe ich so voreingestellt (alles in den Einstellungen änderbar):

- Einstieg nur bis **12:00 London**. Gibt es bis dahin keinen Ausbruch, wird an dem Tag nicht gehandelt.
- Noch offene Trades werden um **20:00 London** geschlossen. Das kam im Test nur bei 1 % der Trades vor:
  Die Hälfte der Trades war nach spätestens 1,2 Stunden durch TP oder SL beendet.
- **Positionsgröße** in der Strategie: 1 % Risiko pro Trade vom Konto (Menge = Risiko in $ ÷ Abstand zum Stop-Loss).
- **Kosten** (Spread + Gebühren): 0,30 $ pro Unze für Ein- und Ausstieg zusammen.

## In TradingView einrichten

1. Chart **XAUUSD** öffnen (z. B. `OANDA:XAUUSD` oder den Gold-Kurs deines Brokers), Zeiteinheit **15 Minuten**.
   Kleinere Zeiteinheiten (5m, 1m) gehen auch, größere als 15m nicht.
2. Unten **Pine-Editor** öffnen, ein neues Script anlegen, den kompletten Inhalt von `london_breakout_strategy.pine`
   einfügen, **Speichern** und **Zum Chart hinzufügen**.
3. Unten den **Strategietester** öffnen: Dort stehen Nettogewinn, Trefferquote, Profit-Faktor, Drawdown und die Liste aller Trades.
4. Für den Indikator dasselbe mit `london_breakout_indicator.pine` (als zweites Script).

Wichtig für realistische Ergebnisse:

- **Kosten eintragen.** Strategie-Einstellungen → *Eigenschaften* → *Kommission* (Typ: pro Kontrakt).
  Der Wert gilt pro Order, also **halben Spread eintragen**. Bei XAUUSD-CFDs ist in TradingView 1 Kontrakt = 1 Unze.

  | Spread + Gebühren pro Trade (je Unze) | Eintrag „Kommission“ |
  |---|---|
  | 0,30 $ (gutes ECN-Konto) | 0,15 (Voreinstellung) |
  | 0,60 $ (Standard-Konto) | 0,30 |

- **Wie weit der Test zurückreicht**, hängt von deinem TradingView-Abo ab (Anzahl geladener Kerzen).
  Für mehrere Jahre: *Deep Backtesting* im Strategietester (ab Premium) oder `backtest.py`.
- Ab Premium gibt es in den Eigenschaften den *Bar Magnifier*. Der wertet Kerzen genauer aus. Für diese Strategie
  ändert das fast nichts: Im Test unterschieden sich 15-Min- und 1-Min-Auswertung nur bei 9 von 1.790 Trades.

## Einstellungen

| Gruppe | Einstellung | Standard |
|---|---|---|
| ⏰ Zeiten | Zeitzone | Europe/London |
| | Box-Start | 08:00 |
| | Anzahl 15-Min-Kerzen in der Box | 2 |
| | Einstieg nur bis | 12:00 |
| | Offene Trades zur Uhrzeit schließen / um | an / 20:00 |
| 🎯 Einstieg & Ausstieg | Einstieg | Sofort beim Ausbruch (Stop-Order) · oder Kerzenschluss außerhalb der Box |
| | Richtung | Long & Short · Nur Long · Nur Short |
| | Chance-Risiko-Verhältnis 1 : | 1,0 |
| | Ausbruchs-Puffer in $ | 0 (Einstieg erst X $ jenseits der Box) |
| 💰 Positionsgröße (nur Strategie) | Risiko pro Trade | 1 % vom Konto · oder feste Menge |
| 🧹 Filter | Min. / Max. Boxgröße in $ | aus |
| 📊 Statistik (nur Indikator) | Kosten pro Trade in $ | 0,30 |
| 🎨 Darstellung | Box, Trades, Farben | an |

## Alarme (Indikator)

*Alarm erstellen* → Bedingung: **London Breakout Gold [Box + Signale]** → **Jeder alert()-Funktionsaufruf**.
Du bekommst dann:

- **Box fertig** (08:30): High, Low, Boxgröße und die Einstiegs-, SL- und TP-Kurse für Long und Short,
- **Ausbruch** Long/Short mit Einstieg, SL und TP,
- **Ergebnis**: TP, SL oder Zeit-Exit, jeweils in R.

## Ergebnisse meines Backtests (Jan. 2019 – Mai 2026)

Kursdaten: XAUUSD in 1-Minuten-Kerzen (HistData bis 09.01.2026, danach Tick-Daten bis 22.05.2026, beide Quellen
an den überlappenden Tagen identisch). Ausgewertet mit `backtest.py` auf 1-Minuten-Basis, Regeln wie oben.
**R** = Risiko eines Trades (Abstand Einstieg ↔ Stop-Loss). Bei 1 % Risiko pro Trade ist 1 R ≈ 1 % vom Konto.

| Variante | Trades | Treffer | nötig (Break-even) | Ergebnis | Profit-Faktor | Max. Drawdown | pro Jahr bei 1 % Risiko |
|---|---:|---:|---:|---:|---:|---:|---:|
| Standard, **ohne Kosten** | 1.884 | 53,2 % | 50,0 % | **+116 R** | 1,13 | 25 R | +15,5 % |
| Standard, **0,30 $ Kosten** | 1.884 | 53,2 % | 54,5 % | **−55 R** | 0,94 | 70 R | −8,4 % |
| Standard, 0,60 $ Kosten | 1.884 | 53,2 % | 59,1 % | −227 R | 0,78 | 231 R | −27,4 % |
| Einstieg erst bei Kerzenschluss, 0,30 $ | 1.810 | 50,5 % | 53,6 % | −101 R | 0,89 | 107 R | −13,9 % |
| Nur Long, 0,30 $ | 1.385 | 52,6 % | 54,6 % | −57 R | 0,92 | 65 R | −8,3 % |
| Nur Short, 0,30 $ | 1.289 | 50,0 % | 54,7 % | −121 R | 0,83 | 131 R | −15,8 % |
| Nur Boxen ab 3 $, 0,30 $ | 1.226 | 52,6 % | 52,9 % | −14 R | 0,98 | 53 R | −2,8 % |

| Jahr | Trades | Treffer | Boxgröße (Median) | Ergebnis ohne Kosten | mit 0,30 $ Kosten |
|---|---:|---:|---:|---:|---:|
| 2019 | 250 | 51,2 % | 2,0 $ | +7,9 R | −32,7 R |
| 2020 | 256 | 57,0 % | 4,2 $ | +34,6 R | +13,2 R |
| 2021 | 254 | 50,4 % | 3,2 $ | +0,5 R | −24,7 R |
| 2022 | 255 | 54,5 % | 3,8 $ | +22,5 R | +1,1 R |
| 2023 | 256 | 55,1 % | 2,9 $ | +23,9 R | −3,6 R |
| 2024 | 258 | 51,9 % | 3,8 $ | +10,0 R | −11,8 R |
| 2025 | 255 | 56,1 % | 7,0 $ | +30,1 R | +18,7 R |
| 2026 (bis 22.05.) | 100 | 43,0 % | 14,0 $ | −13,2 R | −15,3 R |

Was das heißt:

- **Vor Kosten hat die Idee einen kleinen Vorteil:** 53 % Treffer bei 1:1 ergeben etwa +0,06 R pro Trade.
- **Die Kosten fressen diesen Vorteil auf.** Bei einer Box von 2–4 $ (typisch 2019–2024) sind 0,30 $ Spread
  8–15 % des Risikos. Dadurch steigt die nötige Trefferquote von 50 % auf gut 54 %. Mit 0,30 $ Kosten ist
  das Ergebnis über 7,4 Jahre negativ.
- Den Spread habe ich in den Tick-Daten 2026 gemessen: Median **0,67 $** zwischen 08 und 12 Uhr London.
  Wie viel du wirklich zahlst, hängt vom Broker und Kontotyp ab, das ist der wichtigste Wert im Backtest.
- Gute Jahre waren 2020, 2022 und 2025, schwach waren 2019, 2021, 2024 und bisher 2026.
- Einstieg per Kerzenschluss, nur Long oder nur Short waren nicht besser. Der Boxgrößen-Filter brachte das
  Ergebnis in die Nähe von null. Solche Filter lassen sich aber leicht „passend rechnen“: Wer sie nutzt,
  sollte sie auf einem Zeitraum festlegen und auf einem anderen prüfen.

Die Zahlen sind ein Backtest auf historischen Daten und keine Anlageberatung. Auf deinem TradingView-Chart
weichen sie leicht ab: anderer Datenfeed, anderer Spread, und je nach Abo ein kürzerer Zeitraum.

## Lässt sich die Strategie verbessern? (Test vom 02.10.2026)

Vorgehen gegen Überanpassung: Ideen wurden nur auf **2019–2022** ausgewählt und danach einmal auf
**2023 – Mai 2026** geprüft. Insgesamt rund 150 Varianten, alle mit 0,30 $ Kosten, Ergebnis in R netto.

**1. Bester Kandidat aus 2019–2022 hält im Prüfzeitraum nicht**

| Variante | 2019–2022 | 2023 – Mai 2026 |
|---|---:|---:|
| Basis (CRV 1:1) | −43 R | −12 R |
| CRV 1:3 + Stop auf Einstand ab +1R | **+59 R** (alle 4 Jahre im Plus) | **−8 R** |
| dasselbe, nur Boxen ab 3 $ | +60 R | −17 R |
| CRV 1:2,5 bzw. 1:4 + Stop auf Einstand | +32 R / +31 R | +7 R / −1 R |

Trendfilter (Vortagesschluss über/unter EMA 10–200), Boxgröße im Verhältnis zur Tages-ATR und ein früheres
oder späteres Einstiegsende brachten schon 2019–2022 nichts.

**2. Andere Ansätze, Bedingung: in beiden Hälften im Plus**

| Variante | 2019–2022 | 2023 – Mai 2026 |
|---|---:|---:|
| Umkehr-Trade nach Fehlausbruch | −101 R | −60 R |
| Nur in Richtung der Asia-Bewegung (00:00–08:30) | −57 R | −16 R |
| Nur gegen die Asia-Bewegung | −51 R | −37 R |
| Box aus 1 Kerze (08:00–08:15) | −136 R | −83 R |
| Box aus 4 Kerzen (08:00–09:00) | −41 R | −6 R |
| Asia-Range 00:00–07:00 als Box | −38 R | +33 R |

Keine Variante besteht.

**3. Der eigentliche Hebel sind die Kosten**

Vor Kosten bringt der Basis-Ausbruch in beiden Zeiträumen fast denselben kleinen Vorteil (+0,065 bzw. +0,058 R
pro Trade). Der Effekt ist also stabil, aber kleiner als übliche CFD-Spreads.

| Kosten je Unze und Trade | 2019–2022 | 2023 – Mai 2026 | gesamt | pro Jahr bei 1 % Risiko | Max. Drawdown |
|---|---:|---:|---:|---:|---:|
| 0,10 $ | +29 R | +30 R | +59 R | +6,9 % | 31 R |
| 0,15 $ | +11 R | +19 R | +31 R | +2,9 % | 34 R |
| 0,20 $ | −7 R | +9 R | +2 R | −1,0 % | 38 R |
| 0,30 $ | −43 R | −12 R | −55 R | −8,4 % | 70 R |

Profitabel war die Strategie nur mit Gesamtkosten unter etwa 0,15–0,20 $ je Unze. Selbst bei 0,10 $ stehen
knapp 7 % pro Jahr einem Drawdown von rund 30 % gegenüber.

## Wie die Scripts geprüft wurden

TradingView selbst ließ sich von hier nicht bedienen. Geprüft wurde deshalb so:

- **Syntax:** beide Scripts mit einem Pine-Parser und einem Pine-v6-Validator, ohne Befund.
- **Indikator:** in [PineTS](https://github.com/LuxAlgo/PineTS) (Open-Source-Nachbau der Pine-Laufzeit) auf denselben
  Kursdaten ausgeführt. Alle 1.790 Trades 2019–2026 stimmen einzeln mit `backtest.py` überein (Einstieg, Ausstieg, Kurs).
  Für drei weitere Einstellungs-Varianten (Kerzenschluss, nur Long/Short, Puffer, Filter, andere Zeitzone) ist die
  Statistik-Tabelle ebenfalls identisch.
- **Strategie:** ebenfalls in PineTS. Im Jahr 2025 an allen 261 Tagen gleicher Handelstag, gleiche Richtung und gleicher
  Einstieg. Die wenigen Abweichungen beim Ausstieg liegen an PineTS (keine OCA-Gruppen, `process_orders_on_close`
  wird ignoriert), nicht an der Strategie.

## Python-Backtest (`backtest.py`)

```bash
pip install pandas numpy
python3 backtest.py daten.csv                        # Standard-Regeln
python3 backtest.py daten.csv --tf 15                # Minutendaten vorher zu 15-Min-Kerzen zusammenfassen
python3 backtest.py daten.csv --mode close           # Einstieg erst beim 15-Min-Schlusskurs
python3 backtest.py daten.csv --direction long --rr 1.5 --cost 0.6 --min-box 3
python3 backtest.py daten.csv --trades trades.csv    # alle Trades als CSV speichern
```

Alle Einstellungen des Pine-Scripts gibt es als Option (`python3 backtest.py --help`).
Kursdaten bekommst du zum Beispiel so:

- **TradingView:** Chart-Menü → *Chartdaten exportieren* (je nach Abo). Spalten `time,open,high,low,close`.
- **histdata.com:** kostenlose XAUUSD-Minutendaten pro Jahr im *MetaTrader*-Format. Das Script erkennt das Format
  und rechnet die New-Yorker Zeitstempel selbst um. Es warnt, falls die tägliche Handelspause nicht bei 22 Uhr London liegt.
