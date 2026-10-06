import SensorMesswert from '../models/SensorMesswert.js';
import PlugStateLog from '../models/PlugStateLog.js';

// Ziel-Komfortbereich, gegen den die Verbrauchs-Analyse prüft, ob eine
// Plug-Kombination den Raum tatsächlich in einem brauchbaren Zustand hält
// (nicht nur, welche Kombination am wenigsten Strom zieht - "aus,aus" waere
// sonst immer "am effizientesten").
const TARGET_TEMP_MIN = parseFloat(process.env.TARGET_TEMP_MIN) || 18;
const TARGET_TEMP_MAX = parseFloat(process.env.TARGET_TEMP_MAX) || 22;
const TARGET_HUMIDITY_MIN = parseFloat(process.env.TARGET_HUMIDITY_MIN) || 40;
const TARGET_HUMIDITY_MAX = parseFloat(process.env.TARGET_HUMIDITY_MAX) || 60;

const PLUG_IDS = ['heizung', 'entfeuchter'];

// Exportiert, damit experimentService.js exakt dieselbe Definition von
// "im Zielbereich" für die sensorgesteuerten Experiment-Phasen verwendet -
// zwei leicht unterschiedliche Kopien dieser Prüfung wären eine Fehlerquelle.
export const isInTargetRange = (reading) => {
  const tempOk = reading.temperatur >= TARGET_TEMP_MIN && reading.temperatur <= TARGET_TEMP_MAX;
  const humidityOk = reading.luftfeuchtigkeit >= TARGET_HUMIDITY_MIN && reading.luftfeuchtigkeit <= TARGET_HUMIDITY_MAX;
  return tempOk && humidityOk;
};

export const combinationKey = (states) => PLUG_IDS.map((id) => `${id}:${states[id]}`).join(', ');

/**
 * Rekonstruiert für einen Zeitraum, welche Plug-Kombination (Heizung/Entfeuchter
 * an/aus) zu welchem Sensor-Messwert aktiv war, und aggregiert daraus:
 * - durchschnittlicher Stromverbrauch pro Kombination
 * - Anteil der Zeit, in der die Kombination den Raum im Ziel-Komfortbereich hielt
 *
 * Das ist eine deskriptive Auswertung (kein automatischer Regler) - sie soll
 * beim manuellen Nachjustieren der Schwellenwerte helfen.
 */
export const getConsumptionComparison = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [readings, stateLogs] = await Promise.all([
    SensorMesswert.find({ zeitstempel: { $gte: since } }).sort({ zeitstempel: 1 }).lean(),
    PlugStateLog.find({ timestamp: { $gte: new Date(since.getTime() - 24 * 60 * 60 * 1000) } })
      .sort({ timestamp: 1 })
      .lean()
  ]);

  if (readings.length === 0) {
    return { since, until: new Date(), targetRange: targetRangeInfo(), combinations: [] };
  }

  // Startzustand jedes Plugs zu Beginn des Fensters ermitteln (letzter Log-Eintrag davor)
  const currentState = {};
  for (const plugId of PLUG_IDS) {
    const before = [...stateLogs].reverse().find((l) => l.plug_id === plugId && l.timestamp <= since);
    currentState[plugId] = before ? before.state : 'off';
  }

  // Logs nach Zeitpunkt gruppieren für den Merge-Scan
  const logsByTime = stateLogs
    .filter((l) => l.timestamp >= since)
    .sort((a, b) => a.timestamp - b.timestamp);

  const buckets = {}; // key -> { count, sumStromverbrauch, inRangeCount }
  let logIndex = 0;

  for (const reading of readings) {
    // Alle State-Änderungen bis zu diesem Messwert-Zeitpunkt anwenden
    while (logIndex < logsByTime.length && logsByTime[logIndex].timestamp <= reading.zeitstempel) {
      const log = logsByTime[logIndex];
      currentState[log.plug_id] = log.state;
      logIndex += 1;
    }

    const key = combinationKey(currentState);
    if (!buckets[key]) {
      buckets[key] = { key, count: 0, sumStromverbrauch: 0, inRangeCount: 0 };
    }
    buckets[key].count += 1;
    buckets[key].sumStromverbrauch += reading.stromverbrauch;
    if (isInTargetRange(reading)) {
      buckets[key].inRangeCount += 1;
    }
  }

  const combinations = Object.values(buckets)
    .map((b) => ({
      combination: b.key,
      messwerte_anzahl: b.count,
      durchschnitt_stromverbrauch: Number((b.sumStromverbrauch / b.count).toFixed(3)),
      anteil_im_zielbereich_prozent: Number(((b.inRangeCount / b.count) * 100).toFixed(1))
    }))
    // Sinnvollste zuerst: hoher Komfort-Anteil, dann niedriger Verbrauch
    .sort((a, b) => {
      if (b.anteil_im_zielbereich_prozent !== a.anteil_im_zielbereich_prozent) {
        return b.anteil_im_zielbereich_prozent - a.anteil_im_zielbereich_prozent;
      }
      return a.durchschnitt_stromverbrauch - b.durchschnitt_stromverbrauch;
    });

  return {
    since,
    until: new Date(),
    targetRange: targetRangeInfo(),
    combinations
  };
};

const targetRangeInfo = () => ({
  temperatur: { min: TARGET_TEMP_MIN, max: TARGET_TEMP_MAX },
  luftfeuchtigkeit: { min: TARGET_HUMIDITY_MIN, max: TARGET_HUMIDITY_MAX }
});
