import * as sensorService from '../services/sensorService.js';

// GET /api/sensors/latest - Aktuellste Messwerte
export const getLatestData = async (req, res, next) => {
  try {
    const data = await sensorService.getLatestData();
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Keine Daten verfügbar'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sensors/24h - Letzte 24 Stunden
export const get24HourData = async (req, res, next) => {
  try {
    const data = await sensorService.get24HourData();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sensors/averages - 24h Durchschnittswerte
export const get24HourAverages = async (req, res, next) => {
  try {
    const data = await sensorService.get24HourAverages();

    res.status(200).json({
      success: true,
      data: data[0] || {
        temperatur_avg: 0,
        luftfeuchtigkeit_avg: 0,
        stromverbrauch_avg: 0,
        kwh_24h: 0,
        anzahl_messungen: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sensors/hourly - Stündlich gruppierte Daten
export const getHourlyData = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    if (hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        message: 'Hours parameter muss zwischen 1 und 168 liegen'
      });
    }

    const data = await sensorService.getHourlyData(hours);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sensors/range - Daten für Zeitbereich
export const getDataByRange = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start- und End-Datum sind erforderlich'
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat'
      });
    }

    const data = await sensorService.getDataByRange(startDate, endDate);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sensors - Neuen Messwert erstellen
export const createMesswert = async (req, res, next) => {
  try {
    const { temperatur, luftfeuchtigkeit, stromverbrauch, zeitstempel } = req.body;

    // Temperatur und Luftfeuchtigkeit sind Pflicht, Stromverbrauch ist optional
    if (temperatur === undefined || luftfeuchtigkeit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Temperatur und Luftfeuchtigkeit sind erforderlich'
      });
    }

    const messwertData = {
      temperatur,
      luftfeuchtigkeit,
      zeitstempel: zeitstempel ? new Date(zeitstempel) : new Date()
    };

    // Stromverbrauch nur hinzufügen, wenn vorhanden
    if (stromverbrauch !== undefined) {
      messwertData.stromverbrauch = stromverbrauch;
    }

    const data = await sensorService.createMesswert(messwertData);

    res.status(201).json({
      success: true,
      message: 'Messwert erfolgreich erstellt',
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sensors/bulk - Mehrere Messwerte erstellen
export const createBulkMesswerte = async (req, res, next) => {
  try {
    const { messwerte } = req.body;

    if (!Array.isArray(messwerte) || messwerte.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messwerte-Array ist erforderlich'
      });
    }

    const data = await sensorService.createBulkMesswerte(messwerte);

    res.status(201).json({
      success: true,
      message: `${data.length} Messwerte erfolgreich erstellt`,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sensors/stats - Statistiken
export const getStats = async (req, res, next) => {
  try {
    const stats = await sensorService.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sensors/power - Stromverbrauch separat hinzufügen/aktualisieren
export const addPowerConsumption = async (req, res, next) => {
  try {
    const { stromverbrauch, zeitstempel, sensor_id } = req.body;

    if (stromverbrauch === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Stromverbrauch ist erforderlich'
      });
    }

    // Versuche, den aktuellsten Messwert zu aktualisieren oder einen neuen zu erstellen
    const result = await sensorService.updateOrCreatePowerMeasurement({
      stromverbrauch,
      zeitstempel: zeitstempel ? new Date(zeitstempel) : new Date(),
      sensor_id: sensor_id || 'sensor_001'
    });

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created 
        ? 'Stromverbrauch-Messwert erstellt' 
        : 'Stromverbrauch aktualisiert',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};


