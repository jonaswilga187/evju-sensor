import express from 'express';
import sensorRoutes from './sensorRoutes.js';
import plugRoutes from './plugRoutes.js';
import cycleRoutes from './cycleRoutes.js';
import weatherRoutes from './weatherRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import experimentRoutes from './experimentRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

// API Info
router.get('/', (req, res) => {
  res.json({
    message: 'Sensor Monitoring API',
    version: '1.0.0',
    endpoints: {
      sensors: '/api/sensors',
      plug: '/api/plug',
      weather: '/api/weather',
      cycles: '/api/cycles',
      health: '/health'
    }
  });
});

// API Health (für Frontend-Statusanzeige)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
router.use('/sensors', sensorRoutes);
router.use('/plug', plugRoutes);
router.use('/cycles', cycleRoutes);
router.use('/weather', weatherRoutes);
router.use('/analysis', analysisRoutes);
router.use('/experiment', experimentRoutes);
router.use('/device', deviceRoutes);
router.use('/auth', authRoutes);

export default router;


