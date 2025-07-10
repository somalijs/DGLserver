import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getAgentModel from '../../../models/Agent.js';
import mongoose, { Model } from 'mongoose';
import { ProfileDocument } from '../../../models/Profile.js';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import { codeEncryption } from '../../../func/Encryptions.js';
import VerificationType from '../../../types/Verification.js';
import Emails from '../../../Emails/Index.js';
import addLog from '../../../services/Logs.js';
import Profile from '../../../services/profile/index.js';
import Verification from '../../../services/verification/index.js';

// @desc    Add agent
// @route   POST /api/v1/agents
// @access  Private
const addAgent = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const Agent: Model<ProfileDocument> = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const create = await Profile.create({ req, Model: Agent, session });
      if (!create) {
        throwError('Agent Creation Failed');
        return;
      }
      // create user email verification
      const token = await codeEncryption.generateOtp(4);
      const createTokenData: VerificationType = {
        type: 'emailVerification',
        model: 'agent',
        agent: {
          name: `${create.name} ${create.surname}`,
          _id: create._id,
        },
        email: create.email,
        token: token.hash,
        expires: token.expire,
      };
      const createToken = await Verification.CreateEmailVerification({
        data: createTokenData,
        session,
      });
      if (!createToken) {
        throwError('Email Verification Token Creation Failed');
      }

      // now send the email
      const sendEmail = await Emails.Verification({
        name: `${create.name} ${create.surname}`,
        email: create.email,
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
            type: 'agent',
            _id: create._id,
          },
          action: 'create',
          new: create.createData,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Agent Created Successfully',
        data: create,
      });
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);

export { addAgent };
