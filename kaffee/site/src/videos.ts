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

// Mediathek: Video-Anleitungen je Thema (src/mediathek.json), für /videos/ und die Themenseiten.
import mediathek from './mediathek.json';
export const MEDIATHEK_WEITERE = { titel: 'Weitere Maschinen', icon: 'coffee', farbe: '#8a6a4f' };
export function mediathekVideos(thema: string): Video[] {
  const ids = (mediathek as Record<string, string[] | string>)[thema];
  return Array.isArray(ids) ? ids.map((id) => alle.get(id)).filter((v): v is Video => v !== undefined) : [];
}
/** Artikel, zu dem ein Video gehört (falls es einen gibt). */
export const artikelZuVideo = (videoId: string) => Object.entries(artikel).find(([, v]) => v === videoId)?.[0];
