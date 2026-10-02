// CSV nur mit den Checklisten-Pins, zum sofortigen Hochladen bei Pinterest („Inhalte importieren“ → CSV).
// Dauerhaft kommen neue Checklisten über die Themen-Feeds (/pinterest/<thema>.xml).
import { CHECKLISTEN } from '../../checklisten.mjs';
import { SITE } from '../../site';
import { THEMEN } from '../../themen';

const feld = (s) => `"${String(s).replace(/"/g, '""')}"`;

export function GET() {
  const zeilen = [['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords']];
  for (const c of CHECKLISTEN) {
    const t = THEMEN[c.thema];
    zeilen.push([
      `${c.titel} (PDF zum Ausdrucken)`.slice(0, 100),
      `${SITE.url}/bilder/pins/checkliste-${c.id}.jpg`,
      t.titel,
      '',
      `${c.intro} Kostenlos als PDF, ohne Anmeldung: ${c.punkte.map((p) => p[0]).join(' · ')}`.slice(0, 500),
      `${SITE.url}/checklisten/${c.id}/`,
      '',
      [t.titel, 'Checkliste', 'zum Ausdrucken', 'Heimwerken'].join(', '),
    ]);
  }
  return new Response(zeilen.map((z) => z.map(feld).join(',')).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
}
