# Frei lizenzierte Video-Clips von Wikimedia Commons für den MoneyPrinterTurbo-Test (Ersatz für Pexels ohne API-Schlüssel).
import json, re, subprocess, time, urllib.error, urllib.parse, urllib.request
API = 'https://commons.wikimedia.org/w/api.php?'
UA = {'User-Agent': 'handwerksdoktor-test/1.0 (info@handwerksdoktor.de)'}
OK = re.compile(r'^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$', re.I)
def api(p):
    for versuch in range(6):
        time.sleep(3)
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(API + urllib.parse.urlencode({**p, 'format': 'json'}), headers=UA), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(15 * (versuch + 1))
    raise RuntimeError('Commons antwortet nicht')
begriffe = ['vacuum cleaner floor', 'making bed', 'kitchen sink', 'wiping table', 'washing dishes', 'window cleaning', 'folding laundry', 'cleaning kitchen']
nachweis = []
n = 0
for b in begriffe:
    r = api({'action': 'query', 'list': 'search', 'srnamespace': 6, 'srsearch': f'{b} filetype:video', 'srlimit': 15})
    titel = [x['title'] for x in r['query']['search']]
    if not titel: continue
    info = api({'action': 'query', 'titles': '|'.join(titel), 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mime'})
    kand = []
    for p in info['query']['pages'].values():
        ii = (p.get('imageinfo') or [{}])[0]; m = ii.get('extmetadata', {})
        lic = m.get('LicenseShortName', {}).get('value', '')
        dauer = float(ii.get('duration') or 0)
        if not OK.match(lic) or ii.get('width', 0) < 640 or dauer < 4: continue
        kand.append((ii['width'] * ii['height'], p['title'], ii['url'], lic, re.sub('<[^>]+>', '', m.get('Artist', {}).get('value', '')).strip(), dauer))
    for _, t, url, lic, art, dauer in sorted(kand, reverse=True)[:2]:
        n += 1
        ziel = f'clips/{n:02d}.mp4'
        roh = f'clips/{n:02d}.src'
        subprocess.run(['curl', '-s', '-L', '-A', UA['User-Agent'], '-o', roh, url], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-t', '10', '-i', roh, '-an', '-vf', 'scale=-2:1080', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', ziel], check=False)
        subprocess.run(['rm', '-f', roh])
        nachweis.append(f'{ziel}: {t} | {art} | {lic} | https://commons.wikimedia.org/wiki/{urllib.parse.quote(t.replace(" ", "_"))}')
        print(b, '->', t, lic, round(dauer))
open('clips/NACHWEIS.txt', 'w').write('\n'.join(nachweis) + '\n')
