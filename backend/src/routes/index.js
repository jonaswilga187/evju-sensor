import express from 'express';
import sensorRoutes from './sensorRoutes.js';
import plugRoutes from './plugRoutes.js';
import cycleRoutes from './cycleRoutes.js';

const router = express.Router();

// API Info
router.get('/', (req, res) => {
  res.json({
    message: 'Sensor Monitoring API',
    version: '1.0.0',
    endpoints: {
      sensors: '/api/sensors',
      plug: '/api/plug',
      cycles: '/api/cycles',
      health: '/health'
    }
  });
});

// Routes
router.use('/sensors', sensorRoutes);
router.use('/plug', plugRoutes);
router.use('/cycles', cycleRoutes);

export default router;


