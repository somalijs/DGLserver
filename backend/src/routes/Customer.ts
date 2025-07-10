import express from 'express';

import Protect from '../middleware/auth/index.js';

import {
  activate,
  addCustomer,
  getCustomers,
  restricted,
  updateCustomer,
} from '../controllers/Customer/index.js';

const router = express.Router();

router.get('/get', Protect.agent, getCustomers);
router.post('/add', Protect.agent, addCustomer);
router.put('/update/:id', Protect.agent, updateCustomer);
router.put('/activate/:id', Protect.agent, activate);
router.put('/restricted/:id', Protect.agent, restricted);

export default router;
