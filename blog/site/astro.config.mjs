import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://handwerksdoktor.de',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Keine Telemetrie, keine Dev-Toolbar: nichts soll ungefragt Verbindungen aufbauen.
  devToolbar: { enabled: false },
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !/\/kontakt\/(danke|fehler)\//.test(page) }),
  ],
});
