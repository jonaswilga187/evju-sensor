/*
 * ESP32 - Heizung + Entfeuchter Control mit SwitchBot + Sensor Monitoring
 *
 * Funktionen:
 * - Liest DHT22 Sensor (Temperatur & Luftfeuchtigkeit)
 * - Sendet Daten an eigene API
 * - Fragt eigene API pro Plug ("heizung", "entfeuchter") nach gewünschtem Status
 * - Steuert zwei SwitchBot Plugs über die SwitchBot Cloud API
 * - Unterstützt Automatik-Modus (wird serverseitig entschieden, siehe Backend)
 *
 * WICHTIG: Der ESP32 sitzt an einem externen Standort ohne feste IP hinter
 * einem NAT-Router. Er MUSS deshalb immer selbst ausgehend zum Server
 * verbinden (Polling) - der Server kann den ESP32 nicht aktiv erreichen.
 *
 * Setup in der SwitchBot-App: Beide Steckdosen müssen dort mit genau den
 * Namen aus SWITCHBOT_DEVICE_NAME_HEIZUNG / _ENTFEUCHTER (unten) benannt sein,
 * damit dieser Sketch sie automatisch per Namen findet (keine Device-IDs
 * hardcoden nötig).
 *
 * WLAN-Fernkonfiguration: Der ESP32 fragt regelmäßig /api/device/:id/config
 * ab. Ändern sich dort die WLAN-Zugangsdaten (über das Dashboard), speichert
 * er sie nur als "pending" im Flash (NVS) - probiert sie aber erst beim
 * nächsten Neustart aus, damit ein Update die laufende Verbindung am
 * aktuellen Standort nicht sofort kappt (z.B. während er noch zuhause hängt,
 * aber schon die Zugangsdaten fürs Veranstaltungs-WLAN bereitliegen).
 * Schlägt der Verbindungsversuch mit neuen Daten fehl, fällt das Gerät
 * automatisch auf die zuletzt bekannten funktionierenden Daten zurück.
 * Funktioniert auch das nicht mehr, öffnet es einen kurzzeitigen
 * Konfigurations-Access-Point ("ESP32-Sensor-Setup") für die manuelle
 * Einrichtung per Handy.
 *
 * Benötigte zusätzliche Bibliothek (Library Manager): "WiFiManager" von tzapu.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <mbedtls/md.h>
#include <mbedtls/base64.h>
#include <time.h>
#include <Preferences.h>
#include <WiFiManager.h>

// ==================== KONFIGURATION ====================

// WiFi Zugangsdaten
const char* ssid = "DEIN_WIFI_SSID";
const char* password = "DEIN_WIFI_PASSWORT";

// Eigene API (Basis-URL, ohne Slash am Ende)
const char* apiBaseUrl = "https://sensor-api.wilga.tech/api";

// API-Key für geschützte Endpunkte (POST /sensors, POST /plug/:id/reported)
// Muss mit der API_KEY Umgebungsvariable des Backends übereinstimmen!
const char* apiKey = "DEIN_API_KEY";

// SwitchBot API
const char* switchbotApiBase = "https://api.switch-bot.com/v1.1";
const char* switchbotToken = "DEIN_SWITCHBOT_TOKEN";
const char* switchbotSecret = "DEIN_SWITCHBOT_SECRET";

// Namen der beiden Steckdosen, exakt wie in der SwitchBot-App vergeben
const char* SWITCHBOT_DEVICE_NAME_HEIZUNG = "Heizung";
const char* SWITCHBOT_DEVICE_NAME_ENTFEUCHTER = "Entfeuchter";

// Eindeutige Geräte-ID für die WLAN-Fernkonfiguration - muss mit der DEVICE_ID
// in frontend/src/DeviceWifiConfig.jsx übereinstimmen.
const char* DEVICE_ID = "esp32-main";

// NTP Server für Zeit-Synchronisation
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;      // GMT+1 (Deutschland)
const int daylightOffset_sec = 3600;  // Sommerzeit

// DHT22 Sensor
#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Timing (in Millisekunden)
const unsigned long SENSOR_INTERVAL = 60000;     // 1 Minute für Sensordaten
const unsigned long PLUG_CHECK_INTERVAL = 5000;  // 5 Sekunden für Plug-Status (nur eigene API!)
const unsigned long CONFIG_CHECK_INTERVAL = 60000;  // 1 Minute für WLAN-Config-Poll
const unsigned long WIFI_CONNECT_TIMEOUT = 15000;   // 15 Sekunden pro Verbindungsversuch

// ==================== PLUG-STRUKTUR ====================

struct Plug {
  const char* id;              // Plug-ID im Backend, z.B. "heizung"
  const char* switchbotName;   // Gerätename in der SwitchBot-App
  String switchbotDeviceId;    // Wird beim Start per Namen ermittelt
  String currentState;         // Zuletzt geschalteter Zustand
};

Plug plugs[2] = {
  { "heizung", SWITCHBOT_DEVICE_NAME_HEIZUNG, "", "unknown" },
  { "entfeuchter", SWITCHBOT_DEVICE_NAME_ENTFEUCHTER, "", "unknown" }
};

// ==================== GLOBALE VARIABLEN ====================

unsigned long lastSensorRead = 0;
unsigned long lastPlugCheck = 0;
unsigned long lastConfigCheck = 0;

// WLAN-Fernkonfiguration: aktuell aktive (zuletzt funktionierende) und ggf.
// wartende neue Zugangsdaten, persistiert in Preferences (NVS).
Preferences prefs;
String activeSsid, activePass;
long activeVersion = 0;
bool hasPending = false;
String pendingSsid, pendingPass;
long pendingVersion = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n=================================");
  Serial.println("🔥💧 ESP32 - SwitchBot Heizung + Entfeuchter Control");
  Serial.println("=================================\n");

  dht.begin();
  Serial.println("✅ DHT22 Sensor initialisiert");

  connectWiFi();

  Serial.println("\n⏰ Synchronisiere Zeit mit NTP...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 10) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (getLocalTime(&timeinfo)) {
    Serial.println("\n✅ Zeit synchronisiert!");
  } else {
    Serial.println("\n❌ Zeit-Synchronisation fehlgeschlagen! SwitchBot API wird nicht funktionieren!");
  }

  // Beide SwitchBot-Geräte per Name in EINEM Aufruf auflösen
  Serial.println("\n🔍 Suche SwitchBot Geräte...");
  resolveSwitchBotDeviceIds();

  for (int i = 0; i < 2; i++) {
    if (plugs[i].switchbotDeviceId.length() > 0) {
      Serial.printf("✅ %s gefunden: %s\n", plugs[i].switchbotName, plugs[i].switchbotDeviceId.c_str());
    } else {
      Serial.printf("❌ Gerät \"%s\" nicht in SwitchBot-App gefunden!\n", plugs[i].switchbotName);
    }
  }

  Serial.println("\n🔍 Initialer Status-Check...");
  for (int i = 0; i < 2; i++) {
    checkAndControlPlug(i);
  }

  Serial.println("\n✅ System bereit!\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi Verbindung verloren - Reconnect...");
    connectWiFi();
  }

  // 1. Sensordaten lesen und senden (alle 60 Sekunden)
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readAndSendSensorData();
  }

  // 2. Beide Plug-Status prüfen und ggf. schalten (alle 5 Sekunden)
  if (currentMillis - lastPlugCheck >= PLUG_CHECK_INTERVAL) {
    lastPlugCheck = currentMillis;
    for (int i = 0; i < 2; i++) {
      checkAndControlPlug(i);
    }
  }

  // 3. WLAN-Fernkonfiguration prüfen (alle 60 Sekunden)
  if (currentMillis - lastConfigCheck >= CONFIG_CHECK_INTERVAL) {
    lastConfigCheck = currentMillis;
    checkForConfigUpdate();
  }

  delay(100);
}

// ==================== WIFI FUNKTIONEN ====================

// Lädt die zuletzt gespeicherten WLAN-Zugangsdaten aus dem Flash (NVS). Ist
// dort noch nichts hinterlegt (allererster Start), werden die oben fest im
// Code stehenden Zugangsdaten als Ausgangspunkt übernommen.
void loadWifiCredentials() {
  prefs.begin("wificfg", false);
  activeSsid = prefs.getString("active_ssid", "");
  activePass = prefs.getString("active_pass", "");
  activeVersion = prefs.getLong("active_ver", 0);
  pendingVersion = prefs.getLong("pending_ver", 0);
  if (pendingVersion > activeVersion) {
    pendingSsid = prefs.getString("pending_ssid", "");
    pendingPass = prefs.getString("pending_pass", "");
    hasPending = pendingSsid.length() > 0;
  }
  prefs.end();

  if (activeSsid.length() == 0) {
    saveActiveCredentials(String(ssid), String(password), 0);
  }
}

void saveActiveCredentials(const String &newSsid, const String &newPass, long version) {
  prefs.begin("wificfg", false);
  prefs.putString("active_ssid", newSsid);
  prefs.putString("active_pass", newPass);
  prefs.putLong("active_ver", version);
  prefs.end();
  activeSsid = newSsid;
  activePass = newPass;
  activeVersion = version;
}

void savePendingCredentials(const String &newSsid, const String &newPass, long version) {
  prefs.begin("wificfg", false);
  prefs.putString("pending_ssid", newSsid);
  prefs.putString("pending_pass", newPass);
  prefs.putLong("pending_ver", version);
  prefs.end();
  pendingSsid = newSsid;
  pendingPass = newPass;
  pendingVersion = version;
  hasPending = true;
}

void clearPendingCredentials() {
  prefs.begin("wificfg", false);
  prefs.putLong("pending_ver", activeVersion);  // <= activeVersion => gilt nicht mehr als "pending"
  prefs.end();
  hasPending = false;
}

// Ein einzelner Verbindungsversuch mit Timeout (WiFi.begin allein würde sonst
// endlos hängen bleiben, falls die Zugangsdaten falsch sind).
bool tryConnect(const String &s, const String &p, unsigned long timeoutMs) {
  if (s.length() == 0) return false;
  Serial.printf("📡 Verbinde mit WLAN: %s\n", s.c_str());
  WiFi.begin(s.c_str(), p.c_str());
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

// Robuster Verbindungsaufbau: zuerst evtl. hinterlegte neue ("pending")
// Zugangsdaten probieren, bei Fehlschlag zurück auf die zuletzt bekannt
// funktionierenden. Klappt auch das nicht, übernimmt startConfigPortal().
void connectWiFi() {
  loadWifiCredentials();

  bool pendingJustTried = false;
  bool pendingSucceeded = false;

  if (hasPending) {
    Serial.println("🆕 Neue WLAN-Zugangsdaten hinterlegt - probiere sie zuerst...");
    pendingJustTried = true;
    if (tryConnect(pendingSsid, pendingPass, WIFI_CONNECT_TIMEOUT)) {
      Serial.println("✅ Neue WLAN-Zugangsdaten funktionieren! Werden übernommen.");
      saveActiveCredentials(pendingSsid, pendingPass, pendingVersion);
      clearPendingCredentials();
      pendingSucceeded = true;
    } else {
      Serial.println("❌ Neue WLAN-Zugangsdaten fehlgeschlagen - falle zurück...");
      WiFi.disconnect(true);
      delay(200);
    }
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (!tryConnect(activeSsid, activePass, WIFI_CONNECT_TIMEOUT)) {
      Serial.println("❌ Auch die zuletzt bekannten WLAN-Zugangsdaten funktionieren nicht!");
      startConfigPortal();  // blockiert, bis eine Verbindung zustande kam
      pendingJustTried = false;  // startConfigPortal hat activeCredentials ggf. bereits neu gesetzt
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi verbunden!");
    Serial.print("📍 IP Adresse: ");
    Serial.println(WiFi.localIP());

    // Ergebnis eines gerade probierten "pending"-Versuchs zurückmelden, damit
    // das Dashboard weiß, ob die neuen Daten übernommen wurden.
    if (pendingJustTried) {
      reportConfigAck(pendingVersion, pendingSucceeded ? "applied" : "failed");
    }
  } else {
    Serial.println("❌ WiFi Verbindung fehlgeschlagen!");
  }
}

// Letzter Ausweg: öffnet einen Access Point ("ESP32-Sensor-Setup"), über den
// man sich per Handy verbindet und neue WLAN-Zugangsdaten per Web-Formular
// eingibt. Blockiert, bis eine Verbindung zustande kommt oder der Timeout
// abläuft (dann Neustart, um es von vorn zu versuchen).
void startConfigPortal() {
  Serial.println("📶 Öffne Konfigurations-Access-Point 'ESP32-Sensor-Setup'...");
  WiFiManager wm;
  wm.setConfigPortalTimeout(300);  // 5 Minuten
  bool connected = wm.startConfigPortal("ESP32-Sensor-Setup");
  if (connected) {
    Serial.println("✅ Über Konfigurations-Portal verbunden!");
    saveActiveCredentials(WiFi.SSID(), WiFi.psk(), activeVersion);
  } else {
    Serial.println("❌ Konfigurations-Portal ohne Erfolg beendet - Neustart...");
    delay(1000);
    ESP.restart();
  }
}

void reportConfigAck(long version, const String &status) {
  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/device/" + DEVICE_ID + "/config/ack");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  StaticJsonDocument<128> doc;
  doc["version"] = version;
  doc["status"] = status;

  String jsonString;
  serializeJson(doc, jsonString);
  int httpCode = http.POST(jsonString);

  if (httpCode == 200) {
    Serial.printf("✅ Config-Version %ld als \"%s\" gemeldet\n", version, status.c_str());
  } else {
    Serial.printf("⚠️  Konnte Config-Ack nicht senden: %d\n", httpCode);
  }

  http.end();
}

// Fragt regelmäßig, ob am Dashboard neue WLAN-Zugangsdaten hinterlegt wurden.
// Verbindet sich NICHT sofort um - speichert sie nur als "pending" für den
// nächsten Neustart (siehe connectWiFi()), damit die laufende Verbindung am
// aktuellen Standort nicht sofort gekappt wird.
void checkForConfigUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/device/" + DEVICE_ID + "/config");
  http.addHeader("X-API-Key", apiKey);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      long serverVersion = doc["data"]["version"] | 0;
      long knownVersion = hasPending ? pendingVersion : activeVersion;

      if (serverVersion > knownVersion) {
        String newSsid = doc["data"]["wifi_ssid"] | "";
        String newPass = doc["data"]["wifi_password"] | "";
        if (newSsid.length() > 0) {
          Serial.printf("🆕 Neue WLAN-Config gefunden (Version %ld): %s\n", serverVersion, newSsid.c_str());
          savePendingCredentials(newSsid, newPass, serverVersion);
          Serial.println("   Wird erst beim nächsten Neustart des Geräts probiert.");
        }
      }
    } else {
      Serial.printf("❌ [Config-Check] JSON Parse Fehler: %s\n", error.c_str());
    }
  } else if (httpCode == 401) {
    Serial.println("❌ [Config-Check] 401 Unauthorized - API_KEY prüfen!");
  } else {
    Serial.printf("⚠️  [Config-Check] HTTP Fehler: %d\n", httpCode);
  }

  http.end();
}

// ==================== SENSOR FUNKTIONEN ====================

void readAndSendSensorData() {
  Serial.println("\n--- Sensordaten lesen ---");

  float temperatur = readTemperature();
  float luftfeuchtigkeit = readHumidity();

  // Gesamt-Stromverbrauch = Summe beider SwitchBot-Plugs (Heizung + Entfeuchter).
  // Erfasst NICHT den Verbrauch der übrigen Veranstaltungstechnik im Raum -
  // nur das, was über die beiden gesteuerten Dosen läuft.
  float stromHeizung = getSwitchBotPower(plugs[0].switchbotDeviceId);
  float stromEntfeuchter = getSwitchBotPower(plugs[1].switchbotDeviceId);
  float stromverbrauch = stromHeizung + stromEntfeuchter;

  Serial.printf("🌡️  Temperatur: %.1f°C\n", temperatur);
  Serial.printf("💧 Luftfeuchtigkeit: %.0f%%\n", luftfeuchtigkeit);
  Serial.printf("⚡ Stromverbrauch gesamt: %.1f W (Heizung: %.1fW, Entfeuchter: %.1fW)\n",
                stromverbrauch, stromHeizung, stromEntfeuchter);

  sendDataToAPI(temperatur, luftfeuchtigkeit, stromverbrauch, stromHeizung, stromEntfeuchter);
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("❌ Fehler beim Auslesen der Temperatur");
    return 20.0;
  }
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    Serial.println("❌ Fehler beim Auslesen der Luftfeuchtigkeit");
    return 50.0;
  }
  return hum;
}

void sendDataToAPI(float temperatur, float luftfeuchtigkeit, float stromverbrauch,
                    float stromHeizung, float stromEntfeuchter) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Keine WiFi Verbindung");
    return;
  }

  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/sensors");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  StaticJsonDocument<256> doc;
  doc["temperatur"] = temperatur;
  doc["luftfeuchtigkeit"] = luftfeuchtigkeit;
  doc["stromverbrauch"] = stromverbrauch;
  doc["stromverbrauch_heizung"] = stromHeizung;
  doc["stromverbrauch_entfeuchter"] = stromEntfeuchter;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);

  if (httpCode == 201) {
    Serial.println("✅ Daten erfolgreich gesendet!");
  } else if (httpCode == 401) {
    Serial.println("❌ 401 Unauthorized - API_KEY stimmt nicht mit dem Backend überein!");
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate Limit erreicht (429) - Warte länger...");
    lastSensorRead += 30000;
  } else if (httpCode > 0) {
    Serial.printf("⚠️  HTTP Response Code: %d\n", httpCode);
  } else {
    Serial.printf("❌ HTTP Fehler: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ==================== SWITCHBOT AUTHENTIFIZIERUNG ====================

void generateSwitchBotHeaders(HTTPClient &http) {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("❌ Keine Zeit verfügbar!");
    return;
  }

  time_t now = time(nullptr);
  unsigned long long timestamp = (unsigned long long)now * 1000ULL;

  String nonce = "";
  for (int i = 0; i < 8; i++) nonce += String(random(0, 16), HEX);
  nonce += "-";
  for (int i = 0; i < 4; i++) nonce += String(random(0, 16), HEX);
  nonce += "-4";
  for (int i = 0; i < 3; i++) nonce += String(random(0, 16), HEX);

  String stringToSign = String(switchbotToken) + String(timestamp) + nonce;

  uint8_t hash[32];
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, info, 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)switchbotSecret, strlen(switchbotSecret));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)stringToSign.c_str(), stringToSign.length());
  mbedtls_md_hmac_finish(&ctx, hash);
  mbedtls_md_free(&ctx);

  unsigned char base64Sign[64];
  size_t olen = 0;
  mbedtls_base64_encode(base64Sign, sizeof(base64Sign), &olen, hash, sizeof(hash));
  String sign = String((char*)base64Sign).substring(0, olen);

  http.addHeader("Authorization", switchbotToken);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("charset", "utf8");
  http.addHeader("t", String(timestamp));
  http.addHeader("sign", sign);
  http.addHeader("nonce", nonce);
}

// ==================== SWITCHBOT API FUNKTIONEN ====================

// Löst BEIDE konfigurierten Geräte-Namen in einem einzigen API-Aufruf auf
// und befüllt plugs[i].switchbotDeviceId entsprechend.
void resolveSwitchBotDeviceIds() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices";

  http.begin(url);
  generateSwitchBotHeaders(http);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      JsonArray devices = doc["body"]["deviceList"];
      Serial.printf("📱 Gefundene Geräte: %d\n", devices.size());

      for (JsonObject device : devices) {
        String deviceType = device["deviceType"] | "";
        String deviceId = device["deviceId"] | "";
        String deviceName = device["deviceName"] | "";

        Serial.printf("  - %s (%s): %s\n", deviceName.c_str(), deviceType.c_str(), deviceId.c_str());

        if (deviceType.indexOf("Plug") < 0) continue;

        for (int i = 0; i < 2; i++) {
          if (deviceName == plugs[i].switchbotName) {
            plugs[i].switchbotDeviceId = deviceId;
          }
        }
      }
    } else {
      Serial.printf("❌ JSON Parse Fehler: %s\n", error.c_str());
    }
  } else {
    Serial.printf("❌ SwitchBot API Fehler: %d\n", httpCode);
  }

  http.end();
}

float getSwitchBotPower(const String &deviceId) {
  if (deviceId.length() == 0) return 0.0;

  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices/" + deviceId + "/status";

  http.begin(url);
  generateSwitchBotHeaders(http);

  int httpCode = http.GET();
  float power = 0.0;

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      power = doc["body"]["power"] | 0.0;
    }
  }

  http.end();
  return power;
}

bool setSwitchBotState(const String &deviceId, const String &state) {
  if (deviceId.length() == 0) {
    Serial.println("❌ Keine Device ID vorhanden!");
    return false;
  }

  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices/" + deviceId + "/commands";

  http.begin(url);
  generateSwitchBotHeaders(http);

  StaticJsonDocument<256> doc;
  doc["command"] = (state == "on") ? "turnOn" : "turnOff";
  doc["parameter"] = "default";
  doc["commandType"] = "command";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  bool success = (httpCode == 200);

  if (success) {
    Serial.println("✅ SwitchBot Command erfolgreich!");
  } else {
    Serial.printf("❌ SwitchBot Command Fehler: %d\n", httpCode);
  }

  http.end();
  return success;
}

// ==================== PLUG CONTROL FUNKTIONEN ====================

void checkAndControlPlug(int plugIndex) {
  Plug &plug = plugs[plugIndex];

  if (plug.switchbotDeviceId.length() == 0) {
    return;  // Gerät wurde beim Start nicht gefunden - still überspringen
  }

  String desiredState = getDesiredStateFromAPI(plug.id);

  if (desiredState == "error") {
    return;
  }

  if (desiredState != plug.currentState && desiredState != "unknown") {
    Serial.printf("\n--- %s: Status-Änderung ---\n", plug.id);
    Serial.printf("🔄 %s → %s\n", plug.currentState.c_str(), desiredState.c_str());

    if (setSwitchBotState(plug.switchbotDeviceId, desiredState)) {
      plug.currentState = desiredState;
      reportStateToAPI(plug.id, desiredState);
    } else {
      reportStateToAPI(plug.id, "unknown");
    }
  }
}

String getDesiredStateFromAPI(const String &plugId) {
  if (WiFi.status() != WL_CONNECTED) {
    return "error";
  }

  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/plug/" + plugId + "/desired");

  int httpCode = http.GET();
  String result = "error";

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      result = (doc["data"]["desired_state"] | "unknown").as<String>();
    } else {
      Serial.printf("❌ JSON Parse Fehler [%s]: %s\n", plugId.c_str(), error.c_str());
    }
  } else if (httpCode == 429) {
    Serial.printf("⚠️  Rate Limit (429) [%s] - übersprungen\n", plugId.c_str());
    result = "unknown";
  } else {
    Serial.printf("❌ HTTP Fehler [%s]: %d\n", plugId.c_str(), httpCode);
  }

  http.end();
  return result;
}

void reportStateToAPI(const String &plugId, const String &state) {
  HTTPClient http;
  http.begin(String(apiBaseUrl) + "/plug/" + plugId + "/reported");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  StaticJsonDocument<128> doc;
  doc["state"] = state;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);

  if (httpCode == 200) {
    Serial.printf("✅ [%s] Status an API gemeldet\n", plugId.c_str());
  } else if (httpCode == 401) {
    Serial.printf("❌ [%s] 401 Unauthorized - API_KEY prüfen!\n", plugId.c_str());
  } else {
    Serial.printf("⚠️  [%s] Fehler beim Melden: %d\n", plugId.c_str(), httpCode);
  }

  http.end();
}
