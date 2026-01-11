import express from 'express';
import * as temperatureCycleController from '../controllers/temperatureCycleController.js';

const router = express.Router();

// GET /api/cycles - Alle Zyklen mit Filtern
router.get('/', temperatureCycleController.getCycles);

// GET /api/cycles/daily - Tagesstatistiken
router.get('/daily', temperatureCycleController.getDailyStatistics);

// GET /api/cycles/:date - Zyklen für bestimmten Tag
router.get('/:date', temperatureCycleController.getCyclesByDate);

export default router;

