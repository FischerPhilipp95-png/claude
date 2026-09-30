#!/usr/bin/env bash
# Komplette Pipeline für den Klima-Short. Aufruf aus dem Repo-Root:
#   bash projects/klima-short/build.sh            (Voiceover wird nur erzeugt, wenn er fehlt)
#   bash projects/klima-short/build.sh --vo fish   (Voiceover neu mit Fish Audio)
set -euo pipefail
P=projects/klima-short
if [[ "${1:-}" == "--vo" || ! -f $P/audio/vo/durations.json ]]; then
  python3 tools/tts.py $P/vo_script.json $P/audio/vo ${2:+--engine $2}
fi
python3 $P/music.py                                              # 1. Musik, 120 BPM
python3 -W ignore tools/beats.py $P/audio/music.wav $P/beats.json  # 2. Beats vermessen
node $P/render.mjs --timeline                                    # Timeline + cues.json
node tools/sfx.mjs $P/cues.json $P/audio/sfx.wav 20              # 3. UI-Sounds
node $P/render.mjs --contact                                     # Contact Sheet zur Abnahme
node $P/render.mjs                                               # 4. Bild rendern
python3 tools/mix.py $P                                          #    mischen + muxen
echo "Fertig: $P/out/final.mp4"
