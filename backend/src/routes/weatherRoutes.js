import express from 'express';
import * as weatherController from '../controllers/weatherController.js';

const router = express.Router();

router.get('/24h', weatherController.get24HourTemperature);

export default router;
