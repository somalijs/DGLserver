import { ProfileDocument } from '../../models/Profile.js';

import mongoose from 'mongoose';
import { VerificationTypeOfVerify } from '../../types/Verification.js';
import { throwError } from '../../func/Error.js';
import { passwordEncryption } from '../../func/Encryptions.js';
import Emails from '../../Emails/Index.js';
import Verification from '../verification/index.js';

export const VerifyProfileEmail = async ({
  _id,
  token,
  model,
  session,
  Model,
}: VerificationTypeOfVerify & {
  session: mongoose.ClientSession;
  Model: mongoose.Model<ProfileDocument>;
}) => {
  const isExist = await Model.findOne({ _id }).session(session || null);
  if (!isExist) {
    throwError(`${model} not found`);
    return;
  }
  if (isExist.isEmailVerified) {
    throwError(`${model} is already verified`);
  }
  const verifyToken = await Verification.verifyEmailVerification({
    _id,
    token,
    model,
    session,
  });
  if (!verifyToken) {
    throwError('unable to verify token');
  }

  const pass = await passwordEncryption.generate();
  let updateData: {
    isEmailVerified: boolean;
    isActive: boolean;
    password?: string;
  } = {
    isEmailVerified: true,
    isActive: true,
  };
  if (!isExist.password) {
    updateData = {
      ...updateData,
      password: pass.hash,
    };
  }
  const update = await Model.findByIdAndUpdate(isExist._id, updateData, {
    new: true,
    session,
    runValidators: true,
  });
  if (!update) {
    throwError(`unable to update ${model} for email verification`);
  }
  if (!isExist.password) {
    // send password as email
    const sendEmail = await Emails.Verification({
      name: `${isExist.name} ${isExist.surname}`,
      email: isExist.email,
      token: pass.password,
      subject: 'Account Password',
      company: 'Warqad.com',
      title: 'Account Password',
      message:
        'Please use the following password to login, and change it as soon as possible.',
    });
    if (!sendEmail.ok) {
      throwError(sendEmail.message || 'Sending password failed');
    }
  }

  return update;
};
