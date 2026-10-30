"""Rendert die Zeichnungen einer Bauart mit Blender (Cycles + Freestyle) im Stil einer technischen Illustration:
   python3 scripts/querschnitt/blender/render.py delonghi_ecam [schnell] [foto]

Ergebnis (public/bilder/querschnitt/):
  <bauart>-explosion.webp (+ -1000)      Explosionsansicht, Teile und Gehäuseteile nach außen gezogen
  <bauart>-eingebaut.webp (+ -1000)      eingebaute Ansicht, Gehäuse nur als Umriss
  <bauart>-<ansicht>-<teil>.webp         Hervorhebung je Bauteil (transparent, gelb gefüllt)
  <bauart>-detail-<teil>.webp            Nahaufnahme je Bauteil mit Markierungen
  src/querschnitte/<bauart>.json         Bildmaße, Anker je Ansicht, enge Ausschnitte, Marker der Nahaufnahmen
'schnell' rendert klein mit wenig Samples und nur die Grundbilder (in den Temp-Ordner) zur Kontrolle.
'foto' rendert die eingebaute Ansicht fotorealistisch (Materialien aus dem Modell) statt als Illustration."""
import sys, os, json, time, importlib, math
HIER = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HIER, '..', '..', '..'))
sys.path.insert(0, HIER)
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image, ImageDraw

name = sys.argv[1] if len(sys.argv) > 1 else 'delonghi_ecam'
schnell = 'schnell' in sys.argv
foto = 'foto' in sys.argv
bauart = name.replace('_', '-')
W, H = (1000, 750) if schnell else (2000, 1500)
DW, DH = (600, 450) if schnell else (1200, 900)
SAMPLES = 32 if schnell else 96
SAMPLES_TEIL = 24 if schnell else 48

bpy.ops.wm.read_factory_settings(use_empty=True)
import werkzeug
S = werkzeug.S
modell = importlib.import_module(name)
info = modell.bauen()
GRUPPEN = getattr(modell, 'GRUPPEN', {})
DETAILS = getattr(modell, 'DETAILS', {})

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.use_denoising = True
sc.cycles.adaptive_threshold = 0.05
sc.cycles.max_bounces = 6
sc.cycles.transparent_max_bounces = 24
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.render.resolution_percentage = 100
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.world = bpy.data.worlds.new('welt')
bg = sc.world.node_tree.nodes['Background']

objekte = [o for o in bpy.data.objects if o.type in ('MESH', 'CURVE')]
basis_lage = {o.name: o.location.copy() for o in objekte}
teile = sorted({o['teil'] for o in objekte if 'teil' in o})
fehlt = set(info['anker']) ^ set(teile)
assert not fehlt, f'Anker und Bauteile passen nicht zusammen: {fehlt}'


# ---------- Stil ----------
def matte(name_, farbe):
    m = bpy.data.materials.new(name_)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*farbe, 1)
    b.inputs['Roughness'].default_value = 1.0
    return m


TOENE = {
    'wasser': (0.86, 0.92, 0.98), 'heiss': (0.98, 0.9, 0.84), 'kaffee': (0.96, 0.92, 0.84),
    'milch': (0.88, 0.96, 0.92), 'strom': (0.9, 0.96, 0.9), 'deko': (0.95, 0.95, 0.95),
}
if not foto:
    tonmat = {k: matte(f'illu_{k}', v) for k, v in TOENE.items()}
    gelb = matte('illu_gelb', (1.0, 0.72, 0.15))
    schlauch_mat = matte('illu_schlauch', (0.72, 0.72, 0.74))
    for o in objekte:
        if o.type == 'CURVE':
            o.data.bevel_depth = 1.6 * S
            o.data.materials.clear()
            o.data.materials.append(schlauch_mat)
        elif o.data.materials:
            t = o.get('teil')
            m = tonmat[GRUPPEN.get(t, 'deko')] if t else tonmat['deko']
            for i in range(len(o.data.materials)):
                o.data.materials[i] = m
        if o.get('illu_aus') or o.name in ('huelle', 'bohnendeckel'):
            o['_cutter'] = True
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    bg.inputs['Strength'].default_value = 0.9
    sonne = bpy.data.lights.new('sonne', 'SUN')
    sonne.energy = 1.6
    sonne.angle = math.radians(12)
    so = bpy.data.objects.new('sonne', sonne)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(42), math.radians(-18), math.radians(28))
    # Freestyle-Linien
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = 1.0
    fs = bpy.context.view_layer.freestyle_settings
    fs.crease_angle = math.radians(110)
    for alt in list(fs.linesets):
        fs.linesets.remove(alt)
    ls = fs.linesets.new('linien')
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('linien_stil')
    ls.select_silhouette = True; ls.select_crease = True; ls.select_border = True; ls.select_contour = False
    ls.linestyle.color = (0.1, 0.1, 0.1)
    ls.linestyle.thickness = 2.2 if not schnell else 1.0
    ls.linestyle.caps = 'ROUND'
else:
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = -1.3
    bg.inputs['Color'].default_value = (0.9, 0.9, 0.92, 1)
    bg.inputs['Strength'].default_value = 0.2
    for nm, loc, en, gr, farbe in (('key', (1.3, -1.6, 2.0), 380, 2.0, (1.0, 0.96, 0.9)), ('fill', (-2.0, -1.2, 1.0), 120, 3.0, (0.9, 0.94, 1.0)),
                                   ('rim', (0.4, 2.0, 1.6), 200, 2.0, (1, 1, 1)), ('top', (0, 0, 2.5), 90, 3.0, (1, 1, 1))):
        ld = bpy.data.lights.new(nm, 'AREA'); ld.energy = en; ld.size = gr; ld.color = farbe
        o = bpy.data.objects.new(nm, ld); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0.16)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

# Bodenschatten
bpy.ops.mesh.primitive_plane_add(size=5, location=(0, 0, -0.03))
boden = bpy.context.object
boden.name = 'schattenfaenger'
boden.is_shadow_catcher = True

# Kamera
cam_data = bpy.data.cameras.new('kamera')
cam_data.clip_end = 100
cam = bpy.data.objects.new('kamera', cam_data)
sc.collection.objects.link(cam)
sc.camera = cam


def kamera(position, ziel, ortho=None, brennweite=50):
    kp = Vector([v * S for v in position]); kz = Vector([v * S for v in ziel])
    cam.location = kp
    cam.rotation_euler = (kz - kp).to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cam_data.type = 'ORTHO'; cam_data.ortho_scale = ortho
    else:
        cam_data.type = 'PERSP'; cam_data.lens = brennweite
    bpy.context.view_layer.update()


def projizieren(p, w=None, h=None):
    w = w or sc.render.resolution_x; h = h or sc.render.resolution_y
    v = world_to_camera_view(sc, cam, Vector(p))
    return [round(v.x * w), round((1 - v.y) * h)]


def anordnen(ansicht):
    """explosion: Teile und Gehäuseteile nach außen; eingebaut: Grundlage. Gehäuseteile nur in der Explosion sichtbar."""
    for o in objekte:
        o.location = basis_lage[o.name].copy()
        t = o.get('teil')
        if ansicht == 'explosion':
            if t and t in modell.EXPLOSION:
                o.location += Vector([v * S for v in modell.EXPLOSION[t]])
            elif o.get('explosion'):
                o.location += Vector([v * S for v in o['explosion']])
        o['_weg'] = (ansicht == 'explosion' and (o.type == 'CURVE' or o.name == 'kanten')) or \
                    (ansicht == 'eingebaut' and bool(o.get('explosion')) and not foto)
    bpy.context.view_layer.update()


def rendern(pfad, nur=None, samples=SAMPLES, breite=W, hoehe=H, gelb_fuellung=True):
    sc.cycles.samples = samples
    sc.render.resolution_x, sc.render.resolution_y = breite, hoehe
    for o in objekte:
        weg = bool(o.get('_cutter')) or bool(o.get('_weg'))
        if nur is not None:
            weg = weg or o.get('teil') != nur
        o.hide_render = weg
        if not foto and o.type == 'MESH' and o.data.materials and o.get('teil'):
            m = gelb if (nur is not None and gelb_fuellung and o.get('teil') == nur) else tonmat[GRUPPEN.get(o['teil'], 'deko')]
            for i in range(len(o.data.materials)):
                o.data.materials[i] = m
    boden.hide_render = nur is not None
    sc.render.filepath = pfad
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f'  {os.path.basename(pfad)}: {time.time() - t:.0f} s', flush=True)


def webp(png, ziel, breite=None, q=82):
    im = Image.open(png).convert('RGBA')
    if breite and breite < im.width:
        im = im.resize((breite, round(im.height * breite / im.width)), Image.LANCZOS)
    im.save(ziel, 'WEBP', quality=q, method=6)


def umriss(nur_teile=False):
    minx, miny, maxx, maxy = W, H, 0, 0
    for o in objekte:
        if o.type != 'MESH' or o.get('_cutter') or o.get('_weg') or (nur_teile and not o.get('teil')):
            continue
        for c in o.bound_box:
            x, y = projizieren(o.matrix_world @ Vector(c), W, H)
            minx, maxx = min(minx, x), max(maxx, x); miny, maxy = min(miny, y), max(maxy, y)
    return [max(0, minx), max(0, miny), min(W, maxx), min(H, maxy)]


ordner = os.path.join(SITE, 'public', 'bilder', 'querschnitt')
tmp = os.path.join(HIER, '.tmp')
os.makedirs(ordner, exist_ok=True); os.makedirs(tmp, exist_ok=True)
if schnell:
    ordner = tmp  # Testbilder nie in den Public-Ordner schreiben
nur_teile = os.environ.get('TEILE', '').split(',') if os.environ.get('TEILE') else None
t0 = time.time()
ergebnis = {'bild': f'/bilder/querschnitt/{bauart}', 'breite': W, 'hoehe': H, 'teile': teile, 'ansichten': {}, 'details': {}}

for ansicht in ('explosion', 'eingebaut'):
    anordnen(ansicht)
    k = modell.KAMERA_EXPLOSION if ansicht == 'explosion' else modell.KAMERA_EINGEBAUT
    kamera(k['position'], k['ziel'], k.get('ortho'), k.get('brennweite', 50))
    sc.render.resolution_x, sc.render.resolution_y = W, H
    png = os.path.join(tmp, f'{bauart}-{ansicht}.png')
    rendern(png)
    webp(png, os.path.join(ordner, f'{bauart}-{ansicht}.webp'), None if schnell else 2000)
    webp(png, os.path.join(ordner, f'{bauart}-{ansicht}-1000.webp'), 1000, 80)
    anker = {}
    for tid, p in info['anker'].items():
        p = Vector(p)
        if ansicht == 'explosion':
            p += Vector([v * S for v in modell.EXPLOSION.get(tid, (0, 0, 0))])
        anker[tid] = projizieren(p, W, H)
    u = umriss()
    eng = [max(0, u[0] - 40), max(0, u[1] - 30), min(W, u[2] + 40), min(H, u[3] + 30)]
    ergebnis['ansichten'][ansicht] = {'anker': anker, 'viewBoxEng': [eng[0], eng[1], eng[2] - eng[0], eng[3] - eng[1]]}
    for tid in (nur_teile or (teile if not schnell else [])):
        png = os.path.join(tmp, f'{bauart}-{ansicht}-{tid}.png')
        rendern(png, tid, SAMPLES_TEIL)
        webp(png, os.path.join(ordner, f'{bauart}-{ansicht}-{tid}.webp'), 1400, 78)
    if schnell:
        im = Image.open(os.path.join(tmp, f'{bauart}-{ansicht}.png')).convert('RGBA')
        hg = Image.new('RGBA', im.size, (255, 255, 255, 255)); hg.alpha_composite(im); d = ImageDraw.Draw(hg)
        for tid, (x, y) in anker.items():
            d.ellipse((x - 7, y - 7, x + 7, y + 7), fill='white', outline='black', width=2); d.text((x + 9, y - 12), tid, fill='red')
        hg.convert('RGB').save(os.path.join(tmp, f'kontrolle-{ansicht}.png'))

# Nahaufnahmen je Bauteil (eingebaute Lage, Teil allein, Kamera auf das Teil gerichtet)
anordnen('eingebaut')
richtung = Vector(modell.KAMERA_EXPLOSION['position']) - Vector(modell.KAMERA_EXPLOSION['ziel'])
richtung.normalize()
for tid in (nur_teile or (teile if not schnell else teile[:1])):
    objs = [o for o in objekte if o.get('teil') == tid and o.type == 'MESH' and not o.get('_cutter')]
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    mitte = (lo + hi) / 2
    groesse = max((hi - lo).length, 0.06)
    kamera([v / S for v in (mitte + richtung * 2.0)], [v / S for v in mitte], ortho=groesse * 1.25)
    png = os.path.join(tmp, f'{bauart}-detail-{tid}.png')
    rendern(png, tid, SAMPLES_TEIL, DW, DH, gelb_fuellung=False)
    webp(png, os.path.join(ordner, f'{bauart}-detail-{tid}.webp'), 1200, 80)
    marker = [[text, *projizieren([v * S for v in p], DW, DH)] for text, p in DETAILS.get(tid, [])]
    ergebnis['details'][tid] = {'breite': DW, 'hoehe': DH, 'marker': marker}
    if schnell:
        im = Image.open(png).convert('RGBA'); hg = Image.new('RGBA', im.size, (255, 255, 255, 255)); hg.alpha_composite(im); d = ImageDraw.Draw(hg)
        for text, x, y in marker:
            d.ellipse((x - 7, y - 7, x + 7, y + 7), fill='white', outline='black', width=2); d.text((x + 9, y - 12), text, fill='red')
        hg.convert('RGB').save(os.path.join(tmp, f'kontrolle-detail-{tid}.png'))

os.makedirs(os.path.join(SITE, 'src', 'querschnitte'), exist_ok=True)
with open(os.path.join(SITE, 'src', 'querschnitte', f'{bauart}.json'), 'w') as f:
    json.dump(ergebnis, f, indent=1)  # auch im Schnellmodus, damit die Seite mit den Testbildern gebaut werden kann
print(f'{bauart}: {len(teile)} Bauteile, {(time.time() - t0) / 60:.1f} min')
