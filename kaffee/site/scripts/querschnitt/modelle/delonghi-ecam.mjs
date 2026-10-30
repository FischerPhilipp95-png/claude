// De'Longhi ECAM-Bauart (Magnifica S): schematisches 3D-Modell. Maße in Millimetern, y nach oben, z nach vorn (zum Betrachter).
// Gehäuse 238 x 350 x 430 mm. Lage der Teile vereinfacht, aber dort, wo sie bei dieser Bauart sitzen:
// Brühgruppe rechts vorn hinter der Klappe, Wassertank rechts hinten, Mahlwerk unter dem Bohnenbehälter links hinten,
// Thermoblock mittig, Pumpe links hinten unten, Elektronik an der linken Wand.
export function bauen({ THREE, RoundedBoxGeometry, material: M, box, zyl, kugel, torus, schlauch, gruppe }) {
  const W = 238, H = 350, D = 430;
  const teile = {};
  const anker = {};
  const deko = new THREE.Group();
  const T = (id, g, a) => { g.name = id; teile[id] = g; anker[id] = new THREE.Vector3(...a); return g; };

  const schwarz = M.plastik(0x1b1b1d, 0.5), dunkel = M.plastik(0x2c2c2f, 0.6), grau = M.plastik(0x4a4b4f, 0.6);
  const chrom = M.chrom(), alu = M.alu(), kupfer = M.kupfer();

  // ---- Chassis (innen): Bodenplatte, Rückwand, linke Wand, Trägerprofile
  const chassis = M.plastik(0x5c5d61, 0.7);
  deko.add(box(W - 6, 6, D - 8, chassis, 0, 9, 0));
  for (const [x, z] of [[-W / 2 + 14, -D / 2 + 14], [-W / 2 + 14, 40], [W / 2 - 14, -D / 2 + 14], [-W / 2 + 14, D / 2 - 14]]) deko.add(box(12, H - 50, 12, chassis, x, H / 2 - 12, z));
  deko.add(box(W - 20, 10, 12, chassis, 0, H - 20, -D / 2 + 60));
  deko.add(box(6, 230, 170, M.plastik(0x3a3a3e, 0.7), -W / 2 + 6, 190, -110));                                // Platinenträger

  // ---- Elektronik: Leistungsplatine an der linken Wand
  {
    const pcb = M.plastik(0x1f6b3a, 0.5);
    const g = gruppe(box(2, 190, 150, pcb, -W / 2 + 9, 190, -110));
    const chip = M.plastik(0x111111, 0.4);
    for (const [y, z, w, h] of [[150, -160, 14, 14], [150, -120, 22, 10], [200, -170, 10, 8], [200, -140, 10, 8], [230, -90, 18, 18], [120, -60, 8, 20]])
      g.add(box(4, w, h, chip, -W / 2 + 12, y, z));
    for (const [y, z] of [[250, -150], [250, -130], [170, -60]]) g.add(zyl(6, 16, M.plastik(0x1a1a2a, 0.35), -W / 2 + 18, y, z, 'x'));
    g.add(box(16, 20, 24, M.plastik(0x2b4aa8, 0.5), -W / 2 + 18, 215, -175));           // Relais
    g.add(box(24, 26, 30, M.plastik(0x333336, 0.8), -W / 2 + 22, 115, -170));                // Trafo
    g.add(box(6, 10, 40, M.plastik(0xf0f0f0, 0.5), -W / 2 + 13, 270, -100));              // Steckerleiste
    T('elektronik', g, [-W / 2 + 12, 250, -60]);
  }

  // ---- Wassertank rechts hinten (durchsichtig) mit Wasser, Filterkartusche, Schwimmer
  {
    const x0 = 60, x1 = 117, z0 = -212, z1 = -30;
    const g = gruppe();
    const tankMat = M.glas(0xcfe6f7, 0.32, 0.08);
    const tank = new THREE.Mesh(new RoundedBoxGeometry(x1 - x0, 312, z1 - z0, 4, 6), tankMat);
    tank.position.set((x0 + x1) / 2, 176, (z0 + z1) / 2); tank.renderOrder = 5;
    const wasser = new THREE.Mesh(new RoundedBoxGeometry(x1 - x0 - 6, 212, z1 - z0 - 6, 3, 4), M.wasser());
    wasser.position.set((x0 + x1) / 2, 128, (z0 + z1) / 2); wasser.renderOrder = 4;
    g.add(wasser, tank);
    g.add(box(x1 - x0 - 10, 8, 50, M.plastik(0x202022, 0.5), (x0 + x1) / 2, 326, z1 - 40));          // Griff
    g.add(zyl(14, 56, M.plastik(0xf4f4f2, 0.4), (x0 + x1) / 2, 50, z1 - 28));                          // Filter
    g.add(zyl(15, 8, M.plastik(0x2b6cb0, 0.4), (x0 + x1) / 2, 82, z1 - 28));
    g.add(box(18, 10, 18, M.plastik(0x202022, 0.5), (x0 + x1) / 2, 28, z0 + 30));                     // Schwimmer
    g.add(zyl(5, 16, chrom, (x0 + x1) / 2, 14, z1 - 28));                                               // Auslassventil
    T('wassertank', g, [x1, 215, -120]);
  }

  // ---- Pumpe (Ulka) links hinten unten, Achse in z-Richtung
  {
    const g = gruppe();
    const x = -72, y = 42, z = -150;
    g.add(zyl(25, 54, kupfer, x, y, z, 'z'));
    for (const dz of [-24, -12, 0, 12, 24]) g.add(torus(25.5, 2, kupfer, x, y, z + dz, 'z'));
    g.add(zyl(26, 18, schwarz, x, y, z + 36, 'z'));
    g.add(zyl(26, 18, schwarz, x, y, z - 36, 'z'));
    g.add(zyl(4, 24, chrom, x, y, z + 55, 'z'));
    g.add(zyl(4, 24, chrom, x, y, z - 55, 'z'));
    g.add(box(60, 8, 40, M.gummi(0x2a2a2a), x, 15, z));                                                 // Gummilager
    g.add(box(10, 4, 16, M.plastik(0xeeeeee, 0.5), x + 28, y + 8, z - 30));                              // Anschlussfahnen
    T('pumpe', g, [x - 10, y + 24, z + 20]);
  }

  // ---- Durchflussmesser: kleines Gehäuse mit Flügelrad
  {
    const g = gruppe();
    const x = -22, y = 40, z = -100;
    g.add(zyl(14, 12, schwarz, x, y - 10, z));
    g.add(zyl(13, 20, M.glas(0xffffff, 0.35, 0.1), x, y + 6, z));
    for (let i = 0; i < 4; i++) { const f = box(2, 12, 18, M.plastik(0xd12b2b, 0.5), 0, 0, 0); f.rotation.y = (i * Math.PI) / 4; const h = gruppe(f); h.position.set(x, y + 6, z); g.add(h); }
    g.add(zyl(14, 6, schwarz, x, y + 18, z));
    g.add(zyl(4, 14, chrom, x - 18, y - 4, z, 'x'));
    g.add(zyl(4, 14, chrom, x + 18, y - 4, z, 'x'));
    T('flowmeter', g, [x + 14, y + 20, z + 4]);
  }

  // ---- Thermoblock: Aluminiumblock mit Heizpatrone, Thermostat, Anschlüssen
  {
    const g = gruppe();
    const x = -60, y = 190, z = 60;
    const block = new THREE.Mesh(new RoundedBoxGeometry(76, 44, 84, 3, 4), alu); block.position.set(x, y, z); g.add(block);
    for (const dz of [-24, 0, 24]) g.add(box(78, 2, 6, M.metall(0xb9bcbe, 0.5), x, y + 8, z + dz));    // Rippen
    g.add(zyl(9, 20, M.metall(0x9a9c9e, 0.4), x - 48, y, z, 'x'));                                      // Heizpatrone
    g.add(zyl(8, 5, M.plastik(0xf3f3f3, 0.4), x, y + 25, z - 20));                                      // Thermostat
    g.add(zyl(8, 5, M.plastik(0xf3f3f3, 0.4), x, y + 25, z + 20));                                      // Sicherung
    g.add(zyl(5, 14, chrom, x - 10, y - 10, z + 48, 'z'));                                               // Zulauf
    g.add(zyl(5, 14, chrom, x + 28, y + 12, z + 48, 'z'));                                               // Ablauf
    T('thermoblock', g, [x + 30, y + 22, z + 30]);
  }

  // ---- Magnetventil: Messingkörper mit Spule
  {
    const g = gruppe();
    const x = 10, y = 236, z = 22;
    g.add(box(24, 22, 38, M.messing(), x, y, z));
    g.add(zyl(11, 26, schwarz, x, y + 24, z));
    g.add(zyl(4, 10, chrom, x, y + 40, z));
    g.add(zyl(5, 12, chrom, x, y, z + 24, 'z'));
    g.add(zyl(5, 12, chrom, x + 16, y, z, 'x'));
    g.add(box(8, 3, 10, M.plastik(0xeeeeee, 0.5), x - 10, y + 30, z));
    T('ventil', g, [x + 12, y, z + 19]);
  }

  // ---- Bohnenbehälter (versenkt) mit Bohnen und Mahlgradregler, Deckel
  {
    const g = gruppe();
    const x = -36, z = -100;
    const wand = new THREE.Mesh(new THREE.CylinderGeometry(64, 54, 90, 56, 1, true), M.glas(0x9a9a9a, 0.28, 0.1));
    wand.position.set(x, 378, z); wand.renderOrder = 6; g.add(wand);
    g.add(zyl(54, 4, grau, x, 334, z));
    const bohne = M.plastik(0x4a2a15, 0.55);
    const geo = new THREE.SphereGeometry(7, 14, 10); geo.scale(1, 0.62, 0.5);
    let s = 7;
    for (let i = 0; i < 70; i++) {
      s = (s * 9301 + 49297) % 233280; const a = (s / 233280) * Math.PI * 2;
      s = (s * 9301 + 49297) % 233280; const r = Math.sqrt(s / 233280) * 50;
      s = (s * 9301 + 49297) % 233280; const y = 342 + (s / 233280) * 64;
      const b = new THREE.Mesh(geo, bohne); b.position.set(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
      b.rotation.set(a, r, y / 20); g.add(b);
    }
    g.add(zyl(17, 12, M.plastik(0x8e8f92, 0.4), x, 342, z));                                            // Mahlgradregler
    g.add(box(4, 3, 26, schwarz, x, 349, z));
    const deckel = zyl(68, 6, M.glas(0x111111, 0.55, 0.3), x, 426, z); deckel.renderOrder = 7; g.add(deckel);
    g.add(zyl(10, 4, schwarz, x, 431, z));
    T('bohnen', g, [x - 60, 420, z + 20]);
  }

  // ---- Mahlwerk: Gehäuse (zum Betrachter offen), Kegelmahlwerk, Motor mit Wicklung, Pulverschacht zur Brühgruppe
  {
    const g = gruppe();
    const x = -36, z = -100;
    const geh = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 56, 48, 1, true, Math.PI * 0.95, Math.PI * 1.35), dunkel);
    geh.position.set(x, 296, z); g.add(geh);
    g.add(zyl(46, 4, dunkel, x, 266, z));
    g.add(zyl(31, 36, M.metall(0xb0b3b6, 0.3), x, 304, z, 'y', 40, 14));                                 // Mahlkegel
    g.add(zyl(40, 10, M.metall(0x8a8d90, 0.35), x, 281, z));                                            // Mahlring
    g.add(zyl(38, 62, grau, x, 232, z));                                                                 // Motor
    g.add(zyl(39, 22, kupfer, x, 232, z));
    g.add(zyl(10, 12, schwarz, x, 195, z));
    const schacht = zyl(9, 90, grau, x + 50, 258, z + 50, 'y'); schacht.rotation.z = -0.9; schacht.rotation.x = -0.6; g.add(schacht);
    T('mahlwerk', g, [x + 44, 300, z + 24]);
  }

  // ---- Pulverschacht (vorgemahlen): Klappe oben, Trichter nach unten
  {
    const g = gruppe();
    const x = 62, z = -60;
    g.add(box(44, 4, 52, schwarz, x, 352, z));
    g.add(box(36, 2, 10, M.plastik(0x5a5a5e, 0.5), x, 355, z + 22));
    const trichter = new THREE.Mesh(new THREE.CylinderGeometry(18, 7, 46, 32, 1, true), dunkel); trichter.position.set(x, 322, z); g.add(trichter);
    g.add(zyl(7, 50, dunkel, x + 8, 285, z + 40, 'y')); g.children.at(-1).rotation.x = -0.9;
    T('pulverschacht', g, [x + 20, 354, z - 20]);
  }

  // ---- Brühgruppe: Korpus, Brühzylinder, Kolben, rote Entriegelungen, Sieb, Griff, Zahnstange
  {
    const g = gruppe();
    const x = 88, z = 125;
    const korpus = new THREE.Mesh(new RoundedBoxGeometry(54, 150, 108, 3, 4), M.plastik(0x2e2e32, 0.5)); korpus.position.set(x, 160, z); g.add(korpus);
    g.add(box(40, 110, 70, M.plastik(0x2a2a2d, 0.6), x, 150, z - 30));
    g.add(zyl(22, 96, M.plastik(0x56565a, 0.45), x, 190, z + 10));                                       // Brühzylinder
    g.add(zyl(19, 10, M.metall(0x9d9d9d, 0.35), x, 150, z + 10));                                        // Kolben
    g.add(zyl(22, 3, M.metall(0xc8c8c8, 0.3), x, 239, z + 10));                                          // Sieb
    for (const dy of [-36, 0, 36]) g.add(torus(22.5, 2.2, M.gummi(0x111111), x, 160 + dy, z + 10));     // Dichtringe
    g.add(box(10, 28, 12, M.plastik(0xc0232a, 0.45), x - 30, 200, z + 20));                              // rote Taste links
    g.add(box(10, 28, 12, M.plastik(0xc0232a, 0.45), x + 30, 200, z + 20));                              // rote Taste rechts
    g.add(box(36, 10, 18, schwarz, x, 230, z + 62));                                                     // Griff
    g.add(box(5, 150, 4, M.metall(0x8a8a8a, 0.45), x + 31, 160, z - 40));                                // Zahnstange
    for (let i = 0; i < 12; i++) g.add(box(5, 4, 6, M.metall(0x8a8a8a, 0.45), x + 31, 95 + i * 12, z - 36));
    g.add(zyl(12, 6, grau, x + 30, 120, z - 60, 'x'));                                                  // Antriebsrad
    g.add(zyl(14, 34, M.plastik(0x6a3b1f, 0.7), x, 108, z + 40));                                        // Trester-Abwurf
    T('bruehgruppe', g, [x + 30, 182, z + 54]);
  }

  // ---- Oberer Brühkolben: fest im Gerät, mit Halter und Schlauchanschluss
  {
    const g = gruppe();
    const x = 88, z = 135;
    g.add(zyl(21, 36, M.metall(0xb8b8b8, 0.3), x, 262, z));
    g.add(torus(21.5, 2.2, M.gummi(0x111111), x, 250, z));
    g.add(box(50, 8, 46, M.plastik(0x333336, 0.6), x, 284, z));
    g.add(zyl(5, 14, chrom, x, 294, z));
    T('bruehkopf', g, [x + 22, 262, z + 10]);
  }

  // ---- Kaffeesatzbehälter: durchsichtig braun, mit Kaffeepucks
  {
    const g = gruppe();
    const x = -56, z = 148;
    const beh = new THREE.Mesh(new RoundedBoxGeometry(90, 100, 100, 3, 4), M.glas(0x6b4a36, 0.5, 0.25)); beh.position.set(x, 82, z); beh.renderOrder = 5; g.add(beh);
    const puck = M.plastik(0x3a2416, 0.95);
    for (const [dx, dy, dz, r] of [[-20, 40, -10, 0.2], [18, 42, 20, -0.4], [-6, 52, 8, 0.9], [10, 62, -16, 0.1]]) { const p = zyl(19, 9, puck, x + dx, dy, z + dz); p.rotation.set(r, 0, r / 2); g.add(p); }
    g.add(box(90, 8, 10, M.plastik(0x2a2a2d, 0.5), x, 128, z + 50));
    T('satzbehaelter', g, [x - 45, 128, z + 50]);
  }

  // ---- Abtropfschale mit Edelstahlrost und rotem Schwimmer
  {
    const g = gruppe();
    const schale = new THREE.Mesh(new RoundedBoxGeometry(222, 30, 180, 3, 4), schwarz); schale.position.set(0, 27, 130); g.add(schale);
    for (let x = -100; x <= 100; x += 11) g.add(box(4, 3, 160, M.metall(0xc0c3c6, 0.3), x, 43, 130));
    g.add(box(222, 3, 10, M.metall(0xc0c3c6, 0.3), 0, 43, 55)); g.add(box(222, 3, 10, M.metall(0xc0c3c6, 0.3), 0, 43, 205));
    g.add(zyl(5, 12, M.plastik(0xd12b2b, 0.4), 96, 48, 212));
    T('abtropfschale', g, [-111, 44, 220]);
  }

  // ---- Kaffeeauslauf: höhenverstellbar an zwei Chromschienen, zwei Düsen
  {
    const g = gruppe();
    const z = D / 2 + 20;
    const aus = new THREE.Mesh(new RoundedBoxGeometry(64, 84, 40, 4, 4), M.plastik(0x1f1f21, 0.4)); aus.position.set(0, 150, z); g.add(aus);
    g.add(box(60, 30, 44, M.plastik(0x2f2f32, 0.5), 0, 190, z - 6));
    for (const dx of [-12, 12]) g.add(zyl(5, 12, chrom, dx, 104, z + 4));
    for (const dx of [-24, 24]) g.add(zyl(3.5, 140, chrom, dx, 190, D / 2 + 2));
    g.add(box(6, 50, 2, M.plastik(0x9a9a9a, 0.4), -34, 150, z + 20));                                   // Einstellmarkierung
    T('auslauf', g, [-34, 150, z + 22]);
  }

  // ---- Milchaufschäumer: Dampfrohr rechts vorn, Düse mit Gummiring, Dampfdrehknopf
  {
    const g = gruppe();
    const x = W / 2 + 18, z = 150;
    g.add(zyl(5.5, 26, chrom, W / 2 + 10, 262, z, 'x'));
    g.add(zyl(5.5, 128, chrom, x + 6, 200, z));
    g.add(torus(6, 2.5, M.gummi(0x111111), x + 6, 150, z));
    g.add(zyl(11, 46, M.plastik(0x1f1f21, 0.4), x + 6, 118, z, 'y', 40, 8));                              // Düse
    g.add(zyl(5, 10, M.plastik(0x3b3b3f, 0.5), x + 6, 92, z, 'y', 24, 3));
    g.add(zyl(17, 12, M.plastik(0x1f1f21, 0.45), W / 2 + 4, 300, z + 50, 'x'));                           // Dampfknopf
    g.add(box(6, 4, 22, M.plastik(0xdadada, 0.4), W / 2 + 10, 300, z + 56));
    T('aufschaeumer', g, [x + 18, 112, z + 10]);
  }

  // ---- Bedienfeld oben vorn: Tasten, Aroma-Drehregler, Leuchten
  {
    const g = gruppe();
    const z = 176;
    g.add(box(186, 4, 66, M.plastik(0x151517, 0.35), 0, H + 2, z));
    g.add(box(190, 3, 70, M.metall(0xbfc2c5, 0.35), 0, H - 1, z));
    for (const dx of [-70, -42, 42, 70]) { g.add(zyl(10, 3, M.metall(0xd5d7d9, 0.3), dx, H + 5, z + 8)); g.add(zyl(8, 2, M.plastik(0x202022, 0.4), dx, H + 7, z + 8)); }
    g.add(zyl(15, 8, M.plastik(0x2a2a2d, 0.4), 0, H + 8, z + 4)); g.add(box(3, 2, 20, M.plastik(0xdadada, 0.4), 0, H + 13, z + 4));
    for (const [dx, f] of [[-56, 0xffa200], [-28, 0xff2d2d], [28, 0xffa200], [56, 0x2eff6a]]) g.add(zyl(3.5, 2, M.led(f), dx, H + 5, z - 18));
    T('bedienfeld', g, [-60, H + 10, z - 26]);
  }

  // ---- Gehäuse durchsichtig (Geisterflächen), zuletzt gezeichnet
  {
    const shell = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 10, 6), M.glas(0xe4e8ec, 0.05, 0.15)); shell.position.set(0, H / 2, 0); shell.renderOrder = 20; shell.userData.keinSchatten = true; deko.add(shell);
    const kanten = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), new THREE.LineBasicMaterial({ color: 0x3b3b3f, transparent: true, opacity: 0.55 })); kanten.position.set(0, H / 2, 0); kanten.userData.keinSchatten = true; deko.add(kanten);
    // Brühgruppenklappe rechts als Rahmen
    const tuer = new THREE.Mesh(new RoundedBoxGeometry(3, 240, 150, 2, 2), M.glas(0xbbbbbb, 0.2, 0.3)); tuer.position.set(W / 2 + 1, 170, 120); tuer.renderOrder = 21; tuer.userData.keinSchatten = true; deko.add(tuer);
    deko.add(zyl(5, 40, M.plastik(0x8a8a8a, 0.4), W / 2 + 3, 180, 48));                                  // Klappengriff
  }

  // ---- Schläuche und Kabel
  {
    const sil = M.plastik(0xf2f2ee, 0.4);
    const r = 3.6;
    deko.add(schlauch([[88, 10, -58], [60, 12, -120], [-30, 20, -200], [-72, 42, -200]], r, sil));         // Tank → Pumpe
    deko.add(schlauch([[-72, 42, -96], [-60, 40, -110], [-40, 36, -100]], r, sil));                        // Pumpe → Flowmeter
    deko.add(schlauch([[-4, 36, -100], [-30, 60, -60], [-72, 120, 20], [-72, 168, 60]], r, sil));            // Flowmeter → Thermoblock
    deko.add(schlauch([[-28, 212, 60], [-10, 232, 40], [10, 236, 46]], r, sil));                             // Thermoblock → Ventil
    deko.add(schlauch([[26, 236, 22], [60, 280, 90], [88, 300, 135]], r, sil));                             // Ventil → Brühkopf
    deko.add(schlauch([[10, 276, 22], [70, 310, 90], [116, 290, 150], [124, 262, 150]], r, sil));           // Ventil → Dampf
    const rot = M.plastik(0xc62828, 0.5), blau = M.plastik(0x1e4fb8, 0.5);
    deko.add(schlauch([[-110, 270, -100], [-106, 250, -40], [-80, 216, 40], [-60, 216, 40]], 1.6, rot));     // Platine → Thermoblock
    deko.add(schlauch([[-110, 265, -105], [-108, 246, -46], [-84, 216, 70], [-60, 216, 80]], 1.6, blau));
    deko.add(schlauch([[-110, 120, -130], [-100, 70, -160], [-72, 52, -180]], 1.6, rot));                   // Platine → Pumpe
    deko.add(schlauch([[-110, 115, -140], [-100, 65, -170], [-72, 52, -186]], 1.6, blau));
    deko.add(schlauch([[-110, 230, -140], [-80, 240, -120], [-60, 230, -100]], 1.6, rot));                  // Platine → Mahlwerk
  }

  const g = new THREE.Group();
  g.add(deko);
  for (const t of Object.values(teile)) g.add(t);

  return {
    gruppe: g, teile, deko, anker,
    kamera: { position: new THREE.Vector3(860, 930, 940), ziel: new THREE.Vector3(0, 165, -10) },
    // Label-Spalten (links, rechts, oben), von oben nach unten
    labels: {
      links: ['elektronik', 'bedienfeld', 'ventil', 'thermoblock', 'bruehkopf', 'satzbehaelter', 'auslauf', 'abtropfschale'],
      rechts: ['pulverschacht', 'wassertank', 'pumpe', 'flowmeter', 'bruehgruppe', 'aufschaeumer'],
      oben: ['bohnen', 'mahlwerk'],
    },
  };
}
