#!/usr/bin/env bash
# Installiert alle Werkzeuge für die Video-Pipeline.
# Läuft automatisch beim Start jeder Claude-Code-Sitzung (siehe .claude/settings.json).
set -euo pipefail

pip install -q --disable-pip-version-check \
  numpy scipy librosa soundfile pillow imageio-ffmpeg yt-dlp piper-tts mido faster-whisper trendspyg 2>&1 | grep -v "Running pip as the 'root' user" || true

# ffmpeg aus imageio-ffmpeg global verfügbar machen, falls kein System-ffmpeg existiert
if ! command -v ffmpeg >/dev/null 2>&1; then
  FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
  ln -sf "$FF" /usr/local/bin/ffmpeg 2>/dev/null || true
fi

# Echte Instrumente für die Musik: FluidSynth + Soundfont FluidR3_GM (MIT-Lizenz)
# + MuseScore General (MIT-Lizenz, echte Orchester-Sektionen) für hochwertige/epische Musik
PKGS="fluidsynth fluid-soundfont-gm musescore-general-soundfont-lossless"
if ! command -v fluidsynth >/dev/null 2>&1 || [ ! -f /usr/share/sounds/sf2/FluidR3_GM.sf2 ] || [ ! -f /usr/share/sounds/sf2/MuseScore_General_Full.sf2 ]; then
  (apt-get install -y -q $PKGS >/dev/null 2>&1 || \
   (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q $PKGS >/dev/null 2>&1)) || true
fi

# Node-Abhängigkeiten (Canvas-Renderer)
cd "$(dirname "$0")/.." && npm install --silent --no-audit --no-fund >/dev/null 2>&1 || true

echo "setup ok: $(command -v ffmpeg || echo 'ffmpeg via imageio-ffmpeg')"
