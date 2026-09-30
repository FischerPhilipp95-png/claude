#!/usr/bin/env python3
"""Originalmusik für das HAVANOLA-Werbevideo im Charakter von refs/ref-05 (eigene Komposition, kein Sample).

Vermessener Charakter der Referenz: ca. 144 BPM, verspielte Elektronik, leiser Anfang nur mit Melodie,
dann Beat, ruhige Passage, wieder voll, abruptes Ende (Logo in Stille).
Hier: D-Dur (D – A – Hm – G), Marimba-Arpeggios (FM), Glocken-Hook, federnder Bass in Achteln,
runde Kick, Clap auf 2 und 4, Shaker in 16teln. Abschnitte in Takten (shotlist.md):
Intro 0–3, voll 3–13, ruhig 13–14.5, voll 14.5–16, Schluss-Stab auf 16, dann Stille bis 18.
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import lfilter

DIR = Path(__file__).parent
SR = 44100
BPM = 144
BEAT = 60 / BPM
BAR = 4 * BEAT
N_BARS = 18
STOP = 16                      # hier endet die Musik
DUR = N_BARS * BAR
OUT = DIR / "audio" / "music.wav"

rng = np.random.default_rng(144)
mix = np.zeros((int(SR * DUR) + SR * 2, 2), dtype=np.float32)
bus = np.zeros_like(mix)       # Harmonisches (bekommt Sidechain + Hall)
side = np.ones(len(mix), dtype=np.float32)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(length):
    return np.arange(int(SR * length)) / SR


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)


def place(sig, t, gain=1.0, pan=0.0, to=None):
    i = int(round(t * SR))
    if i < 0 or i >= len(mix):
        return
    sig = sig[: len(mix) - i].astype(np.float32)
    tgt = mix if to is None else to
    tgt[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
    tgt[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


def marimba(note, length=0.5):
    t = tt(length)
    f = midi(note)
    mod = 1.8 * np.exp(-t / 0.02) * np.sin(2 * np.pi * 4 * f * t)
    s = np.sin(2 * np.pi * f * t + mod) + 0.2 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t / 0.01)
    return s * np.exp(-t / 0.16) * np.minimum(t / 0.001, 1)


def bell(note, length=1.2):
    t = tt(length)
    f = midi(note)
    mod = 2.5 * np.exp(-t / 0.3) * np.sin(2 * np.pi * 3.5 * f * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.45) * np.minimum(t / 0.002, 1)


def bass(note, length):
    t = tt(length)
    f = midi(note)
    saw = 2 * (f * t % 1) - 1
    s = 0.8 * np.sin(2 * np.pi * f * t) + 0.35 * lowpass(saw, 300 + 900 * np.exp(-length * 3))
    env = np.minimum(t / 0.004, 1) * np.exp(-t / (length * 0.9))
    return np.tanh(s * 1.4) * env


def kick(length=0.35):
    t = tt(length)
    f = 52 + 90 * np.exp(-t / 0.025)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * np.minimum(t / 0.002, 1)


def clap():
    t = tt(0.22)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 1200)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.007) * (t >= d) for d in (0, 0.01, 0.02)) * 0.4
    env += np.exp(-np.maximum(t - 0.025, 0) / 0.06) * (t >= 0.025)
    return n * env * 0.5


def shaker():
    t = tt(0.07)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 7000)
    return n * np.sin(np.pi * np.minimum(t / 0.07, 1)) ** 2


def pad(notes, length):
    t = tt(length)
    s = np.zeros_like(t)
    for n in notes:
        for d in (-0.07, 0.07):
            s += np.sin(2 * np.pi * midi(n + d) * t + rng.uniform(0, 6))
    s /= 2 * len(notes)
    return s * np.clip(np.minimum(t / 0.5, (length - t) / 0.5), 0, 1)


def reverb(x, secs=1.5, wet=0.25):
    ir_t = tt(secs)
    ir = lowpass(rng.standard_normal(len(ir_t)) * np.exp(-ir_t / (secs / 5)), 6000)
    ir /= np.sqrt((ir ** 2).sum())
    out = x.copy()
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    for ch in range(2):
        out[:, ch] += wet * np.fft.irfft(np.fft.rfft(x[:, ch], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return out


# D – A – Hm – G
CHORDS = [(50, [62, 66, 69]), (45, [61, 64, 69]), (47, [62, 66, 71]), (43, [62, 67, 71])]
ARP = [0, 1, 2, 1, 2, 0, 1, 2]                  # Marimba-Figur in Achteln
HOOK = [78, None, 76, 74, None, 76, 78, 81, None, 78, 76, None, 74, 76, 74, None]  # Glocken in Achteln (2 Takte)
BASS = [(0, 0), (0.5, 12), (1, 0), (1.75, 0), (2, 12), (2.5, 0), (3, 7), (3.5, 12)]  # (Beat, Oktave/Quinte)


def section(b):
    if b < 3:
        return "intro"
    if 13 <= b < 14.5:
        return "calm"
    if b < STOP:
        return "full"
    return "end"


for b in range(STOP):
    for half in (0, 1):
        bb = b + half / 2
        t0 = bb * BAR
        sec = section(bb + 1e-6)
        root, notes = CHORDS[b % 4]
        # Marimba-Arpeggio (immer, außer im Schluss)
        for k in range(4):
            idx = ARP[half * 4 + k]
            n = notes[idx] + (12 if sec == "full" and k == 3 else 0)
            place(marimba(n), t0 + k * BEAT / 2, 0.22 if sec != "calm" else 0.16, pan=-0.35 + 0.23 * k, to=bus)
        if half == 0 and sec in ("intro", "calm"):
            place(pad([n - 12 for n in notes], BAR + 0.3), t0, 0.22, to=bus)
        if sec == "intro":
            if b == 2:
                for k in range(8):
                    place(shaker(), t0 + k * BEAT / 4, 0.05 + 0.02 * k, pan=0.3)
            continue
        if sec == "calm":
            place(bass(root - 12, BEAT * 1.8), t0, 0.35, to=bus)
            continue
        # voller Groove
        for k in range(2):
            tk = t0 + k * BEAT
            place(kick(), tk, 0.8)
            i = int(tk * SR)
            dip = 1 - 0.55 * np.exp(-tt(BEAT) / 0.08)
            side[i:i + len(dip)] = np.minimum(side[i:i + len(dip)], dip[: len(side) - i])
        place(clap(), t0 + BEAT, 0.45, pan=0.05)
        for k in range(8):
            place(shaker(), t0 + k * BEAT / 4, [0.12, 0.05, 0.08, 0.05][k % 4], pan=0.35)
        for beat, off in BASS[half * 4: half * 4 + 4]:
            place(bass(root - 12 + off, BEAT * 0.45), t0 + (beat - 2 * half) * BEAT, 0.5, to=bus)
        if b >= 7:
            for k in range(4):
                n = HOOK[((b % 2) * 8 + half * 4 + k)]
                if n:
                    place(bell(n), t0 + k * BEAT / 2, 0.12, pan=0.2, to=bus)

# Fill vor dem Wiedereinstieg nach der ruhigen Passage
for r in range(6):
    place(clap(), 14.5 * BAR - BEAT * 1.5 + r * BEAT / 4, 0.1 + 0.05 * r)
# Schluss-Stab auf Takt 16, danach Stille
end = STOP * BAR
place(kick(0.4), end, 0.9)
for n in (62, 66, 69, 74):
    place(marimba(n, 0.45), end, 0.25, to=bus)
place(bell(81, 0.6), end, 0.15, to=bus)

bus *= side[:, None]
mix += reverb(bus, 1.3, 0.22)
out = mix[: int(SR * DUR)]
cut = int(SR * (end + 0.5))
fade = int(SR * 0.08)
out[cut - fade:cut] *= np.linspace(1, 0, fade)[:, None]
out[cut:] = 0
out = np.tanh(out * 1.1) / np.tanh(1.1)
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, {N_BARS} Takte, Stille ab {end:.2f}s)")
