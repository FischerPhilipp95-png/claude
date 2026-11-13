# Style Guide: Archiv-Shorts „Vor 100 Jahren“

Es gibt für dieses Format keine Referenz in `refs/`. Die Regeln unten sind ein eigener Vorschlag,
abgeleitet aus dem Material und den Kanal-Standards (Shorts 1080x1920, 60 fps, ca. 20 s, Thumbnail-Farben).
Wenn du ein Vorbild-Video hast, analysiere ich es und passe den Guide an.

## Material
Stummfilm von 1922, 4:3, weich, sichtbares Korn, teils blau eingefärbt. Wird nicht geschönt:
keine Kolorierung, keine KI-Hochskalierung, kein künstliches „Alter-Film“-Overlay. Das Alter ist der Reiz.

## Bildaufbau (1080x1920)
- Hintergrund: fast schwarz `#0d0d0d`.
- Film im Format 4:5, 1080x1350 (Ausschnitt 461x576 aus der Quelle), y = 230 bis 1580, darüber ein Fortschrittsbalken mit 7 Segmenten. Einheitlich entsättigt
  auf Schwarzweiß mit leicht warmem Ton, damit graue und blaue Szenen zusammenpassen.
- Oben (y 90–270): Jahreszahl-Marke „1922“ gelb `#ffd400` auf Schwarz, daneben das Thema in Weiß.
- Schritt-Label: im unteren Bilddrittel, über y = 1440 bleibt alles Wichtige. Unter 1440 nur Kanal-Avatar und Name, klein.

## Typo
- Anton, Großbuchstaben, Weiß; Kernwort gelb `#ffd400` (wie Thumbnails). Tracking +1 %.
- Schritt-Label: Nummer gelb + ein bis drei Wörter („1 EICHE FÄLLEN“).
- Quellenzeile klein in Inter/Systemschrift, 60 % Weiß: „Film: W. Mullens / Haghefilm, 1922, gemeinfrei“.

## Schnitt und Tempo
- Harte Schnitte, keine Blenden. Shot-Länge 1,4–2,9 s. Hook: das auffälligste Bild zuerst.
- Schnitte fallen auf den Satzanfang des Sprechers, nicht auf Musik-Beats.
- Film läuft in Originalgeschwindigkeit; nur bei sehr langsamen Szenen bis 1,25-fach.

## Bewegung
- Kamera der Quelle ist statisch. Pro Shot ein langsamer Zoom 100 → 106 % (Ease-out), abwechselnd leicht nach links/rechts versetzt.
- Text: Label schiebt in 8 Frames von unten ein (Maske), steht, schneidet hart mit dem Bild weg.
- Jahreszahl-Marke bleibt die ganze Zeit stehen.

## Ton
- Sprecher: Piper `de_DE-thorsten-high`.
- Musik: eigene, ruhige Zupffigur (in `build.py`), 90 BPM, leise unter der Stimme.
- Ein kurzer Holzschlag auf jedem Schnitt, sonst keine Geräusche.

## Regeln für Aussagen
Gesprochen wird nur, was im Bild zu sehen ist oder in der Filmbeschreibung von Beeld en Geluid steht.
Keine erfundenen Zahlen zu Löhnen, Preisen oder Stückzahlen.
