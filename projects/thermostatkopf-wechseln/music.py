#!/usr/bin/env python3
"""Hintergrundmusik für „Thermostatkopf wechseln“ (eigene Komposition, kein Sample).

Charakter wie refs/ref-08 (ca. 129 BPM, leichter, moderner Elektro-Pop), aber ruhiger, weil ein Sprecher darüber liegt:
104 BPM, D-Dur (Dmaj7 – Bm7 – Gmaj7 – A6), ruhige Werkstatt-Stimmung, E-Piano, gezupfter Synth, warme Fläche, Bass, leichte Drums.
Echte Instrumente aus FluidR3_GM (MIT), dazu eigene weiche Kick. Länge und Kapitelanfänge aus sections.json:
auf jedem Kapitelanfang ein Becken und ein Takt ohne Drums (Luft für den Kamera-Schwenk).
"""
import json
import subprocess
import tempfile
from pathlib import Path

import mido
import numpy as np
import soundfile as sf
from scipy.signal import lfilter, butter, sosfilt

DIR = Path(__file__).parent
SEC = json.loads((DIR / "sections.json").read_text())
SR = 44100
BPM = SEC["bpm"]
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = SEC["total"]
N_BARS = int(np.ceil(DUR / BAR))
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
OUT = DIR / "audio" / "music.wav"
rng = np.random.default_rng(104)

CHORDS = [(38, [54, 57, 61, 64]), (35, [54, 57, 59, 62]), (31, [54, 59, 62, 66]), (33, [52, 57, 61, 64])]  # Dmaj7 Bm7 Gmaj7 A6
ARP = [0, 2, 1, 3, 2, 1, 3, 2]
PROGRAM = {"epiano": 4, "pluck": 45, "pad": 89, "bass": 33, "bell": 11}
notes = {k: [] for k in list(PROGRAM) + ["drums"]}
kicks = []
chap_bars = {int(round(c["start"] / BAR)) for c in SEC["chapters"] if c["ch"] > 0}
end_bar = int(round(SEC["end_card"] / BAR))


def add(inst, beat, note, length, vel):
    notes[inst].append((beat, note, length, int(np.clip(vel + rng.integers(-6, 7), 1, 127))))


for bar in range(N_BARS):
    b0 = bar * 4
    root, v = CHORDS[bar % 4]
    calm = bar in chap_bars or bar < 2 or bar >= end_bar
    add("pad", b0, v[0], 3.9, 48); add("pad", b0, v[2] + 12, 3.9, 44)
    for k, bb in enumerate((0, 1.5, 2.5)):                 # E-Piano, synkopiert
        for n in v: add("epiano", b0 + bb, n, 0.9 if k else 1.4, 56 if not calm else 50)
    for k in range(8):                                     # gezupfte Achtel
        add("pluck", b0 + k * 0.5, v[ARP[k]] + 12, 0.35, 60 if not calm else 50)
    if bar % 4 == 3 and not calm:
        for k, n in enumerate((v[3] + 24, v[2] + 24, v[1] + 24)):
            add("bell", b0 + 2.5 + k * 0.5, n, 0.6, 45)
    if calm and bar >= 2:
        add("drums", b0, 49, 2, 70)                        # Becken auf dem Kapitelanfang
        add("bass", b0, root - 12, 3.8, 70)
        continue
    if bar < 2:
        continue
    for bb, oc in ((0, 0), (1.5, 0), (2, 12), (3, 0), (3.5, 7)):
        add("bass", b0 + bb, root - 12 + oc, 0.45, 82)
    for k in range(4):
        kicks.append(b0 + k)
    for bb in (1, 3): add("drums", b0 + bb, 39, 0.2, 70)   # Clap
    for k in range(8): add("drums", b0 + k * 0.5, 42, 0.1, 50 if k % 2 else 36)
    add("drums", b0 + 3.5, 46, 0.3, 40)
# Schluss: Akkord klingt aus
for n in CHORDS[0][1]: add("epiano", N_BARS * 4 - 4, n, 3.8, 60)


def render_stem(inst, tmp):
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    ch = 9 if inst == "drums" else 0
    if inst != "drums": tr.append(mido.Message("program_change", program=PROGRAM[inst], channel=ch))
    for cc in (91, 93): tr.append(mido.Message("control_change", control=cc, value=0, channel=ch))
    ev = []
    for b, n, ln, vel in notes[inst]:
        ev.append((int(b * 480), 1, mido.Message("note_on", note=n, velocity=vel, channel=ch)))
        ev.append((int((b + ln) * 480), 0, mido.Message("note_off", note=n, velocity=0, channel=ch)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev: msg.time = tick - last; last = tick; tr.append(msg)
    mf, wf = Path(tmp) / f"{inst}.mid", Path(tmp) / f"{inst}.wav"
    mid.save(mf)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", str(SR), "-R", "0", "-C", "0", "-F", str(wf), SF2, str(mf)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    y, _ = sf.read(wf, always_2d=True, dtype="float32")
    out = np.zeros((int(SR * DUR) + SR * 3, 2), np.float32); n = min(len(y), len(out)); out[:n] = y[:n]
    return out


with tempfile.TemporaryDirectory() as tmp:
    ST = {k: render_stem(k, tmp) for k in notes if notes[k]}
L = len(next(iter(ST.values())))


def tt(x): return np.arange(int(SR * x)) / SR
def lowpass(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x, axis=0)
def level(x, db):
    e = np.abs(x).max(axis=1); act = e > 0.02 * (e.max() + 1e-9)
    if e.max() < 1e-6: return x
    return x * (0.1 * 10 ** (db / 20) / (np.sqrt(np.mean(x[act] ** 2)) + 1e-9))


def kick():
    t = tt(0.35); f = 50 + 90 * np.exp(-t / 0.03)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * 1.6)


kb = np.zeros((L, 2), np.float32)
for b in kicks:
    i = int(b * BEAT * SR); k = kick()[: L - i]; kb[i:i + len(k)] += k[:, None]
side = np.ones(L, np.float32)
for b in kicks:
    i = int(b * BEAT * SR); d = 1 - 0.35 * np.exp(-tt(BEAT) / 0.1); side[i:i + len(d)] = np.minimum(side[i:i + len(d)], d[: L - i])


def reverb(x, secs=1.8):
    irt = tt(secs); out = np.zeros_like(x); n = len(x) + len(irt); nfft = 1 << (n - 1).bit_length()
    for c in range(2):
        ir = lowpass(rng.standard_normal(len(irt)) * np.exp(-irt / (secs / 6)), 7000); ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return out


harm = (level(ST["epiano"], -11) + level(ST["pluck"], -14) + level(ST["pad"], -17) + level(ST["bell"], -18)) * side[:, None]
low = level(ST["bass"], -12) * side[:, None]
drums = level(ST["drums"], -15) + level(kb, -12)
mix = harm + low + drums + reverb(harm * 0.35 + drums * 0.08, 1.8) * 0.5
mix = sosfilt(butter(2, 30, "highpass", fs=SR, output="sos"), mix, axis=0)
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
out = mix[: int(SR * DUR)]
fade = int(SR * 2.5)
out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.1f}s, {BPM} BPM, {N_BARS} Takte)")
