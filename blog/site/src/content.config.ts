import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const artikel = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/artikel' }),
  schema: z.object({
    title: z.string().max(70),
    kurztitel: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    thema: z.enum(['Heizung', 'Strom', 'Wasser', 'Klima', 'Küche', 'Sicherheit', 'Werkzeug']),
    bild: z.string(),
    bildAlt: z.string(),
    bildBreite: z.number().default(1200),
    bildHoehe: z.number().default(675),
    bildNachweis: z.string(),
    affiliate: z.boolean().default(false),
    entwurf: z.boolean().default(false),
  }),
});

const recht = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/recht' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { artikel, recht };
