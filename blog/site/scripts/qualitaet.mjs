// Qualitäts-Check vor jedem Upload: HTML-Fehler (html-validate) und Barrierefreiheit (pa11y-ci, axe, WCAG 2 AA).
// Läuft nur lokal gegen den fertigen Build in dist/. Nichts davon landet auf der Website.
import { execFileSync, spawn } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';

const DIST = new URL('../dist/', import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 4398;

console.log('1/2 HTML prüfen (html-validate) …');
try {
  execFileSync('npx', ['html-validate', `${DIST}**/*.html`], { stdio: 'inherit' });
  console.log('    OK: kein HTML-Fehler.');
} catch {
  console.error('    Fehler gefunden, siehe oben.');
  process.exitCode = 1;
}

// Kleiner Webserver für dist/, damit pa11y die Seiten wie im Browser lädt.
const typen = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = join(DIST, pfad);
  try { statSync(datei); } catch { res.writeHead(404); return res.end(); }
  const ext = pfad.slice(pfad.lastIndexOf('.'));
  res.writeHead(200, { 'content-type': typen[ext] || 'application/octet-stream' });
  createReadStream(datei).pipe(res);
}).listen(PORT);

const seiten = [];
(function sammeln(dir, rel = '/') {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!['pagefind', '_astro', 'bilder', 'fonts'].includes(name)) sammeln(p, rel + name + '/'); }
    else if (name === 'index.html') seiten.push(rel);
  }
})(DIST);

const config = {
  defaults: {
    standard: 'WCAG2AA',
    runners: ['axe'],
    timeout: 90000,
    concurrency: 1,
    // Die Kopfzeile klebt beim Scrollen oben und liegt dann über dem geprüften Text. Das führt zu falschen Kontrastfehlern.
    hideElements: '.site-header',
    // Fälle, die axe nicht automatisch messen kann (Text auf Farbverlauf, Text in Grafiken), als Hinweis statt Fehler.
    levelCapWhenNeedsReview: 'warning',
    // Ohne weiches Scrollen misst axe die Farben an der richtigen Stelle (siehe prefers-reduced-motion in global.css).
    chromeLaunchConfig: { executablePath: CHROME, args: ['--no-sandbox', '--force-prefers-reduced-motion'] },
  },
  urls: seiten.map((s) => `http://localhost:${PORT}${s}`),
};
const cfgDatei = join(tmpdir(), 'pa11yci-handwerksdoktor.json');
writeFileSync(cfgDatei, JSON.stringify(config));

console.log(`2/2 Barrierefreiheit prüfen (pa11y-ci, ${seiten.length} Seiten) …`);
const kind = spawn('npx', ['pa11y-ci', '--config', cfgDatei], { stdio: 'inherit' });
kind.on('exit', (code) => {
  server.close();
  if (code) process.exitCode = 1;
  console.log(process.exitCode ? 'Qualitäts-Check: Es gibt etwas zu beheben.' : 'Qualitäts-Check: alles OK.');
});
