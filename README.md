# 🌡️ Sensor Monitoring Dashboard

Modernes Full-Stack Monitoring System für Temperatur, Luftfeuchtigkeit und Stromverbrauch mit React, Node.js, MongoDB und Docker.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Was ist das?

Ein vollständiges Monitoring-System, das:
- 📊 **Live-Daten visualisiert** - Schöne Charts mit Recharts
- 🔄 **Automatisch aktualisiert** - Alle 5 Minuten neue Daten
- 📱 **Responsive ist** - Funktioniert auf Desktop & Mobile
- 🐳 **Mit Docker läuft** - Einfaches Deployment
- 🔒 **Production-ready ist** - Mit SSL, Security Headers, Rate Limiting

## 📸 Screenshots

```
┌─────────────────────────────────────────┐
│  Temperatur  │  Luftfeuchtigkeit │ Strom │
│    22.5°C    │       65%         │ 450W  │
└─────────────────────────────────────────┘

📈 Temperatur & Luftfeuchtigkeit (24h)
  ┌───────────────────────────────────┐
  │  [Linien-Chart mit beiden Werten] │
  └───────────────────────────────────┘

📊 Stromverbrauch (24h)
  ┌───────────────────────────────────┐
  │  [Area Chart mit Verbrauch]       │
  └───────────────────────────────────┘
```

## 🚀 Quick Start

### Mit Docker (Empfohlen)

```bash
# 1. Repository klonen
git clone https://github.com/dein-username/sensor-monitoring.git
cd sensor-monitoring

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
nano .env  # Passwörter ändern!

# 3. Alle Services starten
docker compose up -d

# 4. Öffnen im Browser
Frontend: http://localhost:3000
Backend API: http://localhost:5000
Nginx Proxy Manager: http://localhost:81
```

### Manuell (Development)

```bash
# Backend starten
cd backend
npm install
npm run dev

# Frontend starten (neues Terminal)
cd frontend
npm install
npm run dev
```

## 📁 Projektstruktur

```
sensor-monitoring/
├── frontend/          # React Dashboard (Port 3000)
├── backend/           # Node.js API (Port 5000)
├── docker/            # Docker Konfiguration
├── docs/              # Dokumentation
├── examples/          # Sensor-Beispiele (Python, ESP32)
└── README.md          # Diese Datei
```

### Detaillierte Struktur

<details>
<summary>📂 Vollständige Ordnerstruktur anzeigen</summary>

```
sensor-monitoring/
│
├── 📄 README.md                    # Haupt-Dokumentation
├── 📄 .env.example                 # Umgebungsvariablen Template
├── 📄 docker-compose.yml           # Docker Services
│
├── 📁 frontend/                    # React Dashboard
│   ├── src/
│   │   ├── services/api.js        # API Kommunikation
│   │   ├── App.jsx                # Haupt-Komponente
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── 📁 backend/                     # Express.js API
│   ├── src/
│   │   ├── controllers/           # Request Handler
│   │   ├── models/                # MongoDB Schemas
│   │   ├── routes/                # API Routes
│   │   ├── services/              # Business Logic
│   │   └── server.js              # Entry Point
│   ├── package.json
│   └── ...
│
├── 📁 docs/                        # Dokumentation
│   ├── 01-SETUP.md                # Installation
│   ├── 02-API.md                  # API Docs
│   ├── 03-DEPLOYMENT.md           # Server Deployment
│   ├── 04-DOCKER.md               # Docker Guide
│   └── 05-SENSORS.md              # Sensor Integration
│
└── 📁 examples/                    # Beispiel-Code
    └── sensors/
        ├── python/                # Python Scripts
        ├── esp32/                 # Arduino/ESP32
        └── README.md
```
</details>

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 18** - UI Framework
- ⚡ **Vite** - Build Tool
- 🎨 **Tailwind CSS** - Styling
- 📊 **Recharts** - Charts & Visualisierung

### Backend
- 🟢 **Node.js** - Runtime
- 🚂 **Express** - Web Framework
- 🍃 **MongoDB** - Datenbank
- 📦 **Mongoose** - ODM

### DevOps
- 🐳 **Docker** - Containerization
- 🔄 **Docker Compose** - Multi-Container
- 🔐 **Nginx Proxy Manager** - Reverse Proxy & SSL
- 🛡️ **Helmet** - Security Headers

## 📖 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [📦 Setup Guide](docs/01-SETUP.md) | Installation & Erste Schritte |
| [🔌 API Dokumentation](docs/02-API.md) | Alle API Endpoints |
| [🚀 Deployment Guide](docs/03-DEPLOYMENT.md) | Server Deployment |
| [🐳 Docker Guide](docs/04-DOCKER.md) | Docker & Compose |
| [🌡️ Sensor Integration](docs/05-SENSORS.md) | Sensoren anbinden |

## 🔧 Konfiguration

### Umgebungsvariablen

Kopiere `.env.example` zu `.env` und passe die Werte an:

```env
# Server
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=3000

# MongoDB
MONGO_ROOT_PASSWORD=DEIN_SICHERES_PASSWORT
MONGO_DB_NAME=sensor_monitoring

# API
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

## 🌐 API Endpoints

```
GET  /api/sensors/latest       # Aktuellste Messwerte
GET  /api/sensors/24h          # Letzte 24 Stunden
GET  /api/sensors/averages     # Durchschnittswerte
GET  /api/sensors/hourly       # Stündlich gruppiert
POST /api/sensors              # Neuen Messwert erstellen
```

[Vollständige API Dokumentation →](docs/02-API.md)

## 🤖 Sensor Integration

### Daten senden

Dein Sensor sendet Daten per HTTP POST:

```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "temperatur": 22.5,
    "luftfeuchtigkeit": 65,
    "stromverbrauch": 450
  }'
```

### Beispiel-Scripts

- 🐍 **Python** (Raspberry Pi) - [Siehe examples/sensors/python/](examples/sensors/python/)
- 🔌 **ESP32** (Arduino) - [Siehe examples/sensors/esp32/](examples/sensors/esp32/)

[Vollständige Sensor-Anleitung →](docs/05-SENSORS.md)

## 🚀 Deployment

### Production mit Docker

```bash
# 1. .env für Production konfigurieren
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# 2. Services starten
docker compose up -d --build

# 3. SSL in Nginx Proxy Manager aktivieren
# → http://server-ip:81
```

### Server-Anforderungen

- Linux Server (Ubuntu 20.04+)
- Mindestens 2GB RAM
- 20GB Speicher
- Docker & Docker Compose

[Vollständige Deployment-Anleitung →](docs/03-DEPLOYMENT.md)

## 🔒 Sicherheit

✅ **HTTPS** - SSL via Let's Encrypt
✅ **Authentication** - MongoDB mit Passwort
✅ **Rate Limiting** - DDoS Schutz
✅ **Security Headers** - Helmet.js
✅ **CORS** - Konfigurierbar
✅ **Input Validation** - Mongoose Validators

## 📊 Features

### Dashboard
- ✨ Moderne, responsive UI
- 📈 Live-Charts (Recharts)
- 🔄 Auto-Update alle 5 Minuten
- 📱 Mobile-optimiert
- 🎨 Gradient-Design

### Backend
- 🚀 RESTful API
- 📦 MongoDB Integration
- ⚡ Schnelle Queries mit Indices
- 🔄 Automatische Daten-Aggregation
- 🗑️ Auto-Cleanup alter Daten (30 Tage)

### Monitoring
- 📊 24h Durchschnittswerte
- ⚡ kWh Berechnung
- 📈 Stündliche Gruppierung
- 🎯 Flexible Zeiträume

## 🧪 Testing

### Backend testen

```bash
# Health Check
curl http://localhost:5000/health

# Testdaten generieren
cd backend
npm run seed

# API testen
curl http://localhost:5000/api/sensors/latest
```

### Frontend testen

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

## 🔄 Updates

```bash
# Code aktualisieren
git pull

# Services neu bauen
docker compose down
docker compose up -d --build

# Alte Images aufräumen
docker image prune -a
```

## 📝 Scripts

```bash
# Development
npm run dev              # Frontend Dev Server
npm run dev:backend      # Backend Dev Server

# Production
npm run build            # Frontend Build
npm start                # Backend starten

# Docker
docker compose up -d     # Services starten
docker compose down      # Services stoppen
docker compose logs -f   # Logs anzeigen

# Datenbank
npm run seed            # Testdaten generieren
```

## 🐛 Troubleshooting

<details>
<summary>Services starten nicht</summary>

```bash
# Logs prüfen
docker compose logs -f

# Einzelnen Service neu starten
docker compose restart backend

# Komplett neu bauen
docker compose down -v
docker compose up -d --build
```
</details>

<details>
<summary>API nicht erreichbar</summary>

```bash
# Backend Status
curl http://localhost:5000/health

# Firewall prüfen
sudo ufw status

# Port belegt?
sudo lsof -i :5000
```
</details>

<details>
<summary>MongoDB Verbindungsfehler</summary>

```bash
# MongoDB Logs
docker compose logs mongodb

# MongoDB Status
docker exec sensor_mongodb mongosh --eval "db.serverStatus().ok"

# Verbindung testen
docker exec -it sensor_mongodb mongosh -u admin -p
```
</details>

[Mehr Troubleshooting →](docs/04-DOCKER.md#troubleshooting)

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert.

## 💬 Support

- 📧 **Email:** support@example.com
- 💭 **Issues:** [GitHub Issues](https://github.com/dein-username/sensor-monitoring/issues)
- 📖 **Docs:** [Dokumentation](docs/)

## 🙏 Credits

- [React](https://reactjs.org/)
- [Recharts](https://recharts.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## ⭐ Star History

Wenn dir dieses Projekt gefällt, gib ihm einen Stern! ⭐

---

**Made with ❤️ for IoT Monitoring**
