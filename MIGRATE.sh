#!/bin/bash

# ==============================================
# 📁 Projekt Struktur Migration Script
# ==============================================
# Verschiebt Dateien in die neue, bessere Struktur

set -e  # Bei Fehler abbrechen

echo "🚀 Starte Projekt-Reorganisation..."
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==============================================
# 1. FRONTEND ORDNER
# ==============================================
if [ -d "src" ] && [ ! -d "frontend/src" ]; then
    echo "${YELLOW}📦 Erstelle frontend/ Ordner...${NC}"
    mkdir -p frontend
    
    # Dateien verschieben
    [ -d "src" ] && mv src frontend/
    [ -f "package.json" ] && [ ! -f "backend/package.json" ] && mv package.json frontend/ 2>/dev/null || true
    [ -f "vite.config.js" ] && mv vite.config.js frontend/
    [ -f "tailwind.config.js" ] && mv tailwind.config.js frontend/
    [ -f "postcss.config.js" ] && mv postcss.config.js frontend/
    [ -f "index.html" ] && mv index.html frontend/
    [ -d "public" ] && mv public frontend/ 2>/dev/null || true
    
    echo "${GREEN}✅ Frontend Dateien verschoben${NC}"
else
    echo "${GREEN}✓ Frontend Ordner existiert bereits${NC}"
fi

# ==============================================
# 2. DOCKER ORDNER (optional, nur wenn gewünscht)
# ==============================================
# Auskommentiert, weil docker-compose.yml im Root bleiben kann
# if [ -f "docker-compose.yml" ] && [ ! -d "docker" ]; then
#     echo "${YELLOW}🐳 Erstelle docker/ Ordner...${NC}"
#     mkdir -p docker
#     
#     mv docker-compose.yml docker/
#     [ -f "Dockerfile.frontend" ] && mv Dockerfile.frontend docker/frontend.Dockerfile
#     [ -f "nginx.conf" ] && mv nginx.conf docker/
#     
#     echo "${GREEN}✅ Docker Dateien verschoben${NC}"
# fi

# ==============================================
# 3. DOCS ORDNER
# ==============================================
if [ ! -d "docs" ]; then
    echo "${YELLOW}📚 Erstelle docs/ Ordner...${NC}"
    mkdir -p docs
    
    # Dokumentation verschieben (falls vorhanden)
    [ -f "SERVER_DEPLOYMENT.md" ] && mv SERVER_DEPLOYMENT.md docs/03-DEPLOYMENT.md
    [ -f "DOCKER_README.md" ] && mv DOCKER_README.md docs/04-DOCKER.md
    [ -f "backend/README.md" ] && cp backend/README.md docs/02-API.md
    
    echo "${GREEN}✅ Dokumentation verschoben${NC}"
else
    echo "${GREEN}✓ Docs Ordner existiert bereits${NC}"
fi

# ==============================================
# 4. EXAMPLES ORDNER
# ==============================================
if [ -d "sensor_examples" ] && [ ! -d "examples/sensors" ]; then
    echo "${YELLOW}🌡️  Erstelle examples/ Ordner...${NC}"
    mkdir -p examples/sensors/python
    mkdir -p examples/sensors/esp32
    
    # Sensor-Beispiele verschieben
    if [ -f "sensor_examples/sensor_script_python.py" ]; then
        mv sensor_examples/sensor_script_python.py examples/sensors/python/sensor_basic.py
    fi
    
    if [ -f "sensor_examples/sensor_script_esp32.ino" ]; then
        mkdir -p examples/sensors/esp32/sensor_basic
        mv sensor_examples/sensor_script_esp32.ino examples/sensors/esp32/sensor_basic/sensor_basic.ino
    fi
    
    [ -f "sensor_examples/README.md" ] && rm sensor_examples/README.md
    [ -d "sensor_examples" ] && rmdir sensor_examples 2>/dev/null || true
    
    echo "${GREEN}✅ Beispiele verschoben${NC}"
else
    echo "${GREEN}✓ Examples Ordner existiert bereits${NC}"
fi

# ==============================================
# 5. ENV DATEI
# ==============================================
if [ -f "ENV_TEMPLATE.txt" ] && [ ! -f ".env.example" ]; then
    echo "${YELLOW}⚙️  Benenne ENV_TEMPLATE.txt um...${NC}"
    mv ENV_TEMPLATE.txt .env.example
    echo "${GREEN}✅ .env.example erstellt${NC}"
else
    echo "${GREEN}✓ .env.example existiert bereits${NC}"
fi

# ==============================================
# 6. AUFRÄUMEN
# ==============================================
echo ""
echo "${YELLOW}🧹 Räume alte Dateien auf...${NC}"

# Temporäre/alte Dateien löschen (optional)
[ -f "PROJECT_STRUCTURE.md" ] && rm PROJECT_STRUCTURE.md
[ -f "App_with_API.jsx" ] && rm src/App_with_API.jsx 2>/dev/null || true

echo "${GREEN}✅ Aufräumen abgeschlossen${NC}"

# ==============================================
# 7. ZUSAMMENFASSUNG
# ==============================================
echo ""
echo "================================================================"
echo "${GREEN}✅ Migration abgeschlossen!${NC}"
echo "================================================================"
echo ""
echo "📁 Neue Struktur:"
echo ""
echo "sensor-monitoring/"
echo "├── frontend/          # React App"
echo "├── backend/           # Express API"
echo "├── docs/              # Dokumentation"
echo "├── examples/          # Sensor-Beispiele"
echo "├── docker-compose.yml # Docker Services"
echo "├── .env.example       # Config Template"
echo "└── README.md          # Haupt-Doku"
echo ""
echo "🎯 Nächste Schritte:"
echo ""
echo "1. ${YELLOW}Konfiguration prüfen:${NC}"
echo "   ${GREEN}cat .env.example${NC}"
echo ""
echo "2. ${YELLOW}Projekt starten:${NC}"
echo "   ${GREEN}docker compose up -d${NC}"
echo ""
echo "3. ${YELLOW}Oder manuell (Development):${NC}"
echo "   Terminal 1: ${GREEN}cd backend && npm install && npm run dev${NC}"
echo "   Terminal 2: ${GREEN}cd frontend && npm install && npm run dev${NC}"
echo ""
echo "📖 Dokumentation:"
echo "   - Setup:      ${GREEN}docs/01-SETUP.md${NC}"
echo "   - API:        ${GREEN}docs/02-API.md${NC}"
echo "   - Deployment: ${GREEN}docs/03-DEPLOYMENT.md${NC}"
echo "   - Docker:     ${GREEN}docs/04-DOCKER.md${NC}"
echo ""
echo "================================================================"


