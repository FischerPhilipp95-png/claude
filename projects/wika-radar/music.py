#!/usr/bin/env python3
"""Epische Trailer-Musik für das WIKA-Radar-Video, Version 2 (eigene Komposition, kein Sample aus der Referenz).

Echtes Orchester-Arrangement mit der Soundfont MuseScore General (MIT-Lizenz, Sektions-Samples):
Violinen 1+2, Bratschen, Celli, Kontrabässe (Tremolo, Spiccato, legato), Hörner, Trompeten, Posaunen, Tuba,
Chor, Pauken, Taiko, Konzert-Bassdrum, Orchester-Becken und Snare.
Dazu selbst erzeugt: Braams, Sub-Booms, umgedrehte Becken, Riser, FMCW-Chirp (passend zum Bild).
Mix: Panorama wie im Orchester, Faltungshall (3 s), Bus-Kompressor, Limiter.

96 BPM, D-Moll, 15 s = 6 Takte à 2,5 s. Dramaturgie (shotlist.md):
  0–2,5 s    Spannung: Tremolo-Streicher schwellen an, Herzschlag-Trommeln, Chirp
  2,5 s      Einschlag (Produkt): Tutti-Blech + Trommeln, danach Streicher-Ostinato
  5–11,25 s  Steigerung: Hörner-Thema, Chor, Pauken, Snare, Trompeten
  11,25 s    Anlauf: Läufe nach oben, Wirbel; 12,1 s alles weg (Sog)
  12,5 s     finaler Hit (Logo), langer Nachhall bis 15 s
"""
import subprocess
import tempfile
from pathlib import Path

import mido
import numpy as np
import soundfile as sf
from scipy.signal import lfilter, butter, sosfilt

DIR = Path(__file__).parent
SR = 44100
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = 6 * BAR
HIT1, HIT2 = 4, 20                      # Einschläge (in Beats): Produkt, Logo
SF2 = "/usr/share/sounds/sf2/MuseScore_General_Full.sf2"
OUT = DIR / "audio" / "music.wav"
rng = np.random.default_rng(2026)

# Instrument -> (Bank, Programm, Kanal, Panorama -1..1)
INST = {
    "vln1_trem": (20, 44, 0, -0.55), "vln2_trem": (25, 44, 1, -0.25), "cel_trem": (40, 44, 2, 0.45), "bas_trem": (50, 44, 3, 0.25),
    "vln1": (20, 48, 0, -0.55), "vln2": (25, 48, 1, -0.25), "vla": (30, 48, 2, 0.15), "cel": (40, 48, 3, 0.45), "bas": (50, 48, 4, 0.25),
    "vln_slow": (20, 49, 0, -0.4), "horns": (0, 60, 0, -0.35), "tpt": (0, 56, 0, 0.35), "tbn": (0, 57, 0, 0.5), "tuba": (0, 58, 0, 0.2),
    "brass": (0, 61, 0, 0.0), "choir": (0, 52, 0, 0.0), "oohs": (0, 53, 0, 0.0), "timp": (0, 47, 0, 0.1), "taiko": (0, 116, 0, 0.0),
    "bdrum": (8, 116, 0, 0.0), "kit": (128, 48, 9, 0.0), "snare": (128, 48, 9, -0.1),
}
notes = {k: [] for k in INST}
cc11 = {k: [] for k in INST}            # Expression-Automation: (Beat, Wert)


def add(inst, beat, note, length, vel, human=0.012):
    jitter = rng.normal(0, human) / BEAT if inst not in ("kit", "snare", "taiko", "bdrum", "timp") else rng.normal(0, 0.003) / BEAT
    notes[inst].append((max(0, beat + jitter), note, length, int(np.clip(vel + rng.integers(-5, 6), 1, 127))))


def swell(inst, b0, b1, v0, v1, steps=24):
    for i in range(steps + 1):
        u = i / steps
        cc11[inst].append((b0 + (b1 - b0) * u, int(v0 + (v1 - v0) * u)))


# D-Moll: Akkorde pro halbem Takt ab Beat 4
CH = {4: (38, "Dm"), 8: (34, "Bb"), 12: (31, "Gm"), 14: (33, "A"), 16: (38, "Dm"), 18: (34, "Bb"), 19: (36, "C")}
TRI = {"Dm": [0, 3, 7], "Bb": [0, 4, 7], "Gm": [0, 3, 7], "A": [0, 4, 7], "C": [0, 4, 7]}


def chord_at(b):
    k = max(k for k in CH if k <= b)
    root, name = CH[k]
    return root, TRI[name]


# ---------------- 1) Spannung (Beat 0–4)
for inst, n in (("cel_trem", 38), ("bas_trem", 26)):
    add(inst, 0, n, 4.0, 100)
    swell(inst, 0, 4, 55, 120)
add("vln1_trem", 1, 81, 3.0, 80); add("vln2_trem", 1, 74, 3.0, 80)
swell("vln1_trem", 1, 4, 0, 105); swell("vln2_trem", 1, 4, 0, 100)
for n in (62, 65, 69): add("oohs", 0, n, 4, 55)
swell("oohs", 0, 4, 40, 90)
for b in (1, 2.5, 3, 3.5):
    add("bdrum", b, 36, 0.5, 70 if b < 3 else 85)

# ---------------- 2) Einschlag 1 (Beat 4)
for inst, ns, v in (("brass", [50, 53, 57, 62], 118), ("tbn", [38, 45], 120), ("tuba", [26], 120), ("horns", [62, 65, 69], 112)):
    for n in ns: add(inst, HIT1, n, 2.2, v)
    swell(inst, HIT1, HIT1 + 2.2, 127, 60)
add("timp", HIT1, 38, 1.5, 127); add("taiko", HIT1, 45, 1.5, 127); add("bdrum", HIT1, 36, 2, 127)
add("kit", HIT1, 49, 3, 120); add("kit", HIT1, 57, 3, 110)

# ---------------- 3) Ostinato + Groove (Beat 4–19)
OST = [0, 0, 7, 0, 3, 0, 7, 3, 12, 7, 3, 7, 0, 3, 7, 12]     # 16tel, relativ zum Grundton
for b in np.arange(4, 19, 0.25):
    k = int(round((b - 4) / 0.25)) % 16
    root, tri = chord_at(b)
    acc = 112 if k in (0, 6, 8, 12) else 82 if k % 2 == 0 else 66
    lvl = 0 if b < 8 else 6 if b < 14 else 12
    add("vln1", b, root + 36 + OST[k], 0.2, acc + lvl)
    add("vln2", b, root + 24 + OST[k], 0.2, acc + lvl - 6)
    if k % 2 == 0: add("vla", b, root + 24 + (7 if k % 4 else 0), 0.4, acc + lvl - 4)
    if k in (0, 3, 6, 8, 11, 14):                           # Celli/Bässe im 3+3+2-Rhythmus
        add("cel", b, root + 12, 0.35, acc + lvl); add("bas", b, root, 0.35, acc + lvl)
TAIKO = [0, 3, 6, 8, 10, 12, 14]
for bar0 in range(4, 19, 4):
    for k in TAIKO:
        b = bar0 + k * 0.25
        if b >= 19: break
        add("taiko", b, 45, 0.4, 118 if k in (0, 8) else 92)
    add("bdrum", bar0, 36, 1, 120); add("bdrum", bar0 + 2, 36, 1, 105)
    for k in range(4):
        root, _ = chord_at(bar0 + k)
        add("timp", bar0 + k, root if k % 2 == 0 else root + 7, 0.5, 100 + (bar0 - 4) * 2)
    if bar0 >= 8: add("kit", bar0, 49, 2, 100)

# ---------------- 4) Hörner-Thema, Chor, tiefes Blech (Beat 8–19)
THEME = [(8, 69, 1.5), (9.5, 74, 0.5), (10, 77, 1), (11, 76, 1), (12, 74, 1.5), (13.5, 72, 0.5), (14, 69, 2),
         (16, 74, 1.5), (17.5, 77, 0.5), (18, 81, 0.5), (18.5, 79, 0.25), (18.75, 77, 0.25)]
for b, n, ln in THEME:
    add("horns", b, n, ln * 0.97, 104 if b < 16 else 116); add("horns", b, n - 12, ln * 0.97, 96 if b < 16 else 110)
    if b >= 16: add("tpt", b, n, ln * 0.95, 112)
for b0, b1 in ((8, 12), (12, 14), (14, 16), (16, 18), (18, 19)):
    root, tri = chord_at(b0)
    for i in tri: add("choir", b0, root + 24 + i, b1 - b0, 88 if b0 < 14 else 104)
    swell("choir", b0, b1, 70, 115)
    add("tbn", b0, root, b1 - b0, 96 if b0 < 14 else 112); add("tbn", b0, root + 7, b1 - b0, 90 if b0 < 14 else 106)
    add("tuba", b0, root - 12, b1 - b0, 100)
    if b0 >= 14:
        for i in tri: add("vln_slow", b0, root + 48 + i, b1 - b0, 96)
for r in range(16):                                            # Snare ab Beat 12 leise mit
    add("snare", 12 + r * 0.25, 38, 0.1, 50 + (12 if r % 4 == 0 else 0))
for r in range(16):
    add("snare", 16 + r * 0.25, 38, 0.1, 62 + (16 if r % 4 == 0 else 0))

# ---------------- 5) Anlauf in den finalen Hit (Beat 19–20) + Sog
RUN = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84, 86, 88]
for i, n in enumerate(RUN):
    add("vln1", 19 + i / 16 * 0.7, n, 0.08, 90 + i * 2); add("vln2", 19 + i / 16 * 0.7, n - 12, 0.08, 85 + i * 2)
for r in range(14):
    add("snare", 19 + r / 20, 38, 0.05, 70 + 4 * r); add("timp", 19 + r / 20, 38, 0.05, 70 + 4 * r)
for i, n in enumerate([58, 60, 62, 64]):
    add("brass", 19 + i * 0.17, n, 0.15, 100 + i * 6)

# ---------------- 6) Finaler Hit (Beat 20) + Ausklang
FINAL = {"brass": [50, 53, 57, 62], "tbn": [38, 45, 50], "tuba": [26], "horns": [62, 65, 69, 74], "tpt": [69, 74],
         "choir": [62, 65, 69, 74], "vln_slow": [74, 81, 86], "cel_trem": [38, 50], "bas_trem": [26, 38], "vln1_trem": [86], "vln2_trem": [81]}
for inst, ns in FINAL.items():
    for n in ns: add(inst, HIT2, n, 4.2, 124)
    swell(inst, HIT2, HIT2 + 4, 127, 45)
add("timp", HIT2, 38, 3, 127); add("taiko", HIT2, 45, 2, 127); add("bdrum", HIT2, 36, 3, 127)
add("kit", HIT2, 49, 4, 127); add("kit", HIT2, 57, 4, 120); add("kit", HIT2, 52, 4, 110)


# ---------------- Rendern mit FluidSynth (je Instrument ein Stem)
def render_stem(inst, tmp):
    bank, prog, ch, _ = INST[inst]
    mid = mido.MidiFile(ticks_per_beat=960)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    ev = []
    if ch != 9:
        ev.append((0, 0, mido.Message("control_change", control=0, value=bank, channel=ch)))
        ev.append((0, 0, mido.Message("program_change", program=prog, channel=ch)))
    else:
        ev.append((0, 0, mido.Message("program_change", program=prog, channel=ch)))
    for cc in (91, 93): ev.append((0, 0, mido.Message("control_change", control=cc, value=0, channel=ch)))
    ev.append((0, 0, mido.Message("control_change", control=11, value=127, channel=ch)))
    for b, v in cc11[inst]: ev.append((int(b * 960), 1, mido.Message("control_change", control=11, value=v, channel=ch)))
    for b, n, ln, v in notes[inst]:
        ev.append((int(b * 960), 2, mido.Message("note_on", note=n, velocity=v, channel=ch)))
        ev.append((int((b + ln) * 960), 0, mido.Message("note_off", note=n, velocity=0, channel=ch)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev: msg.time = tick - last; last = tick; tr.append(msg)
    mf, wf, cf = Path(tmp) / f"{inst}.mid", Path(tmp) / f"{inst}.wav", Path(tmp) / "cfg.txt"
    cf.write_text("interp 7\n")
    mid.save(mf)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", str(SR), "-R", "0", "-C", "0", "-o", "synth.polyphony=512",
                    "-f", str(cf), "-F", str(wf), SF2, str(mf)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    y, _ = sf.read(wf, always_2d=True, dtype="float32")
    out = np.zeros((int(SR * DUR) + SR * 4, 2), np.float32); n = min(len(y), len(out)); out[:n] = y[:n]
    return out


with tempfile.TemporaryDirectory() as tmp:
    ST = {k: render_stem(k, tmp) for k in INST if notes[k]}
L = len(next(iter(ST.values())))


def tt(x): return np.arange(int(SR * x)) / SR
def lowpass(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x, axis=0)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += (sig[:, None] if sig.ndim == 1 else sig) * g
def pan(x, p):
    l, r = np.cos((p + 1) * np.pi / 4) * 1.414, np.sin((p + 1) * np.pi / 4) * 1.414
    m = x.mean(axis=1); side = (x[:, 0] - x[:, 1]) * 0.5
    return np.stack([m * l + side * 0.6, m * r - side * 0.6], axis=1)
def level(x, db):
    e = np.abs(x).max(axis=1); act = e > 0.02 * (e.max() + 1e-9)
    if e.max() < 1e-6: return x
    return x * (0.1 * 10 ** (db / 20) / (np.sqrt(np.mean(x[act] ** 2)) + 1e-9))


# ---------------- selbst erzeugte Trailer-Sounds
def braam(root, length=3.0):
    t = tt(length); s = np.zeros_like(t)
    for n in (root, root + 12, root + 19):
        for d in (-0.1, 0, 0.1): f = hz(n + d); s += 2 * (f * t % 1) - 1
    s /= 9
    out = np.zeros_like(s); seg = int(SR * 0.04)
    for i in range(0, len(t), seg):
        c = 120 + 1800 * np.sin(np.pi * min(1, i / len(t) * 1.4)) ** 0.8
        out[i:i + seg] = lowpass(lowpass(s[i:i + seg], c), c)
    return np.tanh(out * np.minimum(t / 0.02, 1) * np.exp(-t / 1.6) * 3.5)
def sub_boom(length=4.0):
    t = tt(length); f = 30 + 45 * np.exp(-t / 0.18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.5) * np.minimum(t / 0.004, 1)
def riser(length):
    t = tt(length); n = rng.standard_normal(len(t)); out = np.zeros_like(t); k = 40; sl = len(t) // k
    for i in range(k):
        lo, hi = 200 + 3000 * (i / k) ** 2, 700 + 12000 * (i / k) ** 2
        out[i * sl:(i + 1) * sl] = sosfilt(butter(2, [lo, min(hi, 20000)], "bandpass", fs=SR, output="sos"), n[i * sl:(i + 1) * sl])
    return out * (t / length) ** 2.5
def chirp(t0, t1, f0=300, f1=2400):
    t = tt(t1 - t0); f = f0 * (f1 / f0) ** (t / (t1 - t0))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / (t1 - t0)) ** 2 * 0.5


# Umgedrehte Becken: echtes Orchester-Becken aus der Soundfont, rückwärts, endet genau auf dem Hit
crash = ST["kit"][int(HIT1 * BEAT * SR): int(HIT1 * BEAT * SR) + int(2.2 * SR), :].copy()
rev = crash[::-1] * np.linspace(0, 1, len(crash))[:, None] ** 1.5
fx = np.zeros((L, 2), np.float32)
for hit in (HIT1, HIT2):
    place(fx, rev, hit * BEAT - len(rev) / SR, 1.0)
    place(fx, braam(26 if hit == HIT2 else 38, 3.5), hit * BEAT, 1.0)
    place(fx, sub_boom(), hit * BEAT, 1.2)
place(fx, riser(BAR), 0, 0.5)
place(fx, riser(1.25 * BAR), HIT2 * BEAT - 1.25 * BAR, 0.8)
place(fx, chirp(0.25, 1.25), 0.25, 0.35)
place(fx, chirp(0.25, 1.25, 600, 4800), 0.3, 0.15)


# ---------------- Mix
def reverb(x, secs=3.0, pre=0.03):
    irt = tt(secs); out = np.zeros_like(x); n = len(x) + len(irt) + int(pre * SR); nfft = 1 << (n - 1).bit_length()
    for c in range(2):
        tail = rng.standard_normal(len(irt)) * np.exp(-irt / (secs / 6.2))
        tail = lowpass(tail, 9000) * np.exp(-irt * 0.3) + lowpass(tail, 2500) * (1 - np.exp(-irt * 0.3))
        er = np.zeros(int(0.08 * SR))
        for _ in range(12): er[rng.integers(0, len(er))] += rng.uniform(0.2, 0.7) * rng.choice([-1, 1])
        ir = np.concatenate([np.zeros(int(pre * SR)), er, tail]); ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return out


DB = {"vln1_trem": -15, "vln2_trem": -16, "cel_trem": -12, "bas_trem": -13, "vln1": -12, "vln2": -14, "vla": -15, "cel": -12, "bas": -13,
      "vln_slow": -15, "horns": -9, "tpt": -11, "tbn": -11, "tuba": -13, "brass": -9, "choir": -12, "oohs": -16,
      "timp": -9, "taiko": -8, "bdrum": -8, "kit": -14, "snare": -16}
SEND = {"vln1": .35, "vln2": .35, "vla": .35, "cel": .3, "bas": .2, "vln1_trem": .45, "vln2_trem": .45, "cel_trem": .35, "bas_trem": .25,
        "vln_slow": .5, "horns": .4, "tpt": .35, "tbn": .3, "tuba": .2, "brass": .35, "choir": .55, "oohs": .55,
        "timp": .25, "taiko": .3, "bdrum": .25, "kit": .35, "snare": .2}
orch = np.zeros((L, 2), np.float32); perc = np.zeros((L, 2), np.float32); send = np.zeros((L, 2), np.float32)
for k, x in ST.items():
    y = pan(level(x, DB[k]), INST[k][3])
    (perc if k in ("timp", "taiko", "bdrum", "kit", "snare") else orch)[:] += y
    send += y * SEND[k]
fxl = level(fx, -8)
# Sog: 0,4 s vor dem finalen Hit verschwindet das Orchester (nur Rückwärts-Becken und Riser bleiben)
g = np.ones(L, np.float32)
i0, i1 = int((HIT2 * BEAT - 0.42) * SR), int((HIT2 * BEAT - 0.02) * SR)
g[i0:i1] = np.linspace(1, 0.04, i1 - i0) ** 2; g[i1:int(HIT2 * BEAT * SR)] = 0.04
mix = (orch + perc) * g[:, None] + fxl + reverb(send * g[:, None] + fxl * 0.25, 3.0) * 0.7

mix = sosfilt(butter(2, 25, "highpass", fs=SR, output="sos"), mix, axis=0)
env = np.sqrt(lowpass(np.mean(mix ** 2, axis=1), 5) + 1e-9)            # Bus-Kompressor (sanft)
thr = np.percentile(env[env > 1e-4], 80)
mix *= np.minimum(1, (thr / np.maximum(env, 1e-9)) ** 0.15)[:, None]
mix += 0.4 * sosfilt(butter(2, 5000, "highpass", fs=SR, output="sos"), mix, axis=0)   # etwas „Luft“ in den Höhen
peak = lowpass(np.abs(mix).max(axis=1), 200)                            # Limiter mit schneller Hüllkurve
lim = np.percentile(peak, 98.5)
mix *= np.minimum(1, lim / np.maximum(peak, 1e-9))[:, None] ** 0.7
mix *= 10 ** (-1.5 / 20) / np.max(np.abs(mix))
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
out = mix[: int(SR * DUR)]
fade = int(SR * 0.8)
out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_24")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, {len(ST)} Stems: {', '.join(ST)})")
