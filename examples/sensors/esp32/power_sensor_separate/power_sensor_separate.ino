/*
 * ESP32 Beispiel - Separater Stromverbrauch-Sensor
 * 
 * Sendet nur Stromverbrauch an den neuen /api/sensors/power Endpunkt
 * z.B. für PZEM-004T Stromzähler oder ähnliche
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Konfiguration
const char* ssid = "DeinWiFiName";
const char* password = "DeinWiFiPasswort";

// API Konfiguration
const char* apiUrl = "http://192.168.1.100:5000/api/sensors/power";  // Passe die IP an!
const char* sensorId = "power_sensor_001";

// Intervall
const unsigned long interval = 60000;  // 1 Minute in Millisekunden
unsigned long previousMillis = 0;

// Funktion: Stromverbrauch auslesen
float getPowerConsumption() {
  /*
   * Hier würdest du deinen echten Stromzähler auslesen:
   * - PZEM-004T über Serial
   * - ACS712 Stromsensor
   * - SCT-013 Stromsensor
   * - Etc.
   */
  
  // Beispiel: Zufallswert (ersetze mit echtem Sensor!)
  return random(300, 800);
}

// Funktion: Daten an API senden
bool sendPowerToAPI(float stromverbrauch) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // HTTP POST vorbereiten
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");
    
    // JSON Payload erstellen
    StaticJsonDocument<200> doc;
    doc["stromverbrauch"] = stromverbrauch;
    doc["sensor_id"] = sensorId;
    // Zeitstempel wird vom Server generiert, wenn nicht angegeben
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // POST Request senden
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      String response = http.getString();
      Serial.println("✅ Stromverbrauch erfolgreich gesendet");
      Serial.print("   Strom: ");
      Serial.print(stromverbrauch);
      Serial.println("W");
      Serial.print("   Response: ");
      Serial.println(response);
      http.end();
      return true;
    } else {
      Serial.print("❌ HTTP Fehler: ");
      Serial.println(httpResponseCode);
      Serial.print("   Response: ");
      Serial.println(http.getString());
      http.end();
      return false;
    }
  } else {
    Serial.println("🔌 WiFi nicht verbunden!");
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("⚡ ESP32 Stromverbrauch-Sensor gestartet");
  Serial.println("================================");
  
  // WiFi verbinden
  Serial.print("📡 Verbinde mit WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi verbunden!");
  Serial.print("   IP-Adresse: ");
  Serial.println(WiFi.localIP());
  Serial.print("   API URL: ");
  Serial.println(apiUrl);
  Serial.print("   Sensor ID: ");
  Serial.println(sensorId);
  Serial.println("================================");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Alle X Millisekunden Daten senden
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Stromverbrauch auslesen
    float stromverbrauch = getPowerConsumption();
    
    // An API senden
    sendPowerToAPI(stromverbrauch);
  }
  
  // Kurze Pause
  delay(100);
}

