import ExperimentPlan from '../models/ExperimentPlan.js';
import ExperimentPhaseResult from '../models/ExperimentPhaseResult.js';
import SensorMesswert from '../models/SensorMesswert.js';
import * as plugService from './plugService.js';
import { getLatestData } from './sensorService.js';
import { isInTargetRange, combinationKey } from './analysisService.js';

// Harte Sicherheitsgrenze, die ÜBER dem Phasenplan steht: der Plan selbst ist
// rein zeitbasiert und weiß nichts von der tatsächlichen Temperatur. Ohne
// diese Grenze würde eine "Heizung an"-Phase stur bis zum Ende durchlaufen,
// egal wie warm es im Raum mit der Veranstaltungstechnik wird.
const MAX_TEMP_C = parseFloat(process.env.EXPERIMENT_MAX_TEMP) || 26;
// Sind die Sensordaten älter als das (z.B. ESP32 offline), gilt der Zustand
// als nicht vertrauenswürdig -> Heizung bleibt sicherheitshalber aus.
const MAX_SENSOR_AGE_MS = 5 * 60 * 1000;
// Fallback, falls eine Phase (z.B. aus einem alten, noch laufenden Plan ohne
// dieses Feld) keine max_duration_minutes hat - verhindert eine endlos
// laufende Phase statt einfach zu crashen.
const FALLBACK_MAX_DURATION_MINUTES = 20;

const getLatestDataSafe = async () => {
  try {
    return await getLatestData();
  } catch (err) {
    console.error('🧪⚠️  Sensordaten konnten nicht gelesen werden:', err.message);
    return null;
  }
};

const isSensorDataFresh = (latest) => {
  if (!latest) return false;
  const ageMs = Date.now() - new Date(latest.zeitstempel).getTime();
  return ageMs <= MAX_SENSOR_AGE_MS;
};

// Prüft, ob gerade geheizt werden darf. Fail-safe: fehlende/zu alte
// Sensordaten zählen als "nicht sicher", nicht als "passt schon".
const isTemperatureSafe = async (latest) => {
  if (!isSensorDataFresh(latest)) {
    console.warn('🧪⚠️  Sicherheitscheck: keine aktuellen Sensordaten (ESP32 offline?) - Heizung bleibt aus.');
    return false;
  }

  if (latest.temperatur >= MAX_TEMP_C) {
    console.warn(`🧪🔥 Sicherheitsabschaltung: ${latest.temperatur}°C erreicht/überschreitet das Limit (${MAX_TEMP_C}°C) - Heizung wird zwangsweise ausgeschaltet.`);
    return false;
  }

  return true;
};

// Standard-Testplan: testet jede Kombination jeweils so lange, bis der
// Komfort-Zielbereich (TARGET_TEMP_MIN/MAX, TARGET_HUMIDITY_MIN/MAX aus der
// .env) erreicht ist - das misst direkt "wie effizient kommen wir ans Ziel"
// statt nur, was in einer geratenen festen Minutenzahl passiert. Dazwischen
// jeweils eine Erholungsphase, bis der Raum wieder klar außerhalb des
// Zielbereichs ist, damit jede Test-Phase vom gleichen Startpunkt losgeht.
// max_duration_minutes ist dabei nur die Sicherheits-Obergrenze, kein Ziel.
export const DEFAULT_PHASES = [
  { label: 'Erholung (alles aus)', heizung: 'off', entfeuchter: 'off', mode: 'recover', max_duration_minutes: 30 },
  { label: 'Nur Heizung', heizung: 'on', entfeuchter: 'off', mode: 'reach_target', max_duration_minutes: 25 },
  { label: 'Erholung (alles aus)', heizung: 'off', entfeuchter: 'off', mode: 'recover', max_duration_minutes: 30 },
  { label: 'Nur Entfeuchter', heizung: 'off', entfeuchter: 'on', mode: 'reach_target', max_duration_minutes: 25 },
  { label: 'Erholung (alles aus)', heizung: 'off', entfeuchter: 'off', mode: 'recover', max_duration_minutes: 30 },
  { label: 'Heizung + Entfeuchter gleichzeitig', heizung: 'on', entfeuchter: 'on', mode: 'reach_target', max_duration_minutes: 25 },
  { label: 'Erholung (alles aus)', heizung: 'off', entfeuchter: 'off', mode: 'recover', max_duration_minutes: 30 },
  { label: 'Erst Heizung allein', heizung: 'on', entfeuchter: 'off', mode: 'reach_target', max_duration_minutes: 20 },
  { label: '... dann zusätzlich Entfeuchter', heizung: 'on', entfeuchter: 'on', mode: 'reach_target', max_duration_minutes: 20 },
  { label: 'Erholung (alles aus)', heizung: 'off', entfeuchter: 'off', mode: 'recover', max_duration_minutes: 30 }
];

const applyPhase = async (phase, latest) => {
  const heizungState = phase.heizung === 'on' && !(await isTemperatureSafe(latest)) ? 'off' : phase.heizung;
  await plugService.setDesiredState('heizung', heizungState, 'experiment');
  await plugService.setDesiredState('entfeuchter', phase.entfeuchter, 'experiment');
};

// Entscheidet, ob die aktuelle Phase beendet ist. Reihenfolge wichtig:
// das Sicherheits-Timeout zählt immer, auch ohne (frische) Sensordaten.
const isPhaseDone = (phase, latest, elapsedMinutes) => {
  const maxMinutes = phase.max_duration_minutes || FALLBACK_MAX_DURATION_MINUTES;
  if (elapsedMinutes >= maxMinutes) return true;

  // Ohne frische Sensordaten lässt sich "Ziel erreicht" / "klar außerhalb"
  // nicht beurteilen - abwarten statt zu raten, bis das Timeout greift.
  if (!isSensorDataFresh(latest)) return false;

  if (phase.mode === 'reach_target') return isInTargetRange(latest);
  if (phase.mode === 'recover') return !isInTargetRange(latest);
  return false; // 'fixed': nur das Timeout oben zählt
};

// Protokolliert das Ergebnis einer abgeschlossenen "reach_target"-Phase für
// die spätere Auswertung (GET /api/experiment/results). Erholungsphasen und
// feste Phasen werden nicht protokolliert - sie beantworten nicht die Frage
// "wie effizient erreichen wir unser Ziel".
const recordPhaseResult = async (phase, startedAt, endReading) => {
  if (phase.mode !== 'reach_target') return;

  const readings = await SensorMesswert.find({ zeitstempel: { $gte: startedAt } })
    .sort({ zeitstempel: 1 })
    .lean();

  const startReading = readings[0] || null;
  const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
  const avgStromverbrauch = readings.length > 0
    ? readings.reduce((sum, r) => sum + r.stromverbrauch, 0) / readings.length
    : null;
  const energieKwh = avgStromverbrauch !== null
    ? Number(((avgStromverbrauch * (durationSeconds / 3600)) / 1000).toFixed(3))
    : null;
  const reachedTarget = endReading ? isInTargetRange(endReading) : false;

  await ExperimentPhaseResult.create({
    combination: combinationKey({ heizung: phase.heizung, entfeuchter: phase.entfeuchter }),
    label: phase.label,
    started_at: startedAt,
    ended_at: new Date(),
    duration_seconds: durationSeconds,
    reached_target: reachedTarget,
    start_temperatur: startReading?.temperatur ?? null,
    start_luftfeuchtigkeit: startReading?.luftfeuchtigkeit ?? null,
    end_temperatur: endReading?.temperatur ?? null,
    end_luftfeuchtigkeit: endReading?.luftfeuchtigkeit ?? null,
    energie_kwh: energieKwh
  });

  console.log(
    `🧪📊 Ergebnis "${phase.label}": ${reachedTarget ? 'Ziel erreicht' : 'Timeout'} ` +
    `nach ${Math.round(durationSeconds / 60)} Min., ${energieKwh ?? '?'} kWh`
  );
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
  const latest = await getLatestDataSafe();
  await applyPhase(usePhases[0], latest);

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

// Wird regelmäßig (siehe server.js, alle 15s) aufgerufen. Prüft, ob die
// aktuelle Phase ihr Ziel erreicht hat (oder das Sicherheits-Timeout
// abgelaufen ist), und schaltet ggf. zur nächsten Phase (mit Schleife am Ende).
export const advanceIfNeeded = async () => {
  const plan = await ExperimentPlan.getOrCreate();
  if (!plan.active || plan.phases.length === 0) return;

  const currentPhase = plan.phases[plan.current_phase_index];
  const latest = await getLatestDataSafe();

  // Laufende Sicherheitsprüfung bei JEDEM Aufruf, nicht nur bei
  // Phasenwechseln - eine zu warme "Heizung an"-Phase wird so sofort
  // unterbrochen statt erst beim nächsten Check-Zyklus.
  if (currentPhase.heizung === 'on') {
    const safe = await isTemperatureSafe(latest);
    await plugService.setDesiredState('heizung', safe ? 'on' : 'off', 'experiment');
  }

  const startedAt = new Date(plan.phase_started_at);
  const elapsedMinutes = (Date.now() - startedAt.getTime()) / (1000 * 60);

  if (!isPhaseDone(currentPhase, latest, elapsedMinutes)) {
    return; // Aktuelle Phase läuft noch
  }

  await recordPhaseResult(currentPhase, startedAt, latest);

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
  await applyPhase(nextPhase, latest);
};

export const getStatus = async () => {
  const plan = await ExperimentPlan.getOrCreate();

  if (!plan.active) {
    return { active: false };
  }

  const currentPhase = plan.phases[plan.current_phase_index];
  const latest = await getLatestDataSafe();
  const elapsedSeconds = Math.round((Date.now() - new Date(plan.phase_started_at).getTime()) / 1000);

  return {
    active: true,
    started_at: plan.started_at,
    loop_count: plan.loop_count,
    total_phases: plan.phases.length,
    current_phase_index: plan.current_phase_index,
    current_phase: currentPhase,
    elapsed_seconds: elapsedSeconds,
    max_duration_seconds: (currentPhase.max_duration_minutes || FALLBACK_MAX_DURATION_MINUTES) * 60,
    in_target_range: latest ? isInTargetRange(latest) : false,
    latest_reading: latest ? { temperatur: latest.temperatur, luftfeuchtigkeit: latest.luftfeuchtigkeit } : null
  };
};

// Protokollierte Ergebnisse der "reach_target"-Phasen, neueste zuerst - die
// eigentliche Antwort auf "wie effizient erreichen wir unser Ziel".
export const getResults = async (limit = 50) => {
  return await ExperimentPhaseResult.find().sort({ ended_at: -1 }).limit(limit).lean();
};
