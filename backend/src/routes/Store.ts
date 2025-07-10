import express from 'express';

import Protect, { Authorize } from '../middleware/auth/index.js';
import {
  addStore,
  getStores,
  storeActivation,
  updateStore,
} from '../controllers/store/index.js';

const router = express.Router();

router.post('/add', Protect.agent, Authorize('admin'), addStore);
router.put('/update/:id', Protect.agent, Authorize('admin'), updateStore);
router.put('/activate/:id', Protect.agent, Authorize('admin'), storeActivation);
router.get('/get', Protect.agent, Authorize('admin'), getStores);

export default router;
