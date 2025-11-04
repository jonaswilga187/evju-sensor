import express from 'express';
import * as sensorController from '../controllers/sensorController.js';

const router = express.Router();

// GET Routes
router.get('/latest', sensorController.getLatestData);
router.get('/24h', sensorController.get24HourData);
router.get('/averages', sensorController.get24HourAverages);
router.get('/hourly', sensorController.getHourlyData);
router.get('/range', sensorController.getDataByRange);
router.get('/stats', sensorController.getStats);

// POST Routes
router.post('/', sensorController.createMesswert);
router.post('/bulk', sensorController.createBulkMesswerte);

export default router;


