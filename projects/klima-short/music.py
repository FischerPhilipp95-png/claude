#!/usr/bin/env python3
"""Originalmusik für den Klima-Short: 120 BPM, 20 s, minimal, ohne Synth-Flächen.

Aufbau auf derselben Timeline wie das Bild (1 Takt = 2 s):
  Takt 1–2   (0–4 s)     Hook: nur ein trockener Uhr-Tick und ein Marimba-Motiv
  Takt 3–8   (4–16 s)    Kreislauf: Kick, Hi-Hat, Sub-Bass, Marimba-Arpeggio
  16.5–18 s              Kollaps: alles raus, nur ein kurzer Rauschanstieg
  18 s                   Schlussbild: tiefer Schlag + Akkord, klingt bis 20 s aus
"""
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
BPM = 120
BEAT = 60 / BPM
DUR = 20.0
OUT = Path(__file__).parent / "audio" / "music.wav"

rng = np.random.default_rng(7)
mix = np.zeros((int(SR * DUR) + SR, 2))


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    sig = sig[: len(mix) - i]
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * left * np.sqrt(2)
    mix[i:i + len(sig), 1] += sig * gain * right * np.sqrt(2)


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1.0) * np.exp(-t / decay)


def kick(length=0.35):
    n = int(SR * length)
    t = np.arange(n) / SR
    freq = 45 + 95 * np.exp(-t / 0.03)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * env(n, 0.001, 0.12)


def hat(length=0.04):
    n = int(SR * length)
    noise = np.diff(rng.standard_normal(n + 1))  # Hochpass durch Differenz
    return noise * env(n, 0.0005, 0.012) * 0.5


def tick():
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env(n, 0.0005, 0.006)


def marimba(note, length=0.5):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = midi(note)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.28)
    bar = 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.04)  # Holz-Anschlag
    return (body + bar) * np.minimum(t / 0.002, 1)


def sub(note, length):
    n = int(SR * length)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * midi(note) * t)
    return s * np.minimum(t / 0.01, 1) * np.minimum((length - t) / 0.08, 1)


def riser(length):
    n = int(SR * length)
    t = np.arange(n) / SR
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * (t / length) ** 3 * 0.25


# Harmonie pro Takt (Grundton, Arpeggio): Am – F – C – G, sauber und hell
BARS = [
    (45, [69, 72, 76, 79]),   # Am
    (41, [65, 69, 72, 76]),   # F
    (48, [67, 72, 76, 79]),   # C
    (43, [67, 71, 74, 79]),   # G
]

# Hook: Uhr-Tick auf jedem Beat, Motiv auf den Beats 1, 1.5 und 3 jedes Takts
for b in range(8):
    place(tick(), b * BEAT, 0.35, pan=0.2 * (-1) ** b)
for bar in range(2):
    base = bar * 2.0
    for dt, note in ((0.0, 76), (0.25, 79), (1.0, 72 if bar == 0 else 74)):
        place(marimba(note, 0.8), base + dt, 0.35, pan=-0.2)

# Kreislauf: 4–16 s (6 Takte)
for bar in range(2, 8):
    base = bar * 2.0
    root, arp = BARS[(bar - 2) % 4]
    place(sub(root, 1.9), base, 0.45)
    for beat in range(4):
        t = base + beat * BEAT
        place(kick(), t, 0.9)
        place(hat(), t + BEAT / 2, 0.35, pan=0.35)
    # Marimba: Achtel-Arpeggio, ab Takt 5 dichter
    steps = 8 if bar >= 4 else 4
    for s in range(steps):
        t = base + s * (2.0 / steps)
        place(marimba(arp[s % 4], 0.5), t, 0.28 if s % 2 else 0.34, pan=0.3 * np.sin(s))

# Übergang 16–16.5 s: letzter Takt-Anfang, dann Stille
place(kick(), 16.0, 0.9)
place(sub(45, 0.45), 16.0, 0.45)
place(riser(1.5), 16.5, 1.0)

# Schlussbild 18 s: tiefer Schlag + A-Moll-Akkord, ausklingend
place(kick(0.8), 18.0, 1.0)
place(sub(33, 1.9), 18.0, 0.5)
for i, note in enumerate((57, 64, 69, 72, 76)):
    place(marimba(note, 2.0), 18.0 + i * 0.03, 0.26, pan=-0.4 + 0.2 * i)

out = mix[: int(SR * DUR)]
fade = int(SR * 0.4)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.1f}s, {BPM} BPM)")
