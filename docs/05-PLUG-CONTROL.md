# Plug-Control Dokumentation (Heizung + Entfeuchter)

## Übersicht

Das Plug-Control-System steuert mehrere Steckdosen (aktuell **Heizung** und
**Luftentfeuchter**, beides SwitchBot Plugs) über die Website. Ein ESP32
fungiert als Vermittler zwischen der eigenen API und der SwitchBot Cloud API.

**Wichtig:** Der ESP32 sitzt an einem externen Standort ohne feste IP hinter
einem NAT-Router. Er verbindet deshalb IMMER selbst ausgehend zum Server
(Polling) - der Server kann den ESP32 nicht aktiv erreichen. Das gilt für
beide Plugs gleichermaßen.

## Architektur

```
Website ──PUT /api/plug/:plugId/desired──▶ API ◀──GET /api/plug/:plugId/desired── ESP32 ──▶ SwitchBot Cloud ──▶ Steckdose
   ▲                                        ▲                                        │
   └──────────────GET /api/plug─────────────┴───POST /api/plug/:plugId/reported──────┘
```

`plugId` ist aktuell `heizung` oder `entfeuchter` - beide laufen über
denselben ESP32 und dieselbe Firmware (`switchbot_heizung_control.ino`),
jeweils mit eigenem SwitchBot-Gerät.

### Ablauf pro Plug

1. **Website** setzt gewünschten Status (on/off) oder Automatik-Modus über API
2. **ESP32** fragt regelmäßig (alle 5 Sek., pro Plug) die API: "Was soll ich tun?"
3. **ESP32** schaltet die jeweilige SwitchBot-Steckdose entsprechend
4. **ESP32** meldet aktuellen Status zurück an API
5. **Website** zeigt Status beider Plugs an

### Automatik-Modus

Die Entscheidungslogik läuft **serverseitig** (`plugService.js`), nicht auf
dem ESP32 - der ESP32 fragt nur `GET /api/plug/:plugId/desired` ab und führt
das Ergebnis aus.

- **Heizung** (`control_metric: temperature`, `control_direction: below`):
  schaltet EIN wenn Temperatur < Schwellenwert, AUS wenn ≥ Schwellenwert + Hysterese.
- **Entfeuchter** (`control_metric: humidity`, `control_direction: above`):
  schaltet EIN wenn Luftfeuchtigkeit > Schwellenwert, AUS wenn ≤ Schwellenwert − Hysterese.

Schwellenwert und Hysterese werden pro Plug in der DB gespeichert und im
Dashboard eingestellt (`PUT /api/plug/:plugId/mode`).

## API Endpunkte

### 1. Alle Plugs abrufen (für Website)

```http
GET /api/plug
```

```json
{
  "success": true,
  "data": [
    { "_id": "heizung", "label": "Heizung", "control_metric": "temperature", "control_direction": "below", "mode": "auto", "threshold": 20, "hysteresis": 0.5, "desired_state": "on", "reported_state": "on", "...": "..." },
    { "_id": "entfeuchter", "label": "Luftentfeuchter", "control_metric": "humidity", "control_direction": "above", "mode": "auto", "threshold": 60, "hysteresis": 5, "desired_state": "off", "reported_state": "off", "...": "..." }
  ]
}
```

### 2. Status eines Plugs abrufen (für Website)

```http
GET /api/plug/:plugId/status
```

`:plugId` = `heizung` oder `entfeuchter`.

### 3. Gewünschten Status setzen (von Website)

⚠️ Erfordert einen gültigen API-Key (siehe [02-API.md](02-API.md#-authentifizierung)).

```http
PUT /api/plug/:plugId/desired
Content-Type: application/json
X-API-Key: dein-api-key

{ "state": "on" }
```

### 4. Modus/Schwellenwert setzen (von Website)

⚠️ Erfordert einen gültigen API-Key.

```http
PUT /api/plug/:plugId/mode
Content-Type: application/json
X-API-Key: dein-api-key

{ "mode": "auto", "threshold": 20, "hysteresis": 0.5 }
```

`threshold` ist in °C bei `heizung`, in % bei `entfeuchter`.

### 5. Gewünschten Status abrufen (für ESP32)

```http
GET /api/plug/:plugId/desired
```

Kein API-Key nötig (nur lesend).

### 6. Aktuellen Status melden (von ESP32)

⚠️ Erfordert einen gültigen API-Key.

```http
POST /api/plug/:plugId/reported
Content-Type: application/json
X-API-Key: dein-api-key

{ "state": "on" }
```

## Verbrauchs-Analyse (read-only)

```http
GET /api/analysis/consumption?days=30
```

Wertet historisch aus, welche Kombination aus `heizung`/`entfeuchter` (an/aus)
den geringsten Stromverbrauch bei gleichzeitig hohem Anteil an Messwerten im
Ziel-Komfortbereich hatte (Zielbereich konfigurierbar über `TARGET_TEMP_MIN/MAX`
und `TARGET_HUMIDITY_MIN/MAX` in `.env`). Das ist eine reine Auswertung zur
manuellen Entscheidungshilfe, **keine automatische Regelung** - siehe
`ConsumptionAnalysis.jsx` im Frontend.

Grundlage ist `PlugStateLog` (`backend/src/models/PlugStateLog.js`) - jede
tatsächliche Zustandsänderung eines Plugs wird dort mit Zeitstempel protokolliert,
damit sich im Nachhinein rekonstruieren lässt, welche Kombination zu welchem
Sensor-Messwert aktiv war.

## Backend-Struktur

### Model: `PlugControl.js`

Generisch für beliebig viele Plugs (keine feste ID mehr):

```javascript
{
  _id: 'heizung',                    // oder 'entfeuchter', frei erweiterbar
  label: 'Heizung',
  control_metric: 'temperature',     // oder 'humidity'
  control_direction: 'below',        // oder 'above'
  mode: 'auto',
  threshold: 20,
  hysteresis: 0.5,
  desired_state: 'on',
  reported_state: 'on',
  last_fetched: Date,
  last_changed: Date,
  last_reported: Date
}
```

Neue Plug-Typen werden in `PLUG_DEFINITIONS` (`plugService.js`) eingetragen
und beim Server-Start automatisch angelegt (`initPlugs()`).

### Service: `plugService.js`

- `initPlugs()` - legt bekannte Plugs an (Server-Start)
- `getAllStatuses()` - für Website-Übersicht
- `getDesiredStateForESP(plugId)` - für ESP32, inkl. Automatik-Entscheidung
- `getCompleteStatus(plugId)` / `setDesiredState(plugId, state)` / `updateReportedState(plugId, state)` / `setMode(plugId, mode, threshold, hysteresis)`

### Service: `analysisService.js`

`getConsumptionComparison(days)` - siehe oben.

## Frontend-Komponenten

- **`PlugControl.jsx`** - generisch, wird zweimal mit unterschiedlichen Props
  eingebunden (`plugId`, `direction`, `unit`, `min`/`max`) für Heizung und
  Entfeuchter.
- **`ApiKeySettings.jsx`** - Eingabefeld für den API-Key (lokal in
  `localStorage`), ohne den kann die Website keine Schreib-Endpunkte
  aufrufen.
- **`ConsumptionAnalysis.jsx`** - zeigt den Verbrauchsvergleich der
  Kombinationen.

## ESP32 Firmware

`examples/sensors/esp32/shelly_plug_control/switchbot_heizung_control.ino`
steuert **beide** Plugs von einem ESP32 aus. Konfiguration:

```cpp
const char* SWITCHBOT_DEVICE_NAME_HEIZUNG = "Heizung";
const char* SWITCHBOT_DEVICE_NAME_ENTFEUCHTER = "Entfeuchter";
```

Diese Namen müssen exakt mit den Gerätenamen in der SwitchBot-App
übereinstimmen - die Firmware löst darüber automatisch die Device-IDs auf,
keine manuelle ID-Konfiguration nötig.

> Die Datei `shelly_plug_control.ino` im selben Ordner ist ein älteres,
> aktuell **nicht genutztes** Beispiel für eine rein lokale Shelly-Steuerung
> (kein Cloud-Umweg). Falls nicht gebraucht, kann sie entfernt werden.

## Sicherheit

Alle Endpunkte, die einen Plug-Status ändern oder Sensordaten einspielen
(`PUT /api/plug/:plugId/desired`, `PUT /api/plug/:plugId/mode`,
`POST /api/plug/:plugId/reported`, `POST /api/sensors`, `POST /api/sensors/bulk`),
sind über einen gemeinsamen API-Key geschützt (`X-API-Key` Header, siehe
`API_KEY` in `.env.example`). Ohne gültigen Key antwortet die API mit
`401 Unauthorized`. `GET /api/plug/:plugId/desired` (ESP32 fragt Sollwert ab)
und `GET /api/plug/:plugId/status` bzw. `GET /api/plug` (Website liest Status)
sind bewusst ungeschützt (nur lesend).

## Troubleshooting

### Plug reagiert nicht

1. Steht der Gerätename in der SwitchBot-App exakt so wie in der Firmware-Konfiguration?
2. Serial Monitor prüfen: wurde die Device-ID beim Start gefunden?
3. `GET /api/plug/:plugId/status` prüfen - stimmt `desired_state` mit der Erwartung überein?
4. Antwortet `POST /api/plug/:plugId/reported` mit 401? → API_KEY auf ESP32 und Backend stimmen nicht überein.

### Website kann nicht schalten (401)

API-Key im Dashboard unter "API-Key" (oberhalb der Plug-Kacheln) eintragen -
muss mit der `API_KEY`-Umgebungsvariable des Backends übereinstimmen.
