@echo off
REM ==============================================
REM Windows Batch Migration Script
REM ==============================================

echo.
echo ================================
echo   PROJEKT REORGANISATION
echo ================================
echo.

REM Frontend Ordner
if exist "src\" if not exist "frontend\src\" (
    echo [+] Erstelle frontend/ Ordner...
    mkdir frontend 2>nul
    move src frontend\ >nul 2>&1
    if exist "vite.config.js" move vite.config.js frontend\ >nul 2>&1
    if exist "tailwind.config.js" move tailwind.config.js frontend\ >nul 2>&1
    if exist "postcss.config.js" move postcss.config.js frontend\ >nul 2>&1
    if exist "index.html" move index.html frontend\ >nul 2>&1
    if exist "public\" move public frontend\ >nul 2>&1
    echo [OK] Frontend Dateien verschoben
) else (
    echo [OK] Frontend Ordner existiert
)

REM Docs Ordner
if not exist "docs\" (
    echo [+] Erstelle docs/ Ordner...
    mkdir docs
    if exist "SERVER_DEPLOYMENT.md" move SERVER_DEPLOYMENT.md docs\03-DEPLOYMENT.md >nul 2>&1
    if exist "DOCKER_README.md" move DOCKER_README.md docs\04-DOCKER.md >nul 2>&1
    echo [OK] Dokumentation verschoben
) else (
    echo [OK] Docs Ordner existiert
)

REM Examples Ordner
if exist "sensor_examples\" if not exist "examples\sensors\" (
    echo [+] Erstelle examples/ Ordner...
    mkdir examples\sensors\python 2>nul
    mkdir examples\sensors\esp32\sensor_basic 2>nul
    
    if exist "sensor_examples\sensor_script_python.py" (
        move sensor_examples\sensor_script_python.py examples\sensors\python\sensor_basic.py >nul 2>&1
    )
    if exist "sensor_examples\sensor_script_esp32.ino" (
        move sensor_examples\sensor_script_esp32.ino examples\sensors\esp32\sensor_basic\sensor_basic.ino >nul 2>&1
    )
    
    rmdir /s /q sensor_examples 2>nul
    echo [OK] Beispiele verschoben
) else (
    echo [OK] Examples Ordner existiert
)

REM ENV Datei
if exist "ENV_TEMPLATE.txt" if not exist ".env.example" (
    echo [+] Benenne ENV_TEMPLATE.txt um...
    move ENV_TEMPLATE.txt .env.example >nul 2>&1
    echo [OK] .env.example erstellt
) else (
    echo [OK] .env.example existiert
)

REM Aufräumen
if exist "PROJECT_STRUCTURE.md" del PROJECT_STRUCTURE.md >nul 2>&1

echo.
echo ================================
echo   MIGRATION ABGESCHLOSSEN!
echo ================================
echo.
echo Neue Struktur:
echo.
echo sensor-monitoring/
echo   +-- frontend/      (React App)
echo   +-- backend/       (Express API)
echo   +-- docs/          (Dokumentation)
echo   +-- examples/      (Sensor-Beispiele)
echo   +-- README.md
echo   +-- .env.example
echo.
echo Naechste Schritte:
echo   1. docker compose up -d
echo   2. Oder: cd backend ^&^& npm install ^&^& npm run dev
echo   3. Und:  cd frontend ^&^& npm install ^&^& npm run dev
echo.
echo Dokumentation:
echo   - docs\01-SETUP.md
echo   - docs\02-API.md
echo   - docs\03-DEPLOYMENT.md
echo.
pause

