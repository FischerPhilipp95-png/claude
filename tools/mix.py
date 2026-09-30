#!/usr/bin/env python3
"""Musik + SFX + Voiceover mischen und mit dem Bild muxen.

    python3 tools/mix.py projects/klima-short

Liest aus dem Projektordner: timeline.json (VO-Startzeiten), audio/music.wav, audio/sfx.wav,
audio/vo/<id>.wav, out/video.mp4. Schreibt audio/mix.wav und out/final.mp4.
Die Musik wird unter der Stimme automatisch leiser (Ducking).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR = 44100


def load(path):
    y, sr = sf.read(path, always_2d=True, dtype="float32")
    if sr != SR:
        y = resample_poly(y, SR, sr, axis=0).astype("float32")
    return y if y.shape[1] == 2 else np.repeat(y, 2, axis=1)


def smooth(env, attack_s, release_s):
    out, a, r, v = np.empty_like(env), 1 / (attack_s * SR), 1 / (release_s * SR), 0.0
    for i, x in enumerate(env):
        v += (x - v) * (a if x > v else r)
        out[i] = v
    return out


def main(proj):
    proj = Path(proj)
    tl = json.loads((proj / "timeline.json").read_text())
    n = int(tl["duration"] * SR)
    fit = lambda y: np.pad(y, ((0, max(0, n - len(y))), (0, 0)))[:n]

    music = fit(load(proj / "audio/music.wav"))
    sfx = fit(load(proj / "audio/sfx.wav"))
    vo = np.zeros((n, 2), dtype="float32")
    for line in tl["vo"]:
        y = load(proj / "audio/vo" / f"{line['id']}.wav")
        i = int(line["t"] * SR)
        y = y[: n - i]
        vo[i:i + len(y)] += y
    vo *= 10 ** (-3 / 20) / (np.abs(vo).max() + 1e-9)

    # Ducking: Musik -9 dB, solange gesprochen wird
    speaking = (np.abs(vo).max(axis=1) > 0.02).astype("float32")
    speaking = smooth(np.convolve(speaking, np.ones(2205) / 2205, mode="same") > 0.01, 0.06, 0.35)
    duck = 1 - (1 - 10 ** (-9 / 20)) * speaking

    out = music * 0.55 * duck[:, None] + sfx * 0.35 + vo * 0.95
    out = np.tanh(out * 1.1) / np.tanh(1.1)  # weicher Limiter
    out *= 10 ** (-1 / 20) / np.abs(out).max()
    sf.write(proj / "audio/mix.wav", out, SR, subtype="PCM_16")

    final = proj / "out/final.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(proj / "out/video.mp4"), "-i", str(proj / "audio/mix.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", str(final)], check=True)
    print(final)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
