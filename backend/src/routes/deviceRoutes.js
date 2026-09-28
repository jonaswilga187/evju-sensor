import express from 'express';
import * as deviceController from '../controllers/deviceController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// GET /api/device/:deviceId/config - Für ESP32: WLAN-Config abholen (enthält Passwort, daher geschützt)
router.get('/:deviceId/config', requireApiKey, deviceController.getConfig);

// GET /api/device/:deviceId/config/status - Für Website: Version/Bestätigungsstatus (ohne Passwort)
router.get('/:deviceId/config/status', deviceController.getConfigStatus);

// PUT /api/device/:deviceId/config - Für Website: Neue WLAN-Zugangsdaten hinterlegen
router.put('/:deviceId/config', requireApiKey, deviceController.setConfig);

// POST /api/device/:deviceId/config/ack - Für ESP32: Übernahme-Status melden
router.post('/:deviceId/config/ack', requireApiKey, deviceController.acknowledgeConfig);

export default router;
