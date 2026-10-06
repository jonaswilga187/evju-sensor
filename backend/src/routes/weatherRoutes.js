import express from 'express';
import * as weatherController from '../controllers/weatherController.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

router.get('/24h', requireSession, weatherController.get24HourTemperature);

export default router;
