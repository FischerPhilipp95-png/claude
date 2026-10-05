// ================= Ventil im Schnitt (Wiedererkennungsbild) =================
// pin: 0 = Stift drinnen (Ventil zu), 1 = Stift draußen (Ventil offen). stuck > 0: Stift zittert, rotes „klemmt“.
function valveSection(ctx, t, cx, cy, s, pin, { stuck = 0, labels = true } = {}) {
  const lift = clamp(pin), jit = stuck * Math.sin(t * 42) * 3;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  // Rohre: Zulauf unten links, Abgang oben rechts zum Heizkörper
  ctx.fillStyle = '#8A8F9A'; ctx.fillRect(-390, 96, 250, 40); ctx.fillRect(140, 0, 250, 40);
  // Gehäuse (Messing) und Innenraum
  ctx.fillStyle = '#B08D57'; rrect(ctx, -150, -60, 300, 220, 26); ctx.fill();
  ctx.fillStyle = '#1E2430'; rrect(ctx, -130, -40, 260, 180, 16); ctx.fill();
  // Wasser: unten immer (Zulauf), oben nur, wenn offen
  ctx.fillStyle = '#2F6FD6'; ctx.fillRect(-390, 100, 250, 32); ctx.fillRect(-130, 86, 260, 54);
  ctx.globalAlpha = lift; ctx.fillRect(-130, -40, 260, 110); ctx.fillRect(140, 4, 250, 32); ctx.globalAlpha = 1;
  // Ventilsitz mit Öffnung
  ctx.fillStyle = '#B08D57'; ctx.fillRect(-130, 70, 94, 16); ctx.fillRect(36, 70, 94, 16);
  // Ventilteller, Spindel, Stift
  const discY = 52 - lift * 46, pinTop = -60 - (14 + lift * 34);
  ctx.fillStyle = '#D9DCE3'; rrect(ctx, -56 + jit, discY, 112, 18, 5); ctx.fill();
  ctx.fillStyle = '#C9CCD4'; ctx.fillRect(-9 + jit, pinTop, 18, discY - pinTop);
  ctx.fillStyle = stuck > 0.5 ? C.red : C.lime; rrect(ctx, -11 + jit, pinTop - 4, 22, 22, 6); ctx.fill();   // Stiftkopf
  // Feder zwischen Stopfbuchse und Teller
  ctx.strokeStyle = '#E8C547'; ctx.lineWidth = 4; ctx.beginPath();
  const y0 = -36, y1 = discY - 2, n = 7;
  for (let i = 0; i <= n * 2; i++) { const yy = lerp(y0, y1, i / (n * 2)), xx = (i % 2 ? 24 : -24) + jit; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke();
  // Stopfbuchse
  ctx.fillStyle = '#7A6A4A'; rrect(ctx, -40, -86, 80, 30, 6); ctx.fill();
  // fließendes Wasser
  if (lift > 0.15) {
    const pts = [[-390, 116], [-40, 116], [0, 98], [0, 40], [140, 20], [390, 20]], segL = [];
    let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segL.push(d); tot += d; }
    ctx.fillStyle = '#BFE3FF';
    for (let i = 0; i < 22; i++) {
      let d = ((t * 0.28 * lift + i / 22) % 1) * tot, k = 0;
      while (k < segL.length - 1 && d > segL[k]) { d -= segL[k]; k++; }
      const q = d / segL[k], px = lerp(pts[k][0], pts[k + 1][0], q), py = lerp(pts[k][1], pts[k + 1][1], q);
      ctx.globalAlpha = lift; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (labels) {
    const lab = (s_, x, y, col = '#CFCFCF', al = 'left') => text(ctx, s_, x, y, 24, 'ISB', col, al);
    lab('Stift', 40, pinTop + 12, C.lime); lab('Feder', 64, -10, '#E8C547'); lab('Ventilteller', -150, discY - 14, '#D9DCE3', 'right');
    lab('Zulauf', -390, 170); lab('zum Heizkörper', 390, -14, '#CFCFCF', 'right');
    text(ctx, lift > 0.5 ? 'offen' : 'zu', 0, 210, 34, 'IXB', lift > 0.5 ? C.blue : '#8A8A8E', 'center');
  }
  if (stuck > 0) {
    ctx.save(); ctx.globalAlpha = clamp(stuck * 2);
    ctx.fillStyle = C.red; rrect(ctx, -130, pinTop - 70, 120, 44, 22); ctx.fill(); text(ctx, 'klemmt', -70, pinTop - 39, 24, 'IXB', '#fff', 'center');
    ctx.restore();
  }
  ctx.restore();
}

// Thermostatkopf von der Seite (steht senkrecht auf dem Ventil), Mutter unten
function headSide(ctx, cx, bottomY, s, { num = 3, nutRot = 0 } = {}) {
  ctx.save(); ctx.translate(cx, bottomY); ctx.scale(s, s);
  shadow(ctx, 0.35, 20, 6); ctx.fillStyle = '#F2F2F0'; rrect(ctx, -70, -190, 140, 170, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = '#DADAD6'; for (let i = 0; i < 6; i++) ctx.fillRect(-56 + i * 22, -176, 8, 110);
  ctx.fillStyle = '#9EA3AD'; rrect(ctx, -78, -24, 156, 28, 8); ctx.fill();
  ctx.strokeStyle = '#6E737D'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = -70 + ((i * 28 + nutRot * 60) % 150); ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x, 2); ctx.stroke(); }
  ctx.fillStyle = C.ink; rrect(ctx, -26, -60, 52, 40, 8); ctx.fill(); text(ctx, String(num), 0, -28, 32, 'IXB', C.lime, 'center');
  ctx.restore();
}

// Pfeil im Kreis (dir = -1 gegen, +1 im Uhrzeigersinn)
function turnArrow(ctx, cx, cy, r, dir, col, a = 1, t = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const a0 = -Math.PI * 0.85 + Math.sin(t * 3) * 0.08 * dir, a1 = a0 + Math.PI * 1.1;
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  const tip = dir < 0 ? a0 : a1, tx = cx + Math.cos(tip) * r, ty = cy + Math.sin(tip) * r, tang = tip + (dir < 0 ? -Math.PI / 2 : Math.PI / 2);
  ctx.beginPath(); ctx.moveTo(tx + Math.cos(tang) * 18, ty + Math.sin(tang) * 18); ctx.lineTo(tx + Math.cos(tang + 2.4) * 16, ty + Math.sin(tang + 2.4) * 16); ctx.lineTo(tx + Math.cos(tang - 2.4) * 16, ty + Math.sin(tang - 2.4) * 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ================= Inhalte der Kapitel =================
// steps: [Text, Satz-ID, Wort, n] → erscheint genau, wenn das Wort gesprochen wird
const DATA = {
  1: { tag: 'So funktioniert’s', badge: '?', title: 'Das Ventil im Schnitt', src: 'thermondo, Vattenfall', card: 'SCHEMA · THERMOSTATVENTIL IM SCHNITT',
    steps: [['Stift drinnen = Ventil zu', 'c1_0', 'drinnen'], ['Stift draußen = Ventil offen', 'c1_0', 'draußen'], ['Klemmt drinnen: bleibt kalt', 'c1_1', 'klemmt'], ['Klemmt draußen: wird nicht kalt', 'c1_1', 'klemmt', 1], ['Oft nach dem Sommer auf 0', 'c1_1', 'sommer']] },
  2: { tag: 'Schritt 1 und 2', badge: '1', title: 'Thermostat auf 5, Kopf ab', src: 'Verbraucherzentrale, co2online', card: 'SCHRITT 1 · THERMOSTAT AUF 5',
    steps: [['Thermostat voll auf: 5', 'c2_0', 'dreh'], ['Entlastet das Ventil', 'c2_0', 'entlastet'], ['Überwurfmutter: Wasserpumpenzange', 'c2_1', 'überwurfmutter'], ['Schelle: Schraube lösen', 'c2_2', 'schelle'], ['Bajonett: hinteren Ring drehen', 'c2_2', 'bajonett']] },
  3: { tag: 'Schritt 3 und 4', badge: '3', title: 'Stift prüfen und lösen', src: 'thermondo, Vattenfall, co2online, Verbraucherzentrale', card: 'SCHEMA · STIFT UNTER DEM KOPF',
    steps: [['Steht ca. 5 mm heraus', 'c3_0', 'millimeter'], ['Lässt sich leicht eindrücken', 'c3_0', 'finger'], ['Fester Gegenstand: ein paarmal drücken', 'c3_1', 'drück'], ['Ganz leicht klopfen', 'c3_1', 'klopf'], ['Vorsichtig mit der Zange ziehen', 'c3_2', 'zieh'], ['Schmierspray, ohne Gewalt', 'c3_2', 'schmierspray']] },
  4: { tag: 'Schritt 5 und danach', badge: '5', title: 'Kopf drauf, und wenn nichts hilft', src: 'thermondo, Verbraucherzentrale, Viessmann', card: 'SCHRITT 5 · KOPF WIEDER DRAUF',
    steps: [['Auf 5 stellen, ansetzen, andrücken', 'c4_0', 'auf'], ['Mutter im Uhrzeigersinn festziehen', 'c4_0', 'mutter'], ['Stift fest? Ventiloberteil: Fachbetrieb', 'c4_1', 'ventiloberteil'], ['Mietwohnung: Sache des Vermieters', 'c4_1', 'mietwohnung'], ['Im Sommer offen lassen, kein Frostschutz', 'c4_2', 'sommer']] },
};
const stepTimes = (k) => DATA[k].steps.map((s) => wordTime(s[1], s[2], s[3] || 0) - 0.08);

function header(ctx, t, k) {
  const d = DATA[k], tin = easeOut(seg(t, CH[k].start + 0.5, CH[k].start + 1.0));
  text(ctx, d.tag, -900, -462, 18, 'ISB', C.gray, 'left', tin, 1);
  ctx.save(); ctx.globalAlpha = tin;
  ctx.fillStyle = C.ink; rrect(ctx, -900, -438, 80, 70, 16); ctx.fill(); text(ctx, d.badge, -860, -388, 44, 'IXB', C.lime, 'center');
  text(ctx, d.title, -796, -383, 60, 'IXB', C.ink);
  ctx.restore();
}

// ----- linke Karte (weiß, dunkler Bildbereich 788 x 538) -----
const CARD = { x: -900, y: -330, w: 820, h: 600 };
function leftCard(ctx, t, k) {
  const tin = CH[k].start + 0.7, p = spring(seg(t, tin, tin + 0.6));
  if (p <= 0) return;
  const { x, y, w, h } = CARD;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.14, 30, 12); ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 14); ctx.fill(); noShadow(ctx);
  const vx = 16, vy = 46, vw = w - 32, vh = h - 62;
  const lab = cardLabel(t, k);
  text(ctx, lab[0], 20, 32, 14, 'ISB', C.gray, 'left', 1, 2);
  if (lab[1]) text(ctx, lab[1], w - 20, 32, 14, 'ISB', '#AAAAAA', 'right');
  ctx.fillStyle = C.view; rrect(ctx, vx, vy, vw, vh, 10); ctx.fill();
  ctx.save(); rrect(ctx, vx, vy, vw, vh, 10); ctx.clip(); ctx.translate(vx, vy);
  ({ 1: drawSchnitt, 2: drawKopfAb, 3: drawStift, 4: drawKopfDrauf })[k](ctx, t, vw, vh);
  ctx.restore();
  ctx.restore();
  if (k === 2 && t < wordTime('c2_1', 'schritt') + 0.3) text(ctx, 'Foto: BOOM Photography / Pexels', x, y + h + 22, 14, 'IM', C.gray);
  selection(ctx, x, y, w, h, (1 - seg(t, tin + 0.9, tin + 1.2)) * clamp(p * 2));
}
function cardLabel(t, k) {
  if (k === 2) return t < wordTime('c2_1', 'schritt') ? ['SCHRITT 1 · THERMOSTAT AUF 5', 'Foto'] : ['SCHRITT 2 · SO GEHT DER KOPF AB', 'Schema'];
  if (k === 4) return t < CH[4].L[1].t - 0.2 ? [DATA[4].card, 'vereinfacht'] : t < CH[4].L[2].t - 0.2 ? ['WENN DER STIFT FEST BLEIBT', ''] : ['VORBEUGEN · IM SOMMER', ''];
  return [DATA[k].card, 'vereinfacht'];
}

// Kapitel 1: Ventil auf/zu, dann klemmt drinnen (kalt) bzw. draußen (heiß)
function drawSchnitt(ctx, t, w, h) {
  const tIn = wordTime('c1_0', 'drinnen'), tOut = wordTime('c1_0', 'draußen'), tK1 = wordTime('c1_1', 'klemmt'), tK2 = wordTime('c1_1', 'klemmt', 1), tS = wordTime('c1_1', 'sommer');
  let pin = 1, stuck = 0;
  if (t >= tIn - 0.2) pin = 1 - easeInOut(seg(t, tIn - 0.2, tIn + 0.4));
  if (t >= tOut - 0.2) pin = easeInOut(seg(t, tOut - 0.2, tOut + 0.4));
  if (t >= tK1 - 0.2) { pin = 1 - easeInOut(seg(t, tK1 - 0.2, tK1 + 0.3)); stuck = easeOut(seg(t, tK1, tK1 + 0.3)); }
  if (t >= tK2 - 0.2) { pin = easeInOut(seg(t, tK2 - 0.2, tK2 + 0.3)); stuck = 1; }
  valveSection(ctx, t, 330, 240, 0.78, pin, { stuck });
  // Wärmebild-Kachel rechts oben: kalt bzw. heiß
  const th = easeOut(seg(t, tK1, tK1 + 0.4));
  if (th > 0) {
    ctx.save(); ctx.globalAlpha = th;
    const hot = t >= tK2;
    radiator(ctx, w - 190, 30, 160, 110, hot ? FIELD.normal() : FIELD.cold(t), 8);
    text(ctx, hot ? 'wird nicht kalt' : 'bleibt kalt', w - 110, 170, 22, 'IXB', hot ? '#FF8A1C' : C.blue, 'center');
    ctx.restore();
  }
  const sp = easeOut(seg(t, tS - 0.1, tS + 0.3));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = sp; ctx.fillStyle = '#FFD400'; rrect(ctx, 24, h - 70, 330, 46, 23); ctx.fill(); text(ctx, 'Sommer: monatelang auf 0', 189, h - 39, 22, 'IXB', C.ink, 'center'); ctx.restore(); }
}
// Kapitel 2: erst das echte Foto (Thermostat auf 5), dann die drei Befestigungen
function drawKopfAb(ctx, t, w, h) {
  const tS2 = wordTime('c2_1', 'schritt'), sw = easeInOut(seg(t, tS2 - 0.2, tS2 + 0.4));
  if (sw < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - sw;
    const img = IMG.hand, s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s, ox = clamp(w / 2 - 0.5 * dw, w - dw, 0), oy = clamp(h / 2 - 0.5 * dh, h - dh, 0);
    ctx.drawImage(img, ox, oy, dw, dh);
    const r = spring(seg(t, wordTime('c2_0', 'fünf') - 0.1, wordTime('c2_0', 'fünf') + 0.4));
    if (r > 0) {
      const fx = ox + 0.75 * dw, fy = oy + 0.268 * dh;
      ctx.strokeStyle = C.lime; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(fx, fy, 46 * lerp(1.8, 1, r), 0, 7); ctx.stroke();
      ctx.fillStyle = C.ink; rrect(ctx, fx - 260, fy - 30, 190, 56, 28); ctx.fill(); text(ctx, 'voll auf: 5', fx - 165, fy + 8, 26, 'IXB', C.lime, 'center');
    }
    const e = easeOut(seg(t, wordTime('c2_0', 'entlastet') - 0.1, wordTime('c2_0', 'entlastet') + 0.3));
    if (e > 0) { ctx.globalAlpha *= e; ctx.fillStyle = 'rgba(12,12,13,0.85)'; rrect(ctx, 24, h - 76, 470, 52, 26); ctx.fill(); text(ctx, 'entlastet das Ventil, Kopf geht leichter ab', 259, h - 42, 21, 'ISB', '#fff', 'center'); }
    ctx.restore();
  }
  if (sw > 0) {
    ctx.save(); ctx.globalAlpha *= sw;
    const cols = [
      ['Überwurfmutter', 'Wasserpumpenzange', wordTime('c2_1', 'überwurfmutter'), 'nut'],
      ['Schelle', 'Schraube lösen', wordTime('c2_2', 'schelle'), 'clamp'],
      ['Bajonett', 'ohne Werkzeug', wordTime('c2_2', 'bajonett'), 'bayonet'],
    ];
    cols.forEach(([name, tool, tt, kind], i) => {
      const cx = 131 + i * 263, cy = 250, on = t >= tt - 0.1, a = on ? 1 : 0.3, pop = spring(seg(t, tt - 0.1, tt + 0.4));
      ctx.save(); ctx.globalAlpha *= a;
      if (on) { ctx.strokeStyle = C.lime; ctx.lineWidth = 4; rrect(ctx, cx - 120, 24, 240, h - 48, 18); ctx.stroke(); }
      text(ctx, name, cx, 72, 26, 'IXB', '#fff', 'center');
      // Kopf von vorn
      ctx.fillStyle = '#F2F2F0'; ctx.beginPath(); ctx.arc(cx, cy, 62, 0, 7); ctx.fill();
      ctx.fillStyle = '#DADAD6'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill();
      if (kind === 'nut') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 14; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const an = j / 6 * Math.PI * 2 + Math.PI / 6; j ? ctx.lineTo(cx + Math.cos(an) * 84, cy + Math.sin(an) * 84) : ctx.moveTo(cx + Math.cos(an) * 84, cy + Math.sin(an) * 84); } ctx.stroke(); turnArrow(ctx, cx, cy, 104, -1, C.lime, on ? pop : 0, t); }
      if (kind === 'clamp') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, 78, 0, 7); ctx.stroke(); ctx.fillStyle = '#9EA3AD'; rrect(ctx, cx + 70, cy - 18, 40, 36, 6); ctx.fill(); ctx.fillStyle = '#5A5F69'; ctx.beginPath(); ctx.arc(cx + 90, cy, 12, 0, 7); ctx.fill(); ctx.strokeStyle = '#C9CCD4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 82, cy - 6); ctx.lineTo(cx + 98, cy + 6); ctx.stroke(); }
      if (kind === 'bayonet') { ctx.strokeStyle = '#9EA3AD'; ctx.lineWidth = 12; ctx.setLineDash([26, 12]); ctx.beginPath(); ctx.arc(cx, cy, 80, 0, 7); ctx.stroke(); ctx.setLineDash([]); turnArrow(ctx, cx, cy, 104, -1, C.lime, on ? pop : 0, t); }
      text(ctx, tool, cx, 410, 22, 'ISB', on ? C.lime : '#CFCFCF', 'center');
      if (kind !== 'clamp') text(ctx, 'gegen den Uhrzeigersinn', cx, 442, 17, 'IM', '#9A9A9A', 'center');
      ctx.restore();
    });
    ctx.restore();
  }
}
// Kapitel 3: Stift in Nahaufnahme; prüfen, klemmt, drücken, klopfen, Zange, Spray, federt wieder
function drawStift(ctx, t, w, h) {
  const W_ = (id, wd, n = 0) => wordTime(id, wd, n);
  const tMM = W_('c3_0', 'millimeter'), tF = W_('c3_0', 'finger'), tK = W_('c3_1', 'klemmt'), tD = W_('c3_1', 'drück'), tH = W_('c3_1', 'klopf'),
    tZ = W_('c3_2', 'zieh'), tSp = W_('c3_2', 'schmierspray'), tG = W_('c3_2', 'gewalt'), tOk = CH[3].L[3].t;
  const cx = 300, base = 360, full = 90;
  // Stiftlänge über der Stopfbuchse
  let len = full, stuck = 0;
  const press = Math.sin(Math.PI * seg(t, tF + 0.2, tF + 1.4));
  if (t < tK - 0.2) len = full - press * 72;
  else if (t < tOk) { len = lerp(full, 14, easeInOut(seg(t, tK - 0.2, tK + 0.3))); stuck = 1; }
  else { len = lerp(14, full, spring(seg(t, tOk, tOk + 0.7))); }
  const jit = stuck * Math.sin(t * 40) * 2;
  // Ventil-Oberteil (Messing) mit Gewinde, Stopfbuchse, Stift
  ctx.fillStyle = '#B08D57'; rrect(ctx, cx - 150, base, 300, 180, 18); ctx.fill();
  ctx.strokeStyle = '#8C6F42'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx - 150, base + 20 + i * 14); ctx.lineTo(cx + 150, base + 26 + i * 14); ctx.stroke(); }
  ctx.fillStyle = '#7A6A4A'; rrect(ctx, cx - 50, base - 30, 100, 34, 8); ctx.fill();
  ctx.fillStyle = '#C9CCD4'; rrect(ctx, cx - 14 + jit, base - 30 - len, 28, len + 4, 8); ctx.fill();
  ctx.fillStyle = stuck ? C.red : C.lime; rrect(ctx, cx - 16 + jit, base - 34 - len, 32, 16, 6); ctx.fill();
  // Maß ca. 5 mm
  const ma = easeOut(seg(t, tMM - 0.1, tMM + 0.3)) * (1 - seg(t, tK - 0.4, tK));
  if (ma > 0) {
    ctx.save(); ctx.globalAlpha = ma; ctx.strokeStyle = '#FFD400'; ctx.lineWidth = 3; const rx = cx + 60;
    ctx.beginPath(); ctx.moveTo(rx, base - 30); ctx.lineTo(rx, base - 34 - full); ctx.moveTo(rx - 10, base - 30); ctx.lineTo(rx + 10, base - 30); ctx.moveTo(rx - 10, base - 34 - full); ctx.lineTo(rx + 10, base - 34 - full); ctx.stroke();
    text(ctx, 'ca. 5 mm', rx + 20, base - 70, 30, 'IXB', '#FFD400'); ctx.restore();
  }
  // Finger drückt (prüfen)
  if (t > tF - 0.3 && t < tF + 1.8) {
    const fy = base - 34 - (full - press * 72) - 70, a = easeOut(seg(t, tF - 0.3, tF)) * (1 - seg(t, tF + 1.4, tF + 1.8));
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#E7B38F'; rrect(ctx, cx - 40, fy - 120, 80, 190, 40); ctx.fill(); ctx.fillStyle = '#F3D2BD'; rrect(ctx, cx - 26, fy + 26, 52, 36, 14); ctx.fill(); ctx.restore();
    text(ctx, 'federt zurück', cx + 80, 120, 26, 'IXB', C.lime, 'left', seg(t, tF + 1.0, tF + 1.3) * (1 - seg(t, tF + 1.5, tF + 1.8)));
  }
  if (stuck) { ctx.fillStyle = C.red; rrect(ctx, cx - 210, base - 150, 130, 46, 23); ctx.fill(); text(ctx, 'klemmt', cx - 145, base - 118, 24, 'IXB', '#fff', 'center'); }
  // Werkzeuge, eins nach dem anderen
  const tool = (t0, t1) => easeOut(seg(t, t0 - 0.2, t0 + 0.2)) * (1 - easeOut(seg(t, t1 - 0.3, t1)));
  const top = base - 34 - len;
  const aD = tool(tD, tH);
  if (aD > 0) { const pr = Math.abs(Math.sin((t - tD) * 7)); ctx.save(); ctx.globalAlpha = aD; ctx.fillStyle = '#5A5F69'; rrect(ctx, cx - 50, top - 80 + pr * 16, 100, 70, 10); ctx.fill(); text(ctx, 'fester Gegenstand', cx + 70, top - 40, 22, 'ISB', '#CFCFCF'); ctx.restore(); }
  const aH = tool(tH, tZ);
  if (aH > 0) {
    const sw = Math.max(0, Math.sin((t - tH) * 9)) * 0.5;
    ctx.save(); ctx.globalAlpha = aH; ctx.translate(cx + 150, top - 30); ctx.rotate(-0.4 - sw);
    ctx.fillStyle = '#8B5A2B'; rrect(ctx, 0, -8, 170, 16, 6); ctx.fill(); ctx.fillStyle = '#3A3C44'; rrect(ctx, -46, -26, 52, 52, 10); ctx.fill(); ctx.restore();
    text(ctx, 'ganz leicht klopfen', cx + 120, 70, 24, 'IXB', '#FFD400', 'left', aH);
  }
  const aZ = tool(tZ, tSp);
  if (aZ > 0) {
    ctx.save(); ctx.globalAlpha = aZ; ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 16; ctx.lineCap = 'round'; const py = top - 6 - Math.max(0, Math.sin((t - tZ) * 4)) * 8;
    ctx.beginPath(); ctx.moveTo(cx - 16, py); ctx.lineTo(cx + 120, py - 80); ctx.moveTo(cx + 16, py); ctx.lineTo(cx + 150, py - 60); ctx.stroke();
    ctx.fillStyle = '#7A7E88'; ctx.beginPath(); ctx.arc(cx, py, 16, 0, 7); ctx.fill(); ctx.restore();
    text(ctx, 'vorsichtig ziehen', cx + 120, 70, 24, 'IXB', '#FFD400', 'left', aZ);
  }
  const aS = tool(tSp, tOk);
  if (aS > 0) {
    ctx.save(); ctx.globalAlpha = aS; ctx.fillStyle = '#2F6FD6'; rrect(ctx, cx + 170, top - 160, 70, 150, 14); ctx.fill(); ctx.fillStyle = '#C9CCD4'; rrect(ctx, cx + 180, top - 190, 40, 34, 6); ctx.fill();
    for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i / 14) % 1; ctx.globalAlpha = aS * (1 - ph); ctx.fillStyle = '#E8F4FF'; ctx.beginPath(); ctx.arc(lerp(cx + 176, cx + 20, ph), top - 170 + Math.sin(i * 3) * 18 * ph + ph * 150, 5, 0, 7); ctx.fill(); }
    ctx.restore();
    text(ctx, 'Schmierspray', cx + 260, top - 120, 22, 'ISB', '#CFCFCF', 'left', aS);
  }
  const g = spring(seg(t, tG - 0.1, tG + 0.4)) * (1 - seg(t, tOk - 0.3, tOk));
  if (g > 0) { ctx.save(); ctx.globalAlpha = clamp(g * 2); ctx.fillStyle = C.red; rrect(ctx, 24, h - 74, 300, 50, 25); ctx.fill(); text(ctx, '⚠  ohne Gewalt!', 174, h - 40, 24, 'IXB', '#fff', 'center'); ctx.restore(); }
  const ok = easeOut(seg(t, tOk + 0.3, tOk + 0.7));
  if (ok > 0) { ctx.save(); ctx.globalAlpha = ok; ctx.fillStyle = C.lime; rrect(ctx, 24, h - 74, 330, 50, 25); ctx.fill(); text(ctx, 'federt wieder ✓', 189, h - 40, 24, 'IXB', C.ink, 'center'); ctx.restore(); }
}
// Kapitel 4: Kopf wieder drauf, dann Fachbetrieb/Vermieter, dann Sommer-Tipp
function drawKopfDrauf(ctx, t, w, h) {
  const L = CH[4].L, tA = wordTime('c4_0', 'ansetzen'), tM = wordTime('c4_0', 'mutter');
  const s1 = 1 - easeInOut(seg(t, L[1].t - 0.3, L[1].t + 0.2)), s2 = easeInOut(seg(t, L[1].t - 0.3, L[1].t + 0.2)) * (1 - easeInOut(seg(t, L[2].t - 0.3, L[2].t + 0.2))), s3 = easeInOut(seg(t, L[2].t - 0.3, L[2].t + 0.2));
  if (s1 > 0) {
    ctx.save(); ctx.globalAlpha *= s1;
    valveSection(ctx, t, 300, 340, 0.6, 1, { labels: false });
    const down = easeInOut(seg(t, tA - 0.3, tA + 0.5)), nut = seg(t, tM, tM + 1.2);
    headSide(ctx, 300, lerp(110, 262, down), 0.75, { num: 5, nutRot: nut });
    turnArrow(ctx, 300, 250, 120, 1, C.lime, easeOut(seg(t, tM - 0.1, tM + 0.2)) * (1 - seg(t, tM + 1.6, tM + 2)), t);
    text(ctx, 'im Uhrzeigersinn', 470, 260, 26, 'IXB', C.lime, 'left', easeOut(seg(t, tM, tM + 0.3)));
    text(ctx, 'auf 5 · ansetzen · andrücken', 470, 120, 24, 'ISB', '#CFCFCF', 'left', easeOut(seg(t, tA - 0.2, tA + 0.2)));
    ctx.restore();
  }
  if (s2 > 0) {
    ctx.save(); ctx.globalAlpha *= s2;
    const card = (x, y, title, sub, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#26262A'; rrect(ctx, x, y, w - 80, 170, 18); ctx.fill(); ctx.fillStyle = col; rrect(ctx, x, y, 10, 170, 5); ctx.fill(); text(ctx, title, x + 36, y + 70, 34, 'IXB', '#fff'); text(ctx, sub, x + 36, y + 120, 24, 'IM', '#CFCFCF'); ctx.restore(); };
    card(40, 70, 'Fachbetrieb', 'tauscht das Ventiloberteil', '#FF8A1C', easeOut(seg(t, wordTime('c4_1', 'ventiloberteil') - 0.1, wordTime('c4_1', 'ventiloberteil') + 0.3)));
    card(40, 290, 'Mietwohnung', 'Sache des Vermieters', C.blue, easeOut(seg(t, wordTime('c4_1', 'mietwohnung') - 0.1, wordTime('c4_1', 'mietwohnung') + 0.3)));
    ctx.restore();
  }
  if (s3 > 0) {
    ctx.save(); ctx.globalAlpha *= s3;
    ['Jun', 'Jul', 'Aug'].forEach((m, i) => { ctx.fillStyle = '#FFD400'; rrect(ctx, 60 + i * 120, 60, 100, 56, 14); ctx.fill(); text(ctx, m, 110 + i * 120, 97, 26, 'IXB', C.ink, 'center'); });
    // falsch: Frostschutz (Schneeflocke), richtig: offen (5)
    const fx = 210, fy = 290;
    ctx.fillStyle = '#3A3C44'; ctx.beginPath(); ctx.arc(fx, fy, 90, 0, 7); ctx.fill();
    ctx.strokeStyle = '#9BD4FF'; ctx.lineWidth = 6; for (let i = 0; i < 3; i++) { const an = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(an) * 46, fy - Math.sin(an) * 46); ctx.lineTo(fx + Math.cos(an) * 46, fy + Math.sin(an) * 46); ctx.stroke(); }
    const x1 = easeOut(seg(t, wordTime('c4_2', 'frostschutz'), wordTime('c4_2', 'frostschutz') + 0.3));
    if (x1 > 0) { ctx.strokeStyle = C.red; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - 80, fy - 80); ctx.lineTo(lerp(fx - 80, fx + 80, x1), lerp(fy - 80, fy + 80, x1)); ctx.stroke(); }
    text(ctx, 'Frostschutz', fx, fy + 130, 24, 'IXB', '#CFCFCF', 'center');
    const ok = spring(seg(t, wordTime('c4_2', 'offen') - 0.1, wordTime('c4_2', 'offen') + 0.4));
    if (ok > 0) {
      ctx.save(); ctx.translate(560, fy); ctx.scale(ok, ok);
      ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(0, 0, 90, 0, 7); ctx.fill(); text(ctx, '5', 0, 26, 80, 'IXB', C.ink, 'center'); ctx.restore();
      text(ctx, 'offen lassen', 560, fy + 130, 24, 'IXB', C.lime, 'center', clamp(ok));
    }
    ctx.restore();
  }
}

// ----- rechtes Panel: Schritte zum Wort -----
const PNL = { x: 20, y: -330, w: 900, h: 600 };
function panel(ctx, t, k) {
  const d = DATA[k], L = CH[k].L, t0 = L[0].t - 0.1, p = spring(seg(t, t0, t0 + 0.6));
  if (p <= 0) return null;
  const { x, y, w, h } = PNL;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.globalAlpha = clamp(p * 2); ctx.translate(-w / 2, -h / 2);
  shadow(ctx, 0.3, 50, 20); ctx.fillStyle = C.panel; rrect(ctx, 0, 0, w, h, 22); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = C.lime; rrect(ctx, 28, 24, 26, 26, 7); ctx.fill(); text(ctx, 'Doc', 64, 44, 17, 'ISB', '#fff');
  text(ctx, k === 1 ? 'SO FUNKTIONIERT’S' : 'SO GEHT’S', 40, 98, 15, 'ISB', '#8A8A8E', 'left', 1, 2.4);
  const ts = stepTimes(k), rowH = d.steps.length > 5 ? 72 : 80;
  let target = null;
  d.steps.forEach(([s], i) => {
    const a = spring(seg(t, ts[i], ts[i] + 0.45)); if (a <= 0) return;
    const yy = 118 + i * rowH;
    ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate((1 - a) * 30, 0);
    ctx.fillStyle = C.panel2; rrect(ctx, 32, yy, w - 64, rowH - 12, 16); ctx.fill();
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(72, yy + (rowH - 12) / 2, 21, 0, 7); ctx.fill();
    text(ctx, String(i + 1), 72, yy + (rowH - 12) / 2 + 8, 22, 'IXB', C.ink, 'center');
    const fs_ = fitSize(ctx, s, 28, 'ISB', w - 64 - 130);
    text(ctx, s, 112, yy + (rowH - 12) / 2 + 10, fs_, 'ISB', '#fff');
    ctx.restore();
    target = [x + 72, y + yy + (rowH - 12) / 2];
  });
  text(ctx, `Quelle: ${d.src}`, w - 32, h - 24, 17, 'ISB', '#6A6A6E', 'right', easeOut(seg(t, L[0].t + 0.8, L[0].t + 1.3)));
  ctx.restore();
  return target;
}

const DOC_POS = new Map();
function zone(ctx, t, k) {
  header(ctx, t, k);
  leftCard(ctx, t, k);
  const target = panel(ctx, t, k);
  const L = CH[k].L, last = L[L.length - 1].e;
  if (target) {
    const prev = DOC_POS.get(k) ?? target, pos = [lerp(prev[0], target[0], 0.18), lerp(prev[1], target[1], 0.18)];
    DOC_POS.set(k, pos);
    cursor(ctx, pos[0] + 8, pos[1] + 8, 'Doc', easeOut(seg(t, L[0].t, L[0].t + 0.4)) * (1 - easeOut(seg(t, last + 0.4, last + 0.9))));
  }
}

// ----- Intro: Foto „steht auf 5“, kalt bzw. heiß, Titel, 5 Schritte -----
function zoneIntro(ctx, t) {
  const c = CH[0];
  const box = easeOut(seg(t, 0.3, 0.9)), w1 = 'Der Handwerksdoktor', s1 = typed(w1, t, 0.9, 26);
  const av = spring(seg(t, 0.4, 1.0));
  if (av > 0) { ctx.save(); ctx.translate(-840, -420); ctx.scale(av, av); ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.clip(); ctx.drawImage(IMG.avatar, -36, -36, 72, 72); ctx.restore(); }
  const tw = text(ctx, s1, -786, -406, 40, 'IXB', C.ink, 'left', box);
  if (t < 2.2) selection(ctx, -796, -450, Math.max(40, tw + 20), 62, box);
  ctx.font = '40px IXB'; const nx = -786 + ctx.measureText(w1).width + 18;
  ctx.font = '36px IR'; const ux = nx + ctx.measureText('über').width + 16;
  text(ctx, 'über', nx, -406, 36, 'IR', C.gray, 'left', easeOut(seg(t, 2.0, 2.4)));
  text(ctx, typed('Heizung', t, 2.5, 22), ux, -406, 40, 'IXB', C.ink, 'left', 1);
  const tp = easeOut(seg(t, c.L[0].t + 0.1, c.L[0].t + 0.6));
  text(ctx, 'Heizungsventil klemmt?', -880, -230, 76, 'IXB', C.ink, 'left', tp);
  const tk1 = wordTime('c0_0', 'kalt'), tk2 = wordTime('c0_0', 'kalt', 1);
  const pillBig = (s, y, col, a) => {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.font = '92px IXB'; const pw = ctx.measureText(s).width;
    ctx.translate(-880, y); ctx.scale(lerp(0.8, 1, a), lerp(0.8, 1, a)); ctx.fillStyle = col; rrect(ctx, -16, -88, pw + 32, 116, 24); ctx.fill(); text(ctx, s, 0, 0, 92, 'IXB', '#fff'); ctx.restore();
  };
  pillBig('Bleibt kalt?', -80, '#2346E8', spring(seg(t, tk1 - 0.1, tk1 + 0.4)));
  pillBig('Wird nicht kalt?', 66, C.yt, spring(seg(t, tk2 - 0.1, tk2 + 0.4)));
  // 5 Schritte
  const tz = wordTime('c0_1', 'fünf'); let px = -880;
  ['Auf 5', 'Kopf ab', 'Prüfen', 'Lösen', 'Kopf drauf'].forEach((s, i) => {
    ctx.font = '24px ISB'; const w = ctx.measureText(s).width + 64, x0 = px; px += w + 12;
    const q = spring(seg(t, tz + i * 0.25, tz + 0.5 + i * 0.25)); if (q <= 0) return;
    ctx.save(); ctx.translate(x0, 200); ctx.scale(q, q);
    ctx.fillStyle = '#fff'; shadow(ctx, 0.08, 10, 3); rrect(ctx, 0, -26, w, 52, 26); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(24, 0, 14, 0, 7); ctx.fill(); text(ctx, `${i + 1}`, 24, 6, 16, 'IXB', C.lime, 'center');
    text(ctx, s, 46, 8, 24, 'ISB', C.ink); ctx.restore();
  });
  // rechts: echtes Foto (Thermostat auf 5), darunter Wärmebilder kalt / heiß
  const cp = spring(seg(t, 0.2, 0.8)), x = 300, y = -390, w = 560, h = 372;
  if (cp > 0) {
    ctx.save(); ctx.globalAlpha = clamp(cp * 2); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(0.85, 1, cp), lerp(0.85, 1, cp)); ctx.translate(-w / 2, -h / 2);
    shadow(ctx, 0.3, 40, 14); ctx.fillStyle = '#fff'; rrect(ctx, -10, -10, w + 20, h + 20, 24); ctx.fill(); noShadow(ctx);
    ctx.save(); rrect(ctx, 0, 0, w, h, 16); ctx.clip(); cover(ctx, IMG.hand, 0, 0, w, h, 0.62, 0.4, 1.15); ctx.restore();
    const f5 = spring(seg(t, wordTime('c0_0', 'fünf') - 0.1, wordTime('c0_0', 'fünf') + 0.4));
    if (f5 > 0) { ctx.save(); ctx.globalAlpha *= clamp(f5 * 2); ctx.fillStyle = C.ink; rrect(ctx, 20, 20, 220, 52, 26); ctx.fill(); text(ctx, 'steht auf 5', 130, 55, 26, 'IXB', C.lime, 'center'); ctx.restore(); }
    ctx.restore();
    text(ctx, 'Foto: BOOM Photography / Pexels', x, y + h + 34, 14, 'IM', C.gray, 'left', clamp(cp * 2));
    const thermo = (tt, hot, xx, label) => {
      const a = spring(seg(t, tt - 0.1, tt + 0.4)); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = clamp(a * 2); ctx.translate(xx + 135, 140); ctx.scale(lerp(0.8, 1, a), lerp(0.8, 1, a)); ctx.translate(-(xx + 135), -140);
      const v = thermalFrame(ctx, xx, 40, 270, 200, label);
      radiator(ctx, v.vx + 14, v.vy + 14, v.vw - 28, v.vh - 28, hot ? FIELD.normal() : FIELD.cold(t), 9);
      ctx.restore();
    };
    thermo(tk1, false, 300, 'BLEIBT KALT');
    thermo(tk2, true, 590, 'WIRD NICHT KALT');
  }
  const dx = t < 3.4 ? -786 + tw + 10 : lerp(-786 + tw + 10, -300, easeOut(seg(t, 3.4, 4.2))), dy = t < 3.4 ? -420 : lerp(-420, -200, easeOut(seg(t, 3.4, 4.2)));
  cursor(ctx, dx, dy, 'Doc', 1 - easeOut(seg(t, 4.4, 4.9)));
}
