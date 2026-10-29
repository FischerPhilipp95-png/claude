# Haus in Steinen offiziell machen (Stand 29.10.2026)

Alles, was Geld kostet, eine Unterschrift oder ein Passwort braucht, machst du. Den Rest baue ich. Passwörter nie in den Chat
oder in den Code, nur als GitHub-Secrets. Reihenfolge so, dass nichts aufeinander wartet.

## A. Du: Geschäft und Konten (ein Nachmittag)

1. **Gewerbe.** Dein bestehendes Gewerbe reicht, der Verkauf digitaler Anleitungen ist Handel. Wenn der eingetragene
   Gegenstand sehr eng gefasst ist, beim Gewerbeamt eine Änderungsanzeige stellen („Verkauf digitaler Bauanleitungen“).
2. **Steuer, einmal mit dem Steuerberater klären.** Stichworte: Kleinunternehmerregelung ja oder nein (bei 29 € je Haus
   entscheidet das über den Preis), digitale Leistungen an Privatkunden in anderen EU-Ländern laufen ab 10.000 € Umsatz im
   Jahr über das OSS-Verfahren. Bis dahin: deutsche Regeln, Rechnungen über Stripe.
3. **Name prüfen.** „Haus in Steinen“ bei https://register.dpma.de und https://www.tmdn.org/tmview suchen. Kein Treffer
   nötig, aber kein identischer Treffer in Klasse 28 (Spielwaren) oder 41 (Anleitungen). Eintragung der eigenen Marke
   ist optional, rund 300 € beim DPMA.
4. **Domain.** hausinsteinen.de bei IONOS in den bestehenden Vertrag, eigener Ordner im Webspace, Cloudflare davor wie bei
   vollautomatendoktor.de (Anleitung in `kaffee/EINRICHTUNG.md`, Abschnitt 1 und 1b). SFTP-Benutzer für den Ordner anlegen,
   Zugang als Secrets `STEINE_SFTP_USER` und `STEINE_SFTP_PASSWORD` in GitHub.
5. **Stripe.** Konto unter deinem Gewerbe, Identitätsprüfung, Bankkonto, Stripe Tax einschalten (rechnet die Umsatzsteuer
   je Land), Rechnungen automatisch. Den geheimen Schlüssel und das Webhook-Geheimnis als Secrets `STEINE_STRIPE_SECRET`
   und `STEINE_STRIPE_WEBHOOK` in GitHub, den öffentlichen Schlüssel darfst du mir nennen.
6. **E-Mail.** Postfach hello@hausinsteinen.de bei IONOS, dazu ein Versandkonto bei Resend oder Brevo für Bestell- und
   Liefermails (kostenloser Tarif reicht am Anfang). API-Schlüssel als Secret `STEINE_MAIL_KEY`.
7. **LEGO-Partnerprogramm.** Anmeldung über Rakuten Advertising (LEGO Affiliate Program, Deutschland), rund 3 % auf
   Pick-a-Brick-Käufe. Freischaltung dauert Tage bis Wochen, deshalb früh beantragen.
8. **Pick-a-Brick-Preise prüfen.** Einmal von deinem Anschluss das Skript laufen lassen, das ich dir dafür gebe; die
   Cloud wird von lego.com geblockt. Ergebnis landet als Datei im Repo und wird Preisliste.
9. **Rechtstexte.** Impressum, AGB mit Lieferfrist 3 Tage und Geld-zurück-Zusage, Widerrufsbelehrung mit Verzicht für
   digitale Inhalte, Datenschutz mit Fotos (Zweck Planung, Löschung nach 90 Tagen), OpenStreetMap-Hinweis. Ich schreibe
   die Entwürfe, du lässt sie vor dem Start einmal prüfen (Anwalt oder Dienst wie IT-Recht-Kanzlei oder Händlerbund).

## B. Ich: Seite, Bestellung, Auslieferung (zwei bis drei Wochen)

1. **Seite** als `klemmbausteine/site/` nach dem Muster der anderen Seiten, Eintrag in `websites/websites.json`, Upload und
   Prüfungen über `websites/erzeugen.py`. Konfigurator, Anlässe, Makler, Preise, FAQ, Rechtstexte, OpenStreetMap-Hinweis.
2. **Adressabruf** über ein PHP-Skript auf dem Webspace: fragt Nominatim mit Zwischenspeicher (höchstens eine Anfrage je
   Sekunde, Ergebnisse 30 Tage gespeichert), Overpass als zweite Quelle, Antwort an den Konfigurator.
3. **Bestellung**: Formular mit Foto-Upload an PHP (Fotos in einen Ordner außerhalb des Webroots), Weiterleitung zu Stripe
   Checkout, Webhook zurück an PHP, Bestellung als Datei mit Nummer, Mail an dich und an den Kunden.
4. **Auslieferung**: Ein GitHub-Actions-Lauf holt die Bestellung, ich lese Fotos und Maße ein (Fensterraster, Anbau,
   Farben), der Generator baut Modell, Anleitung, Teileliste, Wunschliste, 3D-Seite und Film, legt alles unter einem
   privaten Link ab. Freigabe-Mail an dich, ein Klick, der Kunde bekommt seine Mail. Später ohne Freigabe.
5. **Makler**: Gutscheincodes in Stripe, Staffelpreise, Deckblatt mit Logo aus dem Bestellformular.
6. **Start**: 20 kostenlose Häuser als Gutscheincodes, Seiten für die Suchbegriffe, Pins, erste Shorts aus den
   Beispielfilmen, Makler-Anschreiben als Vorlage.

## C. Was es kostet, laufend

Domain etwa 1 € im Monat, Cloudflare kostenlos, Stripe 1,5 % plus 0,25 € je Zahlung aus der EU, Mailversand kostenlos bis
einige tausend Mails, GitHub Actions im Rahmen des bestehenden Kontos. Keine Festkosten darüber hinaus.

## D. Entscheidungen, die vor Schritt B.1 feststehen müssen

1. Name und Domain (Vorschlag hausinsteinen.de, war am 28.10.2026 frei).
2. Kleinunternehmer ja oder nein (Preise brutto 29 € bleiben, ändert nur die Rechnung).
3. Preise 29 €, 49 €, 149 € und die Makler-Staffel 19 € ab 10, 15 € ab 25.
