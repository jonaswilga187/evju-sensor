import * as experimentService from '../services/experimentService.js';

// GET /api/experiment/status - für Website, ungeschützt (nur lesend)
export const getStatus = async (req, res, next) => {
  try {
    const data = await experimentService.getStatus();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/experiment/start - startet die Testwoche (Standard-Phasenplan,
// oder eigener Plan im Body: { phases: [...] })
export const start = async (req, res, next) => {
  try {
    const { phases } = req.body || {};
    const data = await experimentService.startExperiment(phases);
    res.status(200).json({
      success: true,
      message: `Experiment gestartet (${data.phases.length} Phasen, läuft in Schleife bis Stop)`,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/experiment/stop - stoppt sofort, beide Dosen gehen auf AUS
export const stop = async (req, res, next) => {
  try {
    const data = await experimentService.stopExperiment();
    res.status(200).json({ success: true, message: 'Experiment gestoppt', data });
  } catch (error) {
    next(error);
  }
};
