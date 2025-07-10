import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../func/Error.js';
import getStoreModel from '../../models/Store.js';
import addLog from '../../services/Logs.js';

const storeActivation = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Store = getStoreModel();
      const isExist = await Store.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!isExist) {
        throwError(`store with id ${id} not found`);
        return;
      }

      // make isActive opposite
      const update = await Store.findOneAndUpdate(
        { _id: id },
        { $set: { isActive: !isExist.isActive } },
        {
          new: true,
          session,
          runValidators: true,
        }
      );
      if (!update) {
        throwError('Failed to update store');
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
          action: 'create',
          new: {
            status: update.isActive ? 'active' : 'inactive',
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
          `Store ${update.isActive ? 'activated' : 'deactivated'} successfully`
        );
    } catch (error) {
      await handleTransactionError({ session, error });
    }
  }
);

export default storeActivation;
