#!/usr/bin/env bash
# Komplette Pipeline für „Die 5 häufigsten Probleme mit Klimaanlagen“ (16:9, YouTube). Aufruf aus dem Repo-Root:
#   bash projects/klima-probleme/build.sh          (Voiceover nur, wenn er fehlt)
#   bash projects/klima-probleme/build.sh --vo     (Voiceover neu)
set -euo pipefail
P=projects/klima-probleme
if [[ "${1:-}" == "--vo" || ! -f $P/audio/vo/durations.json ]]; then
  python3 tools/tts.py $P/vo_script.json $P/audio/vo --engine piper
fi
if [[ "${1:-}" == "--vo" || ! -f $P/captions.json ]]; then
  python3 $P/captions.py                                           # Wort-Timing für die Untertitel (faster-whisper)
fi
python3 $P/layout.py                                               # Sätze + Kapitel aufs 124-BPM-Raster
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
enc 950k 2M 4M "-c:a aac -b:a 128k" $P/out/Klimaanlage_5_Probleme.mp4
enc 3200k 6M 12M "-c:a copy" $P/out/final_3m.mp4
mv $P/out/final_3m.mp4 $P/out/final.mp4 && rm -f $P/out/x264*
echo "Fertig: $P/out/final.mp4"
