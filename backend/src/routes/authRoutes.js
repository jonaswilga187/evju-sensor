import express from 'express';
import * as authController from '../controllers/authController.js';
import { requireSession } from '../middleware/requireSession.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireSession, authController.me);

export default router;
