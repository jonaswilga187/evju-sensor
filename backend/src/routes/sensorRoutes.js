import express from 'express';
import * as sensorController from '../controllers/sensorController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

// GET Routes - nur für eingeloggtes Dashboard (ersetzt den bisherigen
// nginx Basic-Auth-Dialog vor der ganzen Seite)
router.get('/latest', requireSession, sensorController.getLatestData);
router.get('/24h', requireSession, sensorController.get24HourData);
router.get('/averages', requireSession, sensorController.get24HourAverages);
router.get('/hourly', requireSession, sensorController.getHourlyData);
router.get('/range', requireSession, sensorController.getDataByRange);
router.get('/day', requireSession, sensorController.getDataByDate);
router.get('/stats', requireSession, sensorController.getStats);
router.get('/daily-summary', requireSession, sensorController.getDailySummaries);

// POST Routes - nur mit gültigem API-Key (Sensor-Geräte)
router.post('/', requireApiKey, sensorController.createMesswert);
router.post('/bulk', requireApiKey, sensorController.createBulkMesswerte);

export default router;


