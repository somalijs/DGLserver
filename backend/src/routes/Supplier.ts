import express from 'express';

import Protect from '../middleware/auth/index.js';

import {
  activate,
  addSupplier,
  getSuppliers,
  restricted,
  updateSupplier,
} from '../controllers/Supplier/index.js';

const router = express.Router();

router.get('/get', Protect.agent, getSuppliers);
router.post('/add', Protect.agent, addSupplier);
router.put('/update/:id', Protect.agent, updateSupplier);
router.put('/activate/:id', Protect.agent, activate);
router.put('/restricted/:id', Protect.agent, restricted);

export default router;
