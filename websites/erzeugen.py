#!/usr/bin/env python3
"""Erzeugt für jede Seite aus websites/websites.json den Upload-Workflow .github/workflows/website-<key>.yml.

Alle Seiten nutzen dieselbe Vorlage (websites/workflow-vorlage.yml): gleicher Build, gleiche Prüfungen,
gleicher Upload, gleiche Berichte. Änderungen nur in der Vorlage machen und dieses Skript laufen lassen.

  python3 websites/erzeugen.py           erzeugen bzw. aktualisieren
  python3 websites/erzeugen.py --pruefen nur prüfen, ob die Workflows aktuell sind (Exit 1, falls nicht)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VORLAGE = ROOT / 'websites' / 'workflow-vorlage.yml'
REGISTER = ROOT / 'websites' / 'websites.json'
ZIEL = ROOT / '.github' / 'workflows'
PFLICHT = ['name', 'ordner', 'domain', 'webspace_ordner', 'sftp_host', 'sftp_user', 'sftp_passwort',
           'ziel_variable', 'min_seiten', 'cron', 'live_check']


def workflow(key, s, branches):
    fehlt = [f for f in PFLICHT if f not in s]
    if fehlt:
        sys.exit(f'{key}: es fehlt {", ".join(fehlt)}')
    if not (ROOT / s['ordner'] / 'package.json').exists():
        sys.exit(f'{key}: {s["ordner"]}/package.json nicht gefunden')
    datei = f'website-{key}.yml'
    hosts = s['sftp_host']
    werte = {
        'NAME': s['name'],
        'DOMAIN': s['domain'],
        'DOMAIN_RE': re.escape(s['domain']).replace('\\-', '-'),
        'KEY': key,
        'ORDNER': s['ordner'],
        'BRANCHES': '[' + ', '.join(branches) + ']',
        'BRANCHES_TEXT': ' und '.join(branches),
        'DATEI': datei,
        'CRON': s['cron'],
        'HOST_EXPR': ' || '.join(f'secrets.{h}' for h in hosts),
        'HOST_TEXT': ' oder '.join(hosts),
        'USER_SECRET': s['sftp_user'],
        'PASS_SECRET': s['sftp_passwort'],
        'ZIEL_VAR': s['ziel_variable'],
        'WEBSPACE_ORDNER': s['webspace_ordner'].strip('/'),
        'MIN_SEITEN': str(int(s['min_seiten'])),
        'LIVE': ' '.join(s['live_check']),
    }
    text = VORLAGE.read_text()
    for k, v in werte.items():
        text = text.replace(f'@@{k}@@', v)
    rest = re.findall(r'@@[A-Z_]+@@', text)
    if rest:
        sys.exit(f'{key}: Platzhalter ohne Wert: {sorted(set(rest))}')
    return datei, text


def main():
    pruefen = '--pruefen' in sys.argv
    reg = json.loads(REGISTER.read_text())
    soll = dict(workflow(k, s, reg['branches']) for k, s in reg['seiten'].items())
    veraltet = []
    for datei, text in soll.items():
        pfad = ZIEL / datei
        if pfad.exists() and pfad.read_text() == text:
            print(f'aktuell:  {datei}')
            continue
        veraltet.append(datei)
        if not pruefen:
            pfad.write_text(text)
            print(f'erzeugt:  {datei}')
    # Workflows von Seiten, die nicht mehr im Register stehen
    for alt in sorted(ZIEL.glob('website-*.yml')):
        if alt.name not in soll:
            print(f'Hinweis: {alt.name} gehört zu keiner Seite in websites.json (von Hand löschen, falls gewollt)')
    if pruefen and veraltet:
        sys.exit(f'nicht aktuell: {", ".join(veraltet)} (python3 websites/erzeugen.py ausführen)')


if __name__ == '__main__':
    main()
