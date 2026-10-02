// Holt die Videos des Kanals „Der Handwerksdoktor“ und ordnet sie Artikeln und Seiten zu.
//   npm run videos
// Ergebnis:
//   src/videos.json                    Videoliste und Zuordnung (wird beim Bauen gelesen)
//   public/bilder/videos/<id>.webp     Vorschaubild auf dem eigenen Server (Zwei-Klick-Lösung, siehe YouTube.astro)
// Quellen: yt-dlp (alle Videos und Shorts, falls installiert) und der öffentliche RSS-Feed des Kanals
// (die 15 neuesten, mit Datum). Kein API-Schlüssel nötig. Ist YouTube nicht erreichbar, bleibt der letzte Stand.
//
// Zuordnung: src/videos-zuordnung.json ist von Hand geprüft und hat immer Vorrang. Neue Videos, die beim letzten
// Lauf noch nicht bekannt waren, werden automatisch einem Artikel zugeordnet, wenn ihr Titel eindeutig zu dessen
// Titel passt (Stichwörter). Shorts werden nicht eingebunden.
import { readFile, writeFile, readdir, access, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const ROOT = new URL('../', import.meta.url).pathname;
const KANAL = 'UClteHHjbqHnhSvgMCYEgH9A';
const HANDLE = 'https://www.youtube.com/@derhandwerksdoktor';
const DATEI = ROOT + 'src/videos.json';
const BILDER = ROOT + 'public/bilder/videos/';
const run = promisify(execFile);

const lesen = async (p, def) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return def; } };
const alt = await lesen(DATEI, { videos: [], artikel: {}, seiten: {} });
const zuordnung = await lesen(ROOT + 'src/videos-zuordnung.json', { artikel: {}, seiten: {}, ignorieren: [] });

const videos = new Map(alt.videos.map((v) => [v.id, { ...v }]));
const bekannt = new Set(videos.keys());
// Beim allerersten Lauf ist jedes Video „neu“. Dann nichts automatisch zuordnen, nur Vorschläge ausgeben.
const ersterLauf = videos.size === 0;
const neu = (id) => !bekannt.has(id);
const merken = (v) => videos.set(v.id, { ...(videos.get(v.id) ?? {}), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x != null)) });

// 1. Alle Videos und Shorts über yt-dlp (lokal installiert; fehlt es, reicht der RSS-Feed).
for (const typ of ['videos', 'shorts']) {
  try {
    const { stdout } = await run('yt-dlp', ['--extractor-args', 'youtube:lang=de', '--flat-playlist', '--print', '%(id)s\t%(title)s\t%(duration)s', `${HANDLE}/${typ}`], { timeout: 180000 });
    for (const z of stdout.trim().split('\n').filter(Boolean)) {
      const [id, titel, dauer] = z.split('\t');
      merken({ id, titel: titel.trim(), typ: typ === 'shorts' ? 'short' : 'video', dauer: /^\d+$/.test(dauer) ? Number(dauer) : null });
    }
    console.log(`yt-dlp: ${typ} gelesen`);
  } catch (e) {
    console.log(`yt-dlp (${typ}) nicht verfügbar: ${String(e.message).split('\n')[0]}`);
  }
}

// 2. RSS-Feed: die 15 neuesten mit Veröffentlichungsdatum.
try {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${KANAL}`, { headers: { 'Accept-Language': 'de-DE' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const ent = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  for (const e of xml.split('<entry>').slice(1)) {
    const id = e.match(/<yt:videoId>([^<]+)/)?.[1];
    if (!id) continue;
    merken({
      id,
      titel: videos.get(id)?.titel ?? ent(e.match(/<title>([^<]+)/)?.[1] ?? ''),
      typ: /href="https:\/\/www\.youtube\.com\/shorts\//.test(e) ? 'short' : 'video',
      datum: e.match(/<published>([^<]+)/)?.[1],
    });
  }
  console.log('RSS-Feed gelesen');
} catch (e) {
  console.log(`RSS-Feed nicht erreichbar: ${e.message}`);
}

// 3. Artikel lesen.
const artikel = [];
for (const f of (await readdir(ROOT + 'src/content/artikel')).filter((f) => f.endsWith('.mdx'))) {
  const text = await readFile(ROOT + 'src/content/artikel/' + f, 'utf8');
  const feld = (k) => text.match(new RegExp(`^${k}: "?(.*?)"?$`, 'm'))?.[1] ?? '';
  if (feld('entwurf') === 'true') continue;
  const id = f.slice(0, -4);
  artikel.push({ id, text: `${feld('title')} ${feld('kurztitel')} ${id.replace(/-/g, ' ')}` });
}

// 4. Automatische Zuordnung neuer Videos: gemeinsame Stichwörter zwischen Videotitel und Artikeltitel.
const STOP = new Set(('der die das den dem des ein eine einer eines einen und oder mit ohne fuer für von vom zu zum zur im in am an auf aus bei '
  + 'ist sind wird werden was wie wo wann warum wer welche welcher welches so geht richtig einfach erklaert erklärt anleitung schritt schritten schritte '
  + 'tipps tipp loesung lösung test ehrliche ehrlich wirklich lohnt sich dein deine deinen du ich mein meine diese dieser nicht kein keine '
  + 'komplette kompletter alle alles neu 2025 2026 shorts was hilft haeufigsten häufigsten ursachen fehler beheben selbst').split(' '));
const norm = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const woerter = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));
const punkte = (a, b) => [...a].filter((w) => b.has(w)).reduce((s, w) => s + (w.length >= 8 ? 2 : 1), 0);

const ergebnisArtikel = {};
const auto = [];
for (const a of artikel) {
  if (a.id in zuordnung.artikel) {
    if (zuordnung.artikel[a.id]) ergebnisArtikel[a.id] = zuordnung.artikel[a.id];
    continue;
  }
  if (alt.artikel?.[a.id]) { ergebnisArtikel[a.id] = alt.artikel[a.id]; continue; }
  const aw = woerter(a.text);
  const kandidaten = [...videos.values()]
    .filter((v) => v.typ === 'video' && neu(v.id) && !zuordnung.ignorieren.includes(v.id))
    .map((v) => ({ v, p: punkte(woerter(v.titel), aw) }))
    .sort((x, y) => y.p - x.p);
  const [best, zweit] = kandidaten;
  if (best && best.p >= 3 && (!zweit || best.p >= zweit.p + 2)) {
    if (ersterLauf) { console.log(`Vorschlag (nicht übernommen): ${a.id} ← ${best.v.id} „${best.v.titel}“ (${best.p})`); continue; }
    ergebnisArtikel[a.id] = best.v.id;
    auto.push(`${a.id} ← ${best.v.id} „${best.v.titel}“ (${best.p} Punkte)`);
  }
}

// 5. Vorschaubilder für alle zugeordneten Videos auf den eigenen Server holen.
await mkdir(BILDER, { recursive: true });
const genutzt = new Set([...Object.values(ergebnisArtikel), ...Object.values(zuordnung.seiten)]);
for (const id of genutzt) {
  const ziel = `${BILDER}${id}.webp`;
  try { await access(ziel); continue; } catch {}
  for (const name of ['maxresdefault', 'hq720', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`).catch(() => null);
    if (!res?.ok) continue;
    await sharp(Buffer.from(await res.arrayBuffer())).resize(1280, 720, { fit: 'cover' }).webp({ quality: 78 }).toFile(ziel);
    console.log('Vorschaubild', id, name);
    break;
  }
}

// 6. Speichern (nur Videos mit Vorschaubild bleiben zugeordnet, sonst würde die Seite ein fehlendes Bild zeigen).
const hatBild = async (id) => { try { await access(`${BILDER}${id}.webp`); return true; } catch { return false; } };
const sortiert = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const filtern = async (o) => Object.fromEntries((await Promise.all(Object.entries(o).map(async ([k, v]) => [k, v, await hatBild(v)]))).filter(([, , ok]) => ok).map(([k, v]) => [k, v]));
const daten = {
  videos: [...videos.values()].sort((a, b) => a.id.localeCompare(b.id)),
  artikel: sortiert(await filtern(ergebnisArtikel)),
  seiten: sortiert(await filtern(zuordnung.seiten)),
};
const json = JSON.stringify(daten, null, 1) + '\n';
if (json !== JSON.stringify(alt, null, 1) + '\n') await writeFile(DATEI, json);
console.log(`${daten.videos.length} Videos bekannt, ${Object.keys(daten.artikel).length} Artikel und ${Object.keys(daten.seiten).length} Seiten mit Video.`);
if (auto.length) console.log('Automatisch zugeordnet:\n  ' + auto.join('\n  '));
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `### YouTube-Videos\n\n${daten.videos.length} Videos bekannt, ${Object.keys(daten.artikel).length} Artikel mit Video.\n\n${auto.length ? 'Neu automatisch zugeordnet:\n\n' + auto.map((z) => `- ${z}`).join('\n') + '\n' : ''}`);
}
