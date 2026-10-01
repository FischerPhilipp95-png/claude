#!/usr/bin/env bash
# Komplette Pipeline für das WIKA-Radar-Video (16:9, 15 s). Aufruf aus dem Repo-Root:
#   bash projects/hech-promo/build.sh
set -euo pipefail
P=projects/wika-radar
python3 $P/music.py                                                # 1. epische Musik (96 BPM, Orchester + Trailer-Sounds)
python3 - <<PY                                                     # 2. Beat-Raster exakt aus dem Tempo
import json
B = 60 / 96
beats = [round(i * B, 4) for i in range(6 * 4 + 1)]
json.dump({"bpm": 96, "beats": beats, "downbeats": beats[::4], "hits": []}, open("$P/beats.json", "w"))
PY
node $P/render.mjs --timeline                                      # timeline.json + cues.json
DUR=$(python3 -c "import json; print(json.load(open('$P/timeline.json'))['duration'])")
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav "$DUR"            # 3. UI-Sounds
node $P/render.mjs --contact                                       # Übersicht zur Abnahme
node $P/render.mjs                                                 # 4. Bild rendern
python3 tools/mix.py $P                                            #    mischen + muxen
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart $P/out/final_norm.mp4
mv $P/out/final_norm.mp4 $P/out/final.mp4
# Filmkorn macht die Datei riesig: auf 13 Mbit/s (2 Durchgänge) bringen, bleibt unter 30 MB und sieht sauber aus
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v libx264 -preset slow -b:v 13M -maxrate 16M -bufsize 26M -pass 1 -passlogfile $P/out/x264 -an -f null /dev/null
ffmpeg -hide_banner -loglevel error -y -i $P/out/final.mp4 -c:v libx264 -preset slow -b:v 13M -maxrate 16M -bufsize 26M -pass 2 -passlogfile $P/out/x264 -c:a copy -movflags +faststart $P/out/final_13m.mp4
mv $P/out/final_13m.mp4 $P/out/final.mp4 && rm -f $P/out/x264*
echo "Fertig: $P/out/final.mp4"
