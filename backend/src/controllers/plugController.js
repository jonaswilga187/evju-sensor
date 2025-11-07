import * as plugService from '../services/plugService.js';

// GET /api/plug/desired - Gewünschter Status für ESP32
// ESP32 fragt regelmäßig: "Was soll ich tun?"
export const getDesiredState = async (req, res, next) => {
  try {
    const data = await plugService.getDesiredStateForESP();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/plug/status - Kompletter Status für Website
export const getStatus = async (req, res, next) => {
  try {
    const data = await plugService.getCompleteStatus();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/plug/desired - Gewünschten Status setzen (von Website)
export const setDesiredState = async (req, res, next) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State ist erforderlich (on oder off)'
      });
    }
    
    const data = await plugService.setDesiredState(state);
    
    res.status(200).json({
      success: true,
      message: `Heizung auf "${state}" gesetzt`,
      data
    });
  } catch (error) {
    if (error.message.includes('muss')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// POST /api/plug/reported - Gemeldeten Status aktualisieren (von ESP32)
// ESP32 meldet: "Ich bin jetzt on/off"
export const updateReportedState = async (req, res, next) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State ist erforderlich'
      });
    }
    
    const data = await plugService.updateReportedState(state);
    
    res.status(200).json({
      success: true,
      message: 'Status aktualisiert',
      data
    });
  } catch (error) {
    if (error.message.includes('muss')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// PUT /api/plug/mode - Modus setzen (manual/auto) mit optionalem Schwellenwert + Hysterese
export const setMode = async (req, res, next) => {
  try {
    const { mode, temperature_threshold, hysteresis } = req.body;
    
    if (!mode) {
      return res.status(400).json({
        success: false,
        message: 'Modus ist erforderlich (manual oder auto)'
      });
    }
    
    const data = await plugService.setMode(mode, temperature_threshold, hysteresis);
    
    let message = `Modus auf "${mode}" gesetzt`;
    if (temperature_threshold) message += ` (Schwellenwert: ${temperature_threshold}°C)`;
    if (hysteresis !== undefined) message += ` (Hysterese: ${hysteresis}°C)`;
    
    res.status(200).json({
      success: true,
      message,
      data
    });
  } catch (error) {
    if (error.message.includes('muss')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

