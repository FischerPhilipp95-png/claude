---
name: handwerksdoktor-short
description: 'Neuen YouTube-Short oder ein kurzes Langvideo für Der Handwerksdoktor erstellen: TubeLab-Recherche, Idee, Skript, Referenzfotos, Titel, Beschreibung, Thumbnail und fertige JSON-Datei für make_short.py. Auslöser: "Neuer Short", "Neues Video", "Symptom-Video", "Gerätetest".'
---

# Neuer Short für „Der Handwerksdoktor“

Ziel: Aus „Neuer Short“ (optional mit Thema) entsteht eine fertige JSON-Datei. Der Nutzer lädt sie in seinen Downloads-Ordner und startet per Doppelklick auf „Short erstellen“ (Schreibtisch). Alles andere läuft automatisch. Der Nutzer will nichts selbst prüfen, filmen oder entscheiden, außer die Idee abzunicken. Immer auf Deutsch antworten, kurz und in einfachen Schritten.

Kanal: @derhandwerksdoktor (Kanal-ID UClteHHjbqHnhSvgMCYEgH9A), deutsch, Videos faceless (KI-Bilder, Thumbnails mit Kanal-Porträt), Heimwerken: Reparieren, Renovieren, Werkzeug, Trockenbau, Sanitär, Heizung, Haus & Garten, dazu Kaffeevollautomaten und Haushaltsgeräte. Zielgruppe: Männer 35–54. Kanal nutzt Amazon-Partnerlinks und führt auf die eigenen Websites handwerksdoktor.de (Haus, Heizung, Werkzeug) und vollautomatendoktor.de (Kaffee).

## 0. Was der Kanal gelernt hat (Analytics 13.09.–11.10.2026 + TubeLab, Pflichtlektüre vor jeder Idee)

Nur noch drei Videotypen, alles andere hat nachweislich nichts gebracht:

| Typ | Länge | Takt | Was es bringt |
|---|---|---|---|
| **A. Symptom-Video** (Suche): Gerät + Fehler als Frage, dann Lösung | 90–150 s, 16:9 | 2 pro Woche | Dauer-Traffic. Alle 10 Outlier des Kanals sind so gebaut (DeLonghi Milchschaum 16.000 Aufrufe, 10,7-fach; Krups entkalken 7.100; Philips LatteGo 7.400). CTR 12–19 %, Retention 60–82 %. Vorbild ersatzteilshop TV: „Spülmaschine Wasserhahn-Symbol? Was du sofort tun kannst!“ 42.000 (14,5-fach), Median 131 s. |
| **B. Gerätetest mit Preis und Messwert** (saisonal, Affiliate) | 4–6 min, 16:9 | 1 pro Woche | Abos. Klima-Vergleiche im Sommer brachten 33 Abos. Vorbild Onkel Kramer: „Heizen ohne Strom für 74,90 € – genial, aber DAS musst du wissen!“ 159.000; „Dieselheizung: So warm wird es nach 60 Minuten!“ 251.000. Eigenes TRESKO-Gasheizung-Video ist dieses Format und hatte die beste CTR der neuen Longs (6,9 %). |
| **C. Short mit Zahl oder Fehler-Warnung** | 20–40 s, 9:16 | 2–3 pro Woche | Reichweite + Abos. Die vier Shorts vom 09./10.10. („1 Stunde heizen: DAS kostet“, „Ich lasse absichtlich Wasser aus meiner Heizung“, „Fenster kippen? Damit züchtest du Schimmel“, „Teelichtofen: Kauf ihn nicht, bevor du DAS weißt“) hatten je Aufruf 14-mal mehr Likes und 9-mal mehr Abos als alles andere. Vorbilder: „Teelicht-Heizung: Viermal teurer als Gas!“ (Onkel Kramer, 35.000), „Diesen Fehler beim Fernseher NICHT machen!“ (760.000). |

Nie wieder:
- **6-Sekunden-Shorts** und themenfremde Shorts (Gesundheit, Finanzen, Supermarkt, Autos). 42 Stück brachten 67.000 Aufrufe, aber 34 Likes und 9 Abos; die Aufrufe waren Loops. Sie haben das Publikum verwässert, danach klickte niemand mehr die neuen langen Videos (CTR 0,5–4 % trotz 30.000 Impressionen).
- Erklärvideos ohne Problem („Wie kommt der Strom ins Haus“, „Wasserleitung erklärt“, „Made in Germany“): 55 Aufrufe, 0 Abos.
- Tests und Listen über 7 Minuten (EasyCool 12:38 min: 12,6 % Retention). Die alten 1,5–2-Minuten-Videos halten 60–80 %.
- Themenfremde Longs (E-Auto, DIY-Handbuch, 20 Garten-Hacks) und gesichtslose „25 vergessene Tricks“-Listen.
- Falschinformation als Köder (siehe 4a).

Der Engpass ist der Klick, nicht der Inhalt: Wo geklickt wurde, lag die Retention der neuen Videos bei 42–51 %. Titel und Thumbnail entscheiden (Abschnitt 8). Beispiel: „Heizung einschalten? Erst diese 5 Checks vor dem Winter“ (361 Aufrufe) ist inhaltlich dasselbe wie „Bevor du im Herbst heizt, mach DAS (oder du zahlst dafür): Installateur erklärt“ (Meister Markus, 26.865 Aufrufe bei 39 Abonnenten).

## 1. Recherche (TubeLab)

- `search_related_outliers` mit relatedChannelId UClteHHjbqHnhSvgMCYEgH9A, type short, language ["de"], publishedAtFrom = vor 30 Tagen.
- `search_outliers` mit Nischen-Begriffen, type short, language ["de"], letzte 30 Tage, sortBy averageViewsRatio, averageViewsRatioFrom 2. Themenfremde Treffer aussortieren.
- Bei den 2–3 stärksten Treffern `get_video_transcript` und `get_video_comments` lesen (gratis): Hook, Aufbau, Diskussionen.
- `get_channel_shorts` für den eigenen Kanal: keine Themen wiederholen.
- Saison beachten (Herbst/Winter: Heizung, Fenster, Feuchtigkeit; Frühling: Garten, Terrasse).
- Kommentare der eigenen letzten Shorts lesen (`get_video_comments`, gratis): Zuschauerfragen sind die besten nächsten Themen („Antwort auf deinen Kommentar“).
- Bei den Vorbildern auch prüfen, WAS die Top-Kommentare auslöst (Fachbegriff, eigene Erfahrung, Alternative, Streitpunkt) und das Muster für Abschnitt 4a nutzen.
- Für Typ A (Symptom-Video): `search_outliers` mit „<Gerät> <Fehlercode/Symptom>“, type video, durationTo 300, publishedAtFrom "year". Vorbildkanäle: ersatzteilshop TV (UCswaJJq4UYbs3hkIOK1akJw), Basti HW. Themen, die dort als Outlier laufen und auf dem eigenen Kanal fehlen, zuerst.
- Für Typ B (Gerätetest): Onkel Kramer (UCYgke9pwfK2bIYTbjbnaaDQ) mit `get_channel_videos` (gratis) ansehen: welche günstigen Geräte laufen gerade, welche Messung steht im Titel.
- Jeder Treffer muss zum Kanal passen (Haus, Heizung, Werkzeug, Küche, Haushaltsgeräte, Kaffee). Themenfremde Outlier sind kein Argument, egal wie groß.

## 2. Idee

Ohne Thema: 3 Ideen mit Hook, Ablauf, Auflösung und viralem Vorbild (Titel, Kanal, Aufrufe, Faktor) vorschlagen, eine empfehlen. Bei „mach einfach“ oder festem Thema: direkt die beste nehmen.

Jede Idee gehört zu Typ A, B oder C aus Abschnitt 0 und zu einer Serie (Abschnitt 4a, Punkt 5). Im Vorschlag Typ und Serie nennen.

Muster: „Sieht falsch aus, ist aber richtig“; Gegner/alter Meister („So einen Blödsinn …“); Test/Vergleich mit messbarem Ergebnis; Geld/Zahlen im Hook; Hook auf den Zuschauer bezogen („dein Heizkörper“, „diese Woche“); Konsequenz („oder du zahlst dafür“, „bevor du kaufst“); Fehler-Warnung („Diesen Fehler NICHT machen“).

Themenvorrat nach Typ (Stand Okt. 2026, Lücken zuerst):
- A Kaffee: Siemens EQ „Wassertank leer“ obwohl voll, Jura „Tresterbehälter leeren“ bleibt, Melitta Caffeo entkalken, DeLonghi „Bohnenbehälter leer“, Philips „Brühgruppe einsetzen“ geht nicht.
- A Haushalt (noch leer auf dem Kanal): Spülmaschine Wasserhahn-Symbol, E24/E15, Salzanzeige leuchtet, Waschmaschine pumpt nicht ab (eigenes Video: 1.600 Aufrufe), Trockner heizt nicht, Backofen löst FI aus.
- A Heizung: Heizkörper oben warm, unten kalt; Thermostat lässt sich nicht drehen; Heizung gluckert; Therme F28/F22; Druck fällt.
- B Winter: Heizlüfter vs. Ölradiator vs. Infrarot mit Stromzähler, Teelichtofen gemessen, Elektroheizung unter 80 €, Petroleumofen drinnen, Heizdecke statt Raum, Fensterfolie gemessen. B Sommer: Klima (mobil, Split, BTU, Marken).
- C: „1 Stunde [Gerät] kostet [X] €“, „[Ding] ist [N]-mal teurer als Gas“, „Diesen Fehler bei [Gerät] NICHT machen“, „Ich lasse absichtlich …“, „Kauf [Ding] nicht, bevor du DAS weißt“.

Sicherheit: Keine Anleitungen für Arbeiten am Stromnetz (nur Elektrofachkraft), Gas oder tragende Bauteile. Bei Risiken kurzer Sicherheitshinweis.

## 3. Fakten prüfen

Jede technische Aussage per Websuche gegen seriöse Quellen prüfen. Keine erfundenen Zahlen, Messwerte oder Ersparnisse.

## 4. Skript

- 20–40 Sekunden, 12–15 Abschnitte („shots“). Nie unter 15 Sekunden (6-Sekunden-Shorts sind verboten, siehe Abschnitt 0).
- Der Hook (Abschnitt 01) enthält die Zahl, die Provokation oder die Fehler-Warnung aus dem Titel, nicht nur das Thema.
- Übergänge mit „denn“, „aber“, „also“, „weil“, „obwohl“.
- Auflösung erst am Ende; letzter Abschnitt bricht ab und führt in den ersten Satz zurück (z. B. „Und genau deshalb –“).
- 3–5 kurze gelbe Bildschirmtexte, sonst leer.

Untertitel-Stil (seit Okt. 2026, nach Analyse der Top-Shorts der letzten 3 Monate): make_short.py blendet den gesprochenen Text automatisch als fette Großbuchstaben ein, 1–3 Wörter gleichzeitig, das gesprochene Wort gelb. Deshalb:
- Sätze kurz und mit Kommas/Punkten gliedern – an Satzzeichen werden die Untertitel-Blöcke gesetzt und mit dem Ton synchronisiert.
- Keine langen Wörter über 16 Buchstaben, wenn es ein kürzeres gibt (werden sonst klein).
- Bildschirmtexte weiter sparsam (3–5), der Hook-Text bleibt groß oben.
- Rangliste/Countdown-Shorts (z. B. „Was kostet 1 Stunde heizen?“): Feld "liste" auf oberster Ebene nutzen. Das Programm zeigt dann oben einen schwarzen Balken mit Titel und darunter die Plätze 1–5, die sich Abschnitt für Abschnitt füllen (leere Plätze machen neugierig). Format:
  "liste": {"titel": "1 STUNDE HEIZEN", "untertitel": "Was kostet das?", "eintraege": [{"platz": 5, "text": "Heizlüfter 76 ct", "shot": "02"}, ...]}
  Mit "liste" werden die Bildschirmtexte der Abschnitte nicht angezeigt (nur Rangliste + Untertitel + Aufforderungen).

## 4b. Langvideos (16:9): Typ A Symptom-Video oder Typ B Gerätetest

Mit `"format": "video"` auf oberster Ebene baut make_short.py ein 16:9-Video statt eines Shorts. Zwei Längen, nie dazwischen und nie darüber:

**Typ A Symptom-Video, 90–150 s, 220–350 Wörter, 20–35 Bilder.** Aufbau wie die eigenen Kaffee-Outlier und ersatzteilshop TV:
- Hook (0–8 s): Symptom genau benennen, wie der Zuschauer es sieht („Alle Lampen blinken rot, kein Wasser kommt“), dann Versprechen („in zwei Minuten läuft sie wieder“).
- 2–4 Ursachen von häufig nach selten, je ein Kapitel (`"kapitel"`), pro Ursache: woran man sie erkennt → was tun → Bildschirmtext mit dem Prüfschritt.
- Schluss (10 s): Wenn nichts hilft, was dann (Ersatzteil, Kundendienst), Kommentar-Frage, Verweis auf die passende Website-Seite in der Beschreibung. Kein Loop.
- Gerät und Fehlercode in Titel, Hook, Bildschirmtext und Tags identisch schreiben (Suche).

**Typ B Gerätetest, 4–6 min (nie über 6:30), 550–800 Wörter.** Aufbau nach den erfolgreichsten deutschen Heimwerker-Langvideos (TubeLab, Okt. 2026: Onkel Kramer „Heizen ohne Strom für 74,90 €“ 159.000, „Dieselheizung: So warm nach 60 Minuten“ 251.000; „Top-5 Kapp- und Gehrungssägen“ 57x, „Wallboxen: Diese Fehler“ 55x):
- Der Titel verspricht Preis UND Messwert; das Video muss den Messwert liefern (Stromzähler, Thermometer, Stoppuhr). Keine Messung, kein Typ-B-Video.
- Hook (0–15 s): Problem + was es kostet + Versprechen („Platz 1 hat einen Haken“).
- Nach ca. 20 s: „Rechnung/Links in der Beschreibung“. Mitten-CTA (Daumen hoch) bei ca. 40 %.
- 3–7 Kapitel à 30–50 s: Feld `"kapitel": "Heizöl"` am ersten Abschnitt des Kapitels → Kapitel-Karte, Whoosh, YouTube-Kapitel in upload.txt. Muster pro Kapitel: was fast alle machen → warum falsch → so richtig → für wen → Übergang („der nächste Punkt ist noch teurer“).
- Zusammenfassung (20 s) + Kommentar-Frage + Verweis auf ein eigenes Video ("verknuepfen"). Kein Loop-Abschnitt.
- 1 Bild pro 4–5 s, Zahlen als Wörter ausschreiben („dreitausendsechshundertfünfzig“), damit die Stimme sie richtig liest.
- Bildschirmtexte mit den Zahlen pro Kapitel („Heizöl: ca. 3.650 € im Jahr“). Kein "liste"-Feld bei Videos.
- Thumbnail-Prompt als 16:9 beschreiben („Wide 16:9 photo …“).
- Bildqualität: Bei Videos nimmt das Programm automatisch das BESTE Bildmodell bis 0,06 $/Bild und erzeugt jedes Bild doppelt (Prüfer behält das bessere). Kosten ca. 2–3 $ pro Video.
- Echtes Material zuerst: Für jedes Motiv, das es als Stock-Clip gibt (Hände am Thermostat, Heizkörper, Werkzeug, Wasser, Haus von außen), statt "prompt" ein Feld `"clip": "<englischer Suchbegriff>"` (Pexels-Videoclip, läuft als Schleife) oder `"foto": "<Suchbegriff>"` (Pexels-Foto). Der Prüfer wählt den besten von 4 Kandidaten; findet er nichts Passendes, entsteht automatisch ein KI-Bild. Ziel: 60–80 % der Motive von Pexels. Suchbegriffe konkret und englisch („hand adjusting radiator thermostat valve close up“).
- KI-Bewegung nur für die ersten 2–3 Hook-Bilder: `"bewegung": true` beim Bild (Text-zu-Video, ca. 0,2–0,5 $ pro Clip). Nie für mehr als 3 Bilder pro Video.

Bild-Stil für Videos (als "stil_bild"): "Photorealistic 16:9 photo shot on a full-frame camera with a 35mm lens, shallow depth of field, natural light, real German house, muted natural colors, fine film grain, editorial documentary look. No faces. No text, no letters, no numbers, no logos, no brand names, no watermarks."

Referenzfotos: Statt Unsplash-Links reicht jetzt `"suche": "<deutscher Suchbegriff>"` in der Vorlage – das Programm holt die 6 besten Google-Bilder per Serper (nur als KI-Vorlage). Unsplash-Kandidaten dürfen zusätzlich bleiben.

## 4a. Interaktion: Kommentare, Likes, Abos (Pflicht)

Was TubeLab zeigt (Stand Okt. 2026):
- Kommentare entstehen, wenn Fachleute und Heimwerker mitreden können. „Dieser Tapeten Trick macht perfekte Nähte unsichtbar“ (ContentNetGermany, 709 Tsd. Aufrufe, 260 Kommentare) und „Werkstätten werden diesen Trick mit Motorgehäuse hassen“ (Alu Löffel, 826 Tsd., 443 Kommentare): Die Top-Kommentare nennen den Fachbegriff („Doppelschnitt“), erzählen eigene Erfahrungen („hab ich in der Lehre 1982 gelernt“) oder bringen Alternativen („Normalerweise nimmt man Toastbrot“).
- Alu Löffel fordert zum Teilen auf („schick das einem guten Freund“) und fragt am Ende „Was haltet ihr davon?“.
- Falschinformation als Köder bringt zwar Kommentare, aber fast nur Hass: „99 % machen Trockenbauwände FALSCH“ (Rudi Singer) – 146 Kommentare, fast alle „Schwachsinn“, nur 0,7 % Likes statt sonst 1–3 %. Das schadet Vertrauen und Abos. NIE machen.

Regeln für jeden Short:
1. Genau EINE Kommentar-Frage, mit einem Wort oder einer kurzen Erfahrung beantwortbar. Typen: A oder B („Schlüssel oder Schraubenzieher?“), Fachbegriff („Wie heißt dieser Trick bei Profis?“), Erfahrung („Wie alt ist deine Therme?“), Schätzfrage. Beide Antworten müssen fachlich vertretbar sein.
2. Die Frage steht als Bildschirmtext im Auflösungs-Abschnitt oder im Abschnitt davor (kurz, ohne Emojis – die Schrift kann keine Emojis). Nicht am Ende sprechen, damit der Loop erhalten bleibt.
3. "kommentar_anpinnen": dieselbe Frage etwas ausführlicher, du-Form, mit 2 Antwortmöglichkeiten und einem Satz Zusatznutzen (z. B. „Ich beantworte die häufigste Frage im nächsten Short.“). Emojis erlaubt.
4. Beschreibung: direkt nach dem Hook-Satz eine Teilen-Zeile („Schick das jemandem, der gerade friert.“), am Ende eine Abo-Zeile mit Serien-Versprechen („Folge für den nächsten Heizungs-Fehler.“).
5. Abos über Serien: Jedes Video gehört zu einer dieser Reihen und nennt sie in Beschreibung und Abo-Zeile: „Heizungs-Fehler“ (Typ A/C), „Was kostet 1 Stunde …“ (Typ C), „Günstig heizen im Test“ (Typ B), „Kaffeevollautomat-Fehler“ (Typ A), „Haushaltsgeräte-Fehler“ (Typ A). Kein gesprochenes „Abonniert“ am Ende (kostet Zuschauzeit und bricht den Loop).
6. Likes über einen klaren Aha- oder Spar-Moment in der Auflösung (Ersparnis nur nennen, wenn belegt).
7. "verknuepfen": Titel eines passenden eigenen Shorts aus `get_channel_shorts` (wird als „Zugehöriges Video“ verlinkt), sonst weglassen.
8. Website-Link: In "kommentar_anpinnen" nach der Frage immer die passende Seite nennen (handwerksdoktor.de/artikel/…, /rechner/…, /checklisten/… oder vollautomatendoktor.de/…; Liste in `projects/youtube-links.md` im Repo, sonst die Startseite). Bei Shorts ist nur der angepinnte Kommentar klickbar, bei Videos zusätzlich die erste Zeile der Beschreibung.

## 5. Bilder

- 1 Bild pro ~1,5 s Sprechzeit. Prompts auf Englisch, technisch genau.
- Bevorzugt Nahaufnahmen von Bauteilen; möglichst keine Hände, die Werkzeug bedienen.
- Keine lesbaren Zahlen/Texte im Bild („unreadable“).
- Pro Bild „vorlage“ setzen, wenn ein echtes Bauteil zu sehen ist, plus 1–2 „pruefen“-Kriterien auf Deutsch.
- Letzter Loop-Abschnitt: "bilder_wie": ["01-1"].

## 6. Referenzfotos (vorlagen)

Pro Bauteil 4–6 Kandidaten: `WebFetch` auf `https://unsplash.com/s/photos/<englischer-begriff>`, nur KOSTENLOSE Fotos (`https://images.unsplash.com/`, nie `plus.unsplash.com`). Format: `https://images.unsplash.com/photo-<ID>?fm=jpg&q=75&w=1600`. Keine Shop-/Hersteller-/Blogfotos. Vorhandene Vorlagen (heizkoerper, entlueftungsventil, thermostatkopf, therme, manometer) mit identischer Kandidatenliste wiederverwenden. Jede Vorlage: `name_en`, `beschreibung`, `kandidaten`.

## 7. Titel, Beschreibung, Tags (immer, per TubeLab)

- `search_outliers` zum Thema (language ["de"], publishedAtFrom "year", sortBy averageViewsRatio, auch Langvideos) und `search_trending_formats` (ohne language-Parameter, der ist fehlerhaft) nach erfolgreichen Titel-Formeln.
- Titel: max. ~60 Zeichen, Hauptsuchwort vorne, Hook mit Neugier/Fehler/Geld, du-Form. Plus 2 Alternativen. 2–3 erfolgreiche Vorbilder mit Kanal und Faktor in "titel_vorbilder".
- Beschreibung: Hook-Satz mit Suchwort, kurze nummerierte Anleitung (Emojis 1️⃣…), Sicherheitshinweis wenn nötig, Abo-Satz. Keine ungeprüften Zahlen.
- "hashtags": genau 3, thematisch. "tags": 8–12 Suchbegriffe.
- "produktlink": leer lassen, außer der Nutzer nennt einen Affiliate-Link.
- "kommentar_anpinnen" und ggf. "verknuepfen" laut Abschnitt 4a.

## 8. Thumbnail und Titel (immer – hier entscheidet sich die Klickrate)

Erkenntnis aus den eigenen Analytics (Okt. 2026): Die 19 neuen langen Videos bekamen 30.000 Impressionen und 0 Abos, Klickrate 0,5–7 %; die alten Reparaturvideos haben 12–19 %, die Klima-Vergleiche 6–9 %. Wo geklickt wurde, war die Retention gut. Der Engpass ist IMMER Thumbnail + Titel, nicht der Inhalt. Ziel: ≥ 7 % Klickrate, bei Symptom-Videos ≥ 10 %.

Drei Pflichtregeln aus dem Vergleich mit den Vorbildern:
- Titel und Thumbnail versprechen dasselbe. Negativbeispiel: Titel „Heizkörper entlüften in 7 Schritten“, Thumbnail „Nach dem Entlüften: das hier prüfen“ mit Manometer → 0,9 % CTR.
- Keine neutralen Checklisten-Titel („5 Checks vor dem Winter“, „erklärt“, „Guide“). Stattdessen Konsequenz oder Zahl: „Heizung an? Mach erst DAS – oder du zahlst den ganzen Winter“.
- Symptom-Titel exakt so, wie der Zuschauer sucht: „<Gerät> <Fehlercode/Symptom>? <Lösung in N Minuten / Das ist der Grund>“.
- Im fertigen Thumbnail darf kein Kästchen „Zeitstempel“ stehen (Platzhalter, war im Okt. 2026 bei zwei Videos mit gerendert). Fehlt die Dauer-Angabe, Feld leer lassen statt Platzhalter.

Thumbnail-Regeln (Programm rendert automatisch, Schrift Montserrat Black mit schwarzer Kontur):
- "text": höchstens 3 Worte, GROSS, eine Frage oder Behauptung („Zu teuer?“, „1 Jahr heizen“). Nie den Titel wiederholen.
- "zahlen": 1–2 große Zahlen-Kästen sind die stärkste Waffe bei Kosten/Vergleich/Fehlern: `[{"wert": "3.650 €", "label": "Heizöl", "farbe": "rot"}, {"wert": "1.900 €", "label": "Klimaanlage", "farbe": "gruen"}]` → rot = teuer/falsch, gruen = günstig/richtig, gelb = neutral. Zwei Kästen bekommen automatisch ein „VS“. Höchstens 3 Kästen.
- "stempel": ein schräger roter Stempel mit 1–2 Worten („Wirklich?“, „Fehler!“, „Platz 1“), optional mit Farbe: `{"text": "Platz 1", "farbe": "gruen"}`.
- "unterzeile": nur wenn keine Zahlen (sonst zu voll).
- Bild-Prompt: EIN klares Motiv, groß, ruhiger Hintergrund, kräftige Farben, Licht von vorn; bei 16:9 „Wide 16:9 photo …“, bei Shorts ruhiges oberes Drittel. Keine Schrift im Bild.
- Bei Langvideos IMMER 2 Varianten in "thumbnail_varianten" (eigener Prompt oder "bild_wie"), jede mit anderer Idee: z. B. Haupt = Vergleich zweier Zahlen, A = nur der Gewinner mit Zahl, B = das Motiv der häufigsten Zuschauerfrage. Das Programm erzeugt thumbnail.png, thumbnail_A.png, thumbnail_B.png → der Nutzer testet sie in YouTube Studio unter „Testen und vergleichen“.
- Bei Shorts reicht das Haupt-Thumbnail (wird als erster Frame eingesetzt); Zahlen/Stempel sind auch dort erlaubt.
- Nur das Thumbnail eines fertigen Videos ändern: Felder "thumbnail"/"thumbnail_varianten" in der JSON ändern, Rest unverändert lassen → das Programm erkennt das und erzeugt nur die Thumbnails neu (kein neuer Schnitt, keine neuen Bilder).

Titel-Regeln (nach den eigenen Analytics und TubeLab-Vorbildern):
- Zahl oder Geldbetrag nach vorn („1 Jahr heizen: 1.650 € oder 3.650 €?“), Suchwort in den ersten 40 Zeichen, Spannung („Wer gewinnt?“, „Der Haken“), max. ~70 Zeichen bei Videos, ~60 bei Shorts.
- Titel-Formeln je Typ (aus TubeLab-Outliern, Okt. 2026):
  - A: „<Gerät> <Symptom>? <Lösung> in 2 Minuten“ / „… Das ist der Grund“ / „… Was du sofort tun kannst“.
  - B: „<Gerät> für <Preis>: <Messwert> – aber DAS musst du wissen“ / „<Gerät> im Test: So warm wird es nach 60 Minuten“ / „<A> vs. <B>: Was kostet 1 Stunde wirklich?“.
  - C: „1 Stunde <Gerät> kostet <X> €“ / „<Ding>: <N>-mal teurer als Gas“ / „Diesen Fehler bei <Gerät> NICHT machen“ / „Kauf <Ding> nicht, bevor du DAS weißt“.
- Immer 2–3 Alternativen in "titel_alternativen"; der Nutzer kann den Titel nach 48 h tauschen, wenn die Klickrate unter 5 % liegt.

## 9. Datei erstellen und ausliefern

Dateiname `<thema>_short.json` (klein, Unterstriche, keine Umlaute). Format exakt wie unten, Gültigkeit mit `python3 -m json.tool` prüfen, mit SendUserFile schicken. Antwort kurz: Idee in einem Satz, Vorbild-Video, Titel, Kommentar-Frage; dann: „Datei herunterladen und doppelt auf ‚Short erstellen‘ klicken.“ Kosten ca. 0,5–2 $ (bis 6 $ läuft alles ohne Rückfrage).

```json
{
  "titel": "…",
  "titel_alternativen": ["…", "…"],
  "titel_vorbilder": ["„…“ – Kanal, 4,1x"],
  "beschreibung": "…",
  "hashtags": ["#…", "#…", "#…"],
  "tags": ["…"],
  "produktlink": "",
  "kommentar_anpinnen": "…",
  "verknuepfen": "",
  "thumbnail": {"prompt": "…", "vorlage": "<name>", "pruefen": ["…"], "text": "…", "stempel": "…", "zahlen": [{"wert": "…", "label": "…", "farbe": "rot"}]},
  "thumbnail_varianten": [{"prompt": "…", "pruefen": ["…"], "text": "…", "zahlen": [{"wert": "…", "label": "…", "farbe": "gruen"}]}],
  "stil_bild": "Photorealistic vertical 9:16 smartphone photo, real German apartment, warm natural daylight, shallow depth of field, natural colors, slight film grain. No faces. No text, no letters, no numbers, no logos, no watermarks.",
  "vorlagen": {"<name>": {"name_en": "…", "beschreibung": "…", "kandidaten": ["https://images.unsplash.com/photo-…?fm=jpg&q=75&w=1600"]}},
  "shots": [
    {"id": "01", "sprecher": "…", "bildschirmtext": "…", "bilder": [{"prompt": "…", "vorlage": "<name>", "pruefen": ["…"]}]},
    {"id": "14", "sprecher": "Und genau deshalb –", "bildschirmtext": "", "bilder_wie": ["01-1"]}
  ]
}
```

## Technik beim Nutzer (zur Orientierung)

- make_short.py und „Short erstellen.command“ liegen im Downloads-Ordner; die Doppelklick-Datei auf dem Schreibtisch arbeitet in Downloads. Der Doppelklick erstellt alle neuen .json-Dateien dort.
- Ohne "kanal"-Angabe gilt Der Handwerksdoktor: Stimme deutsch und männlich (automatisch gewählt, gemerkt in stimme_de_maennlich.json). Bildmodell, Prüfmodell und Referenzfotos werden ebenfalls gemerkt.
- Fertige Shorts (Video, thumbnail.png, upload.txt mit Titel/Beschreibung/Tags/anzupinnendem Kommentar, Untertitel) landen auf dem Laufwerk „Producen“ im Ordner „Handwerksdoktor Shorts“.
- Beim Herunterladen von Updates: alte Datei vorher löschen, sonst benennt der Browser die neue um („(1)“, „_1“).
- Bei Fehlermeldungen: Ursache erklären, Skript gezielt korrigieren, neue Datei schicken.
- Beim Hochladen immer an „Veränderte oder synthetische Inhalte: Ja“ erinnern.
