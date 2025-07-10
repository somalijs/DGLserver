import expressAsyncHandler from 'express-async-handler';

import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getAgentModel from '../../../models/Agent.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';

import { z } from 'zod';
import { Auth } from '../../../services/Auth.js';
import Tokens from '../../../func/Tokens.js';
import addLog from '../../../services/Logs.js';

// @desc agent Login
// @route POST /api/v1/agents/login
// @access Public

//set schemas
const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
const emailLogin = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = emailLoginSchema.parse(req.body);
    const Agent = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const findUser = await Agent.aggregate([
        {
          $match: {
            email,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'stores',
            localField: 'store',
            foreignField: '_id',
            as: 'stores',
          },
        },
        {
          $unwind: {
            path: '$stores',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            storeID: '$stores._id',
          },
        },
      ]);
      const isExist = findUser[0];
      if (!isExist) {
        throwError('Invalid Credentials');
        return;
      }

      // // check if 3 attempt fail
      // await Auth.checkIfThreeAttemptFail({
      //   profile: 'agent',
      //   id: isExist._id,
      //   session,
      // });
      const login = await Auth.emailLogin({
        Model: Agent,
        email,
        password,
        session,
      });

      const user = login.data;

      if (!login.ok) {
        if (user) {
          await addLog({
            data: {
              profile: 'agent',
              model: {
                type: 'agent',
                _id: user?._id,
              },
              action: 'login',
              login: {
                ip: req.ip as string,
                method: 'email login',
                success: false,
              },
              by: {
                name: `${user.name} ${user.surname}`,
                _id: user._id,
              },
            },
          });
        }
        throwError(login.message || 'Something went wrong');
        return;
      }
      if (!isExist.isEmailVerified) {
        throwError('Your Email is not verified yet.');
      }
      if (!isExist.isActive) {
        throwError('Your account is not active, please contact support.');
      }
      // set token to cookie
      if (user) {
        await Tokens.setCookie({
          name: 'agentAuth',
          id: user._id,
          res,
        });

        // add Log
        await addLog({
          session,
          data: {
            profile: 'agent',
            model: {
              type: 'agent',
              _id: user._id,
            },
            action: 'login',
            login: {
              ip: req.ip as string,
              method: 'email login',
              success: true,
            },
            by: {
              name: `${user.name} ${user.surname}`,
              _id: user._id,
            },
          },
        });
        await session.commitTransaction();
      
        res.status(200).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          storeName: isExist?.storeName,
          homePath: '/',
        });
      } else {
        throwError('agent details not found');
      }
    } catch (error: any) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);

export { emailLogin };
