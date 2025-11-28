# 🧪 E-Mail-Benachrichtigungssystem testen

Anleitung zum Testen der E-Mail-Benachrichtigungen auf dem Linux-Server.

## 📋 Voraussetzungen

1. ✅ Backend läuft (`docker compose ps`)
2. ✅ E-Mail-Konfiguration in `.env` eingetragen
3. ✅ MongoDB hat Messwerte

## ⚙️ Schritt 1: E-Mail-Konfiguration prüfen

### 1.1 `.env` Datei prüfen

```bash
cd ~/projects/evju-sensor
nano .env
```

**Stelle sicher, dass diese Zeilen vorhanden sind:**

```env
# E-Mail-Benachrichtigungen (Strato)
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

### 1.2 Backend neu starten (damit .env geladen wird)

```bash
docker compose restart backend
```

### 1.3 Logs prüfen

```bash
docker compose logs backend --tail=20
```

**Du solltest sehen:**
```
📧 Verbrauch-Alarm-Prüfung alle 60 Minuten aktiviert
```

## 🧪 Schritt 2: E-Mail-Konfiguration testen

### Option A: Test-Script im Container ausführen

Erstelle eine Test-Datei:

```bash
# Test-Datei erstellen
cat > /tmp/test-email-config.js << 'EOF'
import { testEmailConfig } from './src/services/emailService.js';

testEmailConfig().then(result => {
  console.log(result);
  if (result.success) {
    console.log('✅ E-Mail-Konfiguration ist korrekt!');
    process.exit(0);
  } else {
    console.log('❌ E-Mail-Konfiguration fehlerhaft!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fehler:', error);
  process.exit(1);
});
EOF

# In Container kopieren und ausführen
docker cp /tmp/test-email-config.js sensor_backend:/app/test-email-config.js
docker compose exec backend node test-email-config.js
```

### Option B: Direkt im Container testen

```bash
# In Container einloggen
docker compose exec backend sh

# Dann im Container:
node -e "
import('./src/services/emailService.js').then(({ testEmailConfig }) => {
  testEmailConfig().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
});
"
```

## 🧪 Schritt 3: Test-E-Mail senden

### Option A: Manuelle Test-E-Mail senden

```bash
# Test-Script erstellen
cat > /tmp/test-send-email.js << 'EOF'
import { sendVerbrauchAlarm } from './src/services/emailService.js';

// Simuliere einen hohen Verbrauch (15.5 kWh bei Schwellenwert 12)
sendVerbrauchAlarm(15.5, 12).then(success => {
  if (success) {
    console.log('✅ Test-E-Mail erfolgreich gesendet!');
    console.log('📧 Prüfe dein Postfach: info@evjucelle.de');
    process.exit(0);
  } else {
    console.log('❌ E-Mail konnte nicht gesendet werden');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fehler:', error);
  process.exit(1);
});
EOF

# In Container kopieren und ausführen
docker cp /tmp/test-send-email.js sensor_backend:/app/test-send-email.js
docker compose exec backend node test-send-email.js
```

### Option B: Alarm-Funktion direkt testen

```bash
# Test-Script erstellen
cat > /tmp/test-alarm.js << 'EOF'
import { checkVerbrauchAlarm } from './src/services/verbrauchAlarmService.js';

checkVerbrauchAlarm().then(() => {
  console.log('✅ Alarm-Prüfung abgeschlossen');
  console.log('📧 Prüfe die Logs und dein Postfach');
  process.exit(0);
}).catch(error => {
  console.error('Fehler:', error);
  process.exit(1);
});
EOF

# In Container kopieren und ausführen
docker cp /tmp/test-alarm.js sensor_backend:/app/test-alarm.js
docker compose exec backend node test-alarm.js
```

## 🧪 Schritt 4: Echten Alarm simulieren

### 4.1 Schwellenwert temporär senken

```bash
# In .env den Schwellenwert auf einen sehr niedrigen Wert setzen
# (z.B. 0.1 kWh, damit der Alarm sofort auslöst)
nano .env
```

```env
VERBRAUCH_SCHWELLENWERT=0.1  # Sehr niedrig, damit Alarm auslöst
```

```bash
# Backend neu starten
docker compose restart backend

# Logs beobachten
docker compose logs -f backend
```

**Nach ein paar Minuten solltest du sehen:**
```
📊 Täglicher Verbrauch: X.XX kWh (Schwellenwert: 0.1 kWh)
⚠️  Schwellenwert überschritten! Sende E-Mail-Benachrichtigung...
✅ E-Mail-Benachrichtigung erfolgreich gesendet
```

### 4.2 Schwellenwert wieder auf 12 setzen

```bash
nano .env
```

```env
VERBRAUCH_SCHWELLENWERT=12  # Wieder auf normalen Wert
```

```bash
docker compose restart backend
```

## 📊 Schritt 5: Logs überwachen

### Logs in Echtzeit anzeigen

```bash
# Alle Backend-Logs
docker compose logs -f backend

# Nur E-Mail-relevante Logs filtern
docker compose logs -f backend | grep -i "email\|verbrauch\|alarm"
```

### Erwartete Log-Ausgaben

**Bei erfolgreicher Prüfung:**
```
📊 Täglicher Verbrauch: 8.5 kWh (Schwellenwert: 12 kWh)
✅ Verbrauch im Normalbereich (8.5 kWh ≤ 12 kWh)
```

**Bei Überschreitung:**
```
📊 Täglicher Verbrauch: 15.3 kWh (Schwellenwert: 12 kWh)
⚠️  Schwellenwert überschritten! Sende E-Mail-Benachrichtigung...
✅ E-Mail-Benachrichtigung gesendet: <message-id>
✅ E-Mail-Benachrichtigung erfolgreich gesendet
```

**Bei Fehler:**
```
❌ Fehler beim Senden der E-Mail: <fehlermeldung>
```

## 🔍 Schritt 6: E-Mail im Postfach prüfen

1. **Öffne dein E-Mail-Postfach:** info@evjucelle.de
2. **Prüfe den Posteingang** (und Spam-Ordner!)
3. **Du solltest eine E-Mail mit folgendem Inhalt sehen:**
   - Betreff: `⚠️ Energieverbrauch-Alarm: X.XX kWh überschritten!`
   - Aktueller Verbrauch
   - Schwellenwert
   - Überschreitung
   - Zeitstempel

## 🐛 Fehlerbehebung

### Problem: "E-Mail-Konfiguration fehlt"

**Lösung:**
```bash
# Prüfe .env Datei
cat .env | grep EMAIL

# Stelle sicher, dass alle Variablen gesetzt sind
```

### Problem: "Invalid login" oder "Authentication failed"

**Lösung:**
- Prüfe, ob das Passwort korrekt ist
- Bei Strato: Stelle sicher, dass SMTP-Versand aktiviert ist
- Versuche Port 587 statt 465:
  ```env
  SMTP_PORT=587
  SMTP_SECURE=false
  ```

### Problem: "Connection timeout"

**Lösung:**
- Prüfe Firewall-Einstellungen
- Prüfe, ob SMTP_HOST korrekt ist (`smtp.strato.de`)
- Teste von außen: `telnet smtp.strato.de 465`

### Problem: Keine E-Mail erhalten

**Lösung:**
1. Prüfe Spam-Ordner
2. Prüfe Logs: `docker compose logs backend | grep -i email`
3. Teste E-Mail-Konfiguration (Schritt 2)
4. Prüfe, ob der Schwellenwert wirklich überschritten wurde

### Problem: Mehrfache E-Mails am selben Tag

**Das ist normal!** Das System sendet maximal eine E-Mail pro Tag. Am nächsten Tag wird erneut geprüft.

## ✅ Checkliste

- [ ] `.env` Datei enthält alle E-Mail-Variablen
- [ ] Backend wurde neu gestartet
- [ ] Logs zeigen: "Verbrauch-Alarm-Prüfung alle 60 Minuten aktiviert"
- [ ] E-Mail-Konfiguration-Test erfolgreich
- [ ] Test-E-Mail wurde gesendet und empfangen
- [ ] E-Mail-Inhalt ist korrekt
- [ ] Schwellenwert wieder auf 12 kWh gesetzt

## 🎉 Fertig!

Wenn alle Tests erfolgreich sind, läuft das System automatisch:
- ✅ Prüft alle 60 Minuten den Verbrauch
- ✅ Sendet E-Mail bei Überschreitung von 12 kWh
- ✅ Verhindert mehrfache Benachrichtigungen am selben Tag

