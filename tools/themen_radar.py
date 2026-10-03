#!/usr/bin/env python3
"""Themen-Radar: findet Video-Themen mit echter Suchnachfrage.

    python3 tools/themen_radar.py "heizung" "heizkörper" --top 15 --out projects/_radar/heizung

Schritte:
1. YouTube-Suchvorschläge (öffentlicher Endpunkt suggestqueries.google.com, Sprache/Land DE) für jedes Stichwort,
   erweitert um „a“ … „z“. Je weiter vorn ein Vorschlag steht und je öfter er kommt, desto höher die Punktzahl.
2. Für die besten Vorschläge: YouTube-Suche per yt-dlp (Aufrufe der Top-Videos, Kanäle, ob wir schon dabei sind).
3. Kommentare der stärksten Videos (yt-dlp): Fragen der Zuschauer = Folgethemen.
4. Saison per Google Trends (trendspyg, YouTube-Suche, Deutschland, 5 Jahre): in welchen Monaten gesucht wird.

Schreibt <out>.md (Bericht) und <out>.json (Rohdaten).
Ohne API-Schlüssel. YouTube blockiert einzelne Abrufe gelegentlich („kein Bot“), das Werkzeug läuft dann einfach weiter.
"""
import argparse
import json
import math
import os
import statistics
import subprocess
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

OWN = "Der Handwerksdoktor"
MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]


def suggestions(q):
    url = "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=de&gl=de&q=" + urllib.parse.quote(q)
    with urllib.request.urlopen(url, timeout=15) as r:
        return json.loads(r.read().decode("utf-8", "replace"))[1]


def collect(seeds):
    score = defaultdict(float)
    for seed in seeds:
        for suf in [""] + [" " + c for c in "abcdefghiklmnoprstuvwz"]:
            try:
                for rank, s in enumerate(suggestions(seed + suf)):
                    s = s.strip().lower()
                    if s and s != seed.lower() and all(w in s for w in seed.lower().split()):
                        score[s] += 10 - rank
            except Exception as e:
                print(f"  Vorschläge für „{seed + suf}“ fehlgeschlagen: {e}")
            time.sleep(0.15)
    return sorted(score.items(), key=lambda kv: -kv[1])


def ytsearch(q, n=8):
    cmd = ["yt-dlp", "--flat-playlist", "--extractor-args", "youtube:lang=de",
           "--print", "%(id)s\t%(view_count)s\t%(channel)s\t%(duration)s\t%(title)s", f"ytsearch{n}:{q}"]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=90).stdout
    rows = []
    for line in out.splitlines():
        p = line.split("\t", 4)
        if len(p) == 5:
            rows.append({"id": p[0], "views": int(p[1]) if p[1].isdigit() else 0, "channel": p[2],
                         "duration": p[3], "title": p[4]})
    return rows


def questions(video_id, limit=200):
    tmp = Path("/tmp") / f"radar_{video_id}"
    cmd = ["yt-dlp", "--skip-download", "--ignore-no-formats-error", "--write-comments", "--no-write-thumbnail",
           "--extractor-args", f"youtube:max_comments={limit},all,0,0;comment_sort=top;lang=de",
           "-o", str(tmp) + ".%(ext)s", f"https://www.youtube.com/watch?v={video_id}"]
    subprocess.run(cmd, capture_output=True, text=True, timeout=240)
    f = Path(str(tmp) + ".info.json")
    if not f.exists():
        return []
    cs = json.loads(f.read_text()).get("comments") or []
    f.unlink()
    qs = [c for c in cs if "?" in c.get("text", "") and 25 <= len(c["text"]) <= 280]
    qs.sort(key=lambda c: -(c.get("like_count") or 0))
    return [{"text": c["text"].replace("\n", " "), "likes": c.get("like_count") or 0} for c in qs]


def season(phrases):
    """Monatsprofil (0–100) je Suchbegriff aus Google Trends, YouTube-Suche Deutschland, 5 Jahre."""
    # Der chromedriver unter /opt/node22/bin passt nicht zu Selenium-Chrome: aus dem PATH nehmen,
    # dann lädt Selenium den passenden Treiber selbst.
    os.environ["PATH"] = ":".join(p for p in os.environ["PATH"].split(":") if "/opt/node22/bin" not in p)
    try:
        import trendspyg
    except ImportError:
        print("  trendspyg fehlt (pip install trendspyg)")
        return {}
    try:
        r = trendspyg.download_google_trends_comparison(list(phrases)[:5], geo="DE", timeframe="today 5-y",
                                                        gprop="youtube", max_retries=3, retry_wait=4)
    except Exception as e:
        print(f"  Google Trends fehlgeschlagen: {type(e).__name__}: {str(e)[:200]}")
        return {}
    mon = defaultdict(lambda: defaultdict(list))
    for p in r.get("interest_over_time", []):
        m = int(str(p["date"])[5:7])
        for k, v in (p.get("values") or {}).items():
            if isinstance(v, (int, float)):
                mon[k][m].append(v)
    return {k: [round(statistics.mean(mon[k][m]), 1) if mon[k][m] else 0 for m in range(1, 13)] for k in mon}


def fmt(n):
    return f"{n:,}".replace(",", ".")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("seeds", nargs="+", help="Stichworte, z. B. „heizung“ „philips lattego“")
    ap.add_argument("--top", type=int, default=15, help="so viele Vorschläge in der YouTube-Suche prüfen")
    ap.add_argument("--comments", type=int, default=3, help="Kommentare der stärksten N Themen auswerten")
    ap.add_argument("--no-trends", action="store_true", help="Google Trends überspringen")
    ap.add_argument("--out", default="radar", help="Ausgabe ohne Endung (schreibt .md und .json)")
    a = ap.parse_args()

    print(f"1/4 Suchvorschläge für {', '.join(a.seeds)} …")
    sug = collect(a.seeds)
    print(f"    {len(sug)} Vorschläge")

    print(f"2/4 YouTube-Suche für die besten {a.top} …")
    topics = []
    for phrase, sc in sug[: a.top]:
        try:
            res = ytsearch(phrase)
        except Exception as e:
            print(f"  Suche „{phrase}“ fehlgeschlagen: {e}")
            continue
        views = sorted((r["views"] for r in res), reverse=True)
        own = [r for r in res if OWN.lower() in r["channel"].lower()]
        demand = statistics.median(views[:5]) if views else 0
        topics.append({"phrase": phrase, "suggest_score": sc, "top_views": views[:3], "demand": demand,
                       "own": [{"title": r["title"], "views": r["views"]} for r in own],
                       "results": res, "potential": round(math.log10(demand + 1) * (1 + sc / 100), 2)})
        print(f"    {phrase:55s} Nachfrage {fmt(int(demand)):>10}" + ("  (wir sind schon dabei)" if own else ""))
        time.sleep(0.5)
    topics.sort(key=lambda t: -t["potential"])

    print(f"3/4 Kommentare der stärksten {a.comments} Themen …")
    for t in topics[: a.comments]:
        best = max(t["results"], key=lambda r: r["views"], default=None)
        t["questions"] = questions(best["id"]) if best else []
        t["questions_from"] = best["title"] if best else ""
        print(f"    {t['phrase']}: {len(t['questions'])} Fragen")

    seas = {}
    if not a.no_trends:
        print("4/4 Saison (Google Trends) …")
        seas = season([t["phrase"] for t in topics[:5]])
        for t in topics:
            if t["phrase"] in seas:
                prof = seas[t["phrase"]]
                t["season"] = prof
                t["peak"] = [MONTHS[i] for i in sorted(range(12), key=lambda i: -prof[i])[:3] if prof[i] > 0]

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".json").write_text(json.dumps({"seeds": a.seeds, "suggestions": sug, "topics": topics},
                                                   ensure_ascii=False, indent=1))
    L = [f"# Themen-Radar: {', '.join(a.seeds)}", "",
         f"{len(sug)} Suchvorschläge. Nachfrage = Median der Aufrufe der Top-5-Videos in der YouTube-Suche.", "",
         "| # | Thema (so wird gesucht) | Nachfrage | Top-Videos | Saison-Spitze | Wir schon dabei? |", "|---|---|---|---|---|---|"]
    for i, t in enumerate(topics, 1):
        own = "; ".join(f"ja ({fmt(o['views'])})" for o in t["own"]) or "nein"
        L.append(f"| {i} | {t['phrase']} | {fmt(int(t['demand']))} | {' · '.join(fmt(v) for v in t['top_views'])} | "
                 f"{', '.join(t.get('peak', [])) or '–'} | {own} |")
    for t in topics:
        if t.get("questions"):
            L += ["", f"## Fragen der Zuschauer: {t['phrase']}", f"aus den Kommentaren zu „{t['questions_from']}“", ""]
            L += [f"- {q['text'][:220]}" + (f" ({q['likes']} Likes)" if q["likes"] else "") for q in t["questions"][:12]]
    if seas:
        L += ["", "## Saison (Google Trends, YouTube-Suche Deutschland, Monatsmittel über 5 Jahre)", "",
              "| Suche | " + " | ".join(MONTHS) + " |", "|---|" + "---|" * 12]
        L += [f"| {k} | " + " | ".join(f"{v:.0f}" for v in prof) + " |" for k, prof in seas.items()]
    L += ["", "Weitere Vorschläge: " + ", ".join(p for p, _ in sug[a.top: a.top + 60])]
    out.with_suffix(".md").write_text("\n".join(L) + "\n")
    print(out.with_suffix(".md"))


if __name__ == "__main__":
    main()
