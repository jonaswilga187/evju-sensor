import PlugControl from '../models/PlugControl.js';
import SensorMesswert from '../models/SensorMesswert.js';

// Status für ESP32 abrufen (ESP32 fragt: "Was soll ich tun?")
export const getDesiredStateForESP = async () => {
  let status = await PlugControl.getStatus();
  
  console.log(`\n🤖 ESP32 fragt Status ab | Modus: ${status.mode.toUpperCase()}`);
  
  // Im Automatik-Modus: Prüfe Temperatur und setze desired_state automatisch
  if (status.mode === 'auto') {
    console.log('🔄 Automatik-Modus aktiv → Prüfe Temperatur...');
    status = await checkAndUpdateAutoMode(status);
  } else {
    console.log('👤 Manueller Modus → Nutze gesetzten Status');
  }
  
  await PlugControl.markFetched();
  
  console.log(`📤 Antwort an ESP32: ${status.desired_state.toUpperCase()}\n`);
  
  return {
    desired_state: status.desired_state,
    last_changed: status.last_changed,
    mode: status.mode
  };
};

// Status für Website abrufen (komplett)
export const getCompleteStatus = async () => {
  return await PlugControl.getStatus();
};

// Gewünschten Status setzen (von Website)
export const setDesiredState = async (state) => {
  if (!['on', 'off'].includes(state)) {
    throw new Error('Status muss "on" oder "off" sein');
  }
  
  return await PlugControl.setDesiredState(state);
};

// Gemeldeten Status aktualisieren (von ESP32)
export const updateReportedState = async (state) => {
  if (!['on', 'off', 'unknown'].includes(state)) {
    throw new Error('Gemeldeter Status muss "on", "off" oder "unknown" sein');
  }
  
  return await PlugControl.updateReportedState(state);
};

// Modus setzen (manual/auto) und optional Schwellenwert + Hysterese
export const setMode = async (mode, temperatureThreshold, hysteresis) => {
  if (!['manual', 'auto'].includes(mode)) {
    throw new Error('Modus muss "manual" oder "auto" sein');
  }
  
  if (temperatureThreshold !== undefined) {
    if (temperatureThreshold < 5 || temperatureThreshold > 30) {
      throw new Error('Temperaturschwellenwert muss zwischen 5°C und 30°C liegen');
    }
  }
  
  if (hysteresis !== undefined) {
    if (hysteresis < 0 || hysteresis > 5) {
      throw new Error('Hysterese muss zwischen 0°C und 5°C liegen');
    }
  }
  
  return await PlugControl.setMode(mode, temperatureThreshold, hysteresis);
};

// Automatik-Logik: Prüft Temperatur und aktualisiert desired_state
const checkAndUpdateAutoMode = async (status) => {
  try {
    console.log('\n🔍 Automatik-Check wird ausgeführt...');
    
    // Hole letzte Temperaturmessung
    const latestSensor = await SensorMesswert.getLatest();
    
    if (!latestSensor || !latestSensor.temperatur) {
      console.log('⚠ Automatik-Modus: Keine Sensordaten verfügbar');
      return status;
    }
    
    const currentTemp = latestSensor.temperatur;
    const threshold = status.temperature_threshold;
    const hysteresis = status.hysteresis || 0.5;
    const currentDesiredState = status.desired_state;
    
    console.log(`📊 Temperatur: ${currentTemp}°C | Schwellenwert: ${threshold}°C | Hysterese: ${hysteresis}°C | Aktuell: ${currentDesiredState.toUpperCase()}`);
    
    // Entscheidungslogik: Temperatur < Schwellenwert → Heizung EIN
    let newDesiredState = status.desired_state;
    
    if (currentTemp < threshold) {
      newDesiredState = 'on';
      console.log(`❄️ Zu kalt! ${currentTemp}°C < ${threshold}°C → Heizung EINSCHALTEN`);
    } else if (currentTemp >= threshold + hysteresis) {
      // Hysterese: X°C über Schwelle → Heizung AUS
      newDesiredState = 'off';
      console.log(`🔥 Warm genug! ${currentTemp}°C >= ${(threshold + hysteresis).toFixed(1)}°C → Heizung AUSSCHALTEN`);
    } else {
      console.log(`⏸️ Hysterese-Bereich (${threshold}°C - ${(threshold + hysteresis).toFixed(1)}°C) → Keine Änderung`);
    }
    
    // Status nur ändern, wenn nötig
    if (newDesiredState !== status.desired_state) {
      console.log(`✅ Status-Änderung: ${currentDesiredState.toUpperCase()} → ${newDesiredState.toUpperCase()}`);
      status = await PlugControl.setDesiredState(newDesiredState);
      status.mode = 'auto';
      status.temperature_threshold = threshold;
    } else {
      console.log(`⏭️ Keine Änderung nötig (bleibt ${currentDesiredState.toUpperCase()})`);
    }
    
    return status;
  } catch (error) {
    console.error('❌ Fehler in Automatik-Logik:', error);
    return status;
  }
};


