# Heizung Control Dokumentation

## Übersicht

Das Heizungs-Control-System ermöglicht die Fernsteuerung der Heizung (über einen Shelly Plug) über die Website. Der ESP32 fungiert als Vermittler zwischen API und Shelly Plug.

## Architektur

```
Website → API → ESP32 → Shelly Plug → Heizung
   ↑                         ↓
   └────────── Status ────────┘
```

### Ablauf

1. **Website** setzt gewünschten Status (on/off) über API
2. **ESP32** fragt regelmäßig (alle 5 Sek.) die API: "Was soll ich tun?"
3. **ESP32** steuert Heizung (über Shelly Plug) entsprechend
4. **ESP32** meldet aktuellen Status zurück an API
5. **Website** zeigt Status an

## API Endpunkte

### 1. Status abrufen (für Website)

```http
GET /api/plug/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "shelly_plug_main",
    "desired_state": "on",
    "reported_state": "on",
    "last_fetched": "2024-11-06T10:30:00.000Z",
    "last_changed": "2024-11-06T10:29:45.000Z",
    "last_reported": "2024-11-06T10:30:05.000Z"
  }
}
```

*Hinweis: Die ID heißt intern noch "shelly_plug_main", steuert aber die Heizung.*

### 2. Gewünschten Status setzen (von Website)

⚠️ Erfordert einen gültigen API-Key (siehe [02-API.md](02-API.md#-authentifizierung)).

```http
PUT /api/plug/desired
Content-Type: application/json
X-API-Key: dein-api-key

{
  "state": "on"  // "on" oder "off"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heizung auf \"on\" gesetzt",
  "data": {
    "desired_state": "on",
    "last_changed": "2024-11-06T10:30:00.000Z"
  }
}
```

### 3. Gewünschten Status abrufen (für ESP32)

```http
GET /api/plug/desired
```

**Response:**
```json
{
  "success": true,
  "data": {
    "desired_state": "on",
    "last_changed": "2024-11-06T10:30:00.000Z"
  }
}
```

### 4. Aktuellen Status melden (von ESP32)

⚠️ Erfordert einen gültigen API-Key.

```http
POST /api/plug/reported
Content-Type: application/json
X-API-Key: dein-api-key

{
  "state": "on"  // "on", "off" oder "unknown"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status aktualisiert"
}
```

## Backend-Struktur

### Model: `PlugControl.js`

```javascript
{
  _id: 'shelly_plug_main',      // Feste ID (nur ein Dokument)
  desired_state: 'on',           // Soll-Status (von Website gesetzt)
  reported_state: 'on',          // Ist-Status (von ESP32 gemeldet)
  last_fetched: Date,            // Letzte Abfrage durch ESP32
  last_changed: Date,            // Letzte Änderung des Soll-Status
  last_reported: Date            // Letzte Status-Meldung von ESP32
}
```

### Service: `plugService.js`

Enthält Business-Logik:
- `getDesiredStateForESP()` - Für ESP32
- `getCompleteStatus()` - Für Website
- `setDesiredState(state)` - Status setzen
- `updateReportedState(state)` - Status melden

### Controller: `plugController.js`

Verarbeitet HTTP-Requests

### Routes: `plugRoutes.js`

Definiert Endpunkte unter `/api/plug`

## Frontend-Komponente

### `PlugControl.jsx`

**Features:**
- Großer Ein/Aus-Button für Heizung
- Status-Anzeige (Soll vs. Ist)
- Synchronisations-Status
- Zeitstempel der letzten Aktionen
- Auto-Update alle 5 Sekunden
- Wird unter den Diagrammen angezeigt

**State Management:**
```javascript
{
  plugStatus: {
    desired_state: 'on',
    reported_state: 'on',
    last_fetched: Date,
    last_changed: Date
  },
  loading: boolean,
  switching: boolean,
  error: string
}
```

## ESP32 Code

### Beispiel: `shelly_plug_control.ino`

**Bibliotheken benötigt:**
```arduino
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
```

**Haupt-Funktionen:**

1. **`readAndSendSensorData()`**
   - Liest DHT22 Sensor
   - Holt Stromverbrauch von Shelly
   - Sendet an API

2. **`checkAndControlPlug()`**
   - Fragt API nach gewünschtem Status
   - Vergleicht mit aktuellem Status
   - Schaltet Heizung (über Shelly) bei Änderung
   - Meldet Status zurück an API

3. **`getShellyPower()`**
   - GET Request an `http://SHELLY_IP/status`
   - Parst JSON und extrahiert Power

4. **`setShellyState(state)`**
   - GET Request an `http://SHELLY_IP/relay/0?turn=on/off`

## Shelly Plug API

### Status abrufen

```http
GET http://192.168.1.100/status
```

**Response (vereinfacht):**
```json
{
  "wifi_sta": {
    "connected": true,
    "ip": "192.168.1.100"
  },
  "relays": [
    {
      "ison": true
    }
  ],
  "meters": [
    {
      "power": 145.5,
      "is_valid": true
    }
  ]
}
```

### Schalten

```http
GET http://192.168.1.100/relay/0?turn=on
GET http://192.168.1.100/relay/0?turn=off
GET http://192.168.1.100/relay/0?turn=toggle
```

## Konfiguration

### 1. ESP32 konfigurieren

In `shelly_plug_control.ino`:

```cpp
// WiFi
const char* WIFI_SSID = "DeinWiFi";
const char* WIFI_PASSWORD = "DeinPasswort";

// API Server
const char* API_URL = "http://dein-server.de/api";

// Shelly Plug IP
const char* SHELLY_IP = "192.168.1.100";

// Timing
const unsigned long SENSOR_INTERVAL = 60000;      // 60 Sekunden
const unsigned long PLUG_CHECK_INTERVAL = 5000;   // 5 Sekunden
```

### 2. Shelly Plug IP herausfinden

Optionen:
- Router-Admin-Panel
- Shelly App
- IP-Scanner (z.B. Fing, Advanced IP Scanner)

### 3. Frontend-Umgebungsvariable

In `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Zeitverhalten

| Aktion | Interval | Beschreibung |
|--------|----------|--------------|
| ESP32 → API (Sensordaten) | 60s | Temperatur, Luftfeuchtigkeit, Stromverbrauch |
| ESP32 → API (Status-Check) | 5s | Fragt gewünschten Plug-Status ab |
| Frontend → API (Auto-Update) | 5s | Aktualisiert Status-Anzeige |
| Reaktionszeit (Schalten) | ~5s | Zeit bis ESP32 Status ändert |

## Fehlerbehandlung

### Website nicht erreichbar
- ESP32 zeigt Fehler in Serial Monitor
- Versucht weiter im Interval
- Frontend zeigt "Offline" Status

### Shelly nicht erreichbar
- ESP32 sendet 0 W Stromverbrauch
- Schalten schlägt fehl
- Status bleibt auf "unknown"

### Status nicht synchron

Gründe:
- Shelly hat Befehl noch nicht erhalten
- Shelly ist offline
- Netzwerkprobleme

Anzeige:
- Frontend zeigt "Wird aktualisiert..."
- Gelbes Status-Badge

## Sicherheit

Alle Endpunkte, die den Heizungs-Status ändern oder Sensordaten einspielen
(`PUT /api/plug/desired`, `PUT /api/plug/mode`, `POST /api/plug/reported`,
`POST /api/sensors`, `POST /api/sensors/bulk`), sind über einen gemeinsamen
API-Key geschützt (`X-API-Key` Header, siehe `API_KEY` in `.env.example` und
[02-API.md](02-API.md#-authentifizierung)). Ohne gültigen Key antwortet die
API mit `401 Unauthorized`.

### Weitere Empfehlungen:

1. **Firewall-Regeln**
   - Nur notwendige Ports öffentlich erreichbar machen
   - ESP32-Geräte idealerweise nur im LAN, nicht direkt aus dem Internet

2. **HTTPS verwenden**
   - Für Produktivumgebung zwingend (der API-Key wird sonst im Klartext übertragen)
   - Siehe SSL-Dokumentation

3. **Rate Limiting**
   - Bereits implementiert in `rateLimiter.js`

4. **API-Key rotieren**
   - Bei Verdacht auf Kompromittierung `API_KEY` in `.env` ändern und alle
     ESP32-Geräte sowie das Dashboard mit dem neuen Key aktualisieren

## Debugging

### ESP32 Serial Monitor

```
=================================
ESP32 - Shelly Plug Control
=================================

✓ DHT22 Sensor initialisiert
Verbinde mit WiFi: MeinWiFi
..
✓ WiFi verbunden!
IP Adresse: 192.168.1.50

✓ System bereit!

--- Sensordaten lesen ---
Temperatur: 22.5°C
Luftfeuchtigkeit: 55%
Stromverbrauch: 145 W
✓ Daten erfolgreich gesendet!

Status: on (keine Änderung)
```

### Browser Console

```javascript
// API Status prüfen
fetch('http://localhost:5000/api/plug/status')
  .then(r => r.json())
  .then(console.log)

// Status setzen (benötigt API-Key)
fetch('http://localhost:5000/api/plug/desired', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': 'dein-api-key' },
  body: JSON.stringify({ state: 'on' })
}).then(r => r.json()).then(console.log)
```

### MongoDB prüfen

```javascript
db.plug_control.find().pretty()
```

## Erweiterungen

### Mehrere Plugs

1. `_id` dynamisch machen
2. `plug_id` als Parameter übergeben
3. Frontend: Liste statt einzelner Control

### Timer/Scheduler

1. Zeitbasierte Regeln in API
2. Cron-Jobs für automatisches Schalten
3. Frontend: Timer-UI

### Automationen

1. Schalten basierend auf Sensordaten
   - Bei Temperatur > 25°C → Lüfter ein
   - Bei Stromverbrauch > 1000W → Alarm

2. API-Endpoint für Regeln
3. Frontend: Regel-Editor

## Troubleshooting

### Problem: ESP32 kann API nicht erreichen

**Lösung:**
- IP-Adresse in `API_URL` prüfen
- Firewall-Einstellungen prüfen
- Ping-Test von ESP32

### Problem: Heizung reagiert nicht

**Lösung:**
- Shelly Plug IP prüfen
- Shelly-Firmware aktualisieren
- Direkt im Browser testen: `http://SHELLY_IP/status`
- Prüfen ob Heizung am Shelly Plug angeschlossen ist

### Problem: Status bleibt auf "unknown"

**Lösung:**
- ESP32 muss `reportStateToAPI()` aufrufen
- MongoDB Dokument prüfen
- Initial-Status manuell setzen

### Problem: Verzögerung beim Schalten

**Normal:** 5-10 Sekunden Verzögerung ist normal (ESP32 fragt alle 5 Sekunden ab)
**Zu langsam:** `PLUG_CHECK_INTERVAL` verringern (aber nicht unter 2s)
**Zu schnell (zu viele Requests):** `PLUG_CHECK_INTERVAL` erhöhen

## Postman Collection

Importiere `Sensor_Monitoring_API.postman_collection.json` und erweitere um:

```json
{
  "name": "Plug Control",
  "item": [
    {
      "name": "Get Status",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/plug/status"
      }
    },
    {
      "name": "Set Desired State",
      "request": {
        "method": "PUT",
        "url": "{{base_url}}/plug/desired",
        "body": {
          "mode": "raw",
          "raw": "{\"state\": \"on\"}"
        }
      }
    }
  ]
}
```

## Nächste Schritte

1. ✅ Backend-API implementiert
2. ✅ Frontend-Komponente erstellt
3. ✅ ESP32-Code bereitgestellt
4. ⏳ System testen
5. ⏳ In Produktion nehmen

Viel Erfolg! 🚀

