#!/usr/bin/env python3
"""Nischen-Scan: vergleicht ganze Themenfelder für eine neue Affiliate-Seite.

    python3 tools/nischen_scan.py blog/seo/nischen.json > blog/seo/nischen-ranking.md

Eingabe (JSON): {"Nische": ["seed 1", "seed 2", ...], ...}

Pro Seed:
- Google-Vorschläge (Autovervollständigung, Seed + a–z): wie breit der Long-Tail ist
- YouTube-Suche (yt-dlp, Top 8): Aufrufe der besten Videos = belegte Nachfrage
- wie viele der Top-8-Videos von kleinen Kanälen stammen (< 10.000 Aufrufe Median wäre schwach, darum nur Info)

Ergebnisse landen im Cache blog/seo/.nischen-cache.json, damit ein zweiter Lauf nichts neu abfragt.
"""
import json
import pathlib
import statistics
import subprocess
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'blog/seo/.nischen-cache.json'
SUGGEST = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=de&gl=de&q='


def vorschlaege(seed):
    gefunden = set()
    for e in [''] + list('abcdefghijklmnopqrstuvwxyz'):
        q = f'{seed} {e}'.strip()
        try:
            req = urllib.request.Request(SUGGEST + urllib.parse.quote(q), headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as r:
                gefunden.update(json.loads(r.read().decode('utf-8', 'replace'))[1])
        except Exception:
            pass
        time.sleep(0.25)
    gefunden.discard(seed)
    return sorted(gefunden)


def youtube(seed):
    try:
        out = subprocess.run(['yt-dlp', '--flat-playlist', '-j', f'ytsearch8:{seed}'],
                             capture_output=True, text=True, timeout=90).stdout
    except subprocess.TimeoutExpired:
        return []
    return [{'views': d.get('view_count') or 0, 'title': d.get('title'), 'channel': d.get('channel')}
            for d in map(json.loads, out.splitlines())]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    nischen = json.load(open(sys.argv[1], encoding='utf-8'))
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    for seeds in nischen.values():
        for s in seeds:
            if s in cache:
                continue
            print(f'… {s}', file=sys.stderr)
            cache[s] = {'google': vorschlaege(s), 'youtube': youtube(s)}
            CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1))

    zeilen = []
    for name, seeds in nischen.items():
        breite = sum(len(cache[s]['google']) for s in seeds) / len(seeds)
        medians = []
        for s in seeds:
            views = sorted((v['views'] for v in cache[s]['youtube']), reverse=True)[:5]
            medians.append(statistics.median(views) if views else 0)
        zeilen.append((statistics.median(medians), breite, name, seeds, medians))
    zeilen.sort(key=lambda z: -z[0])

    print('# Nischen-Ranking\n')
    print(f'Erstellt am {time.strftime("%d.%m.%Y")} mit `tools/nischen_scan.py`.')
    print('YouTube = Median der Aufrufe der Top-5-Videos je Seed, davon der Median über alle Seeds der Nische.')
    print('Long-Tail = durchschnittliche Zahl verschiedener Google-Vorschläge je Seed (Seed + a–z, max. ca. 270).\n')
    print('| # | Nische | YouTube-Nachfrage | Long-Tail | Seeds (Median Top-5-Aufrufe) |')
    print('|---|---|---|---|---|')
    for i, (yt, breite, name, seeds, medians) in enumerate(zeilen, 1):
        detail = ' · '.join(f'{s} ({m / 1000:.0f} Tsd)' for s, m in zip(seeds, medians))
        print(f'| {i} | {name} | **{yt / 1000:.0f} Tsd** | {breite:.0f} | {detail} |')


if __name__ == '__main__':
    main()
