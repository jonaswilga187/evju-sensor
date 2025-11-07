import mongoose from 'mongoose';

const plugControlSchema = new mongoose.Schema({
  // Es gibt immer nur einen Eintrag mit dieser ID
  _id: {
    type: String,
    default: 'shelly_plug_main'
  },
  // Steuerungsmodus
  mode: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  // Temperaturschwellenwert für Automatik-Modus (in °C)
  temperature_threshold: {
    type: Number,
    default: 20.0,
    min: 5,
    max: 30
  },
  // Hysterese (Temperatur-Puffer in °C)
  hysteresis: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 5
  },
  // Gewünschter Status (von Website gesetzt, von ESP32 abgerufen)
  desired_state: {
    type: String,
    enum: ['on', 'off'],
    required: true,
    default: 'off'
  },
  // Aktueller gemeldeter Status (vom ESP32 gemeldet)
  reported_state: {
    type: String,
    enum: ['on', 'off', 'unknown'],
    default: 'unknown'
  },
  // Letzter Abruf durch ESP32
  last_fetched: {
    type: Date,
    default: null
  },
  // Letzte Änderung des desired_state
  last_changed: {
    type: Date,
    default: Date.now
  },
  // Letzte Status-Meldung vom ESP32
  last_reported: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'plug_control'
});

// Statische Methode: Status abrufen (erstellt automatisch wenn nicht vorhanden)
plugControlSchema.statics.getStatus = async function() {
  let status = await this.findById('shelly_plug_main');
  
  if (!status) {
    // Erstelle initialen Status
    status = await this.create({
      _id: 'shelly_plug_main',
      mode: 'manual',
      temperature_threshold: 20.0,
      hysteresis: 0.5,
      desired_state: 'off',
      reported_state: 'unknown'
    });
  }
  
  return status;
};

// Statische Methode: Gewünschten Status setzen (von Website)
plugControlSchema.statics.setDesiredState = async function(state) {
  return await this.findByIdAndUpdate(
    'shelly_plug_main',
    {
      desired_state: state,
      last_changed: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

// Statische Methode: Status wurde abgerufen (von ESP32)
plugControlSchema.statics.markFetched = async function() {
  return await this.findByIdAndUpdate(
    'shelly_plug_main',
    {
      last_fetched: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

// Statische Methode: Gemeldeten Status aktualisieren (von ESP32)
plugControlSchema.statics.updateReportedState = async function(state) {
  return await this.findByIdAndUpdate(
    'shelly_plug_main',
    {
      reported_state: state,
      last_reported: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

// Statische Methode: Modus setzen (manual/auto)
plugControlSchema.statics.setMode = async function(mode, threshold, hysteresis) {
  const update = {
    mode: mode
  };
  
  if (threshold !== undefined) {
    update.temperature_threshold = threshold;
  }
  
  if (hysteresis !== undefined) {
    update.hysteresis = hysteresis;
  }
  
  return await this.findByIdAndUpdate(
    'shelly_plug_main',
    update,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

const PlugControl = mongoose.model('PlugControl', plugControlSchema);

export default PlugControl;


