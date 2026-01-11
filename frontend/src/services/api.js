// API Base URL - MUSS in .env gesetzt sein!
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Debug: Zeige welche URL genutzt wird
console.log('🔗 API URL:', API_BASE_URL);
console.log('🌍 ENV Check:', import.meta.env);

if (!API_BASE_URL) {
  console.error('❌ VITE_API_URL ist nicht gesetzt! Bitte .env prüfen.');
}

/**
 * Sensor API Service
 * Alle API-Aufrufe für das Sensor Monitoring Dashboard
 */
export const sensorAPI = {
  /**
   * Letzte 24 Stunden Daten abrufen (für Charts)
   * @returns {Promise<Array>} Array mit Messwerten
   */
  async get24HourData() {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/24h`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der 24h Daten:', error);
      throw error;
    }
  },

  /**
   * 24h Durchschnittswerte abrufen
   * @returns {Promise<Object>} Durchschnittswerte für Temp, Luftf., Strom, kWh
   */
  async getAverages() {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/averages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Durchschnittswerte:', error);
      throw error;
    }
  },

  /**
   * Aktuellsten Messwert abrufen
   * @returns {Promise<Object>} Neuester Messwert
   */
  async getLatest() {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/latest`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen des neuesten Werts:', error);
      throw error;
    }
  },

  /**
   * Stündlich gruppierte Daten abrufen
   * @param {number} hours - Anzahl Stunden (default: 24)
   * @returns {Promise<Array>} Array mit stündlichen Durchschnittswerten
   */
  async getHourlyData(hours = 24) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/hourly?hours=${hours}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der stündlichen Daten:', error);
      throw error;
    }
  },

  /**
   * Daten für bestimmten Zeitraum abrufen
   * @param {Date} startDate - Start-Datum
   * @param {Date} endDate - End-Datum
   * @returns {Promise<Array>} Array mit Messwerten im Zeitraum
   */
  async getDataByRange(startDate, endDate) {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await fetch(`${API_BASE_URL}/sensors/range?start=${start}&end=${end}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zeitraum-Daten:', error);
      throw error;
    }
  },

  /**
   * Daten für einen bestimmten Tag abrufen (00:00 - 23:59)
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {Promise<Array>} Array mit Messwerten des Tages
   */
  async getDataByDate(date) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/day?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tages-Daten:', error);
      throw error;
    }
  },

  /**
   * Neuen Messwert erstellen
   * @param {Object} messwert - Messwert Objekt
   * @param {number} messwert.temperatur - Temperatur in °C
   * @param {number} messwert.luftfeuchtigkeit - Luftfeuchtigkeit in %
   * @param {number} messwert.stromverbrauch - Stromverbrauch in Watt
   * @param {Date} messwert.zeitstempel - Optional: Zeitstempel
   * @returns {Promise<Object>} Erstellter Messwert
   */
  async createMesswert(messwert) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messwert),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Messwerts:', error);
      throw error;
    }
  },

  /**
   * Mehrere Messwerte auf einmal erstellen
   * @param {Array} messwerte - Array von Messwert-Objekten
   * @returns {Promise<Array>} Erstellte Messwerte
   */
  async createBulkMesswerte(messwerte) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messwerte }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Messwerte:', error);
      throw error;
    }
  },

  /**
   * Statistiken abrufen
   * @returns {Promise<Object>} Statistiken über alle Daten
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/sensors/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Statistiken:', error);
      throw error;
    }
  },
};

/**
 * Plug Control API Service
 * API-Aufrufe für die Steckdosen-Steuerung
 */
export const plugAPI = {
  /**
   * Kompletten Status abrufen (für Website)
   * @returns {Promise<Object>} Status-Objekt mit desired_state, reported_state, timestamps
   */
  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/plug/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen des Plug-Status:', error);
      throw error;
    }
  },

  /**
   * Gewünschten Status setzen (Steckdose ein/aus)
   * @param {string} state - "on" oder "off"
   * @returns {Promise<Object>} Aktualisierter Status
   */
  async setDesiredState(state) {
    try {
      const response = await fetch(`${API_BASE_URL}/plug/desired`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Setzen des Plug-Status:', error);
      throw error;
    }
  },

  /**
   * Steuerungsmodus setzen (manual/auto)
   * @param {string} mode - "manual" oder "auto"
   * @param {number} temperature_threshold - Optional: Temperaturschwellenwert (5-30°C)
   * @param {number} hysteresis - Optional: Hysterese (0-5°C)
   * @returns {Promise<Object>} Aktualisierter Status
   */
  async setMode(mode, temperature_threshold, hysteresis) {
    try {
      const body = { mode };
      if (temperature_threshold !== undefined) {
        body.temperature_threshold = temperature_threshold;
      }
      if (hysteresis !== undefined) {
        body.hysteresis = hysteresis;
      }
      
      const response = await fetch(`${API_BASE_URL}/plug/mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Setzen des Modus:', error);
      throw error;
    }
  },
};

/**
 * Weather API Service
 * Wetterdaten von Open-Meteo API abrufen
 */
export const weatherAPI = {
  /**
   * Außentemperatur für die letzten 24 Stunden abrufen
   * @param {number} latitude - Breitengrad (default: 52.62 für Celle)
   * @param {number} longitude - Längengrad (default: 10.08 für Celle)
   * @returns {Promise<Array>} Array mit {time: string, temperature: number}
   */
  async get24HourTemperature(latitude = 52.62, longitude = 10.08) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&past_days=1&timezone=Europe/Berlin`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Daten formatieren: Array von {time, temperature}
      if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
        return data.hourly.time.map((time, index) => ({
          time: time,
          temperature: data.hourly.temperature_2m[index]
        }));
      }
      
      throw new Error('Ungültiges Datenformat von Open-Meteo API');
    } catch (error) {
      console.error('Fehler beim Abrufen der Wetterdaten:', error);
      throw error;
    }
  },
};

/**
 * Temperature Cycle API Service
 * API-Aufrufe für Temperatur-Zyklus-Dokumentation
 */
export const temperatureCycleAPI = {
  /**
   * Zyklen abrufen mit Filtern
   * @param {Date|string} startDate - Start-Datum
   * @param {Date|string} endDate - End-Datum
   * @param {string} cycleType - Optional: 'heating' oder 'cooling'
   * @returns {Promise<Array>} Array mit Zyklen
   */
  async getCycles(startDate, endDate, cycleType = null) {
    try {
      const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
      const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
      
      let url = `${API_BASE_URL}/cycles?startDate=${start}&endDate=${end}`;
      if (cycleType) {
        url += `&cycleType=${cycleType}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zyklen:', error);
      throw error;
    }
  },

  /**
   * Tagesstatistiken abrufen
   * @param {Date|string} startDate - Start-Datum
   * @param {Date|string} endDate - End-Datum
   * @returns {Promise<Array>} Array mit Tagesstatistiken
   */
  async getDailyStatistics(startDate, endDate) {
    try {
      const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
      const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
      
      const response = await fetch(`${API_BASE_URL}/cycles/daily?startDate=${start}&endDate=${end}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tagesstatistiken:', error);
      throw error;
    }
  },

  /**
   * Zyklen für einen bestimmten Tag abrufen
   * @param {string} date - Datum im Format YYYY-MM-DD
   * @returns {Promise<Array>} Array mit Zyklen des Tages
   */
  async getCyclesByDate(date) {
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const response = await fetch(`${API_BASE_URL}/cycles/${dateStr}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tageszyklen:', error);
      throw error;
    }
  },
};

export default sensorAPI;

