# Style Guide: „Heizkörper wird nicht warm? 5 Ursachen, die du selbst prüfen kannst“ (YouTube, 16:9)

## Warum dieses Thema (Themen-Radar, `docs/radar/heizung.md`)

- **Suchnachfrage:** „heizkörper wird nicht warm“ ist einer der stärksten Heizungs-Suchvorschläge. Die Top-5-Videos dazu haben im Median
  **485.000 Aufrufe**, „heizung wird nicht warm“ 134.000. Verwandte Suchen: heizkörper nur oben warm, heizung unten kalt,
  heizungsventil klemmt (Top-Video 1,8 Mio), heizung zu wenig druck.
- **Saison:** Heizungsthemen werden in der YouTube-Suche von Oktober bis Januar gesucht (Spitze November). Jetzt veröffentlichen.
- **Offene Frage der Zuschauer:** Die meistgelikte Frage unter dem großen Entlüften-Video (52 Likes) und mehrfach unter
  „Heizung wird nicht warm“-Videos: *„Woher weiß ich als Mieter, welcher Heizkörper am nächsten an der Heizung ist?“*
  Die großen Videos beantworten sie nicht. Wir schon.
- Passt zur Kanal-Strategie (`docs/kanal_strategie.md`): konkretes Problem, Titel = Suchbegriff, Säule Heizung.

## Grammatik

Wie „Klima-Probleme“ (Grammatik aus `refs/ref-08`), mit allen Änderungen, die der Nutzer dort verlangt hat:

| Eigenschaft | So machen wir es |
|---|---|
| Bühne | hellgrauer Board-Canvas `#E4E4E4`, eine Zone pro Ursache |
| Kamera | **steht fest**, kein Schweben. Bewegung nur beim Wechsel zur nächsten Zone (kurze Fahrt mit Unschärfe) und beim Schluss-Zoom |
| Cursor | **nur, wenn sie etwas tun:** „Mieterin“ tippt die Frage, „Doc“ tippt die Diagnose-Frage, klickt und hakt ab |
| Dunkles Panel | „Diagnose“-Panel `#0C0C0D`, Limette `#CFF72A` für Lösungen und Häkchen |
| **Neu: Wärmebild-Heizkörper** | gezeichneter Heizkörper mit animiertem Wärmebild (Rot = warm, Blau = kalt). Zeigt pro Ursache genau das **Symptom**: oben kalt, ganz kalt, schwach, nur der letzte kalt, unten kalt. Das ist das Wiedererkennungsbild des Videos |
| Untertitel | mitlaufend, aktives Wort in Limette (`captions.py`) |
| Typo | Inter 500/600/800 |
| Musik | eigene Komposition, echte Instrumente (FluidR3), ruhig unter der Stimme, ca. 120 BPM |
| Sprecher | Piper `de_DE-thorsten-high` |

## Bilder

- Echte Fotos aus Wikimedia Commons (schon im Repo, Lizenzen in `projects/heizung-video/photos/credits.json`):
  - Heizkörper „Radiator-250558_1280.jpg“ (CC0)
  - Thermostat „247 Home Rescue radiator thermostat.jpg“ (CC0)
  - Entlüftungsventil „Bleedscrew in use.jpg“ (CC0)
  - Manometer „A pressure gauge attached to a heating system.jpg“ (CC BY 2.0, Nennung)
- Neu suchen: Foto eines Thermostatventils ohne Kopf (Ventilstift), bevorzugt CC0.
- Grafiken, die wir zeichnen: Wärmebild-Heizkörper, Ventilstift mit Maß „ca. 5 mm“, Manometer-Skala, Strang mit 4 Heizkörpern
  (Abgleich), Querschnitt mit Schlamm.

## Thumbnails (Standard J/K/L)

Hauptmotiv: freigestellter Heizkörper im **Wärmebild-Look** (oben rot, unten blau oder ganz blau), Person rechts als Sticker.
Schrift: „WIRD NICHT WARM?“. Badge mit echter Zahl, z. B. „VENTILSTIFT · ca. 5 mm“ oder „DRUCK · meist 1–2 bar“.

## Format

1920x1080, 60 fps, ca. 3:15 min. Dazu 2 Shorts (1080x1920, ca. 25 s):
1. „Heizkörper ganz kalt? Ventilstift lösen“.
2. „Mieter: Welcher Heizkörper zuerst entlüften?“.

Beide verlinken das lange Video.
