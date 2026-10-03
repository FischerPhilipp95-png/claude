// RSS-Feeds für Pinterest: Pinterest holt sie selbst ab und erstellt daraus Pins (bis zu 200 am Tag).
//   /pinterest/alle.xml      alle Artikel
//   /pinterest/<thema>.xml   nur ein Thema, z. B. /pinterest/heizung.xml (für eine eigene Pinnwand)
// Pro Artikel bis zu drei Pins mit eigenem Bild (scripts/pins.mjs, Texte und Zeitplan in scripts/pin-varianten.mjs):
// Variante 1 sofort, Varianten 2 und 3 zeitversetzt. Was noch nicht dran ist, steht erst nach einem späteren Build im Feed.
// Dazu je Rechner und je Checkliste zum Ausdrucken (src/checklisten.mjs) ein Pin im Feed seines Themas.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { statSync } from 'node:fs';
import { SITE } from '../../site';
import { THEMEN } from '../../themen';
import { RECHNER } from '../../rechner';
import { CHECKLISTEN } from '../../checklisten.mjs';
import { varianten, freigabe, rechnerFreigabe, kuerzen } from '../../../scripts/pin-varianten.mjs';

export function getStaticPaths() {
  return [{ params: { feed: 'alle' } }, ...Object.values(THEMEN).map((t) => ({ params: { feed: t.slug } }))];
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Feed-Eintrag mit Pin-Bild. Die guid unterscheidet die Varianten, der Link führt immer zur echten Seite. */
function eintrag({ titel, text, datum, link, guid, datei }) {
  let groesse;
  try { groesse = statSync(`public/bilder/pins/${datei}`).size; } catch { return null; }
  const bild = `${SITE.url}/bilder/pins/${datei}`;
  return {
    title: titel,
    description: text,
    pubDate: datum,
    link,
    enclosure: { url: bild, length: groesse, type: 'image/jpeg' },
    customData: `<media:content url="${bild}" type="image/jpeg" medium="image" width="1000" height="1500" />`
      + (guid ? `<guid isPermaLink="false">${xml(guid)}</guid>` : ''),
  };
}

export async function GET(context) {
  const { feed } = context.params;
  const thema = Object.entries(THEMEN).find(([, t]) => t.slug === feed);
  // PIN_STICHTAG=2026-11-15 npm run build zeigt, wie die Feeds an diesem Tag aussehen (nur zum Testen).
  const jetzt = process.env.PIN_STICHTAG ? new Date(process.env.PIN_STICHTAG) : new Date();
  const posts = await getCollection('artikel', ({ data }) => !data.entwurf && (!thema || data.thema === thema[0]));
  const items = [];
  for (const p of posts) {
    const link = `${SITE.url}/artikel/${p.id}/`;
    items.push(eintrag({ titel: p.data.title, text: p.data.description, datum: p.data.pubDate, link, datei: `${p.id}.jpg` }));
    for (const v of varianten(p.data, p.body ?? '')) {
      const datum = freigabe(p.id, p.data.pubDate, v.nr);
      if (datum > jetzt) continue;
      items.push(eintrag({ titel: v.pinTitel, text: v.pinText, datum, link, guid: `${link}#pin-${v.nr}`, datei: `${p.id}-${v.nr}.jpg` }));
    }
  }
  for (const r of RECHNER) {
    if (thema && r.thema !== thema[0]) continue;
    const name = r.href.split('/')[2];
    const datum = rechnerFreigabe(name);
    if (datum > jetzt) continue;
    items.push(eintrag({
      titel: r.titel, text: kuerzen(`${r.text} Kostenlos und ohne Anmeldung, direkt im Browser.`, 500),
      datum, link: `${SITE.url}${r.href}`, guid: `${SITE.url}${r.href}#pin`, datei: `rechner-${name}.jpg`,
    }));
  }
  for (const c of CHECKLISTEN) {
    if (thema && c.thema !== thema[0]) continue;
    const datum = new Date(c.datum);
    if (datum > jetzt) continue;
    items.push(eintrag({
      titel: `${c.titel} (PDF zum Ausdrucken)`.slice(0, 100), text: kuerzen(`${c.intro} Kostenlos als PDF, ohne Anmeldung: ${c.punkte.map((p) => p[0]).join(' · ')}`, 500),
      datum, link: `${SITE.url}/checklisten/${c.id}/`, guid: `${SITE.url}/checklisten/${c.id}/#pin`, datei: `checkliste-${c.id}.jpg`,
    }));
  }
  return rss({
    title: thema ? `${SITE.name}: ${thema[1].titel}` : SITE.name,
    description: thema ? thema[1].intro : SITE.description,
    site: context.site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: items.filter(Boolean).sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()),
    customData: '<language>de-de</language>',
  });
}
