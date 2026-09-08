import * as plugService from '../services/plugService.js';

// GET /api/plug - Übersicht aller Plugs (für Website)
export const getAllPlugs = async (req, res, next) => {
  try {
    const data = await plugService.getAllStatuses();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/plug/:plugId/desired - Gewünschter Status für ESP32
// ESP32 fragt regelmäßig: "Was soll ich tun?"
export const getDesiredState = async (req, res, next) => {
  try {
    const data = await plugService.getDesiredStateForESP(req.params.plugId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/plug/:plugId/status - Kompletter Status für Website
export const getStatus = async (req, res, next) => {
  try {
    const data = await plugService.getCompleteStatus(req.params.plugId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/plug/:plugId/desired - Gewünschten Status setzen (von Website)
export const setDesiredState = async (req, res, next) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State ist erforderlich (on oder off)'
      });
    }

    const data = await plugService.setDesiredState(req.params.plugId, state);

    res.status(200).json({
      success: true,
      message: `${req.params.plugId} auf "${state}" gesetzt`,
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.message.includes('muss')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// POST /api/plug/:plugId/reported - Gemeldeten Status aktualisieren (von ESP32)
// ESP32 meldet: "Ich bin jetzt on/off"
export const updateReportedState = async (req, res, next) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ success: false, message: 'State ist erforderlich' });
    }

    const data = await plugService.updateReportedState(req.params.plugId, state);

    res.status(200).json({ success: true, message: 'Status aktualisiert', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.message.includes('muss')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// PUT /api/plug/:plugId/mode - Modus setzen (manual/auto) mit optionalem Schwellenwert + Hysterese
export const setMode = async (req, res, next) => {
  try {
    const { mode, threshold, hysteresis } = req.body;

    if (!mode) {
      return res.status(400).json({
        success: false,
        message: 'Modus ist erforderlich (manual oder auto)'
      });
    }

    const data = await plugService.setMode(req.params.plugId, mode, threshold, hysteresis);

    let message = `${req.params.plugId}: Modus auf "${mode}" gesetzt`;
    if (threshold !== undefined) message += ` (Schwellenwert: ${threshold})`;
    if (hysteresis !== undefined) message += ` (Hysterese: ${hysteresis})`;

    res.status(200).json({ success: true, message, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.message.includes('muss')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
