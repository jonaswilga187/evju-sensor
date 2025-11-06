#!/usr/bin/env python3
"""
Beispiel-Script für separaten Stromverbrauch-Sensor
Sendet nur Stromverbrauch an den neuen /api/sensors/power Endpunkt
"""

import requests
import time
import random
from datetime import datetime

# API Konfiguration
API_URL = "http://localhost:5000/api/sensors/power"  # Neuer Power-Endpunkt
API_TIMEOUT = 10  # Sekunden

# Intervall (in Sekunden)
INTERVAL = 60  # 1 Minute = 60 Sekunden

# Sensor ID (optional, falls mehrere Stromverbrauchssensoren)
SENSOR_ID = "power_sensor_001"

# Funktion: Stromverbrauch auslesen (Beispiel)
def get_power_consumption():
    """
    Hier würdest du deinen Stromzähler auslesen, z.B.:
    - Shelly Plug S
    - Shelly 3EM
    - Tasmota Steckdose
    - Modbus Stromzähler
    - SML Stromzähler
    """
    # Beispiel: Zufallswert (ersetze mit echtem Sensor!)
    return round(random.uniform(300, 800), 0)

# Funktion: Stromverbrauch an API senden
def send_power_to_api(stromverbrauch):
    """
    Sendet Stromverbrauch an die Backend API
    """
    data = {
        "stromverbrauch": stromverbrauch,
        "zeitstempel": datetime.utcnow().isoformat() + "Z",  # Optional
        "sensor_id": SENSOR_ID  # Optional
    }
    
    try:
        response = requests.post(
            API_URL,
            json=data,
            timeout=API_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            status = "erstellt" if response.status_code == 201 else "aktualisiert"
            print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Stromverbrauch {status}")
            print(f"   Strom: {stromverbrauch}W")
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
    print("⚡ Stromverbrauch-Monitoring gestartet (separater Endpunkt)")
    print(f"📡 API URL: {API_URL}")
    print(f"🔖 Sensor ID: {SENSOR_ID}")
    print(f"⏱️  Intervall: {INTERVAL} Sekunden ({INTERVAL/60} Minuten)")
    print("-" * 50)
    
    while True:
        try:
            # Stromverbrauch auslesen
            stromverbrauch = get_power_consumption()
            
            # An API senden
            send_power_to_api(stromverbrauch)
            
            # Warten bis zum nächsten Durchlauf
            time.sleep(INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\n⛔ Stromverbrauch-Monitoring gestoppt")
            break
        except Exception as e:
            print(f"❌ Fehler in Hauptschleife: {e}")
            time.sleep(60)  # Bei Fehler 1 Minute warten

if __name__ == "__main__":
    main()

