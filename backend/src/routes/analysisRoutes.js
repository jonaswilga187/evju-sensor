import express from 'express';
import * as analysisController from '../controllers/analysisController.js';

const router = express.Router();

// GET /api/analysis/consumption - Verbrauchsvergleich der Plug-Kombinationen (read-only)
router.get('/consumption', analysisController.getConsumptionComparison);

export default router;
