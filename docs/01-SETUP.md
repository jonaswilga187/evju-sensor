# 📦 Setup & Installation Guide

Schritt-für-Schritt Anleitung zur Installation des Sensor Monitoring Systems.

## 📋 Voraussetzungen

### Für Development
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 5.0+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/downloads))

### Für Production (Docker)
- **Docker** 24+ ([Installation](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (meist mit Docker dabei)

## 🚀 Installation

### Option 1: Mit Docker (Empfohlen)

#### 1. Repository klonen

```bash
git clone https://github.com/dein-username/sensor-monitoring.git
cd sensor-monitoring
```

#### 2. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env

# Bearbeiten
nano .env
```

**Wichtig ändern:**
```env
# Sichere Passwörter!
MONGO_ROOT_PASSWORD=dein_sehr_sicheres_passwort_123

# Production URLs (später)
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

#### 3. Services starten

```bash
# Alle Services starten
docker compose up -d

# Status prüfen
docker compose ps

# Logs verfolgen
docker compose logs -f
```

#### 4. Testen

```bash
# Backend Health Check
curl http://localhost:5000/health

# Frontend öffnen
http://localhost:3000
```

#### 5. Testdaten generieren (Optional)

```bash
docker exec sensor_backend npm run seed
```

### Option 2: Manuell (Development)

#### 1. MongoDB installieren & starten

**Ubuntu/Debian:**
```bash
# MongoDB installieren
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB starten
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
# Mit Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:**
- MongoDB Installer von [mongodb.com](https://www.mongodb.com/try/download/community) herunterladen
- Als Service installieren

#### 2. Backend Setup

```bash
# In backend Ordner wechseln
cd backend

# Dependencies installieren
npm install

# .env erstellen (im backend Ordner)
cp ../.env.example .env
nano .env

# Anpassen für lokal:
MONGODB_URI=mongodb://localhost:27017/sensor_monitoring

# Server starten
npm run dev

# Sollte anzeigen:
# 🚀 Server läuft auf Port 5000
# ✅ MongoDB verbunden: localhost
```

#### 3. Frontend Setup

**Neues Terminal öffnen!**

```bash
# In frontend Ordner wechseln
cd frontend

# Dependencies installieren
npm install

# Dev Server starten
npm run dev

# Sollte anzeigen:
# VITE ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

#### 4. Browser öffnen

```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
```

#### 5. Testdaten generieren

```bash
cd backend
npm run seed
```

## ✅ Checkliste

Nach der Installation sollte folgendes funktionieren:

- [ ] MongoDB läuft
  ```bash
  # Docker:
  docker compose ps | grep mongodb
  
  # Manuell:
  mongosh --eval "db.version()"
  ```

- [ ] Backend läuft
  ```bash
  curl http://localhost:5000/health
  # → {"status":"OK",...}
  ```

- [ ] Frontend läuft
  ```bash
  curl http://localhost:3000
  # → HTML Response
  ```

- [ ] API funktioniert
  ```bash
  curl http://localhost:5000/api/sensors/24h
  # → {"success":true,"data":[...]}
  ```

- [ ] Dashboard zeigt Daten
  - Browser: http://localhost:3000
  - Charts sichtbar
  - Werte aktualisieren

## 🔧 Konfiguration

### .env Variablen

```env
# ==============================================
# SERVER
# ==============================================
NODE_ENV=development          # oder 'production'
BACKEND_PORT=5000            # Backend Port
FRONTEND_PORT=3000           # Frontend Port

# ==============================================
# DATABASE
# ==============================================
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=sicheres_passwort_hier
MONGO_DB_NAME=sensor_monitoring

# Docker MongoDB URI (automatisch):
# mongodb://admin:passwort@mongodb:27017/sensor_monitoring

# Lokal MongoDB URI:
MONGODB_URI=mongodb://localhost:27017/sensor_monitoring

# ==============================================
# API
# ==============================================
CORS_ORIGIN=http://localhost:5173   # Frontend URL
VITE_API_URL=http://localhost:5000/api  # Backend URL für Frontend

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 Minuten
RATE_LIMIT_MAX_REQUESTS=100    # Max Requests pro Window
```

### Ports

| Service | Port | Beschreibung |
|---------|------|--------------|
| Frontend | 3000 | React App (Production) |
| Frontend Dev | 5173 | Vite Dev Server |
| Backend | 5000 | Express API |
| MongoDB | 27017 | Datenbank |
| Nginx Proxy Manager | 81 | Admin UI |
| HTTP | 80 | Web Traffic |
| HTTPS | 443 | Secure Web Traffic |

## 🧪 Tests

### Backend testen

```bash
cd backend

# Health Check
curl http://localhost:5000/health

# API Version
curl http://localhost:5000/api

# Testdaten erstellen
npm run seed

# Daten abrufen
curl http://localhost:5000/api/sensors/24h

# Neuen Messwert senden
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"temperatur":22.5,"luftfeuchtigkeit":65,"stromverbrauch":450}'
```

### Frontend testen

1. Browser öffnen: http://localhost:5173
2. DevTools öffnen (F12)
3. Console prüfen - keine Fehler
4. Network Tab - API Calls erfolgreich
5. Charts werden angezeigt

### Datenbank testen

```bash
# Docker:
docker exec -it sensor_mongodb mongosh -u admin -p

# Lokal:
mongosh

# Dann in MongoDB Shell:
use sensor_monitoring
db.sensor_messwerte.find().limit(5)
db.sensor_messwerte.countDocuments()
```

## 🐛 Häufige Probleme

### Port bereits belegt

```bash
# Port-Belegung prüfen
# Linux/Mac:
lsof -i :5000
# Windows:
netstat -ano | findstr :5000

# Prozess beenden oder anderen Port verwenden
```

### MongoDB Verbindungsfehler

```bash
# Prüfen ob MongoDB läuft
# Docker:
docker compose ps mongodb

# Lokal:
sudo systemctl status mongod

# Verbindung testen
mongosh mongodb://localhost:27017/
```

### Node Module Fehler

```bash
# Node Modules löschen und neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Docker Image Build Fehler

```bash
# Cache löschen und neu bauen
docker compose down
docker system prune -a
docker compose up -d --build
```

## 📚 Nächste Schritte

Nach erfolgreicher Installation:

1. 📖 [API Dokumentation](02-API.md) lesen
2. 🌡️ [Sensoren einrichten](05-SENSORS.md)
3. 🚀 [Deployment vorbereiten](03-DEPLOYMENT.md)

## 💡 Tipps

### Development Workflow

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Logs
docker compose logs -f mongodb
```

### VS Code Extensions (empfohlen)

- **ES7+ React Snippets** - Schnellere React Entwicklung
- **Tailwind CSS IntelliSense** - Tailwind Autocomplete
- **MongoDB for VS Code** - MongoDB GUI in VS Code
- **Docker** - Docker Management
- **REST Client** - API Testing direkt in VS Code

### Auto-Restart bei Änderungen

**Backend:**
```bash
# Nutzt nodemon (bereits konfiguriert)
npm run dev
```

**Frontend:**
```bash
# Vite macht Hot Module Replacement automatisch
npm run dev
```

## 🔄 Updates

```bash
# Code aktualisieren
git pull

# Dependencies aktualisieren
cd backend && npm update
cd frontend && npm update

# Docker Images aktualisieren
docker compose pull
docker compose up -d --build
```

---

**Fertig? → Weiter zu [API Dokumentation](02-API.md)**


