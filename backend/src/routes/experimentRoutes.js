import express from 'express';
import * as experimentController from '../controllers/experimentController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

router.get('/status', requireSession, experimentController.getStatus);
router.get('/results', requireSession, experimentController.getResults);
router.post('/start', requireApiKey, experimentController.start);
router.post('/stop', requireApiKey, experimentController.stop);

export default router;
