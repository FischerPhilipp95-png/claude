// Meldet alle URLs aus der Sitemap an IndexNow (Bing, Yandex, Seznam, Naver …).
// Erst NACH dem Hochladen ausführen, denn die Schlüsseldatei muss online erreichbar sein:
//   npm run indexnow
import { readFile } from 'node:fs/promises';

const HOST = 'gartensaunadoktor.de';
const KEY = '32c4b4606a59a461c852669d6c17ab28';
const xml = await readFile(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
const urlList = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`${urlList.length} URLs gemeldet, Antwort: ${res.status} ${res.statusText}`);
if (res.status >= 400) process.exit(1);
