import mongoose from 'mongoose';

const messwertSchema = new mongoose.Schema({
  zeitstempel: {
    type: Date,
    required: [true, 'Zeitstempel ist erforderlich'],
    index: true
  },
  temperatur: {
    type: Number,
    required: [true, 'Temperatur ist erforderlich'],
    min: [-50, 'Temperatur muss mindestens -50°C sein'],
    max: [100, 'Temperatur darf maximal 100°C sein']
  },
  luftfeuchtigkeit: {
    type: Number,
    required: [true, 'Luftfeuchtigkeit ist erforderlich'],
    min: [0, 'Luftfeuchtigkeit muss mindestens 0% sein'],
    max: [100, 'Luftfeuchtigkeit darf maximal 100% sein']
  },
  stromverbrauch: {
    type: Number,
    required: [true, 'Stromverbrauch ist erforderlich'],
    min: [0, 'Stromverbrauch muss positiv sein']
  },
  meta: {
    standort: {
      type: String,
      default: 'Standard'
    },
    sensor_id: {
      type: String,
      default: 'sensor_001'
    }
  }
}, {
  timestamps: true, // createdAt, updatedAt
  collection: 'sensor_messwerte'
});

// Compound Index für Zeitbereichsabfragen
messwertSchema.index({ zeitstempel: -1, 'meta.sensor_id': 1 });

// TTL Index - Daten älter als 30 Tage automatisch löschen
messwertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Statische Methode: Letzte 24 Stunden abrufen
messwertSchema.statics.getLast24Hours = function() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    zeitstempel: { $gte: last24h }
  })
  .select('zeitstempel temperatur luftfeuchtigkeit stromverbrauch -_id')
  .sort({ zeitstempel: 1 })
  .lean();
};

// Statische Methode: 24h Durchschnittswerte berechnen
messwertSchema.statics.get24HourAverages = function() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        zeitstempel: { $gte: last24h }
      }
    },
    {
      $group: {
        _id: null,
        temp_avg: { $avg: '$temperatur' },
        luft_avg: { $avg: '$luftfeuchtigkeit' },
        strom_avg: { $avg: '$stromverbrauch' },
        anzahl: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        temperatur_avg: { $round: ['$temp_avg', 1] },
        luftfeuchtigkeit_avg: { $round: ['$luft_avg', 0] },
        stromverbrauch_avg: { $round: ['$strom_avg', 0] },
        kwh_24h: {
          $round: [
            { $divide: [{ $multiply: ['$strom_avg', 24] }, 1000] },
            2
          ]
        },
        anzahl_messungen: '$anzahl'
      }
    }
  ]);
};

// Statische Methode: Daten gruppiert nach Stunden
messwertSchema.statics.getHourlyData = function(hours = 24) {
  const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        zeitstempel: { $gte: timeAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%H:00',
            date: '$zeitstempel',
            timezone: 'Europe/Berlin'
          }
        },
        zeitstempel: { $first: '$zeitstempel' },
        temperatur: { $avg: '$temperatur' },
        luftfeuchtigkeit: { $avg: '$luftfeuchtigkeit' },
        stromverbrauch: { $avg: '$stromverbrauch' }
      }
    },
    {
      $sort: { zeitstempel: 1 }
    },
    {
      $project: {
        _id: 0,
        zeit: '$_id',
        temperatur: { $round: ['$temperatur', 1] },
        luftfeuchtigkeit: { $round: ['$luftfeuchtigkeit', 0] },
        stromverbrauch: { $round: ['$stromverbrauch', 0] }
      }
    }
  ]);
};

// Statische Methode: Aktuellsten Wert abrufen
messwertSchema.statics.getLatest = function() {
  return this.findOne()
    .sort({ zeitstempel: -1 })
    .select('zeitstempel temperatur luftfeuchtigkeit stromverbrauch -_id')
    .lean();
};

const SensorMesswert = mongoose.model('SensorMesswert', messwertSchema);

export default SensorMesswert;

