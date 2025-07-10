import mongoose from 'mongoose';
import VerificationType from '../../../types/Verification.js';
import getVerificationModel from '../../../models/Verification.js';
import { throwError } from '../../../func/Error.js';

type queryType = {
  model: 'agent' | 'user';
  email: string;
  isUsed: boolean;
};
export async function CreateEmailVerification({
  session,
  data,
}: {
  session?: mongoose.ClientSession;
  data: VerificationType;
}) {
  const Verification = getVerificationModel();
  // check if another token has the eamil and type
  let query: queryType = {
    model: data.model,
    email: data.email,
    isUsed: false,
  };

  const findToken = await Verification.findOne(query).session(session || null);
  if (findToken) {
    // delete that token
    await Verification.deleteOne({
      _id: findToken._id,
    }).session(session || null);
  }
  // delete all email verification tokens that are not used for this user
  let deleteQuery = {};
  if (data.model === 'agent') {
    deleteQuery = {
      'agent._id': data.agent._id,
    };
  } else if (data.model === 'user') {
    deleteQuery = {
      'user._id': data.user._id,
    };
  }
  await Verification.deleteMany({
    ...deleteQuery,
    isUsed: false,
  }).session(session || null);
  const create = await Verification.create([data], { session });
  if (!create.length) {
    throwError('Email Verification Token Creation Failed');
    return;
  }
  return create[0];
}

export default CreateEmailVerification;
