import csv, json, subprocess, statistics, time, urllib.request, urllib.parse, pathlib
OUT = pathlib.Path('messung.json')
daten = json.loads(OUT.read_text()) if OUT.exists() else {}
def sugg(q):
    s=set()
    for e in ['']+list('abcdefghijklmnopqrstuvwxyz'):
        try:
            r=urllib.request.urlopen(urllib.request.Request('https://suggestqueries.google.com/complete/search?client=firefox&hl=de&gl=de&q='+urllib.parse.quote((q+' '+e).strip()),headers={'User-Agent':'Mozilla/5.0'}),timeout=10)
            s.update(json.loads(r.read().decode('utf-8','replace'))[1])
        except Exception: pass
        time.sleep(0.2)
    return len(s)
def yt(q):
    out=subprocess.run(['yt-dlp','--flat-playlist','-j',f'ytsearch8:{q}'],capture_output=True,text=True,timeout=120).stdout
    vs=[json.loads(l) for l in out.splitlines()]
    return [{'id':v['id'],'titel':v.get('title'),'kanal':v.get('channel'),'views':v.get('view_count') or 0} for v in vs]
import threading
from concurrent.futures import ThreadPoolExecutor
lock=threading.Lock()
def eins(row):
    k=row['key']
    v=yt(row['suche']+' entkalken')
    views=sorted((x['views'] for x in v),reverse=True)[:5]
    e={**row,'google':sugg(row['suche']),'yt_median':statistics.median(views) if views else 0,'yt':v}
    with lock:
        daten[k]=e
        OUT.write_text(json.dumps(daten,ensure_ascii=False,indent=1))
        print(k, e['google'], e['yt_median'], flush=True)
rows=[r for r in csv.DictReader(open('kandidaten.tsv'),delimiter='\t') if r['key'] not in daten]
with ThreadPoolExecutor(4) as ex:
    list(ex.map(eins, rows))
