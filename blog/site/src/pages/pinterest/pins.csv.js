// CSV für „Inhalte importieren → .csv-Datei hochladen“ bei Pinterest (Vorlage von Pinterest, max. 200 Zeilen).
// Pinnwand = Thema (Heizung, Strom …). Die Pinnwände müssen in Pinterest mit genau diesem Namen angelegt sein.
// Dauerhaft automatisch geht es über die RSS-Feeds unter /pinterest/<thema>.xml.
import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { SITE } from '../../site';
import { THEMEN } from '../../themen';

const feld = (s) => `"${String(s).replace(/"/g, '""')}"`;

export async function GET() {
  const posts = (await getCollection('artikel', ({ data }) => !data.entwurf))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .filter((p) => existsSync(`public/bilder/pins/${p.id}.jpg`))
    .slice(0, 200);
  const zeilen = [['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords']];
  for (const p of posts) {
    const t = THEMEN[p.data.thema];
    zeilen.push([
      p.data.title.slice(0, 100),
      `${SITE.url}/bilder/pins/${p.id}.jpg`,
      t.titel,
      '',
      p.data.description.slice(0, 500),
      `${SITE.url}/artikel/${p.id}/`,
      '',
      [t.titel, 'Heimwerken', 'Haushaltstipps', 'Anleitung'].join(', '),
    ]);
  }
  return new Response(zeilen.map((z) => z.map(feld).join(',')).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
}
