#!/usr/bin/env python3
"""Titelbilder (1200x675, WebP) für alle Artikel, deren `bild` unter /bilder/titel/ liegt.

    python3 scripts/titelbilder.py          # erzeugt fehlende Bilder
    python3 scripts/titelbilder.py --alle   # erzeugt alle neu

Text kommt aus `kurztitel` (falls gesetzt) oder `title` im Kopf der .mdx-Datei.
Eigene Grafik = eigenes Urheberrecht, kein Lizenzrisiko, einheitlicher Kanal-Look.
"""
import pathlib
import re
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT.parent.parent / 'assets' / 'fonts'
AVATAR = ROOT.parent.parent / 'assets' / 'channel_avatar.jpg'
W, H = 1200, 675
BG, YELLOW, WHITE, GREY = (17, 17, 17), (255, 212, 0), (255, 255, 255), (170, 170, 170)


def kopf(text):
    m = re.match(r'^---\n(.*?)\n---', text, re.S)
    out = {}
    for line in (m.group(1) if m else '').splitlines():
        k, _, v = line.partition(':')
        if v:
            out[k.strip()] = v.strip().strip('"\'')
    return out


def umbrechen(draw, text, font, breite):
    zeilen, zeile = [], ''
    for wort in text.split():
        test = f'{zeile} {wort}'.strip()
        if draw.textlength(test, font=font) <= breite:
            zeile = test
        else:
            zeilen.append(zeile)
            zeile = wort
    return zeilen + [zeile]


def bild(titel, thema, ziel):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, H], fill=YELLOW)
    tag = ImageFont.truetype(str(FONTS / 'Inter-800.ttf'), 30)
    d.text((80, 70), thema.upper(), font=tag, fill=YELLOW)
    for groesse in (84, 76, 68, 60, 54):
        font = ImageFont.truetype(str(FONTS / 'Inter-800.ttf'), groesse)
        zeilen = umbrechen(d, titel, font, W - 160)
        if len(zeilen) * groesse * 1.15 <= 390:
            break
    y = 130 + (400 - len(zeilen) * groesse * 1.15) / 2
    for z in zeilen:
        d.text((80, y), z, font=font, fill=WHITE)
        y += groesse * 1.15
    av = Image.open(AVATAR).convert('RGB').resize((64, 64))
    maske = Image.new('L', (64, 64), 0)
    ImageDraw.Draw(maske).ellipse([0, 0, 63, 63], fill=255)
    img.paste(av, (80, H - 104), maske)
    klein = ImageFont.truetype(str(FONTS / 'Inter-500.ttf'), 28)
    d.text((160, H - 88), 'Der Handwerksdoktor · handwerksdoktor.de', font=klein, fill=GREY)
    ziel.parent.mkdir(parents=True, exist_ok=True)
    img.save(ziel, 'WEBP', quality=82)


def main():
    alle = '--alle' in sys.argv
    for mdx in sorted((ROOT / 'src/content/artikel').glob('*.mdx')):
        k = kopf(mdx.read_text())
        pfad = k.get('bild', '')
        if not pfad.startswith('/bilder/titel/'):
            continue
        ziel = ROOT / 'public' / pfad.lstrip('/')
        if ziel.exists() and not alle:
            continue
        bild(k.get('kurztitel') or k['title'], k.get('thema', ''), ziel)
        print('erzeugt', ziel.relative_to(ROOT))


if __name__ == '__main__':
    main()
