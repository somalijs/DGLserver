import express from 'express';

import { addSale, getSales } from '../controllers/Transactions/sale/index.js';
import Protect from '../middleware/auth/index.js';

const router = express.Router();

router.get('/get', Protect.agent, getSales);
router.post('/add', Protect.agent, addSale);

export default router;
