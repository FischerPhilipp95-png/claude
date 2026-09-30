#!/usr/bin/env python3
"""Originalmusik für das HAVANOLA-Werbevideo im Charakter von refs/ref-04 (eigene Komposition, kein Sample).

Vermessener Charakter der Referenz: 136 BPM, D-Moll, sehr bassig (Energie fast nur unter 250 Hz),
Pegel pulsiert im Takt, kurze Einbrüche vor großen Wechseln.
Hier: Four-on-the-floor-Kick, Sub-Bass mit Sidechain-Pumpen, Claps auf 2 und 4, 16tel-Hats,
gezupfte Moll-Akkorde (Dm – B – F – C), Flächen in den ruhigen Teilen, Riser vor den Drops.
Die Abschnitte folgen shotlist.md (Takte): Intro 0–1.5, leicht 1.5–4, voll 4–10, Drop 10–15,
Break 15–16.5, voll 16.5–20.5, Logo ab 20.5.
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import lfilter

DIR = Path(__file__).parent
SR = 44100
BPM = 136
BEAT = 60 / BPM
BAR = 4 * BEAT
N_BARS = 23
DUR = N_BARS * BAR
OUT = DIR / "audio" / "music.wav"

rng = np.random.default_rng(136)
mix = np.zeros((int(SR * DUR) + SR * 3, 2), dtype=np.float32)
side = np.ones(len(mix), dtype=np.float32)      # Sidechain-Hüllkurve (von der Kick)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(length):
    return np.arange(int(SR * length)) / SR


def place(sig, t, gain=1.0, pan=0.0, bus=None):
    i = int(round(t * SR))
    if i >= len(mix) or i < 0:
        return
    sig = sig[: len(mix) - i].astype(np.float32)
    tgt = mix if bus is None else bus
    tgt[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    tgt[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)


def kick(length=0.4):
    t = tt(length)
    f = 48 + 110 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.3
    return np.tanh((body + click) * 1.6) * np.minimum(t / 0.002, 1)


def clap():
    t = tt(0.25)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 900)                         # Hochpass
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.008) * (t >= d) for d in (0, 0.011, 0.022)) * 0.5
    env += np.exp(-np.maximum(t - 0.03, 0) / 0.07) * (t >= 0.03)
    return n * env * 0.6


def hat(open_=False):
    t = tt(0.25 if open_ else 0.05)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 6000)
    return n * np.exp(-t / (0.09 if open_ else 0.012))


def sub(note, length):
    t = tt(length)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    return np.tanh(s * 1.3) * np.minimum(t / 0.004, 1) * np.minimum((length - t) / 0.02, 1)


def pluck(notes, length=0.35, bright=1.0):
    t = tt(length)
    s = np.zeros_like(t)
    for n in notes:
        for d in (-0.08, 0.0, 0.08):              # leicht verstimmt = breiter
            f = midi(n + d)
            s += 2 * (f * t % 1) - 1
    s /= 3 * len(notes)
    s = lowpass(s, 900 + 3000 * bright) * np.exp(-t / 0.11) * np.minimum(t / 0.002, 1)
    return s


def pad(notes, length):
    t = tt(length)
    s = np.zeros_like(t)
    for n in notes:
        for d in (-0.12, 0.0, 0.12):
            f = midi(n + d)
            s += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) + 0.3 * np.sin(4 * np.pi * f * t)
    s /= 3 * len(notes)
    env = np.minimum(t / 0.6, 1) * np.minimum((length - t) / 0.8, 1)
    return s * np.clip(env, 0, 1)


def riser(length):
    t = tt(length)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = int(SR * 0.05)
    for i in range(0, len(t), seg):              # Filter öffnet sich stückweise
        c = 300 + 9000 * (i / len(t)) ** 2
        out[i:i + seg] = n[i:i + seg] - lowpass(n[i:i + seg], c * 0.5)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / length) ** 2) / SR) * 0.3
    return (out * 0.5 + tone) * (t / length) ** 2


def impact(length=2.5):
    t = tt(length)
    f = 40 + 60 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    n = rng.standard_normal(len(t))
    return boom + lowpass(n, 2500) * np.exp(-t / 0.4) * 0.5


def reverb(x, secs=1.6, wet=0.25):
    ir_t = tt(secs)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / (secs / 5))
    ir = lowpass(ir, 5000)
    ir /= np.sqrt((ir ** 2).sum())
    out = x.copy()
    for ch in range(2):
        n = len(x) + len(ir)
        nfft = 1 << (n - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[:, ch], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
        out[:, ch] = x[:, ch] + wet * y
    return out


# Dm – B – F – C   (Grundton, Akkordtöne)
CHORDS = [(38, [62, 65, 69]), (34, [62, 65, 70]), (41, [60, 65, 69]), (36, [60, 64, 67])]
# gezupfte Akkorde: Positionen in 16teln (synkopiert wie moderne Future-House-Stabs)
STABS = [0, 3, 6, 10, 12]
MELODY = [74, 77, 76, 74, 72, 69, 72, 74]        # kleine Hook in D-Moll (Achtel)

synth = np.zeros_like(mix)                        # Bus für Pluck/Pad/Bass (wird gepumpt)
sections = {"intro": (0, 1.5), "light": (1.5, 4), "full1": (4, 10), "drop": (10, 15),
            "break": (15, 16.5), "full2": (16.5, 20.5), "end": (20.5, N_BARS)}


def section(bar):
    for k, (a, b) in sections.items():
        if a <= bar < b:
            return k
    return "end"


for b2 in range(int(N_BARS * 2)):                 # in halben Takten, weil Abschnitte auf ½ Takt beginnen
    bar = b2 / 2
    t0 = bar * BAR
    sec = section(bar + 1e-6)
    root, notes = CHORDS[int(bar) % 4]
    half = b2 % 2                                 # 0 = erste, 1 = zweite Takthälfte

    if sec == "end":
        continue
    if sec in ("intro", "break"):
        if half == 0 or bar == sections[sec][0]:
            place(pad([n - 12 for n in notes] + [root + 24], BAR * (1 if half == 0 else 0.5) + 0.8), t0, 0.6, bus=synth)
        for k in range(8):                        # leise gefilterte Plucks
            if (k + 8 * half) in STABS:
                place(pluck(notes, bright=0.35), t0 + k * BEAT / 4, 0.45, pan=0.3 * np.sin(k), bus=synth)
        if sec == "break":
            place(sub(root, BEAT * 2 * 0.95), t0, 0.3, bus=synth)
        continue

    full = sec in ("full1", "drop", "full2")
    # Kick: vier Viertel pro Takt (hier zwei pro halbem Takt)
    for k in range(2):
        tk = t0 + k * BEAT
        place(kick(), tk, 0.9 if full else 0.75)
        i = int(tk * SR)
        dip = 1 - 0.75 * np.exp(-tt(BEAT) / 0.09)  # Sidechain: Bass und Akkorde ducken
        side[i:i + len(dip)] = np.minimum(side[i:i + len(dip)], dip[: len(side) - i])
    # Clap auf 2 und 4
    if full or sec == "light":
        place(clap(), t0 + BEAT, 0.5 if full else 0.35, pan=0.05)
    # Hats: 16tel geschlossen, offene auf den Offbeats
    for k in range(8):
        vel = [0.5, 0.2, 0.35, 0.2][k % 4]
        place(hat(), t0 + k * BEAT / 4, (0.22 if full else 0.14) * vel, pan=0.35)
    if full:
        for k in (0.5, 1.5):
            place(hat(True), t0 + k * BEAT, 0.12, pan=-0.3)
    # Sub-Bass auf den Offbeats (klassisches House-Pumpen) + Grundton auf der Eins
    for k in (0, 0.5, 1.5) if full else (0,):
        place(sub(root + (12 if k == 1.5 and sec == "drop" else 0), BEAT * (0.5 if k else 0.45)), t0 + k * BEAT, 0.6, bus=synth)
    # gezupfte Akkorde
    for k in range(8):
        if (k + 8 * half) in STABS:
            place(pluck(notes, bright=1.0 if full else 0.5), t0 + k * BEAT / 4, 0.32, pan=0.25 * np.sin(k + bar), bus=synth)
    # Hook im Drop
    if sec == "drop":
        for k in range(4):
            n = MELODY[(int(b2) * 4 + k) % len(MELODY)]
            place(pluck([n + 12], 0.22, 1.2), t0 + k * BEAT / 2, 0.2, pan=-0.2, bus=synth)

# Pumpen auf den Synth-Bus anwenden, Hall auf alles Harmonische
synth *= side[:, None]
mix += reverb(synth, 1.4, 0.22)

# Riser + Fill vor den großen Wechseln (Takt 4, 10, 16.5)
for bar, ln in ((4, BAR), (10, BAR), (16.5, BAR / 2)):
    place(riser(ln), bar * BAR - ln, 0.35)
for r in range(8):                                # Snare-/Clap-Wirbel vor dem Drop
    place(clap(), 10 * BAR - BAR / 2 + r * BEAT / 4, 0.12 + 0.04 * r)

# Logo: Einschlag + langer Akkord, der ausklingt
end = sections["end"][0] * BAR
place(impact(3.5), end, 0.8)
place(kick(0.8), end, 0.9)
tail = pad([62, 65, 69, 74], DUR - end + 1.5)
place(tail, end, 0.4)
place(sub(38, 2.5) * np.exp(-tt(2.5) / 1.0), end, 0.5)

out = mix[: int(SR * DUR)]
fade = int(SR * 1.5)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out = np.tanh(out * 1.2) / np.tanh(1.2)
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, {N_BARS} Takte)")
