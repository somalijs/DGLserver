import express from 'express';
import {
  activate,
  addAgent,
  addNewEmail,
  changePhone,
  emailLogin,
  getAgents,
  getMe,
  profileEmail,
  resendEmailverification,
  resetPassword,
  updateDetails,
  verifyNewEmail,
} from '../controllers/Agent/index.js';
import Protect, { Authorize } from '../middleware/auth/index.js';
import logout from '../controllers/Agent/auth/logout.js';
const router = express.Router();
// credentials
router.post('/emaillogin', emailLogin);
router.get('/me', Protect.agent, getMe);
router.get('/logout', Protect.agent, logout);
router.get(
  '/get',
  Protect.agent,
  Authorize('admin', 'manager', 'staff'),
  getAgents
);
// manage
router.post('/add', Protect.agent, Authorize('admin'), addAgent);
router.put('/changeEmail/:_id', Protect.agent, Authorize('admin'), addNewEmail);
router.put('/changePhone/:_id', Protect.agent, Authorize('admin'), changePhone);
router.put(
  '/updatedetails/:_id',
  Protect.agent,
  Authorize('admin'),
  updateDetails
);
router.put('/activate/:_id', Protect.agent, Authorize('admin'), activate);
router.put('/resetpassword/:_id', resetPassword);
// verification
router.put(
  '/verifyprofileemail/:_id/:token',
  Protect.agent,
  Authorize('admin'),
  profileEmail
);
router.put(
  '/verifynewemail/:_id/:token',
  Protect.agent,
  Authorize('admin'),
  verifyNewEmail
);
router.put(
  '/resendemailverification/:_id',
  Protect.agent,
  Authorize('admin'),
  resendEmailverification
);

export default router;
