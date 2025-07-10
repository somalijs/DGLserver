import express from 'express';
import Protect from '../middleware/auth/index.js';

import createPayout from '../controllers/Transactions/payout/add.js';
import getPayouts from '../controllers/Transactions/payout/get.js';

const router = express.Router();

router.get('/get', Protect.agent, getPayouts);
router.post('/add', Protect.agent, createPayout);

export default router;
