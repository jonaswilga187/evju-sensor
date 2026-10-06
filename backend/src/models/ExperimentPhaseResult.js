import mongoose from 'mongoose';

// Protokolliert jede abgeschlossene "reach_target"-Phase der Testwoche:
// wie lange hat diese Plug-Kombination gebraucht, um den Komfort-Zielbereich
// (TARGET_TEMP_MIN/MAX, TARGET_HUMIDITY_MIN/MAX) zu erreichen, und wie viel
// Energie hat das gekostet. Das ist die eigentliche Antwort auf "wie
// effizient erreichen wir unser Ziel" - die reine Zeit-im-Zielbereich-Analyse
// in analysisService.js beantwortet eine andere Frage (Haltekomfort im Alltag).
const experimentPhaseResultSchema = new mongoose.Schema({
  combination: { type: String, required: true }, // z.B. "heizung:on, entfeuchter:off"
  label: { type: String, required: true },
  started_at: { type: Date, required: true },
  ended_at: { type: Date, required: true },
  duration_seconds: { type: Number, required: true },
  // true = Zielbereich wurde erreicht, false = Sicherheits-Timeout griff vorher
  reached_target: { type: Boolean, required: true },
  start_temperatur: { type: Number, default: null },
  start_luftfeuchtigkeit: { type: Number, default: null },
  end_temperatur: { type: Number, default: null },
  end_luftfeuchtigkeit: { type: Number, default: null },
  // Durchschnittlicher Stromverbrauch (W) über die Phase * Dauer, in kWh
  energie_kwh: { type: Number, default: null }
}, {
  timestamps: true,
  collection: 'experiment_phase_results'
});

experimentPhaseResultSchema.index({ ended_at: -1 });

const ExperimentPhaseResult = mongoose.model('ExperimentPhaseResult', experimentPhaseResultSchema);

export default ExperimentPhaseResult;
