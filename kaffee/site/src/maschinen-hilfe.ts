// Hilfsfunktionen für Maschinenseiten: welche Beiträge und Videos gehören zu einer Maschine?
import type { CollectionEntry } from 'astro:content';
import { MASCHINEN, type Maschine } from './maschinen';
import { THEMEN, type Thema } from './themen';
import { mediathekVideos, type Video } from './videos';
import daten from './videos.json';

type Post = CollectionEntry<'artikel'>;
const alleVideos = new Map((daten.videos as Video[]).map((v) => [v.id, v]));

export interface MaschinenInfo extends Maschine { id: string; marke: (typeof THEMEN)[Thema]; titel: string }

export const maschinenListe = (): MaschinenInfo[] =>
  Object.entries(MASCHINEN as Record<string, Maschine>).map(([id, m]) => ({
    ...m, id, marke: THEMEN[m.hersteller], titel: `${THEMEN[m.hersteller].titel.split(' ')[0]} ${m.name}`,
  }));

/** Beiträge genau für diese Maschine. */
export const beitraegeFuer = (id: string, posts: Post[]) => posts.filter((p) => p.data.maschinen.includes(id));
/** Beiträge, die für alle Maschinen der Marke gelten, plus allgemeine Pflege (ohne Maschinenzuordnung). */
export const allgemeineFuer = (m: Maschine, posts: Post[]) =>
  posts.filter((p) => p.data.maschinen.length === 0 && (p.data.thema === m.hersteller || p.data.thema === 'Pflege'));
export const videosFuer = (m: Maschine) => (m.videos ?? []).map((id) => alleVideos.get(id)).filter((v): v is Video => v !== undefined);

/** Hat die Maschine eigenen Inhalt (Beitrag oder Video)? Nur dann gibt es eine Seite. */
export const hatSeite = (m: MaschinenInfo, posts: Post[]) => beitraegeFuer(m.id, posts).length + videosFuer(m).length > 0;

/** Bricht den Build ab, wenn ein Artikel eine Maschine nennt, die es in src/maschinen.ts nicht gibt (Tippfehler). */
export function pruefeZuordnung(posts: Post[]) {
  for (const p of posts) for (const id of p.data.maschinen) {
    if (!(id in MASCHINEN)) throw new Error(`Artikel ${p.id}: unbekannte Maschine „${id}“ (siehe src/maschinen.ts)`);
  }
}
export { mediathekVideos };
