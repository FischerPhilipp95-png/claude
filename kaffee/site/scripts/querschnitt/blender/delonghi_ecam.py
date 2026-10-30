"""De'Longhi Magnifica S (ECAM 22.110) nach der Explosionszeichnung des De'Longhi-Ersatzteilsystems (0132213029) und den
Teilefotos der Ersatzteilliste. Maße in Millimetern: X nach rechts, Y nach hinten (Front bei -215), Z nach oben.
Gehäuse 238 x 430 x 350. Lage der Baugruppen wie im Gerät: Brühgruppe rechts vorn hinter der Klappe, Wassertank rechts
hinten, Mahleinheit unter dem Bohnenbehälter, Generator (runder Thermoblock) links, Pumpe links hinten, Antrieb hinter der
Brühgruppe, Leistungsplatine links, Dampfhahn rechts vorn."""
import math, random
from werkzeug import *

W, D, H = 238, 430, 350

LABELS = {
    'links': ['elektronik', 'bedienfeld', 'thermoblock', 'ventil', 'bruehkopf', 'satzbehaelter', 'auslauf', 'abtropfschale'],
    'rechts': ['pulverschacht', 'wassertank', 'pumpe', 'flowmeter', 'bruehgruppe', 'aufschaeumer'],
    'oben': ['bohnen', 'mahlwerk'],
}
KAMERA = {'position': (680, -740, 880), 'ziel': (0, 10, 160), 'brennweite': 50}
# Explosionsansicht: Versatz je Bauteil in mm (Richtung, in die das Teil aus dem Gerät gezogen wird)
EXPLOSION = {
    'wassertank': (150, 60, 0), 'bruehgruppe': (170, -40, 0), 'bruehkopf': (170, -40, 90), 'ventil': (60, 20, 150),
    'bohnen': (0, 0, 230), 'mahlwerk': (0, 0, 120), 'pulverschacht': (70, 50, 180), 'bedienfeld': (-20, -120, 140),
    'elektronik': (-150, 20, 60), 'thermoblock': (-150, -40, 0), 'pumpe': (-150, 60, -10), 'flowmeter': (20, 170, 0),
    'satzbehaelter': (-60, -150, 0), 'abtropfschale': (0, -190, -20), 'auslauf': (0, -130, 0), 'aufschaeumer': (150, -60, -40),
}
KAMERA_EXPLOSION = {'position': (1300, -1400, 1300), 'ziel': (20, 0, 200), 'ortho': 1.5}
KAMERA_EINGEBAUT = {'position': (1300, -1400, 1300), 'ziel': (0, 0, 165), 'ortho': 0.78}
# Farbgruppe je Bauteil (für die Tönung der Illustration, gleiche Gruppen wie in src/bauteile.ts)
GRUPPEN = {
    'wassertank': 'wasser', 'pumpe': 'wasser', 'flowmeter': 'wasser', 'ventil': 'wasser', 'abtropfschale': 'wasser', 'thermoblock': 'heiss',
    'bohnen': 'kaffee', 'mahlwerk': 'kaffee', 'pulverschacht': 'kaffee', 'bruehgruppe': 'kaffee', 'bruehkopf': 'kaffee', 'auslauf': 'kaffee',
    'satzbehaelter': 'kaffee', 'aufschaeumer': 'milch', 'bedienfeld': 'strom', 'elektronik': 'strom',
}
# Markierungen für die Nahaufnahmen: Beschriftung und Punkt (mm, eingebaute Lage)
DETAILS = {
    'bruehgruppe': [('Brühzylinder mit Sieb', (84, -113, 247)), ('Dichtringe am Kolben', (105, -113, 168)), ('Rote Entriegelungstasten', (106, -155, 186)),
                    ('Griff', (84, -165, 190)), ('Auswurfhebel', (114, -95, 120)), ('Zahnstange zum Antrieb', (114, -61, 200)), ('Abstreifer', (84, -148, 110))],
    'bruehkopf': [('Duschsieb', (84, -113, 251)), ('O-Ringe', (107, -113, 271)), ('Halter', (109, -113, 293)), ('Schlauchanschluss', (84, -113, 314))],
    'thermoblock': [('Aluminiumkörper', (-70, -103, 139)), ('Wasseranschlüsse', (-120, -72, 144)), ('Sicherheitsventil', (-14, -48, 148)),
                    ('Temperaturfühler (NTC)', (-80, -16, 154)), ('Thermosicherung (TCO)', (-60, -104, 150)), ('Anschlussfahnen Heizung', (-62, -106, 128))],
    'pumpe': [('Spulengehäuse', (-85, 140, 123)), ('Pumpenkörper', (-85, 88, 120)), ('Auslass (Messing)', (-85, 56, 100)), ('Einlass vom Tank', (-85, 206, 100)),
              ('Thermosicherung', (-85, 140, 131)), ('Gummilager', (-85, 134, 64))],
    'flowmeter': [('Gehäuse mit Flügelrad', (20, 150, 74)), ('Schlauchanschlüsse', (-4, 152, 58)), ('Stecker zur Elektronik', (26, 150, 88))],
    'ventil': [('Ventilkörper', (98, -10, 322)), ('Feder und Kappe', (98, -10, 360)), ('Zahnrad', (74, -34, 310)), ('Mikroschalter', (72, 0, 314)), ('Wasseranschluss', (116, -10, 322))],
    'wassertank': [('Tank, 1,8 Liter', (117, 150, 230)), ('Wasserfilter', (84, 40, 54)), ('Ventil am Tankboden', (84, 40, 16)), ('Schwimmer (Füllstand)', (84, 190, 33)), ('Griff', (84, 180, 323))],
    'bohnen': [('Bohnenbehälter', (-80, 70, 340)), ('Mahlgradregler', (-20, 70, 296))],
    'mahlwerk': [('Mahlkegel', (-20, 70, 284)), ('Zahnkranz (Mahlgrad)', (-66, 70, 274)), ('Motor', (-30, 34, 200)), ('Pulverschacht zur Brühgruppe', (42, 10, 262))],
    'pulverschacht': [('Klappe', (72, 30, 351)), ('Trichter', (72, 30, 320))],
    'auslauf': [('Düsen', (0, -238, 100)), ('Führungsschienen', (24, -216, 230)), ('Höhenverstellung', (-34, -246, 150))],
    'aufschaeumer': [('Dampfdrehknopf', (123, -140, 300)), ('Dampfrohr', (147, -150, 250)), ('Hülse mit Luftschlitz', (158, -150, 150)), ('Düse', (147, -150, 86))],
    'satzbehaelter': [('Behälter', (-82, -150, 78)), ('Kaffeepucks', (-44, -150, 60)), ('Blende', (-40, -201, 122))],
    'abtropfschale': [('Schale', (-111, -130, 27)), ('Tassenabstellfläche', (0, -130, 44)), ('Schwimmer (voll)', (96, -210, 56))],
    'bedienfeld': [('Tasten mit Leuchten', (-72, -190, 361)), ('Aromaregler', (0, -178, 364)), ('Kontrollleuchten', (-58, -200, 363))],
    'elektronik': [('Leistungsplatine', (-110, 60, 200)), ('Transformator', (-94, 44, 169)), ('Relais', (-103, -8, 213)), ('Steckverbinder', (-106, 80, 216)), ('Kühlkörper', (-103, -82, 203))],
}


def bauen():
    random.seed(4)
    # ---- Materialien
    schwarz = material('schwarz', (0.02, 0.02, 0.022), 0.35, narbung=0.15)
    anthrazit = material('anthrazit', (0.05, 0.05, 0.055), 0.5, narbung=0.25)
    dunkelgrau = material('dunkelgrau', (0.12, 0.12, 0.13), 0.55, narbung=0.25)
    hellgrau = material('hellgrau', (0.45, 0.45, 0.46), 0.5, narbung=0.2)
    creme = material('creme', (0.86, 0.84, 0.76), 0.5, narbung=0.2)
    weiss = material('weiss', (0.9, 0.9, 0.88), 0.45, narbung=0.15)
    silber = material('silber', (0.78, 0.78, 0.78), 0.3, metall=1.0)
    chrom = material('chrom', (0.95, 0.95, 0.95), 0.08, metall=1.0)
    edelstahl = material('edelstahl', (0.8, 0.8, 0.8), 0.28, metall=1.0, narbung=0.08)
    alu_guss = material('alu_guss', (0.72, 0.73, 0.74), 0.62, metall=1.0, narbung=0.5)
    kupfer = material('kupfer', (0.85, 0.45, 0.22), 0.32, metall=1.0)
    messing = material('messing', (0.85, 0.65, 0.25), 0.35, metall=1.0)
    rot = material('rot', (0.75, 0.04, 0.04), 0.4, narbung=0.1)
    blau = material('blau', (0.05, 0.2, 0.6), 0.4)
    gruen_pcb = material('pcb', (0.02, 0.22, 0.09), 0.4)
    gruen_label = material('gruen_label', (0.2, 0.55, 0.2), 0.5)
    gummi = material('gummi', (0.02, 0.02, 0.02), 0.9)
    silikon = material('silikon', (0.92, 0.92, 0.9), 0.35, transmission=0.3)
    glas_tank = material('glas_tank', (0.93, 0.96, 0.98), 0.02, transmission=1.0, ior=1.45)
    glas_rauch = material('glas_rauch', (0.3, 0.3, 0.32), 0.08, transmission=1.0, ior=1.45)
    gelb_glas = material('gelb_glas', (0.9, 0.75, 0.2), 0.1, transmission=0.8, ior=1.4)
    wasser = material('wasser', (0.3, 0.6, 0.9), 0.05, alpha=0.4)
    bohne = material('bohne', (0.22, 0.11, 0.05), 0.5, narbung=0.3)
    kaffeesatz = material('kaffeesatz', (0.12, 0.07, 0.04), 0.85, narbung=0.6)
    braun_glas = material('braun_glas', (0.35, 0.22, 0.15), 0.15, transmission=0.9, ior=1.4)
    led_orange = material('led_orange', (1, 0.6, 0.1), 0.3, emission=(1.0, 0.55, 0.1))
    geh = geist()
    kante = material('kante', (0.15, 0.15, 0.16), 0.5)

    # ======================= Dekoration: Chassis =======================
    teil(None)
    quader('boden', W - 8, D - 10, 6, 0, 0, 9, dunkelgrau, 1)
    for x, y in ((-95, -190), (95, -190), (-95, 190), (95, 190)):
        zylinder('fuss', 10, 6, x, y, 3, gummi)
    quader('rahmen_hinten', 82, 8, 110, 81, -6, 110, dunkelgrau, 1)
    quader('rahmen_hinten_oben', 82, 8, 8, 81, -6, 289, dunkelgrau, 1)
    quader('rahmen_l', 8, 60, 150, 44, -30, 130, dunkelgrau, 1)
    quader('rahmen_fuss', 82, 170, 8, 81, -95, 56, dunkelgrau, 1)
    quader('rahmen_steg', 8, 170, 8, 44, -95, 289, dunkelgrau, 1)
    for x, y in ((-108, -200), (-108, 60), (-108, 200), (108, 200)):
        quader('saeule', 10, 10, H - 40, x, y, H / 2 - 10, dunkelgrau, 1)
    quader('traeger_hinten', W - 24, 10, 10, 0, 200, H - 22, dunkelgrau, 1)
    versatz(quader('platinentraeger', 4, 180, 200, -113, 15, 175, anthrazit, 0.5), -150, 20, 60)

    # ======================= Gehäuseteile (in der Explosionsansicht nach außen gezogen) =======================
    # Zusammengebaut sind sie fast unsichtbar (Geist), in der Strichzeichnung werden sie weiß gezeichnet.
    oben = quader('gehaeuse_oben', W, D, 3, 0, 0, H + 1.5, geh, 1)
    loecher(oben, [(-95 + i * 13, -195 + j * 13) for i in range(9) for j in range(8)], 3.2)            # Tassenablage
    schlitze(oben, [(-20, 70, 150, 150)], 'Z')                                                           # Öffnung Bohnenbehälter
    versatz(oben, 0, 0, 300)
    links = quader('gehaeuse_links', 3, D - 6, H - 40, -W / 2 - 1.5, 0, H / 2 - 10, geh, 1)
    schlitze(links, [(60 + i * 14, 250, 5, 90) for i in range(10)], 'X')
    versatz(links, -240, 0, 0)
    rechts = quader('gehaeuse_rechts', 3, 240, H - 40, W / 2 + 1.5, 95, H / 2 - 10, geh, 1)
    schlitze(rechts, [(100 + i * 14, 250, 5, 90) for i in range(8)], 'X')
    versatz(rechts, 300, 60, 0)
    klappe = quader('klappe', 3, 170, 240, W / 2 + 1.5, -120, 150, geh, 1)
    schlitze(klappe, [(-190, 60, 50, 12)], 'X')                                                          # Griffmulde
    versatz(klappe, 300, -90, -40)
    quader('klappengriff', 6, 50, 10, W / 2 + 4, -190, 60, hellgrau, 1)
    versatz(bpy.data.objects['klappengriff'], 300, -90, -40)
    hinten = quader('gehaeuse_hinten', W - 6, 3, H - 40, 0, D / 2 + 1.5, H / 2 - 10, geh, 1)
    schlitze(hinten, [(-90 + i * 14, 250, 5, 80) for i in range(13)], 'Y')
    versatz(hinten, 0, 240, 0)
    netz = quader('netzschalter', 22, 6, 30, 90, D / 2 + 4, 70, anthrazit, 1); versatz(netz, 0, 240, 0)
    wippe = quader('netzwippe', 14, 4, 20, 90, D / 2 + 8, 70, rot, 1); versatz(wippe, 0, 240, 0)
    kabel = zylinder('kabeldurchfuehrung', 6, 10, 40, D / 2 + 6, 60, schwarz, 'Y'); versatz(kabel, 0, 240, 0)
    front = quader('frontblende', W - 24, 3, 190, 0, -D / 2 - 1.5, 235, geist('geist_silber', (0.9, 0.9, 0.92), 0.05), 14)
    schlitze(front, [(0, 190, 70, 40)], 'Y')                                                             # Durchlass Auslauf
    versatz(front, -40, -250, 130)
    for o in (oben, links, rechts, klappe, hinten, front):
        o.visible_shadow = False
    sh = quader('huelle', W, D, H, 0, 0, H / 2, geh, 10)
    sh.visible_shadow = False
    drahtgitter('kanten', W, D, H, 0, 0, H / 2, kante, 1.0)

    # ======================= Elektronik: Leistungsplatine links =======================
    teil('elektronik')
    quader('platine', 1.6, 170, 90, -110, 10, 175, gruen_pcb, 0)
    quader('trafo', 30, 38, 34, -94, 44, 152, edelstahl, 1)
    quader('relais', 12, 20, 15, -103, -20, 205, blau, 0.8)
    quader('relais2', 12, 16, 15, -103, 4, 205, blau, 0.8)
    for i, (y, z) in enumerate(((-60, 150), (-44, 150), (-28, 150))):
        zylinder(f'elko{i}', 5, 14, -102, y, z, schwarz, 'X')
    for y, z, w in ((-70, 200, 14), (-20, 140, 10), (30, 210, 8), (60, 200, 8), (80, 170, 6)):
        quader('chip', 2.5, w, 6, -108, y, z, schwarz, 0.3)
    quader('stecker', 6, 30, 8, -106, 80, 212, weiss, 0.5)
    quader('stecker2', 6, 18, 8, -106, -75, 130, weiss, 0.5)
    quader('kuehlkoerper', 10, 20, 26, -103, -82, 190, alu_guss, 0.5)
    anker('elektronik', -108, -72, 220)

    # ======================= Wassertank rechts hinten =======================
    teil('wassertank')
    tank = quader('tank', 66, 196, 300, 84, 110, 172, glas_tank, 4)
    sol = tank.modifiers.new('wand', 'SOLIDIFY'); sol.thickness = -2 * S; sol.offset = 1
    quader('wasser', 58, 188, 210, 84, 110, 128, wasser, 2)
    quader('tankgriff', 50, 40, 6, 84, 180, 320, anthrazit, 1)
    drehkoerper('filter', [(0, 0), (13, 0), (13, 44), (10, 48), (10, 54), (0, 54)], 84, 40, 24, weiss)
    zylinder('filterkappe', 13, 6, 84, 40, 80, blau)
    zylinder('tankventil', 5, 14, 84, 40, 16, chrom)
    quader('schwimmer', 16, 10, 10, 84, 190, 28, anthrazit, 1)
    anker('wassertank', 117, 150, 215)

    # ======================= Pumpe (Ulka EP5) links hinten unten =======================
    teil('pumpe')
    px, py, pz = -85, 120, 100
    quader('pumpe_spule', 46, 60, 46, px, py + 20, pz, hellgrau, 2)                                      # Spulengehäuse
    quader('pumpe_label', 30, 1, 20, px, py - 10.5, pz + 2, gruen_label, 0.2)
    zylinder('pumpe_koerper', 20, 50, px, py - 32, pz, hellgrau, 'Y')                                   # Pumpenkörper vorn
    zylinder('pumpe_auslass', 6, 16, px, py - 64, pz, messing, 'Y')
    zylinder('pumpe_auslass2', 4, 18, px, py - 80, pz, chrom, 'Y')
    zylinder('pumpe_kappe', 20, 10, px, py + 54, pz, anthrazit, 'Y')                                    # Kappe hinten
    zylinder('pumpe_einlass', 6, 28, px, py + 72, pz, silikon, 'Y')
    quader('pumpe_fahne', 10, 3, 14, px + 18, py + 44, pz + 10, weiss, 0.3)
    quader('pumpe_fahne2', 10, 3, 14, px - 18, py + 44, pz + 10, weiss, 0.3)
    quader('pumpe_sicherung', 8, 14, 8, px, py + 20, pz + 27, rot, 1)
    quader('pumpe_halter', 60, 40, 8, px, py + 20, pz - 27, dunkelgrau, 1)
    for dy in (-14, 14):
        zylinder('pumpe_daempfer', 9, 14, px, py + 20 + dy, pz - 36, gummi, 'Z')
    anker('pumpe', px - 22, py - 20, pz + 22)

    # ======================= Durchflussmesser =======================
    teil('flowmeter')
    fx, fy, fz = 20, 150, 48
    drehkoerper('flow_koerper', [(0, 0), (22, 0), (22, 20), (18, 26), (0, 26)], fx, fy, fz, weiss)
    zylinder('flow_port1', 4.5, 30, fx - 24, fy - 6, fz + 10, weiss, 'X')
    zylinder('flow_port2', 4.5, 30, fx - 24, fy + 10, fz + 10, weiss, 'X')
    quader('flow_stecker', 10, 10, 10, fx + 6, fy, fz + 30, schwarz, 0.5)
    for dx in (-3, 0, 3):
        zylinder('flow_pin', 0.6, 8, fx + 6 + dx, fy, fz + 40, chrom)
    anker('flowmeter', fx + 12, fy - 16, fz + 26)

    # ======================= Generator rund (Thermoblock) links =======================
    teil('thermoblock')
    tx, ty, tz = -70, -60, 118
    drehkoerper('generator', [(24, 0), (43, 0), (44, 6), (44, 36), (43, 42), (24, 42)], tx, ty, tz, alu_guss)
    quader('generator_ohr', 26, 30, 16, tx + 42, ty - 8, tz + 18, alu_guss, 1)
    quader('generator_ohr2', 20, 26, 16, tx - 38, ty + 22, tz + 8, alu_guss, 1)
    zylinder('gen_port1', 4, 26, tx - 50, ty - 12, tz + 26, chrom, 'X')
    zylinder('gen_port2', 4, 26, tx + 54, ty - 6, tz + 12, chrom, 'X')
    zylinder('gen_sicherheitsventil', 6, 16, tx + 56, ty + 12, tz + 30, messing, 'X')
    zylinder('gen_ntc', 4, 10, tx - 10, ty + 44, tz + 36, weiss, 'Y')
    for dx in (-8, 8):
        quader('gen_fahne', 6, 2, 12, tx + dx, ty - 46, tz + 10, edelstahl, 0.2)                      # Anschlussfahnen Heizung
    quader('gen_tco', 10, 4, 8, tx + 10, ty - 44, tz + 32, weiss, 0.5)
    quader('gen_tco_buegel', 30, 3, 14, tx + 10, ty - 46, tz + 24, edelstahl, 0.3)
    anker('thermoblock', tx - 34, ty - 30, tz + 44)

    # ======================= Ventilgruppe (Mechanics valve) oben auf dem Rahmen =======================
    teil('ventil')
    vx, vy, vz = 90, -20, 300
    quader('ventil_platte', 60, 70, 8, vx, vy, vz, creme, 1)
    zylinder('ventil_koerper', 11, 34, vx + 8, vy + 10, vz + 22, gelb_glas)
    zylinder('ventil_feder', 6, 20, vx + 8, vy + 10, vz + 48, edelstahl, seg=16)
    zylinder('ventil_kappe', 9, 6, vx + 8, vy + 10, vz + 60, anthrazit)
    zylinder('ventil_zahnrad', 14, 5, vx - 16, vy - 14, vz + 8, creme, seg=24)
    quader('ventil_schalter', 10, 18, 8, vx - 18, vy + 20, vz + 10, schwarz, 0.5)
    zylinder('ventil_port', 4, 18, vx + 26, vy + 10, vz + 22, chrom, 'X')
    anker('ventil', vx - 30, vy - 30, vz + 10)

    # ======================= Bohnenbehälter mit Mahlgradregler, Bohnen, Deckel =======================
    teil('bohnen')
    bx, by = -20, 70
    drehkoerper('bohnenwanne', [(48, 282), (54, 290), (62, 330), (66, 352), (68, 352), (64, 326), (56, 288), (50, 280)], bx, by, 0, glas_rauch)
    drehkoerper('mahlgradregler', [(0, 282), (16, 282), (16, 292), (10, 296), (0, 296)], bx, by, 0, hellgrau)
    quader('regler_griff', 26, 4, 3, bx, by, 297, anthrazit, 0.3)
    for i in range(55):
        a = random.random() * math.pi * 2
        r = math.sqrt(random.random()) * 48
        z = 292 + random.random() * 40
        b = kugel(f'bohne{i}', 6.5, bx + math.cos(a) * r, by + math.sin(a) * r, z, bohne, (1, 0.62, 0.5))
        b.rotation_euler = (random.random() * 3, random.random() * 3, random.random() * 3)
        b['illu_aus'] = True
    deckel = quader('bohnendeckel', 150, 150, 4, bx, by, 358, geist('geist_deckel', (0.15, 0.15, 0.15), 0.35), 2)
    deckel.visible_shadow = False
    anker('bohnen', bx - 60, by - 40, 352)

    # ======================= Mahleinheit: Gehäuse mit Zahnkranz, Mahlkegel, schräg angesetzter Motor, Schacht =======================
    teil('mahlwerk')
    drehkoerper('mahl_gehaeuse', [(0, 222), (44, 222), (46, 250), (46, 270), (40, 278), (0, 278)], bx, by, 0, creme)
    quader('mahl_flansch', 110, 110, 10, bx, by, 266, creme, 2)
    zylinder('zahnkranz', 52, 6, bx, by, 274, creme, seg=72)
    for i in range(36):
        a = 2 * math.pi * i / 36
        quader('zahn', 5, 3, 6, bx + math.cos(a) * 52, by + math.sin(a) * 52, 274, creme, 0.3, rot=(0, 0, a))
    drehkoerper('mahlring', [(14, 268), (34, 268), (34, 278), (14, 278)], bx, by, 0, edelstahl)
    drehkoerper('mahlkegel', [(0, 264), (10, 264), (24, 276), (20, 284), (0, 284)], bx, by, 0, edelstahl)
    mot = zylinder('motor', 26, 64, bx - 10, by - 36, 200, anthrazit)
    mot.rotation_euler = (math.radians(30), 0, 0)
    wick = zylinder('wicklung', 28, 30, bx - 10, by - 36, 200, kupfer, seg=48)
    wick.rotation_euler = (math.radians(30), 0, 0)
    quader('motor_block', 40, 30, 36, bx - 10, by - 10, 236, creme, 2)
    rohr('motor_kabel', [(bx - 30, by - 52, 180), (bx - 60, by - 60, 180), (bx - 90, by - 40, 190)], 1.6, schwarz)
    rohr('schacht', [(bx + 30, by - 20, 240), (bx + 62, by - 60, 262), (bx + 80, by - 100, 268)], 9, anthrazit)
    anker('mahlwerk', bx + 50, by + 10, 276)

    # ======================= Pulverschacht (vorgemahlen) =======================
    teil('pulverschacht')
    quader('pulverdeckel', 42, 50, 4, 72, 30, H + 1, anthrazit, 1)
    quader('pulvergriff', 30, 8, 2, 72, 52, H + 3, hellgrau, 0.3)
    drehkoerper('pulvertrichter', [(16, 320), (16, 336), (18, 348), (7, 300), (7, 320)], 72, 30, 0, dunkelgrau)
    anker('pulverschacht', 92, 10, 352)

    # ======================= Brühgruppe (Brühkolben 054) =======================
    teil('bruehgruppe')
    gx, gy, gz = 84, -105, 170
    quader('bg_korpus', 52, 86, 150, gx, gy, gz, anthrazit, 4)
    quader('bg_rueckwand', 40, 20, 150, gx, gy + 52, gz, dunkelgrau, 2)
    drehkoerper('bg_zylinder', [(0, 160), (22, 160), (22, 246), (24, 248), (0, 248)], gx, gy - 8, 0, dunkelgrau)
    drehkoerper('bg_kolben_unten', [(0, 150), (20, 150), (20, 176), (6, 176), (6, 196), (0, 196)], gx, gy - 8, 0, schwarz)
    torus('bg_oring1', 21, 2, gx, gy - 8, 164, gummi)
    torus('bg_oring2', 21, 2, gx, gy - 8, 172, gummi)
    zylinder('bg_sieb', 21, 1.5, gx, gy - 8, 247, edelstahl)
    quader('bg_griff', 34, 14, 80, gx, gy - 52, gz + 10, anthrazit, 3)
    quader('bg_griffmulde', 20, 4, 40, gx, gy - 60, gz + 10, dunkelgrau, 1)
    for dx in (-22, 22):
        quader('bg_push', 8, 22, 34, gx + dx, gy - 50, gz + 16, rot, 3)
    quader('bg_hebel', 8, 44, 10, gx + 30, gy + 10, gz - 50, anthrazit, 1)
    quader('bg_abstreifer', 30, 6, 18, gx, gy - 40, gz - 60, anthrazit, 1)
    quader('bg_zahnstange', 6, 6, 150, gx + 30, gy + 48, gz, creme, 0.5)
    for i in range(14):
        quader('bg_zahn', 6, 4, 3, gx + 30, gy + 44, gz - 68 + i * 10, creme, 0.3)
    zylinder('bg_drehkranz', 14, 8, gx + 28, gy + 20, gz - 70, creme, 'X', seg=32)
    for dx in (-18, 18):
        zylinder('bg_fuss', 6, 14, gx + dx, gy - 20, gz - 82, anthrazit)
    drehkoerper('bg_auswurf', [(0, 90), (14, 90), (14, 112), (0, 112)], gx - 14, gy - 20, 0, kaffeesatz)
    anker('bruehgruppe', gx + 27, gy - 48, gz + 10)

    # ======================= Oberer Brühkolben mit Duschsieb =======================
    teil('bruehkopf')
    drehkoerper('bk_kolben', [(0, 252), (23, 252), (23, 290), (12, 290), (12, 300), (0, 300)], gx, gy - 8, 0, schwarz)
    torus('bk_oring', 23.5, 2, gx, gy - 8, 262, gummi)
    torus('bk_oring2', 23.5, 2, gx, gy - 8, 280, gummi)
    zylinder('bk_sieb', 22, 1.5, gx, gy - 8, 251, edelstahl)
    quader('bk_halter', 50, 40, 6, gx, gy - 8, 293, dunkelgrau, 1)
    zylinder('bk_anschluss', 4, 16, gx, gy - 8, 306, chrom)
    anker('bruehkopf', gx + 24, gy - 30, 278)

    # ======================= Antrieb hinter der Brühgruppe =======================
    teil(None)
    quader('antrieb_gehaeuse', 30, 30, 200, 84, 0, 170, creme, 2)
    zylinder('antrieb_spindel', 3, 190, 84, 0, 170, chrom)
    zylinder('antrieb_motor', 14, 50, 100, 10, 70, anthrazit, 'Z')
    zylinder('antrieb_riemenrad', 18, 4, 84, 0, 62, creme, seg=48)
    zylinder('antrieb_riemenrad2', 8, 4, 100, 10, 44, creme, seg=32)
    quader('antrieb_platine', 2, 40, 50, 66, 0, 120, gruen_pcb, 0)
    quader('mikroschalter', 10, 14, 6, 84, -30, 274, schwarz, 0.5)

    # ======================= Kaffeesatzbehälter =======================
    teil('satzbehaelter')
    quader('satzbehaelter', 84, 90, 96, -40, -150, 78, braun_glas, 3)
    for i, (dx, dy, dz, r) in enumerate(((-18, -10, 42, 0.2), (14, 18, 44, -0.4), (-4, 6, 54, 0.9), (10, -20, 64, 0.1))):
        p = zylinder(f'puck{i}', 19, 9, -40 + dx, -150 + dy, dz, kaffeesatz)
        p.rotation_euler = (r, 0, r / 2)
    quader('satz_blende', 84, 6, 20, -40, -198, 122, anthrazit, 1)
    anker('satzbehaelter', -84, -196, 44)

    # ======================= Abtropfschale mit Tassenabstellfläche und Schwimmer =======================
    teil('abtropfschale')
    quader('ablaufschale', 222, 175, 30, 0, -130, 27, schwarz, 3)
    rost = quader('tassenablage_edelstahl', 214, 160, 2, 0, -130, 43, edelstahl, 0.5)
    loecher(rost, [(-96 + i * 24, -190 + j * 24) for i in range(9) for j in range(6)], 5)
    zylinder('schwimmer_rot', 5, 12, 96, -210, 50, rot)
    anker('abtropfschale', -111, -215, 44)

    # ======================= Kaffeeauslauf, höhenverstellbar =======================
    teil('auslauf')
    quader('auslauf_korpus', 64, 40, 84, 0, -235, 150, schwarz, 5)
    quader('auslauf_deckel', 60, 44, 30, 0, -229, 192, anthrazit, 4)
    for dx in (-12, 12):
        drehkoerper('duese', [(0, 0), (5, 0), (5, 12), (3, 12), (3, 14), (0, 14)], dx, -238, 100, chrom)
    for dx in (-24, 24):
        zylinder('schiene', 3.5, 140, dx, -216, 190, chrom)
    quader('auslauf_griff', 10, 6, 40, -34, -246, 150, hellgrau, 1)
    anker('auslauf', -34, -250, 150)

    # ======================= Dampfhahn, Drehknopf, Milchaufschäumer (lange schwarze Hülse) =======================
    teil('aufschaeumer')
    ax, ay = W / 2 + 20, -150
    zylinder('dampf_anschluss', 5.5, 26, W / 2 + 10, ay, 262, chrom, 'X')
    rohr('dampf_rohr', [(W / 2 + 22, ay, 262), (ax + 8, ay, 256), (ax + 8, ay, 236)], 5.5, chrom)
    quader('aufsch_kopf', 22, 22, 22, ax + 8, ay, 226, schwarz, 4)                                       # Winkelstück
    drehkoerper('aufsch_huelse', [(0, 96), (9, 96), (11, 100), (11, 212), (9, 216), (0, 216)], ax + 8, ay, 0, schwarz)
    schlitze(bpy.data.objects['aufsch_huelse'], [(ay - 0, 150, 3, 40)], 'X')                            # Luftschlitz
    drehkoerper('aufsch_duese', [(0, 80), (4, 80), (6, 88), (6, 98), (0, 98)], ax + 8, ay, 0, anthrazit)
    torus('aufsch_ring', 10, 2, ax + 8, ay, 120, gummi)
    quader('dampfhahn', 24, 24, 20, W / 2 - 10, -140, 296, creme, 1)
    zylinder('dampf_knopf', 18, 12, W / 2 + 4, -140, 300, anthrazit, 'X')
    quader('dampf_knopf_griff', 6, 6, 24, W / 2 + 10, -140, 300, hellgrau, 0.5)
    anker('aufschaeumer', ax + 20, ay - 12, 160)

    # ======================= Bedienfeld oben vorn, leicht geneigt =======================
    teil('bedienfeld')
    quader('bedienfeld', 186, 70, 6, 0, -178, H + 4, schwarz, 1.5, rot=(math.radians(12), 0, 0))
    zylinder('aroma_regler', 15, 8, 0, -178, H + 10, anthrazit)
    quader('aroma_strich', 3, 20, 1.5, 0, -178, H + 15, hellgrau, 0.3)
    for dx, dy in ((-72, -190), (-72, -166), (-44, -190), (-44, -166), (44, -190), (44, -166), (72, -178)):
        quader('taste', 18, 16, 2, dx, dy, H + 9 - (dy + 178) * 0.21, hellgrau, 0.8, rot=(math.radians(12), 0, 0))
    for dx in (-58, 58):
        zylinder('led', 2.5, 2, dx, -200, H + 12, led_orange)
    anker('bedienfeld', -80, -205, H + 12)

    # ======================= Schläuche, Kabel =======================
    teil(None)
    r = 3.5
    rohr('s_tank_pumpe', [(84, 40, 12), (60, 60, 14), (-30, 120, 30), (-70, 60, 70), (-85, 30, 100)], r, silikon)
    rohr('s_pumpe_flow', [(-85, 202, 100), (-60, 230, 70), (-2, 150, 58)], r, silikon)
    rohr('s_flow_gen', [(-2, 136, 58), (-40, 90, 70), (-116, 10, 110), (-130, -72, 144)], r, silikon)
    rohr('s_gen_ventil', [(-8, -66, 130), (20, -40, 220), (60, -10, 286), (98, -10, 322)], r, silikon)
    rohr('s_ventil_kopf', [(98, -10, 330), (92, -70, 336), (84, -113, 314)], r, silikon)
    rohr('s_ventil_dampf', [(104, -10, 322), (118, -60, 320), (124, -120, 290), (130, -150, 262)], r, silikon)
    rohr('k_rot', [(-108, 70, 215), (-104, 40, 200), (-80, -50, 160), (-62, -102, 152)], 1.5, rot)
    rohr('k_blau', [(-108, 72, 211), (-106, 44, 194), (-86, -46, 154), (-62, -98, 146)], 1.5, blau)
    rohr('k_pumpe_rot', [(-108, -55, 130), (-104, 20, 90), (-66, 162, 112)], 1.5, rot)
    rohr('k_pumpe_blau', [(-108, -57, 126), (-106, 26, 84), (-66, 166, 106)], 1.5, blau)
    rohr('k_antrieb', [(-108, 75, 150), (-20, 80, 120), (66, 20, 120)], 1.5, schwarz)

    return {'anker': ANKER, 'labels': LABELS, 'kamera': KAMERA}
