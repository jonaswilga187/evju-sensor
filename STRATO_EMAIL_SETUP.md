# 📧 Strato E-Mail Setup für info@evjucelle.de

Kurzanleitung zur Einrichtung der E-Mail-Benachrichtigungen mit deiner Strato-E-Mail.

## ⚙️ Schnell-Setup

Füge folgende Zeilen zu deiner `.env` Datei hinzu:

```env
# ============================================
# E-Mail-Benachrichtigungen (Strato)
# ============================================

EMAIL_SERVICE=smtp
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true

EMAIL_USER=info@evjucelle.de
EMAIL_PASSWORD=dein-strato-passwort
EMAIL_TO=info@evjucelle.de

VERBRAUCH_SCHWELLENWERT=12
VERBRAUCH_CHECK_INTERVAL_MINUTES=60
```

## ✅ Wichtig

1. **Passwort:** Verwende dein normales Strato-E-Mail-Passwort (kein App-Passwort nötig)
2. **Port:** 465 mit SSL (SMTP_SECURE=true) wird empfohlen
3. **Alternative:** Falls Port 465 nicht funktioniert, verwende Port 587:
   ```env
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

## 🧪 Testen

Nach dem Hinzufügen der Konfiguration:

```bash
# Backend neu starten
docker compose restart backend

# Logs prüfen
docker compose logs -f backend
```

Du solltest sehen:
```
📧 Verbrauch-Alarm-Prüfung alle 60 Minuten aktiviert
```

## 📝 Vollständige Dokumentation

Siehe `docs/07-EMAIL-BENACHRICHTIGUNGEN.md` für Details und Fehlerbehebung.

