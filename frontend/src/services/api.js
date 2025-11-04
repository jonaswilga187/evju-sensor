// API Base URL - aus Umgebungsvariablen oder Standard
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export default sensorAPI;

