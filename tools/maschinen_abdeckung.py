#!/usr/bin/env python3
"""Abdeckung je Maschine: welche Videos vom eigenen Kanal und welche Beiträge es schon gibt, welche Standard-Themen fehlen.

    python3 tools/maschinen_abdeckung.py > kaffee/maschinen-abdeckung.md

Liest kaffee/site/src/maschinen.json (Maschinen mit Suchwörtern), kaffee/site/src/videos.json (Videos des Kanals)
und die Artikel in kaffee/site/src/content/artikel. Gezählt werden die von Hand geprüften Videos (Feld „videos“ in maschinen.json). Titel, in denen Name oder Suchwort
der Maschine vorkommen, erscheinen zusätzlich als „Prüfen:“-Vorschlag.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'kaffee/site'
THEMEN = {  # Standard-Themen, die jede Maschine früher oder später braucht (Reihenfolge = Priorität nach Suchnachfrage)
    'Entkalken': r'entkalk|calc|descal',
    'Brühgruppe reinigen': r'brüh|bruh|brewing|gruppe',
    'Milchsystem / Milchschaum': r'milch|latte ?go|cappuccino|aufschäum|lattecrema',
    'Wasserfilter': r'filter|aquaclean|claris|intenza|brita',
    'Fehler / Lampen blinken': r'fehler|blink|lampe|leuchtet|symbol|error|reset|zurücksetzen|kein kaffee|geht nicht an',
    'Einrichten / erste Schritte': r'einricht|\berste\b|inbetriebnahme|einstellungen|setup',
    'Kaffee wässrig / Mahlgrad': r'wässrig|schwach|mahlgrad|mahlwerk',
}


def norm(s):
    return s.lower().replace('’', "'").replace('de longhi', "de'longhi").replace('delonghi', "de'longhi")


def main():
    maschinen = json.loads((ROOT / 'src/maschinen.json').read_text())
    videos = [v for v in json.loads((ROOT / 'src/videos.json').read_text())['videos'] if v.get('typ') == 'video']
    artikel = {}
    for f in (ROOT / 'src/content/artikel').glob('*.mdx'):
        m = re.search(r'^maschinen:\s*\[(.*)\]', f.read_text(), re.M)
        for k in (re.findall(r"[\w-]+", m.group(1)) if m else []):
            artikel.setdefault(k, []).append(f.stem)

    print('# Abdeckung je Maschine\n')
    print('Erzeugt mit `tools/maschinen_abdeckung.py`. ✅ = Video vom eigenen Kanal oder Beitrag vorhanden, leer = fehlt noch.')
    print('Gezählt werden nur die von Hand geprüften Videos aus `maschinen.json`. „Prüfen:“ = Titeltreffer, die vielleicht auch passen.\n')
    messung = ROOT.parent / 'recherche/maschinen-top50/messung.json'
    nachfrage = {k: e['yt_median'] for k, e in json.loads(messung.read_text()).items()} if messung.exists() else {}
    luecken = []
    kopf = ' | '.join(THEMEN)
    print(f'| Maschine | {kopf} | Videos (eigener Kanal) | Beiträge |')
    print('|' + '---|' * (len(THEMEN) + 3))
    for key, m in maschinen.items():
        woerter = [m['name']] + m.get('suchwoerter', [])
        muster = [norm(w) for w in woerter if len(w) >= 3]
        eigene = [v for v in videos if v['id'] in m.get('videos', [])]  # von Hand geprüft (maschinen.json)
        vorschlag = [v for v in videos if v['id'] not in m.get('videos', []) and any(w in norm(v['titel']) for w in muster)
                     and norm(m.get('markenname') or m['hersteller'])[:4] in norm(v['titel'])]
        zellen = []
        for regex in THEMEN.values():
            treffer = any(re.search(regex, norm(v['titel'])) for v in eigene)
            zellen.append('✅' if treffer else '')
        vliste = '<br>'.join(f"[{v['titel'][:60]}](https://youtu.be/{v['id']})" for v in eigene) or '–'
        if vorschlag:
            vliste += '<br>*Prüfen:* ' + '<br>'.join(f"[{v['titel'][:50]}](https://youtu.be/{v['id']})" for v in vorschlag)
        name = f"{m.get('markenname') or m['hersteller']} {m['name']}"
        print(f"| **{name}** | {' | '.join(zellen)} | {vliste} | {', '.join(artikel.get(key, [])) or '–'} |")
        luecken.append((nachfrage.get(key, 0), name, [t for t, z in zip(THEMEN, zellen) if not z]))

    print('\n## Was als Nächstes fehlt (nach Nachfrage)\n')
    print('Nachfrage = Median der Aufrufe der Top-5-YouTube-Videos zu „<Maschine> entkalken“ (kaffee/recherche/maschinen-top50).')
    print('Je Maschine das erste fehlende Thema in der Reihenfolge der Tabelle.\n')
    print('| # | Maschine | Nachfrage | Nächstes Thema | noch offen |')
    print('|---|---|---|---|---|')
    for i, (n, name, offen) in enumerate(sorted(luecken, key=lambda x: -x[0])[:30], 1):
        if offen:
            print(f"| {i} | {name} | {n / 1000:.0f} Tsd | **{offen[0]}** | {len(offen)} von {len(THEMEN)} |")


if __name__ == '__main__':
    main()
