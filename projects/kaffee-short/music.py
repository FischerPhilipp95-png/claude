#!/usr/bin/env python3
"""Originalmusik für den Kaffee-Short: 120 BPM, 20 s, dunkel und weich, ohne Synth-Flächen.

  0–3 s     Intro: tiefer Glockenton + leises Knistern (Bohne entsteht)
  3–16 s    Groove: weiche Kick, Rimshot, Shaker, Sub-Bass, Glocken-Arpeggio in d-Moll
  16–17.75  Morph: Groove dünnt aus, nur Glocke und Shaker
  17.75–18  Pause
  18 s      Schlussbild: Schlag + heller Akkord (das Bild kippt ins Helle)
"""
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
BEAT = 0.5
DUR = 20.0
OUT = Path(__file__).parent / "audio" / "music.wav"

rng = np.random.default_rng(11)
mix = np.zeros((int(SR * DUR) + SR, 2))


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    sig = sig[: len(mix) - i]
    mix[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    mix[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)


def t_(length):
    return np.arange(int(SR * length)) / SR


def kick(length=0.4):
    t = t_(length)
    f = 42 + 60 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * np.minimum(t / 0.004, 1)


def rim():
    t = t_(0.06)
    return (np.sin(2 * np.pi * 1700 * t) * 0.6 + np.diff(rng.standard_normal(len(t) + 1)) * 0.3) * np.exp(-t / 0.01)


def shaker():
    t = t_(0.07)
    n = np.diff(rng.standard_normal(len(t) + 1))
    return n * np.sin(np.pi * t / 0.07) ** 2 * 0.3


def bell(note, length=1.2, bright=0.25):
    t = t_(length)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.6)
    s += bright * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.12)   # Glocken-Oberton
    s += 0.15 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.3)
    return s * np.minimum(t / 0.003, 1)


def sub(note, length):
    t = t_(length)
    return np.sin(2 * np.pi * midi(note) * t) * np.minimum(t / 0.015, 1) * np.minimum((length - t) / 0.1, 1)


def crackle(length, density=60):
    out = np.zeros(int(SR * length))
    for _ in range(int(length * density)):
        i = rng.integers(0, len(out) - 200)
        out[i:i + 200] += np.diff(rng.standard_normal(201)) * np.exp(-np.arange(200) / 25) * rng.uniform(0.2, 1)
    return out * 0.15


# d-Moll: Dm – Bb – F – C
BARS = [(38, [62, 65, 69, 72]), (34, [58, 62, 65, 69]), (41, [60, 65, 69, 72]), (36, [60, 64, 67, 72])]

# Intro
place(bell(50, 3.0, 0.1), 0.0, 0.5)
place(crackle(2.8), 0.2, 1.0)
for b in range(6):
    place(shaker(), b * BEAT + 0.25, 0.25, pan=0.3)

# Groove 3–16 s (Einsatz auf Beat 3.0, Takte laufen ab 2.0 im 2-s-Raster)
for bar in range(1, 8):
    base = bar * 2.0
    root, arp = BARS[(bar - 1) % 4]
    for beat in range(4):
        t = base + beat * BEAT
        if t < 3.0 or t >= 16.0:
            continue
        place(kick(), t, 0.8)
        if beat % 2 == 1:
            place(rim(), t, 0.35, pan=-0.2)
        place(shaker(), t + 0.25, 0.3, pan=0.3)
    if base >= 4.0 and base < 16.0:
        place(sub(root, 1.9), base, 0.5)
    elif base == 2.0:
        place(sub(root, 0.9), 3.0, 0.5)
    for s in range(8):
        t = base + s * 0.25
        if 3.0 <= t < 16.0 and s % 2 == 0 or (base >= 8.0 and 3.0 <= t < 16.0):
            place(bell(arp[s % 4] + 12 * (s >= 4), 0.8), t, 0.16 if s % 2 else 0.2, pan=0.35 * np.sin(s * 1.3))

# Morph 16–17.75: nur Glocke + Shaker
for i, note in enumerate((74, 72, 69, 65)):
    place(bell(note, 1.0), 16.0 + i * 0.5, 0.18, pan=0.2)
for b in range(3):
    place(shaker(), 16.25 + b * 0.5, 0.25, pan=0.3)

# Schlussbild 18 s
place(kick(0.9), 18.0, 1.0)
place(sub(26, 1.9), 18.0, 0.55)
for i, note in enumerate((62, 69, 74, 77, 81)):
    place(bell(note, 2.0, 0.3), 18.0 + i * 0.025, 0.2, pan=-0.4 + 0.2 * i)

out = mix[: int(SR * DUR)]
fade = int(SR * 0.4)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.1f}s, 120 BPM)")
