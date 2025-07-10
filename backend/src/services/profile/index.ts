import updateEmail from './updateEmail.js';
import CreateProfile from './Create.js';
import { VerifyProfileEmail } from './verify.js';
const Profile = {
  create: CreateProfile,
  verifyProfileEmail: VerifyProfileEmail,
  updateEmail,
};

export default Profile;
