import SensorMesswert from '../models/SensorMesswert.js';

// Aktuellsten Messwert abrufen
export const getLatestData = async () => {
  return await SensorMesswert.getLatest();
};

// Letzte 24 Stunden abrufen
export const get24HourData = async () => {
  return await SensorMesswert.getLast24Hours();
};

// 24h Durchschnittswerte berechnen
export const get24HourAverages = async () => {
  return await SensorMesswert.get24HourAverages();
};

// Stündlich gruppierte Daten
export const getHourlyData = async (hours = 24) => {
  return await SensorMesswert.getHourlyData(hours);
};

// Daten für bestimmten Zeitbereich
export const getDataByRange = async (startDate, endDate) => {
  return await SensorMesswert.find({
    zeitstempel: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .select('zeitstempel temperatur luftfeuchtigkeit stromverbrauch -_id')
  .sort({ zeitstempel: 1 })
  .lean();
};

// Neuen Messwert erstellen
export const createMesswert = async (messwertData) => {
  const messwert = new SensorMesswert(messwertData);
  return await messwert.save();
};

// Mehrere Messwerte erstellen
export const createBulkMesswerte = async (messwerte) => {
  return await SensorMesswert.insertMany(messwerte);
};

// Statistiken abrufen
export const getStats = async () => {
  const [latest, averages, total] = await Promise.all([
    SensorMesswert.getLatest(),
    SensorMesswert.get24HourAverages(),
    SensorMesswert.countDocuments()
  ]);

  return {
    latest,
    averages_24h: averages[0] || null,
    total_messwerte: total
  };
};

// Daten für einen kompletten Tag abrufen (00:00 - 23:59)
export const getDataByDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await SensorMesswert.find({
    zeitstempel: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })
  .select('zeitstempel temperatur luftfeuchtigkeit stromverbrauch -_id')
  .sort({ zeitstempel: 1 })
  .lean();
};


