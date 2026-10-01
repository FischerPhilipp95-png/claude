# Abmahn-Checkliste für den Blog

Stand 30.09.2026. Entwurf, keine Rechtsberatung. Die Punkte sind nach Abmahnrisiko sortiert.
Vor dem Livegang einmal komplett abhaken und die Rechtstexte zusätzlich prüfen lassen
(siehe „Absicherung“ ganz unten).

## Die Grundentscheidung: technisch so bauen, dass kaum etwas schiefgehen kann

Die meisten Abmahnungen gegen kleine Blogs betreffen Dinge, die man gar nicht braucht.
Deshalb gilt für den Aufbau:

| Baustein | So machen wir es | Warum |
|---|---|---|
| Seite | Statisch (Astro), kein WordPress | keine Plugins, die heimlich Daten an Dritte senden |
| Cookies | keine | kein Cookie-Banner nötig, kein TDDDG-Risiko |
| Schriften | Inter lokal aus `assets/fonts/` | Google-Fonts-Abmahnungen (LG München I, 2022) |
| Skripte/CSS | alles vom eigenen Server, kein CDN | jede fremde Domain überträgt die IP-Adresse |
| Amazon-Produkte | Textlinks und Buttons, **keine** Amazon-Bilder per Hotlink | Hotlink-Bilder übertragen die IP an Amazon ohne Einwilligung |
| YouTube | Vorschaubild vom eigenen Server, Video erst nach Klick (youtube-nocookie) | ein normales iframe lädt sofort Google-Dienste |
| Statistik | erstmal nur Google Search Console (läuft ohne Code auf der Seite); später höchstens Umami selbst gehostet | kein Tracking = nichts zu erklären |
| Kontakt | E-Mail + Kontaktformular als kleines PHP-Skript auf dem eigenen Hoster, Spamschutz per Honeypot-Feld | kein Formular-Dienst (Formspree o. Ä.) und kein Google reCAPTCHA, die Daten an Dritte schicken |
| Kommentare, Newsletter | vorerst nicht | beides bringt eigene Pflichten (Moderation, Double-Opt-in) |
| Hosting | deutscher/europäischer Hoster mit AV-Vertrag (Art. 28 DSGVO) | keine Übermittlung in Drittländer |

Datenschutzerklärung (`site/src/content/recht/datenschutz.md`) ist genau auf diesen Aufbau geschrieben.
**Jede Abweichung davon heißt: Datenschutzerklärung anpassen.**

## 🔴 Hohes Risiko

### 1. Bilder und Urheberrecht (häufigste teure Abmahnung)
- Nur eigene Bilder, eigene Animationsframes und Thumbnails, oder Bilder mit klarer Lizenz.
- **Nie** Bilder von Amazon, Herstellerseiten, Google-Bildersuche oder anderen Blogs kopieren.
- Wikimedia-Fotos (z. B. `projects/heizung-video/photos/credits.json`):
  - CC0 / Public Domain: frei, Nennung trotzdem sauber.
  - **CC BY-SA 4.0** (z. B. „Radiator sleutel.jpg“, „Heizkörper innen.jpg“): Pflicht ist die
    Nennung von Urheber, Titel, Quelle **und** Lizenz mit Link, direkt am Bild.
    Bei bearbeiteten Bildern steht dazu „bearbeitet“. Fehlt das, drohen Abmahnungen, die
    gezielt nach Wikimedia-Bildern suchen.
  - Format am Bild: `Foto: Sil10napel, „Radiator sleutel“, Wikimedia Commons, CC BY-SA 4.0 (Link)`
- Herstellerlogos nicht als Deko verwenden.

### 2. Werbekennzeichnung (§ 5a UWG, § 6 DDG)
- Jeder Affiliate-Link direkt am Link mit `*` markiert, oben im Artikel „Anzeige“-Hinweis,
  beides fertig eingebaut (Bausteine für YouTube in `textbausteine.md`).
- Amazon-Pflichtsatz sichtbar: „Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.“
  (Footer jeder Seite + Impressum + YouTube-Beschreibung).
- Gilt genauso für YouTube-Beschreibung und angehefteten Kommentar.

### 3. Impressum (§ 5 DDG, § 18 Abs. 2 MStV)
- Echter Name, ladungsfähige Anschrift: Postflex erfüllt das nach dem Gutachten der
  IT-Recht Kanzlei (17.02.2026) **nur mit Zustellungsvollmacht**. Die gibst du bei Postflex
  ab, sonst kann der Dienst nicht genutzt werden. Schreibweise genau:
  `c/o POSTFLEX PFX-780-231`, Vertrags-ID im Kundenkonto gegenprüfen.
- **E-Mail ist Pflicht**, dazu ein zweiter schneller Kontaktweg: EuGH C-298/07 verlangt keine
  Telefonnummer, aber dann ein Kontaktformular. Wir nehmen das Formular (`/kontakt`).
  Anfragen darüber zeitnah beantworten.
- E-Mail im Impressum und Empfänger des Kontaktformulars: `info@handwerksdoktor.de`
  (Postfach bei IONOS, AV-Vertrag vorhanden). Wird es an Gmail o. Ä. weitergeleitet, muss das
  in die Datenschutzerklärung (Abschnitt 4).
- Von jeder Seite mit einem Klick erreichbar (Footer), Link heißt „Impressum“.
- **Auch der YouTube-Kanal braucht ein Impressum**, sobald er Geld verdient: Link zum
  Blog-Impressum in „Kanal-Info → Links“ eintragen.
- **Keinen** Link zur EU-Streitschlichtungsplattform mehr einbauen, sie ist seit 20.07.2025
  abgeschaltet. Viele Generatoren haben das noch drin.

### 4. Irreführende Aussagen (UWG)
- „Test“, „getestet“, „Testsieger“ nur, wenn wirklich selbst getestet. Sonst „Kaufberatung“,
  „Vergleich“, „Empfehlung“.
- Keine Logos oder Siegel von Stiftung Warentest (lizenzpflichtig).
- Preise nie fest in den Text schreiben. Wenn Preis genannt, dann mit Datum
  („ca. 12 €, Stand 30.09.2026“). Amazon-Regeln verbieten veraltete Preise ohne Zeitstempel.
- Keine erfundenen Erfahrungen und keine übernommenen Amazon-Sternebewertungen.

### 5. Marken
- Vor dem Domainkauf „Handwerksdoktor“ im DPMA-Register (https://register.dpma.de) und bei der
  EUIPO (TMview) suchen. Ist der Name für Handwerk/Dienstleistungen/Medien geschützt, wäre eine
  Domain damit angreifbar. Das betrifft übrigens auch den Kanalnamen.
- Keine Markennamen in der Domain (nicht `bosch-akkuschrauber-test.de`).
- Markennamen im Text zur Beschreibung von Produkten sind erlaubt.

## 🟡 Mittleres Risiko

### 6. Datenschutz (DSGVO, TDDDG)
- Datenschutzerklärung ist eingebaut und ausgefüllt (IONOS als Hoster).
- AV-Verträge abschließen: Hoster und Postflex (macht Postflex standardmäßig).
- Nach dem Livegang mit dem Browser prüfen: DevTools → Netzwerk → es dürfen **nur Anfragen an
  die eigene Domain** erscheinen, bis man ein Video anklickt. Vor jedem Upload prüft das
  `npm run check` in `blog/site/` automatisch für alle Seiten.

### 7. Anleitungen und Haftung
- Bei Strom, Gas und Trinkwasser klar sagen, was Laien dürfen und was nicht.
  Standard-Kasten in solchen Artikeln: „⚠️ Arbeiten an der Elektroinstallation nur durch eine
  Elektrofachkraft“.
- Keine Anleitung zu Eingriffen am Zählerschrank, an der Gastherme oder am Hausanschluss.

### 8. KI-Inhalte (EU AI Act, Art. 50, gilt seit 02.08.2026)
- KI-generierte Texte zu Themen von öffentlichem Interesse müssen gekennzeichnet werden,
  **außer** ein Mensch hat sie redaktionell geprüft und trägt die Verantwortung.
  Deshalb: jeden Artikel selbst lesen und freigeben. Der V.i.S.d.P. steht im Impressum.
- Google hat nichts gegen KI-Hilfe, aber gegen massenhaft erzeugte dünne Seiten
  („scaled content abuse“). Lieber 1 guter Artikel als 10 schwache.

## 🟢 Kein Abmahnrisiko, aber Pflicht (Steuer/Gewerbe)

- Affiliate-Einnahmen sind gewerblich: **Gewerbe anmelden**, bevor Geld fließt
  (Gewerbeamt Greven bzw. Wohnort), danach kommt der Fragebogen zur steuerlichen Erfassung.
- Kleinunternehmerregelung prüfen (seit 2025: Vorjahr ≤ 25.000 €, laufendes Jahr ≤ 100.000 €).
  Amazon zahlt aus Luxemburg, dafür kann eine USt-IdNr. nötig sein. Kurz mit Steuerberater
  oder Finanzamt klären. Hat man eine USt-IdNr., muss sie ins Impressum.
- Amazon-Partnerprogramm: 3 qualifizierte Verkäufe in 180 Tagen, sonst wird das Konto
  geschlossen (Neuanmeldung möglich). Kein Abmahnrisiko, aber Kontosperre bei Regelverstößen:
  keine Affiliate-Links in E-Mails, PDFs oder E-Books, keine Linkkürzer, die das Ziel verschleiern,
  keine eigenen Käufe über eigene Links.
- Barrierefreiheitsstärkungsgesetz: betrifft einen Blog mit Affiliate-Links nicht
  (kein Vertragsabschluss auf der Seite, zudem Ausnahme für Kleinstunternehmen).
  Trotzdem Alt-Texte an Bildern, hilft auch bei SEO.

## Absicherung

Ich habe die Texte nach aktuellem Stand sorgfältig aufgesetzt, bin aber kein Anwalt und kann
keine Abmahnfreiheit garantieren. Für „wirklich nicht abgemahnt werden“ gibt es zwei günstige
Wege:

1. **Rechtstexte-Abo mit Update-Service und Haftungsübernahme**, z. B. IT-Recht Kanzlei
   (hat auch das Postflex-Gutachten geschrieben), Händlerbund oder eRecht24 Premium.
   Kostet grob 10–20 € im Monat. Wenn sich Gesetze ändern, werden die Texte automatisch
   angepasst, und bei einer Abmahnung wegen der Texte hilft die Kanzlei.
2. Einmalige Prüfung durch einen Anwalt für IT-Recht vor dem Livegang.

Solange nur wenig Geld fließt, reicht Weg 1 in der Regel völlig.

## Quellen

- Postflex-Gutachten der IT-Recht Kanzlei, 17.02.2026:
  https://www.postflex.de/media/Gutachten_Postflex_Februar_2026_Aktualisiert.pdf
- eRecht24 zu c/o-Adressen im Impressum: https://www.e-recht24.de/impressum/8369-impressum-c-o-adresse.html
- EuGH C-298/07 (kein Telefon nötig, aber zweiter Kontaktweg):
  https://www.telemedicus.info/article/1008-EuGH-Telefonnummer-keine-Pflichtangabe-im-Impressum.html
- Amazon-Pflichthinweis: https://partnernet.amazon.de/help/node/topic/GHQNZAU6669EZS98
- Kennzeichnung von Affiliate-Links: https://www.anwalt.de/rechtstipps/affiliate-links-richtig-kennzeichnen-rechtliche-anforderungen-und-abmahnrisiken-257393.html
- Google-Fonts-Abmahnungen, aktueller Stand: https://datenschutz-generator.de/abmahnungen-google-fonts/
