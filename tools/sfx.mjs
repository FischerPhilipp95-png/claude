// UI-Sounds aus einer cues.json synthetisieren (click, pop, thump, whoosh) -> WAV.
//
//   node tools/sfx.mjs projects/klima-short/cues.json projects/klima-short/audio/sfx.wav 20
//
// cues.json: [{ "t": 1.25, "type": "click", "gain": 0.5 }, ...]
import fs from 'node:fs';

const SR = 44100;
const [cuesPath, outPath, durArg] = process.argv.slice(2);
if (!cuesPath || !outPath) {
  console.error('Aufruf: node tools/sfx.mjs <cues.json> <out.wav> [dauer_s]');
  process.exit(1);
}
const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
const dur = Number(durArg) || Math.max(...cues.map((c) => c.t)) + 2;
const L = new Float32Array(Math.ceil(dur * SR));
const R = new Float32Array(L.length);

let seed = 1;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2147483648) - 1;

// Jeder Sound ist eine Funktion (Zeit in s seit Start) -> Sample, plus Länge
const SOUNDS = {
  // kurzer, trockener Tastenklick: Rauschimpuls + heller Ton
  click: {
    len: 0.03,
    fn: (t) => (0.6 * noise() * Math.exp(-t / 0.0025) + 0.5 * Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t / 0.006)),
  },
  // Pop: Sinus mit schnellem Tonhöhenfall
  pop: {
    len: 0.12,
    fn: (t) => {
      const ph = 2 * Math.PI * (300 * t + (600 * 0.02) * (1 - Math.exp(-t / 0.02)));
      return Math.sin(ph) * Math.exp(-t / 0.045) * Math.min(1, t / 0.001);
    },
  },
  // Thump: tiefer Schlag
  thump: {
    len: 0.6,
    fn: (t) => {
      const ph = 2 * Math.PI * (40 * t + (70 * 0.04) * (1 - Math.exp(-t / 0.04)));
      return Math.sin(ph) * Math.exp(-t / 0.18) * Math.min(1, t / 0.002) + 0.15 * noise() * Math.exp(-t / 0.01);
    },
  },
};

// Zisch: Luft entweicht aus dem Ventil (helles Rauschen, schneller Anstieg, langsames Ausklingen)
SOUNDS.hiss = {
  len: 0.9,
  fn: (t) => { const e = Math.min(1, t / 0.02) * Math.exp(-t / 0.35); return (noise() - 0.6 * noise()) * e * 0.8; },
};
// Gluck: kurzer, tiefer Blubb mit steigender Tonhöhe (Luft im Heizkörper)
SOUNDS.gluck = {
  len: 0.14,
  fn: (t) => { const f = 180 + 900 * (t / 0.14) ** 1.5; return Math.sin(2 * Math.PI * f * t) * Math.sin(Math.PI * t / 0.14) ** 1.2; },
};

// Glitch: zerhacktes, bitreduziertes Digital-Knistern (Pixel-Übergänge)
SOUNDS.glitch = {
  len: 0.28,
  fn: (t) => {
    const gate = Math.sin(2 * Math.PI * 38 * t) > -0.2 ? 1 : 0.1;
    const f = 600 + 2600 * Math.floor(t * 40 % 4) / 3;
    const s = Math.round((0.6 * noise() + 0.5 * Math.sign(Math.sin(2 * Math.PI * f * t))) * 4) / 4;
    return s * gate * Math.exp(-t / 0.12) * 0.7;
  },
};
// Tastenanschlag: dumpfer Klick, leiser als click
SOUNDS.key = {
  len: 0.04,
  fn: (t) => 0.5 * noise() * Math.exp(-t / 0.004) + 0.4 * Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t / 0.008),
};
// Blip: kurzer heller UI-Ton (Status-Einträge)
SOUNDS.blip = {
  len: 0.1,
  fn: (t) => Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t / 0.03) * Math.min(1, t / 0.002),
};

// Bloop: kurzer, freundlicher Zweiton wie bei einer Chat-Nachricht (selbst erzeugt)
SOUNDS.bloop = {
  len: 0.22,
  fn: (t) => {
    const f = t < 0.07 ? 880 : 1320;
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-((t < 0.07 ? t : t - 0.07)) / 0.05) * Math.min(1, t / 0.003) * 0.8;
  },
};

// Whoosh: gefiltertes Rauschen, Filter öffnet und schließt sich, Stereo-Schwenk
function whoosh(start, gain) {
  const len = 0.55, n = Math.floor(len * SR), i0 = Math.floor(start * SR - 0.35 * SR);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * Math.pow(t, 0.8)) ** 2;
    const cutoff = 0.02 + 0.25 * env;
    lp += cutoff * (noise() - lp);
    lp2 += cutoff * (lp - lp2);
    const s = (lp - lp2 * 0.6) * env * gain * 2.2;
    const pan = -0.6 + 1.2 * t;
    const k = i0 + i;
    if (k >= 0 && k < L.length) { L[k] += s * (1 - pan) / 2 * 1.4; R[k] += s * (1 + pan) / 2 * 1.4; }
  }
}

for (const c of cues) {
  if (c.type === 'whoosh') { whoosh(c.t, c.gain ?? 1); continue; }
  const snd = SOUNDS[c.type];
  if (!snd) { console.warn(`unbekannter Sound: ${c.type}`); continue; }
  const i0 = Math.floor(c.t * SR), n = Math.floor(snd.len * SR), g = c.gain ?? 1;
  const pan = c.type === 'click' ? noise() * 0.15 : 0;
  for (let i = 0; i < n && i0 + i < L.length; i++) {
    const s = snd.fn(i / SR) * g;
    L[i0 + i] += s * (1 - pan) / 2 * 1.4;
    R[i0 + i] += s * (1 + pan) / 2 * 1.4;
  }
}

// Normalisieren auf -3 dBFS und als 16-bit-WAV schreiben
let peak = 1e-9;
for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = Math.pow(10, -3 / 20) / peak;
const buf = Buffer.alloc(44 + L.length * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + L.length * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(L.length * 4, 40);
for (let i = 0; i < L.length; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync(outPath, buf);
console.log(`${outPath}: ${cues.length} Cues, ${dur.toFixed(1)}s`);
