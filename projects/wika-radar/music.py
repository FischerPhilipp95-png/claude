#!/usr/bin/env python3
"""Epische Trailer-Musik für das WIKA-Radar-Video (eigene Komposition, kein Sample).

Auf Wunsch „sehr episch“ statt der leichten Elektronik der Referenz.
96 BPM, D-Moll (Dm – B – Gm – A), 15 s = 6 Takte à 2,5 s. Instrumente aus FluidR3_GM (MIT):
Streicher-Ostinato, Blechbläser (Hörner, Posaunen, Brass), Chor, Pauken, Taiko, Becken.
Selbst synthetisiert: große Trommeln, Braams, Sub-Booms, Riser, Rückwärts-Sog. Mix: Hall, Bus-Kompressor, Limiter.

Dramaturgie (shotlist.md): Spannung 0–2.5 s, Einschlag 2.5 s (Produkt), Steigerung 5–11.25 s (Daten, Kunststoff),
Sog 11.25–12.5 s, finaler Hit 12.5 s (Logo) mit langem Nachhall bis 15 s.
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
HIT = 5 * BAR                     # finaler Hit (Logo)
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
OUT = DIR / "audio" / "music.wav"
rng = np.random.default_rng(96)

PROGRAM = {"strings": 48, "lowstr": 48, "horns": 60, "brass": 61, "trombone": 57, "choir": 52, "timpani": 47, "taiko": 116}
notes = {k: [] for k in list(PROGRAM) + ["drums"]}
CHORDS = [(38, [50, 53, 57]), (34, [50, 53, 58]), (43, [50, 55, 58]), (45, [49, 52, 57])]   # Dm, B, Gm, A


def add(inst, beat, note, length, vel):
    notes[inst].append((beat, note, length, int(np.clip(vel + rng.integers(-4, 5), 1, 127))))


# ---- Takt 0: Spannung (leiser Puls, Chor-Hauch)
for k in range(8):
    add("strings", k * 0.5, 50 if k % 4 else 50, 0.3, 40 + 4 * k)
for n in (50, 57): add("choir", 0, n, 4, 45)
add("lowstr", 0, 38, 4, 60)
# ---- ab Takt 1: Ostinato in 16teln, Akzente auf 1, 1+, 2+, 4
OST = [0, 0, 12, 0, 3, 0, 12, 0, 7, 0, 12, 0, 3, 0, 12, 7]
for bar in range(1, 5):
    root, ch = CHORDS[(bar - 1) % 4]
    base = root + 12
    for k in range(16):
        acc = 95 if k in (0, 6, 12) else 72 if k % 2 == 0 else 58
        add("strings", bar * 4 + k * 0.25, base + OST[k], 0.2, acc + bar * 4)
    add("lowstr", bar * 4, root, 4, 92)
    for n in ch: add("brass", bar * 4, n, 3.8 if bar < 4 else 2, 70 + bar * 8)
    add("trombone", bar * 4, root, 3.8, 85 + bar * 5)
    if bar >= 2:
        for n in ch: add("choir", bar * 4, n + 12, 4, 70 + bar * 8)
        hm = {2: [74, 77, 76, 74], 3: [74, 77, 79, 81], 4: [81, 79, 77, 76]}[bar]
        for i, n in enumerate(hm): add("horns", bar * 4 + i, n - 12, 0.95, 90 + bar * 4)
    for k in range(4):                                             # Pauken auf den Vierteln, ab Takt 3 in Achteln
        add("timpani", bar * 4 + k, root + 12 if k % 2 == 0 else root + 19, 0.4, 90 + bar * 5)
        if bar >= 3: add("timpani", bar * 4 + k + 0.5, root + 12, 0.3, 70 + bar * 5)
    for b in (0, 1.5, 2.5, 3) if bar < 3 else (0, 0.75, 1.5, 2, 2.5, 3, 3.25, 3.5, 3.75):
        add("taiko", bar * 4 + b, 45, 0.5, 110 if b in (0, 2) else 85)
    add("drums", bar * 4, 49, 2, 100 if bar in (1, 3) else 80)          # Becken auf der Eins
# Wirbel vor dem Sog
for r in range(16): add("drums", 4.5 * 4 + r * 0.125, 38, 0.1, 50 + 4 * r)
# ---- Takt 5: finaler Akkord (Dm) groß
for n in (50, 53, 57, 62): add("brass", 20, n, 6, 120); add("choir", 20, n + 12, 6, 110)
add("trombone", 20, 38, 6, 120); add("lowstr", 20, 26, 6, 110)
for n in (62, 65, 69, 74): add("strings", 20, n, 6, 105)
add("timpani", 20, 50, 2, 127); add("taiko", 20, 45, 2, 127); add("drums", 20, 49, 4, 127); add("drums", 20, 57, 4, 110)


def render_stem(inst, tmp):
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    ch = 9 if inst == "drums" else 0
    if inst != "drums": tr.append(mido.Message("program_change", program=PROGRAM[inst], channel=ch))
    for cc in (91, 93): tr.append(mido.Message("control_change", control=cc, value=0, channel=ch))
    ev = []
    for b, n, ln, v in notes[inst]:
        ev.append((int(b * 480), 1, mido.Message("note_on", note=n, velocity=v, channel=ch)))
        ev.append((int((b + ln) * 480), 0, mido.Message("note_off", note=n, velocity=0, channel=ch)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev: msg.time = tick - last; last = tick; tr.append(msg)
    mf, wf = Path(tmp) / f"{inst}.mid", Path(tmp) / f"{inst}.wav"
    mid.save(mf)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(SR), "-R", "0", "-C", "0", "-F", str(wf), SF2, str(mf)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    y, _ = sf.read(wf, always_2d=True, dtype="float32")
    out = np.zeros((int(SR * DUR) + SR * 3, 2), np.float32); n = min(len(y), len(out)); out[:n] = y[:n]
    return out


with tempfile.TemporaryDirectory() as tmp:
    ST = {k: render_stem(k, tmp) for k in notes if notes[k]}
L = len(next(iter(ST.values())))


def tt(x): return np.arange(int(SR * x)) / SR
def lowpass(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x, axis=0)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += (sig[:, None] if sig.ndim == 1 else sig) * g


def big_drum(length=1.6):
    t = tt(length)
    f = 42 + 80 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    skin = sosfilt(butter(2, [80, 900], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.12)
    return np.tanh((body + 0.6 * skin) * 1.5)


def braam(root, length=2.4):
    t = tt(length); s = np.zeros_like(t)
    for n in (root, root + 7, root + 12):
        for d in (-0.08, 0, 0.08):
            f = hz(n + d); s += 2 * (f * t % 1) - 1
    s /= 9
    out = np.zeros_like(s); seg = int(SR * 0.05)
    for i in range(0, len(t), seg):                             # Filter öffnet und schließt sich
        c = 150 + 2200 * np.sin(np.pi * min(1, i / len(t) * 1.6)) ** 0.7
        out[i:i + seg] = lowpass(lowpass(s[i:i + seg], c), c)
    env = np.minimum(t / 0.03, 1) * np.exp(-t / 1.4)
    return np.tanh(out * env * 3)


def sub_boom(length=3.5):
    t = tt(length); f = 32 + 40 * np.exp(-t / 0.15)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.2)


def riser(length):
    t = tt(length); n = rng.standard_normal(len(t)); out = np.zeros_like(t); k = 30; sl = len(t) // k
    for i in range(k):
        lo, hi = 150 + 2500 * (i / k) ** 2, 600 + 11000 * (i / k) ** 2
        out[i * sl:(i + 1) * sl] = sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), n[i * sl:(i + 1) * sl])
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1200 * (t / length) ** 2) / SR) * 0.25
    return (out + tone) * (t / length) ** 2.2


fx = np.zeros((L, 2), np.float32); drums_syn = np.zeros((L, 2), np.float32)
place(fx, riser(BAR), 0, 0.7)
place(fx, braam(26), BAR, 1.0); place(fx, sub_boom(), BAR, 1.0); place(drums_syn, big_drum(), BAR, 1.0)
for bar in range(2, 5):
    place(drums_syn, big_drum(1.2), bar * BAR, 0.8)
    place(drums_syn, big_drum(1.0), bar * BAR + 2 * BEAT, 0.6)
place(fx, braam(29, 2.0), 3 * BAR, 0.7)
place(fx, riser(1.2 * BAR), HIT - 1.2 * BAR, 0.9)                 # Sog in den finalen Hit
place(fx, braam(26, 3.5), HIT, 1.2); place(fx, sub_boom(4), HIT, 1.2); place(drums_syn, big_drum(2.5), HIT, 1.2)


def level(x, db):
    e = np.abs(x).max(axis=1); act = e > 0.02 * (e.max() + 1e-9)
    return x * (0.1 * 10 ** (db / 20) / (np.sqrt(np.mean(x[act] ** 2)) + 1e-9))


def reverb(x, secs=2.8):
    irt = tt(secs); out = np.zeros_like(x); n = len(x) + len(irt); nfft = 1 << (n - 1).bit_length()
    for c in range(2):
        ir = lowpass(rng.standard_normal(len(irt)) * np.exp(-irt / (secs / 5.5)), 6000); ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return out


orch = (level(ST["strings"], -10) + level(ST["lowstr"], -12) + level(ST["brass"], -9) + level(ST["trombone"], -11)
        + level(ST["horns"], -10) + level(ST["choir"], -12))
perc = level(ST["timpani"], -10) + level(ST["taiko"], -9) + level(ST["drums"], -14) + level(drums_syn, -7)
mix = orch + perc + level(fx, -9) + reverb(orch * 0.6 + perc * 0.25, 2.8) * 0.6

# Trailer-Dramaturgie: Intro lauter, 0,4 s vor dem finalen Hit alles wegsaugen (Stille-Moment), dann der Hit
g = np.ones(L, np.float32)
g[: int(BAR * SR)] = 2.2
i0, i1 = int((HIT - 0.4) * SR), int(HIT * SR)
g[i0:i1] = np.linspace(1, 0.08, i1 - i0) ** 2
mix *= g[:, None]
mix = sosfilt(butter(2, 25, "highpass", fs=SR, output="sos"), mix, axis=0)
env = np.sqrt(lowpass(np.mean(mix ** 2, axis=1), 6) + 1e-9)
thr = np.percentile(env[env > 1e-4], 75)
mix *= np.minimum(1, (thr / np.maximum(env, 1e-9)) ** 0.35)[:, None]
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
out = mix[: int(SR * DUR)]
fade = int(SR * 1.0)
out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, Stems: {', '.join(ST)})")
