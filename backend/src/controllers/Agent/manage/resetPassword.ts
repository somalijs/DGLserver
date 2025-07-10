import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import getAgentModel from '../../../models/Agent.js';
import addLog from '../../../services/Logs.js';
import { z } from 'zod';
import { passwordEncryption } from '../../../func/Encryptions.js';
import Emails from '../../../Emails/Index.js';
import isRequest from '../../../services/isRequest/index.js';

const Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPassword = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { email } = Schema.parse(req.body);
    const Model = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const isExist = await Model.findOne({ email, isDeleted: false }).session(
        session
      );
      if (!isExist) {
        throwError('Agent not found');
        return;
      }
      //check if email is verified
      if (!isExist.isEmailVerified) {
        throwError('Your Email is not verified yet. please contact support.');
        return;
      }
      // check if user is active
      if (!isExist.isActive) {
        throwError('Your account is not active, please contact support.');
        return;
      }
      // check if agent request password 3 times last 30 minutes
      const count = await isRequest.isRequestPassword({
        count: 3,
        profile: 'agent',
        id: isExist._id,
      });
      if (count) {
        throwError(
          'You have requested password reset 3 times, please try again after 30 minutes. '
        );
        return;
      }
      //genarate password
      const pass = await passwordEncryption.generate();
      const updateData = {
        password: pass.hash,
      };
      // update password
      const update = await Model.findOneAndUpdate(
        { _id: isExist._id },
        updateData,
        { session, new: true, runValidators: true }
      );
      if (!update) {
        throwError('Failed to update password');
        return;
      }
      // send password to email
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
        throwError(sendEmail.message || 'Sending Password Failed');
        return;
      }
      // add logs
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'agent',
            _id: isExist._id,
          },
          action: 'reset Password',
          new: {
            action: `new password sent to ${isExist.email}`,
          },
          by: {
            name: `${isExist.name} ${isExist.surname}`,
            _id: isExist._id,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json('password sent successfully');
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default resetPassword;
