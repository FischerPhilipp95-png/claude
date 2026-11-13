#!/usr/bin/env python3
"""Archiv-Short „So entstand 1922 ein Sessel“ bauen. Aufruf aus dem Repo-Root:

    python3 projects/pander-moebel/build.py            ganzes Video nach out/final.mp4
    python3 projects/pander-moebel/build.py --contact   nur Contact Sheet (ein Frame je Einstellung)

Stil: style_guide.md, Ablauf: shotlist.md. Quelle: quelle/QUELLE.md (gemeinfreier Film von 1922).
Die Einstellungen sind so lang wie der jeweilige Sprechersatz, Schnitte fallen auf den Satzanfang.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

P = Path(__file__).resolve().parent
ROOT = P.parent.parent
SRC = P / "quelle/acte1.webm"
W, H, FPS = 1080, 1920, 60
VY, VW, VH = 230, 1080, 1350            # Filmfenster 4:5
CROP_W, CROP_H, PILLAR = 461, 576, 128  # Ausschnitt aus dem 4:3-Bild der Quelle
GAP = 0.28                              # Luft nach jedem Satz
YELLOW, BG = "#ffd400", "#0d0d0d"
ANTON = str(ROOT / "assets/fonts/Anton-400.ttf")
INTER = str(ROOT / "assets/fonts/Inter-500.ttf")
STEPS = 7

# vo-id, Start im Quellfilm (s), x-Versatz des Ausschnitts, Schritt, Label, zusätzliche Dauer
SHOTS = [
    ("vo1", 451.3, 150, 0, "OHNE HANDSCHUHE|OHNE SCHUTZ", -2.3),   # Bandsäge, Hand am Blatt
    (None, 3.0, 250, 0, "SO ENTSTAND|EIN SESSEL", 2.3),             # Sprungfedern (zweite Hälfte von vo1)
    ("vo2", 71.6, 190, 1, "EICHE FÄLLEN", 0),
    ("vo3", 58.0, 150, 2, "STAPELN", 0),
    ("vo4", 98.6, 130, 3, "INS WERK", 0),
    ("vo5", 454.3, 250, 4, "ZUSÄGEN", 0),
    ("vo6", 462.3, 160, 5, "VERLEIMEN", 0),
    ("vo7", 8.0, 200, 6, "FEDERN SETZEN", 0),
    ("vo8", 263.5, 0, 7, "POLSTERN", 0),
    ("vo9", 250.0, 150, 8, "HÄTTEST DU DAS|DURCHGEHALTEN?", 0.9),
]


def timeline():
    d = json.loads((P / "audio/vo/durations.json").read_text())
    t, shots, vo = 0.0, [], []
    for vid, ss, x, step, label, extra in SHOTS:
        dur = (d[vid] + GAP if vid else 0) + extra
        dur = round(dur * FPS) / FPS
        if vid:
            vo.append({"id": vid, "t": round(t + 0.05, 3)})
        shots.append(dict(t=round(t, 4), dur=dur, ss=ss, x=x, step=step, label=label))
        t += dur
    tl = {"duration": round(t, 3), "vo": vo, "shots": shots}
    (P / "timeline.json").write_text(json.dumps(tl, indent=1, ensure_ascii=False))
    return tl


def font(path, size):
    return ImageFont.truetype(path, size)


def overlay(shot, path):
    """Alles, was über dem Film liegt: Kopfzeile, Fortschritt, Label."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    # Kopf: gelbe Jahresmarke + Thema
    f = font(ANTON, 84)
    dr.rectangle([48, 96, 48 + dr.textlength("1922", font=f) + 44, 204], fill=YELLOW)
    dr.text((70, 100), "1922", font=f, fill="#111111")
    dr.text((48 + dr.textlength("1922", font=f) + 72, 100), "SO BAUTE MAN MÖBEL", font=f, fill="white")
    # Fortschritt: sieben Segmente am oberen Bildrand
    seg, gap = (W - 96 - 6 * 12) / STEPS, 12
    for i in range(STEPS):
        x0 = 48 + i * (seg + gap)
        on = 0 < shot["step"] and i < min(shot["step"], STEPS)
        dr.rounded_rectangle([x0, VY + 28, x0 + seg, VY + 40], 6, fill=YELLOW if on else (255, 255, 255, 110))
    # Verlauf unten im Bild, damit die Schrift trägt
    grad = Image.new("L", (1, 520))
    grad.putdata([int(215 * (i / 519) ** 1.5) for i in range(520)])
    shade = Image.new("RGBA", (W, 520), (0, 0, 0, 255))
    shade.putalpha(grad.resize((W, 520)))
    im.alpha_composite(shade, (0, VY + VH - 520))
    dr = ImageDraw.Draw(im)
    # Label: Nummer gelb + Text, alles über y = 1440
    lines = shot["label"].split("|")
    if 1 <= shot["step"] <= STEPS:
        f = font(ANTON, 150)
        num = str(shot["step"])
        y = 1262
        dr.text((60, y), num, font=f, fill=YELLOW, stroke_width=6, stroke_fill="#000000")
        dr.text((60 + dr.textlength(num, font=f) + 34, y), lines[0], font=f, fill="white",
                stroke_width=6, stroke_fill="#000000")
    else:
        f = font(ANTON, 136)
        y = 1420 - 150 * len(lines)
        for i, line in enumerate(lines):
            dr.text((60, y + 150 * i), line, font=f, fill=YELLOW if i == len(lines) - 1 else "white",
                    stroke_width=6, stroke_fill="#000000")
    # Quelle klein unter dem Bild
    dr.text((48, VY + VH + 22), "Film: W. Mullens / Haghefilm, 1922 · gemeinfrei (Beeld en Geluid)",
            font=font(INTER, 26), fill=(255, 255, 255, 150))
    im.save(path)


def render_shot(i, shot, tmp, still=False):
    ov = tmp / f"ov_{i:02d}.png"
    overlay(shot, ov)
    out = tmp / (f"still_{i:02d}.png" if still else f"shot_{i:02d}.mp4")
    n = round(shot["dur"] * FPS)
    look = ("hue=s=0,eq=contrast=1.12:brightness=0.02:gamma=1.05,"
            "colorchannelmixer=rr=1.04:bb=0.93,unsharp=5:5:0.6")
    zoom = (f"scale={VW * 2}:{VH * 2}:flags=lanczos,"
            f"zoompan=z='1+0.07*on/{n}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={VW}x{VH}:fps={FPS}")
    fc = (f"[0:v]crop={CROP_W}:{CROP_H}:{PILLAR + shot['x']}:0,fps={FPS},{zoom},{look}[v];"
          f"color={BG}:s={W}x{H}:r={FPS}[bg];[bg][v]overlay=0:{VY}:shortest=1[a];"
          # Label schiebt in 8 Frames von unten ein
          f"[a][1:v]overlay=x=0:y='40*pow(1-min(t/0.13,1),3)':format=auto,format=yuv420p[o]")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
           "-ss", str(shot["ss"] + (shot["dur"] / 2 if still else 0)), "-t", str(shot["dur"]), "-i", str(SRC),
           "-loop", "1", "-i", str(ov), "-filter_complex", fc, "-map", "[o]"]
    cmd += ["-frames:v", "1", str(out)] if still else [
        "-frames:v", str(n), "-r", str(FPS), "-c:v", "libx264", "-preset", "slow", "-crf", "16",
        "-pix_fmt", "yuv420p", str(out)]
    subprocess.run(cmd, check=True)
    return out


# ---------- Ton: eigene Musik (ruhig, 90 BPM) und ein Holzschlag auf jedem Schnitt ----------
SR = 44100


def tone(freq, dur, decay, harm=(1, 0.4, 0.15)):
    t = np.arange(int(SR * dur)) / SR
    y = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harm))
    return y * np.exp(-t * decay) * np.minimum(t / 0.004, 1)


def audio(tl):
    n = int(tl["duration"] * SR) + SR
    music, sfx = np.zeros((n, 2)), np.zeros((n, 2))

    def place(buf, y, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= n:
            return
        y = y[: n - i] * gain
        buf[i:i + len(y), 0] += y * (1 - max(pan, 0))
        buf[i:i + len(y), 1] += y * (1 + min(pan, 0))

    midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
    beat = 60 / 90
    chords = [(45, 57, 60, 64), (41, 57, 60, 65), (48, 55, 60, 64), (43, 55, 59, 62)]  # Am F C G
    t, bar = 0.0, 0
    while t < tl["duration"]:
        bass, *up = chords[bar % 4]
        place(music, tone(midi(bass), 2.4, 1.4, (1, 0.3, 0.1)), t, 0.30)
        for k, m in enumerate([up[0], up[1], up[2], up[1], up[0], up[1], up[2] + 12, up[1]]):
            place(music, tone(midi(m), 1.2, 4.5), t + k * beat / 2, 0.16, pan=0.35 if k % 2 else -0.35)
        t += 4 * beat
        bar += 1
    fade = np.clip((tl["duration"] - np.arange(n) / SR) / 1.2, 0, 1)
    music *= fade[:, None]
    rng = np.random.default_rng(3)
    for s in tl["shots"][1:]:
        knock = tone(190, 0.18, 38, (1, 0.5, 0.3)) + rng.normal(0, 0.25, int(SR * 0.18)) * np.exp(
            -np.arange(int(SR * 0.18)) / SR * 90)
        place(sfx, knock, max(0, s["t"] - 0.01), 0.8)
    for name, buf in (("music", music), ("sfx", sfx)):
        sf.write(P / f"audio/{name}.wav", (buf / max(1e-9, np.abs(buf).max()) * 0.8)[: int(tl["duration"] * SR)], SR)


def main():
    if not SRC.exists():  # aus den hochgeladenen 20-MB-Teilen zusammensetzen
        with open(SRC, "wb") as f:
            for part in sorted((P / "quelle").glob("pander_teil_*")):
                f.write(part.read_bytes())
    tl = timeline()
    tmp = P / "out/tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    if "--contact" in sys.argv:
        stills = [render_shot(i, s, tmp, still=True) for i, s in enumerate(tl["shots"])]
        sheet = Image.new("RGB", (5 * 432, 2 * 768), "black")
        for i, st in enumerate(stills):
            sheet.paste(Image.open(st).resize((432, 768)), ((i % 5) * 432, (i // 5) * 768))
        sheet.save(P / "out/contact_sheet.png")
        return
    clips = [render_shot(i, s, tmp) for i, s in enumerate(tl["shots"])]
    (tmp / "list.txt").write_text("".join(f"file '{c.name}'\n" for c in clips))
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", str(tmp / "list.txt"), "-c", "copy", str(P / "out/video.mp4")], check=True)
    audio(tl)
    subprocess.run([sys.executable, str(ROOT / "tools/mix.py"), str(P)], check=True)


if __name__ == "__main__":
    main()
