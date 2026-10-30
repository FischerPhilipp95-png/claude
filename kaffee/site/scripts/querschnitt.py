#!/usr/bin/env python3
"""Schematische Schnittzeichnung eines Kaffeevollautomaten als SVG (isometrisch, Gehäuse durchsichtig).

Erzeugt je Bauart eine SVG-Datei und eine JSON-Datei mit den Ankerpunkten der Bauteile (für die Labels im
Querschnitt-Baustein, src/components/Querschnitt.astro). Die Lage der Bauteile ist schematisch, keine Konstruktionszeichnung.

Aufruf: python3 scripts/querschnitt.py  → src/querschnitte/<bauart>.svg und .json
"""
import json, math, pathlib

C, S = math.cos(math.radians(30)), 0.5
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'querschnitte'


def P(x, y, z):
    """Isometrische Projektion: x nach rechts, y nach hinten, z nach oben (Blick von vorn rechts oben)."""
    return ((x + y) * C, (x - y) * S - z)


def fmt(pts):
    return ' '.join(f'{px:.1f},{py:.1f}' for px, py in (P(*p) for p in pts))


def mix(hexcol, other, t):
    a = [int(hexcol[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(other[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(u + (v - u) * t):02x}' for u, v in zip(a, b))


class Zeichnung:
    def __init__(self):
        self.teile = []  # (id, svg)
        self.anker = {}

    def poly(self, pts, fill, opacity=1.0, stroke='#3b3630', sw=1.2, dash=None, extra=''):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        o = f' fill-opacity="{opacity}"' if opacity < 1 else ''
        return f'<polygon points="{fmt(pts)}" fill="{fill}"{o} stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"{d}{extra}/>'

    def box(self, x, y, z, w, d, h, col, opacity=1.0, stroke='#3b3630', faces='tfr', sw=1.2):
        """Quader: Deckel hell, Vorderseite mittel, rechte Seite dunkel."""
        out = []
        if 'r' in faces:
            out.append(self.poly([(x + w, y, z), (x + w, y + d, z), (x + w, y + d, z + h), (x + w, y, z + h)], mix(col, '#000000', 0.28), opacity, stroke, sw))
        if 'f' in faces:
            out.append(self.poly([(x, y, z), (x + w, y, z), (x + w, y, z + h), (x, y, z + h)], col, opacity, stroke, sw))
        if 't' in faces:
            out.append(self.poly([(x, y, z + h), (x + w, y, z + h), (x + w, y + d, z + h), (x, y + d, z + h)], mix(col, '#ffffff', 0.32), opacity, stroke, sw))
        return ''.join(out)

    def zyl(self, x, y, z, r, h, col, opacity=1.0, achse='z'):
        """Zylinder, grob: Mantel als Quader-Näherung plus Ellipsen. Reicht für Pumpe und Mahlwerk."""
        if achse == 'z':
            top = P(x, y, z + h)
            body = self.box(x - r, y - r, z, 2 * r, 2 * r, h, col, opacity, faces='fr')
            # Deckel als Ellipse im isometrischen Raster
            return body + f'<ellipse cx="{top[0]:.1f}" cy="{top[1]:.1f}" rx="{r * C * 1.41:.1f}" ry="{r * S * 1.41:.1f}" fill="{mix(col, "#ffffff", 0.32)}" fill-opacity="{opacity}" stroke="#3b3630" stroke-width="1.2"/>'
        # Achse entlang y (liegend, z. B. Pumpe)
        return self.box(x - r, y, z - r, 2 * r, h, 2 * r, col, opacity)

    def teil(self, tid, svg, anker):
        self.teile.append((tid, svg))
        self.anker[tid] = P(*anker)

    def deko(self, svg):
        self.teile.append((None, svg))


def delonghi_ecam():
    """De'Longhi ECAM-Bauart (Magnifica S, Dinamica, Magnifica Evo): Brühgruppe rechts vorn hinter der Klappe,
    Wassertank rechts hinten, Mahlwerk oben links unter dem Bohnenbehälter, Thermoblock mittig, Pumpe hinten links."""
    W, D, H = 240, 430, 350
    z = Zeichnung()
    shell = '#d9d4cc'
    # Innenwände (Rückwand, linke Wand, Boden) sehr hell
    z.deko(z.poly([(0, D, 0), (W, D, 0), (W, D, H), (0, D, H)], '#f1eee8', stroke='#b8b2a8'))
    z.deko(z.poly([(0, 0, 0), (0, D, 0), (0, D, H), (0, 0, H)], '#e7e2da', stroke='#b8b2a8'))
    z.deko(z.poly([(0, 0, 0), (W, 0, 0), (W, D, 0), (0, D, 0)], '#dcd6cd', stroke='#b8b2a8'))

    # Elektronik: Leistungsplatine an der linken Wand
    z.teil('elektronik', z.box(6, 190, 60, 8, 210, 230, '#3f8f55') + ''.join(z.box(14, yy, zz, 10, 16, 12, '#2f6f44') for yy, zz in ((220, 100), (260, 160), (300, 120), (340, 220), (230, 250))), (14, 200, 290))
    # Pumpe hinten links unten (liegend)
    z.teil('pumpe', z.zyl(50, 300, 55, 26, 100, '#6b7b8e', achse='y') + z.box(24, 400, 29, 52, 18, 52, '#4b5563'), (40, 300, 81))
    # Durchflussmesser neben der Pumpe
    z.teil('flowmeter', z.box(104, 340, 40, 34, 40, 36, '#2a9d8f'), (138, 360, 60))
    # Mahlwerk unter dem Bohnenbehälter (Kegelmahlwerk mit Motor)
    z.teil('mahlwerk', z.box(64, 262, 190, 70, 70, 60, '#5b5660') + z.zyl(99, 297, 250, 42, 90, '#4a4650'), (134, 300, 280))
    # Thermoblock mittig
    z.teil('thermoblock', z.box(30, 60, 150, 90, 90, 85, '#d97b2c') + z.box(60, 150, 180, 30, 30, 20, '#b86a24'), (30, 60, 235))
    # Magnetventil (Drainage) zwischen Thermoblock und Brühkopf
    z.teil('ventil', z.box(118, 96, 246, 40, 36, 40, '#7a9a3a'), (118, 96, 286))
    # Wassertank rechts hinten (durchsichtig, Füllstand)
    z.teil('wassertank',
           z.box(152, 200, 22, 86, 218, 190, '#3b82c4', opacity=0.32) +
           z.box(152, 200, 212, 86, 218, 118, '#9ec8ea', opacity=0.22) +
           z.box(160, 170, 30, 40, 30, 24, '#3b82c4'),  # Anschlussstück mit Schwimmer vorn unten am Tank
           (238, 330, 200))
    # Kaffeesatzbehälter vorn unten innen
    z.teil('satzbehaelter', z.box(30, 30, 26, 90, 96, 96, '#6e4b33', opacity=0.9), (30, 30, 122))
    # Brühgruppe rechts vorn hinter der Klappe
    z.teil('bruehgruppe',
           z.box(150, 44, 92, 84, 100, 150, '#8a5a3b') +
           z.box(168, 70, 150, 48, 56, 40, '#5a3b27') +  # Brühkolben unten
           z.box(176, 46, 100, 30, 18, 60, '#a8744f'),   # Griff
           (234, 100, 170))
    # Oberer Brühkolben, fest im Gerät
    z.teil('bruehkopf', z.box(166, 70, 250, 52, 58, 36, '#4a3222'), (218, 100, 268))

    # Gehäuse durchsichtig: Vorderseite, Deckel, rechte Seite als Geister-Flächen
    z.deko(z.poly([(0, 0, 0), (W, 0, 0), (W, 0, H), (0, 0, H)], shell, 0.42, stroke='#6b6660', sw=1.6))
    z.deko(z.poly([(W, 0, 0), (W, D, 0), (W, D, H), (W, 0, H)], mix(shell, '#000000', 0.25), 0.3, stroke='#6b6660', sw=1.6, dash='6 5'))
    z.deko(z.poly([(0, 0, H), (W, 0, H), (W, D, H), (0, D, H)], mix(shell, '#ffffff', 0.3), 0.55, stroke='#6b6660', sw=1.6))
    # Brühgruppenklappe (Umriss auf der rechten Seite)
    z.deko(z.poly([(W, 30, 70), (W, 170, 70), (W, 170, 300), (W, 30, 300)], 'none', stroke='#6b6660', sw=1.4, dash='4 4'))

    # Außenteile (sichtbar und massiv)
    # Bedienfeld oben auf der Front
    z.teil('bedienfeld', z.poly([(30, 0, 292), (210, 0, 292), (210, 0, 338), (30, 0, 338)], '#2b2724') +
           ''.join(f'<circle cx="{P(xx, 0, 315)[0]:.1f}" cy="{P(xx, 0, 315)[1]:.1f}" r="7" fill="#f2a94e" stroke="#1d1712" stroke-width="1"/>' for xx in (60, 100, 140, 180)),
           (120, 0, 338))
    # Bohnenbehälter oben links mit Mahlgradregler
    z.teil('bohnen', z.box(20, 230, H, 130, 170, 40, '#efe7d8', opacity=0.8) +
           ''.join(f'<ellipse cx="{P(bx, by, H + 20)[0]:.1f}" cy="{P(bx, by, H + 20)[1]:.1f}" rx="9" ry="6" fill="#5a3a22" stroke="#3b2516" stroke-width="1" transform="rotate({r} {P(bx, by, H + 20)[0]:.1f} {P(bx, by, H + 20)[1]:.1f})"/>'
                   for bx, by, r in ((60, 270, 20), (95, 300, -30), (120, 340, 10), (75, 350, 45), (110, 265, -15))) +
           z.zyl(85, 315, H + 40, 14, 10, '#8a8580'),
           (20, 320, 380))
    # Pulverschacht (vorgemahlen) oben rechts neben dem Bohnenbehälter
    z.teil('pulverschacht', z.box(165, 290, H, 44, 50, 10, '#8a8580'), (209, 315, 360))
    # Kaffeeauslauf vorn, höhenverstellbar
    z.teil('auslauf', z.box(92, -34, 112, 56, 36, 76, '#2b2724') +
           ''.join(f'<ellipse cx="{P(xx, -26, 112)[0]:.1f}" cy="{P(xx, -26, 112)[1]:.1f}" rx="6" ry="3.5" fill="#111" />' for xx in (108, 132)),
           (92, -34, 150))
    # Abtropfschale vorn unten mit Tassenrost
    z.teil('abtropfschale', z.box(8, -24, 0, 224, 160, 24, '#44403c') +
           ''.join(z.poly([(xx, -20, 24), (xx + 4, -20, 24), (xx + 4, 130, 24), (xx, 130, 24)], '#9c9790', stroke='none') for xx in range(20, 224, 18)),
           (8, -24, 12))
    # Milchaufschäumer rechts vorn: Dampfrohr und Düse, Dampfdrehknopf
    z.teil('aufschaeumer', z.box(236, 24, 110, 10, 10, 150, '#4aa3a8') + z.box(230, 18, 92, 22, 22, 34, '#2f7f84') +
           f'<circle cx="{P(W, 70, 300)[0]:.1f}" cy="{P(W, 70, 300)[1]:.1f}" r="12" fill="#8a8580" stroke="#3b3630" stroke-width="1.2"/>',
           (240, 29, 110))

    z.labels = (['elektronik', 'bedienfeld', 'ventil', 'thermoblock', 'bruehkopf', 'satzbehaelter', 'auslauf', 'abtropfschale'],
                ['pulverschacht', 'wassertank', 'pumpe', 'flowmeter', 'bruehgruppe', 'aufschaeumer'],
                ['bohnen', 'mahlwerk'])
    return z, (W, D, H)


def schreiben(name, z, dims):
    W, D, H = dims
    # Sichtbereich aus allen projizierten Ecken plus Rand für die Labels
    ecken = [P(x, y, zz) for x in (-40, W + 20) for y in (-40, D) for zz in (0, H + 60)]
    xs, ys = [e[0] for e in ecken], [e[1] for e in ecken]
    rand = 235
    vx, vy = min(xs) - rand, min(ys) - 80
    vw, vh = max(xs) - min(xs) + 2 * rand, max(ys) - min(ys) + 150
    body = ''.join(f'<g data-teil="{tid}">{svg}</g>' if tid else svg for tid, svg in z.teile)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.0f} {vy:.0f} {vw:.0f} {vh:.0f}" role="img" '
           f'aria-labelledby="qs-titel-{name}"><title id="qs-titel-{name}">Schematische Schnittzeichnung</title>'
           f'<g class="qs-zeichnung">{body}</g><g class="qs-linien"></g></svg>')
    OUT.mkdir(exist_ok=True)
    (OUT / f'{name}.svg').write_text(svg, encoding='utf-8')
    anker = {k: [round(v[0], 1), round(v[1], 1)] for k, v in z.anker.items()}
    # Label-Positionen: linke Spalte, rechte Spalte, oben (Reihenfolge = von oben nach unten)
    links, rechts, oben = z.labels
    lx, rx = vx + 118, vx + vw - 118
    labels = {}
    for i, k in enumerate(links): labels[k] = [round(lx), round(vy + 60 + i * (vh - 120) / max(1, len(links) - 1))]
    for i, k in enumerate(rechts): labels[k] = [round(rx), round(vy + 60 + i * (vh - 120) / max(1, len(rechts) - 1))]
    for i, k in enumerate(oben): labels[k] = [round(vx + vw * (0.34 + 0.24 * i)), round(vy + 28)]
    fehlt = set(anker) ^ set(labels)
    assert not fehlt, f'Label ohne Anker oder umgekehrt: {fehlt}'
    # Enger Ausschnitt für schmale Bildschirme: Labels sind dort nur Nummernkreise direkt am Rand
    ex, ew = vx + rand - 75, vw - 2 * rand + 150
    eng = {}
    for i, k in enumerate(links): eng[k] = [round(ex + 34), labels[k][1]]
    for i, k in enumerate(rechts): eng[k] = [round(ex + ew - 34), labels[k][1]]
    for i, k in enumerate(oben): eng[k] = [round(ex + ew * (0.3 + 0.3 * i)), labels[k][1]]
    (OUT / f'{name}.json').write_text(json.dumps({'viewBox': [round(vx), round(vy), round(vw), round(vh)], 'anker': anker, 'labels': labels, 'viewBoxEng': [round(ex), round(vy), round(ew), round(vh)], 'labelsEng': eng}, indent=1), encoding='utf-8')
    print(name, 'viewBox', round(vx), round(vy), round(vw), round(vh), 'Teile:', ', '.join(anker))


if __name__ == '__main__':
    z, dims = delonghi_ecam()
    schreiben('delonghi-ecam', z, dims)
