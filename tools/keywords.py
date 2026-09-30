#!/usr/bin/env python3
"""Long-Tail-Suchanfragen aus der Google-Autovervollständigung sammeln (nur Standardbibliothek).

    python3 tools/keywords.py "heizung entlüften" "kaffeevollautomat entkalken" > blog/seo/keywords.md

Pro Suchbegriff werden der Begriff selbst, Fragewörter („wie“, „warum“ …) und a–z abgefragt.
Das zeigt, was Leute wirklich eintippen. Suchvolumen liefert Google hier nicht, das kommt aus
der Search Console bzw. den Bing Webmaster Tools. Zwischen den Abfragen wird kurz gewartet.
"""
import json
import string
import sys
import time
import urllib.parse
import urllib.request

URL = "https://suggestqueries.google.com/complete/search?client=firefox&hl=de&gl=de&q="
QUESTIONS = ["wie", "warum", "was", "wann", "wo", "wie oft", "wie lange", "kosten", "ohne", "mit", "geht nicht"]
QUESTION_WORDS = {"wie", "warum", "was", "wann", "wo", "welche", "welcher", "welches"}
PAUSE = 0.4


def suggest(query):
    with urllib.request.urlopen(URL + urllib.parse.quote(query), timeout=10) as r:
        return json.loads(r.read().decode("utf-8", "replace"))[1]


def collect(seed):
    found = []
    for suffix in [""] + QUESTIONS + list(string.ascii_lowercase):
        q = f"{seed} {suffix}".strip()
        try:
            found += suggest(q)
        except Exception as e:  # einzelne Aussetzer nicht den ganzen Lauf abbrechen lassen
            print(f"<!-- {q}: {e} -->", file=sys.stderr)
        time.sleep(PAUSE)
    seen, out = set(), []
    for s in found:
        if s not in seen and s != seed:
            seen.add(s)
            out.append(s)
    return out


def main():
    seeds = sys.argv[1:]
    if not seeds:
        sys.exit(__doc__)
    print("# Suchanfragen aus der Google-Autovervollständigung\n")
    print(f"Abgerufen am {time.strftime('%d.%m.%Y')}. Fragen (wie/warum/was …) zuerst: das sind die besten Artikel-Ideen.\n")
    for seed in seeds:
        hits = collect(seed)
        n = len(seed.split())
        questions = [h for h in hits if set(h.split()[n:n + 1]) & QUESTION_WORDS]
        rest = [h for h in hits if h not in questions]
        print(f"## {seed} ({len(hits)})\n")
        for h in questions + rest:
            print(f"- {h}")
        print()


if __name__ == "__main__":
    main()
