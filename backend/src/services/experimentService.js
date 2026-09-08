import ExperimentPlan from '../models/ExperimentPlan.js';
import * as plugService from './plugService.js';

// Standard-Testplan für die erste Woche: bewusst viele unterschiedliche
// Kombinationen und Laufzeiten, damit die Verbrauchsanalyse
// (analysisService.js) genug echte Vergleichsdaten bekommt, statt nur
// abzuwarten, was die einfache Schwellenwert-Automatik zufällig produziert.
// Nach der letzten Phase geht es wieder bei Phase 1 los (Endlosschleife,
// bis das Experiment manuell gestoppt wird).
export const DEFAULT_PHASES = [
  { label: 'Nur Heizung, 3 Min', heizung: 'on', entfeuchter: 'off', duration_minutes: 3 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Nur Heizung, 5 Min', heizung: 'on', entfeuchter: 'off', duration_minutes: 5 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Nur Heizung, 1 Min', heizung: 'on', entfeuchter: 'off', duration_minutes: 1 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Nur Entfeuchter, 3 Min', heizung: 'off', entfeuchter: 'on', duration_minutes: 3 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Nur Entfeuchter, 5 Min', heizung: 'off', entfeuchter: 'on', duration_minutes: 5 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Nur Entfeuchter, 1 Min', heizung: 'off', entfeuchter: 'on', duration_minutes: 1 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Beide gleichzeitig, 5 Min', heizung: 'on', entfeuchter: 'on', duration_minutes: 5 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 },
  { label: 'Erst Heizung (5 Min) ...', heizung: 'on', entfeuchter: 'off', duration_minutes: 5 },
  { label: '... dann zusätzlich Entfeuchter (5 Min)', heizung: 'on', entfeuchter: 'on', duration_minutes: 5 },
  { label: 'Pause (Erholung)', heizung: 'off', entfeuchter: 'off', duration_minutes: 10 }
];

const applyPhase = async (phase) => {
  await plugService.setDesiredState('heizung', phase.heizung, 'experiment');
  await plugService.setDesiredState('entfeuchter', phase.entfeuchter, 'experiment');
};

export const startExperiment = async (phases) => {
  const plan = await ExperimentPlan.getOrCreate();
  const usePhases = Array.isArray(phases) && phases.length > 0 ? phases : DEFAULT_PHASES;

  plan.active = true;
  plan.phases = usePhases;
  plan.current_phase_index = 0;
  plan.phase_started_at = new Date();
  plan.started_at = new Date();
  plan.loop_count = 0;
  await plan.save();

  console.log(`🧪 Experiment gestartet: ${usePhases.length} Phasen, Endlosschleife bis Stop`);
  await applyPhase(usePhases[0]);

  return plan;
};

export const stopExperiment = async () => {
  const plan = await ExperimentPlan.getOrCreate();
  plan.active = false;
  await plan.save();

  // Sicherheitsdefault: beim Stoppen beide Dosen aus. Plugs im Auto-Modus
  // übernehmen beim nächsten ESP32-Poll ohnehin wieder ihre eigene Logik.
  await plugService.setDesiredState('heizung', 'off', 'experiment');
  await plugService.setDesiredState('entfeuchter', 'off', 'experiment');

  console.log('🧪 Experiment gestoppt, beide Dosen auf AUS gesetzt');
  return plan;
};

// Wird regelmäßig (siehe server.js) aufgerufen. Prüft, ob die aktuelle Phase
// abgelaufen ist, und schaltet ggf. zur nächsten (mit Schleife am Ende).
export const advanceIfNeeded = async () => {
  const plan = await ExperimentPlan.getOrCreate();
  if (!plan.active || plan.phases.length === 0) return;

  const currentPhase = plan.phases[plan.current_phase_index];
  const elapsedMs = Date.now() - new Date(plan.phase_started_at).getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);

  if (elapsedMinutes < currentPhase.duration_minutes) {
    return; // Aktuelle Phase läuft noch
  }

  let nextIndex = plan.current_phase_index + 1;
  if (nextIndex >= plan.phases.length) {
    nextIndex = 0;
    plan.loop_count += 1;
    console.log(`🧪 Experiment: Durchlauf ${plan.loop_count} abgeschlossen, beginnt von vorn`);
  }

  plan.current_phase_index = nextIndex;
  plan.phase_started_at = new Date();
  await plan.save();

  const nextPhase = plan.phases[nextIndex];
  console.log(`🧪 Experiment: Phase ${nextIndex + 1}/${plan.phases.length} - ${nextPhase.label}`);
  await applyPhase(nextPhase);
};

export const getStatus = async () => {
  const plan = await ExperimentPlan.getOrCreate();

  if (!plan.active) {
    return { active: false };
  }

  const currentPhase = plan.phases[plan.current_phase_index];
  const elapsedMs = Date.now() - new Date(plan.phase_started_at).getTime();
  const remainingSeconds = Math.max(0, Math.round(currentPhase.duration_minutes * 60 - elapsedMs / 1000));

  return {
    active: true,
    started_at: plan.started_at,
    loop_count: plan.loop_count,
    total_phases: plan.phases.length,
    current_phase_index: plan.current_phase_index,
    current_phase: currentPhase,
    remaining_seconds: remainingSeconds
  };
};
