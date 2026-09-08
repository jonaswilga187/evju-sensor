#!/bin/sh
set -e

# Erzeugt die Basic-Auth-Datei aus den Umgebungsvariablen DASHBOARD_USERNAME/
# DASHBOARD_PASSWORD, bevor Nginx startet. Kein "htpasswd"-Tool nötig -
# openssl reicht (apr1-Hash, gleiches Format wie Apache/Nginx erwarten).
if [ -z "$DASHBOARD_USERNAME" ] || [ -z "$DASHBOARD_PASSWORD" ]; then
  echo "❌ DASHBOARD_USERNAME und DASHBOARD_PASSWORD müssen gesetzt sein - Dashboard bleibt sonst für JEDEN offen!"
  exit 1
fi

HASH=$(openssl passwd -apr1 "$DASHBOARD_PASSWORD")
echo "${DASHBOARD_USERNAME}:${HASH}" > /etc/nginx/.htpasswd

exec "$@"
