# Gezielt ausgewählte, frei lizenzierte Commons-Clips (langsam, wegen Rate-Limit).
import json, re, subprocess, time, urllib.parse, urllib.request
UA = {'User-Agent': 'handwerksdoktor-test/1.0 (info@handwerksdoktor.de)'}
OK = re.compile(r'^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$', re.I)
def get(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({**params, 'format': 'json'})
    for i in range(8):
        r = subprocess.run(['curl', '-s', '-w', '\n%{http_code}', '-A', UA['User-Agent'], url], capture_output=True, text=True)
        body, code = r.stdout.rsplit('\n', 1)
        if code == '200': return json.loads(body)
        time.sleep(20 * (i + 1))
    raise SystemExit('Commons nicht erreichbar')
suchen = ['Staubsauger', 'vacuuming carpet', 'bed sheets', 'dishwashing', 'mopping floor', 'window cleaning squeegee', 'kitchen counter wiping']
nachweis, n = [], 10
for s in suchen:
    time.sleep(8)
    r = get({'action': 'query', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': f'{s} filetype:video', 'gsrlimit': 8, 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata'})
    kand = []
    for p in (r.get('query') or {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]; m = ii.get('extmetadata', {})
        lic = m.get('LicenseShortName', {}).get('value', '')
        if OK.match(lic) and ii.get('width', 0) >= 640 and float(ii.get('duration') or 0) >= 5:
            kand.append((ii['width'] * ii['height'], p['title'], ii['url'], lic, re.sub('<[^>]+>', '', m.get('Artist', {}).get('value', '')).strip()))
    print(s, '->', [k[1] for k in sorted(kand, reverse=True)[:3]])
    for _, t, url, lic, art in sorted(kand, reverse=True)[:1]:
        n += 1
        time.sleep(5)
        subprocess.run(['curl', '-s', '-L', '-A', UA['User-Agent'], '-o', f'clips/{n}.src', url])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-t', '8', '-i', f'clips/{n}.src', '-an', '-vf', 'scale=-2:1080', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', f'clips/{n}.mp4'])
        subprocess.run(['rm', '-f', f'clips/{n}.src'])
        nachweis.append(f'clips/{n}.mp4: {t} | {art} | {lic} | https://commons.wikimedia.org/wiki/{urllib.parse.quote(t.replace(" ", "_"))}')
open('clips/NACHWEIS.txt', 'a').write('\n'.join(nachweis) + '\n')
