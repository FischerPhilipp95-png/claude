#!/usr/bin/env python3
"""Grobe Timeline aus Voiceover-Längen: jeder Satz und jedes Kapitel auf dem 123-BPM-Raster.

Schreibt sections.json, das music.py (Breaks, Länge) und render.mjs (Szenen, VO-Zeiten) lesen.
Kapitelanfänge liegen auf Downbeats, Sätze auf Beats.
"""
import json
import math
from pathlib import Path

DIR = Path(__file__).parent
BPM = 123
BEAT = 60 / BPM
BAR = 4 * BEAT
GAP = 0.45          # Pause nach jedem Satz
TITLE_LEAD = 0.35   # erster Satz startet kurz nach dem Kapitelanfang
CHAPTER_TAIL = 0.9  # Luft am Kapitelende für den Ausgang
INTRO = 2 * BAR     # Close-up + Zoom vor dem ersten Satz
END_CARD = 4.0

dur = json.loads((DIR / "audio/vo/durations.json").read_text())
chapters = json.loads((DIR / "chapters.json").read_text())


def next_beat(t):
    return math.ceil(t / BEAT - 1e-6) * BEAT


def next_bar(t):
    return math.ceil(t / BAR - 1e-6) * BAR


t = 0.0
out = []
for ch in chapters:
    start = INTRO if ch["ch"] == 0 else next_bar(t)
    lines = []
    cur = start + (TITLE_LEAD if ch["title"] else 0.0)
    for lid in ch["lines"]:
        cur = next_beat(cur)
        lines.append({"id": lid, "t": round(cur, 3), "dur": dur[lid]})
        cur += dur[lid] + GAP
    end = cur - GAP + CHAPTER_TAIL
    out.append({"ch": ch["ch"], "title": ch["title"], "start": round(0.0 if ch["ch"] == 0 else start, 3),
                "end": round(end, 3), "lines": lines})
    t = end

end_card = next_bar(t)
total = end_card + END_CARD
data = {"bpm": BPM, "beat": BEAT, "bar": BAR, "total": round(total, 3), "end_card": round(end_card, 3), "chapters": out}
(DIR / "sections.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
m, s = divmod(total, 60)
print(f"sections.json: {len(out)} Kapitel, Länge {int(m)}:{s:04.1f}")
for c in out:
    mm, ss = divmod(c["start"], 60)
    print(f"  {int(mm)}:{int(ss):02d}  {c['title'] or ('Intro' if c['ch'] == 0 else 'Outro')}")
