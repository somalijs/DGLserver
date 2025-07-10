import express from 'express';

import addBank from '../controllers/Bank/manage/add.js';
import Protect, { Authorize } from '../middleware/auth/index.js';
import { updateBank } from '../controllers/Bank/manage/update.js';
import getBanks from '../controllers/Bank/controller/get.js';
import getStatement from '../controllers/Bank/controller/statement.js';
import getBalance from '../controllers/Bank/controller/getBalance.js';

const router = express.Router();

router.post('/add', Protect.agent, Authorize('admin'), addBank);
router.put('/name/:id', Protect.agent, Authorize('admin'), updateBank);
router.get('/get', Protect.agent, getBanks);
router.get('/statement', Protect.agent, getStatement);
router.get('/balance/:id', Protect.agent, getBalance);

export default router;
