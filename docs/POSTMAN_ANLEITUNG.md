# Postman Collections - Anleitung

## Verfügbare Collections

### 1. `Sensor_Monitoring_API.postman_collection.json`
**Komplette API** - Enthält alle Endpunkte (Sensoren + Heizung)

Struktur:
```
📦 Sensor Monitoring & Heizung Control API
├── 🏥 System
│   ├── Health Check
│   └── API Info
├── 📊 Sensoren
│   ├── Get Latest
│   ├── Get 24h Data
│   ├── Get Averages
│   ├── Get Hourly Data
│   ├── Get Data by Range
│   ├── Get Stats
│   ├── Create Messwert
│   └── Create Bulk Messwerte
└── 🔥 Heizung Control
    ├── Get Status (Website)
    ├── Get Desired State (ESP32)
    ├── Set Desired State - ON
    ├── Set Desired State - OFF
    ├── Report State - ON (ESP32)
    └── Report State - OFF (ESP32)
```

### 2. `Heizung_Control_API.postman_collection.json`
**Nur Heizung** - Fokussiert auf Heizungssteuerung mit Test-Szenarien

Struktur:
```
📦 🔥 Heizung Control API
├── 🌐 Website Aktionen
│   ├── Status abrufen
│   ├── Heizung EINSCHALTEN
│   └── Heizung AUSSCHALTEN
├── 🤖 ESP32 Aktionen
│   ├── Gewünschten Status abrufen
│   ├── Status melden - ON
│   ├── Status melden - OFF
│   └── Status melden - UNKNOWN
└── 🧪 Test Szenarien
    └── Test Flow: Heizung einschalten
        ├── 1. Status vor Änderung prüfen
        ├── 2. Heizung einschalten
        ├── 3. ESP32 fragt Status ab
        ├── 4. ESP32 meldet Erfolg
        └── 5. Status nach Änderung prüfen
```

## Installation

### Schritt 1: Postman installieren

Falls noch nicht installiert:
- Desktop App: https://www.postman.com/downloads/
- Web Version: https://web.postman.com/

### Schritt 2: Collection importieren

1. Öffne Postman
2. Klicke auf **"Import"** (oben links)
3. Drag & Drop die `.json` Datei oder wähle sie aus
4. Collection erscheint in der linken Sidebar

## Konfiguration

### Umgebungsvariablen (Environment Variables)

Beide Collections verwenden die Variable `{{base_url}}`.

#### Option 1: Collection-Variable nutzen (Standard)

Die Collections haben bereits eine `base_url` Variable:

**Komplette API:**
```
base_url = https://api.temperatur.evjucelle.de
```

**Nur Heizung:**
```
base_url = http://localhost:5000  (Entwicklung)
prod_url = https://api.temperatur.evjucelle.de  (Produktion)
```

So ändern:
1. Klicke auf die Collection
2. Tab **"Variables"**
3. Ändere `Current Value` von `base_url`

#### Option 2: Postman Environment erstellen

Für mehrere Umgebungen (Dev, Staging, Prod):

1. Klicke auf **"Environments"** in der Sidebar
2. Klicke **"+"** für neue Environment
3. Erstelle z.B. "Local Development":

```
base_url = http://localhost:5000
```

4. Erstelle z.B. "Production":

```
base_url = https://api.temperatur.evjucelle.de
```

5. Wähle Environment oben rechts aus

## Verwendung

### 🔥 Heizung steuern (Website-Simulation)

#### 1. Aktuellen Status abrufen
```
GET {{base_url}}/api/plug/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "desired_state": "off",
    "reported_state": "off",
    "last_fetched": "2024-11-06T10:30:00.000Z"
  }
}
```

#### 2. Heizung einschalten
```
PUT {{base_url}}/api/plug/desired
Body: { "state": "on" }
```

**Response:**
```json
{
  "success": true,
  "message": "Heizung auf \"on\" gesetzt"
}
```

#### 3. Status erneut prüfen
```
GET {{base_url}}/api/plug/status
```

Jetzt sollte `desired_state: "on"` sein!

### 🤖 ESP32 simulieren

#### ESP32 fragt ab: "Was soll ich tun?"
```
GET {{base_url}}/api/plug/desired
```

**Response:**
```json
{
  "success": true,
  "data": {
    "desired_state": "on"
  }
}
```

#### ESP32 meldet: "Ich habe es geschaltet!"
```
POST {{base_url}}/api/plug/reported
Body: { "state": "on" }
```

**Response:**
```json
{
  "success": true,
  "message": "Status aktualisiert"
}
```

### 📊 Sensordaten senden (ESP32 Simulation)

```
POST {{base_url}}/api/sensors
Body:
{
  "temperatur": 23.5,
  "luftfeuchtigkeit": 58,
  "stromverbrauch": 600
}
```

## Test-Szenarien

### Kompletter Heizungs-Zyklus

Nutze den **"Test Flow: Heizung einschalten"** Ordner:

1. **Status vor Änderung prüfen** → Notiere `desired_state` und `reported_state`
2. **Heizung einschalten** → Setzt `desired_state: "on"`
3. **ESP32 fragt Status ab** → Bekommt `"on"` zurück
4. **ESP32 meldet Erfolg** → Setzt `reported_state: "on"`
5. **Status nach Änderung prüfen** → Beide States sollten `"on"` sein

### Kompletten Workflow testen

**Runner verwenden:**
1. Rechtsklick auf **"Test Flow: Heizung einschalten"**
2. **"Run collection"**
3. Postman führt alle Requests nacheinander aus
4. Sieh Ergebnisse in der Übersicht

## Tipps & Tricks

### 1. Beispiel-Responses

Die Heizung-Collection hat bereits Beispiel-Responses gespeichert!

So anzeigen:
- Klicke auf einen Request
- Gehe zu **"Examples"** (rechts neben "Body")
- Sieh dir die Beispiel-Antwort an

### 2. Tests hinzufügen

Füge Assertions zu Requests hinzu:

```javascript
// Im "Tests" Tab eines Requests:

// Status Code prüfen
pm.test("Status ist 200", function () {
    pm.response.to.have.status(200);
});

// Response prüfen
pm.test("Success ist true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

// Variable speichern
var jsonData = pm.response.json();
pm.environment.set("last_state", jsonData.data.desired_state);
```

### 3. Pre-request Scripts

Zeitstempel automatisch generieren:

```javascript
// Im "Pre-request Script" Tab:

// Aktuelles ISO Datum
pm.environment.set("current_timestamp", new Date().toISOString());

// Dann im Body:
// "zeitstempel": "{{current_timestamp}}"
```

### 4. Collection Runner für Automation

Teste alle Endpunkte automatisch:

1. Klicke auf Collection → **"Run"**
2. Wähle Requests aus
3. Setze **Iterations** (wie oft?)
4. Setze **Delay** zwischen Requests
5. **Run** → Sieh Statistiken

## Fehlerbehandlung

### "Could not get any response"

**Problem:** API nicht erreichbar

**Lösungen:**
- Prüfe `base_url` in Variables
- Prüfe ob Backend läuft: `npm run dev` im `backend/` Ordner
- Prüfe Firewall/CORS-Einstellungen

### "Unexpected token < in JSON"

**Problem:** API gibt HTML statt JSON zurück (oft bei 404)

**Lösungen:**
- Prüfe URL-Pfad (z.B. `/api/plug/status` statt `/plug/status`)
- Prüfe ob Route existiert
- Prüfe Server-Logs

### 401 Unauthorized / 403 Forbidden

**Problem:** Authentifizierung fehlt (wenn implementiert)

**Lösung:**
- Füge API-Key im Header hinzu
- Setze Bearer Token

## Erweiterte Nutzung

### 1. MongoDB Direktzugriff simulieren

**Initial-Status setzen:**

```javascript
// MongoDB Shell oder Compass:
db.plug_control.updateOne(
  { _id: "shelly_plug_main" },
  { 
    $set: { 
      desired_state: "off",
      reported_state: "unknown" 
    }
  },
  { upsert: true }
)
```

### 2. Collection mit Team teilen

1. Rechtsklick auf Collection
2. **"Share"**
3. Wähle:
   - Link teilen
   - In Workspace verschieben
   - Als JSON exportieren

### 3. Dokumentation generieren

Postman kann automatisch API-Doku erstellen:

1. Klicke auf Collection
2. **"View Documentation"**
3. **"Publish"** für öffentliche Doku

## Beispiel-Workflows

### Website-Entwickler

```
1. GET /api/plug/status → Status holen
2. PUT /api/plug/desired → Heizung schalten
3. GET /api/plug/status → Verifizieren
```

### ESP32-Entwickler

```
1. GET /api/plug/desired → Was soll ich tun?
2. POST /api/plug/reported → Ich habe es gemacht!
3. POST /api/sensors → Sensordaten senden
```

### Full-Stack Test

```
1. POST /api/sensors → Sensordaten senden
2. GET /api/sensors/latest → Daten abrufen
3. PUT /api/plug/desired → Heizung basierend auf Temp schalten
4. GET /api/plug/status → Status prüfen
```

## Nützliche Links

- **Postman Dokumentation:** https://learning.postman.com/docs/
- **API Referenz:** Siehe `docs/05-PLUG-CONTROL.md`
- **Backend Code:** `backend/src/routes/plugRoutes.js`

## Support

Bei Fragen:
1. Prüfe `docs/05-PLUG-CONTROL.md` für API-Details
2. Prüfe Backend-Logs: `npm run dev` im Terminal
3. Prüfe MongoDB: `db.plug_control.find().pretty()`

Viel Erfolg beim Testen! 🚀







