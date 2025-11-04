# 🐳 Docker Deployment Guide

Vollständiges Docker Setup mit MongoDB, Backend API, Frontend und Nginx Proxy Manager.

## 📦 Services

| Service | Port | Beschreibung |
|---------|------|--------------|
| **Frontend** | 3000 | React Dashboard |
| **Backend API** | 5000 | Express.js API |
| **MongoDB** | 27017 | Datenbank |
| **Nginx Proxy Manager** | 80, 443, 81 | Reverse Proxy & SSL |

## 🚀 Quick Start

### 1. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env

# Passwörter anpassen!
nano .env
```

**Wichtig:** Ändere diese Werte in der `.env`:
- `MONGO_ROOT_PASSWORD` - Sicheres MongoDB Passwort
- `MONGO_EXPRESS_PASSWORD` - Admin Passwort für Mongo Express

### 2. Services starten

```bash
# Alle Services starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f

# Nur bestimmte Services starten
docker-compose up -d mongodb backend
```

### 3. Services überprüfen

```bash
# Status anzeigen
docker-compose ps

# Health Check
curl http://localhost:5000/health
```

## 🔧 Konfiguration

### Nginx Proxy Manager Setup

1. **Admin UI öffnen:** http://localhost:81

2. **Erster Login:**
   - Email: `admin@example.com`
   - Passwort: `changeme`

3. **Passwort ändern** (wichtig!)

4. **Proxy Host erstellen:**
   - Domain: `api.yourdomain.com`
   - Forward Hostname: `backend`
   - Forward Port: `5000`
   - Enable SSL (Let's Encrypt)

5. **Frontend Proxy:**
   - Domain: `yourdomain.com`
   - Forward Hostname: `frontend`
   - Forward Port: `80`
   - Enable SSL

### MongoDB Zugriff

**Mit MongoDB Compass (empfohlen):**
```
mongodb://admin:sicheres_passwort_hier@localhost:27017/
```

**Über SSH Tunnel (Production):**
```bash
# SSH Tunnel vom lokalen PC zum Server erstellen
ssh -L 27017:localhost:27017 user@server-ip

# Dann in MongoDB Compass verbinden:
mongodb://admin:passwort@localhost:27017/
```

**Über Docker:**
```bash
docker exec -it sensor_mongodb mongosh -u admin -p sicheres_passwort_hier
```

## 📊 Testdaten generieren

```bash
# In den Backend Container
docker exec -it sensor_backend npm run seed
```

## 🔄 Service Management

### Neustart einzelner Services

```bash
# Backend neu starten
docker-compose restart backend

# Frontend neu bauen und starten
docker-compose up -d --build frontend
```

### Logs anzeigen

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur letzte 100 Zeilen
docker-compose logs --tail=100 backend
```

### Services stoppen

```bash
# Alle Services stoppen
docker-compose stop

# Alle Services stoppen und entfernen
docker-compose down

# Services + Volumes löschen (ACHTUNG: Daten gehen verloren!)
docker-compose down -v
```

## 🛡️ Security Best Practices

### Production Checklist

- [ ] Ändere alle Standard-Passwörter in `.env`
- [ ] Setze `NODE_ENV=production`
- [ ] Aktiviere SSL in Nginx Proxy Manager
- [ ] Verwende starke Passwörter (min. 16 Zeichen)
- [ ] Beschränke MongoDB Port nur auf internes Netzwerk
- [ ] Aktiviere MongoDB Authentication
- [ ] Setze CORS_ORIGIN auf deine Domain
- [ ] Aktiviere Rate Limiting
- [ ] Regelmäßige Backups einrichten

### Ports schließen (Production)

In `docker-compose.yml` diese Ports auskommentieren:
```yaml
# MongoDB - nur intern
# ports:
#   - "27017:27017"

# Backend - nur über Nginx
# ports:
#   - "5000:5000"
```

## 💾 Backup & Restore

### MongoDB Backup

```bash
# Backup erstellen
docker exec sensor_mongodb mongodump \
  --username=admin \
  --password=sicheres_passwort_hier \
  --authenticationDatabase=admin \
  --out=/backup

# Backup raus kopieren
docker cp sensor_mongodb:/backup ./mongodb_backup_$(date +%Y%m%d)
```

### MongoDB Restore

```bash
# Backup rein kopieren
docker cp ./mongodb_backup sensor_mongodb:/backup

# Restore ausführen
docker exec sensor_mongodb mongorestore \
  --username=admin \
  --password=sicheres_passwort_hier \
  --authenticationDatabase=admin \
  /backup
```

### Automatisches Backup (Cron Job)

```bash
# Crontab bearbeiten
crontab -e

# Jeden Tag um 2 Uhr Backup
0 2 * * * /path/to/backup-script.sh
```

**backup-script.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec sensor_mongodb mongodump \
  --username=admin \
  --password=$MONGO_ROOT_PASSWORD \
  --authenticationDatabase=admin \
  --gzip \
  --archive=/backup/backup_$DATE.gz

docker cp sensor_mongodb:/backup/backup_$DATE.gz $BACKUP_DIR/

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "backup_*.gz" -mtime +30 -delete
```

## 🔍 Troubleshooting

### Backend kann nicht mit MongoDB verbinden

```bash
# MongoDB Logs prüfen
docker-compose logs mongodb

# Netzwerk prüfen
docker network inspect sensor_network

# MongoDB Health Check
docker exec sensor_mongodb mongosh --eval "db.adminCommand('ping')"
```

### Port bereits belegt

```bash
# Prozess auf Port finden
lsof -i :5000
netstat -ano | findstr :5000

# Andere Ports in .env verwenden
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

### Container startet nicht

```bash
# Detaillierte Logs
docker-compose logs --tail=50 backend

# Container Status
docker inspect sensor_backend

# Interaktiv starten (für Debugging)
docker-compose run --rm backend sh
```

### MongoDB Speicherplatz voll

```bash
# Volumes anzeigen
docker volume ls

# Volume Größe prüfen
docker system df -v

# Alte Daten bereinigen
docker system prune -a
```

## 🌐 Production Deployment

### Mit HTTPS (über Nginx Proxy Manager)

1. **DNS konfigurieren:**
   ```
   api.yourdomain.com → Server IP
   yourdomain.com → Server IP
   ```

2. **Proxy Hosts in Nginx Proxy Manager:**

   **Backend API:**
   - Domain: `api.yourdomain.com`
   - Forward: `backend:5000`
   - SSL: Let's Encrypt aktivieren

   **Frontend:**
   - Domain: `yourdomain.com`
   - Forward: `frontend:80`
   - SSL: Let's Encrypt aktivieren

3. **.env aktualisieren:**
   ```env
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   VITE_API_URL=https://api.yourdomain.com/api
   ```

4. **Services neu starten:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## 📈 Monitoring

### Container Ressourcen überwachen

```bash
# CPU & Memory Usage
docker stats

# Nur bestimmte Container
docker stats sensor_backend sensor_mongodb
```

### Health Checks

```bash
# Backend Health
curl http://localhost:5000/health

# MongoDB Health
docker exec sensor_mongodb mongosh --eval "db.serverStatus().ok"
```

## 🔄 Updates

### Services aktualisieren

```bash
# Images pullen
docker-compose pull

# Services neu bauen und starten
docker-compose up -d --build

# Alte Images entfernen
docker image prune -a
```

## 📝 Weitere Befehle

```bash
# In Container Shell
docker exec -it sensor_backend sh

# Container neu bauen
docker-compose build --no-cache backend

# Alle Volumes anzeigen
docker volume ls

# Volume löschen (ACHTUNG: Daten verloren!)
docker volume rm sensor_mongodb_data

# Netzwerk Informationen
docker network inspect sensor_network
```

## 🆘 Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs -f`
2. Health Checks ausführen
3. Container neu starten: `docker-compose restart`
4. Bei Bedarf neu bauen: `docker-compose up -d --build`

