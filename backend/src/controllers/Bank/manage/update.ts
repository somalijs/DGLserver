import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getBankModel from '../../../models/Bank.js';
import { z } from 'zod';

import { handleTransactionError, throwError } from '../../../func/Error.js';
import mongoose from 'mongoose';
import addLog from '../../../services/Logs.js';
// import getBankModel from '../../../models/Bank.js';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
});

export const updateBank = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { name } = schema.parse(req.body);
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Model = getBankModel();
      const isExist = await Model.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);
      if (!isExist) {
        throwError(`Bank with id ${id} not found`);
        return;
      }
      if (name === isExist.name) {
        throwError('Name cannot be the same as the current name');
        return;
      }

      const update = await Model.findOneAndUpdate(
        { _id: isExist._id },
        { $set: { name } },
        { new: true, session, runValidators: true }
      );
      if (!update) {
        throwError('Failed to update bank');
        return;
      }
      // add logs
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'bank',
            _id: isExist._id,
          },
          action: 'update',
          new: { name },
          old: { name: isExist.name },
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(update);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);
