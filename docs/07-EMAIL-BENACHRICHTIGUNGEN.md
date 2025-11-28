# 📧 E-Mail-Benachrichtigungen Setup

Anleitung zur Einrichtung von E-Mail-Benachrichtigungen bei Überschreitung des täglichen Energieverbrauchs.

## 🎯 Funktion

Das System prüft regelmäßig den täglichen Energieverbrauch und sendet automatisch eine E-Mail-Benachrichtigung, wenn der Schwellenwert (Standard: 12 kWh/Tag) überschritten wird.

**Features:**
- ✅ Automatische Prüfung alle 60 Minuten (konfigurierbar)
- ✅ Verhindert mehrfache Benachrichtigungen am selben Tag
- ✅ Unterstützt Gmail und andere SMTP-Server
- ✅ Schöne HTML-E-Mails mit allen wichtigen Informationen

## ⚙️ Konfiguration

### 1. Umgebungsvariablen in `.env` hinzufügen

Füge folgende Variablen zu deiner `.env` Datei hinzu:

**Beispiel für Strato (info@evjucelle.de):**

```env
# ============================================
# E-Mail-Benachrichtigungen
# ============================================

# E-Mail-Service (gmail, smtp)
EMAIL_SERVICE=smtp

# Strato SMTP-Einstellungen
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true

# E-Mail-Absender
EMAIL_USER=info@evjucelle.de

# E-Mail-Passwort (dein Strato-Passwort)
EMAIL_PASSWORD=dein-strato-passwort

# E-Mail-Empfänger
EMAIL_TO=info@evjucelle.de

# Schwellenwert in kWh (Standard: 12)
VERBRAUCH_SCHWELLENWERT=12

# Prüf-Intervall in Minuten (Standard: 60)
VERBRAUCH_CHECK_INTERVAL_MINUTES=60
```

**Beispiel für Gmail:**

```env
# ============================================
# E-Mail-Benachrichtigungen
# ============================================

# E-Mail-Service (gmail, smtp)
EMAIL_SERVICE=gmail

# E-Mail-Absender (muss mit EMAIL_USER übereinstimmen)
EMAIL_USER=deine-email@gmail.com

# E-Mail-Passwort (für Gmail: App-Passwort verwenden!)
EMAIL_PASSWORD=dein-app-passwort

# E-Mail-Empfänger (kann gleich EMAIL_USER sein)
EMAIL_TO=deine-email@gmail.com

# Schwellenwert in kWh (Standard: 12)
VERBRAUCH_SCHWELLENWERT=12

# Prüf-Intervall in Minuten (Standard: 60)
VERBRAUCH_CHECK_INTERVAL_MINUTES=60
```

### 2. Gmail Setup (Empfohlen)

#### Schritt 1: 2-Faktor-Authentifizierung aktivieren

1. Gehe zu [Google Account Sicherheit](https://myaccount.google.com/security)
2. Aktiviere "2-Step Verification" falls noch nicht aktiviert

#### Schritt 2: App-Passwort erstellen

1. Gehe zu [App-Passwörter](https://myaccount.google.com/apppasswords)
2. Wähle "App" → "Mail"
3. Wähle "Gerät" → "Windows Computer" (oder anderes)
4. Klicke auf "Generieren"
5. **Kopiere das 16-stellige Passwort** (ohne Leerzeichen)

#### Schritt 3: In `.env` eintragen

```env
EMAIL_SERVICE=gmail
EMAIL_USER=deine-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Das App-Passwort (ohne Leerzeichen)
EMAIL_TO=deine-email@gmail.com
```

**Wichtig:** Verwende das **App-Passwort**, nicht dein normales Gmail-Passwort!

### 3. Strato E-Mail (Empfohlen für info@evjucelle.de)

Für Strato-E-Mail-Accounts (z.B. info@evjucelle.de):

```env
# Strato SMTP-Konfiguration
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true  # true für Port 465 (SSL)
EMAIL_USER=info@evjucelle.de
EMAIL_PASSWORD=dein-strato-passwort
EMAIL_TO=info@evjucelle.de
```

**Alternative Strato-Konfiguration (Port 587):**

```env
# Strato mit STARTTLS (Port 587)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.strato.de
SMTP_PORT=587
SMTP_SECURE=false  # false für Port 587 (STARTTLS)
EMAIL_USER=info@evjucelle.de
EMAIL_PASSWORD=dein-strato-passwort
EMAIL_TO=info@evjucelle.de
```

**Wichtig für Strato:**
- Verwende dein **normales Strato-E-Mail-Passwort** (kein App-Passwort nötig)
- Port 465 (SSL) wird empfohlen
- Stelle sicher, dass SMTP-Versand in deinem Strato-Account aktiviert ist

### 4. Andere E-Mail-Anbieter (SMTP)

Für Outlook, eigene Mail-Server oder andere Anbieter:

```env
# SMTP-Konfiguration
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.office365.com  # Für Outlook
SMTP_PORT=587
SMTP_SECURE=false  # true für Port 465, false für 587
EMAIL_USER=deine-email@outlook.com
EMAIL_PASSWORD=dein-passwort
EMAIL_TO=deine-email@outlook.com
```

**Häufige SMTP-Einstellungen:**

| Anbieter | SMTP_HOST | SMTP_PORT | SMTP_SECURE |
|----------|-----------|-----------|-------------|
| **Strato** | **smtp.strato.de** | **465** | **true** |
| Strato (ALT) | smtp.strato.de | 587 | false |
| Outlook | smtp.office365.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| GMX | smtp.gmx.net | 587 | false |
| Web.de | smtp.web.de | 587 | false |
| Eigener Server | dein-server.de | 587 | false |

## 🧪 Testen

### 1. E-Mail-Konfiguration testen

Erstelle eine Test-Datei `test-email.js` im Backend-Ordner:

```javascript
import { testEmailConfig } from './src/services/emailService.js';

testEmailConfig().then(result => {
  console.log(result);
  process.exit(0);
});
```

Dann ausführen:

```bash
cd backend
node test-email.js
```

### 2. Manuelle Alarm-Prüfung

Erstelle eine Test-Datei `test-alarm.js`:

```javascript
import { checkVerbrauchAlarm } from './src/services/verbrauchAlarmService.js';

checkVerbrauchAlarm().then(() => {
  console.log('Prüfung abgeschlossen');
  process.exit(0);
});
```

```bash
node test-alarm.js
```

### 3. Test-E-Mail senden

Du kannst auch direkt eine Test-E-Mail senden:

```javascript
import { sendVerbrauchAlarm } from './src/services/emailService.js';

// Simuliere einen hohen Verbrauch
sendVerbrauchAlarm(15.5, 12).then(() => {
  console.log('Test-E-Mail gesendet');
  process.exit(0);
});
```

## 📊 Funktionsweise

### Prüf-Intervall

Das System prüft standardmäßig **alle 60 Minuten** den täglichen Verbrauch. Du kannst das Intervall in der `.env` anpassen:

```env
VERBRAUCH_CHECK_INTERVAL_MINUTES=30  # Alle 30 Minuten
VERBRAUCH_CHECK_INTERVAL_MINUTES=120 # Alle 2 Stunden
```

### Verbrauchsberechnung

Der tägliche Verbrauch wird aus allen Messwerten des aktuellen Tages (00:00 - 23:59) berechnet. Die Berechnung verwendet die **Trapezregel** für eine genaue Integration über die Zeit.

### Mehrfach-Benachrichtigungen verhindern

Das System sendet **maximal eine E-Mail pro Tag**, auch wenn der Schwellenwert mehrfach überschritten wird. Am nächsten Tag wird erneut geprüft.

## 🔧 Anpassungen

### Schwellenwert ändern

```env
VERBRAUCH_SCHWELLENWERT=15  # 15 kWh statt 12 kWh
```

### Prüf-Intervall ändern

```env
VERBRAUCH_CHECK_INTERVAL_MINUTES=30  # Alle 30 Minuten prüfen
```

### E-Mail-Template anpassen

Die E-Mail-Vorlage findest du in:
```
backend/src/services/emailService.js
```

Du kannst das HTML-Template in der Funktion `sendVerbrauchAlarm()` anpassen.

## 🐛 Fehlerbehebung

### "E-Mail-Konfiguration fehlt"

**Problem:** Die E-Mail-Variablen sind nicht gesetzt.

**Lösung:** Prüfe deine `.env` Datei und stelle sicher, dass alle Variablen gesetzt sind:
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_TO`

### "Invalid login" bei Gmail

**Problem:** Normales Gmail-Passwort wird verwendet.

**Lösung:** Verwende ein **App-Passwort** statt des normalen Passworts. Siehe "Gmail Setup" oben.

### "Connection timeout" bei SMTP

**Problem:** SMTP-Server ist nicht erreichbar oder Port ist falsch.

**Lösung:**
1. Prüfe `SMTP_HOST` und `SMTP_PORT`
2. Stelle sicher, dass dein Server/Netzwerk SMTP-Verbindungen erlaubt
3. Prüfe Firewall-Einstellungen

### Keine E-Mails erhalten

**Problem:** E-Mails werden nicht gesendet oder landen im Spam.

**Lösung:**
1. Prüfe die Server-Logs: `docker compose logs backend`
2. Prüfe deinen Spam-Ordner
3. Teste die E-Mail-Konfiguration mit `test-email.js`

## 📝 Logs

Die E-Mail-Benachrichtigungen werden in den Server-Logs protokolliert:

```bash
# Alle Logs anzeigen
docker compose logs backend

# Nur E-Mail-relevante Logs
docker compose logs backend | grep -i "email\|verbrauch\|alarm"
```

**Erfolgreiche Benachrichtigung:**
```
✅ E-Mail-Benachrichtigung gesendet: <message-id>
```

**Fehler:**
```
❌ Fehler beim Senden der E-Mail: <fehlermeldung>
```

## 🎉 Fertig!

Nach der Konfiguration startet das System automatisch mit der Prüfung. Du erhältst eine E-Mail, sobald der tägliche Verbrauch über 12 kWh (oder deinen konfigurierten Wert) liegt.

