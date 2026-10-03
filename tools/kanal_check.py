#!/usr/bin/env python3
"""Kanal-Check: welche Videos eines YouTube-Kanals laufen und welche nicht (per yt-dlp, ohne API-Schlüssel).

    python3 tools/kanal_check.py                       # eigener Kanal @derhandwerksdoktor
    python3 tools/kanal_check.py @anderer-kanal --out docs/radar/konkurrenz

Schreibt <out>.md: Abonnenten, Aufrufe, Median je Video-Art, Aufrufe pro Tag seit Upload (fairer Vergleich alter und
neuer Videos), stärkste und schwächste Videos, Shorts. Die Video-Art wird grob am Titel erkannt:
A = konkretes Problem/Anleitung, B = Kauf/Vergleich/Rechnung, C = allgemein/Neugier.
YouTube blockiert einzelne Abrufe gelegentlich („kein Bot“), dann fehlen nur diese Videos.
"""
import argparse
import datetime as dt
import json
import statistics
import subprocess
from pathlib import Path

A_WORDS = ["entkalk", "brühgruppe", "brüheinheit", "milchschaum", "lampe", "einricht", "fehler", "geht nicht", "kein kaffee",
           "wässrig", "schwach", "reinigen", "wartung", "zurücksetzen", "wasserfilter", "flusensieb", "pumpt", "entlüft",
           "wird nicht", "klemmt", "kalt", "stinkt", "hält nicht", "ursachen", "reparatur", "beheben", "anleitung"]
B_WORDS = ["vergleich", " vs", "lohnt", "test", "dimension", "btu", "faustformel", "kosten", "günstig", "teuer", "welche"]


def kind(title):
    t = title.lower()
    if any(w in t for w in A_WORDS): return "A"
    if any(w in t for w in B_WORDS): return "B"
    return "C"


def run(args, timeout=1200, german=True):
    lang = ["--extractor-args", "youtube:lang=de", "--add-header", "Accept-Language: de-DE,de;q=0.9"] if german else []
    return subprocess.run(["yt-dlp"] + lang + args, capture_output=True, text=True, timeout=timeout).stdout


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("channel", nargs="?", default="@derhandwerksdoktor")
    ap.add_argument("--out", default="docs/radar/kanal")
    a = ap.parse_args()
    base = f"https://www.youtube.com/{a.channel}"

    print("Videoliste …")
    flat = json.loads(run(["--flat-playlist", "-J", base + "/videos"]) or "{}")
    ids = [e["id"] for e in flat.get("entries", [])]
    subs = flat.get("channel_follower_count")
    if subs is None:   # mit deutschen Feldern fehlt die Abo-Zahl manchmal
        subs = json.loads(run(["--flat-playlist", "-J", "--playlist-items", "1", base + "/videos"], german=False) or "{}").get("channel_follower_count")
    print(f"  {len(ids)} Videos, {subs} Abonnenten. Details je Video …")
    out = run(["--skip-download", "--ignore-no-formats-error", "--sleep-requests", "1", "--print",
               "%(id)s\t%(upload_date)s\t%(view_count)s\t%(like_count)s\t%(comment_count)s\t%(title)s"]
              + [f"https://www.youtube.com/watch?v={i}" for i in ids], timeout=3600)
    today = dt.date.today()
    vids = []
    for line in out.splitlines():
        p = line.split("\t", 5)
        if len(p) < 6 or not p[1].isdigit() or not p[2].isdigit():
            continue
        d = dt.date(int(p[1][:4]), int(p[1][4:6]), int(p[1][6:]))
        age = max(1, (today - d).days)
        vids.append({"id": p[0], "date": d.isoformat(), "age": age, "views": int(p[2]), "per_day": int(p[2]) / age,
                     "likes": p[3], "comments": p[4], "title": p[5], "kind": kind(p[5])})
    shorts = []
    for line in run(["--flat-playlist", "--print", "%(view_count)s\t%(title)s", base + "/shorts"], timeout=300).splitlines():
        v, _, t = line.partition("\t")
        shorts.append({"views": int(v) if v.isdigit() else 0, "title": t})

    total = sum(v["views"] for v in vids)
    old = [v for v in vids if v["age"] > 14]
    L = [f"# Kanal-Check {a.channel} ({today.isoformat()})", "",
         f"- **{subs} Abonnenten**, {len(ids)} lange Videos (ausgewertet: {len(vids)}), {fmt(total)} Aufrufe"
         + (f" → {100 * subs / total:.2f} % Abonnenten pro Aufruf" if subs and total else ""),
         f"- {len(shorts)} Shorts, {fmt(sum(s['views'] for s in shorts))} Aufrufe", "",
         "## Median-Aufrufe je Video-Art (Videos älter als 14 Tage)", "",
         "| Art | Anzahl | Median Aufrufe | Median Aufrufe/Tag |", "|---|---|---|---|"]
    names = {"A": "A konkretes Problem / Anleitung", "B": "B Kauf / Vergleich / Rechnung", "C": "C allgemein / Neugier"}
    for k in "ABC":
        g = [v for v in old if v["kind"] == k]
        if g:
            L.append(f"| {names[k]} | {len(g)} | {fmt(statistics.median(v['views'] for v in g))} | "
                     f"{statistics.median(v['per_day'] for v in g):.1f} |")
    L += ["", "## Stärkste Videos (Aufrufe pro Tag, mind. 7 Tage alt)", "", "| Aufrufe/Tag | Aufrufe | Upload | Art | Titel |", "|---|---|---|---|---|"]
    for v in sorted([v for v in vids if v["age"] >= 7], key=lambda v: -v["per_day"])[:15]:
        L.append(f"| {v['per_day']:.1f} | {fmt(v['views'])} | {v['date']} | {v['kind']} | {v['title']} |")
    L += ["", "## Schwächste Videos (älter als 14 Tage)", "", "| Aufrufe/Tag | Aufrufe | Upload | Art | Titel |", "|---|---|---|---|---|"]
    for v in sorted(old, key=lambda v: v["per_day"])[:10]:
        L.append(f"| {v['per_day']:.1f} | {fmt(v['views'])} | {v['date']} | {v['kind']} | {v['title']} |")
    L += ["", "## Neueste Videos", "", "| Upload | Aufrufe | Aufrufe/Tag | Titel |", "|---|---|---|---|"]
    for v in sorted(vids, key=lambda v: v["date"], reverse=True)[:8]:
        L.append(f"| {v['date']} | {fmt(v['views'])} | {v['per_day']:.1f} | {v['title']} |")
    L += ["", "## Shorts", ""] + [f"- {fmt(s['views'])}: {s['title']}" for s in sorted(shorts, key=lambda s: -s["views"])]
    o = Path(a.out)
    o.parent.mkdir(parents=True, exist_ok=True)
    o.with_suffix(".md").write_text("\n".join(L) + "\n")
    o.with_suffix(".json").write_text(json.dumps({"subs": subs, "videos": vids, "shorts": shorts}, ensure_ascii=False, indent=1))
    print(o.with_suffix(".md"))


def fmt(n):
    return f"{int(n):,}".replace(",", ".")


if __name__ == "__main__":
    main()
