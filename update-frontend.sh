#!/bin/bash
set -e  # Script bricht ab, wenn ein Befehl fehlschlägt

echo "🔻 Stoppe laufende Container..."
docker compose down

echo "🧹 Entferne altes Frontend-Image..."
docker rmi evju-sensor-frontend || true

echo "📥 Ziehe neueste Änderungen von Git..."
git pull

echo "🏗️ Baue das Frontend neu (ohne Cache)..."
docker compose build --no-cache frontend

echo "🚀 Starte Container im Hintergrund..."
docker compose up -d

echo "✅ Fertig! Frontend läuft wieder."
