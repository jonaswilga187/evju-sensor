/*
 * ESP32 - Heizung Control mit SwitchBot + Sensor Monitoring
 * 
 * Funktionen:
 * - Liest DHT22 Sensor (Temperatur & Luftfeuchtigkeit)
 * - Sendet Daten an eigene API
 * - Fragt eigene API nach gewünschtem Heizungs-Status
 * - Steuert SwitchBot Plug über SwitchBot Cloud API
 * - Unterstützt Automatik-Modus
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <mbedtls/md.h>
#include <mbedtls/base64.h>
#include <time.h>

// ==================== KONFIGURATION ====================

// WiFi Zugangsdaten
const char* ssid = "EvjuCelle_Technik";
const char* password = "hallodeniz";

// Eigene API (Temperatur-Monitoring)
const char* apiUrl = "https://api.temperatur.evjucelle.de/api/sensors";
const char* apiPlugDesired = "https://api.temperatur.evjucelle.de/api/plug/desired";
const char* apiPlugReported = "https://api.temperatur.evjucelle.de/api/plug/reported";

// SwitchBot API
const char* switchbotApiBase = "https://api.switch-bot.com/v1.1";
const char* switchbotToken = "7214d65667fc6c202f4c4ebcf90360fff11de7570f1e73517e17e3ae256f07f0c5f35c9a1251468f3501a0ad39ff7869";
const char* switchbotSecret = "6156f98fbb67e632ee6847744b974676";

// NTP Server für Zeit-Synchronisation
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;      // GMT+1 (Deutschland)
const int daylightOffset_sec = 3600;  // Sommerzeit

// DHT22 Sensor
#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Timing (in Millisekunden)
const unsigned long SENSOR_INTERVAL = 60000;     // 1 Minute für Sensordaten (1440 Requests/Tag = 14%)
const unsigned long PLUG_CHECK_INTERVAL = 5000;  // 5 Sekunden für Plug-Status (nur eigene API!)

// ==================== GLOBALE VARIABLEN ====================

unsigned long lastSensorRead = 0;
unsigned long lastPlugCheck = 0;
String currentPlugState = "unknown";
String currentMode = "manual";
String switchbotDeviceId = "";  // Wird beim Start ermittelt

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("🔥 ESP32 - SwitchBot Heizung Control");
  Serial.println("=================================\n");
  
  // DHT22 initialisieren
  dht.begin();
  Serial.println("✅ DHT22 Sensor initialisiert");
  
  // WiFi verbinden
  connectWiFi();
  
  // Zeit synchronisieren
  Serial.println("\n⏰ Synchronisiere Zeit mit NTP...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Warte bis Zeit synchronisiert ist
  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 10) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (getLocalTime(&timeinfo)) {
    Serial.println("\n✅ Zeit synchronisiert!");
    Serial.println(&timeinfo, "📅 Aktuelle Zeit: %A, %B %d %Y %H:%M:%S");
  } else {
    Serial.println("\n❌ Zeit-Synchronisation fehlgeschlagen!");
    Serial.println("⚠️  SwitchBot API wird nicht funktionieren!");
  }
  
  // SwitchBot Device ID ermitteln
  Serial.println("\n🔍 Suche SwitchBot Geräte...");
  switchbotDeviceId = getSwitchBotDeviceList();
  
  if (switchbotDeviceId.length() > 0) {
    Serial.println("✅ SwitchBot Gerät gefunden: " + switchbotDeviceId);
    
    // Initialer Status-Check
    Serial.println("\n🔍 Initialer Status-Check...");
    checkAndControlPlug();
  } else {
    Serial.println("❌ Kein SwitchBot Gerät gefunden!");
  }
  
  Serial.println("\n✅ System bereit!\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long currentMillis = millis();
  
  // WiFi Status prüfen
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi Verbindung verloren - Reconnect...");
    connectWiFi();
  }
  
  // 1. Sensordaten lesen und senden (alle 60 Sekunden)
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readAndSendSensorData();
  }
  
  // 2. Heizungs-Status prüfen und ggf. schalten (alle 5 Sekunden)
  if (currentMillis - lastPlugCheck >= PLUG_CHECK_INTERVAL) {
    lastPlugCheck = currentMillis;
    checkAndControlPlug();
  }
  
  delay(100);
}

// ==================== WIFI FUNKTIONEN ====================

void connectWiFi() {
  Serial.print("📡 Verbinde mit WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi verbunden!");
    Serial.print("📍 IP Adresse: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Verbindung fehlgeschlagen!");
  }
}

// ==================== SENSOR FUNKTIONEN ====================

void readAndSendSensorData() {
  Serial.println("\n--- Sensordaten lesen ---");
  
  // DHT22 auslesen
  float temperatur = readTemperature();
  float luftfeuchtigkeit = readHumidity();
  
  // SwitchBot Stromverbrauch auslesen (nur alle 5 Minuten!)
  float stromverbrauch = getSwitchBotPower();
  
  Serial.printf("🌡️  Temperatur: %.1f°C\n", temperatur);
  Serial.printf("💧 Luftfeuchtigkeit: %.0f%%\n", luftfeuchtigkeit);
  Serial.printf("⚡ Stromverbrauch: %.1f W (SwitchBot API-Aufruf)\n", stromverbrauch);
  
  // An eigene API senden
  sendDataToAPI(temperatur, luftfeuchtigkeit, stromverbrauch);
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("❌ Fehler beim Auslesen der Temperatur");
    return 20.0;  // Fallback
  }
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    Serial.println("❌ Fehler beim Auslesen der Luftfeuchtigkeit");
    return 50.0;  // Fallback
  }
  return hum;
}

void sendDataToAPI(float temperatur, float luftfeuchtigkeit, float stromverbrauch) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Keine WiFi Verbindung");
    return;
  }
  
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  
  // JSON erstellen
  StaticJsonDocument<256> doc;
  doc["temperatur"] = temperatur;
  doc["luftfeuchtigkeit"] = luftfeuchtigkeit;
  doc["stromverbrauch"] = stromverbrauch;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // POST Request
  int httpCode = http.POST(jsonString);
  
  if (httpCode == 201) {
    Serial.println("✅ Daten erfolgreich gesendet!");
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate Limit erreicht (429) - Warte länger...");
    lastSensorRead += 30000;  // +30 Sekunden extra warten
  } else if (httpCode > 0) {
    Serial.printf("⚠️  HTTP Response Code: %d\n", httpCode);
  } else {
    Serial.printf("❌ HTTP Fehler: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

// ==================== SWITCHBOT AUTHENTIFIZIERUNG ====================

void generateSwitchBotHeaders(HTTPClient &http) {
  // Timestamp generieren - ECHTE Unix-Zeit in Millisekunden
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("❌ Keine Zeit verfügbar!");
    return;
  }
  
  time_t now = time(nullptr);
  unsigned long long timestamp = (unsigned long long)now * 1000ULL;
  
  // Nonce generieren (zufällige UUID)
  String nonce = "";
  for (int i = 0; i < 8; i++) {
    nonce += String(random(0, 16), HEX);
  }
  nonce += "-";
  for (int i = 0; i < 4; i++) {
    nonce += String(random(0, 16), HEX);
  }
  nonce += "-4";
  for (int i = 0; i < 3; i++) {
    nonce += String(random(0, 16), HEX);
  }
  
  // String zum Signieren erstellen: token + t + nonce
  String stringToSign = String(switchbotToken) + String(timestamp) + nonce;
  
  // HMAC-SHA256 Sign generieren
  uint8_t hash[32];
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, info, 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)switchbotSecret, strlen(switchbotSecret));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)stringToSign.c_str(), stringToSign.length());
  mbedtls_md_hmac_finish(&ctx, hash);
  mbedtls_md_free(&ctx);
  
  // Base64 Encoding
  unsigned char base64Sign[64];
  size_t olen = 0;
  mbedtls_base64_encode(base64Sign, sizeof(base64Sign), &olen, hash, sizeof(hash));
  String sign = String((char*)base64Sign).substring(0, olen);
  
  // Header setzen
  http.addHeader("Authorization", switchbotToken);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("charset", "utf8");
  http.addHeader("t", String(timestamp));
  http.addHeader("sign", sign);
  http.addHeader("nonce", nonce);
  
  // Debug-Ausgabe
  Serial.println("🔐 SwitchBot Auth Headers:");
  Serial.println("   Authorization: " + String(switchbotToken));
  Serial.println("   t: " + String(timestamp));
  Serial.println("   sign: " + sign);
  Serial.println("   nonce: " + nonce);
}

// ==================== SWITCHBOT API FUNKTIONEN ====================

String getSwitchBotDeviceList() {
  if (WiFi.status() != WL_CONNECTED) return "";
  
  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices";
  
  http.begin(url);
  generateSwitchBotHeaders(http);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println("📋 SwitchBot Geräteliste empfangen");
    
    // JSON parsen
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      JsonArray devices = doc["body"]["deviceList"];
      
      Serial.printf("📱 Gefundene Geräte: %d\n", devices.size());
      
      // Suche nach Plug Mini Gerät
      for (JsonObject device : devices) {
        String deviceType = device["deviceType"] | "";
        String deviceId = device["deviceId"] | "";
        String deviceName = device["deviceName"] | "";
        
        Serial.printf("  - %s (%s): %s\n", deviceName.c_str(), deviceType.c_str(), deviceId.c_str());
        
        // Nehme das erste Plug-Gerät
        if (deviceType.indexOf("Plug") >= 0) {
          http.end();
          return deviceId;
        }
      }
    } else {
      Serial.printf("❌ JSON Parse Fehler: %s\n", error.c_str());
    }
  } else {
    Serial.printf("❌ SwitchBot API Fehler: %d\n", httpCode);
    if (httpCode > 0) {
      Serial.println("Response: " + http.getString());
    }
  }
  
  http.end();
  return "";
}

float getSwitchBotPower() {
  if (switchbotDeviceId.length() == 0) return 0.0;
  
  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices/" + switchbotDeviceId + "/status";
  
  http.begin(url);
  generateSwitchBotHeaders(http);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // JSON parsen
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      float power = doc["body"]["power"] | 0.0;
      http.end();
      return power;
    }
  }
  
  http.end();
  return 0.0;
}

bool setSwitchBotState(String state) {
  if (switchbotDeviceId.length() == 0) {
    Serial.println("❌ Keine Device ID vorhanden!");
    return false;
  }
  
  HTTPClient http;
  String url = String(switchbotApiBase) + "/devices/" + switchbotDeviceId + "/commands";
  
  http.begin(url);
  generateSwitchBotHeaders(http);
  
  // Command JSON erstellen
  StaticJsonDocument<256> doc;
  doc["command"] = (state == "on") ? "turnOn" : "turnOff";
  doc["parameter"] = "default";
  doc["commandType"] = "command";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.printf("🔌 Sende Command: %s\n", jsonString.c_str());
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == 200) {
    Serial.println("✅ SwitchBot Command erfolgreich!");
    http.end();
    return true;
  } else {
    Serial.printf("❌ SwitchBot Command Fehler: %d\n", httpCode);
    if (httpCode > 0) {
      Serial.println("Response: " + http.getString());
    }
    http.end();
    return false;
  }
}

// ==================== PLUG CONTROL FUNKTIONEN ====================

void checkAndControlPlug() {
  if (switchbotDeviceId.length() == 0) {
    Serial.println("⚠️  Kein SwitchBot Gerät konfiguriert");
    return;
  }
  
  // Gewünschten Status von eigener API abrufen (KEIN SwitchBot-Request!)
  String desiredState = getDesiredStateFromAPI();
  
  if (desiredState == "error") {
    return;  // Leise weitermachen
  }
  
  // Status hat sich geändert?
  if (desiredState != currentPlugState && desiredState != "unknown") {
    Serial.println("\n--- Plug Status Änderung ---");
    Serial.printf("🔄 Änderung erkannt: %s → %s\n", 
                  currentPlugState.c_str(), desiredState.c_str());
    
    // SwitchBot schalten (NUR HIER wird SwitchBot API aufgerufen!)
    if (setSwitchBotState(desiredState)) {
      currentPlugState = desiredState;
      Serial.println("✅ Heizung erfolgreich geschaltet!");
      
      // Status an eigene API melden
      reportStateToAPI(desiredState);
    } else {
      Serial.println("❌ Fehler beim Schalten der Heizung!");
      reportStateToAPI("unknown");
    }
  }
  // Keine Ausgabe wenn sich nichts ändert (zu viel Log-Spam)
}

String getDesiredStateFromAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    return "error";
  }
  
  HTTPClient http;
  http.begin(apiPlugDesired);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // JSON parsen
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
      Serial.printf("❌ JSON Parse Fehler: %s\n", error.c_str());
      http.end();
      return "error";
    }
    
    String state = doc["data"]["desired_state"] | "unknown";
    currentMode = doc["data"]["mode"] | "manual";
    
    http.end();
    return state;
    
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate Limit erreicht (429) - Überspringe diesen Check");
    http.end();
    return currentPlugState;  // Aktuellen Status beibehalten
  } else {
    Serial.printf("❌ HTTP Fehler: %d\n", httpCode);
    http.end();
    return "error";
  }
}

void reportStateToAPI(String state) {
  HTTPClient http;
  http.begin(apiPlugReported);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<128> doc;
  doc["state"] = state;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == 200) {
    Serial.println("✅ Status an API gemeldet");
  } else if (httpCode == 429) {
    Serial.println("⚠️  Rate Limit erreicht (429) - Status-Meldung übersprungen");
  } else {
    Serial.printf("⚠️  Fehler beim Melden: %d\n", httpCode);
  }
  
  http.end();
}

