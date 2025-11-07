import express from 'express';
import sensorRoutes from './sensorRoutes.js';
import plugRoutes from './plugRoutes.js';

const router = express.Router();

// API Info
router.get('/', (req, res) => {
  res.json({
    message: 'Sensor Monitoring API',
    version: '1.0.0',
    endpoints: {
      sensors: '/api/sensors',
      plug: '/api/plug',
      health: '/health'
    }
  });
});

// Routes
router.use('/sensors', sensorRoutes);
router.use('/plug', plugRoutes);

export default router;


