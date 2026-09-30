#!/usr/bin/env python3
"""Voiceover aus einer script.json erzeugen, ein WAV pro Satz.

    python3 tools/tts.py projects/klima-short/vo_script.json projects/klima-short/audio/vo --engine fish

--engine fish: Fish Audio (Stimme per --voice, Standard „Klarer Sprecher“). Den Key hängt entweder
  der Proxy der Cloud-Umgebung an (API-Zugangsdaten für api.fish.audio) oder er kommt aus FISH_API_KEY.
--engine piper: lokale Piper-Stimme (de_DE-thorsten-high) als kostenloser Platzhalter.
Standard: piper. Fish nur mit --engine fish oder gesetztem FISH_API_KEY.
Schreibt zusätzlich <out>/durations.json mit der Länge jedes Satzes.
"""
import argparse
import json
import os
import subprocess
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FISH_VOICE = "d9a53f379363469091d42e0fedaa9307"  # „Klarer Sprecher“ (de)
PIPER_MODEL = ROOT / "tools/voices/de_DE-thorsten-high.onnx"
PIPER_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/high/"


def fish(text, out, key, voice):
    headers = {"Content-Type": "application/json", "model": "s1"}
    if key:  # sonst setzt der Proxy der Umgebung den Authorization-Header
        headers["Authorization"] = f"Bearer {key}"
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts",
        data=json.dumps({"text": text, "reference_id": voice, "format": "wav",
                         "sample_rate": 44100, "normalize": True, "latency": "normal"}).encode(),
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        out.write_bytes(r.read())


def piper(text, out, voice_obj, length_scale=0.88):
    from piper.config import SynthesisConfig
    with wave.open(str(out), "wb") as w:
        voice_obj.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length_scale))


def load_piper():
    PIPER_MODEL.parent.mkdir(parents=True, exist_ok=True)
    for name in (PIPER_MODEL.name, PIPER_MODEL.name + ".json"):
        if not (PIPER_MODEL.parent / name).exists():
            urllib.request.urlretrieve(PIPER_URL + name, PIPER_MODEL.parent / name)
    from piper import PiperVoice
    return PiperVoice.load(str(PIPER_MODEL))


def trimmed_duration(path):
    """Dauer ohne Stille am Anfang/Ende. Die Stille wird dabei auch aus der Datei geschnitten."""
    tmp = path.with_suffix(".trim.wav")
    af = ("silenceremove=start_periods=1:start_threshold=-45dB,"
          "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
                    "-af", af, "-ar", "44100", "-ac", "1", str(tmp)], check=True)
    tmp.replace(path)
    with wave.open(str(path)) as w:
        return round(w.getnframes() / w.getframerate(), 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out_dir")
    ap.add_argument("--voice", default=FISH_VOICE, help="Fish-Audio-Stimmen-ID")
    ap.add_argument("--length-scale", type=float, default=0.88, help="Piper: >1 langsamer, <1 schneller")
    ap.add_argument("--engine", choices=["fish", "piper"], help="Standard: fish mit FISH_API_KEY, sonst piper")
    args = ap.parse_args()

    lines = json.loads(Path(args.script).read_text())
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    key = os.environ.get("FISH_API_KEY")
    engine = args.engine or ("fish" if key else "piper")
    voice_obj = load_piper() if engine == "piper" else None

    durations = {}
    for line in lines:
        out = out_dir / f"{line['id']}.wav"
        if engine == "fish":
            fish(line["text"], out, key, args.voice)
        else:
            piper(line["text"], out, voice_obj, args.length_scale)
        durations[line["id"]] = trimmed_duration(out)
        print(f"{line['id']}: {durations[line['id']]:.2f}s  {line['text']}")
    (out_dir / "durations.json").write_text(json.dumps({"engine": engine, **durations}, indent=2))


if __name__ == "__main__":
    main()
