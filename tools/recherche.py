#!/usr/bin/env python3
"""Recherche für einen Beitrag: was andere YouTube-Videos und Reddit-Diskussionen zu einem Maschinen-Problem sagen.

    python3 tools/recherche.py delonghi-magnifica-s-entkalken \\
        --youtube "delonghi magnifica s entkalken" "magnifica s entkalken rote lampe" \\
        --reddit "magnifica entkalken" "magnifica descale" --muss "descal|entkalk"

Ergebnis in kaffee/recherche/<slug>/:
  quellen.md        alle gefundenen Videos und Threads mit Link, Aufrufen bzw. Kommentarzahl (kommt ins Repo)
  roh/              Transkripte und Reddit-Texte zum Auswerten (NICHT ins Repo, fremde Inhalte, siehe .gitignore)

Die Rohtexte sind nur zum Auswerten da: Welche Ursachen und Lösungen nennen viele unabhängig voneinander, wo widersprechen
sie sich, was davon steht auch in der Bedienungsanleitung? Im Beitrag wird nichts davon wörtlich übernommen.

Technik (in dieser Cloud-Umgebung getestet am 03.10.2026):
- YouTube-Suche: yt-dlp „ytsearch“. Untertitel: yt-dlp mit player_client=web_embedded (andere Clients sind gesperrt),
  nur deutsche Untertitel, mit Pausen, sonst antwortet YouTube mit 429.
- Reddit: die JSON-Schnittstelle ist für Cloud-Server gesperrt (403). Suche daher über das Archiv PullPush
  (api.pullpush.io) und Reddits RSS-Suche. Kommentare kommen aus PullPush.
"""
import argparse
import html
import json
import pathlib
import re
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'Mozilla/5.0 (vollautomatendoktor.de Recherche)'}
EIGENER_KANAL = 'Der Handwerksdoktor'


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', 'replace')


def youtube_suche(q, n=15):
    out = subprocess.run(['yt-dlp', '--flat-playlist', '-j', f'ytsearch{n}:{q}'], capture_output=True, text=True, timeout=180).stdout
    return [{'id': d['id'], 'titel': d.get('title') or '', 'kanal': d.get('channel') or '', 'aufrufe': d.get('view_count') or 0,
             'dauer': d.get('duration') or 0} for d in map(json.loads, out.splitlines())]


def vtt_text(pfad):
    zeilen, letzte = [], ''
    for z in pathlib.Path(pfad).read_text(errors='replace').splitlines():
        if '-->' in z or not z.strip() or z.startswith(('WEBVTT', 'Kind:', 'Language:')):
            continue
        z = html.unescape(re.sub(r'<[^>]+>', '', z)).strip()
        if z and z != letzte:
            zeilen.append(z)
            letzte = z
    # Automatische Untertitel wiederholen Zeilen versetzt: doppelte Folgen entfernen.
    text = ' '.join(zeilen)
    return re.sub(r'\b(\w+(?: \w+){2,8}) \1\b', r'\1', text)


def transkript(vid, ziel):
    datei = ziel / f'{vid}.txt'
    if datei.exists():
        return datei.read_text()
    tmp = ziel / f'_{vid}'
    subprocess.run(['yt-dlp', '--skip-download', '--ignore-no-formats-error', '--write-auto-subs', '--write-subs',
                    '--sub-langs', 'de,de-orig,de-DE', '--sub-format', 'vtt',
                    '--extractor-args', 'youtube:player_client=web_embedded', '-o', str(tmp), f'https://www.youtube.com/watch?v={vid}'],
                   capture_output=True, text=True, timeout=180)
    vtts = sorted(ziel.glob(f'_{vid}*.vtt'))
    if not vtts:
        return ''
    text = vtt_text(vtts[0])
    for v in vtts:
        v.unlink()
    datei.write_text(text)
    return text


def reddit_suche(q):
    funde = {}
    try:
        d = json.loads(get('https://api.pullpush.io/reddit/search/submission/?' + urllib.parse.urlencode({'q': q, 'size': 50})))
        for p in d.get('data', []):
            funde[p['id']] = {'id': p['id'], 'titel': p.get('title', ''), 'sub': p.get('subreddit', ''), 'kommentare': p.get('num_comments', 0),
                              'score': p.get('score', 0), 'text': p.get('selftext', ''), 'link': 'https://www.reddit.com' + p.get('permalink', ''),
                              'datum': time.strftime('%Y-%m-%d', time.gmtime(p.get('created_utc', 0)))}
    except Exception as e:
        print(f'PullPush „{q}“: {e}')
    try:
        rss = get('https://www.reddit.com/search.rss?' + urllib.parse.urlencode({'q': q, 'sort': 'relevance', 'limit': 50}))
        for eintrag in rss.split('<entry>')[1:]:
            link = html.unescape(re.search(r'<link href="([^"]+)"', eintrag).group(1))
            m = re.search(r'/comments/([a-z0-9]+)/', link)
            if not m or m.group(1) in funde:
                continue
            titel = html.unescape(re.search(r'<title>(.*?)</title>', eintrag, re.S).group(1))
            sub = re.search(r'/r/([^/]+)/', link)
            funde[m.group(1)] = {'id': m.group(1), 'titel': titel, 'sub': sub.group(1) if sub else '', 'kommentare': None, 'score': None,
                                 'text': '', 'link': link, 'datum': (re.search(r'<updated>(\d{4}-\d\d-\d\d)', eintrag) or [None, ''])[1]}
    except Exception as e:
        print(f'Reddit-RSS „{q}“: {e}')
    return list(funde.values())


def reddit_kommentare(pid):
    try:
        d = json.loads(get('https://api.pullpush.io/reddit/search/comment/?' + urllib.parse.urlencode({'link_id': pid, 'size': 100})))
    except Exception as e:
        return f'(Kommentare nicht abrufbar: {e})'
    ks = sorted(d.get('data', []), key=lambda k: -(k.get('score') or 0))
    return '\n\n'.join(f"[{k.get('score', 0)} Punkte] {k.get('body', '').strip()}" for k in ks if k.get('body') not in ('[deleted]', '[removed]'))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('slug')
    ap.add_argument('--youtube', nargs='*', default=[])
    ap.add_argument('--reddit', nargs='*', default=[])
    ap.add_argument('--transkripte', type=int, default=8, help='so viele Videos (nach Aufrufen) transkribieren')
    ap.add_argument('--threads', type=int, default=10, help='so viele Reddit-Threads mit Kommentaren laden')
    ap.add_argument('--muss', default='', help='Regex: nur Reddit-Threads, deren Titel oder Text darauf passt (z. B. "descal|entkalk")')
    a = ap.parse_args()

    ziel = ROOT / 'kaffee/recherche' / a.slug
    roh = ziel / 'roh'
    roh.mkdir(parents=True, exist_ok=True)

    videos = {}
    for q in a.youtube:
        for v in youtube_suche(q):
            videos.setdefault(v['id'], {**v, 'suche': q})
        time.sleep(2)
    videos = sorted(videos.values(), key=lambda v: -v['aufrufe'])
    for v in videos[:a.transkripte]:
        v['transkript'] = bool(transkript(v['id'], roh))
        print(f"Transkript {'ok ' if v['transkript'] else 'fehlt'} {v['id']} {v['titel'][:60]}")
        time.sleep(8)

    threads = {}
    for q in a.reddit:
        for t in reddit_suche(q):
            threads.setdefault(t['id'], {**t, 'suche': q})
        time.sleep(2)
    threads = list(threads.values())
    if a.muss:
        threads = [t for t in threads if re.search(a.muss, t['titel'] + ' ' + t['text'], re.I)]
    threads.sort(key=lambda t: -(t['kommentare'] or 0))
    for t in threads[:a.threads]:
        (roh / f"reddit-{t['id']}.md").write_text(f"# {t['titel']}\n\n{t['link']}\n\n{t['text']}\n\n## Kommentare\n\n{reddit_kommentare(t['id'])}\n")
        time.sleep(1)

    zeilen = [f'# Quellen: {a.slug}', '', f'Abgerufen am {time.strftime("%d.%m.%Y")} mit `tools/recherche.py`.',
              f'Suchen YouTube: {", ".join(a.youtube) or "–"} · Reddit: {", ".join(a.reddit) or "–"}', '',
              '## YouTube (nach Aufrufen)', '', '| Video | Kanal | Aufrufe | Dauer | Transkript |', '|---|---|---|---|---|']
    for v in videos[:25]:
        eigen = ' (eigener Kanal)' if v['kanal'] == EIGENER_KANAL else ''
        zeilen.append(f"| [{v['titel'].replace('|', '/')}](https://www.youtube.com/watch?v={v['id']}) | {v['kanal']}{eigen} | {v['aufrufe']:,} | "
                      f"{v['dauer'] // 60}:{v['dauer'] % 60:02d} | {'ja' if v.get('transkript') else ''} |".replace(',', '.'))
    zeilen += ['', '## Reddit (nach Kommentaren)', '', '| Thread | Subreddit | Kommentare | Datum |', '|---|---|---|---|']
    for t in threads[:30]:
        zeilen.append(f"| [{t['titel'].replace('|', '/')[:100]}]({t['link']}) | r/{t['sub']} | {t['kommentare'] if t['kommentare'] is not None else '?'} | {t['datum']} |")
    (ziel / 'quellen.md').write_text('\n'.join(zeilen) + '\n')
    print(f"{len(videos)} Videos, {sum(1 for v in videos if v.get('transkript'))} Transkripte, {len(threads)} Reddit-Threads → {ziel}")


if __name__ == '__main__':
    main()
