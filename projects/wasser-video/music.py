#!/usr/bin/env python3
"""Originalmusik für das Wasser-Video im Charakter von refs/ref-03 (eigene Komposition, kein Sample).
Wie das Strom-Video, aber in A-Pentatonik und mit zusätzlichen „Blubb“-Blips (Pitch steigt).

Vermessener Charakter der Referenz: 123 BPM, sehr bassig, obertonreicher gehaltener Synth-Bass,
kurze Glitch-Klicks im 16tel-Raster, Blips, Fis-Pentatonik, Breaks beim Text, langer Sub-Ton am Ende.
Die Länge und die Breaks kommen aus sections.json (Kapitelanfänge).
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

DIR = Path(__file__).parent
SEC = json.loads((DIR / "sections.json").read_text())
SR = 44100
BEAT = SEC["beat"]
BAR = SEC["bar"]
DUR = SEC["total"]
OUT = DIR / "audio" / "music.wav"

rng = np.random.default_rng(321)
mix = np.zeros((int(SR * DUR) + SR * 2, 2), dtype=np.float32)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(mix):
        return
    sig = sig[: len(mix) - i].astype(np.float32)
    mix[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    mix[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


def tt(length):
    return np.arange(int(SR * length)) / SR


def saw_bass(note, length, bright=1.0):
    """Bandbegrenzter Sägezahn mit schließendem Filter + Sub-Sinus: der gehaltene Bass der Referenz."""
    t = tt(length)
    f = midi(note)
    cutoff = 250 + 1100 * bright * np.exp(-t / 0.18)
    s = np.zeros_like(t)
    for k in range(1, 16):
        if k * f > 5000:
            break
        s += np.sin(2 * np.pi * k * f * t) / k / (1 + (k * f / cutoff) ** 2)
    s = 0.55 * s + 0.8 * np.sin(2 * np.pi * f / 2 * t)  # Sub eine Oktave tiefer
    env = np.minimum(t / 0.006, 1) * np.minimum((length - t) / 0.03, 1)
    return s * env


def kick(length=0.35):
    t = tt(length)
    f = 45 + 70 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * np.minimum(t / 0.003, 1)


def click(kind):
    """Glitch-Klicks: kurz, trocken, unterschiedliche Farben."""
    n = int(SR * (0.012 if kind < 2 else 0.03))
    t = np.arange(n) / SR
    noise = np.diff(rng.standard_normal(n + 1))
    if kind == 0:
        return noise * np.exp(-t / 0.002)
    if kind == 1:
        return np.sin(2 * np.pi * 4200 * t) * np.exp(-t / 0.003)
    return (noise * 0.5 + np.sin(2 * np.pi * 900 * t)) * np.exp(-t / 0.008)


def blip(note, length=0.09):
    t = tt(length)
    f = midi(note) * (1 + 0.5 * np.exp(-t / 0.01))  # kurzer Pitch-Fall, „Stimme“ der Figuren
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * np.minimum(t / 0.001, 1)


def bubble(note, length=0.11):
    """„Blubb“: kurzer Ton mit steigender Tonhöhe, wie eine Luftblase."""
    t = tt(length)
    f = midi(note) * (0.6 + 0.8 * (t / length) ** 0.6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / length) ** 1.5


def pluck(notes, length=0.4):
    t = tt(length)
    s = sum(np.sign(np.sin(2 * np.pi * midi(n) * t)) * 0.3 + np.sin(2 * np.pi * midi(n) * t) for n in notes)
    lp = np.convolve(s, np.ones(6) / 6, mode="same")
    return lp * np.exp(-t / 0.09) * np.minimum(t / 0.002, 1) / len(notes)


def sub_drone(note, length):
    t = tt(length)
    return np.sin(2 * np.pi * midi(note) * t) * np.minimum(t / 0.05, 1) * np.minimum((length - t) / 1.5, 1)


# Fis-Pentatonik (Fis, Gis, Ais, Cis, Dis), Grundtöne pro Takt
PENTA = [69, 71, 73, 76, 78, 81, 83, 85, 88, 90]
ROOTS = [45, 42, 47, 40]           # A1, Fis1, H1, E1
BASS_RHYTHMS = [                   # (Start in Beats, Länge in Beats, Oktave)
    [(0, 1.5, 0), (1.5, 0.5, 12), (2, 2, 0)],
    [(0, 0.75, 0), (1, 1, 0), (2.5, 0.5, 12), (3, 1, 0)],
    [(0, 2, 0), (2, 0.5, 7), (2.75, 1.25, 0)],
]
# 16tel-Klickmuster (1 = Klick), verschiedene Varianten pro Kapitel
CLICKS = [
    "1010001010100010", "1000101010001011", "1011001000101010", "1000100110001000",
]

starts = [c["start"] for c in SEC["chapters"] if c["title"]]
breaks = [(s, s + BAR) for s in starts]            # beim Kapiteltitel ein Takt Break
end_card = SEC["end_card"]
chapter_of = lambda t: sum(1 for c in SEC["chapters"] if c["start"] <= t) - 1

n_bars = int(end_card / BAR)
for b in range(n_bars):
    t0 = b * BAR
    ch = chapter_of(t0 + 0.01)
    in_break = any(a - 1e-3 <= t0 < e - 1e-3 for a, e in breaks)
    root = ROOTS[b % 4]
    rhythm = BASS_RHYTHMS[(b // 4 + ch) % len(BASS_RHYTHMS)]
    intro = t0 < 2 * BAR

    if in_break:
        # Break: nur ein gehaltener Bass + aufsteigende Blips (Text baut sich auf)
        place(saw_bass(root, BAR * 0.95, bright=0.4), t0, 0.5)
        for k in range(8):
            place(blip(PENTA[k % len(PENTA)] + 12, 0.07), t0 + k * BEAT / 2, 0.12, pan=-0.5 + k / 8)
        continue

    for st, ln, octv in rhythm:
        place(saw_bass(root + octv, ln * BEAT * 0.95, bright=0.7 if octv else 1.0), t0 + st * BEAT, 0.42)
    if not intro:
        for k in (0, 2):
            place(kick(), t0 + k * BEAT, 0.55)
    pat = CLICKS[(ch + b // 8) % len(CLICKS)]
    for k, on in enumerate(pat):
        if on == "1":
            place(click(k % 3), t0 + k * BEAT / 4, 0.22 if k % 4 == 0 else 0.14, pan=0.6 * np.sin(k * 1.7 + b))
    if b % 2 == 1:  # Glitch-Ratsche am Taktende
        for r in range(4):
            place(click(1), t0 + 3.5 * BEAT + r * BEAT / 8, 0.08 + 0.03 * r, pan=0.4)
    # Blips: kleine Pentatonik-Figur auf Achteln, jeder zweite Takt
    if b % 2 == 0 and not intro:
        for k in range(3):
            note = PENTA[int(rng.integers(0, len(PENTA)))]
            place(blip(note), t0 + (1.5 + k * 0.5) * BEAT, 0.1, pan=-0.3 + 0.3 * k)
    # Blubb-Blasen: zwei pro Takt auf den Off-Beats
    if not intro:
        for k in (1.5, 3.25):
            place(bubble(PENTA[int(rng.integers(0, 6))]), t0 + k * BEAT, 0.12, pan=0.5 * np.sin(b + k))
    # Pluck-Akkord zu Kapitelbeginn und alle 4 Takte
    if b % 4 == 0 and not intro:
        place(pluck([root + 24, root + 31, root + 36]), t0, 0.16)

# Schlussbild: Blip-Figur, dann langer Sub-Ton (wie am Ende der Referenz)
place(kick(0.8), end_card, 0.8)
for k, n in enumerate((78, 82, 85, 90)):
    place(blip(n, 0.12), end_card + k * BEAT / 2, 0.16, pan=-0.3 + 0.2 * k)
place(sub_drone(30, DUR - end_card), end_card, 0.55)
place(saw_bass(42, 2.5, 0.3), end_card, 0.25)

out = mix[: int(SR * DUR)]
fade = int(SR * 1.2)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.1f}s, 123 BPM)")
