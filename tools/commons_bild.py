#!/usr/bin/env python3
"""Frei lizenzierte Fotos auf Wikimedia Commons suchen und mit Bildnachweis speichern.

    python3 tools/commons_bild.py suche "plunger toilet"              # Kandidaten auflisten
    python3 tools/commons_bild.py laden "File:Plunger.jpg" ziel.webp  # herunterladen (max. 1200 px) + Nachweis ausgeben

Nur Lizenzen, die wir mit Namensnennung nutzen dürfen: CC0, Public Domain, CC BY, CC BY-SA.
Der ausgegebene Nachweis gehört direkt unter das Bild (Urheber, Titel, Quelle, Lizenz mit Link).
"""
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://commons.wikimedia.org/w/api.php?'
OK = re.compile(r'^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$', re.I)
LIZENZ_LINK = {
    'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/', 'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
    'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
    'CC BY 2.5': 'https://creativecommons.org/licenses/by/2.5/', 'CC BY-SA 2.5': 'https://creativecommons.org/licenses/by-sa/2.5/',
    'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/', 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
}


def api(params):
    req = urllib.request.Request(API + urllib.parse.urlencode(params), headers={'User-Agent': 'handwerksdoktor-blog/1.0 (info@handwerksdoktor.de)'})
    for versuch in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or versuch == 4:
                raise
            time.sleep(10 * (versuch + 1))  # Wikimedia drosselt: höflich warten


def info(params):
    d = api({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size',
             'iiurlwidth': 1280, **params})
    for p in d.get('query', {}).get('pages', {}).values():
        if 'imageinfo' not in p:
            continue
        ii = p['imageinfo'][0]
        m = ii.get('extmetadata', {})
        lizenz = re.sub('<[^>]+>', '', m.get('LicenseShortName', {}).get('value', '')).strip()
        autor = re.sub('<[^>]+>', '', m.get('Artist', {}).get('value', '')).strip() or 'unbekannt'
        yield p['title'], lizenz, autor, ii


def nachweis(titel, lizenz, autor, ii):
    name = titel.removeprefix('File:').rsplit('.', 1)[0]
    seite = ii['descriptionurl']
    lz = f'<a href="{LIZENZ_LINK[lizenz]}" rel="noopener">{lizenz}</a>' if lizenz in LIZENZ_LINK else ('gemeinfrei' if 'public' in lizenz.lower() else lizenz)
    return f'Foto: {autor}, „{name}“, <a href="{seite}" rel="noopener">Wikimedia Commons</a>, {lz}'


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    if sys.argv[1] == 'suche':
        for titel, lizenz, autor, ii in info({'generator': 'search', 'gsrnamespace': 6, 'gsrlimit': 20,
                                                'gsrsearch': sys.argv[2] + ' filetype:bitmap'}):
            if OK.match(lizenz) and ii.get('width', 0) >= 800:
                print(f'{titel} | {lizenz} | {autor[:40]} | {ii["width"]}x{ii["height"]} | {ii["thumburl"]}')
    elif sys.argv[1] == 'laden':
        from PIL import Image
        titel, ziel = sys.argv[2], sys.argv[3]
        for t, lizenz, autor, ii in info({'titles': titel}):
            if not OK.match(lizenz):
                sys.exit(f'Lizenz nicht erlaubt: {lizenz}')
            req = urllib.request.Request(ii['thumburl'], headers={'User-Agent': 'handwerksdoktor-blog/1.0'})
            im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert('RGB')
            im.thumbnail((1200, 1200))
            im.save(ziel, 'WEBP', quality=80)
            print(json.dumps({'datei': ziel, 'breite': im.width, 'hoehe': im.height, 'nachweis': nachweis(t, lizenz, autor, ii)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
