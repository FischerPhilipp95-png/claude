import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// lastmod für die Sitemap: updatedDate (sonst pubDate) aus jedem Artikel. So sieht Google, welche Seiten neu überarbeitet sind.
const ARTIKEL_DIR = './src/content/artikel';
const lastmod = Object.fromEntries(
  readdirSync(ARTIKEL_DIR).filter((f) => f.endsWith('.mdx')).map((f) => {
    const text = readFileSync(`${ARTIKEL_DIR}/${f}`, 'utf8');
    const datum = (text.match(/^updatedDate:\s*(\S+)/m) ?? text.match(/^pubDate:\s*(\S+)/m))?.[1];
    return [`https://vollautomatendoktor.de/artikel/${f.replace(/\.mdx$/, '')}/`, datum];
  }),
);

// Maschinenseiten ohne eigenen Beitrag und ohne Video stehen auf noindex (src/pages/maschine/[slug].astro) und fehlen hier in der Sitemap.
const maschinen = JSON.parse(readFileSync('./src/maschinen.json', 'utf8'));
const mitBeitrag = new Set(readdirSync(ARTIKEL_DIR).filter((f) => f.endsWith('.mdx'))
  .flatMap((f) => (readFileSync(`${ARTIKEL_DIR}/${f}`, 'utf8').match(/^maschinen:\s*\[(.*)\]/m)?.[1] ?? '').split(',').map((x) => x.trim().replace(/['"]/g, ''))));
const leereMaschinen = new Set(Object.entries(maschinen).filter(([id, m]) => !(m.videos?.length) && !mitBeitrag.has(id))
  .map(([id]) => `https://vollautomatendoktor.de/maschine/${id}/`));

export default defineConfig({
  site: 'https://vollautomatendoktor.de',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Keine Telemetrie, keine Dev-Toolbar: nichts soll ungefragt Verbindungen aufbauen.
  devToolbar: { enabled: false },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/(kontakt\/(danke|fehler)|suche)\//.test(page) && !leereMaschinen.has(page),
      serialize: (item) => (lastmod[item.url] ? { ...item, lastmod: new Date(lastmod[item.url]).toISOString() } : item),
    }),
  ],
});
