/** Lesezeit in Minuten aus dem Artikeltext (200 Wörter pro Minute), ohne Komponenten und Ausdrücke. */
export function lesezeit(body: string | undefined): number {
  const woerter = (body ?? '').replace(/<[^>]+>|\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(woerter / 200));
}
