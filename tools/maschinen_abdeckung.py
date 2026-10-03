#!/usr/bin/env python3
"""Abdeckung je Maschine: welche Videos vom eigenen Kanal und welche Beiträge es schon gibt, welche Standard-Themen fehlen.

    python3 tools/maschinen_abdeckung.py > kaffee/maschinen-abdeckung.md

Liest kaffee/site/src/maschinen.json (Maschinen mit Suchwörtern), kaffee/site/src/videos.json (Videos des Kanals)
und die Artikel in kaffee/site/src/content/artikel. Ein Video zählt zu einer Maschine, wenn ihr Name oder eines ihrer
Suchwörter im Videotitel steht. Die Zuordnung ist ein Vorschlag: vor dem Eintragen in maschinen.json von Hand prüfen.
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
    'Fehler / Lampen blinken': r'fehler|blink|lampe|leuchtet|symbol|error|reset|zurücksetzen|geht nicht|kein kaffee',
    'Einrichten / erste Schritte': r'einricht|erste|inbetriebnahme|einstellungen|setup',
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
    print('Videozuordnung über den Titel: vor dem Eintragen in `maschinen.json` prüfen.\n')
    kopf = ' | '.join(THEMEN)
    print(f'| Maschine | {kopf} | Videos (eigener Kanal) | Beiträge |')
    print('|' + '---|' * (len(THEMEN) + 3))
    for key, m in maschinen.items():
        woerter = [m['name']] + m.get('suchwoerter', [])
        muster = [norm(w) for w in woerter if len(w) >= 3]
        eigene = [v for v in videos if any(w in norm(v['titel']) for w in muster)
                  and norm(m.get('markenname') or m['hersteller'])[:4] in norm(v['titel'])] + \
                 [v for v in videos if v['id'] in m.get('videos', [])]
        eigene = list({v['id']: v for v in eigene}.values())
        zellen = []
        for regex in THEMEN.values():
            treffer = any(re.search(regex, norm(v['titel'])) for v in eigene)
            zellen.append('✅' if treffer else '')
        vliste = '<br>'.join(f"[{v['titel'][:60]}](https://youtu.be/{v['id']})" for v in eigene) or '–'
        name = f"{m.get('markenname') or m['hersteller']} {m['name']}"
        print(f"| **{name}** | {' | '.join(zellen)} | {vliste} | {', '.join(artikel.get(key, [])) or '–'} |")


if __name__ == '__main__':
    main()
