import express from 'express';
import * as temperatureCycleController from '../controllers/temperatureCycleController.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

// GET /api/cycles - Alle Zyklen mit Filtern
router.get('/', requireSession, temperatureCycleController.getCycles);

// GET /api/cycles/daily - Tagesstatistiken
router.get('/daily', requireSession, temperatureCycleController.getDailyStatistics);

// GET /api/cycles/:date - Zyklen für bestimmten Tag
router.get('/:date', requireSession, temperatureCycleController.getCyclesByDate);

export default router;

