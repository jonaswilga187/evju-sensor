import mongoose from 'mongoose';

// Generisches Plug-Control-Modell - unterstützt beliebig viele Steckdosen
// (z.B. "heizung", "entfeuchter"), nicht mehr auf eine einzige Dose hartcodiert.
const plugControlSchema = new mongoose.Schema({
  // Frei wählbare Plug-ID, z.B. "heizung" oder "entfeuchter"
  _id: {
    type: String,
    required: true
  },
  // Anzeigename für Dashboard/Logs
  label: {
    type: String,
    required: true
  },
  // Welcher Messwert steuert den Automatik-Modus dieser Dose?
  control_metric: {
    type: String,
    enum: ['temperature', 'humidity'],
    required: true
  },
  // Reglerrichtung:
  //   'below' -> einschalten, wenn Messwert UNTER threshold faellt (z.B. Heizung)
  //   'above' -> einschalten, wenn Messwert UEBER threshold steigt (z.B. Entfeuchter)
  control_direction: {
    type: String,
    enum: ['below', 'above'],
    required: true
  },
  // Steuerungsmodus
  mode: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  // Schwellenwert fuer Automatik-Modus (Einheit abhaengig von control_metric: °C oder %)
  threshold: {
    type: Number,
    required: true
  },
  // Hysterese (Puffer in derselben Einheit wie threshold)
  hysteresis: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 10
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

// Statische Methode: Status abrufen (erstellt NICHT automatisch - dafuer ist
// jetzt initPlugs() beim Server-Start zustaendig, da wir mehrere Plugs mit
// unterschiedlichen Defaults haben)
plugControlSchema.statics.getStatus = async function(plugId) {
  const status = await this.findById(plugId);
  if (!status) {
    const err = new Error(`Unbekannte Plug-ID: "${plugId}"`);
    err.statusCode = 404;
    throw err;
  }
  return status;
};

// Statische Methode: alle Plugs abrufen (fuer Dashboard-Uebersicht)
plugControlSchema.statics.getAll = async function() {
  return await this.find({}).sort({ _id: 1 });
};

// Legt einen Plug an, falls er noch nicht existiert (idempotent, fuer Seed/Startup)
plugControlSchema.statics.ensureExists = async function(plugId, defaults) {
  const existing = await this.findById(plugId);
  if (existing) {
    return existing;
  }
  return await this.create({ _id: plugId, ...defaults });
};

// Statische Methode: Gewünschten Status setzen (von Website)
plugControlSchema.statics.setDesiredState = async function(plugId, state) {
  return await this.findByIdAndUpdate(
    plugId,
    {
      desired_state: state,
      last_changed: new Date()
    },
    { new: true }
  );
};

// Statische Methode: Status wurde abgerufen (von ESP32)
plugControlSchema.statics.markFetched = async function(plugId) {
  return await this.findByIdAndUpdate(
    plugId,
    { last_fetched: new Date() },
    { new: true }
  );
};

// Statische Methode: Gemeldeten Status aktualisieren (von ESP32)
plugControlSchema.statics.updateReportedState = async function(plugId, state) {
  return await this.findByIdAndUpdate(
    plugId,
    {
      reported_state: state,
      last_reported: new Date()
    },
    { new: true }
  );
};

// Statische Methode: Modus setzen (manual/auto)
plugControlSchema.statics.setMode = async function(plugId, mode, threshold, hysteresis) {
  const update = { mode };

  if (threshold !== undefined) {
    update.threshold = threshold;
  }

  if (hysteresis !== undefined) {
    update.hysteresis = hysteresis;
  }

  return await this.findByIdAndUpdate(plugId, update, { new: true });
};

const PlugControl = mongoose.model('PlugControl', plugControlSchema);

export default PlugControl;
