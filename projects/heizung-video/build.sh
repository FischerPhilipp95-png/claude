#!/usr/bin/env bash
# Komplette Pipeline für das Heizkörper-Video. Aufruf aus dem Repo-Root:
#   bash projects/heizung-video/build.sh          (Voiceover nur, wenn er fehlt)
#   bash projects/heizung-video/build.sh --vo     (Voiceover neu)
set -euo pipefail
P=projects/heizung-video
if [[ "${1:-}" == "--vo" || ! -f $P/audio/vo/durations.json ]]; then
  python3 tools/tts.py $P/vo_script.json $P/audio/vo --engine piper --length-scale 1.02
fi
python3 $P/layout.py                                               # Sätze + Kapitel aufs 123-BPM-Raster
python3 $P/music.py                                                # 1. Musik im Charakter der Referenz
python3 -W ignore tools/beats.py $P/audio/music.wav $P/beats.json  # 2. Beats vermessen
node $P/render.mjs --timeline                                      # Timeline + cues.json
DUR=$(python3 -c "import json; print(json.load(open('$P/timeline.json'))['duration'])")
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav "$DUR"            # 3. UI-Sounds
node $P/render.mjs --contact                                       # Übersicht zur Abnahme
node $P/render.mjs                                                 # 4. Bild rendern
python3 tools/mix.py $P                                            #    mischen + muxen
echo "Fertig: $P/out/final.mp4"
