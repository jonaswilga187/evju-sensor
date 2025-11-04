#!/usr/bin/env python3
"""
Beispiel-Script für Sensor (z.B. auf Raspberry Pi)
Sendet Temperatur, Luftfeuchtigkeit und Stromverbrauch an die API
"""

import requests
import time
import random
from datetime import datetime

# API Konfiguration
API_URL = "http://localhost:5000/api/sensors"  # Oder: https://api.yourdomain.com/api/sensors
API_TIMEOUT = 10  # Sekunden

# Intervall (in Sekunden)
INTERVAL = 300  # 5 Minuten = 300 Sekunden

# Funktion: Temperatur auslesen (Beispiel)
def get_temperature():
    """
    Hier würdest du deinen echten Sensor auslesen, z.B.:
    - DHT22 Sensor
    - DS18B20 Sensor
    - BME280 Sensor
    """
    # Beispiel: Zufallswert (ersetze mit echtem Sensor!)
    return round(random.uniform(18.0, 26.0), 1)

# Funktion: Luftfeuchtigkeit auslesen (Beispiel)
def get_humidity():
    """
    Hier würdest du deinen echten Sensor auslesen
    """
    # Beispiel: Zufallswert (ersetze mit echtem Sensor!)
    return round(random.uniform(45.0, 75.0), 0)

# Funktion: Stromverbrauch auslesen (Beispiel)
def get_power_consumption():
    """
    Hier würdest du deinen Stromzähler auslesen, z.B.:
    - Shelly Plug
    - Tasmota Steckdose
    - Modbus Stromzähler
    """
    # Beispiel: Zufallswert (ersetze mit echtem Sensor!)
    return round(random.uniform(300, 800), 0)

# Funktion: Daten an API senden
def send_to_api(temperatur, luftfeuchtigkeit, stromverbrauch):
    """
    Sendet Messwerte an die Backend API
    """
    data = {
        "temperatur": temperatur,
        "luftfeuchtigkeit": luftfeuchtigkeit,
        "stromverbrauch": stromverbrauch,
        "zeitstempel": datetime.utcnow().isoformat() + "Z"  # Optional
    }
    
    try:
        response = requests.post(
            API_URL,
            json=data,
            timeout=API_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Daten erfolgreich gesendet")
            print(f"   Temp: {temperatur}°C, Luftf: {luftfeuchtigkeit}%, Strom: {stromverbrauch}W")
            return True
        else:
            print(f"❌ Fehler: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⏱️  Timeout beim Senden der Daten")
        return False
    except requests.exceptions.ConnectionError:
        print(f"🔌 Verbindungsfehler - API nicht erreichbar")
        return False
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {e}")
        return False

# Hauptschleife
def main():
    print("🌡️  Sensor Monitoring gestartet")
    print(f"📡 API URL: {API_URL}")
    print(f"⏱️  Intervall: {INTERVAL} Sekunden ({INTERVAL/60} Minuten)")
    print("-" * 50)
    
    while True:
        try:
            # Sensoren auslesen
            temperatur = get_temperature()
            luftfeuchtigkeit = get_humidity()
            stromverbrauch = get_power_consumption()
            
            # An API senden
            send_to_api(temperatur, luftfeuchtigkeit, stromverbrauch)
            
            # Warten bis zum nächsten Durchlauf
            time.sleep(INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\n⛔ Sensor Monitoring gestoppt")
            break
        except Exception as e:
            print(f"❌ Fehler in Hauptschleife: {e}")
            time.sleep(60)  # Bei Fehler 1 Minute warten

if __name__ == "__main__":
    main()


