# 🚀 Git Setup & Upload Guide

So lädst du das Projekt auf GitHub/GitLab hoch.

## 📋 Voraussetzungen

- **Git installiert** - [Download](https://git-scm.com/downloads)
- **GitHub/GitLab Account** - [GitHub](https://github.com/signup) | [GitLab](https://gitlab.com/users/sign_up)

## 🎯 Schritt-für-Schritt Anleitung

### 1. Git Repository erstellen auf GitHub/GitLab

#### GitHub:
1. Gehe zu [github.com/new](https://github.com/new)
2. **Repository name**: `sensor-monitoring` (oder eigener Name)
3. **Beschreibung**: "Full-Stack IoT Monitoring Dashboard"
4. **Visibility**: Public oder Private
5. ❌ **NICHT** "Initialize with README" ankreuzen (haben wir schon!)
6. Klick auf **"Create repository"**

#### GitLab:
1. Gehe zu [gitlab.com/projects/new](https://gitlab.com/projects/new)
2. **Project name**: `sensor-monitoring`
3. Wähle Visibility Level
4. ❌ **NICHT** "Initialize with README" ankreuzen
5. Klick auf **"Create project"**

### 2. Lokales Repository initialisieren

```bash
# Im Projektordner
cd C:\Users\jonas\Desktop\evju_temp

# Git initialisieren (falls noch nicht geschehen)
git init

# Prüfen ob schon initialisiert
git status
```

### 3. Remote Repository verbinden

**GitHub:**
```bash
# Ersetze USERNAME und REPO mit deinen Werten!
git remote add origin https://github.com/USERNAME/sensor-monitoring.git

# Oder mit SSH (empfohlen):
git remote add origin git@github.com:USERNAME/sensor-monitoring.git
```

**GitLab:**
```bash
git remote add origin https://gitlab.com/USERNAME/sensor-monitoring.git

# Oder SSH:
git remote add origin git@gitlab.com:USERNAME/sensor-monitoring.git
```

**Prüfen:**
```bash
git remote -v
```

### 4. Dateien hinzufügen & committen

```bash
# Alle Dateien zur Staging Area hinzufügen
git add .

# Status prüfen (siehst du, was committed wird)
git status

# Ersten Commit erstellen
git commit -m "Initial commit: Full-Stack Sensor Monitoring Dashboard"
```

### 5. Auf GitHub/GitLab pushen

```bash
# Main Branch umbenennen (falls noch master)
git branch -M main

# Zum Remote pushen
git push -u origin main
```

## 🎉 Fertig!

Dein Projekt ist jetzt online! 🚀

**URL:** `https://github.com/USERNAME/sensor-monitoring`

---

## 🔧 Weitere Befehle

### Status prüfen
```bash
git status
```

### Änderungen anzeigen
```bash
git diff
```

### Neue Änderungen committen
```bash
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

### Branch erstellen
```bash
git checkout -b feature/neue-funktion
git push -u origin feature/neue-funktion
```

### Commit History
```bash
git log --oneline
```

---

## 🔐 SSH Key Setup (Empfohlen)

Damit du nicht jedes Mal Passwort eingeben musst:

### SSH Key generieren

```bash
ssh-keygen -t ed25519 -C "deine@email.com"
# Enter drücken für Default-Pfad
# Optional: Passphrase eingeben
```

### Public Key kopieren

**Windows:**
```bash
cat ~/.ssh/id_ed25519.pub | clip
```

**Mac/Linux:**
```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

### Key zu GitHub hinzufügen

1. GitHub → Settings → SSH and GPG keys → New SSH key
2. Titel: "Dein PC Name"
3. Key einfügen (CTRL+V)
4. Save

### Testen
```bash
ssh -T git@github.com
# Sollte zeigen: "Hi USERNAME! You've successfully authenticated..."
```

---

## 📝 .gitignore

Die `.gitignore` Datei wurde bereits erstellt und ignoriert:

✅ `node_modules/` - Dependencies (nicht hochladen!)
✅ `.env` - Passwörter & Secrets
✅ `dist/`, `build/` - Build Output
✅ `*.log` - Log Dateien
✅ `.DS_Store`, `Thumbs.db` - OS Dateien

---

## 🚨 Wichtig!

### ⚠️ NIEMALS committen:
- `.env` Dateien mit echten Passwörtern
- `node_modules/` Ordner
- API Keys oder Secrets
- Persönliche Daten

### ✅ Stattdessen:
- `.env.example` mit Platzhaltern committen
- Dependencies in `package.json` angeben
- Secrets in GitHub Secrets speichern

---

## 🔄 Workflow für Updates

```bash
# 1. Änderungen machen
# ... code, code, code ...

# 2. Status prüfen
git status

# 3. Änderungen hinzufügen
git add .
# Oder nur bestimmte Dateien:
git add frontend/src/App.jsx backend/src/controllers/

# 4. Committen mit sinnvoller Nachricht
git commit -m "feat: Add real-time updates to dashboard"

# 5. Pushen
git push
```

### Commit Message Konventionen:

```bash
git commit -m "feat: Neue Feature"      # Neues Feature
git commit -m "fix: Bugfix"             # Bugfix
git commit -m "docs: Update README"     # Dokumentation
git commit -m "style: Format code"      # Code Style
git commit -m "refactor: Cleanup"       # Code Refactoring
git commit -m "test: Add tests"         # Tests
git commit -m "chore: Update deps"      # Maintenance
```

---

## 🏷️ Releases & Tags

### Tag erstellen
```bash
git tag -a v1.0.0 -m "Version 1.0.0 - Initial Release"
git push origin v1.0.0
```

### Alle Tags anzeigen
```bash
git tag
```

---

## 🤝 Collaboration

### Repository klonen (für Teamkollegen)
```bash
git clone https://github.com/USERNAME/sensor-monitoring.git
cd sensor-monitoring
```

### Setup nach Clone
```bash
# .env erstellen
cp .env.example .env
nano .env  # Anpassen!

# Dependencies installieren
cd backend && npm install
cd ../frontend && npm install

# Starten
docker compose up -d
```

---

## 📚 Weitere Ressourcen

- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Docs](https://docs.github.com/)
- [Git Book (DE)](https://git-scm.com/book/de/v2)
- [Learn Git Branching](https://learngitbranching.js.org/)

---

## 🆘 Probleme?

### "Permission denied (publickey)"
→ SSH Key nicht konfiguriert, siehe oben

### "Failed to push"
→ Erst pullen: `git pull origin main --rebase`

### Merge Conflicts
```bash
# Konflikt anschauen
git status

# Datei öffnen und Konflikte auflösen
# Suche nach: <<<<<<< HEAD

# Nach Auflösung:
git add .
git commit -m "Resolve merge conflicts"
git push
```

### Letzten Commit rückgängig machen
```bash
# Änderungen behalten
git reset --soft HEAD~1

# Änderungen verwerfen
git reset --hard HEAD~1
```

---

**Happy Coding! 🎉**

