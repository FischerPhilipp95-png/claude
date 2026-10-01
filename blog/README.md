# Blog „Der Handwerksdoktor“ (handwerksdoktor.de)

| Ordner / Datei | Inhalt |
|---|---|
| `site/` | der Blog selbst (Astro), Anleitung in `site/README.md` |
| `site/src/content/artikel/` | Artikel (eine `.mdx`-Datei pro Artikel) |
| `site/src/produkte.ts` | alle Amazon-Produkte (Name, ASIN, Kategorie, Artikel). Neue Produkt-Links hier eintragen |
| `site/src/content/recht/` | Impressum, Datenschutzerklärung, Transparenz & Werbung |
| `recht/checkliste.md` | Abmahnrisiken nach Priorität + technische Grundregeln |
| `recht/textbausteine.md` | Werbehinweise für YouTube-Beschreibung und angehefteten Kommentar |
| `seo/seo-plan.md` | SEO-Strategie, erste 10 Artikel, Werkzeuge, 30-Tage-Plan |
| `seo/keywords.md` | echte Google-Suchanfragen zu den Kanalthemen (`tools/keywords.py`) |

## Stand vor dem Livegang

- [x] E-Mail im Impressum und Empfänger des Kontaktformulars: `info@handwerksdoktor.de` (IONOS-Postfach)
- [x] Postflex-Adresse aus dem Dashboard übernommen (`c/o POSTFLEX PFX-780-231`)
- [ ] Postflex: Zustellungsvollmacht in den Vertragsunterlagen nachsehen, MFA einschalten
- [x] DPMA-Recherche „Handwerksdoktor“: 0 Treffer (30.09.2026)
- [ ] EUIPO/TMview prüfen (EU-Marken)
- [x] Domain `handwerksdoktor.de` bei IONOS (Webhosting)
- [x] IONOS: AV-Vertrag abgeschlossen am 30.09.2026 (PDF kommt per E-Mail, ablegen)
- [ ] IONOS: E-Mail bestätigen, Zwei-Faktor-Anmeldung, Erinnerung vor Ablauf der 12 Monate
- [x] IONOS: Postfach `info@handwerksdoktor.de` angelegt (Absender des Kontaktformulars)
- [x] IONOS: Domain zeigt auf Webspace-Ordner `/public`
- [x] IONOS: SSL-Zertifikat aktiv (gültig bis 30.03.2027, 180-Tage-Erneuerung automatisch)
- [ ] IONOS: Statistik/„Web Analytics“ im Hosting-Paket ausgeschaltet lassen
- [x] Blog hochgeladen und live (01.10.2026): https, Umleitungen, Sicherheits-Header, 404, keine fremden Anfragen geprüft
- [ ] Kontaktformular einmal selbst testen
- [ ] Alten Ordner `handwerksdoktor-upload-final-1` im Webspace löschen, überzählige SFTP-Zugänge löschen
- [ ] Gewerbe anmelden, Kleinunternehmerregelung/USt-IdNr. klären
- [x] Amazon-Partner-Tag `rechn24-21` in `site/src/site.ts` eingetragen
- [ ] Google Search Console + Bing Webmaster Tools, Sitemap einreichen
- [ ] Rechtstexte prüfen lassen (Rechtstexte-Abo oder Anwalt), siehe `recht/checkliste.md`
