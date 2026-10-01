#!/usr/bin/env python3
"""Originalmusik für das HECH-Video im Charakter von refs/ref-06 (eigene Komposition, kein Sample).

Vermessener Charakter der Referenz: 107,7 BPM, moderner Hip-Hop/Pop-Beat, sehr bassig (harte 808),
leises Intro, Drop nach ca. 3,5 s, Wechsel auf den Takten.

108 BPM, G-Moll (Gm7 – Esmaj7 – B – F). Instrumente aus FluidR3_GM (MIT): Kalimba-Hook, E-Piano,
Synth-Brass-Stabs, Hi-Hats, Crash. Selbst synthetisiert: 808 mit Glide, Kick, Clap, Snaps, Riser.
Abschnitte in Takten (shotlist.md): Intro 0–1.5, Drop 1.5–3, dunkel 3–5.5, Sterne 5.5–6.5,
Chat 6.5–8.5 (zurückgenommen), Schluss 8.5–10.
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
BPM = 108
BEAT = 60 / BPM
BAR = 4 * BEAT
N_BARS = 10
DUR = N_BARS * BAR
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
OUT = DIR / "audio" / "music.wav"
rng = np.random.default_rng(108)

CHORDS = [(43, [55, 58, 62, 65]), (39, [55, 58, 63, 67]), (34, [53, 58, 62, 65]), (41, [53, 57, 60, 65])]
HOOK = [
    [(0, 79, .5), (.5, 77, .5), (1, 74, .5), (1.75, 77, .25), (2, 79, .75), (3, 82, .5), (3.5, 79, .5)],
    [(0, 77, .5), (.5, 74, .5), (1, 72, .5), (1.5, 74, .5), (2, 70, 1), (3, 72, .5), (3.5, 74, .5)],
]
B808 = [(0, 0, .7), (.75, 0, .5), (1.5, 0, .5), (2.5, 12, .9), (3.5, 0, .45)]   # (Beat, Oktave, Länge)
PROGRAM = {"kalimba": 108, "epiano": 4, "brass": 62, "pluck": 45}


def sec(b):
    if b < 1.5: return "intro"
    if b < 3: return "drop"
    if b < 5.5: return "dark"
    if b < 6.5: return "stars"
    if b < 8.5: return "chat"
    return "fin"


notes = {k: [] for k in ["kalimba", "epiano", "brass", "pluck", "drums"]}
k808, kicks, claps, snaps = [], [], [], []


def add(inst, beat, note, length, vel):
    notes[inst].append((beat, note, length, int(np.clip(vel + rng.integers(-5, 6), 1, 127))))


for bar in range(N_BARS):
    for half in (0, 1):
        bb = bar + half / 2
        b0 = bar * 4 + half * 2
        s = sec(bb + 1e-6)
        root, voicing = CHORDS[bar % 4]
        # E-Piano-Akkorde: auf der Eins und auf 3+ (Achtel vor der 4)
        if half == 0:
            for n in voicing: add("epiano", b0, n, 2.3, 58 if s in ("intro", "chat") else 66)
        else:
            for n in voicing: add("epiano", b0 + 0.5, n, 1.4, 52 if s in ("intro", "chat") else 60)
        if s == "intro":
            snaps.append(b0 + 1)                                    # Snaps auf 2 und 4
            if bar == 1 and half == 0:
                for i, (b, n, ln) in enumerate(HOOK[0][:4]): add("kalimba", b0 + b, n, ln, 70)
            continue
        # ---- Beat
        full = s in ("drop", "dark", "fin")
        for b, octv, ln in B808:
            if half * 2 <= b < half * 2 + 2:
                if s == "chat" and b not in (0, 2.5): continue
                k808.append((bar * 4 + b, root - 12 + octv, ln * (1.6 if s == "chat" else 1), octv > 0))
        for b in ((0, 0.75) if half == 0 else (0.5,)):
            if s == "chat" and b == 0.75: continue
            if s == "stars" and half == 1: continue
            kicks.append(b0 + b)
        claps.append(b0 + 1)
        # Hi-Hats: Achtel, am Phrasenende Rolls
        roll = (bar % 2 == 1 and half == 1)
        for k in range(4):
            t = b0 + k * 0.5
            if roll and k == 3:
                for r in range(6): add("drums", t + r / 12, 42, 0.05, 45 + 8 * r)       # Triolen-Roll
            else:
                add("drums", t, 42, 0.08, 72 if k % 2 else 52)
        if full and half == 1: add("drums", b0 + 1.5, 46, 0.3, 60)
        # Kalimba-Hook
        if s in ("drop", "dark", "fin") and half == 0:
            for b, n, ln in HOOK[bar % 2]: add("kalimba", bar * 4 + b, n, ln, 92)
        if s == "dark" and half == 0:  # Gegenmelodie Pizzicato eine Oktave tiefer
            for b, n, ln in HOOK[(bar + 1) % 2][::2]: add("pluck", bar * 4 + b + 0.25, n - 12, 0.3, 70)
        if s == "chat" and half == 0:
            for b, n, ln in HOOK[bar % 2][::2]: add("kalimba", bar * 4 + b, n, ln, 64)
        # Brass-Stabs auf der Eins (Drop und Schluss)
        if s in ("drop", "fin") and half == 0:
            for n in voicing: add("brass", b0, n + 12, 0.35, 92)
            add("brass", b0 + 2.5, voicing[-1] + 12, 0.3, 80)

for b in (1.5 * 4, 3 * 4, 8.5 * 4): add("drums", b, 49, 1.5, 105)     # Crash auf den Wechseln
add("drums", 5.5 * 4, 49, 1, 80)
# Schluss: großer Akkord + 808 rutscht nach unten
end = 9 * 4
for n in CHORDS[0][1]: add("brass", end, n + 12, 2.5, 100); add("epiano", end, n, 3.5, 80)
k808.append((end, 31, 3.5, False))
kicks.append(end); claps.append(end + 1)


def render_stem(inst, tmp):
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    ch = 9 if inst == "drums" else 0
    if inst != "drums":
        tr.append(mido.Message("program_change", program=PROGRAM[inst], channel=ch))
    for cc in (91, 93): tr.append(mido.Message("control_change", control=cc, value=0, channel=ch))
    ev = []
    for b, n, ln, v in notes[inst]:
        ev.append((int(b * 480), 1, mido.Message("note_on", note=n, velocity=v, channel=ch)))
        ev.append((int((b + ln) * 480), 0, mido.Message("note_off", note=n, velocity=0, channel=ch)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev:
        msg.time = tick - last; last = tick; tr.append(msg)
    mf, wf = Path(tmp) / f"{inst}.mid", Path(tmp) / f"{inst}.wav"
    mid.save(mf)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(SR), "-R", "0", "-C", "0", "-F", str(wf), SF2, str(mf)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    y, _ = sf.read(wf, always_2d=True, dtype="float32")
    out = np.zeros((int(SR * DUR) + SR * 2, 2), np.float32)
    n = min(len(y), len(out)); out[:n] = y[:n]
    return out


with tempfile.TemporaryDirectory() as tmp:
    ST = {k: render_stem(k, tmp) for k in notes if notes[k]}
L = len(next(iter(ST.values())))


def tt(length): return np.arange(int(SR * length)) / SR
def lowpass(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x, axis=0)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0: return
    sig = sig[: len(buf) - i]
    buf[i:i + len(sig)] += (sig[:, None] if sig.ndim == 1 else sig) * g


def b808(note, length, slide_from_above=False):
    t = tt(length + 0.05)
    f0 = hz(note)
    f = f0 * (1 + (0.5 if slide_from_above else 0.0) * np.exp(-t / 0.06)) * (1 + 1.5 * np.exp(-t / 0.012))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(t / 0.003, 1) * np.exp(-t / max(0.35, length * 0.8)) * np.clip((length + 0.05 - t) / 0.05, 0, 1)
    return np.tanh(s * env * 2.4) * 0.8


def kick():
    t = tt(0.4)
    f = 52 + 140 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    click = lowpass(rng.standard_normal(len(t)), 6000) * np.exp(-t / 0.002) * 0.7
    return np.tanh((body + click) * 2)


def clap():
    t = tt(0.3)
    n = rng.standard_normal(len(t)); n = sosfilt(butter(2, [900, 6000], "bandpass", fs=SR, output="sos"), n)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.006) * (t >= d) for d in (0, 0.009, 0.019)) * 0.5
    env += np.exp(-np.maximum(t - 0.027, 0) / 0.08) * (t >= 0.027)
    return n * env


def snap():
    t = tt(0.12)
    n = sosfilt(butter(2, [1800, 7000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return (n * np.exp(-t / 0.012) + 0.4 * np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.008))


def riser(length):
    t = tt(length)
    n = rng.standard_normal(len(t)); out = np.zeros_like(t); k = 24; sl = len(t) // k
    for i in range(k):
        lo, hi = 200 + 3000 * (i / k) ** 2, 900 + 12000 * (i / k) ** 2
        out[i * sl:(i + 1) * sl] = sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), n[i * sl:(i + 1) * sl])
    return out * (t / length) ** 2


def impact():
    t = tt(1.5)
    f = 40 + 70 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5) + lowpass(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.25) * 0.4


bus808 = np.zeros((L, 2), np.float32); bk = np.zeros((L, 2), np.float32); bc = np.zeros((L, 2), np.float32); fx = np.zeros((L, 2), np.float32)
for b, n, ln, up in k808: place(bus808, b808(n, ln * BEAT, up), b * BEAT)
for b in kicks: place(bk, kick(), b * BEAT)
for b in claps: place(bc, clap(), b * BEAT)
for b in snaps: place(bc, snap(), b * BEAT, 0.6)
place(fx, riser(BAR * 0.5), 1.0 * BAR, 1.0)
place(fx, impact(), 1.5 * BAR, 1.2)
place(fx, riser(BAR * 0.5), 2.5 * BAR, 0.6)
place(fx, impact(), 3 * BAR, 0.8)
place(fx, riser(BAR * 0.5), 8 * BAR, 0.8)
place(fx, impact(), 8.5 * BAR, 1.2)

side = np.ones(L, np.float32)
for b in kicks:
    i = int(b * BEAT * SR); d = 1 - 0.45 * np.exp(-tt(BEAT) / 0.1)
    side[i:i + len(d)] = np.minimum(side[i:i + len(d)], d[: L - i])
side = side[:, None]


def level(x, db):
    e = np.abs(x).max(axis=1); act = e > 0.02 * (e.max() + 1e-9)
    return x * (0.1 * 10 ** (db / 20) / (np.sqrt(np.mean(x[act] ** 2)) + 1e-9))


def reverb(x, secs=1.6):
    irt = tt(secs); out = np.zeros_like(x); n = len(x) + len(irt); nfft = 1 << (n - 1).bit_length()
    for c in range(2):
        ir = lowpass(rng.standard_normal(len(irt)) * np.exp(-irt / (secs / 6)), 7000); ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return out


def pingpong(x, delay=BEAT * 0.75, fb=0.35, n=4):
    out = np.zeros_like(x); d = int(delay * SR)
    for k in range(1, n + 1):
        sh = k * d
        if sh >= len(x): break
        out[sh:, k % 2] += (x[:-sh, 0] + x[:-sh, 1]) * 0.5 * fb ** k
    return out


# Intro: E-Piano gefiltert (wie durch eine Wand), ab dem Drop offen
ep = ST["epiano"].copy()
drop_i = int(1.5 * BAR * SR)
ep[:drop_i] = lowpass(lowpass(ep[:drop_i], 900), 900)
harm = (level(ep, -11) + level(ST["brass"], -10) + level(ST["pluck"], -16)) * side
kal = level(ST["kalimba"], -9)
drums = level(ST["drums"], -13)
low = level(bus808, -4)
mix = (harm + kal + pingpong(kal) * 0.3 + low + level(bk, -6) + level(bc, -10) + drums + level(fx, -12)
       + reverb(harm * 0.3 + kal * 0.4 + bc * 0.2, 1.6) * 0.45)

mix = sosfilt(butter(2, 28, "highpass", fs=SR, output="sos"), mix, axis=0)
env = np.sqrt(lowpass(np.mean(mix ** 2, axis=1), 8) + 1e-9)
thr = np.percentile(env[env > 1e-4], 70)
mix *= np.minimum(1, (thr / np.maximum(env, 1e-9)) ** 0.4)[:, None]
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
out = mix[: int(SR * DUR)]
fade = int(SR * 0.8)
out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, Stems: {', '.join(ST)})")
