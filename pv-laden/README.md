# PV-Überschussladen für den ID.4

Ziel: Das Auto lädt automatisch mit dem Strom, der vom Dach übrig ist, und zieht so wenig wie möglich aus dem Netz.

| Baustein | Gerät |
|---|---|
| PV-Anlage | Huawei SUN2000 mit Dongle und Batterie (App FusionSolar) |
| Wallbox | dé Mobile Wallbox 11 kW, CEE, 6–16 A (App „dé EV Charger“) |
| Auto | VW ID.4 |
| Steuerung | Raspberry Pi mit evcc (kostenlos) und dem Gateway für die dé-Wallbox (kostenlos) |

Stand: 13.11.2026. Noch nicht an der echten Anlage getestet; die Schritte stammen aus dem evcc-Quellcode und der Anleitung des Gateways.

## 1. Einkaufsliste

| Teil | Hinweis |
|---|---|
| Raspberry Pi 5 mit 4 GB | 2 GB reichen für evcc allein, 4 GB wenn später Home Assistant dazukommt |
| Original-Netzteil USB-C 27 W | billige Netzteile sind die häufigste Absturzursache |
| Gehäuse mit Kühler | |
| microSD-Karte 32 GB (A2) | oder besser eine kleine SSD mit USB-Adapter |
| LAN-Kabel | Pi direkt an die FRITZ!Box, nicht über WLAN |

Zusammen etwa 90–110 €. Ein Pi 4 oder ein alter Laptop geht genauso.

## 2. Was vorher klar sein muss

- **Firmware der Wallbox:** in der dé-App unter dem Werkzeug-Symbol nachsehen und notieren. Das Gateway wurde mit 2.9.3 getestet. Es pausiert das Laden, indem es den Strom auf 0 stellt; laut evcc-Quellcode nimmt Firmware 2.9.4 die 0 nicht an. Dann bleibt der Weg mit Sponsor-Token (Abschnitt 8).
- **Zeitplan in der dé-App:** ausschalten und aus lassen.
- **Installateur-Passwort des Wechselrichters:** wird für Schritt 3 gebraucht. Steht es nicht in den Unterlagen, beim Solarteur erfragen.

## 3. Huawei: Modbus TCP einschalten

Nur so kann evcc PV-Leistung, Netzbezug und Batterie auslesen.

1. Direkt neben dem Wechselrichter die FusionSolar-App öffnen: **Ich → Inbetriebnahme des Geräts**.
2. Mit dem WLAN des Wechselrichters verbinden (Name beginnt mit `SUN2000-`), als **Installateur** anmelden.
3. **Einstellungen → Kommunikationskonfiguration → Dongle-Parametereinstellungen → Modbus TCP** auf **Aktivieren (uneingeschränkt)** stellen.
4. In der FRITZ!Box unter **Heimnetz → Netzwerk** den Dongle suchen, IP notieren und „immer die gleiche IPv4-Adresse zuweisen“ anhaken.

Der Dongle erlaubt nur eine Modbus-Verbindung gleichzeitig. Neben evcc darf also nichts anderes (z. B. Home Assistant) direkt am Dongle hängen.

## 4. Wallbox: Schlüssel auslesen (einmalig)

Die Wallbox spricht lokal das Tuya-Protokoll. Dafür braucht man ihre Device ID und ihren Local Key.

1. Kostenloses Konto auf `iot.tuya.com` anlegen.
2. **Cloud → Development → Create Cloud Project**, Methode „Smart Home“, Rechenzentrum **Central Europe**.
3. Im Projekt: **Devices → Link App Account**, den QR-Code mit der App scannen, in der die Wallbox eingerichtet ist. Die Wallbox erscheint dann in der Geräteliste.
4. Auf der Übersichtsseite **Client ID** und **Client Secret** notieren.
5. Auf dem Pi (nach Schritt 5):
   ```bash
   sudo apt install -y python3-pip
   pip install --break-system-packages tinytuya
   python3 -m tinytuya wizard
   ```
   Der Assistent zeigt **Device ID** und **Local Key** der Wallbox. Beides gehört in `gateway.env`, nie in einen Chat.
6. In der FRITZ!Box auch der Wallbox eine feste IP geben und notieren.

## 5. Raspberry Pi einrichten

1. Am PC den **Raspberry Pi Imager** laden, **Raspberry Pi OS Lite (64-bit)** wählen, in den Einstellungen Benutzername, Passwort und **SSH aktivieren** setzen, auf die Karte schreiben.
2. Karte in den Pi, LAN-Kabel an die FRITZ!Box, Netzteil einstecken.
3. Per SSH anmelden (`ssh <benutzer>@<IP-des-Pi>`) und Docker installieren:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   ```
   Danach einmal ab- und wieder anmelden.
4. Die Dateien aus diesem Ordner (`docker-compose.yml`, `gateway.env.example`) nach `~/pv-laden/` auf den Pi kopieren.
5. `cp gateway.env.example gateway.env`, dann Device ID, Local Key und IP der Wallbox eintragen.
6. Starten:
   ```bash
   cd ~/pv-laden
   docker compose up -d
   curl http://localhost:8087/status
   ```
   Kommt ein Status zurück, steht die Verbindung zur Wallbox.

## 6. evcc einrichten

Im Browser `http://<IP-des-Pi>:7070` öffnen, Passwort vergeben, dann unter **Konfiguration**:

1. **Netz, PV, Batterie:** je ein Gerät hinzufügen, Hersteller Huawei, Vorlage „SUN2000 Hybrid-Wechselrichter“, Verbindung Modbus TCP, IP des Dongles, Port 502, ID 1. Dreimal mit Verwendung Netz, PV und Batterie.
2. **Wallbox:** „Benutzerdefiniertes Gerät“ wählen und den Inhalt von `wallbox-evcc.yaml` einfügen.
3. **Fahrzeug:** VW ID.4 mit Akkugröße anlegen. Die Anbindung ans VW-Konto (Ladestand) ist optional und kann später folgen.
4. **Ladepunkt:** Wallbox und Fahrzeug zuordnen, Phasen **3**, Strom **6 bis 16 A**, Standardmodus **PV**.
5. **Hausbatterie:** unter den Batterie-Einstellungen festlegen, ab welchem Ladestand das Auto Vorrang bekommt, und „Entladen beim Schnellladen verhindern“ einschalten.

## 7. Betrieb

| Modus in evcc | Was passiert |
|---|---|
| PV | lädt nur bei genug Überschuss, pausiert sonst |
| Min+PV | lädt immer mit 6 A, nimmt Überschuss dazu |
| Schnell | lädt sofort mit voller Leistung, auch aus dem Netz |

- **An der roten CEE-Dose** braucht die Wallbox mindestens etwa 4,1 kW Überschuss (3 Phasen × 6 A).
- **Im Winter** die Wallbox mit dem Schuko-Adapter betreiben: 1-phasig, 1,4 bis 2,3 kW. Dafür in `gateway.env` `TUYA_NUM_PHASES=1` und `TUYA_MAX_CURRENT=10` setzen, `docker compose up -d` ausführen und im evcc-Ladepunkt Phasen 1 und maximal 10 A einstellen. Eine Haushaltssteckdose verträgt auf Dauer nicht mehr als 10 A.

## 8. Falls das Gateway nicht stabil läuft

evcc hat einen eingebauten Treiber für die dé-Wallbox (Vorlage „dé Mobile Wallbox“). Er braucht ein evcc-Sponsor-Token, aber kein Gateway. In evcc bei der Wallbox diese Vorlage wählen und IP, Device ID und Local Key eintragen; in `docker-compose.yml` den Dienst `wallbox-gateway` entfernen, weil die Wallbox nur eine lokale Verbindung gleichzeitig annimmt.

## Quellen

- evcc: https://github.com/evcc-io/evcc (Vorlagen `tuya-depow`, `huawei-sun2000-hybrid`)
- Gateway: https://github.com/vondraussen/de-wallbox-evcc-gateway
