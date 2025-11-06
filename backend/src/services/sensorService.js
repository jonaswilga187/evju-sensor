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

// Stromverbrauch separat hinzufügen oder aktualisieren
export const updateOrCreatePowerMeasurement = async ({ stromverbrauch, zeitstempel, sensor_id }) => {
  // Zeitfenster: 5 Minuten vor und nach dem Zeitstempel
  const timeWindow = 5 * 60 * 1000; // 5 Minuten in Millisekunden
  const startTime = new Date(zeitstempel.getTime() - timeWindow);
  const endTime = new Date(zeitstempel.getTime() + timeWindow);

  // Suche nach einem passenden Messwert im Zeitfenster
  const existingMesswert = await SensorMesswert.findOne({
    zeitstempel: {
      $gte: startTime,
      $lte: endTime
    },
    'meta.sensor_id': sensor_id
  }).sort({ zeitstempel: -1 });

  if (existingMesswert) {
    // Aktualisiere bestehenden Messwert
    existingMesswert.stromverbrauch = stromverbrauch;
    const updated = await existingMesswert.save();
    return {
      created: false,
      data: updated
    };
  } else {
    // Erstelle neuen Messwert nur mit Stromverbrauch
    const newMesswert = new SensorMesswert({
      zeitstempel,
      stromverbrauch,
      temperatur: null,
      luftfeuchtigkeit: null,
      meta: {
        sensor_id
      }
    });
    const saved = await newMesswert.save();
    return {
      created: true,
      data: saved
    };
  }
};


