#!/usr/bin/env python3
"""Virale Video-Ideen finden: Videos, die ihren eigenen Kanal weit übertreffen.

Ein "Outlier" hat viel mehr Aufrufe als der Median seines Kanals (Shorts werden
mit Shorts verglichen, lange Videos mit langen). Dann hat das Thema oder der
Titel gezogen, nicht die Kanalgröße. Genau solche Themen lohnen sich.

Aufruf:
    python3 tools/find_outliers.py                       # alles aus ideen/*.txt
    python3 tools/find_outliers.py --keyword "Fliesen bohren" --zeitraum alle
    python3 tools/find_outliers.py --min-views 3000 --min-faktor 2

Quellen:
    ideen/keywords.txt   Suchbegriffe (YouTube-Suche, Standard: Uploads dieses Jahres)
    ideen/channels.txt   Konkurrenzkanäle, deren letzte Uploads komplett geprüft werden
    ideen/hashtags.txt   Hashtags ohne #; deren Shorts-Seiten liefern themennahe Shorts
    ideen/blocklist.txt  Kanäle, die ignoriert werden (Name oder UC-ID), z. B. Nachrichtensender
    --own                dein Kanal (Standard: Der Handwerksdoktor)

Ergebnis in ideen/reports/:
    <datum>.html   Bericht mit Vorschaubildern (zum Durchschauen)
    <datum>.md     dieselben Listen als Tabellen
    <datum>.csv    alle bewerteten Videos (für Excel/Sheets)

Braucht nur yt-dlp (kein API-Schlüssel). youtube.com muss in den
Netzwerk-Einstellungen freigegeben sein. Kanaldaten werden 20 h in
ideen/.cache/ zwischengespeichert.
"""
import argparse
import csv
import html
import json
import re
import statistics
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDEEN = ROOT / "ideen"
CACHE = IDEEN / ".cache"
OWN_CHANNEL = "UClteHHjbqHnhSvgMCYEgH9A"  # Der Handwerksdoktor

CHANNEL_TAB_LIMIT = 60  # so viele neueste Uploads pro Kanal und Format
MEDIAN_MIN_N = 5  # darunter ist ein Kanal-Median nicht aussagekräftig
FRESH_DAYS = 3  # jüngere Videos zählen nicht zum Median (Aufrufe laufen noch)
CACHE_HOURS = 20
SHORT_MAX_SECONDS = 60  # Fallback, falls ein Video in keinem Kanal-Tab auftaucht
AD_MAX_MEDIAN = 100  # Kanal-Median darunter und Faktor darüber: oft bezahlte Werbung
AD_MIN_FAKTOR = 100
AD_TITLE = re.compile(r"anzeige|werbung|#ad\b|mehr infos unter|gesponsert|sponsored", re.I)
AD_CHANNEL = re.compile(r"\b(gmbh|ag|kg|se|ltd|inc)\b|deutschland$", re.I)
CHANNEL_SHORTS_MIN_KEYWORDS = 2  # Kanal-Shorts nur von Kanälen, die zu mehreren Suchbegriffen passen
HASHTAG_LIMIT = 60  # Shorts pro Hashtag-Seite
# Zu allgemein, um ein Short als themennah zu erkennen
GENERIC_WORDS = set("test tipps tipp fehler sparen hält nicht ohne richtig reinigen beste neue".split())

# YouTube-Suchfilter "Uploaddatum"
ZEITRAUM_SP = {"woche": "EgIIAw==", "monat": "EgIIBA==", "jahr": "EgIIBQ==", "alle": None}

TITLE_PATTERNS = [
    ("Frage im Titel (?)", r"\?"),
    ("Zahl/Liste („5 Tipps“)", r"(^|\s)\d+\s+(tipps|fehler|tricks|gründe|dinge|ursachen|zeichen|regeln"
                               r"|lösungen|hacks|checks|schritte|werkzeuge|mythen|geräte|modelle)"),
    ("Fehler/Warnung", r"fehler|niemals|\bnie\b|vorsicht|achtung|falsch|stopp|gefährlich"),
    ("Warum/Wie am Anfang", r"^\W*(warum|wieso|weshalb|wie)\b"),
    ("Vergleich/Test", r"\bvs\.?\b|vergleich|\btest|gegen\b"),
    ("Jahreszahl", r"\b20\d\d\b"),
    ("GROSSBUCHSTABEN-Wort", None),  # eigene Prüfung, siehe pattern_hits()
    ("Trick/Hack/genial", r"trick|hack|genial|geheim"),
    ("Geld/Sparen/Lohnt", r"spar|kosten|€|euro|günstig|billig|teuer|lohnt"),
    ("Ehrlich/Wahrheit/Verschweigt", r"ehrlich|wahrheit|verschweig|keiner sagt|niemand sagt|was einem"),
    ("Emoji", r"[\U0001F300-\U0001FAFF☀-➿]"),
]

STOPWORDS = set("""
aber alle alles als also auch auf aus bei beim bis das dass dein deine deinem deinen deiner dem den
der des die dies diese diesem diesen dieser doch durch ein eine einem einen einer eines erst für
gibt hat hier ich ihr ihre ist jetzt kann kein keine mal man mehr mein meine mit nach nicht noch nur
oder ohne sehr sich sie sind so und uns unter vom von vor was weil wenn wer wie wieder wird wir mit
zum zur zu über shorts short with your this that from what have will video videos teil
""".split())


# --------------------------------------------------------------------------- Abruf

def ytdlp_json(url, end=None, extra=(), partial=False):
    cmd = ["yt-dlp", "--flat-playlist", "-J", "--no-warnings", *extra]
    if end:
        cmd += ["--playlist-end", str(end)]
    cmd.append(url)
    for attempt in range(3):
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=240)
        if r.stdout.strip() and (r.returncode == 0 or partial):
            return json.loads(r.stdout)
        err = (r.stderr.strip().splitlines() or ["unbekannter Fehler"])[-1]
        if "does not have a" in err:  # z. B. Kanal ohne Shorts-Tab
            return {"entries": []}
        if "403" in err or "Forbidden" in err:
            sys.exit(f"403 beim Abruf von {url}: youtube.com ist in den Netzwerk-Einstellungen nicht freigegeben.")
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"{url}: {err}")


def channel_base(ref):
    """UC-ID, @handle oder Kanal-URL -> Basis-URL ohne Tab."""
    ref = ref.strip()
    if re.fullmatch(r"UC[\w-]{22}", ref):
        return f"https://www.youtube.com/channel/{ref}"
    if ref.startswith("@"):
        return f"https://www.youtube.com/{ref}"
    ref = re.sub(r"/(videos|shorts|streams|featured|about|playlists)/?$", "", ref.rstrip("/"))
    return ref


def fetch_channel(ref, use_cache=True):
    base = channel_base(ref)
    key = re.sub(r"[^\w@-]+", "_", base.split("youtube.com/")[-1])
    path = CACHE / f"{key}.json"
    if use_cache and path.exists() and time.time() - path.stat().st_mtime < CACHE_HOURS * 3600:
        return json.loads(path.read_text())

    # Ohne Sprachwahl liefert yt-dlp ungefähre Upload-Daten, mit lang=de die
    # Originaltitel statt der automatischen Übersetzung. Darum zwei Abrufe.
    dated = ytdlp_json(base + "/videos", CHANNEL_TAB_LIMIT, ["--extractor-args", "youtubetab:approximate_date"])
    titled = ytdlp_json(base + "/videos", CHANNEL_TAB_LIMIT, ["--extractor-args", "youtube:lang=de"])
    shorts = ytdlp_json(base + "/shorts", CHANNEL_TAB_LIMIT, ["--extractor-args", "youtube:lang=de"])

    titles = {e["id"]: e.get("title") for e in titled.get("entries", []) if e.get("id")}
    head = titled if titled.get("channel_id") else dated
    data = {
        "base": base,
        "id": head.get("channel_id") or shorts.get("channel_id"),
        "name": head.get("channel") or shorts.get("channel") or base,
        "subs": next((d.get("channel_follower_count") for d in (titled, dated, shorts)
                      if d.get("channel_follower_count")), None),
        "long": [{"id": e["id"], "title": titles.get(e["id"]) or e.get("title"),
                  "views": e.get("view_count"), "ts": e.get("timestamp"), "dur": e.get("duration")}
                 for e in dated.get("entries", []) if e.get("id")],
        "short": [{"id": e["id"], "title": e.get("title"), "views": e.get("view_count"), "ts": None, "dur": None}
                  for e in shorts.get("entries", []) if e.get("id")],
    }
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False))
    return data


def search(keyword, n, zeitraum):
    sp = ZEITRAUM_SP[zeitraum]
    if sp:
        url = ("https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(keyword)
               + "&sp=" + urllib.parse.quote(sp))
        d = ytdlp_json(url, n, ["--extractor-args", "youtube:lang=de"])
    else:
        d = ytdlp_json(f"ytsearch{n}:{keyword}", None, ["--extractor-args", "youtube:lang=de"])
    return [e for e in d.get("entries", []) if e.get("id") and e.get("channel_id")]


def hashtag_shorts(tag, n):
    try:
        d = ytdlp_json(f"https://www.youtube.com/hashtag/{urllib.parse.quote(tag.lstrip('#').lower())}/shorts", n, ["-i"], partial=True)
    except Exception as ex:  # Hashtag-Seiten antworten gelegentlich mit 500
        print(f"\n  Hashtag übersprungen (#{tag}): {ex}", file=sys.stderr)
        return []
    return [{"id": e["id"], "views": e.get("view_count")} for e in d.get("entries", []) if e and e.get("id")]


def oembed(vid):
    """Titel und Kanal eines Videos. Die Videoseite selbst blockt YouTube aus Rechenzentren, oEmbed nicht."""
    url = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/shorts/{vid}")
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            d = json.load(r)
    except Exception:
        return None
    return {"title": d.get("title") or "", "author_url": d.get("author_url"), "channel": d.get("author_name")}


def topic_words(keywords, hashtags):
    words = set()
    for text in list(keywords) + list(hashtags):
        words |= {w for w in re.findall(r"[a-zäöüß]+", text.lower()) if len(w) >= 4 and w not in GENERIC_WORDS}
    return words


def on_topic(title, words):
    t = (title or "").lower()
    return any(w in t for w in words)


def fetch_many(refs, workers, use_cache):
    out, failed = {}, []
    with ThreadPoolExecutor(workers) as pool:
        jobs = {pool.submit(fetch_channel, r, use_cache): r for r in refs}
        for i, job in enumerate(as_completed(jobs), 1):
            ref = jobs[job]
            try:
                out[ref] = job.result()
            except Exception as e:  # ein kaputter Kanal soll den Lauf nicht abbrechen
                failed.append(f"{ref}: {e}")
            print(f"\r  Kanäle: {i}/{len(refs)}", end="", file=sys.stderr, flush=True)
    print(file=sys.stderr)
    for f in failed:
        print(f"  übersprungen: {f}", file=sys.stderr)
    return out


# --------------------------------------------------------------------------- Bewertung

def age_days(ts, now):
    return None if not ts else max(0, (now - ts) / 86400)


def channel_median(ch, fmt, now):
    views = [v["views"] for v in ch[fmt]
             if v["views"] is not None and not ((a := age_days(v["ts"], now)) is not None and a < FRESH_DAYS)]
    views = views[:50]
    return statistics.median(views) if len(views) >= MEDIAN_MIN_N else None


def make_row(vid, ch, fmt, now, source):
    med = channel_median(ch, fmt, now)
    views = vid.get("views")
    if not med or views is None:
        return None
    age = age_days(vid.get("ts"), now)
    return {
        "id": vid["id"],
        "title": vid.get("title") or "",
        "channel": ch["name"],
        "channel_id": ch["id"],
        "subs": ch.get("subs"),
        "format": fmt,
        "views": views,
        "median": med,
        "faktor": views / max(med, 1),
        "age_days": age,
        "views_per_day": views / age if age and age >= 1 else None,
        "score": (views / max(med, 1) * views) ** 0.5,
        "ad": (med < AD_MAX_MEDIAN and views / max(med, 1) > AD_MIN_FAKTOR)
              or bool(AD_TITLE.search(vid.get("title") or "")) or bool(AD_CHANNEL.search(ch["name"] or "")),
        "sources": {source},
    }


def classify(vid_id, duration, ch):
    if any(v["id"] == vid_id for v in ch["short"]):
        return "short"
    if any(v["id"] == vid_id for v in ch["long"]):
        return "long"
    return "short" if duration and duration <= SHORT_MAX_SECONDS else "long"


def pattern_hits(title):
    t = title.lower()
    hits = set()
    for name, rx in TITLE_PATTERNS:
        if rx is None:
            if re.search(r"\b[A-ZÄÖÜ]{4,}\b", title):
                hits.add(name)
        elif re.search(rx, t):
            hits.add(name)
    return hits


def title_stats(winners, baseline):
    rows = []
    for name, _ in TITLE_PATTERNS:
        w = sum(name in pattern_hits(r["title"]) for r in winners) / max(len(winners), 1)
        b = sum(name in pattern_hits(r["title"]) for r in baseline) / max(len(baseline), 1)
        rows.append((name, w, b))
    rows.sort(key=lambda r: r[1] - r[2], reverse=True)
    words = Counter()
    for r in winners:
        toks = {w for w in re.findall(r"[a-zäöüß0-9]+", r["title"].lower())
                if len(w) >= 4 and w not in STOPWORDS and not w.isdigit()}
        words.update(toks)
    return rows, words.most_common(25)


# --------------------------------------------------------------------------- Ausgabe

def fmt_int(n):
    if n is None:
        return "–"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} Mio".replace(".", ",")
    if n >= 10_000:
        return f"{n / 1000:.0f}k"
    return f"{n:,.0f}".replace(",", ".")


def fmt_age(d):
    if d is None:
        return "–"
    if d < 14:
        return f"{d:.0f} T"
    if d < 60:
        return f"{d / 7:.0f} Wo"
    if d < 730:
        return f"{d / 30.4:.0f} Mon"
    return f"{d / 365:.0f} J"


def url_of(r):
    return f"https://www.youtube.com/shorts/{r['id']}" if r["format"] == "short" else f"https://youtu.be/{r['id']}"


def md_table(rows, with_source=True):
    if not rows:
        return "_keine Treffer_\n"
    head = "| # | Faktor | Aufrufe | Alter | Titel | Kanal (Abos) |" + (" Quelle |" if with_source else "")
    sep = "|---|---|---|---|---|---|" + ("---|" if with_source else "")
    lines = [head, sep]
    for i, r in enumerate(rows, 1):
        title = r["title"].replace("|", "/")
        line = (f"| {i} | **{r['faktor']:.0f}×** | {fmt_int(r['views'])} | {fmt_age(r['age_days'])} "
                f"| [{title}]({url_of(r)}){' ⚠️ Werbung?' if r['ad'] else ''} | {r['channel']} ({fmt_int(r['subs'])}) |")
        if with_source:
            line += " " + ", ".join(sorted(r["sources"])) + " |"
        lines.append(line)
    return "\n".join(lines) + "\n"


def write_md(path, ctx):
    p = [f"# Video-Ideen: Outlier-Bericht vom {ctx['date']}\n",
         "Faktor = Aufrufe geteilt durch den Median des eigenen Kanals (gleiches Format). "
         f"Gezeigt ab {ctx['min_faktor']:g}× und {fmt_int(ctx['min_views'])} Aufrufen, sortiert nach √(Faktor × Aufrufe). "
         "„Werbung?“: sehr kleiner Kanal-Median und riesiger Faktor, oft bezahlte Aufrufe. "
         f"Suche: {ctx['zeitraum_text']}.\n"]
    p += ["## Lange Videos: Top-Ideen\n", md_table(ctx["long"])]
    p += ["## Shorts: Top-Ideen\n", md_table(ctx["short"])]
    p += ["## Dein Kanal: Was bei dir überdurchschnittlich lief\n", md_table(ctx["own"], with_source=False)]
    p += ["## Titelmuster der Treffer\n",
          "| Muster | Anteil bei Treffern | Anteil bei allen Suchergebnissen |", "|---|---|---|"]
    p += [f"| {n} | {w:.0%} | {b:.0%} |" for n, w, b in ctx["patterns"]]
    p += ["\nHäufige Wörter in Treffer-Titeln: " + ", ".join(f"{w} ({c})" for w, c in ctx["words"]) + "\n"]
    p += ["## Kanäle, die oft auftauchen (Kandidaten für ideen/channels.txt)\n",
          "| Kanal | Suchbegriffe | Abos | Median lang | Median Shorts | ID |", "|---|---|---|---|---|---|"]
    p += [f"| {c['name']} | {c['hits']} | {fmt_int(c['subs'])} | {fmt_int(c['med_long'])} "
          f"| {fmt_int(c['med_short'])} | `{c['id']}` |" for c in ctx["suggest"]]
    path.write_text("\n".join(p) + "\n")


def html_cards(rows):
    if not rows:
        return '<p class="empty">Keine Treffer.</p>'
    out = []
    for r in rows:
        e = html.escape
        src = ", ".join(sorted(r["sources"]))
        out.append(f"""<a class="card" href="{url_of(r)}" target="_blank" rel="noopener">
  <div class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/{r['id']}/mqdefault.jpg" alt="">
    <span class="badge">{r['faktor']:.0f}×</span>{'<span class="ad">Werbung?</span>' if r['ad'] else ''}</div>
  <div class="meta"><div class="title">{e(r['title'])}</div>
    <div class="sub">{e(r['channel'])} · {fmt_int(r['subs'])} Abos</div>
    <div class="nums">{fmt_int(r['views'])} Aufrufe · Kanal-Median {fmt_int(r['median'])} · {fmt_age(r['age_days'])}</div>
    <div class="src">{e(src)}</div></div></a>""")
    return '<div class="grid">' + "\n".join(out) + "</div>"


def write_html(path, ctx):
    e = html.escape
    pat_rows = "".join(
        f"<tr><td>{e(n)}</td><td>{w:.0%}</td><td>{b:.0%}</td>"
        f"<td class='{'up' if w - b > 0.05 else 'down' if b - w > 0.05 else ''}'>{(w - b) * 100:+.0f}</td></tr>"
        for n, w, b in ctx["patterns"])
    words = " ".join(f"<span class='chip'>{e(w)} <b>{c}</b></span>" for w, c in ctx["words"])
    sugg = "".join(
        f"<tr><td><a href='https://www.youtube.com/channel/{c['id']}' target='_blank'>{e(c['name'])}</a></td>"
        f"<td>{c['hits']}</td><td>{fmt_int(c['subs'])}</td><td>{fmt_int(c['med_long'])}</td>"
        f"<td>{fmt_int(c['med_short'])}</td><td><code>{c['id']}</code></td></tr>" for c in ctx["suggest"])
    by_kw = "".join(
        f"<details><summary>{e(kw)} <span class='muted'>({len(rows)})</span></summary>{html_cards(rows)}</details>"
        for kw, rows in ctx["by_keyword"])
    by_ch = "".join(
        f"<details><summary>{e(name)} <span class='muted'>({len(rows)})</span></summary>{html_cards(rows)}</details>"
        for name, rows in ctx["by_channel"])
    doc = f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Video-Ideen {ctx['date']}</title>
<style>
:root{{--bg:#f6f5f2;--card:#fff;--fg:#1d1d1b;--muted:#6b6a66;--line:#e3e1dc;--accent:#d9480f;--up:#2b8a3e;--down:#c92a2a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#151515;--card:#1f1f1f;--fg:#ecebe8;--muted:#9a9893;--line:#333;--accent:#ff8a4c;--up:#69db7c;--down:#ff8787}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}}
main{{max-width:1200px;margin:0 auto;padding:24px 16px 64px}}h1{{font-size:26px;margin:0 0 4px}}
h2{{font-size:19px;margin:36px 0 12px;padding-top:12px;border-top:1px solid var(--line)}}
.muted,.lead{{color:var(--muted)}}.lead{{max-width:760px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}}
.card{{display:block;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;color:inherit;text-decoration:none}}
.card:hover{{border-color:var(--accent)}}
.thumb{{position:relative;aspect-ratio:16/9;background:#000}}.thumb img{{width:100%;height:100%;object-fit:cover;display:block}}
.ad{{position:absolute;top:8px;right:8px;background:#000c;color:#fff;font-size:12px;padding:2px 8px;border-radius:6px}}
.badge{{position:absolute;top:8px;left:8px;background:var(--accent);color:#fff;font-weight:700;padding:2px 8px;border-radius:6px}}
.meta{{padding:10px 12px}}.title{{font-weight:600;margin-bottom:6px}}.sub,.nums,.src{{font-size:13px;color:var(--muted)}}
.src{{margin-top:4px;font-style:italic}}
table{{border-collapse:collapse;width:100%;font-size:14px;background:var(--card)}}
td,th{{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left}}th{{color:var(--muted);font-weight:500}}
.up{{color:var(--up);font-weight:600}}.down{{color:var(--down)}}
.chip{{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 10px;margin:3px;background:var(--card)}}
details{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0}}
summary{{cursor:pointer;font-weight:600}}details .grid{{margin-top:12px}}
.table-wrap{{overflow-x:auto}}code{{font-size:12px}}
</style></head><body><main>
<h1>Video-Ideen: Outlier-Bericht</h1>
<p class="muted">{ctx['date']} · Suche: {e(ctx['zeitraum_text'])} · {ctx['n_scored']} Videos bewertet</p>
<p class="lead">Die Zahl auf dem Bild ist der <b>Faktor</b>: so viel Mal mehr Aufrufe als der Median des eigenen Kanals
(Shorts mit Shorts, lange mit langen verglichen). Hoher Faktor heißt: Das Thema oder der Titel hat gezogen, nicht die Kanalgröße.
Gezeigt ab {ctx['min_faktor']:g}× und {fmt_int(ctx['min_views'])} Aufrufen, sortiert nach Faktor und Reichweite zusammen
(√(Faktor × Aufrufe)), damit weder Mini-Kanäle noch Riesenkanäle die Liste beherrschen.
„Werbung?“ markiert Kanäle mit sehr kleinem Median und riesigem Faktor: Solche Aufrufe sind oft bezahlt.</p>
<h2>Lange Videos: Top-Ideen</h2>{html_cards(ctx['long'])}
<h2>Shorts: Top-Ideen</h2>{html_cards(ctx['short'])}
<h2>Dein Kanal: Was bei dir überdurchschnittlich lief</h2>
<p class="lead">Deine eigenen Ausreißer. Diese Themen haben bei deinem Publikum schon funktioniert und verdienen Fortsetzungen.</p>
{html_cards(ctx['own'])}
<h2>Titelmuster der Treffer</h2>
<p class="lead">Wie oft ein Muster in Treffer-Titeln vorkommt, verglichen mit allen Suchergebnissen. Grün heißt: bei Treffern deutlich häufiger.</p>
<div class="table-wrap"><table><tr><th>Muster</th><th>Treffer</th><th>alle</th><th>Differenz (Punkte)</th></tr>{pat_rows}</table></div>
<p>{words}</p>
<h2>Nach Suchbegriff</h2>{by_kw or '<p class="empty">Keine Suchbegriffe.</p>'}
<h2>Beobachtete Kanäle</h2>{by_ch or '<p class="empty">ideen/channels.txt ist leer.</p>'}
<h2>Kanäle, die oft auftauchen</h2>
<p class="lead">Kandidaten für <code>ideen/channels.txt</code>: tauchen bei mehreren Suchbegriffen auf.</p>
<div class="table-wrap"><table><tr><th>Kanal</th><th>Suchbegriffe</th><th>Abos</th><th>Median lang</th><th>Median Shorts</th><th>ID</th></tr>{sugg}</table></div>
</main></body></html>"""
    path.write_text(doc)


def write_csv(path, rows):
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["idee_score", "werbung_verdacht", "faktor", "aufrufe", "kanal_median", "format", "alter_tage", "aufrufe_pro_tag",
                    "titel", "kanal", "abos", "quelle", "url"])
        for r in sorted(rows, key=lambda r: r["score"], reverse=True):
            w.writerow([f"{r['score']:.0f}", "ja" if r["ad"] else "", f"{r['faktor']:.2f}", r["views"], r["median"], r["format"],
                        "" if r["age_days"] is None else f"{r['age_days']:.0f}",
                        "" if r["views_per_day"] is None else f"{r['views_per_day']:.0f}",
                        r["title"], r["channel"], r["subs"] or "", "; ".join(sorted(r["sources"])), url_of(r)])


# --------------------------------------------------------------------------- Ablauf

def read_list(path):
    if not path.exists():
        return []
    items = []
    for line in path.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            items.append(line)
    return items


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--keywords", type=Path, default=IDEEN / "keywords.txt")
    ap.add_argument("--channels", type=Path, default=IDEEN / "channels.txt")
    ap.add_argument("--blocklist", type=Path, default=IDEEN / "blocklist.txt")
    ap.add_argument("--hashtags", type=Path, default=IDEEN / "hashtags.txt")
    ap.add_argument("--keyword", action="append", default=[], help="zusätzlicher Suchbegriff (mehrfach möglich)")
    ap.add_argument("--nur-keyword", action="store_true", help="nur --keyword verwenden, Dateien ignorieren")
    ap.add_argument("--own", default=OWN_CHANNEL, help="eigener Kanal (UC-ID, @handle oder URL)")
    ap.add_argument("--zeitraum", choices=ZEITRAUM_SP, default="jahr", help="Upload-Zeitraum der Suche")
    ap.add_argument("--pro-keyword", type=int, default=30, help="Suchergebnisse pro Suchbegriff")
    ap.add_argument("--min-views", type=int, default=10_000)
    ap.add_argument("--min-faktor", type=float, default=3.0)
    ap.add_argument("--max-alter", type=int, default=365, help="Tage, für Uploads beobachteter Kanäle")
    ap.add_argument("--top", type=int, default=40, help="Einträge pro Top-Liste")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--no-cache", action="store_true")
    ap.add_argument("--out", type=Path, default=IDEEN / "reports")
    args = ap.parse_args()

    keywords = list(args.keyword) + ([] if args.nur_keyword else read_list(args.keywords))
    tracked = [] if args.nur_keyword else read_list(args.channels)
    blocked = {b.lower() for b in read_list(args.blocklist)}
    hashtags = [] if args.nur_keyword else [h.lstrip("#") for h in read_list(args.hashtags)]
    vocab = topic_words(keywords, hashtags)
    now = time.time()
    use_cache = not args.no_cache

    # 1) Suche
    hits = defaultdict(list)  # channel_id -> [(keyword, entry)]
    baseline_titles = []
    with ThreadPoolExecutor(args.workers) as pool:
        jobs = {pool.submit(search, kw, args.pro_keyword, args.zeitraum): kw for kw in keywords}
        for i, job in enumerate(as_completed(jobs), 1):
            kw = jobs[job]
            try:
                for e in job.result():
                    if e["channel_id"].lower() in blocked or (e.get("channel") or "").strip().lower() in blocked:
                        continue
                    hits[e["channel_id"]].append((kw, e))
                    baseline_titles.append({"title": e.get("title") or ""})
            except Exception as ex:
                print(f"\n  Suche übersprungen ({kw}): {ex}", file=sys.stderr)
            print(f"\r  Suchbegriffe: {i}/{len(keywords)}", end="", file=sys.stderr, flush=True)
    if keywords:
        print(file=sys.stderr)

    # Hashtag-Shorts: Seite abrufen, Titel/Kanal per oEmbed, nur themennahe behalten
    tag_hits = []  # (tag, {id, views, title, author_url, channel})
    if hashtags:
        with ThreadPoolExecutor(args.workers) as pool:
            pages = list(pool.map(lambda t: (t, hashtag_shorts(t, HASHTAG_LIMIT)), hashtags))
        cands = [(t, v) for t, lst in pages for v in lst if (v["views"] or 0) >= args.min_views]
        with ThreadPoolExecutor(args.workers) as pool:
            metas = list(pool.map(lambda tv: oembed(tv[1]["id"]), cands))
        for (t, v), m in zip(cands, metas):
            if m and m["author_url"] and on_topic(m["title"], vocab) \
                    and (m["channel"] or "").strip().lower() not in blocked:
                tag_hits.append((t, {**v, **m}))
        print(f"  Hashtags: {len(tag_hits)} themennahe Shorts aus {len(cands)} Kandidaten", file=sys.stderr)

    # Kanal-Median nur für Kanäle holen, bei denen ein Treffer überhaupt in Frage kommt
    need = {cid for cid, lst in hits.items() if any((e.get("view_count") or 0) >= args.min_views for _, e in lst)}
    own_ref = channel_base(args.own)
    refs = sorted({f"https://www.youtube.com/channel/{cid}" for cid in need} | {channel_base(t) for t in tracked}
                  | {channel_base(v["author_url"]) for _, v in tag_hits} | {own_ref})
    print(f"  {len(refs)} Kanäle werden geladen …", file=sys.stderr)
    channels = fetch_many(refs, args.workers, use_cache)
    by_id = {ch["id"]: ch for ch in channels.values() if ch.get("id")}
    own = channels.get(own_ref)
    own_id = own["id"] if own else None

    rows = {}

    def add(row):
        if not row:
            return
        if row["id"] in rows:
            rows[row["id"]]["sources"] |= row["sources"]
        else:
            rows[row["id"]] = row

    # 2) Suchtreffer bewerten
    for cid, lst in hits.items():
        ch = by_id.get(cid)
        if not ch or cid == own_id:
            continue
        known = {v["id"]: v for v in ch["long"] + ch["short"]}
        for kw, e in lst:
            fmt = classify(e["id"], e.get("duration"), ch)
            k = known.get(e["id"], {})
            vid = {"id": e["id"], "title": e.get("title") or k.get("title"),
                   "views": e.get("view_count") or k.get("views"), "ts": k.get("ts")}
            add(make_row(vid, ch, fmt, now, kw))
        # Die Suche liefert kaum Shorts. Darum auch die Shorts der gefundenen Kanäle prüfen.
        kws = sorted({kw for kw, _ in lst})
        if len(kws) < CHANNEL_SHORTS_MIN_KEYWORDS:
            continue
        for v in ch["short"]:
            if not on_topic(v["title"], vocab):
                continue
            r = make_row(v, ch, "short", now, kws[0])
            if r:
                r["sources"] = {f"{kw} (Kanal-Shorts)" for kw in kws}
                add(r)

    for tag, v in tag_hits:
        ch = channels.get(channel_base(v["author_url"]))
        if ch and ch["id"] != own_id and ch["id"] not in blocked:
            add(make_row({"id": v["id"], "title": v["title"], "views": v["views"], "ts": None},
                         ch, "short", now, f"#{tag}"))

    # 3) Beobachtete Kanäle komplett bewerten
    tracked_rows = defaultdict(list)
    for t in tracked:
        ch = channels.get(channel_base(t))
        if not ch or ch["id"] == own_id:
            continue
        for fmt in ("long", "short"):
            for v in ch[fmt]:
                a = age_days(v["ts"], now)
                if a is not None and (a > args.max_alter or a < FRESH_DAYS):
                    continue
                r = make_row(v, ch, fmt, now, "Kanal")
                if r:
                    add(r)
                    tracked_rows[ch["name"]].append(rows[r["id"]])

    all_rows = list(rows.values())

    def winner(r):
        return r["faktor"] >= args.min_faktor and r["views"] >= args.min_views

    def top(fmt):
        return sorted((r for r in all_rows if r["format"] == fmt and winner(r)),
                      key=lambda r: r["score"], reverse=True)[:args.top]

    own_rows = []
    if own:
        for fmt in ("long", "short"):
            for v in own[fmt]:
                a = age_days(v["ts"], now)
                if a is not None and a < FRESH_DAYS:
                    continue
                r = make_row(v, own, fmt, now, "eigener Kanal")
                if r and r["faktor"] >= 2:
                    own_rows.append(r)
        own_rows.sort(key=lambda r: r["faktor"], reverse=True)

    winners = [r for r in all_rows if winner(r)]
    patterns, words = title_stats(winners, baseline_titles)

    by_keyword = []
    for kw in keywords + [f"#{h}" for h in hashtags]:
        lst = sorted((r for r in winners if kw in r["sources"] or f"{kw} (Kanal-Shorts)" in r["sources"]), key=lambda r: r["score"], reverse=True)
        by_keyword.append((kw, lst[:12]))
    by_channel = [(name, sorted((r for r in lst if winner(r)), key=lambda r: r["score"], reverse=True)[:12])
                  for name, lst in sorted(tracked_rows.items())]

    tracked_ids = {channels[channel_base(t)]["id"] for t in tracked if channel_base(t) in channels}
    suggest = []
    for cid, lst in hits.items():
        n_kw = len({kw for kw, _ in lst})
        if n_kw < 2 or cid == own_id or cid in tracked_ids:
            continue
        ch = by_id.get(cid)
        suggest.append({"id": cid, "name": ch["name"] if ch else lst[0][1].get("channel"), "hits": n_kw,
                        "subs": ch.get("subs") if ch else None,
                        "med_long": channel_median(ch, "long", now) if ch else None,
                        "med_short": channel_median(ch, "short", now) if ch else None})
    suggest.sort(key=lambda c: (c["hits"], c["med_long"] or 0), reverse=True)

    ctx = {
        "date": date.today().isoformat(),
        "zeitraum_text": {"woche": "Uploads dieser Woche", "monat": "Uploads dieses Monats",
                          "jahr": "Uploads der letzten 12 Monate", "alle": "alle Uploads"}[args.zeitraum],
        "min_views": args.min_views, "min_faktor": args.min_faktor, "n_scored": len(all_rows),
        "long": top("long"), "short": top("short"), "own": own_rows[:20],
        "patterns": patterns, "words": words, "by_keyword": by_keyword, "by_channel": by_channel,
        "suggest": suggest[:30],
    }
    args.out.mkdir(parents=True, exist_ok=True)
    stem = args.out / ctx["date"]
    write_html(stem.with_suffix(".html"), ctx)
    write_md(stem.with_suffix(".md"), ctx)
    write_csv(stem.with_suffix(".csv"), all_rows)

    print(f"\n{len(all_rows)} Videos bewertet, {len(winners)} Treffer "
          f"(ab {args.min_faktor:g}× und {fmt_int(args.min_views)} Aufrufen).")
    for label, lst in (("Lang", ctx["long"]), ("Shorts", ctx["short"])):
        print(f"\n{label}:")
        for r in lst[:10]:
            print(f"  {r['faktor']:5.0f}×  {fmt_int(r['views']):>8}  {r['title'][:70]}  ({r['channel']})")
    print(f"\nBericht: {stem.with_suffix('.html').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
