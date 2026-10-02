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
    return [`https://handwerksdoktor.de/artikel/${f.replace(/\.mdx$/, '')}/`, datum];
  }),
);

export default defineConfig({
  site: 'https://handwerksdoktor.de',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Keine Telemetrie, keine Dev-Toolbar: nichts soll ungefragt Verbindungen aufbauen.
  devToolbar: { enabled: false },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/(kontakt\/(danke|fehler)|suche)\//.test(page),
      serialize: (item) => (lastmod[item.url] ? { ...item, lastmod: new Date(lastmod[item.url]).toISOString() } : item),
    }),
  ],
});
