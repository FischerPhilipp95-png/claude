"""Rendert die Schnittzeichnung einer Bauart mit Blender (Cycles):
   python3 scripts/querschnitt/blender/render.py delonghi_ecam [schnell]
Ergebnis: public/bilder/querschnitt/<bauart>.webp (+ -1000.webp), <bauart>-<teil>.webp je Bauteil (transparent),
src/querschnitte/<bauart>.json (Anker, Labels, enger Ausschnitt). 'schnell' rendert klein mit wenig Samples zur Kontrolle."""
import sys, os, json, time, importlib, math
HIER = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(HIER, '..', '..', '..'))
sys.path.insert(0, HIER)
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image

name = sys.argv[1] if len(sys.argv) > 1 else 'delonghi_ecam'
schnell = 'schnell' in sys.argv
linien = 'linien' in sys.argv  # Explosionsansicht als technische Strichzeichnung (Workbench + Freestyle)
bauart = name.replace('_', '-')
W, H = (1000, 750) if schnell else (2000, 1500)
SAMPLES = 48 if schnell else 160
SAMPLES_TEIL = 32 if schnell else 64

bpy.ops.wm.read_factory_settings(use_empty=True)
import werkzeug
modell = importlib.import_module(name)
info = modell.bauen()

sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.adaptive_threshold = 0.05
sc.cycles.max_bounces = 10
sc.cycles.transparent_max_bounces = 24
sc.cycles.transmission_bounces = 10
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.resolution_percentage = 100
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.view_settings.exposure = -1.3

# Welt: neutral hell
sc.world = bpy.data.worlds.new('welt')
bg = sc.world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.9, 0.9, 0.92, 1)
bg.inputs['Strength'].default_value = 1.0 if linien else 0.2

# Kamera
S = werkzeug.S
kam = getattr(modell, 'KAMERA_EXPLOSION', info['kamera']) if linien else info['kamera']
kp = Vector([v * S for v in kam['position']])
kz = Vector([v * S for v in kam['ziel']])
if linien:
    # Teile auseinanderziehen, Schläuche/Kabel/Gehäusehaut ausblenden, alles weiß mit schwarzen Linien
    for o in bpy.data.objects:
        if o.type not in ('MESH', 'CURVE'):
            continue
        t = o.get('teil')
        if t and t in modell.EXPLOSION:
            o.location = o.location + Vector([v * S for v in modell.EXPLOSION[t]])
        if o.type == 'CURVE' or o.name in ('huelle', 'kanten', 'frontblende', 'klappe', 'bohnendeckel'):
            o['_cutter'] = True
    # Headless gibt es kein OpenGL für Workbench, deshalb Cycles mit einem flachen weißen Material und Umgebungslicht
    weiss = bpy.data.materials.new('linien_weiss')
    weiss.use_nodes = True
    weiss.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1)
    weiss.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1.0
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.data.materials:
            for i in range(len(o.data.materials)):
                o.data.materials[i] = weiss
    SAMPLES = 48
    sc.render.use_freestyle = True
    sc.render.line_thickness = 1.1
    fs = bpy.context.view_layer.freestyle_settings
    ls = fs.linesets.new('linien')
    ls.select_silhouette = True; ls.select_crease = True; ls.select_border = True; ls.select_contour = True
    fs.crease_angle = math.radians(120)
    ls.linestyle.color = (0.05, 0.05, 0.05)
    ls.linestyle.thickness = 1.3
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
cam_data = bpy.data.cameras.new('kamera')
cam_data.lens = info['kamera'].get('brennweite', 50)
cam_data.clip_end = 100
cam = bpy.data.objects.new('kamera', cam_data)
sc.collection.objects.link(cam)
cam.location = kp
cam.rotation_euler = (kz - kp).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam


def licht(name, typ, loc, energie, groesse=1.0, farbe=(1, 1, 1), ziel=kz):
    ld = bpy.data.lights.new(name, typ)
    ld.energy = energie
    ld.color = farbe
    if typ == 'AREA':
        ld.size = groesse
    if typ == 'SUN':
        ld.angle = math.radians(3)
    o = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (ziel - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o


if not linien:
    licht('key', 'AREA', (1.3, -1.6, 2.0), 380, 2.0, (1.0, 0.96, 0.9))
    licht('fill', 'AREA', (-2.0, -1.2, 1.0), 120, 3.0, (0.9, 0.94, 1.0))
    licht('rim', 'AREA', (0.4, 2.0, 1.6), 200, 2.0)
    licht('top', 'AREA', (0, 0, 2.5), 90, 3.0)
else:
    licht('sonne', 'SUN', (1, -1, 3), 1.2)

# Schattenfänger-Boden
bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -0.0005))
boden = bpy.context.object
boden.name = 'schattenfaenger'
boden.is_shadow_catcher = True
if linien:
    boden['_cutter'] = True

ordner = os.path.join(SITE, 'public', 'bilder', 'querschnitt')
os.makedirs(ordner, exist_ok=True)
tmp = os.path.join(SITE, 'scripts', 'querschnitt', 'blender', '.tmp')
os.makedirs(tmp, exist_ok=True)

if os.environ.get('OHNE_GEIST'):
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.data.materials and o.data.materials[0].name.startswith('geist'):
            o['_cutter'] = True
teile = sorted({o['teil'] for o in bpy.data.objects if 'teil' in o})
fehlt = set(info['anker']) ^ set(teile)
assert not fehlt, f'Anker und Bauteile passen nicht zusammen: {fehlt}'


def rendern(pfad, nur=None, samples=SAMPLES):
    sc.cycles.samples = samples
    for o in bpy.data.objects:
        if o.type not in ('MESH', 'CURVE'):
            continue
        if nur is None:
            o.hide_render = bool(o.get('_cutter'))
        else:
            o.hide_render = o.get('teil') != nur
    sc.render.filepath = pfad
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f'  {os.path.basename(pfad)}: {time.time() - t:.0f} s', flush=True)


def webp(png, ziel, breite=None, q=82):
    im = Image.open(png).convert('RGBA')
    if breite and breite < im.width:
        im = im.resize((breite, round(im.height * breite / im.width)), Image.LANCZOS)
    im.save(ziel, 'WEBP', quality=q, method=6)


t0 = time.time()
basis = os.path.join(tmp, f'{bauart}.png')
rendern(basis)
webp(basis, os.path.join(ordner, f'{bauart}.webp'), None if schnell else 2000)
webp(basis, os.path.join(ordner, f'{bauart}-1000.webp'), 1000, 80)

# Anker und Umriss
anker = {}
for k, p in info['anker'].items():
    p = Vector(p) + (Vector([v * S for v in modell.EXPLOSION.get(k, (0, 0, 0))]) if linien else Vector((0, 0, 0)))
    v = world_to_camera_view(sc, cam, Vector(p))
    anker[k] = [round(v.x * W), round((1 - v.y) * H)]
minx, miny, maxx, maxy = W, H, 0, 0
for o in bpy.data.objects:
    if o.type == 'MESH' and not o.get('_cutter') and o.name not in ('schattenfaenger',):
        for c in o.bound_box:
            v = world_to_camera_view(sc, cam, o.matrix_world @ Vector(c))
            minx, maxx = min(minx, v.x * W), max(maxx, v.x * W)
            miny, maxy = min(miny, (1 - v.y) * H), max(maxy, (1 - v.y) * H)
umriss = [max(0, round(minx)), max(0, round(miny)), min(W, round(maxx)), min(H, round(maxy))]

if not schnell and not linien:
    for t in teile:
        png = os.path.join(tmp, f'{bauart}-{t}.png')
        rendern(png, t, SAMPLES_TEIL)
        webp(png, os.path.join(ordner, f'{bauart}-{t}.webp'), 1400, 78)

labels = info['labels']
ex0, ey0 = max(0, umriss[0] - 90), max(0, min(umriss[1] - 40, 50))
ex1, ey1 = min(W, umriss[2] + 90), min(H, umriss[3] + 30)
pos, eng = {}, {}


def spalte(liste, x, x_eng):
    for i, k in enumerate(liste):
        y = round(ey0 + 70 + i * (ey1 - ey0 - 140) / max(1, len(liste) - 1))
        pos[k] = [x, y]
        eng[k] = [x_eng, y]


spalte(labels['links'], 150, ex0 + 60)
spalte(labels['rechts'], W - 150, ex1 - 60)
for i, k in enumerate(labels['oben']):
    pos[k] = [round(W * (0.36 + 0.22 * i)), 60]
    eng[k] = [round(ex0 + (ex1 - ex0) * (0.32 + 0.3 * i)), ey0 + 40]
assert not (set(teile) - set(pos)), f'Labels fehlen: {set(teile) - set(pos)}'
if not schnell and not linien:
    json.dump({'bild': f'/bilder/querschnitt/{bauart}', 'breite': W, 'hoehe': H, 'viewBox': [0, 0, W, H],
               'viewBoxEng': [ex0, ey0, ex1 - ex0, ey1 - ey0], 'anker': anker, 'labels': pos, 'labelsEng': eng, 'teile': teile},
              open(os.path.join(SITE, 'src', 'querschnitte', f'{bauart}.json'), 'w'), indent=1)
else:
    # Kontrollbild mit Ankerpunkten
    from PIL import ImageDraw
    im = Image.open(basis).convert('RGBA')
    hg = Image.new('RGBA', im.size, (247, 243, 238, 255)); hg.alpha_composite(im); d = ImageDraw.Draw(hg)
    for k, (x, y) in anker.items():
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill='white', outline='black', width=2); d.text((x + 8, y - 12), k, fill='red')
    hg.convert('RGB').save(os.path.join(tmp, 'kontrolle.png'))
print(f'{bauart}: {len(teile)} Bauteile, {(time.time() - t0) / 60:.1f} min')
