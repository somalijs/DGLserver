import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getAgentModel from '../../../models/Agent.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import addLog from '../../../services/Logs.js';

export const activate = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { _id } = req.params;

    const Model = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const isExist = await Model.findOne({
        _id: _id,
        isDeleted: false,
      }).session(session);

      if (!isExist) {
        throwError('Agent not found');
        return;
      }
      if (!isExist.isActive && !isExist.isEmailVerified) {
        throwError('first verify agent email, for activation');
        return;
      }
      // check if its admin and if so check if there is another admin that is active
      if (isExist.role === 'admin') {
        const find = await Model.findOne({
          role: 'admin',
          _id: { $ne: isExist._id },
          isActive: true,
          isEmailVerified: true,
          isDeleted: false,
        });
        if (!find) {
          throwError('There must be at least one active admin ');
          return;
        }
      }
      const update = await Model.findOneAndUpdate(
        { _id: isExist._id },
        { $set: { isActive: !isExist.isActive } },
        { session, new: true, runValidators: true }
      );

      if (!update) {
        throwError('Failed to update');
        return;
      }

      // Log the change
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'agent',
            _id: isExist._id,
          },
          action: 'update',
          new: {
            status: !isExist.isActive ? 'active' : 'inactive',
          },
          old: {
            status: isExist.isActive ? 'active' : 'inactive',
          },
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });

      await session.commitTransaction();
      res
        .status(200)
        .json(
          `${!isExist.isActive ? 'Activated' : 'Deactivated'} Successfully`
        );
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default activate;
