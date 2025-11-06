# Sensor Monitoring Backend API

Backend API für das Sensor Monitoring Dashboard mit MongoDB Integration.

## 📁 Projektstruktur

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB Konfiguration
│   ├── controllers/
│   │   └── sensorController.js  # Request Handler
│   ├── models/
│   │   └── SensorMesswert.js    # Mongoose Schema
│   ├── routes/
│   │   ├── index.js             # Haupt-Router
│   │   └── sensorRoutes.js      # Sensor Endpoints
│   ├── services/
│   │   └── sensorService.js     # Business Logic
│   ├── middleware/
│   │   ├── errorHandler.js      # Fehlerbehandlung
│   │   └── rateLimiter.js       # Rate Limiting
│   ├── scripts/
│   │   └── seedData.js          # Testdaten generieren
│   └── server.js                # Express Server
├── .env.example                 # Umgebungsvariablen Vorlage
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Installation

### 1. Dependencies installieren

```bash
cd backend
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeite `.env` und passe die Werte an:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sensor_monitoring
CORS_ORIGIN=http://localhost:5173
```

### 3. MongoDB starten

Stelle sicher, dass MongoDB läuft:

```bash
# Mit Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Oder lokal installiert
mongod
```

### 4. Server starten

```bash
# Development mit Auto-Reload
npm run dev

# Production
npm start
```

Server läuft auf: `http://localhost:5000`

## 📊 Testdaten generieren

```bash
npm run seed
```

Generiert 12 Messwerte für die letzten 24 Stunden.

## 📡 API Endpoints

### Base URL: `http://localhost:5000/api`

### Sensor Endpoints

#### 1. Aktuellste Messwerte abrufen
```http
GET /api/sensors/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zeitstempel": "2025-11-04T14:30:00.000Z",
    "temperatur": 22.5,
    "luftfeuchtigkeit": 65,
    "stromverbrauch": 450
  }
}
```

#### 2. Letzte 24 Stunden
```http
GET /api/sensors/24h
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "zeitstempel": "2025-11-04T00:00:00.000Z",
      "temperatur": 18.5,
      "luftfeuchtigkeit": 65,
      "stromverbrauch": 320
    },
    ...
  ]
}
```

#### 3. 24h Durchschnittswerte
```http
GET /api/sensors/averages
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temperatur_avg": 21.4,
    "luftfeuchtigkeit_avg": 60,
    "stromverbrauch_avg": 535,
    "kwh_24h": 12.84,
    "anzahl_messungen": 12
  }
}
```

#### 4. Stündlich gruppierte Daten
```http
GET /api/sensors/hourly?hours=24
```

**Query Parameters:**
- `hours` (optional): Anzahl Stunden (1-168), default: 24

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "zeit": "14:00",
      "temperatur": 22.5,
      "luftfeuchtigkeit": 65,
      "stromverbrauch": 450
    },
    ...
  ]
}
```

#### 5. Daten für Zeitbereich
```http
GET /api/sensors/range?start=2025-11-03T00:00:00Z&end=2025-11-04T23:59:59Z
```

**Query Parameters:**
- `start` (required): Start-Datum (ISO 8601)
- `end` (required): End-Datum (ISO 8601)

#### 6. Statistiken
```http
GET /api/sensors/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latest": { ... },
    "averages_24h": { ... },
    "total_messwerte": 150
  }
}
```

#### 7. Neuen Messwert erstellen
```http
POST /api/sensors
Content-Type: application/json

{
  "temperatur": 22.5,
  "luftfeuchtigkeit": 65,
  "stromverbrauch": 450,  // NEU: Optional!
  "zeitstempel": "2025-11-04T14:30:00Z"  // optional
}
```

**Wichtig:** Ab sofort ist `stromverbrauch` **optional**! Du kannst auch nur Klima-Daten senden:

```http
POST /api/sensors
Content-Type: application/json

{
  "temperatur": 22.5,
  "luftfeuchtigkeit": 65
  // stromverbrauch weggelassen
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messwert erfolgreich erstellt",
  "data": { ... }
}
```

#### 8. Mehrere Messwerte erstellen (Bulk)
```http
POST /api/sensors/bulk
Content-Type: application/json

{
  "messwerte": [
    {
      "zeitstempel": "2025-11-04T00:00:00Z",
      "temperatur": 18.5,
      "luftfeuchtigkeit": 65,
      "stromverbrauch": 320
    },
    {
      "zeitstempel": "2025-11-04T02:00:00Z",
      "temperatur": 17.8,
      "luftfeuchtigkeit": 68,
      "stromverbrauch": 280
    }
  ]
}
```

#### 9. Stromverbrauch separat senden (NEU!)
```http
POST /api/sensors/power
Content-Type: application/json

{
  "stromverbrauch": 450,
  "zeitstempel": "2025-11-04T14:30:00Z",  // optional
  "sensor_id": "power_sensor_001"         // optional
}
```

**Use Case:** Perfekt, wenn der Stromverbrauch von einem separaten Gerät/Sensor kommt!

**Verhalten:**
- Sucht nach einem passenden Messwert im **5-Minuten-Zeitfenster**
- Wenn gefunden: Aktualisiert den Stromverbrauch
- Wenn nicht gefunden: Erstellt einen neuen Messwert (nur mit Stromverbrauch)

**Response (Update):**
```json
{
  "success": true,
  "message": "Stromverbrauch aktualisiert",
  "data": { ... }
}
```

**Response (Neu erstellt):**
```json
{
  "success": true,
  "message": "Stromverbrauch-Messwert erstellt",
  "data": { ... }
}
```

### Health Check
```http
GET /health
```

## 🔧 MongoDB Schema

```javascript
{
  zeitstempel: Date,        // Messzeitpunkt (erforderlich)
  temperatur: Number,       // -50 bis 100°C (optional)
  luftfeuchtigkeit: Number, // 0 bis 100% (optional)
  stromverbrauch: Number,   // in Watt (optional)
  meta: {
    standort: String,       // z.B. "Wohnzimmer"
    sensor_id: String       // z.B. "sensor_001"
  },
  createdAt: Date,          // Automatisch
  updatedAt: Date           // Automatisch
}
```

**Wichtig:** Alle Messwerte (temperatur, luftfeuchtigkeit, stromverbrauch) sind jetzt **optional**!
Das ermöglicht flexible Sensor-Setups (z.B. nur Klima oder nur Stromverbrauch).

### Indices
- `zeitstempel` (absteigend)
- `zeitstempel + meta.sensor_id` (compound)
- `createdAt` (TTL: 30 Tage)

## 🛡️ Security Features

- ✅ Helmet.js - Security Headers
- ✅ CORS - Cross-Origin Resource Sharing
- ✅ Rate Limiting - DDoS Schutz
- ✅ Input Validation - Mongoose Validators
- ✅ Error Handling - Zentrale Fehlerbehandlung

## 🧪 Testing mit cURL

```bash
# Latest Data
curl http://localhost:5000/api/sensors/latest

# 24h Data
curl http://localhost:5000/api/sensors/24h

# Averages
curl http://localhost:5000/api/sensors/averages

# Create Messwert (alle Werte)
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"temperatur":22.5,"luftfeuchtigkeit":65,"stromverbrauch":450}'

# Create Messwert (nur Klima, ohne Stromverbrauch)
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"temperatur":22.5,"luftfeuchtigkeit":65}'

# Stromverbrauch separat senden (NEU!)
curl -X POST http://localhost:5000/api/sensors/power \
  -H "Content-Type: application/json" \
  -d '{"stromverbrauch":450,"sensor_id":"power_sensor_001"}'
```

## 📝 Frontend Integration

### Mit Fetch API

```javascript
// Letzte 24h abrufen
const response = await fetch('http://localhost:5000/api/sensors/24h');
const { data } = await response.json();

// Durchschnittswerte
const avgResponse = await fetch('http://localhost:5000/api/sensors/averages');
const { data: averages } = await avgResponse.json();
```

### Mit Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const sensorAPI = {
  getLast24Hours: () => axios.get(`${API_BASE_URL}/sensors/24h`),
  getAverages: () => axios.get(`${API_BASE_URL}/sensors/averages`),
  getLatest: () => axios.get(`${API_BASE_URL}/sensors/latest`),
  createMesswert: (data) => axios.post(`${API_BASE_URL}/sensors`, data),
  
  // NEU: Stromverbrauch separat senden
  sendPowerConsumption: (stromverbrauch, sensor_id) => 
    axios.post(`${API_BASE_URL}/sensors/power`, { stromverbrauch, sensor_id })
};
```

## 🔄 Deployment

### Mit Docker Compose (Empfohlen)

Das Projekt enthält ein vollständiges Docker Setup mit MongoDB und Nginx Proxy Manager.

```bash
# .env Datei erstellen (aus ENV_TEMPLATE.txt)
cp ENV_TEMPLATE.txt .env
# Bearbeite .env und passe die Werte an!

# Alle Services starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f

# Services stoppen
docker-compose down
```

**Siehe [DOCKER_README.md](../DOCKER_README.md) für Details!**

### Mit Docker (nur Backend)

```bash
# Image bauen
cd backend
docker build -t sensor-api .

# Container starten
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/sensor_monitoring \
  --name sensor-backend \
  sensor-api
```

## 📚 Weitere Informationen

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)

