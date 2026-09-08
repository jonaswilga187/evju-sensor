import TemperatureCycle from '../models/TemperatureCycle.js';

/**
 * Zyklus speichern
 * @param {string} type - 'heating' oder 'cooling'
 * @param {Date} startTime - Start-Zeitpunkt
 * @param {Date} endTime - End-Zeitpunkt
 * @param {number} startTemperature - Start-Temperatur
 * @param {number} endTemperature - End-Temperatur
 * @param {number} threshold - Schwellenwert
 * @param {number} hysteresis - Hysterese
 * @param {string} mode - 'auto' oder 'manual'
 * @returns {Promise<Object>} Gespeicherter Zyklus
 */
export const saveCycle = async (type, startTime, endTime, startTemperature, endTemperature, threshold, hysteresis, mode, plugId = 'heizung') => {
  try {
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const cycle = await TemperatureCycle.create({
      plug_id: plugId,
      cycle_type: type,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      start_temperature: startTemperature,
      end_temperature: endTemperature,
      threshold: threshold,
      hysteresis: hysteresis,
      mode: mode
    });
    
    console.log(`✅ ${type === 'heating' ? 'Heiz' : 'Abkühl'}zyklus gespeichert: ${durationMinutes} Minuten (${startTemperature}°C → ${endTemperature}°C)`);
    
    return cycle;
  } catch (error) {
    console.error(`❌ Fehler beim Speichern des ${type}-Zyklus:`, error);
    throw error;
  }
};

/**
 * Zyklen abrufen mit Filtern
 * @param {Date} startDate - Start-Datum
 * @param {Date} endDate - End-Datum
 * @param {string} cycleType - Optional: 'heating' oder 'cooling'
 * @returns {Promise<Array>} Array von Zyklen
 */
export const getCycles = async (startDate, endDate, cycleType = null) => {
  try {
    return await TemperatureCycle.getCyclesByDateRange(startDate, endDate, cycleType);
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Zyklen:', error);
    throw error;
  }
};

/**
 * Zyklen für einen bestimmten Tag abrufen
 * @param {string|Date} date - Datum (YYYY-MM-DD oder Date-Objekt)
 * @returns {Promise<Array>} Array von Zyklen
 */
export const getCyclesByDate = async (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return await TemperatureCycle.getCyclesByDay(dateObj);
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Tageszyklen:', error);
    throw error;
  }
};

/**
 * Tagesstatistiken abrufen
 * @param {Date} startDate - Start-Datum
 * @param {Date} endDate - End-Datum
 * @returns {Promise<Array>} Array mit Tagesstatistiken
 */
export const getDailyAverages = async (startDate, endDate) => {
  try {
    return await TemperatureCycle.getDailyStatistics(startDate, endDate);
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Tagesstatistiken:', error);
    throw error;
  }
};

