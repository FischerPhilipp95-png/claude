#!/usr/bin/env bash
# Installiert alle Werkzeuge für die Video-Pipeline.
# Läuft automatisch beim Start jeder Claude-Code-Sitzung (siehe .claude/settings.json).
set -euo pipefail

pip install -q --disable-pip-version-check \
  numpy scipy librosa soundfile pillow imageio-ffmpeg yt-dlp piper-tts 2>&1 | grep -v "Running pip as the 'root' user" || true

# ffmpeg aus imageio-ffmpeg global verfügbar machen, falls kein System-ffmpeg existiert
if ! command -v ffmpeg >/dev/null 2>&1; then
  FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
  ln -sf "$FF" /usr/local/bin/ffmpeg 2>/dev/null || true
fi

# Node-Abhängigkeiten (Canvas-Renderer)
cd "$(dirname "$0")/.." && npm install --silent --no-audit --no-fund >/dev/null 2>&1 || true

echo "setup ok: $(command -v ffmpeg || echo 'ffmpeg via imageio-ffmpeg')"
