import express from 'express';
import * as plugController from '../controllers/plugController.js';

const router = express.Router();

// GET /api/plug/desired - Für ESP32: "Was soll ich tun?"
router.get('/desired', plugController.getDesiredState);

// GET /api/plug/status - Für Website: Kompletter Status
router.get('/status', plugController.getStatus);

// PUT /api/plug/desired - Für Website: Gewünschten Status setzen
router.put('/desired', plugController.setDesiredState);

// PUT /api/plug/mode - Für Website: Modus setzen (manual/auto)
router.put('/mode', plugController.setMode);

// POST /api/plug/reported - Für ESP32: Aktuellen Status melden
router.post('/reported', plugController.updateReportedState);

export default router;


