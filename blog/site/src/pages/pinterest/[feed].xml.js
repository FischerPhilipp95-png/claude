// RSS-Feeds für Pinterest: Pinterest holt sie selbst ab und erstellt daraus Pins (bis zu 200 am Tag).
//   /pinterest/alle.xml      alle Artikel
//   /pinterest/<thema>.xml   nur ein Thema, z. B. /pinterest/heizung.xml (für eine eigene Pinnwand)
// Bild jedes Pins: /bilder/pins/<artikel>.jpg (1000x1500, erzeugt von scripts/pins.mjs).
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { statSync } from 'node:fs';
import { SITE } from '../../site';
import { THEMEN } from '../../themen';

export function getStaticPaths() {
  return [{ params: { feed: 'alle' } }, ...Object.values(THEMEN).map((t) => ({ params: { feed: t.slug } }))];
}

export async function GET(context) {
  const { feed } = context.params;
  const thema = Object.entries(THEMEN).find(([, t]) => t.slug === feed);
  const posts = (await getCollection('artikel', ({ data }) => !data.entwurf && (!thema || data.thema === thema[0])))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const items = [];
  for (const p of posts) {
    let groesse;
    try { groesse = statSync(`public/bilder/pins/${p.id}.jpg`).size; } catch { continue; }
    const bild = `${SITE.url}/bilder/pins/${p.id}.jpg`;
    items.push({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/artikel/${p.id}/`,
      enclosure: { url: bild, length: groesse, type: 'image/jpeg' },
      customData: `<media:content url="${bild}" type="image/jpeg" medium="image" width="1000" height="1500" />`,
    });
  }
  return rss({
    title: thema ? `${SITE.name}: ${thema[1].titel}` : SITE.name,
    description: thema ? thema[1].intro : SITE.description,
    site: context.site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items,
    customData: '<language>de-de</language>',
  });
}
