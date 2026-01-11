import PlugControl from '../models/PlugControl.js';
import SensorMesswert from '../models/SensorMesswert.js';
import * as temperatureCycleService from './temperatureCycleService.js';

// In-Memory State für laufende Zyklen
const activeCycles = {
  heating: null,  // { startTime, startTemperature, threshold, hysteresis, mode }
  cooling: null   // { startTime, startTemperature, threshold, hysteresis, mode }
};

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
  
  const oldStatus = await PlugControl.getStatus();
  const newStatus = await PlugControl.setDesiredState(state);
  
  // Zyklus-Erkennung bei manueller Status-Änderung
  if (oldStatus.desired_state !== state) {
    await handleStateChange(oldStatus.desired_state, state, oldStatus);
  }
  
  return newStatus;
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
      const oldState = status.desired_state;
      status = await PlugControl.setDesiredState(newDesiredState);
      status.mode = 'auto';
      status.temperature_threshold = threshold;
      
      // Zyklus-Erkennung bei Status-Änderung
      await handleStateChange(oldState, newDesiredState, status, currentTemp);
    } else {
      console.log(`⏭️ Keine Änderung nötig (bleibt ${currentDesiredState.toUpperCase()})`);
      
      // Prüfe ob laufender Zyklus beendet werden kann
      await checkActiveCycles(status, currentTemp);
    }
    
    return status;
  } catch (error) {
    console.error('❌ Fehler in Automatik-Logik:', error);
    return status;
  }
};

// Zyklus-Erkennung: Status-Änderung verarbeiten
const handleStateChange = async (oldState, newState, status, currentTemp = null) => {
  try {
    // Hole aktuelle Temperatur falls nicht übergeben
    if (currentTemp === null) {
      const latestSensor = await SensorMesswert.getLatest();
      currentTemp = latestSensor?.temperatur || null;
    }
    
    if (currentTemp === null) {
      console.log('⚠️ Keine Temperaturdaten für Zyklus-Erkennung verfügbar');
      return;
    }
    
    const threshold = status.temperature_threshold;
    const hysteresis = status.hysteresis || 0.5;
    const now = new Date();
    
    // Heizzyklus starten: 'off' → 'on'
    if (oldState === 'off' && newState === 'on') {
      // Beende eventuell laufenden Abkühlzyklus (sollte nicht passieren, aber sicherheitshalber)
      if (activeCycles.cooling) {
        console.log('⚠️ Abkühlzyklus wurde durch Heizzyklus-Start unterbrochen');
        activeCycles.cooling = null;
      }
      
      activeCycles.heating = {
        startTime: now,
        startTemperature: currentTemp,
        threshold: threshold,
        hysteresis: hysteresis,
        mode: status.mode
      };
      console.log(`🔥 Heizzyklus gestartet: ${currentTemp}°C → Ziel: ${threshold}°C`);
    }
    
    // Abkühlzyklus starten: 'on' → 'off'
    if (oldState === 'on' && newState === 'off') {
      // Beende eventuell laufenden Heizzyklus
      if (activeCycles.heating) {
        const cycle = activeCycles.heating;
        const endTemp = currentTemp;
        
        // Prüfe ob Zieltemperatur erreicht wurde
        if (endTemp >= cycle.threshold) {
          await temperatureCycleService.saveCycle(
            'heating',
            cycle.startTime,
            now,
            cycle.startTemperature,
            endTemp,
            cycle.threshold,
            cycle.hysteresis,
            cycle.mode
          );
          console.log(`✅ Heizzyklus abgeschlossen: ${cycle.startTemperature}°C → ${endTemp}°C`);
        } else {
          console.log(`⚠️ Heizzyklus unterbrochen (Ziel nicht erreicht): ${cycle.startTemperature}°C → ${endTemp}°C`);
        }
        activeCycles.heating = null;
      }
      
      // Start-Temperatur für Abkühlzyklus ist threshold + hysteresis (wo die Heizung ausgeschaltet wurde)
      const coolingStartTemp = threshold + hysteresis;
      activeCycles.cooling = {
        startTime: now,
        startTemperature: coolingStartTemp,
        threshold: threshold,
        hysteresis: hysteresis,
        mode: status.mode
      };
      console.log(`❄️ Abkühlzyklus gestartet: ${coolingStartTemp}°C → Ziel: ${threshold}°C`);
    }
  } catch (error) {
    console.error('❌ Fehler bei Zyklus-Erkennung:', error);
  }
};

// Prüfe ob laufende Zyklen beendet werden können
const checkActiveCycles = async (status, currentTemp) => {
  try {
    const threshold = status.temperature_threshold;
    const hysteresis = status.hysteresis || 0.5;
    const now = new Date();
    
    // Prüfe Heizzyklus
    if (activeCycles.heating) {
      const cycle = activeCycles.heating;
      
      // Heizzyklus ist beendet wenn Temperatur >= threshold
      if (currentTemp >= cycle.threshold) {
        await temperatureCycleService.saveCycle(
          'heating',
          cycle.startTime,
          now,
          cycle.startTemperature,
          currentTemp,
          cycle.threshold,
          cycle.hysteresis,
          cycle.mode
        );
        console.log(`✅ Heizzyklus abgeschlossen: ${cycle.startTemperature}°C → ${currentTemp}°C`);
        activeCycles.heating = null;
      }
    }
    
    // Prüfe Abkühlzyklus
    if (activeCycles.cooling) {
      const cycle = activeCycles.cooling;
      
      // Abkühlzyklus ist beendet wenn Temperatur <= threshold
      if (currentTemp <= cycle.threshold) {
        await temperatureCycleService.saveCycle(
          'cooling',
          cycle.startTime,
          now,
          cycle.startTemperature,
          currentTemp,
          cycle.threshold,
          cycle.hysteresis,
          cycle.mode
        );
        console.log(`✅ Abkühlzyklus abgeschlossen: ${cycle.startTemperature}°C → ${currentTemp}°C`);
        activeCycles.cooling = null;
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Prüfen aktiver Zyklen:', error);
  }
};


