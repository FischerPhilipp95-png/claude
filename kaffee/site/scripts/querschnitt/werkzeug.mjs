// Material- und Geometriehelfer für die Modelle (laufen im Browser, three.js aus /three).
import * as THREE from 'three';

export const material = {
  plastik: (farbe, rauheit = 0.55) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rauheit, metalness: 0 }),
  gummi: (farbe) => new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.95, metalness: 0 }),
  metall: (farbe, rauheit = 0.32) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rauheit, metalness: 0.92 }),
  chrom: () => new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.12, metalness: 1 }),
  alu: () => new THREE.MeshStandardMaterial({ color: 0xcfd2d4, roughness: 0.45, metalness: 0.85 }),
  kupfer: () => new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.35, metalness: 0.95 }),
  messing: () => new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.38, metalness: 0.9 }),
  glas: (farbe, deckung = 0.35, rauheit = 0.12) => new THREE.MeshPhysicalMaterial({ color: farbe, roughness: rauheit, metalness: 0, transparent: true, opacity: deckung, depthWrite: false, side: THREE.DoubleSide }),
  wasser: () => new THREE.MeshPhysicalMaterial({ color: 0x4f9ee0, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false }),
  led: (farbe) => new THREE.MeshStandardMaterial({ color: farbe, emissive: farbe, emissiveIntensity: 1.6, roughness: 0.4 }),
};

export function werkzeug(T) {
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, radius = 0) => {
    const g = radius ? new T.BoxGeometry(w, h, d) : new T.BoxGeometry(w, h, d);
    const m = new T.Mesh(g, mat); m.position.set(x, y, z); return m;
  };
  const zyl = (r, h, mat, x = 0, y = 0, z = 0, achse = 'y', seg = 48, rOben = r) => {
    const m = new T.Mesh(new T.CylinderGeometry(rOben, r, h, seg), mat);
    if (achse === 'x') m.rotation.z = Math.PI / 2;
    if (achse === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z); return m;
  };
  const kugel = (r, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(new T.SphereGeometry(r, 32, 24), mat); m.position.set(x, y, z); return m; };
  const torus = (r, rohr, mat, x = 0, y = 0, z = 0, achse = 'y') => {
    const m = new T.Mesh(new T.TorusGeometry(r, rohr, 16, 48), mat);
    if (achse === 'y') m.rotation.x = Math.PI / 2;
    if (achse === 'x') m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z); return m;
  };
  /** Schlauch oder Kabel entlang von Stützpunkten */
  const schlauch = (punkte, r, mat) => {
    const kurve = new T.CatmullRomCurve3(punkte.map((p) => new T.Vector3(...p)), false, 'catmullrom', 0.4);
    return new T.Mesh(new T.TubeGeometry(kurve, 64, r, 12, false), mat);
  };
  const gruppe = (...kinder) => { const g = new T.Group(); kinder.forEach((k) => g.add(k)); return g; };
  return { box, zyl, kugel, torus, schlauch, gruppe };
}
