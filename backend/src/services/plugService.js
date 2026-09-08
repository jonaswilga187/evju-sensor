import PlugControl from '../models/PlugControl.js';
import PlugStateLog from '../models/PlugStateLog.js';
import SensorMesswert from '../models/SensorMesswert.js';
import * as temperatureCycleService from './temperatureCycleService.js';

// Bekannte Plug-Definitionen. Neue Steckdosen werden hier eingetragen und
// beim Server-Start automatisch angelegt (siehe initPlugs unten).
// control_direction:
//   'below' -> einschalten wenn Messwert UNTER threshold (z.B. Heizung)
//   'above' -> einschalten wenn Messwert UEBER threshold (z.B. Entfeuchter)
export const PLUG_DEFINITIONS = {
  heizung: {
    label: 'Heizung',
    control_metric: 'temperature',
    control_direction: 'below',
    threshold: 20.0,
    hysteresis: 0.5
  },
  entfeuchter: {
    label: 'Luftentfeuchter',
    control_metric: 'humidity',
    control_direction: 'above',
    threshold: 60,
    hysteresis: 5
  }
};

// In-Memory State für laufende Zyklen, jetzt pro Plug-ID statt global
// { [plugId]: { startTime, startValue, threshold, hysteresis, mode, type: 'heating'|'cooling' } }
const activeCycles = {};

// Legt alle bekannten Plugs an, falls sie noch nicht existieren.
// Wird einmalig beim Server-Start aufgerufen (server.js).
export const initPlugs = async () => {
  // Einmalige Migration: der alte, hartcodierte Single-Plug-Datensatz
  // "shelly_plug_main" (vor der Mehrfach-Plug-Umstellung) wird als Startwert
  // für "heizung" übernommen, statt verwaist in der DB liegen zu bleiben.
  const legacy = await PlugControl.collection.findOne({ _id: 'shelly_plug_main' });

  for (const [plugId, defaults] of Object.entries(PLUG_DEFINITIONS)) {
    const alreadyExists = await PlugControl.findById(plugId);
    if (alreadyExists) continue;

    let initial = { ...defaults };
    if (plugId === 'heizung' && legacy) {
      initial = {
        ...defaults,
        mode: legacy.mode || defaults.mode,
        threshold: legacy.temperature_threshold ?? defaults.threshold,
        hysteresis: legacy.hysteresis ?? defaults.hysteresis,
        desired_state: legacy.desired_state || 'off'
      };
      console.log('♻️  Alten Einzel-Plug-Datensatz ("shelly_plug_main") nach "heizung" übernommen');
    }

    await PlugControl.ensureExists(plugId, initial);
  }

  if (legacy) {
    await PlugControl.collection.deleteOne({ _id: 'shelly_plug_main' });
  }
};

const getMetricValue = (sensorReading, metric) => {
  return metric === 'temperature' ? sensorReading.temperatur : sensorReading.luftfeuchtigkeit;
};

const metricUnit = (metric) => (metric === 'temperature' ? '°C' : '%');

const assertKnownPlug = (plugId) => {
  if (!PLUG_DEFINITIONS[plugId]) {
    const err = new Error(`Unbekannte Plug-ID: "${plugId}". Bekannt: ${Object.keys(PLUG_DEFINITIONS).join(', ')}`);
    err.statusCode = 404;
    throw err;
  }
};

// Alle Plugs abrufen (für Dashboard-Übersicht)
export const getAllStatuses = async () => {
  return await PlugControl.getAll();
};

// Status für ESP32 abrufen (ESP32 fragt: "Was soll ich tun?")
export const getDesiredStateForESP = async (plugId) => {
  assertKnownPlug(plugId);
  let status = await PlugControl.getStatus(plugId);

  console.log(`\n🤖 ESP32 fragt Status ab [${plugId}] | Modus: ${status.mode.toUpperCase()}`);

  if (status.mode === 'auto') {
    status = await checkAndUpdateAutoMode(status);
  }

  await PlugControl.markFetched(plugId);

  console.log(`📤 Antwort an ESP32 [${plugId}]: ${status.desired_state.toUpperCase()}\n`);

  return {
    desired_state: status.desired_state,
    last_changed: status.last_changed,
    mode: status.mode
  };
};

// Status für Website abrufen (komplett, ein Plug)
export const getCompleteStatus = async (plugId) => {
  assertKnownPlug(plugId);
  return await PlugControl.getStatus(plugId);
};

// Gewünschten Status setzen (von Website)
export const setDesiredState = async (plugId, state) => {
  assertKnownPlug(plugId);

  if (!['on', 'off'].includes(state)) {
    throw new Error('Status muss "on" oder "off" sein');
  }

  const oldStatus = await PlugControl.getStatus(plugId);
  const newStatus = await PlugControl.setDesiredState(plugId, state);

  if (oldStatus.desired_state !== state) {
    await logStateChange(plugId, state, 'manual');
    await handleStateChange(plugId, oldStatus.desired_state, state, oldStatus);
  }

  return newStatus;
};

// Gemeldeten Status aktualisieren (von ESP32)
export const updateReportedState = async (plugId, state) => {
  assertKnownPlug(plugId);

  if (!['on', 'off', 'unknown'].includes(state)) {
    throw new Error('Gemeldeter Status muss "on", "off" oder "unknown" sein');
  }

  return await PlugControl.updateReportedState(plugId, state);
};

// Modus setzen (manual/auto) und optional Schwellenwert + Hysterese
export const setMode = async (plugId, mode, threshold, hysteresis) => {
  assertKnownPlug(plugId);

  if (!['manual', 'auto'].includes(mode)) {
    throw new Error('Modus muss "manual" oder "auto" sein');
  }

  const metric = PLUG_DEFINITIONS[plugId].control_metric;
  const limits = metric === 'temperature'
    ? { min: 5, max: 30, label: 'Temperaturschwellenwert', unit: '°C' }
    : { min: 0, max: 100, label: 'Luftfeuchtigkeits-Schwellenwert', unit: '%' };

  if (threshold !== undefined) {
    if (threshold < limits.min || threshold > limits.max) {
      throw new Error(`${limits.label} muss zwischen ${limits.min}${limits.unit} und ${limits.max}${limits.unit} liegen`);
    }
  }

  if (hysteresis !== undefined) {
    if (hysteresis < 0 || hysteresis > 10) {
      throw new Error('Hysterese muss zwischen 0 und 10 liegen');
    }
  }

  return await PlugControl.setMode(plugId, mode, threshold, hysteresis);
};

// Log-Eintrag für Verbrauchsanalyse (siehe analysisService.js)
const logStateChange = async (plugId, state, source) => {
  try {
    await PlugStateLog.create({ plug_id: plugId, state, source, timestamp: new Date() });
  } catch (error) {
    console.error(`❌ Fehler beim Loggen der Zustandsänderung [${plugId}]:`, error);
  }
};

// Automatik-Logik: Prüft den relevanten Messwert (Temperatur ODER Luftfeuchtigkeit,
// je nach control_metric des Plugs) und aktualisiert desired_state entsprechend
// der Reglerrichtung (control_direction).
const checkAndUpdateAutoMode = async (status) => {
  const plugId = status._id;
  const def = PLUG_DEFINITIONS[plugId];

  try {
    const latestSensor = await SensorMesswert.getLatest();

    if (!latestSensor) {
      console.log(`⚠ Automatik-Modus [${plugId}]: Keine Sensordaten verfügbar`);
      return status;
    }

    const currentValue = getMetricValue(latestSensor, def.control_metric);
    if (currentValue === undefined || currentValue === null) {
      console.log(`⚠ Automatik-Modus [${plugId}]: Messwert für "${def.control_metric}" fehlt`);
      return status;
    }

    const threshold = status.threshold;
    const hysteresis = status.hysteresis || 0.5;
    const unit = metricUnit(def.control_metric);
    const currentDesiredState = status.desired_state;

    console.log(`📊 [${plugId}] ${def.control_metric}: ${currentValue}${unit} | Schwelle: ${threshold}${unit} | Hysterese: ${hysteresis}${unit} | Aktuell: ${currentDesiredState.toUpperCase()}`);

    let newDesiredState = status.desired_state;

    if (def.control_direction === 'below') {
      // z.B. Heizung: einschalten wenn zu kalt, ausschalten wenn warm genug
      if (currentValue < threshold) {
        newDesiredState = 'on';
      } else if (currentValue >= threshold + hysteresis) {
        newDesiredState = 'off';
      }
    } else {
      // 'above', z.B. Entfeuchter: einschalten wenn zu feucht, ausschalten wenn trocken genug
      if (currentValue > threshold) {
        newDesiredState = 'on';
      } else if (currentValue <= threshold - hysteresis) {
        newDesiredState = 'off';
      }
    }

    if (newDesiredState !== status.desired_state) {
      console.log(`✅ [${plugId}] Status-Änderung: ${currentDesiredState.toUpperCase()} → ${newDesiredState.toUpperCase()}`);
      const oldState = status.desired_state;
      status = await PlugControl.setDesiredState(plugId, newDesiredState);
      status.mode = 'auto';

      await logStateChange(plugId, newDesiredState, 'auto');
      await handleStateChange(plugId, oldState, newDesiredState, status, currentValue);
    } else {
      await checkActiveCycles(plugId, status, currentValue);
    }

    return status;
  } catch (error) {
    console.error(`❌ Fehler in Automatik-Logik [${plugId}]:`, error);
    return status;
  }
};

// Zyklus-Erkennung: Status-Änderung verarbeiten (generisch pro Plug)
const handleStateChange = async (plugId, oldState, newState, status, currentValue = null) => {
  try {
    const def = PLUG_DEFINITIONS[plugId];

    if (currentValue === null) {
      const latestSensor = await SensorMesswert.getLatest();
      currentValue = latestSensor ? getMetricValue(latestSensor, def.control_metric) : null;
    }

    if (currentValue === null || currentValue === undefined) {
      console.log(`⚠️ [${plugId}] Keine Messdaten für Zyklus-Erkennung verfügbar`);
      return;
    }

    const threshold = status.threshold;
    const hysteresis = status.hysteresis || 0.5;
    const now = new Date();

    if (!activeCycles[plugId]) {
      activeCycles[plugId] = { heating: null, cooling: null };
    }
    const cycles = activeCycles[plugId];

    // 'off' -> 'on': Wirk-Zyklus startet (Heizen bzw. Entfeuchten)
    if (oldState === 'off' && newState === 'on') {
      if (cycles.cooling) {
        cycles.cooling = null;
      }

      cycles.heating = {
        startTime: now,
        startValue: currentValue,
        threshold,
        hysteresis,
        mode: status.mode
      };
      console.log(`🔥 [${plugId}] Wirk-Zyklus gestartet: ${currentValue} → Ziel: ${threshold}`);
    }

    // 'on' -> 'off': Wirk-Zyklus endet, Ruhe-Zyklus startet
    if (oldState === 'on' && newState === 'off') {
      if (cycles.heating) {
        const cycle = cycles.heating;
        const endValue = currentValue;
        const targetValue = def.control_direction === 'below'
          ? cycle.threshold + cycle.hysteresis
          : cycle.threshold - cycle.hysteresis;

        const targetReached = def.control_direction === 'below'
          ? endValue >= targetValue
          : endValue <= targetValue;

        if (targetReached) {
          await temperatureCycleService.saveCycle(
            'heating', cycle.startTime, now, cycle.startValue, targetValue,
            cycle.threshold, cycle.hysteresis, cycle.mode, plugId
          );
        } else {
          console.log(`⚠️ [${plugId}] Zyklus unterbrochen (Ziel nicht erreicht): ${cycle.startValue} → ${endValue}`);
        }
        cycles.heating = null;
      }

      const restStartValue = def.control_direction === 'below'
        ? threshold + hysteresis
        : threshold - hysteresis;

      cycles.cooling = {
        startTime: now,
        startValue: restStartValue,
        threshold,
        hysteresis,
        mode: status.mode
      };
    }
  } catch (error) {
    console.error(`❌ Fehler bei Zyklus-Erkennung [${plugId}]:`, error);
  }
};

// Prüfe ob laufende Zyklen beendet werden können (generisch pro Plug)
const checkActiveCycles = async (plugId, status, currentValue) => {
  try {
    const def = PLUG_DEFINITIONS[plugId];
    const threshold = status.threshold;
    const hysteresis = status.hysteresis || 0.5;
    const now = new Date();

    if (!activeCycles[plugId]) return;
    const cycles = activeCycles[plugId];

    if (cycles.heating) {
      const cycle = cycles.heating;
      const targetValue = def.control_direction === 'below'
        ? cycle.threshold + cycle.hysteresis
        : cycle.threshold - cycle.hysteresis;
      const targetReached = def.control_direction === 'below'
        ? currentValue >= targetValue
        : currentValue <= targetValue;

      if (targetReached) {
        await temperatureCycleService.saveCycle(
          'heating', cycle.startTime, now, cycle.startValue, targetValue,
          cycle.threshold, cycle.hysteresis, cycle.mode, plugId
        );
        cycles.heating = null;
      }
    }

    if (cycles.cooling) {
      const cycle = cycles.cooling;
      const restReached = def.control_direction === 'below'
        ? currentValue <= cycle.threshold
        : currentValue >= cycle.threshold;

      if (restReached) {
        await temperatureCycleService.saveCycle(
          'cooling', cycle.startTime, now, cycle.startValue, currentValue,
          cycle.threshold, cycle.hysteresis, cycle.mode, plugId
        );
        cycles.cooling = null;
      }
    }
  } catch (error) {
    console.error(`❌ Fehler beim Prüfen aktiver Zyklen [${plugId}]:`, error);
  }
};
