#!/usr/bin/env python3
"""Reddit ohne Login lesen (RSS + Shreddit-Endpunkte von www.reddit.com).

Befehle (Ausgabe ist Markdown auf stdout):
  top SUBREDDIT [--t year|month|week|all] [--n 100] [--sort top|hot|new] [--text 200]
      Posts eines Subreddits mit Score, Kommentarzahl, Datum, Link und Textanfang.
  search QUERY [--sub SUBREDDIT] [--t year|all] [--sort top|relevance|new|comments] [--n 50]
      Reddit-Suche (mit --sub auf ein Subreddit beschränkt). Operatoren wie
      subreddit:name, author:name, title:"..." funktionieren im QUERY.
  post URL_ODER_ID [--n 60] [--sort top|new|controversial|qa]
      Vollständiger Post-Text plus Kommentare (Autor, Score, Tiefe).
  user NAME [--n 50]
      Letzte Posts/Kommentare eines Nutzers (um Werbe-Accounts und Shills zu erkennen).

Alle Antworten werden in REDDIT_CACHE (Standard: ~/.cache/reddit_fetch) gecacht.
Standard: top/search/post laufen komplett über Shreddit-/Embed-Endpunkte (kaum limitiert,
voller Post-Text). RSS-Feeds (.rss) nutzt nur `user` und die Fallbacks; Reddit limitiert sie
streng (~10/min pro IP), daher prozessübergreifend 1 Anfrage je 10 s.
Bei 429 wird gewartet und erneut versucht. Bei 404 existiert das Subreddit/der Nutzer nicht.
"""
import argparse, fcntl, hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")
CACHE = os.environ.get("REDDIT_CACHE", os.path.expanduser("~/.cache/reddit_fetch"))
os.makedirs(CACHE, exist_ok=True)
INTERVAL_RSS = float(os.environ.get("REDDIT_INTERVAL_RSS", "10"))
INTERVAL_SVC = float(os.environ.get("REDDIT_INTERVAL_SVC", "1.5"))


def _throttle(kind, penalty=0.0):
    """Prozessübergreifende Drosselung über Sperrdatei je Endpunkt-Art."""
    lock_path = os.path.join(CACHE, f".lock-{kind}")
    interval = INTERVAL_RSS if kind == "rss" else INTERVAL_SVC
    with open(lock_path, "a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        lock.seek(0)
        try:
            nxt = float(lock.read().strip() or 0)
        except ValueError:
            nxt = 0.0
        now = time.time()
        wait = max(0.0, nxt - now)
        if wait > 0:
            time.sleep(wait)
        lock.seek(0); lock.truncate(); lock.write(str(time.time() + interval + penalty)); lock.flush()
        fcntl.flock(lock, fcntl.LOCK_UN)


def fetch(url, accept="*/*"):
    key = hashlib.sha1(url.encode()).hexdigest()
    path = os.path.join(CACHE, key)
    if os.path.exists(path):
        return open(path, encoding="utf-8", errors="replace").read()
    kind = "rss" if ".rss" in url else "svc"
    delay = 8
    for attempt in range(7):
        _throttle(kind)
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept,
                                                   "Accept-Language": "en-US,en;q=0.8,de;q=0.6"})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                body = r.read().decode("utf-8", errors="replace")
                final = r.geturl()
            if "/login/" in final and "reason=" in final:
                raise RuntimeError("Login-Wand (Reddit blockt diese Anfrage): " + final)
            with open(path, "w", encoding="utf-8") as f:
                f.write(body)
            return body
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise SystemExit(f"404: {url} existiert nicht (Subreddit/Nutzer/Post falsch geschrieben oder gelöscht).")
            if e.code in (429, 403, 500, 502, 503) and attempt < 6:
                sys.stderr.write(f"[reddit_fetch] HTTP {e.code} fuer {url}, warte {delay}s\n")
                _throttle(kind, penalty=delay)  # auch andere Prozesse bremsen
                time.sleep(delay); delay = min(delay * 2, 90); continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < 6:
                sys.stderr.write(f"[reddit_fetch] {e} fuer {url}, warte {delay}s\n")
                time.sleep(delay); delay = min(delay * 2, 90); continue
            raise
    raise RuntimeError("aufgegeben: " + url)


def strip_html(s):
    s = html.unescape(s)
    s = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>|</blockquote>", "\n", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    return re.sub(r"\n\s*\n+", "\n", s).strip()


def parse_rss(xml):
    out = []
    for e in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
        g = lambda pat: (re.search(pat, e, re.S) or [None, ""])[1]
        content = g(r"<content[^>]*>(.*?)</content>")
        out.append({
            "title": html.unescape(g(r"<title>(.*?)</title>")),
            "link": html.unescape(g(r'<link href="([^"]+)"')),
            "author": g(r"<name>(.*?)</name>").replace("/u/", ""),
            "date": g(r"<updated>(.*?)</updated>")[:10],
            "text": strip_html(html.unescape(content)),
        })
    return out


def parse_posts_html(h):
    """shreddit-post-Elemente: Score, Kommentarzahl, Datum, Titel, Textvorschau."""
    out = {}
    for p in re.split(r"(?=<shreddit-post\s)", h)[1:]:
        m = re.match(r"<shreddit-post\s+([^>]*)>", p, re.S)
        if not m:
            continue
        a = dict(re.findall(r'([a-zA-Z-]+)="([^"]*)"', m.group(1)))
        pl = a.get("permalink", "")
        idm = re.search(r"/comments/([a-z0-9]+)/", pl)
        if not idm:
            continue
        tb = re.search(r'post-rtjson-content"[^>]*>(.*?)</div>\s*</div>', p, re.S)
        out[idm.group(1)] = {
            "score": int(a.get("score", "0") or 0),
            "comments": int(a.get("comment-count", "0") or 0),
            "title": html.unescape(a.get("post-title", "")),
            "permalink": "https://www.reddit.com" + pl,
            "author": a.get("author", ""),
            "sub": a.get("subreddit-prefixed-name", ""),
            "date": (a.get("created-timestamp", "") or "")[:10],
            "ratio": a.get("upvote-ratio", ""),
            "type": a.get("post-type", ""),
            "flair": html.unescape(re.sub(r"<[^>]+>", "", a.get("flair-text", "") or "")),
            "preview": strip_html(tb.group(1)) if tb else "",
        }
    return out


def post_id_from(url):
    m = re.search(r"/comments/([a-z0-9]+)", url)
    return m.group(1) if m else url.strip().replace("t3_", "")


def svc_pages(sub, sort, t, n):
    meta, after = {}, ""
    for _ in range(max(1, (n + 24) // 25)):
        url = (f"https://www.reddit.com/svc/shreddit/community-more-posts/{sort}/"
               f"?t={t}&name={sub}&feedLength=25" + (f"&after={urllib.parse.quote(after)}" if after else ""))
        h = fetch(url, "text/html")
        got = parse_posts_html(h)
        meta.update(got)
        m = re.search(r'<faceplate-partial[^>]*src="[^"]*after=([^"&]+)', h) or re.search(r'after="([^"]+)"', h)
        if not got or not m:
            break
        after = urllib.parse.unquote(m.group(1))
    return meta


def cmd_top(args):
    sub = args.subreddit.replace("r/", "")
    meta = svc_pages(sub, args.sort, args.t, args.n)
    entries = []
    if args.rss:
        try:
            entries = parse_rss(fetch(f"https://www.reddit.com/r/{sub}/{args.sort}/.rss?t={args.t}&limit={min(args.n,100)}"))
        except SystemExit:
            raise
        except Exception as e:
            sys.stderr.write(f"[reddit_fetch] RSS fehlgeschlagen ({e}), nutze nur Shreddit-Feed\n")
    texts = {post_id_from(e["link"]): e["text"] for e in entries}
    order = [post_id_from(e["link"]) for e in entries] + [pid for pid in meta if pid not in texts]
    seen, rows = set(), []
    for pid in order:
        if pid in seen:
            continue
        seen.add(pid)
        m = meta.get(pid)
        e = next((x for x in entries if post_id_from(x["link"]) == pid), None)
        if not m and not e:
            continue
        rows.append((pid, m, e))
    print(f"# r/{sub} {args.sort} (t={args.t}) – {len(rows)} Posts\n")
    for pid, m, e in rows[: args.n]:
        title = (m or {}).get("title") or e["title"]
        link = (m or {}).get("permalink") or e["link"]
        date = (m or {}).get("date") or (e or {}).get("date", "")
        author = (m or {}).get("author") or (e or {}).get("author", "")
        line = f"- [{title}]({link}) | {date} | u/{author} | Score {(m or {}).get('score','?')} | {(m or {}).get('comments','?')} Kommentare"
        if m and m.get("flair"):
            line += f" | Flair: {m['flair']}"
        print(line)
        txt = texts.get(pid) or (m or {}).get("preview", "")
        if args.text and txt:
            print("  > " + " ".join(txt.split())[: args.text])


def parse_search_html(h):
    out, seen = [], set()
    for unit in re.split(r'data-testid="search-sdui-post"', h)[1:]:
        a = re.search(r'<a data-testid="post-title" href="([^"]+)"[^>]*aria-label="([^"]*)"', unit)
        if not a:
            continue
        href = a.group(1)
        if href in seen:
            continue
        seen.add(href)
        sub = re.search(r"/r/([^/]+)/", href)
        nums = re.findall(r'<faceplate-number[^>]*number="(\d+)"', unit)
        ts = re.search(r'<faceplate-timeago[^>]*ts="([^"]+)"', unit)
        author = re.search(r'href="/user/([^/"]+)/"', unit)
        out.append({"title": html.unescape(a.group(2)), "link": "https://www.reddit.com" + href,
                    "sub": sub.group(1) if sub else "", "score": nums[0] if nums else "?",
                    "comments": nums[1] if len(nums) > 1 else "?", "date": (ts.group(1) if ts else "")[:10],
                    "author": author.group(1) if author else ""})
    return out


def cmd_search(args):
    q = args.query
    if args.sub:
        q = f"subreddit:{args.sub.replace('r/','')} {q}"
    url = (f"https://www.reddit.com/svc/shreddit/search?q={urllib.parse.quote_plus(q)}"
           f"&type=posts&sort={args.sort}&t={args.t}")
    results = []
    if not args.rss:
        try:
            cursor = ""
            for _ in range(max(1, min(6, (args.n + 9) // 10))):
                h = fetch(url + (f"&cursor={urllib.parse.quote(cursor)}" if cursor else ""), "text/html")
                page = parse_search_html(h)
                new = [r for r in page if r["link"] not in {x["link"] for x in results}]
                results += new
                m = re.search(r'cursor=([A-Za-z0-9_=%-]+)', h)
                if not new or not m or len(results) >= args.n:
                    break
                cursor = urllib.parse.unquote(m.group(1))
        except Exception as e:
            sys.stderr.write(f"[reddit_fetch] Shreddit-Suche fehlgeschlagen ({e}), nutze RSS\n")
    if not results:
        qq = urllib.parse.quote_plus(args.query)
        if args.sub:
            rurl = f"https://www.reddit.com/r/{args.sub.replace('r/','')}/search.rss?q={qq}&restrict_sr=1&sort={args.sort}&t={args.t}&limit={args.n}"
        else:
            rurl = f"https://www.reddit.com/search.rss?q={qq}&sort={args.sort}&t={args.t}&limit={args.n}"
        results = [{"title": e["title"], "link": e["link"], "sub": "", "score": "?", "comments": "?",
                    "date": e["date"], "author": e["author"], "text": e["text"]} for e in parse_rss(fetch(rurl))]
    print(f"# Suche: {q} (sort={args.sort}, t={args.t}) – {len(results)} Treffer\n")
    for r in results[: args.n]:
        print(f"- [{r['title']}]({r['link']}) | r/{r['sub']} | {r['date']} | u/{r['author']} | Score {r['score']} | {r['comments']} Kommentare")
        if args.text and r.get("text"):
            print("  > " + r["text"][: args.text].replace("\n", " "))


def parse_comments_html(h):
    out = []
    for p in re.split(r"(?=<shreddit-comment\s)", h)[1:]:
        m = re.match(r"<shreddit-comment\s+([^>]*)>", p, re.S)
        if not m:
            continue
        a = dict(re.findall(r'([a-zA-Z-]+)="([^"]*)"', m.group(1)))
        body = re.search(r'<div[^>]*slot="comment"[^>]*>(.*?)</div>\s*(?:</div>|<faceplate|<shreddit)', p, re.S)
        txt = strip_html(body.group(1)) if body else strip_html(p[m.end(): m.end() + 4000])
        out.append({"author": a.get("author", "?"), "score": int(a.get("score", "0") or 0),
                    "depth": int(a.get("depth", "0") or 0), "text": txt})
    return out


def fetch_op(pid, sub):
    """Post-Text, Titel, Autor, Datum über embed.reddit.com (kein RSS-Limit)."""
    h = fetch(f"https://embed.reddit.com/r/{sub}/comments/{pid}/?embed=true", "text/html")
    g = lambda pat: (re.search(pat, h, re.S) or [None, ""])[1]
    title = strip_html(g(r"<h1[^>]*>(.*?)</h1>")) or strip_html(g(r'aria-label="([^"]*)"')) or \
        html.unescape(re.sub(r"\s*:\s*r/\w+\s*$", "", strip_html(g(r"<title>(.*?)</title>"))))
    link = (g(r'<link rel="canonical" href="([^"]+)"') or g(r'href="(https://www\.reddit\.com/r/[^"]+/comments/[^"?]+)')).split("?")[0]
    author = g(r'href="(?:https://www\.reddit\.com)?/user/([^/"]+)/')
    date = g(r'<faceplate-timeago[^>]*ts="([^"]+)"')[:10] or g(r'datetime="([^"]+)"')[:10]
    tb = re.search(r'post-rtjson-content"[^>]*>(.*?)</div>\s*</div>', h, re.S)
    body = strip_html(tb.group(1)) if tb else ""
    media = re.findall(r'(?:content-href|src)="(https://(?:i\.redd\.it|preview\.redd\.it|v\.redd\.it|i\.imgur\.com)[^"]*)"', h)
    return {"title": title, "link": html.unescape(link), "author": author, "date": date, "text": body,
            "media": sorted(set(html.unescape(m) for m in media))[:5]}


def cmd_post(args):
    pid = post_id_from(args.url)
    op, rss = None, []
    sub_m = re.search(r"/r/([^/]+)/", args.url)
    sub = sub_m.group(1) if sub_m else ""
    if not sub:  # nur ID bekannt: Subreddit über RSS ermitteln (langsam)
        rss = parse_rss(fetch(f"https://www.reddit.com/comments/{pid}/.rss?limit=500&sort={args.sort}"))
        sub_m = re.search(r"/r/([^/]+)/", rss[0]["link"] if rss else "")
        sub = sub_m.group(1) if sub_m else ""
    try:
        op = fetch_op(pid, sub) if sub else None
    except SystemExit:
        raise
    except Exception as e:
        sys.stderr.write(f"[reddit_fetch] Embed fehlgeschlagen ({e}), nutze RSS\n")
    if not op or not (op["text"] or op["title"]):
        rss = rss or parse_rss(fetch(f"https://www.reddit.com/comments/{pid}/.rss?limit=500&sort={args.sort}"))
        if not rss:
            print("Kein Inhalt (gelöscht oder privat?)"); return
        op = dict(rss[0]); op["media"] = []
    link = op["link"] or (rss[0]["link"] if rss else f"https://www.reddit.com/r/{sub}/comments/{pid}/")
    print(f"# {op['title']}\n\n{link} | {op['date']} | u/{op['author']}\n")
    if op.get("media"):
        print("Medien: " + ", ".join(op["media"]) + "\n")
    print(op["text"][: args.maxlen] + ("\n…" if len(op["text"]) > args.maxlen else "") + "\n")
    comments = []
    try:
        h = fetch(f"https://www.reddit.com/svc/shreddit/comments/r/{sub}/t3_{pid}?sort={args.sort}", "text/html")
        comments = parse_comments_html(h)
    except Exception as e:
        sys.stderr.write(f"[reddit_fetch] Kommentar-Endpunkt fehlgeschlagen ({e})\n")
    if (not comments or args.all_rss) and not rss:
        try:
            rss = parse_rss(fetch(f"https://www.reddit.com/comments/{pid}/.rss?limit=500&sort={args.sort}"))
        except Exception as e:
            sys.stderr.write(f"[reddit_fetch] RSS fehlgeschlagen ({e})\n")
    if not comments:
        comments = [{"author": c["author"], "score": "?", "depth": 0, "text": c["text"]} for c in rss[1:]]
    print(f"## Kommentare ({len(comments)} mit Score geladen, zeige {min(args.n, len(comments))})\n")
    for c in comments[: args.n]:
        indent = "  " * min(c["depth"], 6)
        t = c["text"][: args.maxlen].replace("\n", " ")
        print(f"{indent}- u/{c['author']} (Score {c['score']}): {t}")
    if args.all_rss and len(rss) - 1 > len(comments):
        print(f"\n## Weitere Kommentare aus dem RSS-Feed (ohne Score)\n")
        shown = {c["text"][:80] for c in comments}
        for c in rss[1:]:
            if c["text"][:80] in shown:
                continue
            print(f"- u/{c['author']}: {c['text'][: args.maxlen].replace(chr(10), ' ')}")


def cmd_user(args):
    name = args.name.replace("u/", "")
    entries = parse_rss(fetch(f"https://www.reddit.com/user/{name}/.rss?limit={args.n}"))
    print(f"# u/{name} – {len(entries)} Einträge\n")
    for e in entries[: args.n]:
        print(f"- {e['date']} [{e['title'][:80]}]({e['link']})")
        if args.text and e["text"]:
            print("  > " + e["text"][: args.text].replace("\n", " "))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("top"); p.add_argument("subreddit"); p.add_argument("--t", default="year")
    p.add_argument("--n", type=int, default=100); p.add_argument("--sort", default="top")
    p.add_argument("--text", type=int, default=200, help="Zeichen Textvorschau (0 = aus)")
    p.add_argument("--rss", action="store_true", help="zusätzlich RSS-Feed laden (langsam, meist unnötig)")
    p.set_defaults(f=cmd_top)
    p = sp.add_parser("search"); p.add_argument("query"); p.add_argument("--sub", default="")
    p.add_argument("--t", default="year"); p.add_argument("--sort", default="relevance"); p.add_argument("--n", type=int, default=50)
    p.add_argument("--text", type=int, default=200); p.add_argument("--rss", action="store_true", help="RSS-Suche statt Shreddit")
    p.set_defaults(f=cmd_search)
    p = sp.add_parser("post"); p.add_argument("url"); p.add_argument("--n", type=int, default=60)
    p.add_argument("--sort", default="top"); p.add_argument("--maxlen", type=int, default=8000)
    p.add_argument("--all-rss", action="store_true", help="zusätzlich alle Kommentare aus dem RSS-Feed ausgeben (langsam)")
    p.set_defaults(f=cmd_post)
    p = sp.add_parser("user"); p.add_argument("name"); p.add_argument("--n", type=int, default=50)
    p.add_argument("--text", type=int, default=150); p.set_defaults(f=cmd_user)
    args = ap.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
