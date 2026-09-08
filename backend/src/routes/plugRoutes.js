import express from 'express';
import * as plugController from '../controllers/plugController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// GET /api/plug/desired - Für ESP32: "Was soll ich tun?"
router.get('/desired', plugController.getDesiredState);

// GET /api/plug/status - Für Website: Kompletter Status
router.get('/status', plugController.getStatus);

// PUT /api/plug/desired - Für Website: Gewünschten Status setzen (schaltet die Heizung!)
router.put('/desired', requireApiKey, plugController.setDesiredState);

// PUT /api/plug/mode - Für Website: Modus setzen (manual/auto)
router.put('/mode', requireApiKey, plugController.setMode);

// POST /api/plug/reported - Für ESP32: Aktuellen Status melden
router.post('/reported', requireApiKey, plugController.updateReportedState);

export default router;


