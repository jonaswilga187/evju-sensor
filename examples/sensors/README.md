# 🌡️ Sensor Integration - Beispiele

Hier findest du fertige Scripts, wie du Sensoren an die API anbindest.

## 📁 Ordnerstruktur

```
examples/sensors/
├── README.md (diese Datei)
├── python/
│   ├── sensor_basic.py              # Alle Werte zusammen
│   ├── sensor_without_power.py      # Nur Klima (Temp + Luftf.)
│   ├── power_sensor_separate.py     # Nur Stromverbrauch (separat)
│   ├── sensor_systemd.py            # Mit Systemd Service
│   └── requirements.txt             # Python Dependencies
└── esp32/
    ├── sensor_basic/
    │   └── sensor_basic.ino         # Arduino Sketch (alle Werte)
    ├── power_sensor_separate/
    │   └── power_sensor_separate.ino # Arduino Sketch (nur Strom)
    └── README.md                    # ESP32 Anleitung
```

## 🚀 Quick Start

### Python (Raspberry Pi)

```bash
cd examples/sensors/python
pip3 install -r requirements.txt
python3 sensor_basic.py
```

### ESP32 (Arduino)

```bash
# 1. Arduino IDE öffnen
# 2. examples/sensors/esp32/sensor_basic/sensor_basic.ino öffnen
# 3. WiFi & API URL anpassen
# 4. Upload auf ESP32
```

## 📡 API Endpunkte

Die API bietet jetzt zwei Wege, Daten zu senden:

### Option 1: Alle Werte zusammen (klassisch)

```bash
POST http://api.yourdomain.com/api/sensors
Content-Type: application/json

{
  "temperatur": 22.5,
  "luftfeuchtigkeit": 65,
  "stromverbrauch": 450  # optional!
}
```

**Neu:** `stromverbrauch` ist jetzt **optional**! Du kannst jetzt auch nur Klima-Daten senden.

### Option 2: Nur Klima (Temp + Luftfeuchtigkeit)

```bash
POST http://api.yourdomain.com/api/sensors
Content-Type: application/json

{
  "temperatur": 22.5,
  "luftfeuchtigkeit": 65
  # stromverbrauch weggelassen
}
```

### Option 3: Nur Stromverbrauch (separater Endpunkt)

```bash
POST http://api.yourdomain.com/api/sensors/power
Content-Type: application/json

{
  "stromverbrauch": 450,
  "sensor_id": "power_sensor_001"  # optional
}
```

**Vorteil:** Perfekt, wenn Stromverbrauch von einem anderen Gerät kommt!

## 📊 Wie funktioniert es?

```
1. Sensor misst Werte (alle 5 Min)
   └─> Temperatur: 22.5°C
   └─> Luftfeuchtigkeit: 65%
   └─> Stromverbrauch: 450W

2. Script sendet POST Request (siehe API Endpunkte oben)

3. Backend speichert in MongoDB
   └─> Versucht Werte intelligent zu mergen
   └─> Oder erstellt separate Einträge

4. Dashboard zeigt Daten an
```

## ⏱️ Empfohlene Intervalle

| Sensor | Intervall | Warum |
|--------|-----------|-------|
| Temperatur | 5-15 Min | Ändert sich langsam |
| Luftfeuchtigkeit | 5-15 Min | Ändert sich langsam |
| Stromverbrauch | 1-5 Min | Kann sich schnell ändern |

## 📚 Detaillierte Anleitungen

- [Python →](python/) - Für Raspberry Pi, Linux Server
- [ESP32 →](esp32/) - Für Arduino, ESP32, ESP8266

## 🛠️ Hardware-Empfehlungen

### Budget (~30€)
- ESP32 Dev Board (~5€)
- DHT22 Sensor (~3€)
- Shelly Plug S (~15€)
- Breadboard & Kabel (~5€)

### Premium (~100€)
- Raspberry Pi 4 (~50€)
- BME280 Sensor (~5€)
- Shelly 3EM (~100€)
- Gehäuse (~20€)

## 🔐 Sicherheit

### Production Checklist
- [ ] HTTPS verwenden (`https://api.yourdomain.com`)
- [ ] Starkes WiFi Passwort
- [ ] Sensor-Firmware aktuell halten
- [ ] Netzwerk-Segmentierung (IoT VLAN)
- [ ] Regelmäßige Logs prüfen

### Optional: API Token

Für zusätzliche Sicherheit kannst du API Tokens implementieren.

## 💡 Tipps

- **Fehlerbehandlung:** Script sollte bei Fehler weiterlaufen
- **Logging:** Wichtig für Debugging
- **Retry Logic:** Bei Netzwerkfehlern nochmal versuchen
- **Zeitstempel:** Sensor-Zeit oder Server-Zeit?
- **Batterie-Check:** Bei Battery-Sensoren

## 🐛 Troubleshooting

### Script läuft nicht

```bash
# Python Version prüfen
python3 --version

# Dependencies prüfen
pip3 list

# Manuell testen
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"temperatur":22.5,"luftfeuchtigkeit":65,"stromverbrauch":450}'
```

### API nicht erreichbar

```bash
# Ping testen
ping api.yourdomain.com

# DNS prüfen
nslookup api.yourdomain.com

# Firewall prüfen
curl -v http://api.yourdomain.com/health
```

---

**→ Zurück zur [Haupt-Dokumentation](../../README.md)**


