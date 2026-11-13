"""Lädt alle Rohdaten und legt sie als CSV in data/ ab (Cache für analyse.ipynb)."""
import json, time, urllib.request, urllib.parse, pathlib, sys
import pandas as pd

D = pathlib.Path(__file__).parent / "data"; D.mkdir(exist_ok=True)
CITIES = {  # lat, lon, Zeitzone
    "New York": (40.71, -74.01, "America/New_York"), "Chicago": (41.88, -87.63, "America/Chicago"),
    "Houston": (29.76, -95.37, "America/Chicago"), "Boston": (42.36, -71.06, "America/New_York"),
    "Atlanta": (33.75, -84.39, "America/New_York"), "Detroit": (42.33, -83.05, "America/Detroit"),
    "Philadelphia": (39.95, -75.17, "America/New_York")}
MODEL = sys.argv[1] if len(sys.argv) > 1 else "gfs_global"

def get(url, params):
    u = url + "?" + urllib.parse.urlencode(params)
    for i in range(5):
        try:
            with urllib.request.urlopen(u, timeout=120) as r: return json.load(r)
        except Exception as e:
            print("retry", i, e); time.sleep(5 * (i + 1))
    raise RuntimeError(u)

today = pd.Timestamp.utcnow().normalize().tz_localize(None)

# 1) Preise
urllib.request.urlretrieve("https://raw.githubusercontent.com/datasets/natural-gas/main/data/daily.csv", D / "prices.csv")

# 1b) Future NG=F (Yahoo Finance, fortlaufender Frontmonat) – die Datei oben ist der Spotpreis
req = urllib.request.Request("https://query1.finance.yahoo.com/v8/finance/chart/NG=F?period1=1420070400&period2=%d&interval=1d"
                             % int(time.time()), headers={"User-Agent": "Mozilla/5.0"})
(D / "ngf_yahoo.json").write_bytes(urllib.request.urlopen(req, timeout=60).read())

# 2) Beobachtetes Wetter (ERA5-Reanalyse), stündlich in UTC, ab 1991 für die Klimanormale
if not (D / "obs_hourly.csv.gz").exists():
    out = {}
    for c, (la, lo, tz) in CITIES.items():
        parts = []
        for y0 in range(1991, today.year + 1, 6):
            j = get("https://archive-api.open-meteo.com/v1/archive", dict(latitude=la, longitude=lo,
                start_date=f"{y0}-01-01", end_date=min(pd.Timestamp(f"{y0+5}-12-31"), today - pd.Timedelta(days=1)).date(),
                hourly="temperature_2m", temperature_unit="fahrenheit", timezone="GMT"))
            parts.append(pd.Series(j["hourly"]["temperature_2m"], index=pd.to_datetime(j["hourly"]["time"])))
            time.sleep(1)
        out[c] = pd.concat(parts); print("obs", c, len(out[c]))
    pd.DataFrame(out).to_csv(D / "obs_hourly.csv.gz", index_label="time_utc")

# 3) Prognosen früherer Modellläufe (Vorlauf 1 bis 7 Tage), stündlich in UTC
f = D / f"fc_hourly_{MODEL}.csv.gz"
if not f.exists():
    vars_ = [f"temperature_2m_previous_day{n}" for n in range(1, 8)]
    frames = []
    for c, (la, lo, tz) in CITIES.items():
        parts = []
        for y in range(2021, today.year + 1):
            j = get("https://previous-runs-api.open-meteo.com/v1/forecast", dict(latitude=la, longitude=lo,
                start_date=f"{y}-01-01", end_date=min(pd.Timestamp(f"{y}-12-31"), today + pd.Timedelta(days=7)).date(),
                hourly=",".join(vars_), models=MODEL, temperature_unit="fahrenheit", timezone="GMT"))
            h = pd.DataFrame(j["hourly"]); h["time"] = pd.to_datetime(h["time"]); parts.append(h.set_index("time"))
            time.sleep(1)
        df = pd.concat(parts); df.columns = [f"{c}|{n}" for n in range(1, 8)]; frames.append(df); print("fc", c, len(df))
    pd.concat(frames, axis=1).to_csv(f, index_label="time_utc")
