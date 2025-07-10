import express from 'express';

import Protect from '../middleware/auth/index.js';
import createPayment from '../controllers/Transactions/payment/add.js';
import getPayments from '../controllers/Transactions/payment/get.js';

const router = express.Router();

router.get('/get', Protect.agent, getPayments);
router.post('/add', Protect.agent, createPayment);

export default router;
