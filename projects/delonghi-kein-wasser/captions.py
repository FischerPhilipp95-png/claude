#!/usr/bin/env python3
"""Wort-Timing für die mitlaufenden Untertitel.

Whisper (faster-whisper, Modell „small“) hört jede Sprecher-Datei ab und liefert Zeitstempel pro Wort.
Angezeigt wird aber der Text aus vo_script.json (Whisper verhört sich manchmal); die Zeitstempel werden
per Abgleich (difflib) auf die Skript-Wörter übertragen, Lücken werden interpoliert.
Zahlwörter werden für die Anzeige zu Ziffern („fünfundfünfzig“ → „55“).
Schreibt captions.json: [{id, words: [{w, s, e}]}] mit Zeiten relativ zum Satzanfang.
"""
import difflib
import json
import re
from pathlib import Path

from faster_whisper import WhisperModel

DIR = Path(__file__).parent
import sys
# optional: python3 captions.py <skript.json> <wav-ordner> <ausgabe.json>  (z. B. für Shorts)
ARG = sys.argv[1:4] if len(sys.argv) >= 4 else ["vo_script.json", "audio/vo", "captions.json"]
SCRIPT = json.loads((DIR / ARG[0]).read_text())
SHOW = {
    "eins": "1", "zwei": "2", "drei": "3", "vier": "4", "fünf": "5", "sechs": "6",
    "fünfundfünfzig": "55", "vierzig": "40", "fünfundvierzig": "45", "sechzig": "60", "hundert": "100",
    "zweihundertfünfzig": "250", "zehntausend": "10.000", "fünfzehnhundert": "1.500", "dreitausendfünfhundert": "3.500",
    "hundertdreißig": "130", "achtzig": "80", "dreißig": "30", "fünfzig": "50",
    "zweitausendzwanzig": "2020", "zweitausendsechsundzwanzig": "2026", "dezibel": "dB", "null": "0", "zehn": "10", "sieben": "7", "sechs": "6", "fünfundvierzig": "45",
}


def norm(w):
    return re.sub(r"[^a-zäöüß0-9]", "", w.lower()).replace("ß", "ss")   # Whisper schreibt oft „heisst“


def show(w):
    core = re.sub(r"[^a-zäöüß0-9]", "", w.lower())
    if core in SHOW:
        lead = re.match(r"^\W*", w).group(0); trail = re.search(r"\W*$", w).group(0)
        return lead + SHOW[core] + trail
    return w


model = WhisperModel("small", device="cpu", compute_type="int8")
out = []
for line in SCRIPT:
    words = line["text"].split()
    # Mit dem Skript als Vorgabe erkennt Whisper meist besser, hängt sich aber manchmal auf und liefert nur
    # den Satzschluss. Darum beide Varianten hören und die nehmen, die mehr Skript-Wörter trifft.
    best = None
    for prompt in (line["text"], None):
        segs, _ = model.transcribe(str(DIR / ARG[1] / f"{line['id']}.wav"), language="de", word_timestamps=True,
                                   initial_prompt=prompt)
        h = [w for s in segs for w in s.words]
        m = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[norm(w.word) for w in h], autojunk=False)
        hits = sum(n for _, _, n in m.get_matching_blocks())
        if best is None or hits > best[0]:
            best = (hits, h, m)
        if hits >= 0.9 * len(words):
            break
    _, heard, sm = best
    times = [None] * len(words)
    for a, b, n in sm.get_matching_blocks():
        for i in range(n):
            times[a + i] = (heard[b + i].start, heard[b + i].end)
    # nicht erkannte Wörter: zwischen den Nachbarn nach Buchstabenzahl verteilen
    end_all = heard[-1].end if heard else 0.3 * len(words)
    i = 0
    while i < len(words):
        if times[i] is not None:
            i += 1; continue
        j = i
        while j < len(words) and times[j] is None: j += 1
        t0 = times[i - 1][1] if i > 0 else 0.0
        t1 = times[j][0] if j < len(words) else end_all
        lens = [max(2, len(norm(w))) for w in words[i:j]]; tot = sum(lens); acc = t0
        for k in range(i, j):
            d = (t1 - t0) * lens[k - i] / tot; times[k] = (acc, acc + d); acc += d
        i = j
    # Wörter ohne Dauer (Whisper setzt sie manchmal auf 0) mit dem folgenden Wort zusammen neu verteilen
    i = 0
    while i < len(words):
        if times[i][1] - times[i][0] >= 0.06:
            i += 1; continue
        j = i
        while j < len(words) - 1 and times[j][1] - times[j][0] < 0.06: j += 1
        t0 = times[i - 1][1] if i > 0 else min(times[i][0], times[j][0]); t1 = max(times[j][1], t0 + 0.12 * (j - i + 1))
        lens = [max(2, len(norm(w))) for w in words[i:j + 1]]; tot = sum(lens); acc = t0
        for k in range(i, j + 1):
            d = (t1 - t0) * lens[k - i] / tot; times[k] = (acc, acc + d); acc += d
        i = j + 1
    ws = [{"w": show(w), "s": round(s, 3), "e": round(e, 3)} for w, (s, e) in zip(words, times)]
    # „1 Komma 2“ als eine Zahl „1,2“ anzeigen, „ein bar“ als „1 bar“
    i = 0
    while i < len(ws):
        if i + 2 < len(ws) and ws[i + 1]["w"].lower() == "komma" and ws[i]["w"].isdigit() and ws[i + 2]["w"].rstrip(".,").isdigit():
            ws[i] = {"w": ws[i]["w"] + "," + ws[i + 2]["w"], "s": ws[i]["s"], "e": ws[i + 2]["e"]}; del ws[i + 1:i + 3]
        if ws[i]["w"].lower() == "ein" and i + 1 < len(ws) and ws[i + 1]["w"].lower().startswith("bar"):
            ws[i]["w"] = "1"
        i += 1
    out.append({"id": line["id"], "words": ws})
    matched = sum(n for _, _, n in sm.get_matching_blocks())
    print(f"{line['id']}: {matched}/{len(words)} Wörter erkannt")
(DIR / ARG[2]).write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(DIR / ARG[2])
