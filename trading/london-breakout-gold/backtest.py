#!/usr/bin/env python3
"""London-Breakout-Backtest für Gold (XAUUSD) mit denselben Regeln wie die TradingView-Scripts.

Regeln (Standard, alles per Option änderbar):
    1. Box = High/Low der ersten zwei 15-Min-Kerzen ab 08:00 London (also 08:00–08:30).
    2. Ausbruch über das High → Long, unter das Low → Short (Stop-Order 1 Tick jenseits der Box).
    3. Stop-Loss = andere Seite der Box, Take-Profit = CRV × Risiko (Standard 1:1).
    4. Höchstens 1 Trade pro Tag, Einstieg nur bis 12:00, offene Trades um 20:00 schließen.

Innerhalb einer Kerze gilt dieselbe Annahme wie im TradingView-Strategietester:
Open näher am High → Open → High → Low → Close, sonst Open → Low → High → Close.
Mit 1-Minuten-Daten ist das Ergebnis genauer als mit 15-Minuten-Kerzen.

Aufruf:
    python3 backtest.py daten.csv                       # TradingView-Export oder HistData-M1-CSV
    python3 backtest.py daten.csv --tf 15               # vorher auf 15-Min-Kerzen zusammenfassen
    python3 backtest.py daten.csv --mode close          # Einstieg erst beim 15-Min-Schlusskurs
    python3 backtest.py daten.csv --trades trades.csv   # alle Trades als CSV speichern

Datenformate:
    TradingView "Chartdaten exportieren": Spalten time,open,high,low,close
        (time als UNIX-Sekunden oder ISO-Datum mit Zeitzone)
    HistData.com "MetaTrader"-Format (M1): 2024.07.05,16:59,open,high,low,close,vol
        (Zeitstempel in New-Yorker Ortszeit, geprüft an der täglichen Handelspause)
"""
import argparse
import math
import sys
from dataclasses import dataclass, fields, replace

import numpy as np
import pandas as pd


@dataclass
class Params:
    tz: str = "Europe/London"
    box_hour: int = 8
    box_minute: int = 0
    box_bars: int = 2             # Anzahl 15-Min-Kerzen in der Box
    end_hour: int = 12            # Einstieg nur bis ...
    end_minute: int = 0
    use_exit: bool = True         # offene Trades zur Uhrzeit schließen
    exit_hour: int = 20
    exit_minute: int = 0
    mode: str = "stop"            # "stop" = sofort beim Ausbruch, "close" = 15-Min-Schlusskurs
    direction: str = "both"       # "both", "long", "short"
    rr: float = 1.0               # Chance-Risiko-Verhältnis 1 : rr
    buffer: float = 0.0           # Ausbruchs-Puffer in $
    min_box: float = 0.0          # 0 = aus
    max_box: float = 0.0          # 0 = aus
    tick: float = 0.0             # kleinste Preisstufe (syminfo.mintick), 0 = aus den Daten erkennen
    cost: float = 0.30            # Spread + Gebühren in $ pro Unze (hin und zurück)
    same_bar_exit: bool = True    # SL/TP schon auf der Einstiegskerze möglich (wie TradingView)


def load_csv(path):
    """Liest einen TradingView-Export oder eine HistData-M1-Datei, Index in UTC."""
    with open(path, encoding="utf8", errors="replace") as f:
        first = f.readline()
    if first[:4].isdigit() and first[4:5] == ".":
        df = pd.read_csv(path, header=None, names=["date", "time", "open", "high", "low", "close", "vol"])
        ts = pd.to_datetime(df["date"] + " " + df["time"], format="%Y.%m.%d %H:%M")
        idx = ts.dt.tz_localize("America/New_York", ambiguous="NaT", nonexistent="NaT").dt.tz_convert("UTC")
    else:
        df = pd.read_csv(path)
        df.columns = [c.strip().lower() for c in df.columns]
        t = df["time"] if "time" in df.columns else df[df.columns[0]]
        idx = pd.to_datetime(t, unit="s", utc=True) if np.issubdtype(t.dtype, np.number) else pd.to_datetime(t, utc=True)
    bars = pd.DataFrame({c: df[c].astype(float).to_numpy() for c in ("open", "high", "low", "close")},
                        index=pd.DatetimeIndex(idx))
    bars = bars[bars.index.notna()]
    return bars[~bars.index.duplicated()].sort_index()


def check_session_gap(bars, tz="Europe/London"):
    """Gold pausiert täglich 22–23 Uhr London. Liegt die Pause woanders, stimmt die Zeitzone nicht."""
    loc = bars.index.tz_convert(tz)
    weekdays = loc.dayofweek < 4
    hours = pd.Series(loc.hour[weekdays]).value_counts()
    if len(hours) < 20:
        return
    gap = hours.idxmin()
    if gap != 22:
        print(f"WARNUNG: Die tägliche Handelspause liegt bei {gap}:00 statt 22:00 London. "
              "Zeitzone der Daten prüfen!", file=sys.stderr)


def detect_tick(bars):
    """Größte Preisstufe, auf der alle Kurse liegen (z. B. 0.001 bei 3 Nachkommastellen)."""
    prices = bars[["open", "high", "low", "close"]].to_numpy().ravel()[:200000]
    for tick in (1.0, 0.1, 0.01, 0.001, 0.0001, 0.00001):
        if np.allclose(np.round(prices / tick) * tick, prices, rtol=0, atol=tick * 1e-3):
            return tick
    return 0.00001


def resample(bars, minutes):
    rule = f"{minutes}min"
    out = bars.resample(rule, label="left", closed="left").agg(
        {"open": "first", "high": "max", "low": "min", "close": "last"})
    return out.dropna()


def round_to_tick(x, tick):
    """Wie math.round_to_mintick in Pine: auf den nächsten Tick, halbe Ticks aufrunden."""
    digits = len(f"{tick:.10f}".rstrip("0").split(".")[1])
    return round(math.floor(x / tick + 0.5) * tick, digits)


def backtest(bars, p=Params()):
    """Spielt die Regeln Kerze für Kerze durch. Gibt eine Tabelle aller Trades zurück."""
    if p.tick <= 0:
        p = replace(p, tick=detect_tick(bars))
    tf_min = int(bars.index.to_series().diff().dropna().mode().iloc[0] / pd.Timedelta(minutes=1))
    loc = bars.index.tz_convert(p.tz).tz_localize(None)
    t_open = loc.to_numpy().astype("datetime64[m]").astype(np.int64)      # Ortszeit in Minuten
    t_close = t_open + tf_min
    day = loc.normalize().to_numpy().astype("datetime64[m]").astype(np.int64)
    box_start = day + p.box_hour * 60 + p.box_minute
    box_end = box_start + p.box_bars * 15
    entry_end = day + p.end_hour * 60 + p.end_minute
    t_exit = day + p.exit_hour * 60 + p.exit_minute
    in_box = (t_open >= box_start) & (t_open < box_end)
    O, H, L, C = (bars[c].to_numpy(float) for c in ("open", "high", "low", "close"))
    stop_mode = p.mode == "stop"
    allow_long = p.direction != "short"
    allow_short = p.direction != "long"

    box_hi = box_lo = np.nan
    box_done = armed = traded = False
    arm_bar = -1
    long_entry = short_entry = long_sl = short_sl = long_tp = short_tp = np.nan
    pos = 0
    entry_px = sl_px = tp_px = np.nan
    entry_i = -1
    trades = []

    for i in range(len(O)):
        # 1) Box aufbauen
        new_box = in_box[i] and not (i > 0 and in_box[i - 1])
        if new_box:
            box_hi, box_lo = H[i], L[i]
            box_done = armed = traded = False
        elif in_box[i]:
            box_hi, box_lo = max(box_hi, H[i]), min(box_lo, L[i])

        # 2) Kerze durchspielen: Stop-Orders, Stop-Loss, Take-Profit
        orders_live = stop_mode and armed and not traded and pos == 0 and i > arm_bar
        ev_entry = ev_exit = 0
        exit_px = np.nan
        high_first = H[i] - O[i] <= O[i] - L[i]
        path = (H[i], L[i], C[i]) if high_first else (L[i], H[i], C[i])
        a = O[i]
        if orders_live:
            if allow_long and a >= long_entry:
                ev_entry = 1
            elif allow_short and a <= short_entry:
                ev_entry = -1
            if ev_entry:
                pos, entry_px, entry_i = ev_entry, a, i
                sl_px, tp_px = (long_sl, long_tp) if ev_entry == 1 else (short_sl, short_tp)
        if pos != 0 and (p.same_bar_exit or entry_i != i):
            if pos * (a - sl_px) <= 0:
                ev_exit, exit_px = -1, a
            elif pos * (a - tp_px) >= 0:
                ev_exit, exit_px = 1, a
        for b in path:
            if ev_exit:
                break
            if orders_live and ev_entry == 0:
                if b > a and allow_long and a <= long_entry <= b:
                    ev_entry = 1
                elif b < a and allow_short and b <= short_entry <= a:
                    ev_entry = -1
                if ev_entry:
                    pos, entry_i = ev_entry, i
                    entry_px = long_entry if ev_entry == 1 else short_entry
                    sl_px, tp_px = (long_sl, long_tp) if ev_entry == 1 else (short_sl, short_tp)
            if pos != 0 and (p.same_bar_exit or entry_i != i):
                towards_tp = pos * (b - a) > 0
                if towards_tp and pos * (b - tp_px) >= 0:
                    ev_exit, exit_px = 1, tp_px
                elif not towards_tp and b != a and pos * (b - sl_px) <= 0:
                    ev_exit, exit_px = -1, sl_px
            a = b

        # 3) Zeit-Exit zum Kerzenschluss
        if ev_exit == 0 and pos != 0 and p.use_exit and t_close[i] >= t_exit[i]:
            ev_exit, exit_px = 2, C[i]

        # 4) Einstieg per 15-Min-Schlusskurs
        close_of_15m = (t_close[i] - box_start[i]) % 15 == 0
        if (not stop_mode and armed and not traded and pos == 0 and i > arm_bar
                and t_open[i] < entry_end[i] and close_of_15m):
            if allow_long and C[i] > box_hi + p.buffer:
                ev_entry, tp_px = 1, round_to_tick(C[i] + (C[i] - long_sl) * p.rr, p.tick)
            elif allow_short and C[i] < box_lo - p.buffer:
                ev_entry, tp_px = -1, round_to_tick(C[i] - (short_sl - C[i]) * p.rr, p.tick)
            if ev_entry:
                pos, entry_px, entry_i = ev_entry, C[i], i
                sl_px = long_sl if ev_entry == 1 else short_sl

        # 5) Trades verbuchen
        if ev_entry:
            traded = True
        if ev_exit:
            risk = abs(entry_px - sl_px)
            r = (pos * (exit_px - entry_px) - p.cost) / risk if risk > 0 else 0.0
            trades.append({
                "datum": pd.Timestamp(day[entry_i], unit="m").date(),
                "richtung": "Long" if pos == 1 else "Short",
                "einstieg_zeit": bars.index[entry_i], "einstieg": entry_px,
                "sl": sl_px, "tp": tp_px,
                "ausstieg_zeit": bars.index[i], "ausstieg": exit_px,
                "art": {1: "TP", -1: "SL", 2: "Zeit-Exit"}[ev_exit],
                "box": short_sl - long_sl,
                "kosten_r": p.cost / risk if risk > 0 else 0.0,
                "r": r,
            })
            pos = 0

        # 6) Einstiegsfenster vorbei
        if armed and t_close[i] >= entry_end[i]:
            armed = False

        # 7) Box fertig → Ausbruchs-Levels setzen
        box_complete = not box_done and ((in_box[i] and t_close[i] >= box_end[i])
                                         or (not in_box[i] and i > 0 and in_box[i - 1]))
        if box_complete:
            box_done = True
            rng = box_hi - box_lo
            size_ok = rng > 0 and (p.min_box <= 0 or rng >= p.min_box) and (p.max_box <= 0 or rng <= p.max_box)
            if size_ok and pos == 0 and box_end[i] < entry_end[i]:
                armed, arm_bar = True, i
                long_sl, short_sl = box_lo, box_hi
                long_entry = round_to_tick(box_hi + p.buffer + p.tick, p.tick)
                short_entry = round_to_tick(box_lo - p.buffer - p.tick, p.tick)
                long_tp = round_to_tick(long_entry + (long_entry - long_sl) * p.rr, p.tick)
                short_tp = round_to_tick(short_entry - (short_sl - short_entry) * p.rr, p.tick)

    return pd.DataFrame(trades)


def stats(tr, rr=1.0, risk_pct=1.0):
    """Kennzahlen in R (1 R = Abstand Einstieg ↔ Stop-Loss)."""
    if len(tr) == 0:
        return {"trades": 0}
    r = tr["r"].to_numpy()
    eq = np.cumsum(r)
    gross_win, gross_loss = r[r > 0].sum(), -r[r <= 0].sum()
    years = max((pd.Timestamp(tr["datum"].iloc[-1]) - pd.Timestamp(tr["datum"].iloc[0])).days / 365.25, 1e-9)
    compounded = np.prod(1 + risk_pct / 100 * r)
    return {
        "trades": len(r),
        "tp": int((tr["art"] == "TP").sum()), "sl": int((tr["art"] == "SL").sum()),
        "zeit": int((tr["art"] == "Zeit-Exit").sum()),
        "trefferquote": 100 * (r > 0).mean(),
        "summe_r": eq[-1], "r_pro_trade": r.mean(),
        "profit_faktor": gross_win / gross_loss if gross_loss > 0 else np.inf,
        "max_dd_r": (np.maximum.accumulate(np.concatenate([[0], eq])) - np.concatenate([[0], eq])).max(),
        "break_even": 100 * (1 + tr["kosten_r"].mean()) / (1 + rr),
        "rendite_pa": 100 * (compounded ** (1 / years) - 1),
    }


def print_report(tr, p, title=""):
    s = stats(tr, p.rr)
    if s["trades"] == 0:
        print("Keine Trades.")
        return
    print(f"\n{title}")
    print(f"  Zeitraum        {tr['datum'].iloc[0]} – {tr['datum'].iloc[-1]}")
    print(f"  Trades          {s['trades']}  (TP {s['tp']} · SL {s['sl']} · Zeit-Exit {s['zeit']})")
    print(f"  Trefferquote    {s['trefferquote']:.1f} %   (Break-even inkl. Kosten: {s['break_even']:.1f} %)")
    print(f"  Ergebnis        {s['summe_r']:+.1f} R   (Ø {s['r_pro_trade']:+.3f} R pro Trade)")
    print(f"  Profit-Faktor   {s['profit_faktor']:.2f}")
    print(f"  Max. Drawdown   -{s['max_dd_r']:.1f} R")
    print(f"  Bei 1 % Risiko  {s['rendite_pa']:+.1f} % pro Jahr (mit Zinseszins)")
    by_year = tr.assign(jahr=pd.to_datetime(tr["datum"]).dt.year).groupby("jahr")["r"]
    print("\n  Jahr   Trades  Treffer   Summe R")
    for year, r in by_year:
        print(f"  {year}   {len(r):5d}  {100 * (r > 0).mean():6.1f} %  {r.sum():+8.1f}")


def main():
    ap = argparse.ArgumentParser(description="London-Breakout-Backtest für Gold")
    ap.add_argument("csv", help="TradingView-Export oder HistData-M1-CSV")
    ap.add_argument("--tf", type=int, default=0, help="auf N-Minuten-Kerzen zusammenfassen (z. B. 15)")
    ap.add_argument("--trades", help="Trades als CSV speichern")
    for f in fields(Params):
        flag = "--" + f.name.replace("_", "-")
        if f.type in ("bool", bool):
            ap.add_argument(flag, type=lambda s: s.lower() in ("1", "true", "ja", "yes"), default=f.default)
        else:
            ap.add_argument(flag, type=type(f.default), default=f.default)
    args = ap.parse_args()
    p = Params(**{f.name: getattr(args, f.name) for f in fields(Params)})

    bars = load_csv(args.csv)
    check_session_gap(bars, p.tz)
    if p.tick <= 0:
        p.tick = detect_tick(bars)
    if args.tf:
        bars = resample(bars, args.tf)
    tr = backtest(bars, p)
    print_report(tr, p, f"London Breakout · {args.csv} · Einstieg: {p.mode} · CRV 1:{p.rr:g} · Kosten {p.cost:g} $")
    if args.trades:
        tr.to_csv(args.trades, index=False)
        print(f"\n  Trades gespeichert: {args.trades}")


if __name__ == "__main__":
    main()
