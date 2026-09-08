import mongoose from 'mongoose';

// Protokolliert jede tatsaechliche Zustandsaenderung eines Plugs (an/aus).
// Grundlage fuer die Verbrauchs-Analyse: durch Abgleich der Zeitstempel mit
// den Sensor-Messwerten (stromverbrauch) laesst sich rekonstruieren, welche
// Plug-Kombination zu welchem Zeitpunkt aktiv war und wie viel das gekostet hat.
const plugStateLogSchema = new mongoose.Schema({
  plug_id: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    enum: ['on', 'off'],
    required: true
  },
  source: {
    type: String,
    enum: ['manual', 'auto', 'experiment'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'plug_state_log'
});

plugStateLogSchema.index({ timestamp: -1 });

// TTL: Rohdaten nach 180 Tagen aufräumen (Analyse aggregiert vorher)
// Deckt gleichzeitig den aufsteigenden Index auf "timestamp" ab.
plugStateLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 15552000 });

// Aktuellsten Log-Eintrag pro Plug VOR einem gegebenen Zeitpunkt holen -
// wird fuer die Kombinations-Rekonstruktion in der Verbrauchsanalyse gebraucht.
plugStateLogSchema.statics.getStateAt = async function(plugId, timestamp) {
  const entry = await this.findOne({
    plug_id: plugId,
    timestamp: { $lte: timestamp }
  }).sort({ timestamp: -1 }).lean();

  return entry ? entry.state : 'off'; // Vor dem ersten Log-Eintrag: Annahme "aus"
};

const PlugStateLog = mongoose.model('PlugStateLog', plugStateLogSchema);

export default PlugStateLog;
