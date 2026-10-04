#!/usr/bin/env bash
# Komplette Pipeline für „DeLonghi Magnifica S: kein Wasser“ (16:9, YouTube). Aufruf aus dem Repo-Root:
#   bash projects/delonghi-kein-wasser/build.sh          (Voiceover nur, wenn er fehlt)
#   bash projects/delonghi-kein-wasser/build.sh --vo     (Voiceover neu)
set -euo pipefail
P=projects/delonghi-kein-wasser
if [[ "${1:-}" == "--vo" || ! -f $P/audio/vo/durations.json ]]; then
  python3 tools/tts.py $P/vo_script.json $P/audio/vo --engine piper
fi
if [[ "${1:-}" == "--vo" || ! -f $P/captions.json ]]; then
  python3 $P/captions.py                                           # Wort-Timing für die Untertitel (faster-whisper)
fi
python3 $P/layout.py                                               # Sätze + Kapitel aufs 112-BPM-Raster
python3 $P/music.py                                                # 1. Musik (FluidR3, E-Piano, Pluck, Drums)
python3 - <<PY                                                     # 2. Beat-Raster exakt aus dem Tempo
import json
s = json.load(open("$P/sections.json")); B = 60 / s["bpm"]
beats = [round(i * B, 4) for i in range(int(s["total"] / B) + 1)]
json.dump({"bpm": s["bpm"], "beats": beats, "downbeats": beats[::4], "hits": []}, open("$P/beats.json", "w"))
PY
node $P/render.mjs --timeline                                      # timeline.json + cues.json
DUR=$(python3 -c "import json; print(json.load(open('$P/timeline.json'))['duration'])")
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav "$DUR"            # 3. UI-Sounds
# Szenen aus dem eigenen Video als Einzelbilder (A: Tasse bleibt leer, B: rote Lampen, C: Zoom aufs Bedienfeld)
for spec in "A 2 8.6 crop=864:1300:0:260,scale=540:-2" "B 29.5 7 crop=864:1300:0:260,scale=540:-2" "C 29.5 7 crop=640:360:112:320,scale=960:540"; do
  set -- $spec
  if [[ ! -d $P/out/frames/$1 ]]; then mkdir -p $P/out/frames/$1
    ffmpeg -hide_banner -loglevel error -y -ss $2 -t $3 -i $P/footage/original.mp4 -vf "$4" -q:v 3 $P/out/frames/$1/%04d.jpg; fi
done
# Maschinengeräusch aus dem Originalvideo an den Stellen, an denen die Szenen laufen, in die UI-Sounds mischen
ffmpeg -hide_banner -loglevel error -y -i $P/footage/original.mp4 -vn -ac 2 -ar 44100 $P/out/footage_audio.wav
python3 - "$P" <<'PY'
import json, sys
import numpy as np, soundfile as sf
P = sys.argv[1]; SR = 44100
tl = json.load(open(f"{P}/timeline.json")); sfx, _ = sf.read(f"{P}/audio/sfx.wav", always_2d=True, dtype="float32")
src, _ = sf.read(f"{P}/out/footage_audio.wav", always_2d=True, dtype="float32")
src *= 0.5 / (np.abs(src).max() + 1e-9)
for s in tl["footage_audio"]:
    i, j, n = int(s["t"] * SR), int(s["src"] * SR), int(s["dur"] * SR)
    y = src[j:j + n].copy(); f = min(int(0.25 * SR), len(y) // 2)
    y[:f] *= np.linspace(0, 1, f)[:, None]; y[-f:] *= np.linspace(1, 0, f)[:, None]
    sfx[i:i + len(y)] += y[: len(sfx) - i] * s["gain"]
sfx *= min(1, 0.9 / (np.abs(sfx).max() + 1e-9))
sf.write(f"{P}/audio/sfx.wav", sfx, SR)
PY
rm -f $P/out/footage_audio.wav
node $P/render.mjs --contact                                       # Übersicht zur Abnahme
node $P/render.mjs                                                 # 4. Bild rendern
python3 tools/mix.py $P                                            #    mischen + muxen
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart $P/out/final_norm.mp4
mv $P/out/final_norm.mp4 $P/out/final.mp4
# 5. Größe: Upload-Datei auf 3,2 Mbit/s (bleibt unter dem 100-MB-Limit von GitHub), Chat-Kopie unter 30 MB (je 2 Durchgänge)
enc() { for pass in 1 2; do
  out=$([[ $pass == 1 ]] && echo /dev/null || echo "$5"); fmt=$([[ $pass == 1 ]] && echo "-an -f null" || echo "$4 -movflags +faststart")
  ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v libx264 -preset slow -tune animation -b:v $1 -maxrate $2 -bufsize $3 -pass $pass -passlogfile $P/out/x264 $fmt "$out"
done; }
enc 950k 2M 4M "-c:a aac -b:a 128k" $P/out/DeLonghi_Magnifica_S_kein_Wasser.mp4
enc 3200k 6M 12M "-c:a copy" $P/out/final_3m.mp4
mv $P/out/final_3m.mp4 $P/out/final.mp4 && rm -f $P/out/x264*
echo "Fertig: $P/out/final.mp4"
