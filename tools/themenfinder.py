#!/usr/bin/env python3
"""Themenfinder: bewertet Artikel-Ideen nach Nachfrage, Saison und Amazon-Potenzial.

    python3 tools/themenfinder.py blog/seo/themen-ideen.csv > blog/seo/themen-ranking.md

Eingabe-CSV (Semikolon): begriff;thema;produkt;amazon (amazon = 1–3, wie gut ein Produkt passt).

Pro Begriff:
- Google-Vorschläge (Autovervollständigung): wie viele Varianten und Fragen Leute eintippen
- YouTube-Vorschläge: Nachfrage nach Videos zum selben Thema (passt zum Kanal)
- Google Trends (trendspy, 12 Monate, Deutschland): aktueller Stand vs. Höchstwert, Monat der Spitze
- optional echtes Suchvolumen von Bing, wenn BING_WEBMASTER_KEY gesetzt ist (Bing Webmaster Tools → API-Zugang)
- ob es schon einen Artikel dazu gibt (Titel in blog/site/src/content/artikel)

Die Ergebnisse werden in blog/seo/.themenfinder-cache.json zwischengespeichert (Trends drosselt viele Anfragen).
"""
import csv
import json
import os
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'blog/seo/.themenfinder-cache.json'
ARTIKEL = ROOT / 'blog/site/src/content/artikel'
FRAGEN = {'wie', 'warum', 'was', 'wann', 'wo', 'welche', 'welcher', 'welches', 'kann', 'ist', 'muss'}
MONATE = 'Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt Nov Dez'.split()


def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8', 'replace'))


def vorschlaege(begriff, youtube=False):
    """Alle Vorschläge für den Begriff selbst, Fragewörter und a–z."""
    basis = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=de&gl=de'
    if youtube:
        basis += '&ds=yt'
    endungen = [''] + sorted(FRAGEN) + list('abcdefghijklmnopqrstuvwxyz')
    if youtube:
        endungen = [''] + sorted(FRAGEN)  # YouTube: nur grob
    gefunden = set()
    for e in endungen:
        q = f'{begriff} {e}'.strip()
        try:
            gefunden.update(get_json(basis + '&q=' + urllib.parse.quote(q))[1])
        except Exception:
            pass
        time.sleep(0.3)
    gefunden.discard(begriff)
    return sorted(gefunden)


def trends(begriff):
    try:
        from trendspy import Trends
    except ImportError:
        return None
    try:
        df = Trends().interest_over_time([begriff], geo='DE', timeframe='today 12-m')
    except Exception as e:
        print(f'<!-- Trends {begriff}: {e} -->', file=sys.stderr)
        return None
    werte = df[begriff]
    if werte.max() == 0:
        return None
    monat = werte.groupby(werte.index.month).mean()
    return {
        'jetzt': round(float(werte.tail(4).mean()), 1),        # Schnitt der letzten 4 Wochen (0–100)
        'spitze_monat': int(monat.idxmax()),
        'spitze': round(float(werte.max()), 1),
        'schnitt': round(float(werte.mean()), 1),
    }


def bing_volumen(begriff):
    key = os.environ.get('BING_WEBMASTER_KEY')
    if not key:
        return None
    url = ('https://ssl.bing.com/webmaster/api.svc/json/GetKeyword?' + urllib.parse.urlencode(
        {'q': begriff, 'country': 'de', 'language': 'de-DE', 'startDate': '', 'endDate': '', 'apikey': key}))
    try:
        d = get_json(url).get('d') or {}
        return d.get('Impressions')
    except Exception as e:
        print(f'<!-- Bing {begriff}: {e} -->', file=sys.stderr)
        return None


def vorhandene_titel():
    titel = []
    for f in ARTIKEL.glob('*.mdx'):
        m = re.search(r'^title: "(.*)"$', f.read_text(), re.M)
        if m:
            titel.append(m.group(1).lower())
    return titel


def abgedeckt(begriff, titel):
    woerter = [w for w in re.findall(r'\w+', begriff.lower()) if len(w) > 3]
    return any(all(w[:6] in t for w in woerter) for t in titel)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    titel = vorhandene_titel()
    jetzt_monat = time.localtime().tm_mon
    zeilen = []
    for row in csv.DictReader(open(sys.argv[1], encoding='utf-8'), delimiter=';'):
        b = row['begriff'].strip()
        if b not in cache:
            print(f'… {b}', file=sys.stderr)
            g = vorschlaege(b)
            cache[b] = {
                'google': len(g),
                'fragen': sum(1 for s in g if set(s.split()) & FRAGEN),
                'beispiele': g[:8],
                'youtube': len(vorschlaege(b, youtube=True)),
                'trends': trends(b),
                'bing': bing_volumen(b),
            }
            CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
            time.sleep(1.5)
        c = cache[b]
        t = c['trends']
        # Saison-Faktor: steigt das Thema in den nächsten 0–2 Monaten auf seine Spitze zu?
        saison = 1.0
        if t:
            abstand = (t['spitze_monat'] - jetzt_monat) % 12
            saison = 1.5 if abstand <= 2 else (0.7 if abstand >= 6 else 1.0)
        nachfrage = c['google'] + 2 * c['fragen'] + c['youtube']
        if c.get('bing'):
            nachfrage += min(c['bing'], 5000) / 50
        score = round(nachfrage * saison * (0.6 + 0.2 * int(row['amazon'] or 1)))
        zeilen.append((score, b, row, c, saison, abgedeckt(b, titel)))

    zeilen.sort(key=lambda z: -z[0])
    print('# Themen-Ranking\n')
    print(f'Erstellt am {time.strftime("%d.%m.%Y")} mit `tools/themenfinder.py`. Punkte = Nachfrage × Saison × Amazon-Potenzial.')
    print('Nachfrage = Google-Vorschläge + 2 × Fragen + YouTube-Vorschläge (+ Bing-Volumen, falls API-Schlüssel gesetzt).')
    print('Saison: ×1,5, wenn die Trends-Spitze in den nächsten 2 Monaten liegt, ×0,7, wenn sie 6+ Monate entfernt ist.\n')
    print('| # | Begriff | Thema | Punkte | Google | Fragen | YouTube | Spitze | jetzt/Ø | Produkt | schon da? |')
    print('|---|---|---|---|---|---|---|---|---|---|---|')
    for i, (score, b, row, c, saison, da) in enumerate(zeilen, 1):
        t = c['trends']
        spitze = MONATE[t['spitze_monat'] - 1] if t else '–'
        verlauf = f"{t['jetzt']}/{t['schnitt']}" if t else '–'
        print(f"| {i} | {b} | {row['thema']} | **{score}** | {c['google']} | {c['fragen']} | {c['youtube']} | {spitze} | {verlauf} | {row['produkt'] or '–'} | {'✅' if da else ''} |")
    print('\n## Beispiel-Suchanfragen (Top 10)\n')
    for score, b, row, c, saison, da in zeilen[:10]:
        print(f"- **{b}**: " + ' · '.join(c['beispiele']))


if __name__ == '__main__':
    main()
