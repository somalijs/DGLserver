import express from 'express';

import Protect, { Authorize } from '../middleware/auth/index.js';

import report from '../controllers/Report/index.js';

const router = express.Router();

router.post('/admin', Protect.agent, Authorize('admin'), report);

export default router;
