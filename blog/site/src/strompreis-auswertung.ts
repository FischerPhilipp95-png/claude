// Gemeinsame Auswertung der Viertelstundenpreise (Day-Ahead, DE-LU) für die Seiten „Strompreis heute“, „Strompreis morgen“
// und das Tagesarchiv /strompreis/<datum>/. Werte in ct/kWh netto.
export type Werte = [string, number][];
export const FIX = 16;   // Netzentgelte, Steuern, Umlagen in ct netto (Finanztip, Durchschnitt laut BDEW)
export const AUF = 2;    // Aufschlag eines typischen Anbieters in ct brutto
export const endpreis = (ct: number) => (ct + FIX) * 1.19 + AUF;
export const fmt = (x: number, n = 1) => x.toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n });
export const datumLang = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const datumMittel = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
export const monatLang = (m: string) => new Date(m + '-01T12:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
export const heuteBerlin = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
export const tagPlus = (d: string, n: number) => new Date(new Date(d + 'T12:00:00Z').getTime() + n * 86400e3).toISOString().slice(0, 10);

export interface Auswertung {
  ct: number[]; mittel: number; min: number; max: number; minUhr: string; maxUhr: string;
  best: { i: number; v: number; text: string }; worst: { i: number; v: number; text: string }; negativ: number;
}
export function auswerten(werte: Werte): Auswertung {
  const ct = werte.map((w) => w[1]);
  const mittel = ct.reduce((a, b) => a + b, 0) / ct.length;
  const min = Math.min(...ct), max = Math.max(...ct);
  // Günstigstes und teuerstes zusammenhängendes Zwei-Stunden-Fenster (8 Viertelstunden)
  let best = { i: 0, v: Infinity }, worst = { i: 0, v: -Infinity };
  for (let i = 0; i + 8 <= ct.length; i++) {
    const v = ct.slice(i, i + 8).reduce((a, b) => a + b, 0) / 8;
    if (v < best.v) best = { i, v };
    if (v > worst.v) worst = { i, v };
  }
  const fenster = (i: number) => `${werte[i][0]} bis ${werte[Math.min(i + 8, werte.length - 1)][0]} Uhr`;
  return { ct, mittel, min, max, minUhr: werte[ct.indexOf(min)][0], maxUhr: werte[ct.indexOf(max)][0], best: { ...best, text: fenster(best.i) }, worst: { ...worst, text: fenster(worst.i) }, negativ: ct.filter((x) => x < 0).length };
}
export interface Tag { datum: string; werte: Werte }
export const mitAuswertung = (t: Tag) => ({ ...t, ...auswerten(t.werte) });
