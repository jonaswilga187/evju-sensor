# 🚀 Server Deployment Guide

Komplette Anleitung zum Deployment des Sensor Monitoring Systems auf einem Linux Server.

## 📋 Voraussetzungen

### Was dein Server braucht:
- Linux Server (Ubuntu 20.04+ empfohlen)
- Mindestens 2GB RAM
- 20GB freier Speicherplatz
- Root oder sudo Zugriff
- Domain (optional, für SSL)

## 🔧 Server Vorbereitung

### 1. Server Updates

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y
```

### 2. Docker installieren

```bash
# Docker GPG Key hinzufügen
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker Repository hinzufügen
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Docker ohne sudo nutzen
sudo usermod -aG docker $USER
newgrp docker

# Docker Version prüfen
docker --version
docker compose version
```

### 3. Firewall konfigurieren

```bash
# UFW Firewall installieren (falls nicht vorhanden)
sudo apt install ufw -y

# Standard Regeln
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH erlauben (WICHTIG!)
sudo ufw allow 22/tcp

# HTTP & HTTPS erlauben
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Nginx Proxy Manager Admin UI (optional, später schließen!)
sudo ufw allow 81/tcp

# Firewall aktivieren
sudo ufw enable

# Status prüfen
sudo ufw status
```

## 📦 Projekt auf Server übertragen

### Option 1: Mit Git (Empfohlen)

```bash
# Git installieren
sudo apt install git -y

# Projekt klonen
cd /home/$USER
git clone https://github.com/dein-username/sensor-monitoring.git
cd sensor-monitoring
```

### Option 2: Mit SCP/SFTP

**Von deinem lokalen PC:**

```bash
# Komplettes Projekt hochladen
scp -r /pfad/zum/projekt username@server-ip:/home/username/sensor-monitoring

# Oder mit rsync (besser für große Projekte)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /pfad/zum/projekt/ username@server-ip:/home/username/sensor-monitoring/
```

### Option 3: Mit FileZilla / WinSCP

1. Verbindung zum Server herstellen (SFTP)
2. Kompletten Projektordner hochladen
3. `node_modules` Ordner NICHT hochladen (wird im Container gebaut)

## ⚙️ Server Konfiguration

### 1. .env Datei erstellen

```bash
cd /home/$USER/sensor-monitoring

# .env erstellen
cp .env.example .env

# Mit nano bearbeiten
nano .env
```

### 2. .env für Production anpassen

```env
# Node Environment
NODE_ENV=production

# Backend API
BACKEND_PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=https://api.yourdomain.com/api

# MongoDB - SICHERE PASSWÖRTER!
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=DEIN_SICHERES_PASSWORT_HIER_123!@#
MONGO_DB_NAME=sensor_monitoring
```

**Wichtig:**
- Verwende **starke, einzigartige Passwörter** (min. 16 Zeichen)
- Ändere `yourdomain.com` zu deiner echten Domain
- Speichern: `CTRL+O`, `Enter`, `CTRL+X`

### 3. Production docker-compose.yml anpassen

```bash
nano docker-compose.yml
```

**MongoDB Port schließen (nur intern):**

```yaml
  mongodb:
    # ports:
    #   - "${MONGO_PORT}:27017"  # Auskommentieren für Production
```

## 🚀 Services starten

### 1. Docker Images bauen und starten

```bash
cd /home/$USER/sensor-monitoring

# Alle Services starten
docker compose up -d --build

# Logs verfolgen
docker compose logs -f

# Nur Fehler anzeigen
docker compose logs -f --tail=100
```

### 2. Status prüfen

```bash
# Services anzeigen
docker compose ps

# Health Checks
curl http://localhost:5000/health

# Logs einzelner Services
docker compose logs backend
docker compose logs mongodb
```

## 🌐 Domain & SSL Einrichtung

### 1. DNS Einträge erstellen

Bei deinem Domain-Anbieter (z.B. Cloudflare, Namecheap):

```
A Record    @                → Server-IP
A Record    api              → Server-IP
A Record    www              → Server-IP
```

### 2. Nginx Proxy Manager konfigurieren

**Admin UI öffnen:**
```
http://DEINE-SERVER-IP:81
```

**Erster Login:**
- Email: `admin@example.com`
- Passwort: `changeme`

**SOFORT Passwort ändern!**

### 3. Proxy Hosts erstellen

#### Backend API Proxy:

1. **Proxy Hosts** → **Add Proxy Host**
2. **Details:**
   - Domain Names: `api.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `backend`
   - Forward Port: `5000`
   - ✅ Block Common Exploits
   - ✅ Websockets Support

3. **SSL Tab:**
   - ✅ SSL Certificate
   - SSL Certificate: `Request a new SSL Certificate`
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled
   - Email: deine@email.com
   - ✅ I Agree

#### Frontend Proxy:

1. **Add Proxy Host**
2. **Details:**
   - Domain Names: `yourdomain.com`, `www.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `frontend`
   - Forward Port: `80`
   - ✅ Block Common Exploits

3. **SSL:** (gleich wie oben)

### 4. Admin UI Port schließen (nach Setup!)

```bash
# docker-compose.yml bearbeiten
nano docker-compose.yml

# Nginx Proxy Manager Ports ändern:
nginx-proxy-manager:
  ports:
    - "80:80"
    - "443:443"
    # - "81:81"  # Port 81 auskommentieren!

# Services neu starten
docker compose down
docker compose up -d
```

## 🔐 Sicherheit

### 1. Ports überprüfen

```bash
# Offene Ports anzeigen
sudo ss -tulpn | grep LISTEN

# Sollte nur zeigen:
# :22 (SSH)
# :80 (HTTP)
# :443 (HTTPS)
```

### 2. SSH absichern

```bash
sudo nano /etc/ssh/sshd_config

# Ändern:
PermitRootLogin no
PasswordAuthentication no  # Nur mit SSH-Key!
Port 2222  # Optional: SSH Port ändern

# SSH neu starten
sudo systemctl restart sshd
```

### 3. Fail2Ban installieren (DDoS Schutz)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Automatische Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 💾 Backup einrichten

### 1. Backup Script erstellen

```bash
mkdir -p ~/backups
nano ~/backup-mongodb.sh
```

**backup-mongodb.sh:**
```bash
#!/bin/bash

BACKUP_DIR="$HOME/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DAYS_TO_KEEP=30

# Backup Dir erstellen
mkdir -p $BACKUP_DIR

# MongoDB Backup
docker exec sensor_mongodb mongodump \
  --username=admin \
  --password=$MONGO_ROOT_PASSWORD \
  --authenticationDatabase=admin \
  --gzip \
  --archive=/backup/backup_$DATE.gz

# Backup raus kopieren
docker cp sensor_mongodb:/backup/backup_$DATE.gz $BACKUP_DIR/

# Alte Backups löschen
find $BACKUP_DIR -name "backup_*.gz" -mtime +$DAYS_TO_KEEP -delete

echo "Backup erfolgreich: backup_$DATE.gz"
```

**Ausführbar machen:**
```bash
chmod +x ~/backup-mongodb.sh
```

### 2. Cronjob einrichten (täglich um 2 Uhr)

```bash
crontab -e

# Hinzufügen:
0 2 * * * /home/$USER/backup-mongodb.sh >> /home/$USER/backup.log 2>&1
```

### 3. Backup testen

```bash
~/backup-mongodb.sh

# Backup prüfen
ls -lh ~/backups/mongodb/
```

## 🔄 Updates & Wartung

### Code Updates

```bash
cd /home/$USER/sensor-monitoring

# Mit Git
git pull origin main

# Services neu bauen
docker compose down
docker compose up -d --build
```

### Docker Images aktualisieren

```bash
# Images pullen
docker compose pull

# Services neu starten
docker compose up -d

# Alte Images löschen
docker image prune -a
```

### Logs rotieren

```bash
# Docker Logging konfigurieren
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
docker compose up -d
```

## 📊 Monitoring

### System Ressourcen

```bash
# Docker Stats
docker stats

# Disk Usage
docker system df

# Container Logs
docker compose logs -f --tail=50
```

### Health Checks

```bash
# Backend
curl https://api.yourdomain.com/health

# MongoDB
docker exec sensor_mongodb mongosh --eval "db.serverStatus().ok"
```

## 🆘 Troubleshooting

### Services starten nicht

```bash
# Logs prüfen
docker compose logs --tail=100

# Services einzeln prüfen
docker compose ps

# Service neu starten
docker compose restart backend
```

### Port bereits belegt

```bash
# Prozess finden
sudo lsof -i :80
sudo lsof -i :443

# Prozess beenden
sudo kill -9 PID
```

### MongoDB Connection Error

```bash
# MongoDB Logs
docker compose logs mongodb

# MongoDB Shell
docker exec -it sensor_mongodb mongosh -u admin -p

# Netzwerk prüfen
docker network ls
docker network inspect sensor_network
```

### Speicherplatz voll

```bash
# Disk Usage anzeigen
df -h
docker system df

# Aufräumen
docker system prune -a
docker volume prune

# Logs löschen
sudo journalctl --vacuum-time=3d
```

## 📈 Performance Optimierung

### 1. Swap Speicher erstellen (falls < 4GB RAM)

```bash
# 2GB Swap erstellen
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Permanent machen
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Docker Resource Limits

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

## ✅ Deployment Checklist

- [ ] Server mit Updates aktualisiert
- [ ] Docker & Docker Compose installiert
- [ ] Firewall konfiguriert (nur 22, 80, 443)
- [ ] Projekt auf Server übertragen
- [ ] .env erstellt mit starken Passwörtern
- [ ] NODE_ENV=production gesetzt
- [ ] MongoDB Port geschlossen (nur intern erreichbar)
- [ ] Services gestartet: `docker compose up -d`
- [ ] DNS Einträge erstellt
- [ ] Nginx Proxy Manager konfiguriert
- [ ] SSL Zertifikate installiert
- [ ] HTTPS funktioniert
- [ ] Admin UI Port 81 geschlossen
- [ ] Backup Script eingerichtet
- [ ] Cronjob für Backups erstellt
- [ ] Monitoring aufgesetzt
- [ ] Dokumentation gelesen

## 🎉 Fertig!

Deine App läuft jetzt auf:
- **Frontend:** https://yourdomain.com
- **Backend API:** https://api.yourdomain.com/api

## 📞 Support Commands

```bash
# Status aller Services
docker compose ps

# Logs live verfolgen
docker compose logs -f

# Service neu starten
docker compose restart backend

# Alle Services neu starten
docker compose restart

# Services stoppen
docker compose down

# Services komplett neu bauen
docker compose up -d --build --force-recreate

# In Container Shell
docker exec -it sensor_backend sh
```

