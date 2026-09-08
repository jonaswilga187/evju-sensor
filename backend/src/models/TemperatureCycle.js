import mongoose from 'mongoose';

const temperatureCycleSchema = new mongoose.Schema({
  // Welcher Plug hat diesen Zyklus ausgeloest (z.B. "heizung", "entfeuchter").
  // Optional gehalten, damit alte Datensaetze ohne dieses Feld gueltig bleiben.
  plug_id: {
    type: String,
    default: 'heizung',
    index: true
  },
  cycle_type: {
    type: String,
    enum: ['heating', 'cooling'],
    required: [true, 'Zyklus-Typ ist erforderlich'],
    index: true
  },
  start_time: {
    type: Date,
    required: [true, 'Start-Zeit ist erforderlich'],
    index: true
  },
  end_time: {
    type: Date,
    required: [true, 'End-Zeit ist erforderlich']
  },
  duration_minutes: {
    type: Number,
    required: [true, 'Dauer ist erforderlich'],
    min: [0, 'Dauer muss positiv sein']
  },
  start_temperature: {
    type: Number,
    required: [true, 'Start-Temperatur ist erforderlich'],
    min: [-50, 'Temperatur muss mindestens -50°C sein'],
    max: [100, 'Temperatur darf maximal 100°C sein']
  },
  end_temperature: {
    type: Number,
    required: [true, 'End-Temperatur ist erforderlich'],
    min: [-50, 'Temperatur muss mindestens -50°C sein'],
    max: [100, 'Temperatur darf maximal 100°C sein']
  },
  threshold: {
    type: Number,
    required: [true, 'Schwellenwert ist erforderlich'],
    min: [5, 'Schwellenwert muss mindestens 5°C sein'],
    max: [30, 'Schwellenwert darf maximal 30°C sein']
  },
  hysteresis: {
    type: Number,
    required: [true, 'Hysterese ist erforderlich'],
    min: [0, 'Hysterese muss mindestens 0°C sein'],
    max: [5, 'Hysterese darf maximal 5°C sein']
  },
  mode: {
    type: String,
    enum: ['auto', 'manual'],
    required: [true, 'Modus ist erforderlich']
  }
}, {
  timestamps: true, // createdAt, updatedAt
  collection: 'temperature_cycles'
});

// Indizes für schnelle Abfragen
temperatureCycleSchema.index({ start_time: -1, cycle_type: 1 });
temperatureCycleSchema.index({ cycle_type: 1, start_time: -1 });

// TTL Index - Daten älter als 90 Tage automatisch löschen (7776000 Sekunden)
temperatureCycleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Statische Methode: Zyklen nach Datumsbereich abrufen
temperatureCycleSchema.statics.getCyclesByDateRange = function(startDate, endDate, cycleType = null) {
  const query = {
    start_time: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (cycleType) {
    query.cycle_type = cycleType;
  }
  
  return this.find(query)
    .sort({ start_time: -1 })
    .lean();
};

// Statische Methode: Zyklen für einen bestimmten Tag abrufen
temperatureCycleSchema.statics.getCyclesByDay = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    start_time: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })
    .sort({ start_time: 1 })
    .lean();
};

// Statische Methode: Tagesstatistiken berechnen
temperatureCycleSchema.statics.getDailyStatistics = function(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        start_time: {
          $gte: start,
          $lte: end
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$start_time',
            timezone: 'Europe/Berlin'
          }
        },
        date: { $first: '$start_time' },
        heating_cycles: {
          $sum: { $cond: [{ $eq: ['$cycle_type', 'heating'] }, 1, 0] }
        },
        cooling_cycles: {
          $sum: { $cond: [{ $eq: ['$cycle_type', 'cooling'] }, 1, 0] }
        },
        avg_heating_duration: {
          $avg: {
            $cond: [
              { $eq: ['$cycle_type', 'heating'] },
              '$duration_minutes',
              null
            ]
          }
        },
        avg_cooling_duration: {
          $avg: {
            $cond: [
              { $eq: ['$cycle_type', 'cooling'] },
              '$duration_minutes',
              null
            ]
          }
        },
        min_heating_duration: {
          $min: {
            $cond: [
              { $eq: ['$cycle_type', 'heating'] },
              '$duration_minutes',
              null
            ]
          }
        },
        max_heating_duration: {
          $max: {
            $cond: [
              { $eq: ['$cycle_type', 'heating'] },
              '$duration_minutes',
              null
            ]
          }
        },
        min_cooling_duration: {
          $min: {
            $cond: [
              { $eq: ['$cycle_type', 'cooling'] },
              '$duration_minutes',
              null
            ]
          }
        },
        max_cooling_duration: {
          $max: {
            $cond: [
              { $eq: ['$cycle_type', 'cooling'] },
              '$duration_minutes',
              null
            ]
          }
        }
      }
    },
    {
      $sort: { date: -1 }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total_cycles: { $add: ['$heating_cycles', '$cooling_cycles'] },
        heating_cycles: 1,
        cooling_cycles: 1,
        avg_heating_duration: { $round: ['$avg_heating_duration', 1] },
        avg_cooling_duration: { $round: ['$avg_cooling_duration', 1] },
        min_heating_duration: 1,
        max_heating_duration: 1,
        min_cooling_duration: 1,
        max_cooling_duration: 1
      }
    }
  ]);
};

const TemperatureCycle = mongoose.model('TemperatureCycle', temperatureCycleSchema);

export default TemperatureCycle;

