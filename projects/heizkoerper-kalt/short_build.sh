#!/usr/bin/env bash
# Baut die zwei Shorts (1080x1920) zum Video. Aufruf aus dem Repo-Root:
#   bash projects/heizkoerper-kalt/short_build.sh
# Braucht: audio/shorts/*.wav (python3 tools/tts.py …/shorts_vo.json …/audio/shorts --engine piper),
# shorts_captions.json (python3 captions.py shorts_vo.json audio/shorts shorts_captions.json) und audio/music.wav (music.py).
set -euo pipefail
P=projects/heizkoerper-kalt
for NAME in ventilstift mieter; do
  node $P/short.mjs $NAME                                                     # Bild + short_<name>.json
  python3 -c "import json; d=json.load(open('$P/short_$NAME.json')); json.dump(d['cues'], open('$P/out/short_${NAME}_cues.json','w'))"
  DUR=$(python3 -c "import json; print(json.load(open('$P/short_$NAME.json'))['duration'])")
  node tools/sfx.mjs $P/out/short_${NAME}_cues.json $P/out/short_${NAME}_sfx.wav "$DUR"
  python3 - "$P" "$NAME" <<'PY'
# Mischung: Stimme an ihre Zeiten, Musik-Ausschnitt aus dem langen Video (geduckt unter der Stimme), UI-Sounds
import json, sys
import numpy as np, soundfile as sf
P, NAME = sys.argv[1], sys.argv[2]
d = json.load(open(f"{P}/short_{NAME}.json")); SR = 44100; n = int(d["duration"] * SR)
def load(f):
    y, sr = sf.read(f, always_2d=True, dtype="float32")
    if sr != SR: y = np.interp(np.arange(int(len(y) * SR / sr)) * sr / SR, np.arange(len(y)), y[:, 0])[:, None]
    return np.repeat(y[:, :1], 2, axis=1) if y.shape[1] == 1 else y[:, :2]
vo = np.zeros((n, 2), np.float32)
for l in d["vo"]:
    y = load(f"{P}/audio/shorts/{l['id']}.wav"); i = int(l["t"] * SR); vo[i:i + len(y)] += y[: n - i]
vo *= 10 ** (-3 / 20) / (np.abs(vo).max() + 1e-9)
start = {"ventilstift": 40.0, "mieter": 86.0}[NAME]           # lebendiger Teil der Musik, kein Kapitel-Break
mu = load(f"{P}/audio/music.wav")[int(start * SR): int(start * SR) + n]
mu = np.pad(mu, ((0, n - len(mu)), (0, 0)))
fade = np.ones(n, np.float32); k = int(0.4 * SR); fade[:k] = np.linspace(0, 1, k); fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
speak = (np.abs(vo).max(axis=1) > 0.02).astype(np.float32)
win = int(0.25 * SR); duck = 1 - 0.6 * np.convolve(speak, np.ones(win) / win, mode="same")
sfx = load(f"{P}/out/short_{NAME}_sfx.wav")[:n]; sfx = np.pad(sfx, ((0, n - len(sfx)), (0, 0)))
out = mu * 0.5 * (fade * duck)[:, None] + sfx * 0.35 + vo * 0.95
out *= 0.95 / (np.abs(out).max() + 1e-9)
sf.write(f"{P}/out/short_{NAME}_mix.wav", out, SR)
PY
  ffmpeg -hide_banner -loglevel error -y -i $P/out/short_${NAME}_video.mp4 -i $P/out/short_${NAME}_mix.wav -map 0:v -map 1:a -c:v copy \
    -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart $P/out/short_${NAME}.mp4
  rm -f $P/out/short_${NAME}_video.mp4 $P/out/short_${NAME}_mix.wav $P/out/short_${NAME}_sfx.wav $P/out/short_${NAME}_cues.json
  echo "Fertig: $P/out/short_${NAME}.mp4"
done
