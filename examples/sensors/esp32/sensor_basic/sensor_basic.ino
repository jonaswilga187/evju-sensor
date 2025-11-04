/*
 * ESP32 Sensor Example
 * Sendet Temperatur, Luftfeuchtigkeit und Stromverbrauch an die API
 * 
 * Benötigte Libraries:
 * - WiFi.h (vorinstalliert)
 * - HTTPClient.h (vorinstalliert)
 * - DHT sensor library (für DHT22)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
// #include <DHT.h>  // Für echten Sensor

// WiFi Konfiguration
const char* ssid = "DEIN_WIFI_SSID";
const char* password = "DEIN_WIFI_PASSWORT";

// API Konfiguration
const char* apiUrl = "http://192.168.1.100:5000/api/sensors";  // Deine API URL
// const char* apiUrl = "https://api.yourdomain.com/api/sensors";  // Production

// Sensor Konfiguration
// #define DHTPIN 4
// #define DHTTYPE DHT22
// DHT dht(DHTPIN, DHTTYPE);

// Intervall in Millisekunden
const unsigned long interval = 300000;  // 5 Minuten = 300000 ms
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🌡️  ESP32 Sensor Monitoring");
  Serial.println("============================");
  
  // WiFi verbinden
  connectWiFi();
  
  // Sensor initialisieren
  // dht.begin();
  
  Serial.println("✅ Setup abgeschlossen");
  Serial.println();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Prüfen ob Intervall erreicht
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // WiFi Status prüfen
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️  WiFi Verbindung verloren - Reconnect...");
      connectWiFi();
    }
    
    // Sensordaten auslesen
    float temperatur = readTemperature();
    float luftfeuchtigkeit = readHumidity();
    int stromverbrauch = readPowerConsumption();
    
    // Daten senden
    sendToAPI(temperatur, luftfeuchtigkeit, stromverbrauch);
  }
  
  delay(100);  // Kleine Pause
}

// WiFi verbinden
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

// Temperatur auslesen
float readTemperature() {
  // Echten Sensor auslesen:
  // float temp = dht.readTemperature();
  // if (isnan(temp)) {
  //   Serial.println("❌ Fehler beim Auslesen der Temperatur");
  //   return 20.0;  // Fallback-Wert
  // }
  // return temp;
  
  // Beispiel: Zufallswert
  return random(180, 280) / 10.0;  // 18.0 - 28.0 °C
}

// Luftfeuchtigkeit auslesen
float readHumidity() {
  // Echten Sensor auslesen:
  // float hum = dht.readHumidity();
  // if (isnan(hum)) {
  //   Serial.println("❌ Fehler beim Auslesen der Luftfeuchtigkeit");
  //   return 50.0;  // Fallback-Wert
  // }
  // return hum;
  
  // Beispiel: Zufallswert
  return random(450, 750) / 10.0;  // 45.0 - 75.0 %
}

// Stromverbrauch auslesen
int readPowerConsumption() {
  // Beispiel: Wert von Shelly Plug o.ä. abrufen
  // Hier würdest du z.B. einen anderen HTTP Request machen
  
  // Beispiel: Zufallswert
  return random(300, 800);  // 300 - 800 Watt
}

// Daten an API senden
void sendToAPI(float temperatur, float luftfeuchtigkeit, int stromverbrauch) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Keine WiFi Verbindung");
    return;
  }
  
  HTTPClient http;
  
  Serial.println("\n📤 Sende Daten an API...");
  Serial.printf("   Temp: %.1f°C, Luftf: %.1f%%, Strom: %dW\n", 
                temperatur, luftfeuchtigkeit, stromverbrauch);
  
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  
  // JSON Payload erstellen
  StaticJsonDocument<200> doc;
  doc["temperatur"] = temperatur;
  doc["luftfeuchtigkeit"] = luftfeuchtigkeit;
  doc["stromverbrauch"] = stromverbrauch;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // POST Request senden
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 201) {
    Serial.println("✅ Daten erfolgreich gesendet!");
  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️  HTTP Response Code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("   Response: " + response);
  } else {
    Serial.printf("❌ Fehler beim Senden: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}


