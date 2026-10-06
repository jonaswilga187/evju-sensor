// API Base URL - MUSS in .env gesetzt sein!
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Debug: Zeige welche URL genutzt wird
console.log('🔗 API URL:', API_BASE_URL);
console.log('🌍 ENV Check:', import.meta.env);

if (!API_BASE_URL) {
  console.error('❌ VITE_API_URL ist nicht gesetzt! Bitte .env prüfen.');
}

// API-Key für geschützte Endpunkte (Heizungssteuerung)
// Wird lokal im Browser gespeichert, damit man ihn nicht bei jeder Aktion neu eingeben muss.
const API_KEY_STORAGE_KEY = 'sensor_dashboard_api_key';

export const getApiKey = () => localStorage.getItem(API_KEY_STORAGE_KEY) || '';
export const setApiKey = (key) => localStorage.setItem(API_KEY_STORAGE_KEY, key);

/**
 * fetch-Wrapper, der bei jedem Request das Session-Cookie mitschickt
 * (credentials: 'include'). Ohne das würde der Browser das Login-Cookie bei
 * Cross-Origin-Requests (Frontend- und Backend-Domain unterscheiden sich)
 * nicht automatisch senden, und jeder Request landete bei requireSession.
 */
async function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: 'include' });
}

/**
 * Führt einen Request mit API-Key-Header aus (zusätzlich zur Session - der
 * API-Key schützt gezielt die Heizungssteuerung, die Session das Dashboard
 * insgesamt). Schlägt der Request mit 401 fehl (fehlender/falscher Key),
 * wird der Nutzer einmalig zur Eingabe aufgefordert und der Request wiederholt.
 */
async function authorizedFetch(url, options = {}) {
  const doFetch = () =>
    apiFetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-API-Key': getApiKey(),
      },
    });

  let response = await doFetch();

  if (response.status === 401) {
    const key = window.prompt('API-Key erforderlich, um die Heizung zu steuern:');
    if (key) {
      setApiKey(key);
      response = await doFetch();
    }
  }

  return response;
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/24h`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/averages`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/latest`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/hourly?hours=${hours}`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/range?start=${start}&end=${end}`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/day?date=${date}`);
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
      const response = await apiFetch(`${API_BASE_URL}/sensors`, {
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
      const response = await apiFetch(`${API_BASE_URL}/sensors/bulk`, {
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
   * Tages-Durchschnitte für den Langzeitverlauf abrufen (über die 30-Tage-
   * Aufbewahrung der Rohdaten hinaus, siehe backend/dataRetentionService.js)
   * @param {number} days - Zeitraum in Tagen (default: 90)
   * @returns {Promise<Array>} Array mit Tages-Durchschnitten
   */
  async getDailySummaries(days = 90) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/sensors/daily-summary?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tages-Durchschnitte:', error);
      throw error;
    }
  },

  /**
   * Statistiken abrufen
   * @returns {Promise<Object>} Statistiken über alle Daten
   */
  async getStats() {
    try {
      const response = await apiFetch(`${API_BASE_URL}/sensors/stats`);
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
 * API-Aufrufe für die Steckdosen-Steuerung. Unterstützt mehrere Plugs
 * (z.B. "heizung", "entfeuchter") über die plugId.
 */
export const plugAPI = {
  /**
   * Übersicht aller Plugs abrufen
   * @returns {Promise<Array>} Array aller Plug-Status-Objekte
   */
  async getAll() {
    try {
      const response = await apiFetch(`${API_BASE_URL}/plug`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Plugs:', error);
      throw error;
    }
  },

  /**
   * Kompletten Status eines Plugs abrufen (für Website)
   * @param {string} plugId - z.B. "heizung" oder "entfeuchter"
   * @returns {Promise<Object>} Status-Objekt mit desired_state, reported_state, timestamps
   */
  async getStatus(plugId) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/plug/${plugId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Plug-Status (${plugId}):`, error);
      throw error;
    }
  },

  /**
   * Gewünschten Status setzen (Steckdose ein/aus)
   * @param {string} plugId - z.B. "heizung" oder "entfeuchter"
   * @param {string} state - "on" oder "off"
   * @returns {Promise<Object>} Aktualisierter Status
   */
  async setDesiredState(plugId, state) {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/plug/${plugId}/desired`, {
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
      console.error(`Fehler beim Setzen des Plug-Status (${plugId}):`, error);
      throw error;
    }
  },

  /**
   * Steuerungsmodus setzen (manual/auto)
   * @param {string} plugId - z.B. "heizung" oder "entfeuchter"
   * @param {string} mode - "manual" oder "auto"
   * @param {number} threshold - Optional: Schwellenwert (°C bei Heizung, % bei Entfeuchter)
   * @param {number} hysteresis - Optional: Hysterese
   * @returns {Promise<Object>} Aktualisierter Status
   */
  async setMode(plugId, mode, threshold, hysteresis) {
    try {
      const body = { mode };
      if (threshold !== undefined) {
        body.threshold = threshold;
      }
      if (hysteresis !== undefined) {
        body.hysteresis = hysteresis;
      }

      const response = await authorizedFetch(`${API_BASE_URL}/plug/${plugId}/mode`, {
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
      console.error(`Fehler beim Setzen des Modus (${plugId}):`, error);
      throw error;
    }
  },
};

/**
 * Analysis API Service
 * Verbrauchsvergleich der Plug-Kombinationen (read-only, keine Steuerung)
 */
export const analysisAPI = {
  /**
   * Verbrauchsvergleich abrufen
   * @param {number} days - Zeitraum in Tagen (default: 30)
   * @returns {Promise<Object>} { since, until, targetRange, combinations }
   */
  async getConsumptionComparison(days = 30) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/analysis/consumption?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Verbrauchsanalyse:', error);
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
      const url = `${API_BASE_URL}/weather/24h?latitude=${latitude}&longitude=${longitude}`;
      const response = await apiFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      // Datenformat aus eigenem Backend erwarten
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      throw new Error('Ungültiges Datenformat von Weather API');
    } catch (error) {
      console.error('Fehler beim Abrufen der Wetterdaten:', error);
      throw error;
    }
  },
};

/**
 * System API Service
 * Health/Status-Endpunkte
 */
export const systemAPI = {
  /**
   * Backend Health prüfen
   * @returns {Promise<Object>} Health-Objekt
   */
  async getHealth() {
    try {
      const response = await apiFetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Fehler beim Abrufen des Backend-Health:', error);
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
      
      const response = await apiFetch(url);
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
      
      const response = await apiFetch(`${API_BASE_URL}/cycles/daily?startDate=${start}&endDate=${end}`);
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
      const response = await apiFetch(`${API_BASE_URL}/cycles/${dateStr}`);
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

/**
 * Experiment API Service
 * Steuert die "Testwoche" - eine automatisch durchlaufende Sequenz fest
 * definierter Heizung/Entfeuchter-Kombinationen, um gezielt Vergleichsdaten
 * für die Verbrauchsanalyse zu erzeugen.
 */
export const experimentAPI = {
  async getStatus() {
    try {
      const response = await apiFetch(`${API_BASE_URL}/experiment/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen des Experiment-Status:', error);
      throw error;
    }
  },

  async start() {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/experiment/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Starten des Experiments:', error);
      throw error;
    }
  },

  async stop() {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/experiment/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Stoppen des Experiments:', error);
      throw error;
    }
  },

  /**
   * Protokollierte "reach_target"-Phasen abrufen (Dauer bis Zielbereich
   * erreicht + Energieverbrauch pro Kombination), neueste zuerst.
   */
  async getResults(limit = 20) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/experiment/results?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Experiment-Ergebnisse:', error);
      throw error;
    }
  },
};

/**
 * Device Config API Service
 * Fernkonfiguration für den ESP32 (aktuell nur WLAN-Zugangsdaten). Der ESP32
 * holt sich neue Werte selbst per Poll ab (siehe docs/05-PLUG-CONTROL.md),
 * hier wird nur die gewünschte Konfiguration hinterlegt und der zuletzt vom
 * Gerät bestätigte Stand angezeigt.
 */
export const deviceAPI = {
  async getConfigStatus(deviceId) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/device/${deviceId}/config/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Config-Status (${deviceId}):`, error);
      throw error;
    }
  },

  async setWifiConfig(deviceId, wifiSsid, wifiPassword) {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/device/${deviceId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wifi_ssid: wifiSsid, wifi_password: wifiPassword }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || `HTTP error! status: ${response.status}`);
      }
      return body.data;
    } catch (error) {
      console.error(`Fehler beim Setzen der WLAN-Config (${deviceId}):`, error);
      throw error;
    }
  },
};

/**
 * Auth API Service
 * Login/Logout für das Dashboard (ersetzt den bisherigen nginx Basic-Auth-
 * Dialog durch eine serverseitig geprüfte Session, siehe requireSession.js).
 * Das Session-Cookie wird vom Browser verwaltet - hier nur die Requests dazu.
 */
export const authAPI = {
  /**
   * @returns {Promise<boolean>} true, wenn eine gültige Session besteht
   */
  async checkSession() {
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/me`);
      return response.ok;
    } catch (error) {
      console.error('Fehler beim Prüfen der Session:', error);
      return false;
    }
  },

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>} wirft bei falschen Zugangsdaten oder Serverfehler
   */
  async login(username, password) {
    const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || 'Login fehlgeschlagen');
    }
  },

  async logout() {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  },
};

export default sensorAPI;

