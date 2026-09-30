#!/usr/bin/env python3
"""Originalmusik für das HAVANOLA-Werbevideo (eigene Komposition, kein Sample aus der Referenz).

Charakter wie refs/ref-05: ca. 144 BPM, verspielt und positiv, leiser Anfang, Beat ab dem ersten
großen Morph, ruhige Passage, voller Schluss, abruptes Ende vor dem Logo.

Instrumente: echte Instrumenten-Samples aus der Soundfont FluidR3_GM (MIT-Lizenz, via FluidSynth):
Klavier, Marimba, Glockenspiel, Pizzicato-Streicher, Streicher, E-Bass, Drums.
Dazu selbst synthetisiert: druckvolle Kick, Sub-Bass, Riser, Einschlag. Mix in numpy:
Sidechain-Pumpen, Hall, Ping-Pong-Delay, Bus-Kompressor, Limiter.

D-Dur, D – A/Cis – Hm – G. Abschnitte in Takten (shotlist.md):
Intro 0–3, A 3–7, B mit Hook 7–11, C 11–13, ruhig 13–14.5, Finale 14.5–16, Stille ab 16 (ein Glockenton beim Logo).
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
BPM = 144
BEAT = 60 / BPM
BAR = 4 * BEAT
N_BARS = 18
STOP = 16
DUR = N_BARS * BAR
LOGO_DING = 64.5 * BEAT          # Schriftzug erscheint (render.mjs: T.word)
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
OUT = DIR / "audio" / "music.wav"
rng = np.random.default_rng(144)

# ---------------------------------------------------------------- Komposition (in Beats)
CHORDS = [  # Bass, Klavier-Voicing
    (38, [62, 66, 69, 74]),   # D
    (37, [64, 69, 73, 76]),   # A/Cis
    (35, [62, 66, 71, 74]),   # Hm
    (31, [62, 67, 71, 74]),   # G
]
HOOK = [  # Glockenspiel, 4 Takte: (Beat im Takt, Note, Länge)
    [(0, 90, .5), (.5, 88, .5), (1, 86, .75), (2, 81, .5), (2.5, 86, .5), (3, 88, .5), (3.5, 90, .5)],
    [(0, 88, .75), (1, 85, .5), (1.5, 81, .5), (2, 85, 1), (3, 88, .5), (3.5, 85, .5)],
    [(0, 86, .5), (.5, 83, .5), (1, 86, .75), (2, 90, .5), (2.5, 88, .5), (3, 86, .5), (3.5, 83, .5)],
    [(0, 83, .75), (1, 86, .5), (1.5, 88, .5), (2, 86, 1.5)],
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]


def sec(bar):
    if bar < 3: return "intro"
    if bar < 7: return "A"
    if bar < 11: return "B"
    if bar < 13: return "C"
    if bar < 14.5: return "calm"
    if bar < STOP: return "fin"
    return "end"


notes = {k: [] for k in ["piano", "marimba", "glock", "pizz", "strings", "bass", "drums"]}
PROGRAM = {"piano": 0, "marimba": 12, "glock": 9, "pizz": 45, "strings": 48, "bass": 33}
subs = []        # (Beat, Note, Länge) für den eigenen Sub-Bass
kicks = []       # Beats der eigenen Kick


def add(inst, beat, note, length, vel):
    vel = int(np.clip(vel + rng.integers(-6, 7), 1, 127))
    notes[inst].append((beat, note, length, vel))


for bar in range(STOP):
    for half in (0, 1):
        b0 = bar * 4 + half * 2
        s = sec(bar + half / 2 + 1e-6)
        root, voicing = CHORDS[bar % 4]
        # Marimba-Arpeggio (Achtel), eine Oktave über dem Klavier
        for k in range(4):
            n = voicing[ARP[half * 4 + k]] + 12
            v = {"intro": 70, "calm": 55}.get(s, 82)
            add("marimba", b0 + k * 0.5, n, 0.45, v)
        if s == "intro":
            if bar + half / 2 >= 1.5:                                   # Pizzicato ab dem Haus
                for k in (0, 1):
                    add("pizz", b0 + k, voicing[k * 2], 0.3, 70)
            if bar == 2:
                for k in range(8):
                    add("drums", b0 + k * 0.25, 70, 0.1, 40 + 8 * k)       # Maracas steigern sich
            continue
        if s == "calm":
            if half == 0:
                for n in voicing: add("piano", b0, n, 3.8, 62)
                for n in voicing[:3]: add("strings", b0, n - 12, 3.9, 70)
                add("bass", b0, root, 3.8, 70); subs.append((b0, root, 3.8))
            if half == 1 and bar % 2 == 1:
                add("glock", b0, voicing[-1] + 12, 1, 60)
            continue
        # ---- Groove (A, B, C, fin)
        for k in (0, 1):
            kicks.append(b0 + k)
            add("drums", b0 + k, 36, 0.2, 100)
        add("drums", b0 + 1, 39, 0.2, 105)                                # Clap auf 2 und 4
        if s != "A": add("drums", b0 + 1, 38, 0.2, 70)                    # Snare darunter
        for k in range(4):
            add("drums", b0 + k * 0.5, 42, 0.1, 60 if k % 2 else 45)          # Hi-Hat in Achteln
        if s in ("B", "C", "fin"):
            for k in (0.5, 1.5): add("drums", b0 + k, 46, 0.2, 55)       # offene Hi-Hat auf den Offbeats
        if s in ("C", "fin"):
            for k in range(8): add("drums", b0 + k * 0.25, 54, 0.1, 50 if k % 2 else 65)  # Tamburin
        for k in range(8): add("drums", b0 + k * 0.25, 70, 0.1, 35 if k % 2 else 50)     # Maracas
        # Bass: Grundton federnd in Achteln mit Oktavsprung
        pat = [(0, 0, .45), (.5, 12, .3), (1, 0, .45), (1.5, 0, .3)] if half == 0 else [(0, 0, .45), (.5, 12, .3), (1, 7, .45), (1.5, 12, .3)]
        for bb, off, ln in pat:
            add("bass", b0 + bb, root + off, ln, 92)
            subs.append((b0 + bb, root + off if off != 12 else root, ln))
        # Klavier-Stabs (synkopiert): 1, 2+, 4 im Takt
        for bb in ((0, 1.5) if half == 0 else (1,)):
            for n in voicing: add("piano", b0 + bb, n, 0.4, 88)
        if half == 0 and s in ("B", "C", "fin"):
            for n in voicing[:3]: add("strings", b0, n - 12, 3.95, 64)
        # Hook
        if s in ("B", "C", "fin") and half == 0:
            for bb, n, ln in HOOK[bar % 4]:
                add("glock", bar * 4 + bb, n + (12 if s == "C" and bb >= 2 else 0), ln, 96)
                add("pizz", bar * 4 + bb, n - 12, min(ln, .4), 78)

# Akzente: Crash auf den großen Morphs, Wirbel vor den Einsätzen
for b in (3 * 4, 7 * 4, 11.5 * 4, 14.5 * 4):
    add("drums", b, 49, 1, 100)
for r in range(8):                                # Snare-Wirbel in den Drop (Zoom in den Türknauf)
    add("drums", 2.5 * 4 + r * 0.25, 38, 0.1, 50 + 7 * r)
for r in range(16):                               # Wirbel aus der ruhigen Passage
    add("drums", 14 * 4 + r * 0.125, 38, 0.08, 40 + 4 * r)
# Schluss-Hit auf Takt 16 und ein Glockenton beim Logo
root, voicing = CHORDS[0]
for n in voicing + [voicing[0] - 12]: add("piano", STOP * 4, n, 1.0, 100)
add("drums", STOP * 4, 49, 1, 110)
add("bass", STOP * 4, 38, 0.6, 100)
kicks.append(STOP * 4)
subs.append((STOP * 4, 38, 0.6))
notes["glock"].append((LOGO_DING / BEAT, 86, 2, 70))


# ---------------------------------------------------------------- Rendern mit FluidSynth
def render_stem(inst, tmp):
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    ch = 9 if inst == "drums" else 0
    if inst != "drums":
        tr.append(mido.Message("program_change", program=PROGRAM[inst], channel=ch))
        tr.append(mido.Message("control_change", control=91, value=0, channel=ch))
        tr.append(mido.Message("control_change", control=93, value=0, channel=ch))
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
    y, sr = sf.read(wf, always_2d=True, dtype="float32")
    out = np.zeros((int(SR * DUR) + SR, 2), np.float32)
    n = min(len(y), len(out)); out[:n] = y[:n]
    return out


with tempfile.TemporaryDirectory() as tmp:
    ST = {k: render_stem(k, tmp) for k in notes if notes[k]}
L = len(next(iter(ST.values())))


def tt(length): return np.arange(int(SR * length)) / SR
def lowpass(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x, axis=0)
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    sig = sig[: len(buf) - i]
    buf[i:i + len(sig)] += (sig[:, None] if sig.ndim == 1 else sig) * g


# ---------------------------------------------------------------- eigene Sounds
def kick():
    t = tt(0.45)
    f = 48 + 120 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    click = lowpass(rng.standard_normal(len(t)), 5000) * np.exp(-t / 0.0025) * 0.6
    return np.tanh((body + click) * 1.8) * 0.9


def sub(note, length):
    t = tt(length)
    s = np.sin(2 * np.pi * 440 * 2 ** ((note - 12 - 69) / 12) * t)
    return s * np.minimum(t / 0.005, 1) * np.clip((length - t) / 0.03, 0, 1)


def riser(length):
    t = tt(length)
    n = rng.standard_normal(len(t))
    sos = [butter(2, [300 + 5000 * (i / 20) ** 2, 800 + 12000 * (i / 20) ** 2], "bandpass", fs=SR, output="sos") for i in range(20)]
    out = np.zeros_like(t); seg_len = len(t) // 20
    for i, s in enumerate(sos): out[i * seg_len:(i + 1) * seg_len] = sosfilt(s, n[i * seg_len:(i + 1) * seg_len])
    return out * (t / length) ** 2 * 0.5


def boom():
    t = tt(1.8)
    f = 38 + 50 * np.exp(-t / 0.1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6)


drums = ST["drums"] * 0.9
kick_bus = np.zeros((L, 2), np.float32)
for b in kicks: place(kick_bus, kick(), b * BEAT)
sub_bus = np.zeros((L, 2), np.float32)
for b, n, ln in subs: place(sub_bus, sub(n, ln * BEAT), b * BEAT, 0.55)
fx = np.zeros((L, 2), np.float32)
place(fx, riser(BAR * 1.0), 2 * BAR, 0.5)
place(fx, riser(BAR * 0.5), 14 * BAR, 0.45)
place(fx, boom(), 3 * BAR, 0.5)
place(fx, boom(), 13.75 * BAR, 0.35)                 # Pin landet
place(fx, boom(), STOP * BAR, 0.6)

# Sidechain: alles Harmonische duckt unter der Kick
side = np.ones(L, np.float32)
for b in kicks:
    i = int(b * BEAT * SR); d = 1 - 0.5 * np.exp(-tt(BEAT) / 0.09)
    side[i:i + len(d)] = np.minimum(side[i:i + len(d)], d[: L - i])
side = side[:, None]


def reverb(x, secs=1.8, pre=0.02):
    irt = tt(secs)
    irs = []
    for c in range(2):
        ir = rng.standard_normal(len(irt)) * np.exp(-irt / (secs / 6.5))
        ir = lowpass(lowpass(ir, 7000), 9000)
        ir = np.concatenate([np.zeros(int(pre * SR)), ir]); ir /= np.sqrt((ir ** 2).sum())
        irs.append(ir)
    out = np.zeros_like(x)
    n = len(x) + len(irs[0]); nfft = 1 << (n - 1).bit_length()
    for c in range(2):
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(irs[c], nfft), nfft)[: len(x)]
    return out


def pingpong(x, delay=BEAT * 0.75, fb=0.35, n=4):
    out = np.zeros_like(x); d = int(delay * SR)
    for k in range(1, n + 1):
        g = fb ** k; sh = k * d
        if sh >= len(x): break
        c = k % 2
        out[sh:, c] += x[:-sh, 0] * g * 0.7 + x[:-sh, 1] * g * 0.3
    return out


def level(x, db):
    """Stem auf einen festen Pegel bringen (RMS über die klingenden Stellen), dann in dB mischen."""
    e = np.abs(x).max(axis=1)
    act = e > 0.02 * (e.max() + 1e-9)
    rms = np.sqrt(np.mean(x[act] ** 2)) + 1e-9
    return x * (0.1 * 10 ** (db / 20) / rms)


drums = level(drums, -9)
kick_bus = level(kick_bus, -5)
harm = (level(ST["piano"], -8) + level(ST["marimba"], -9) + level(ST["pizz"], -14) + level(ST["strings"], -13)) * side
glock = level(ST["glock"], -9)
bass = (level(ST["bass"], -11) + level(sub_bus, -9)) * side
send = harm * 0.35 + glock * 0.5 + drums * 0.08
mix = harm + glock + pingpong(glock) * 0.35 + bass + drums + kick_bus + level(fx, -12) + reverb(send, 1.9) * 0.5

# Master: Tiefen unter 28 Hz raus, Bus-Kompressor, weicher Limiter
mix = sosfilt(butter(2, 28, "highpass", fs=SR, output="sos"), mix, axis=0)
env = np.sqrt(lowpass(np.mean(mix ** 2, axis=1), 8) + 1e-9)
thr = np.percentile(env[env > 1e-4], 70)
gain = np.minimum(1, (thr / np.maximum(env, 1e-9)) ** 0.4)
mix *= gain[:, None]
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)

out = mix[: int(SR * DUR)]
# abruptes Ende: Schluss-Hit klingt 0,45 s, dann Stille (nur der Glockenton beim Logo bleibt)
cut, fade = int((STOP * BAR + 0.45) * SR), int(0.06 * SR)
ding = int(LOGO_DING * SR)
keep = out.copy()
out[cut - fade:cut] *= np.linspace(1, 0, fade)[:, None]
out[cut:] = 0
ding_part = (glock + pingpong(glock) * 0.35 + reverb(glock * 0.5, 2.2) * 0.5)[ding - 200: int(SR * DUR)]
ding_part = ding_part[: len(out) - (ding - 200)]
out[ding - 200:ding - 200 + len(ding_part)] += ding_part * 0.8 / (np.max(np.abs(ding_part)) + 1e-9) * 0.3
out *= 10 ** (-1 / 20) / np.max(np.abs(out))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out, SR, subtype="PCM_16")
print(f"{OUT} ({DUR:.2f}s, {BPM} BPM, Stille ab {STOP * BAR:.2f}s, Stems: {', '.join(ST)})")
