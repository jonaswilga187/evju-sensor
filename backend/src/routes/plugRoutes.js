import express from 'express';
import * as plugController from '../controllers/plugController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

// GET /api/plug - Für Website: Übersicht aller Plugs (Heizung, Entfeuchter, ...)
router.get('/', requireSession, plugController.getAllPlugs);

// GET /api/plug/:plugId/desired - Für ESP32: "Was soll ich tun?" (bewusst OHNE
// Session-Pflicht - das Gerät hat keinen Browser-Login, nur der API-Key-Pfad
// für Schreibzugriffe gilt hier)
router.get('/:plugId/desired', plugController.getDesiredState);

// GET /api/plug/:plugId/status - Für Website: Kompletter Status eines Plugs
router.get('/:plugId/status', requireSession, plugController.getStatus);

// PUT /api/plug/:plugId/desired - Für Website: Gewünschten Status setzen (schaltet die Dose!)
router.put('/:plugId/desired', requireApiKey, plugController.setDesiredState);

// PUT /api/plug/:plugId/mode - Für Website: Modus setzen (manual/auto)
router.put('/:plugId/mode', requireApiKey, plugController.setMode);

// POST /api/plug/:plugId/reported - Für ESP32: Aktuellen Status melden
router.post('/:plugId/reported', requireApiKey, plugController.updateReportedState);

export default router;
