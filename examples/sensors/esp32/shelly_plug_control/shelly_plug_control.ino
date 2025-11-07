/*
 * ESP32 - Heizung Control mit Sensor Monitoring
 * 
 * Funktionen:
 * - Liest DHT22 Sensor (Temperatur & Luftfeuchtigkeit)
 * - Liest Shelly Plug Stromverbrauch aus
 * - Sendet Daten an API
 * - Fragt API nach gewünschtem Heizungs-Status
 * - Steuert Heizung (über Shelly Plug) per HTTP
 * - Unterstützt Automatik-Modus (API entscheidet basierend auf Temperatur)
 * 
 * Modi:
 * - Manuell: Website steuert direkt
 * - Automatik: API schaltet basierend auf Temperaturschwellenwert
 * 
 * Hardware:
 * - ESP32
 * - DHT22 Sensor
 * - Shelly Plug mit angeschlossener Heizung (im gleichen Netzwerk)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== KONFIGURATION ====================

// WiFi Zugangsdaten
const char* WIFI_SSID = "DeinWiFi";
const char* WIFI_PASSWORD = "DeinPasswort";

// API Server
const char* API_URL = "http://dein-server.de/api";  // OHNE / am Ende!

// Shelly Plug IP
const char* SHELLY_IP = "192.168.1.100";  // IP deines Shelly Plug

// DHT22 Sensor
#define DHT_PIN 4         // GPIO Pin für DHT22
#define DHT_TYPE DHT22    // DHT22 (AM2302)

// Timing (in Millisekunden)
const unsigned long SENSOR_INTERVAL = 60000;      // Alle 60 Sekunden Sensordaten senden
const unsigned long PLUG_CHECK_INTERVAL = 5000;   // Alle 5 Sekunden Status prüfen

// ==================== GLOBALE VARIABLEN ====================

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSensorRead = 0;
unsigned long lastPlugCheck = 0;
String currentPlugState = "unknown";

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 - Heizung Control");
  Serial.println("=================================\n");
  
  // DHT22 initialisieren
  dht.begin();
  Serial.println("✓ DHT22 Sensor initialisiert");
  
  // WiFi verbinden
  connectWiFi();
  
  Serial.println("\n✓ System bereit!\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long currentMillis = millis();
  
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
  
  delay(100);  // Kurze Pause
}

// ==================== WIFI FUNKTIONEN ====================

void connectWiFi() {
  Serial.print("Verbinde mit WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi verbunden!");
    Serial.print("IP Adresse: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi Verbindung fehlgeschlagen!");
  }
}

// ==================== SENSOR FUNKTIONEN ====================

void readAndSendSensorData() {
  Serial.println("\n--- Sensordaten lesen ---");
  
  // DHT22 auslesen
  float temperatur = dht.readTemperature();
  float luftfeuchtigkeit = dht.readHumidity();
  
  if (isnan(temperatur) || isnan(luftfeuchtigkeit)) {
    Serial.println("✗ Fehler beim Lesen des DHT22 Sensors!");
    return;
  }
  
  Serial.printf("Temperatur: %.1f°C\n", temperatur);
  Serial.printf("Luftfeuchtigkeit: %.0f%%\n", luftfeuchtigkeit);
  
  // Heizung Stromverbrauch abrufen (über Shelly Plug)
  float stromverbrauch = getShellyPower();
  Serial.printf("Stromverbrauch Heizung: %.0f W\n", stromverbrauch);
  
  // An API senden
  sendDataToAPI(temperatur, luftfeuchtigkeit, stromverbrauch);
}

float getShellyPower() {
  HTTPClient http;
  
  String url = String("http://") + SHELLY_IP + "/status";
  http.begin(url);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // JSON parsen
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    
    // Power aus JSON holen (Shelly Plug gibt "meters":[{"power":...}] zurück)
    float power = doc["meters"][0]["power"] | 0.0;
    
    http.end();
    return power;
  }
  
  http.end();
  Serial.println("✗ Fehler beim Abrufen des Shelly Status");
  return 0.0;
}

void sendDataToAPI(float temp, float hum, float power) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ Nicht mit WiFi verbunden!");
    return;
  }
  
  HTTPClient http;
  
  String url = String(API_URL) + "/sensors";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // JSON erstellen
  DynamicJsonDocument doc(256);
  doc["temperatur"] = temp;
  doc["luftfeuchtigkeit"] = hum;
  doc["stromverbrauch"] = power;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // POST Request
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    if (httpCode == 201) {
      Serial.println("✓ Daten erfolgreich gesendet!");
    } else if (httpCode == 429) {
      Serial.println("⚠ Rate Limit erreicht (429) - Warte länger...");
      // Bei Rate Limit: Nächsten Request verzögern
      lastSensorRead += 30000;  // +30 Sekunden extra warten
    } else {
      Serial.printf("✗ API Fehler: %d\n", httpCode);
      Serial.println(http.getString());
    }
  } else {
    Serial.printf("✗ HTTP Fehler: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

// ==================== PLUG CONTROL FUNKTIONEN ====================

void checkAndControlPlug() {
  // Gewünschten Status von API abrufen
  String desiredState = getDesiredStateFromAPI();
  
  if (desiredState == "error") {
    return;  // Bei Fehler nichts tun
  }
  
  // Status hat sich geändert?
  if (desiredState != currentPlugState && desiredState != "unknown") {
    Serial.printf("\n>>> Status-Änderung erkannt: %s -> %s\n", 
                  currentPlugState.c_str(), desiredState.c_str());
    
    // Heizung schalten
    if (setShellyState(desiredState)) {
      currentPlugState = desiredState;
      Serial.println("✓ Heizung erfolgreich geschaltet!");
      
      // Gemeldeten Status an API senden
      reportStateToAPI(desiredState);
    } else {
      Serial.println("✗ Fehler beim Schalten der Heizung!");
    }
  } else {
    Serial.printf("Status: %s (keine Änderung)\n", currentPlugState.c_str());
  }
}

String getDesiredStateFromAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    return "error";
  }
  
  HTTPClient http;
  
  String url = String(API_URL) + "/plug/desired";
  http.begin(url);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(512);
    deserializeJson(doc, payload);
    
    String state = doc["data"]["desired_state"] | "unknown";
    
    http.end();
    return state;
  } else if (httpCode == 429) {
    Serial.println("⚠ Rate Limit erreicht (429) - Überspringe diesen Check");
    http.end();
    return currentPlugState;  // Aktuellen Status beibehalten
  }
  
  http.end();
  Serial.printf("✗ API Fehler: %d\n", httpCode);
  return "error";
}

bool setShellyState(String state) {
  HTTPClient http;
  
  // Shelly Plug verwendet "relay/0?turn=on" bzw "relay/0?turn=off"
  String command = (state == "on") ? "on" : "off";
  String url = String("http://") + SHELLY_IP + "/relay/0?turn=" + command;
  
  http.begin(url);
  int httpCode = http.GET();
  
  http.end();
  
  return (httpCode == 200);
}

void reportStateToAPI(String state) {
  HTTPClient http;
  
  String url = String(API_URL) + "/plug/reported";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(128);
  doc["state"] = state;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == 200) {
    Serial.println("✓ Status an API gemeldet");
  } else if (httpCode == 429) {
    Serial.println("⚠ Rate Limit erreicht (429) - Status-Meldung übersprungen");
  } else {
    Serial.printf("✗ Fehler beim Melden: %d\n", httpCode);
  }
  
  http.end();
}

