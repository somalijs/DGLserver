import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getAgentModel from '../../../models/Agent.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';

import addLog from '../../../services/Logs.js';
import Verification from '../../../services/verification/index.js';
import getVerificationModel from '../../../models/Verification.js';
import Emails from '../../../Emails/Index.js';
import VerificationType from '../../../types/Verification.js';
import { codeEncryption } from '../../../func/Encryptions.js';
import Time from '../../../func/time/index.js';

const resendEmailverification = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { _id } = req.params;

    const Model = getAgentModel();
    const VerificationModel = getVerificationModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const isExist = await Model.findOne({
        _id: _id,
        isDeleted: false,
      });
      if (!isExist) {
        throwError('Agent not found');
        return;
      }
      // find verification
      const isVerification = await VerificationModel.findOne({
        isUsed: false,
        model: 'agent',
        'agent._id': isExist._id,
      }).session(session);
      if (!isVerification) {
        throwError('There is no pending verification for this agent');
        return;
      }
      // console.log(new Date(isVerification.createdAt!).toLocaleString());
      // check if waited at least 3 minutes
      const iswaited = Time.isWaited({
        date: isVerification.createdAt!,
        minute: 1,
      });
      if (!iswaited) {
        throwError('Please wait at least 3 minutes before requesting again');
        return;
      }
      // create new verification

      const token = await codeEncryption.generateOtp(4);
      const createTokenData: VerificationType = {
        type: 'emailVerification',
        model: 'agent',
        agent: {
          name: `${isExist.name} ${isExist.surname}`,
          _id: isExist._id,
        },
        email: isVerification.email,
        token: token.hash,
        expires: token.expire,
      };
      const createVerification = await Verification.CreateEmailVerification({
        data: createTokenData,
        session,
      });
      if (!createVerification) {
        throwError('Email Verification Token Creation Failed');
        return;
      }
      // now send the email
      const sendEmail = await Emails.Verification({
        name: `${isExist.name} ${isExist.surname}`,
        email: isVerification.email,
        token: token.code,
        subject: 'Email Verification',
        company: 'Warqad.com',
        title: 'Email Verification Token',
        message: 'Please use the following token to verify your email address.',
      });
      if (!sendEmail.ok) {
        throwError(
          sendEmail.message || 'Sending Email Verification Token Failed'
        );
      }
      // add Log
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'verification',
            _id: createVerification._id,
          },
          action: 'create',
          new: {
            action: `sent email verification to ${isVerification.email}`,
          },

          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(`Email Verification Resend Successfully`);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default resendEmailverification;
