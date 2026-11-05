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
    thema: z.enum(['Kaufen', 'Fasssauna', 'Planung', 'Kosten']),
    // Prüfprotokoll: wann und womit der Beitrag zuletzt geprüft wurde (Bericht in sauna/recherche/<slug>/pruefbericht.md).
    pruefung: z.object({
      datum: z.coerce.date(),
      anleitung: z.string(),            // welche Quelle maßgeblich war (Hersteller, Landesbauordnung, Norm)
      videos: z.number().default(0),    // ausgewertete fremde Videos (Transkripte)
      reddit: z.number().default(0),    // ausgewertete passende Reddit-Diskussionen
      korrektur: z.string().optional(), // was bei der Prüfung geändert wurde
    }).optional(),
    bild: z.string(),
    bildAlt: z.string(),
    bildBreite: z.number().default(1200),
    bildHoehe: z.number().default(675),
    bildNachweis: z.string(),
    affiliate: z.boolean().default(false),
    rechtshinweis: z.boolean().default(false),  // true bei Baurecht/Genehmigung: Kasten „keine Rechtsberatung“ (Briefing Abschnitt 8)
    entwurf: z.boolean().default(false),
  }),
});

const recht = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/recht' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { artikel, recht };
