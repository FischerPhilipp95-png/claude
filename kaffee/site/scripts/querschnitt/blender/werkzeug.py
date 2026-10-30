"""Helfer zum Modellieren in Blender (bpy): Maße in Millimetern, X nach rechts, Y nach hinten, Z nach oben.
Jedes Bauteil bekommt die Eigenschaft obj["teil"] = <id>, damit render.py es einzeln rendern kann."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

S = 0.001  # mm → m
_MAT = {}
_AKTIV = {'teil': None}
ANKER = {}


def teil(id_):
    """Alle danach erzeugten Objekte gehören zu diesem Bauteil (None = Dekoration)."""
    _AKTIV['teil'] = id_


def anker(id_, x, y, z):
    ANKER[id_] = (x * S, y * S, z * S)


def _nodes(m):
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    return nt, bsdf


def material(name, farbe=(0.5, 0.5, 0.5), rauheit=0.45, metall=0.0, transmission=0.0, alpha=1.0, ior=1.45,
             narbung=0.0, emission=None, koerper=None):
    """Principled-Material. narbung > 0: feine Noise-Bump-Struktur (Kunststoffnarbung, Gussoberfläche)."""
    if name in _MAT:
        return _MAT[name]
    m = bpy.data.materials.new(name)
    nt, b = _nodes(m)
    if len(farbe) == 3:
        farbe = (*farbe, 1.0)
    b.inputs['Base Color'].default_value = farbe
    b.inputs['Roughness'].default_value = rauheit
    b.inputs['Metallic'].default_value = metall
    b.inputs['IOR'].default_value = ior
    if transmission:
        b.inputs['Transmission Weight'].default_value = transmission
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1.0)
        b.inputs['Emission Strength'].default_value = 4.0
    if narbung:
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 600.0
        noise.inputs['Detail'].default_value = 4.0
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = narbung
        bump.inputs['Distance'].default_value = 0.0004
        nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    _MAT[name] = m
    return m


def geist(name='geist', farbe=(0.85, 0.87, 0.9), staerke=0.02):
    """Durchsichtiges Gehäuse: fast unsichtbar, nur ein Hauch Glanz, keine Schatten."""
    if name in _MAT:
        return _MAT[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    gl = nt.nodes.new('ShaderNodeBsdfGlossy')
    gl.inputs['Roughness'].default_value = 0.15
    gl.inputs['Color'].default_value = (*farbe, 1.0)
    mix.inputs['Fac'].default_value = staerke
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(gl.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    m.surface_render_method = 'BLENDED'
    m.use_transparent_shadow = True
    _MAT[name] = m
    return m


def _fertig(obj, mat, bevel=0.0, glatt=True, schatten=True):
    obj.data.materials.append(mat)
    if _AKTIV['teil']:
        obj['teil'] = _AKTIV['teil']
    if bevel:
        mod = obj.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel * S
        mod.segments = 3
        mod.limit_method = 'ANGLE'
        mod.harden_normals = True
    if glatt:
        for p in obj.data.polygons:
            p.use_smooth = True
        mod = obj.modifiers.new('glatt', 'SMOOTH_BY_ANGLE') if hasattr(bpy.types, 'SmoothByAngleModifier') else None
    if not schatten:
        obj.visible_shadow = False
    return obj


def _mesh_obj(name, bm, x, y, z):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = (x * S, y * S, z * S)
    bpy.context.view_layer.objects.active = o
    return o


def quader(name, w, d, h, x, y, z, mat, bevel=1.5, rot=(0, 0, 0), glatt=True):
    """Quader mit Mittelpunkt (x, y, z); Maße bleiben im Mesh, damit Fase und Drehung stimmen."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w * S, d * S, h * S), verts=bm.verts)
    o = _mesh_obj(name, bm, x, y, z)
    o.rotation_euler = rot
    return _fertig(o, mat, bevel, glatt)


def zylinder(name, r, h, x, y, z, mat, achse='Z', r2=None, bevel=0.6, seg=64, rot_extra=0.0):
    rot = {'Z': (0, 0, 0), 'X': (0, math.pi / 2, 0), 'Y': (math.pi / 2, 0, 0)}[achse]
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r * S, depth=h * S, vertices=seg, location=(x * S, y * S, z * S), rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r * S, radius2=r2 * S, depth=h * S, vertices=seg, location=(x * S, y * S, z * S), rotation=rot)
    o = bpy.context.object
    o.name = name
    return _fertig(o, mat, bevel)


def kugel(name, r, x, y, z, mat, skal=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=r * S)
    bmesh.ops.scale(bm, vec=skal, verts=bm.verts)
    o = _mesh_obj(name, bm, x, y, z)
    return _fertig(o, mat, 0)


def torus(name, R, r, x, y, z, mat, achse='Z'):
    rot = {'Z': (0, 0, 0), 'X': (0, math.pi / 2, 0), 'Y': (math.pi / 2, 0, 0)}[achse]
    bpy.ops.mesh.primitive_torus_add(major_radius=R * S, minor_radius=r * S, major_segments=64, minor_segments=16, location=(x * S, y * S, z * S), rotation=rot)
    o = bpy.context.object
    o.name = name
    return _fertig(o, mat, 0)


def drehkoerper(name, profil, x, y, z, mat, seg=64, achse='Z', glatt=True):
    """Rotationskörper aus einem Profil [(radius, hoehe), ...] um die Achse durch (x, y, z)."""
    bm = bmesh.new()
    ringe = []
    for r, h in profil:
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            if r <= 0:
                ring = None
                break
            ring.append(bm.verts.new((r * math.cos(a) * S, r * math.sin(a) * S, h * S)))
        if ring is None:
            ring = [bm.verts.new((0, 0, h * S))]
        ringe.append(ring)
    for a, b in zip(ringe, ringe[1:]):
        if len(a) == 1:
            for i in range(seg):
                bm.faces.new((a[0], b[i], b[(i + 1) % seg]))
        elif len(b) == 1:
            for i in range(seg):
                bm.faces.new((a[i], b[0], a[(i + 1) % seg]))
        else:
            for i in range(seg):
                bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    # Deckel oben und unten schließen, wenn das Profil offen ist
    for ring in (ringe[0], ringe[-1]):
        if len(ring) > 1:
            try:
                bm.faces.new(ring)
            except ValueError:
                pass
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = (x * S, y * S, z * S)
    if achse == 'X':
        o.rotation_euler = (0, math.pi / 2, 0)
    if achse == 'Y':
        o.rotation_euler = (-math.pi / 2, 0, 0)
    bpy.context.view_layer.objects.active = o
    return _fertig(o, mat, 0, glatt)


def rohr(name, punkte, r, mat, glatt=True):
    """Schlauch, Kabel oder Rohr entlang von Stützpunkten (Bezier, runder Querschnitt)."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r * S
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(punkte) - 1)
    for p, (x, y, z) in zip(sp.bezier_points, punkte):
        p.co = (x * S, y * S, z * S)
        p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if _AKTIV['teil']:
        o['teil'] = _AKTIV['teil']
    return o


def ausschneiden(obj, schneider):
    """Boolean-Differenz: schneider wird aus obj entfernt und selbst unsichtbar."""
    mod = obj.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = schneider
    mod.solver = 'EXACT'
    schneider.hide_render = True
    schneider.hide_viewport = True
    schneider.display_type = 'WIRE'
    return obj


def drahtgitter(name, w, d, h, x, y, z, mat, dicke=1.2):
    """Kanten eines Quaders als dünne Stäbe (Gehäuseumriss)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w * S, d * S, h * S), verts=bm.verts)
    o = _mesh_obj(name, bm, x, y, z)
    mod = o.modifiers.new('draht', 'WIREFRAME')
    mod.thickness = dicke * S
    mod.use_even_offset = True
    o.data.materials.append(mat)
    o.visible_shadow = False
    return o


def versatz(obj, dx, dy, dz):
    """Versatz für die Explosionsansicht (mm) an einem Dekorationsobjekt, z. B. Gehäuseteil."""
    obj['explosion'] = (dx, dy, dz)
    return obj


def loecher(obj, punkte, r, achse='Z', tiefe=20):
    """Löcher (Kreise) in ein Objekt schneiden: punkte = [(a, b), ...] in der Ebene senkrecht zur Achse, Weltkoordinaten (mm).
    Für achse 'Z' sind (a, b) = (x, y), das Loch geht durch das Objekt auf Höhe seiner Mitte."""
    bm = bmesh.new()
    ox, oy, oz = obj.location
    for a, b in punkte:
        geo = bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=r * S, radius2=r * S, depth=tiefe * S)
        verts = geo['verts']
        if achse == 'Z':
            bmesh.ops.translate(bm, verts=verts, vec=(a * S, b * S, oz))
        elif achse == 'X':
            bmesh.ops.rotate(bm, verts=verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
            bmesh.ops.translate(bm, verts=verts, vec=(ox, a * S, b * S))
        else:
            bmesh.ops.rotate(bm, verts=verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
            bmesh.ops.translate(bm, verts=verts, vec=(a * S, oy, b * S))
    return _schneider(obj, bm, '_loecher')


def _schneider(obj, bm, suffix):
    # In lokale Koordinaten des Objekts umrechnen (Objekte haben hier nur eine Verschiebung, keine Drehung)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(-obj.location.x, -obj.location.y, -obj.location.z))
    me = bpy.data.meshes.new(obj.name + suffix)
    bm.to_mesh(me)
    bm.free()
    cutter = bpy.data.objects.new(obj.name + suffix, me)
    bpy.context.collection.objects.link(cutter)
    cutter['_cutter'] = True
    # Schneider folgt dem Objekt (wichtig für die Explosionsansicht, in der Teile verschoben werden)
    cutter.parent = obj
    ausschneiden(obj, cutter)
    return obj


def schlitze(obj, liste, achse='X'):
    """Rechteckige Schlitze schneiden: liste = [(a, b, breite, hoehe), ...] in der Ebene senkrecht zur Achse (mm, Weltkoordinaten)."""
    bm = bmesh.new()
    ox, oy, oz = obj.location
    for a, b, w, h in liste:
        geo = bmesh.ops.create_cube(bm, size=1.0)
        verts = geo['verts']
        if achse == 'X':
            bmesh.ops.scale(bm, vec=(30 * S, w * S, h * S), verts=verts)
            bmesh.ops.translate(bm, verts=verts, vec=(ox, a * S, b * S))
        elif achse == 'Y':
            bmesh.ops.scale(bm, vec=(w * S, 30 * S, h * S), verts=verts)
            bmesh.ops.translate(bm, verts=verts, vec=(a * S, oy, b * S))
        else:
            bmesh.ops.scale(bm, vec=(w * S, h * S, 30 * S), verts=verts)
            bmesh.ops.translate(bm, verts=verts, vec=(a * S, b * S, oz))
    return _schneider(obj, bm, '_schlitze')
