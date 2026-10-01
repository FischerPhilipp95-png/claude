#!/usr/bin/env bash
# Komplette Pipeline für das HECH-Video (Instagram Reels 9:16, 22 s). Aufruf aus dem Repo-Root:
#   bash projects/hech-promo/build.sh
set -euo pipefail
P=projects/hech-promo
python3 $P/music.py                                                # 1. Musik (108 BPM, echte Instrumente)
python3 - <<PY                                                     # 2. Beat-Raster exakt aus dem Tempo
import json
B = 60 / 108
beats = [round(i * B, 4) for i in range(10 * 4 + 1)]
json.dump({"bpm": 108, "beats": beats, "downbeats": beats[::4], "hits": []}, open("$P/beats.json", "w"))
PY
node $P/render.mjs --timeline                                      # timeline.json + cues.json
DUR=$(python3 -c "import json; print(json.load(open('$P/timeline.json'))['duration'])")
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav "$DUR"            # 3. UI-Sounds
node $P/render.mjs --contact                                       # Übersicht zur Abnahme
node $P/render.mjs                                                 # 4. Bild rendern
python3 tools/mix.py $P                                            #    mischen + muxen
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart $P/out/final_norm.mp4
mv $P/out/final_norm.mp4 $P/out/final.mp4
echo "Fertig: $P/out/final.mp4"
