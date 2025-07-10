import mongoose from 'mongoose';
import { VerificationTypeOfVerify } from '../../../types/Verification.js';
import getVerificationModel from '../../../models/Verification.js';
import { throwError } from '../../../func/Error.js';
import { codeEncryption } from '../../../func/Encryptions.js';

type emailVerificationQueryType = {
  model: 'agent' | 'user';
  isUsed: boolean;
  'user._id'?: string;
  'agent._id'?: string;
};
export async function verifyEmailVerification({
  _id,
  token,
  model,
  session,
}: VerificationTypeOfVerify & {
  session?: mongoose.ClientSession;
}) {
  const Verification = getVerificationModel();
  let query: emailVerificationQueryType = {
    model: model,
    isUsed: false,
  };
  if (model === 'user') {
    query = {
      ...query,
      'user._id': _id,
    };
  } else if (model === 'agent') {
    query = {
      ...query,
      'agent._id': _id,
    };
  }
  const findToken = await Verification.findOne(query).session(session || null);
  if (!findToken) {
    throwError('Verification Token Not Found');
    return;
  }
  if (findToken?.expires < Date.now()) {
    throwError('Verification Token Expired');
  }
  if (findToken?.isUsed) {
    throwError('Invalid Verification Token');
  }
  // validate the Token
  const isTokenValid = await codeEncryption.validateOtp(token, findToken.token);
  if (!isTokenValid) {
    throwError('Invalid Token');
  }
  // update the token
  const useToken = await Verification.findByIdAndUpdate(
    findToken._id,
    { isUsed: true },
    { new: true, session, runValidators: true }
  );
  if (!useToken) {
    throwError('Unable to use token');
    return;
  }
  return useToken;
}

export default verifyEmailVerification;
