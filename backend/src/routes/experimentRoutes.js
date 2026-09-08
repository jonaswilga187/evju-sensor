import express from 'express';
import * as experimentController from '../controllers/experimentController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

router.get('/status', experimentController.getStatus);
router.post('/start', requireApiKey, experimentController.start);
router.post('/stop', requireApiKey, experimentController.stop);

export default router;
