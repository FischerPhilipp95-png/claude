"""Foto → Mosaik aus 1x1-Platten (BrickLink 3024) in echten Steinfarben, mit Teileliste, Bauabschnitten und Wunschliste."""
import json, sys
from PIL import Image, ImageDraw, ImageOps, ImageEnhance, ImageFilter
import numpy as np

# Farben, die es als 1x1-Platte (3024) gibt: Name, BrickLink-Farbnummer, Hex
PALETTE = [
    ("White", 1, "#F4F4F4"), ("Black", 11, "#212121"), ("Light Bluish Gray", 86, "#A0A5A9"), ("Dark Bluish Gray", 85, "#5B5F66"),
    ("Tan", 2, "#DEC69C"), ("Dark Tan", 69, "#958A73"), ("Reddish Brown", 88, "#5B3A1E"), ("Dark Brown", 120, "#372100"),
    ("Medium Nougat", 150, "#AA7D55"), ("Nougat", 28, "#D09F6B"), ("Light Nougat", 90, "#F6D7B3"), ("Dark Orange", 68, "#A85C14"),
    ("Orange", 4, "#F08F1C"), ("Yellow", 3, "#F7D117"), ("Red", 5, "#B40000"), ("Dark Red", 59, "#6B1F1F"),
    ("Blue", 7, "#0057A6"), ("Dark Blue", 63, "#143044"), ("Green", 6, "#237841"), ("Dark Green", 80, "#184632"),
    ("Lime", 34, "#A5CA18"), ("Sand Green", 48, "#A0BCAC"), ("Bright Pink", 104, "#E4ADC8"), ("Medium Azure", 156, "#36AEBF"),
]
def hex2rgb(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def rgb2lab(rgb):
    rgb = np.asarray(rgb, dtype=float) / 255.0
    rgb = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = rgb @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)

def build(src, n=48, dither=False, out="mosaik", crop=None):
    im = Image.open(src).convert("RGB")
    if crop: im = im.crop(crop)                      # Kopf füllt das Bild, wie bei einem Porträt-Mosaik
    im = ImageOps.fit(im, (n * 3, n * 3), Image.LANCZOS)
    im = im.filter(ImageFilter.MedianFilter(5))      # Flächen beruhigen, damit Farbflächen zusammenhängen
    im = im.resize((n, n), Image.BOX)
    im = ImageEnhance.Color(im).enhance(1.1)
    px = np.asarray(im, dtype=float)
    pal_rgb = np.array([hex2rgb(h) for _, _, h in PALETTE], dtype=float); pal_lab = rgb2lab(pal_rgb)
    grid = np.zeros((n, n), dtype=int)
    work = px.copy()
    for y in range(n):
        for x in range(n):
            lab = rgb2lab(np.clip(work[y, x], 0, 255))
            k = int(np.argmin(((pal_lab - lab) ** 2).sum(axis=1))); grid[y, x] = k
            if dither:
                err = work[y, x] - pal_rgb[k]
                for dx, dy, wgt in ((1, 0, 7/16), (-1, 1, 3/16), (0, 1, 5/16), (1, 1, 1/16)):
                    if 0 <= x+dx < n and 0 <= y+dy < n: work[y+dy, x+dx] += err * wgt
    # Vorschau mit Noppen
    S = 14; pad = 24; W = n * S + 2 * pad
    base = Image.new("RGB", (W, W), (28, 28, 28)); d = ImageDraw.Draw(base)
    for y in range(n):
        for x in range(n):
            c = hex2rgb(PALETTE[grid[y, x]][2]); x0, y0 = pad + x * S, pad + y * S
            d.rectangle([x0, y0, x0 + S - 1, y0 + S - 1], fill=c)
            hi = tuple(min(255, int(v * 1.12) + 8) for v in c); lo = tuple(int(v * 0.82) for v in c)
            d.ellipse([x0 + 3, y0 + 3, x0 + S - 4, y0 + S - 4], fill=hi, outline=lo)
    base.save(f"{out}_vorschau.png")
    # Teileliste
    counts = {}
    for k in grid.flatten(): counts[k] = counts.get(k, 0) + 1
    bom = sorted([{"name": PALETTE[k][0], "bl_color": PALETTE[k][1], "hex": PALETTE[k][2], "qty": v, "part": "3024"} for k, v in counts.items()], key=lambda b: -b["qty"])
    # Bauabschnitte 16x16 wie bei den großen Mosaik-Sets
    sec = 16; sections = []
    for sy in range(n // sec):
        for sx in range(n // sec):
            sub = grid[sy*sec:(sy+1)*sec, sx*sec:(sx+1)*sec]; c = {}
            for k in sub.flatten(): c[PALETTE[k][0]] = c.get(PALETTE[k][0], 0) + 1
            sections.append({"nr": len(sections) + 1, "zeile": sy + 1, "spalte": sx + 1, "farben": dict(sorted(c.items(), key=lambda kv: -kv[1]))})
    # Anleitungsbild für Abschnitt 5 (Mitte): Raster mit Koordinaten
    sy, sx = 1, 1; G = 34; pad2 = 40; Wd = sec * G + pad2 * 2
    page = Image.new("RGB", (Wd, Wd), (244, 241, 234)); d2 = ImageDraw.Draw(page)
    for y in range(sec):
        for x in range(sec):
            k = grid[sy*sec + y, sx*sec + x]; c = hex2rgb(PALETTE[k][2]); x0, y0 = pad2 + x * G, pad2 + y * G
            d2.rectangle([x0, y0, x0 + G - 1, y0 + G - 1], fill=c, outline=(120, 120, 120))
            d2.ellipse([x0 + 8, y0 + 8, x0 + G - 9, y0 + G - 9], outline=tuple(int(v * 0.8) for v in c))
    for i in range(sec):
        d2.text((pad2 + i * G + G // 2 - 4, 14), str(i + 1), fill=(60, 60, 60)); d2.text((14, pad2 + i * G + G // 2 - 6), chr(65 + i), fill=(60, 60, 60))
    page.save(f"{out}_abschnitt5.png")
    xml = "<INVENTORY>\n" + "\n".join(f"  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>3024</ITEMID><COLOR>{b['bl_color']}</COLOR><MINQTY>{b['qty']}</MINQTY></ITEM>" for b in bom) + "\n</INVENTORY>\n"
    open(f"{out}-wanted-list.xml", "w").write(xml)
    json.dump({"n": n, "dither": dither, "grid": grid.tolist(), "bom": bom, "sections": sections}, open(f"{out}.json", "w"))
    total = n * n; price = total * 0.06
    print(f"{out}: {n}x{n} = {total} Platten, {len(bom)} Farben, Richtpreis ca. {price:.0f} € plus Grundplatten")
    for b in bom: print(f"  {b['qty']:5d}  {b['name']}")
    return bom

src = sys.argv[1]
crop = tuple(int(v) for v in sys.argv[2].split(",")) if len(sys.argv) > 2 else None
build(src, 48, False, "katze48", crop)
build(src, 64, False, "katze64", crop)
build(src, 32, False, "katze32", crop)
