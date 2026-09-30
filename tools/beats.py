#!/usr/bin/env python3
"""Musik vermessen und beats.json schreiben (numpy + librosa).

    python3 tools/beats.py projects/klima-short/audio/music.wav projects/klima-short/beats.json

beats.json:
    bpm        gemessenes Tempo
    beats      Zeitpunkte aller Beats (s)          -> Zustandswechsel
    downbeats  jeder 4. Beat (Taktanfang)          -> große Momente (Logo, CTA)
    hits       Onset-Spitzen (Anschläge)           -> SFX
"""
import json
import sys

import librosa
import numpy as np


HOP = 128


def fit_grid(onset_env, sr, duration, rough_bpm):
    """Regelmäßiges Beat-Raster (Periode + Versatz), das am besten auf die Onsets passt.

    librosa.beat_track driftet bei kurzen Tracks und Pausen. Unsere Musik hat ein festes Tempo,
    also suchen wir die Periode (±8 % um die Schätzung) und den Versatz mit der größten Onset-Summe.
    """
    frame_t = librosa.frames_to_time(np.arange(len(onset_env)), sr=sr, hop_length=HOP)
    env = onset_env / (onset_env.max() + 1e-9)

    def score(period, phase):
        grid = np.arange(phase, duration, period)
        idx = np.clip(np.searchsorted(frame_t, grid), 0, len(env) - 1)
        return env[idx].sum() / len(grid)

    rough = 60 / rough_bpm
    best = max(((score(p, ph), p, ph)
                for p in np.arange(rough * 0.92, rough * 1.08, 0.001)
                for ph in np.arange(0, p, 0.005)))
    _, period, phase = best
    # Feinjustierung um das Optimum
    _, period, phase = max(((score(p, ph), p, ph)
                            for p in np.arange(period - 0.001, period + 0.001, 0.0001)
                            for ph in np.arange(max(phase - 0.005, 0), phase + 0.005, 0.0005)))
    return period, np.arange(phase, duration, period)


def main(audio_path, out_path):
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    duration = len(y) / sr
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    rough_bpm = float(np.atleast_1d(librosa.feature.tempo(
        onset_envelope=onset_env, sr=sr, hop_length=HOP, start_bpm=120))[0])
    # Das Raster richtet sich nach dem Bass (Kick), sonst rastet es auf Hi-Hats zwischen den Beats ein.
    low = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP, fmax=200, n_mels=16)
    period, beats = fit_grid(low, sr, duration, rough_bpm)
    bpm = 60 / period

    # Welcher von 4 möglichen Versätzen ist der Taktanfang? Der mit der meisten Bass-Energie.
    low_t = librosa.frames_to_time(np.arange(len(low)), sr=sr, hop_length=HOP)
    at = lambda ts: low[np.clip(np.searchsorted(low_t, ts), 0, len(low) - 1)].mean()
    phase = int(np.argmax([at(beats[k::4]) for k in range(4)]))
    downbeats = beats[phase::4]

    hits = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=HOP, units="time")

    data = {
        "bpm": round(float(bpm), 2),
        "beats": [round(float(t), 3) for t in beats],
        "downbeats": [round(float(t), 3) for t in downbeats],
        "hits": [round(float(t), 3) for t in hits],
    }
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"{out_path}: {data['bpm']} BPM, {len(beats)} Beats, {len(downbeats)} Downbeats, {len(hits)} Hits")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
