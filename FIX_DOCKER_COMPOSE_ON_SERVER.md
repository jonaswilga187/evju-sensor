# 🔧 docker-compose.yml auf Server fixen

Auf deinem Linux-Server musst du die `docker-compose.yml` aus dem Git-Tracking entfernen.

## Lösung auf dem Server:

```bash
cd ~/projects/evju-sensor

# Option 1: Lokale Änderungen behalten und aus Git entfernen
git rm --cached docker-compose.yml
git commit -m "docker-compose.yml aus Git entfernt"
git pull

# Option 2: Lokale Änderungen verwerfen und aus Git entfernen
git checkout docker-compose.yml  # Lokale Änderungen verwerfen
git rm --cached docker-compose.yml
git commit -m "docker-compose.yml aus Git entfernt"
git pull
```

## Danach:

Die `docker-compose.yml` bleibt lokal, aber Git verwaltet sie nicht mehr. Du kannst sie lokal anpassen ohne Konflikte.

## E-Mail-Variablen hinzufügen:

Nach dem Pull kannst du die E-Mail-Variablen zur `docker-compose.yml` hinzufügen:

```bash
nano docker-compose.yml
```

Füge zur `backend` Sektion unter `environment:` hinzu:

```yaml
      # E-Mail-Benachrichtigungen
      EMAIL_SERVICE: ${EMAIL_SERVICE:-}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-}
      SMTP_SECURE: ${SMTP_SECURE:-}
      EMAIL_USER: ${EMAIL_USER:-}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD:-}
      EMAIL_TO: ${EMAIL_TO:-}
      VERBRAUCH_SCHWELLENWERT: ${VERBRAUCH_SCHWELLENWERT:-12}
      VERBRAUCH_CHECK_INTERVAL_MINUTES: ${VERBRAUCH_CHECK_INTERVAL_MINUTES:-60}
```


