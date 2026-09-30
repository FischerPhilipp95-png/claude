#!/usr/bin/env python3
"""Referenzvideo analysieren, damit neue Videos denselben Stil treffen.

Aufruf:
    python3 tools/analyze_ref.py refs/mein-ref/video.mp4
    python3 tools/analyze_ref.py https://x.com/.../status/123 --name mtioon

Ergebnis in refs/<name>/:
    frames/            ein Bild alle 0.5 s (zum genauen Studieren)
    contact_sheet.png  alle Frames auf einem Blatt, mit Zeitstempel
    analysis.json      Dauer, Format, Schnitte, Shot-Längen, Farbpalette, BPM/Beats
    analysis.md        dieselben Daten lesbar zusammengefasst
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FRAME_STEP = 0.5  # Sekunden zwischen zwei Frames
SCENE_THRESHOLD = 0.3  # ffmpeg-Szenenwert, ab dem ein Schnitt zählt


def ffmpeg_exe():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


FFMPEG = ffmpeg_exe()


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def download(url, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    tmpl = str(out_dir / "video.%(ext)s")
    res = run([sys.executable, "-m", "yt_dlp", "-f", "mp4/best", "--ffmpeg-location", FFMPEG,
               "-o", tmpl, url])
    if res.returncode != 0:
        sys.exit("Download fehlgeschlagen. Ist die Domain in den Netzwerk-Einstellungen "
                 "der Umgebung freigegeben?\n" + res.stderr[-800:])
    return next(out_dir.glob("video.*"))


def probe(video):
    info = run([FFMPEG, "-hide_banner", "-i", str(video)]).stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
    size = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", info)
    fps = re.search(r"([\d.]+) fps", info)
    return {
        "duration": int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3]) if dur else None,
        "width": int(size[1]) if size else None,
        "height": int(size[2]) if size else None,
        "fps": float(fps[1]) if fps else None,
        "has_audio": "Audio:" in info,
    }


def extract_frames(video, frames_dir):
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir(parents=True)
    run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(video),
         "-vf", f"fps=1/{FRAME_STEP}", str(frames_dir / "f_%04d.png")])
    return sorted(frames_dir.glob("f_*.png"))


def detect_cuts(video, duration):
    res = run([FFMPEG, "-hide_banner", "-i", str(video), "-vf",
               f"select='gt(scene,{SCENE_THRESHOLD})',showinfo", "-an", "-f", "null", "-"])
    cuts = [round(float(t), 3) for t in re.findall(r"pts_time:([\d.]+)", res.stderr)]
    bounds = [0.0] + cuts + ([duration] if duration else [])
    shots = [round(b - a, 3) for a, b in zip(bounds, bounds[1:]) if b - a > 0.01]
    return cuts, shots


def palette(frames, k=8, iters=15):
    """Dominante Farben über alle Frames per k-means."""
    px = []
    for f in frames:
        im = Image.open(f).convert("RGB").resize((64, 36))
        px.append(np.asarray(im).reshape(-1, 3))
    data = np.concatenate(px).astype(np.float32)
    rng = np.random.default_rng(0)
    centers = data[rng.choice(len(data), k, replace=False)]
    for _ in range(iters):
        labels = np.argmin(((data[:, None] - centers[None]) ** 2).sum(-1), axis=1)
        for i in range(k):
            if np.any(labels == i):
                centers[i] = data[labels == i].mean(0)
    share = np.bincount(labels, minlength=k) / len(labels)
    order = np.argsort(-share)
    return [{"hex": "#%02x%02x%02x" % tuple(int(c) for c in centers[i]),
             "share": round(float(share[i]), 3)} for i in order if share[i] > 0.005]


def contact_sheet(frames, out, cols=6, thumb_w=320):
    first = Image.open(frames[0])
    thumb_h = round(thumb_w * first.height / first.width)
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + 22)), "#111111")
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames):
        x, y = (i % cols) * thumb_w, (i // cols) * (thumb_h + 22)
        sheet.paste(Image.open(f).convert("RGB").resize((thumb_w, thumb_h)), (x, y + 22))
        draw.text((x + 6, y + 5), f"{i * FRAME_STEP:.1f}s", fill="#ffffff")
    sheet.save(out)


def analyze_audio(video, out_dir):
    import librosa
    wav = out_dir / "audio.wav"
    run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
         "-vn", "-ac", "1", "-ar", "22050", str(wav)])
    if not wav.exists():
        return None
    y, sr = librosa.load(wav, sr=None)
    wav.unlink()
    if len(y) == 0 or float(np.abs(y).max()) < 1e-4:
        return None
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beats = librosa.frames_to_time(beat_frames, sr=sr)
    onsets = librosa.onset.onset_detect(y=y, sr=sr, units="time")
    return {
        "bpm": round(float(np.atleast_1d(tempo)[0]), 1),
        "beats": [round(float(t), 3) for t in beats],
        "downbeats": [round(float(t), 3) for t in beats[::4]],
        "hits": [round(float(t), 3) for t in onsets],
    }


def write_md(a, out):
    lines = [f"# Referenz: {a['name']}", "",
             f"- Dauer: {a['duration']:.2f} s" if a["duration"] else "- Dauer: ?",
             f"- Format: {a['width']}x{a['height']} ({a['aspect']}), {a['fps']} fps",
             f"- Schnitte: {len(a['cuts'])}, Shots: {len(a['shots'])}",
             f"- Shot-Längen (s): {', '.join(str(s) for s in a['shots'])}",
             f"- Ø Shot-Länge: {np.mean(a['shots']):.2f} s" if a["shots"] else "",
             "", "## Palette", ""]
    lines += [f"- `{c['hex']}` ({c['share'] * 100:.0f} %)" for c in a["palette"]]
    lines += ["", "## Audio", ""]
    if a["audio"]:
        au = a["audio"]
        lines += [f"- BPM: {au['bpm']}", f"- Beats: {len(au['beats'])}",
                  f"- Downbeats: {', '.join(str(t) for t in au['downbeats'])}"]
    else:
        lines.append("- keine (verwertbare) Tonspur")
    lines += ["", "Frames: `frames/` (alle 0.5 s), Übersicht: `contact_sheet.png`", ""]
    out.write_text("\n".join(lines))


def aspect(w, h):
    if not (w and h):
        return "?"
    r = w / h
    for name, val in (("16:9", 16 / 9), ("9:16", 9 / 16), ("1:1", 1), ("4:5", 4 / 5), ("4:3", 4 / 3)):
        if abs(r - val) < 0.03:
            return name
    return f"{r:.2f}:1"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", help="Videodatei oder URL")
    ap.add_argument("--name", help="Ordnername unter refs/ (Standard: aus Dateiname/Ordner)")
    args = ap.parse_args()

    if re.match(r"https?://", args.source):
        name = args.name or "ref"
        out_dir = ROOT / "refs" / name
        video = download(args.source, out_dir)
    else:
        video = Path(args.source).resolve()
        if not video.exists():
            sys.exit(f"Datei nicht gefunden: {video}")
        in_refs = video.parent.parent == ROOT / "refs"
        name = args.name or (video.parent.name if in_refs else video.stem)
        out_dir = ROOT / "refs" / name
        out_dir.mkdir(parents=True, exist_ok=True)

    info = probe(video)
    print(f"Analysiere {video.name}: {info}")
    frames = extract_frames(video, out_dir / "frames")
    if not frames:
        sys.exit("Keine Frames extrahiert. Ist die Datei ein gültiges Video?")
    cuts, shots = detect_cuts(video, info["duration"])
    result = {
        "name": name,
        "source": args.source,
        **info,
        "aspect": aspect(info["width"], info["height"]),
        "frame_step": FRAME_STEP,
        "frames": len(frames),
        "cuts": cuts,
        "shots": shots,
        "palette": palette(frames),
        "audio": analyze_audio(video, out_dir) if info["has_audio"] else None,
    }
    contact_sheet(frames, out_dir / "contact_sheet.png")
    (out_dir / "analysis.json").write_text(json.dumps(result, indent=2))
    write_md(result, out_dir / "analysis.md")
    print(f"Fertig: {out_dir.relative_to(ROOT)}/ ({len(frames)} Frames, {len(cuts)} Schnitte)")


if __name__ == "__main__":
    main()
