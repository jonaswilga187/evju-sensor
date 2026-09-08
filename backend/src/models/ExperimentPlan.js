import mongoose from 'mongoose';

// Singleton-Dokument (_id: 'main'), das eine laufende "Testwoche" beschreibt:
// eine Sequenz fest definierter Phasen (welcher Plug wie lange an/aus ist),
// die automatisch der Reihe nach durchgeschaltet und danach wiederholt wird.
// Ziel: bewusst viele unterschiedliche Heizung/Entfeuchter-Kombinationen und
// Laufzeiten erzeugen, damit die Verbrauchsanalyse (analysisService.js)
// genug Vergleichsdaten hat, statt nur auf das zu warten, was die einfache
// Schwellenwert-Automatik zufällig produziert.
const phaseSchema = new mongoose.Schema({
  label: { type: String, required: true },
  heizung: { type: String, enum: ['on', 'off'], required: true },
  entfeuchter: { type: String, enum: ['on', 'off'], required: true },
  duration_minutes: { type: Number, required: true, min: 1 }
}, { _id: false });

const experimentPlanSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  active: { type: Boolean, default: false },
  phases: { type: [phaseSchema], default: [] },
  current_phase_index: { type: Number, default: 0 },
  phase_started_at: { type: Date, default: null },
  started_at: { type: Date, default: null },
  // Wie oft die gesamte Phasen-Liste schon einmal komplett durchlaufen wurde
  // (fürs Dashboard - "Durchlauf 3 von ...")
  loop_count: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'experiment_plan'
});

experimentPlanSchema.statics.getOrCreate = async function() {
  let plan = await this.findById('main');
  if (!plan) {
    plan = await this.create({ _id: 'main' });
  }
  return plan;
};

const ExperimentPlan = mongoose.model('ExperimentPlan', experimentPlanSchema);

export default ExperimentPlan;
