// YouTube-Videos des Kanals und ihre Zuordnung zu Artikeln und Seiten (erzeugt von scripts/videos.mjs).
import daten from './videos.json';
import { SITE } from './site';

export interface Video { id: string; titel: string; typ: 'video' | 'short'; dauer?: number; datum?: string }
const alle = new Map((daten.videos as Video[]).map((v) => [v.id, v]));
const artikel = daten.artikel as Record<string, string>;
const seiten = daten.seiten as Record<string, string>;

export const videoFuerArtikel = (id: string) => (artikel[id] ? alle.get(artikel[id]) : undefined);
export const videoFuerSeite = (pfad: string) => (seiten[pfad] ? alle.get(seiten[pfad]) : undefined);
export const vorschau = (v: Video) => `/bilder/videos/${v.id}.webp`;

/** VideoObject für Google (nur mit bekanntem Datum, sonst ist das Markup unvollständig). */
export function videoSchema(v: Video, beschreibung: string) {
  if (!v.datum) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.titel,
    description: beschreibung,
    thumbnailUrl: [`${SITE.url}${vorschau(v)}`],
    uploadDate: v.datum,
    ...(v.dauer ? { duration: `PT${Math.floor(v.dauer / 60)}M${v.dauer % 60}S` } : {}),
    contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
    inLanguage: 'de-DE',
  };
}
