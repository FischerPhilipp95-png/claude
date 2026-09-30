#!/usr/bin/env bash
# Komplette Pipeline für das HAVANOLA-Werbevideo (Instagram Reels 9:16). Aufruf aus dem Repo-Root:
#   bash projects/havanola-promo/build.sh
set -euo pipefail
P=projects/havanola-promo
python3 $P/music.py                                                # 1. Musik (136 BPM, eigenes Raster)
python3 - <<EOF                                                    # 2. Beat-Raster exakt aus dem Tempo
import json
B = 60 / 136
beats = [round(i * B, 4) for i in range(int(23 * 4 * B / B) + 1)]
json.dump({"bpm": 136, "beats": beats, "downbeats": beats[::4], "hits": []}, open("$P/beats.json", "w"))
EOF
node $P/render.mjs --timeline                                      # timeline.json + cues.json
DUR=$(python3 -c "import json; print(json.load(open('$P/timeline.json'))['duration'])")
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav "$DUR"            # 3. UI-Sounds
node $P/render.mjs --contact                                       # Übersicht zur Abnahme
node $P/render.mjs                                                 # 4. Bild rendern
python3 tools/mix.py $P                                            #    mischen + muxen
# Ohne Sprecher ist der Mix sehr laut: auf -14 LUFS (Instagram/YouTube-Norm) bringen
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart $P/out/final_norm.mp4
mv $P/out/final_norm.mp4 $P/out/final.mp4
echo "Fertig: $P/out/final.mp4"
