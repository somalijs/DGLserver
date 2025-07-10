import expressAsyncHandler from 'express-async-handler';
import { handleTransactionError, throwError } from '../../func/Error.js';
import mongoose from 'mongoose';

import addLog from '../../services/Logs.js';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import getSupplierModel from '../../models/Supplier.js';

export const restricted = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    const Model = getSupplierModel();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const isExist = await Model.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!isExist) {
        throwError('Supplier not found');
        return;
      }

      const update = await Model.findOneAndUpdate(
        { _id: isExist._id },
        { $set: { restricted: !isExist.restricted } },
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
            type: 'supplier',
            _id: isExist._id,
          },
          action: 'update',
          new: {
            restricted: !isExist.restricted ? 'restricted' : 'unrestricted',
          },
          old: {
            restricted: isExist.restricted ? 'unrestricted' : 'restricted',
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
          `Supplier ${
            !isExist.restricted ? 'restricted' : 'unrestricted'
          } Successfully`
        );
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default restricted;
