import mongoose from 'mongoose';
import { TypeFields } from '../../types/Config.js';
import getLogModel from '../../models/Logs.js';

type Props = {
  count?: number;
  profile: TypeFields['profiles'];
  id: mongoose.Types.ObjectId;
  minutes?: number;
};
const isRequestPassword = async ({
  count = 3,
  profile,
  id,
  minutes = 30,
}: Props) => {
  const Logs = getLogModel();
  const tenMinutesAgo = new Date(Date.now() - minutes * 60 * 1000);
  const objectId = new mongoose.Types.ObjectId(id);
  const match = {
    action: 'reset Password',
    profile,
    createdAt: { $gte: tenMinutesAgo },
    'model._id': objectId, // ✅ converted to ObjectId
  };
  const check = await Logs.countDocuments(match);
  return check >= count;
};

export default isRequestPassword;
