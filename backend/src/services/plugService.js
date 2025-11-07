import PlugControl from '../models/PlugControl.js';
import SensorMesswert from '../models/SensorMesswert.js';

// Status für ESP32 abrufen (ESP32 fragt: "Was soll ich tun?")
export const getDesiredStateForESP = async () => {
  let status = await PlugControl.getStatus();
  
  // Im Automatik-Modus: Prüfe Temperatur und setze desired_state automatisch
  if (status.mode === 'auto') {
    status = await checkAndUpdateAutoMode(status);
  }
  
  await PlugControl.markFetched();
  
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

// Modus setzen (manual/auto) und optional Schwellenwert
export const setMode = async (mode, temperatureThreshold) => {
  if (!['manual', 'auto'].includes(mode)) {
    throw new Error('Modus muss "manual" oder "auto" sein');
  }
  
  if (temperatureThreshold !== undefined) {
    if (temperatureThreshold < 5 || temperatureThreshold > 30) {
      throw new Error('Temperaturschwellenwert muss zwischen 5°C und 30°C liegen');
    }
  }
  
  return await PlugControl.setMode(mode, temperatureThreshold);
};

// Automatik-Logik: Prüft Temperatur und aktualisiert desired_state
const checkAndUpdateAutoMode = async (status) => {
  try {
    // Hole letzte Temperaturmessung
    const latestSensor = await SensorMesswert.getLatest();
    
    if (!latestSensor || !latestSensor.temperatur) {
      console.log('⚠ Automatik-Modus: Keine Sensordaten verfügbar');
      return status;
    }
    
    const currentTemp = latestSensor.temperatur;
    const threshold = status.temperature_threshold;
    
    // Entscheidungslogik: Temperatur < Schwellenwert → Heizung EIN
    let newDesiredState = status.desired_state;
    
    if (currentTemp < threshold) {
      newDesiredState = 'on';
    } else if (currentTemp >= threshold + 0.5) {
      // Hysterese: 0.5°C über Schwelle → Heizung AUS
      newDesiredState = 'off';
    }
    
    // Status nur ändern, wenn nötig
    if (newDesiredState !== status.desired_state) {
      console.log(`🤖 Automatik: Temp ${currentTemp}°C ${currentTemp < threshold ? '<' : '>='} ${threshold}°C → Heizung ${newDesiredState.toUpperCase()}`);
      status = await PlugControl.setDesiredState(newDesiredState);
      status.mode = 'auto';
      status.temperature_threshold = threshold;
    }
    
    return status;
  } catch (error) {
    console.error('Fehler in Automatik-Logik:', error);
    return status;
  }
};


