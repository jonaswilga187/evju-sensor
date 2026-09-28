import express from 'express';
import * as sensorController from '../controllers/sensorController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// GET Routes
router.get('/latest', sensorController.getLatestData);
router.get('/24h', sensorController.get24HourData);
router.get('/averages', sensorController.get24HourAverages);
router.get('/hourly', sensorController.getHourlyData);
router.get('/range', sensorController.getDataByRange);
router.get('/day', sensorController.getDataByDate);
router.get('/stats', sensorController.getStats);
router.get('/daily-summary', sensorController.getDailySummaries);

// POST Routes - nur mit gültigem API-Key (Sensor-Geräte)
router.post('/', requireApiKey, sensorController.createMesswert);
router.post('/bulk', requireApiKey, sensorController.createBulkMesswerte);

export default router;


