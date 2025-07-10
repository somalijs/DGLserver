import { addAgent } from './manage/manage.js';
import { emailLogin } from './auth/emailLogin.js';
import { profileEmail } from './verify/profileEmail.js';
import addNewEmail from './manage/newEmail.js';
import verifyNewEmail from './verify/newEmail.js';
import getMe from './auth/me.js';
import changePhone from './manage/changePhone.js';
import updateDetails from './manage/updateDetails.js';
import activate from './manage/activate.js';
import resendEmailverification from './verify/resendEmailVerification.js';
import resetPassword from './manage/resetPassword.js';
import getAgents from './controller/get.js';

export {
  addAgent,
  getAgents,
  emailLogin,
  profileEmail,
  addNewEmail,
  verifyNewEmail,
  getMe,
  changePhone,
  updateDetails,
  activate,
  resendEmailverification,
  resetPassword,
};
