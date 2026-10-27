// Alle Rechner: Übersicht /rechner/ und Zähler auf der Startseite.
// thema: Pinnwand bzw. Themen-Feed für den Pinterest-Pin des Rechners (scripts/pins.mjs, /pinterest/<thema>.xml).
export const RECHNER = [
  { href: '/rechner/stromkosten/', icon: 'calculator', farbe: '#ffd400', thema: 'Strom', titel: 'Stromkosten-Rechner', text: 'Was kostet mein Gerät pro Tag, Monat und Jahr? Watt und Nutzungsdauer eingeben, fertig.' },
  { href: '/rechner/balkonkraftwerk/', icon: 'sun', farbe: '#ff741c', thema: 'Strom', titel: 'Balkonkraftwerk-Rechner', text: 'Ertrag, Ersparnis und Amortisation, ohne und mit Speicher, mit den Regeln 2026.' },
  { href: '/rechner/dynamischer-stromtarif/', icon: 'activity', farbe: '#3b82f6', thema: 'Tarif', titel: 'Dynamischer Stromtarif: Spar-Rechner', text: 'Festpreis oder Börsenstrom? Mit echten Börsenpreisen, E-Auto, Wärmepumpe und Smart-Meter-Kosten: Was bleibt im Jahr übrig?' },
  { href: '/rechner/e-auto-laden/', icon: 'car', farbe: '#3b82f6', thema: 'Tarif', titel: 'E-Auto-Ladekosten-Rechner', text: 'Was kostet das Laden zu Hause mit Festpreis, dynamischem Tarif oder Netzentgelt-Rabatt? Pro 100 km und pro Jahr.' },
  { href: '/rechner/smart-meter-check/', icon: 'gauge', farbe: '#3b82f6', thema: 'Tarif', titel: 'Smart-Meter-Check', text: 'Bekommst du einen Smart Meter, bist du sogar verpflichtet, und was darf er kosten? Drei Angaben, fertig.' },
  { href: '/rechner/netzentgelt-14a/', icon: 'plug-zap', farbe: '#3b82f6', thema: 'Tarif', titel: '§ 14a Netzentgelt-Rechner', text: 'Modul 1, 2 oder 3: Welcher Netzentgelt-Rabatt bringt bei Wärmepumpe, Wallbox oder Speicher am meisten?' },
  { href: '/rechner/heizung-diagnose/', icon: 'stethoscope', farbe: '#ff741c', thema: 'Heizung', titel: 'Heizungs-Diagnose', text: 'Heizkörper kalt, Heizung gluckert, Druck falsch? Bis zu drei Fragen, dann weißt du, woran es liegt und was du selbst tun kannst.' },
  { href: '/rechner/heizkosten-sparen/', icon: 'thermometer', farbe: '#ff741c', thema: 'Heizung', titel: 'Heizkosten-Rechner', text: 'Was bringen ein Grad weniger, smarte Thermostate und der hydraulische Abgleich?' },
  { href: '/rechner/heizkosten-vergleich/', icon: 'air-vent', farbe: '#ff741c', thema: 'Heizung', titel: 'Heizkosten-Vergleich', text: 'Klimaanlage, Gas oder Heizlüfter: Was kostet die Wärme pro Tag und pro Jahr?' },
  { href: '/rechner/standby/', icon: 'power', farbe: '#ffd400', thema: 'Strom', titel: 'Stand-by-Rechner', text: 'Was kosten deine Geräte im Stand-by, und was spart eine Leiste mit Schalter?' },
  { href: '/rechner/duschkosten/', icon: 'shower-head', farbe: '#39a8ff', thema: 'Wasser', titel: 'Duschkosten-Rechner', text: 'Was kostet eine Dusche, und wie viel spart ein Sparduschkopf?' },
  { href: '/rechner/tropfender-wasserhahn/', icon: 'droplet', farbe: '#39a8ff', thema: 'Wasser', titel: 'Tropfender Wasserhahn', text: 'Wie viel Wasser und Geld geht im Jahr verloren?' },
  { href: '/rechner/feuchte-diagnose/', icon: 'cloud-drizzle', farbe: '#03b84c', thema: 'Klima', titel: 'Feuchte-Diagnose', text: 'Fenster beschlagen, Schimmel, muffige Luft? Bis zu drei Fragen, dann weißt du, woran es liegt und was du selbst tun kannst.' },
  { href: '/rechner/taupunkt/', icon: 'droplets', farbe: '#03b84c', thema: 'Klima', titel: 'Taupunkt- und Schimmel-Rechner', text: 'Ab welcher Wandtemperatur wird es nass? Taupunkt und Schimmelgrenze aus Temperatur und Luftfeuchtigkeit.' },
  { href: '/rechner/duebel/', icon: 'brick-wall', farbe: '#12b5a5', thema: 'Werkzeug', titel: 'Dübel-Finder', text: 'Welcher Dübel für Beton, Ziegel, Porenbeton oder Rigips? Wand und Gewicht wählen, fertig.' },
];
