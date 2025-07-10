import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import zodFields from '../../../zod/Fields.js';
import mongoose from 'mongoose';
import getAgentModel from '../../../models/Agent.js';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import { codeEncryption } from '../../../func/Encryptions.js';
import VerificationType from '../../../types/Verification.js';
import Verification from '../../../services/verification/index.js';
import Emails from '../../../Emails/Index.js';
import addLog from '../../../services/Logs.js';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';

const Schema = z.object({
  email: zodFields.email,
});
const addNewEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { _id } = req.params;

    const data = Schema.parse(req.body);
    const { email } = data;
    const id = _id;
    const Model = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // check if agent exist
      const isExist = await Model.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);
      if (!isExist) {
        throwError('Agent not found');
        return;
      }
      if (isExist.email === email) {
        throwError(
          'Please enter a different email address than your current one'
        );
      }
      // check if another user has the eamil
      const isEmailInUse = await Model.findOne({
        email,
        _id: { $ne: id },
      }).session(session);
      if (isEmailInUse && isEmailInUse.isEmailVerified) {
        throwError(
          `Email is already in use by agent (${isEmailInUse.name} ${isEmailInUse.surname})`
        );
      } else if (isEmailInUse && !isEmailInUse.isEmailVerified) {
        throwError(
          `Email is already in use by agent (${isEmailInUse.name} ${isEmailInUse.surname}). But email is not verified yet.`
        );
      }

      // update email field if current email is not verified
      if (!isExist.isEmailVerified) {
        const updateCurrent = await Model.findOneAndUpdate(
          { _id: isExist._id },
          { email: email },
          { new: true, session, runValidators: true }
        );
        if (!updateCurrent) {
          throwError('Email field updating failed');
          return;
        }
      }
      // create email verification token

      const token = await codeEncryption.generateOtp(4);
      const createTokenData: VerificationType = {
        type: 'emailVerification',
        model: 'agent',
        agent: {
          name: `${isExist.name} ${isExist.surname}`,
          _id: isExist._id,
        },
        email: email,
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
        email: email,
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
            action: `sent email verification to ${email}`,
          },

          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Email Verification Token Sent Successfully',
      });
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);
export default addNewEmail;
