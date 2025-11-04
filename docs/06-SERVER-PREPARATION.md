# 🖥️ Server Vorbereitung - Checkliste

Was muss auf dem Server vorhanden sein, **BEVOR** du `git clone` machst?

## ✅ Checkliste

### 1. **Grundlegende Software installieren**

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Git installieren
sudo apt install git -y
git --version

# Curl installieren (für Downloads)
sudo apt install curl -y
```

### 2. **Docker & Docker Compose installieren**

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker ohne sudo nutzen
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose installieren (meist schon dabei)
docker compose version

# Testen
docker run hello-world
docker compose version
```

### 3. **Firewall konfigurieren**

```bash
# UFW installieren (falls nicht vorhanden)
sudo apt install ufw -y

# Standard-Regeln
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Wichtige Ports öffnen
sudo ufw allow 22/tcp     # SSH (WICHTIG!)
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Optional für Setup (später schließen!):
sudo ufw allow 81/tcp     # Nginx Proxy Manager Admin
sudo ufw allow 5000/tcp   # Backend API (temporär)

# Firewall aktivieren
sudo ufw enable

# Status prüfen
sudo ufw status verbose
```

### 4. **SSH Key erstellen** (Empfohlen für GitHub)

```bash
# SSH Key generieren
ssh-keygen -t ed25519 -C "server@yourdomain.com"

# Public Key anzeigen
cat ~/.ssh/id_ed25519.pub

# Kopiere den Output und füge ihn bei GitHub hinzu:
# GitHub → Settings → SSH Keys → New SSH Key
```

### 5. **Arbeitsverzeichnis erstellen**

```bash
# Ordner erstellen
mkdir -p ~/projects
cd ~/projects

# Rechte prüfen
ls -la
```

### 6. **.env Datei vorbereiten**

Du wirst nach dem Clone die `.env` Datei anpassen müssen:

```bash
# Nach git clone:
cd sensor-monitoring
cp .env.example .env
nano .env
```

**Wichtig in .env ändern:**
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
MONGO_ROOT_PASSWORD=SEHR_SICHERES_PASSWORT_123!@#
```

### 7. **Domain vorbereiten** (Optional, aber empfohlen)

Bei deinem Domain-Anbieter (z.B. Cloudflare, Namecheap):

```
A Record    @                → Server-IP
A Record    api              → Server-IP
A Record    www              → Server-IP
```

**DNS Propagation testen:**
```bash
nslookup yourdomain.com
ping yourdomain.com
```

---

## 🚀 Jetzt Git Clone ausführen

Nach der Vorbereitung kannst du klonen:

### Mit HTTPS (einfach)

```bash
cd ~/projects
git clone https://github.com/USERNAME/sensor-monitoring.git
cd sensor-monitoring
```

### Mit SSH (empfohlen, wenn SSH Key konfiguriert)

```bash
cd ~/projects
git clone git@github.com:USERNAME/sensor-monitoring.git
cd sensor-monitoring
```

---

## ⚙️ Setup nach dem Clone

### 1. **Umgebungsvariablen konfigurieren**

```bash
# .env erstellen und anpassen
cp .env.example .env
nano .env
```

**Wichtig ändern:**
- `MONGO_ROOT_PASSWORD` - Sicheres Passwort!
- `NODE_ENV=production`
- `CORS_ORIGIN=https://yourdomain.com`
- `VITE_API_URL=https://api.yourdomain.com/api`

### 2. **Services starten**

```bash
# Docker Images pullen und starten
docker compose up -d

# Status prüfen
docker compose ps

# Logs verfolgen
docker compose logs -f
```

### 3. **Health Check**

```bash
# Backend testen
curl http://localhost:5000/health

# Sollte zurückgeben:
# {"status":"OK","timestamp":"...","uptime":...}
```

### 4. **Nginx Proxy Manager konfigurieren**

1. **Admin UI öffnen:** `http://SERVER-IP:81`
2. **Login:** 
   - Email: `admin@example.com`
   - Passwort: `changeme`
3. **Passwort sofort ändern!**
4. **Proxy Hosts erstellen:**

   **Backend (api.yourdomain.com):**
   - Domain: `api.yourdomain.com`
   - Forward to: `backend:5000`
   - ✅ SSL mit Let's Encrypt
   
   **Frontend (yourdomain.com):**
   - Domain: `yourdomain.com`, `www.yourdomain.com`
   - Forward to: `frontend:80`
   - ✅ SSL mit Let's Encrypt

### 5. **Ports schließen** (nach Setup!)

```bash
# Admin UI Port schließen
sudo ufw deny 81/tcp

# Backend Port schließen (läuft nur intern)
sudo ufw deny 5000/tcp

# Status prüfen
sudo ufw status
```

### 6. **Testen**

```bash
# HTTPS testen
curl https://api.yourdomain.com/health
curl https://yourdomain.com

# Browser öffnen
# → https://yourdomain.com
```

---

## 📋 Vollständige Checkliste

Vor `git clone`:
- [ ] Git installiert
- [ ] Docker & Docker Compose installiert
- [ ] Firewall konfiguriert (22, 80, 443)
- [ ] SSH Key erstellt (optional)
- [ ] Arbeitsverzeichnis erstellt
- [ ] Domain DNS konfiguriert (optional)

Nach `git clone`:
- [ ] `.env` erstellt und angepasst
- [ ] Passwörter geändert (MongoDB!)
- [ ] `NODE_ENV=production` gesetzt
- [ ] `docker compose up -d` ausgeführt
- [ ] Health Check erfolgreich
- [ ] Nginx Proxy Manager konfiguriert
- [ ] SSL Zertifikate aktiviert
- [ ] Admin Ports geschlossen (81, 5000)
- [ ] Backup eingerichtet
- [ ] Dashboard funktioniert

---

## 🔐 Sicherheits-Tipps

### Minimale Ports offen lassen:

```bash
# Nur diese Ports sollten offen sein:
sudo ufw status

# Ergebnis sollte zeigen:
# 22/tcp  - SSH
# 80/tcp  - HTTP (redirect zu HTTPS)
# 443/tcp - HTTPS
```

### SSH absichern:

```bash
sudo nano /etc/ssh/sshd_config

# Ändern:
PermitRootLogin no
PasswordAuthentication no  # Nur mit SSH Key!
Port 2222                  # Optional: anderen Port

# SSH neu starten
sudo systemctl restart sshd
```

### Automatische Updates:

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 🆘 Troubleshooting

### Docker nicht gefunden

```bash
# Docker neu installieren
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Port bereits belegt

```bash
# Port-Belegung prüfen
sudo lsof -i :80
sudo lsof -i :443

# Prozess beenden
sudo kill -9 PID
```

### DNS nicht erreichbar

```bash
# DNS prüfen
nslookup yourdomain.com
dig yourdomain.com

# Zeit geben (DNS Propagation dauert bis zu 48h)
```

### SSL Zertifikat Fehler

```bash
# Ports 80 und 443 müssen offen sein!
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Domain muss auf Server-IP zeigen
# Let's Encrypt braucht HTTP(S) Zugriff
```

---

## 📚 Nächste Schritte

Nach erfolgreichem Setup:

1. 📊 **Testdaten generieren:**
   ```bash
   docker exec sensor_backend npm run seed
   ```

2. 🌡️ **Sensoren anbinden:**
   - Siehe `examples/sensors/`
   - API URL in Sensor-Script: `https://api.yourdomain.com/api/sensors`

3. 💾 **Backup einrichten:**
   - Siehe `docs/04-DOCKER.md` → Backup Section

4. 📈 **Monitoring:**
   ```bash
   docker stats
   docker compose logs -f
   ```

---

## 📞 Quick Commands

```bash
# Status prüfen
docker compose ps
systemctl status docker
sudo ufw status

# Logs anzeigen
docker compose logs -f backend
docker compose logs -f frontend

# Neu starten
docker compose restart
docker compose down && docker compose up -d

# Updates
cd ~/projects/sensor-monitoring
git pull
docker compose down
docker compose up -d --build
```

---

**Viel Erfolg beim Deployment! 🚀**

Bei Fragen: Siehe [03-DEPLOYMENT.md](03-DEPLOYMENT.md) oder [04-DOCKER.md](04-DOCKER.md)

