import mongoose from 'mongoose';
import { ProfileDocument } from '../../models/Profile.js';
import { throwError } from '../../func/Error.js';

type Props = {
  Model: mongoose.Model<ProfileDocument>;
  profile: 'user' | 'agent';
  email: string;
  id: mongoose.Types.ObjectId;
  session: mongoose.ClientSession;
};
// const Schema = z.object({
//   email: zodFields.email,
//   id: z.string().min(1, 'ID is required'),
// });
const updateEmail = async ({ Model, profile, email, id, session }: Props) => {
  const isExist = await Model.findOne({
    _id: new mongoose.Types.ObjectId(id),
    isDeleted: false,
  }).session(session);
  if (!isExist) {
    throwError(`${profile} not found`);
    return;
  }
  if (isExist.email === email) {
    throwError('Please enter a different email address than your current one');
  }
  // check if email is in use by another user
  const isEmailInUse = await Model.findOne({
    email,
    _id: { $ne: new mongoose.Types.ObjectId(id) },
  }).session(session);
  if (isEmailInUse) {
    throwError(
      `Email is already in use by ${profile} (${isEmailInUse.name} ${isEmailInUse.surname})`
    );
  }
  const update = await Model.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { email: email },
    { new: true }
  ).session(session);
  if (!update) {
    throwError('Failed to update profile email');
    return;
  }
  return update;
};

export default updateEmail;
