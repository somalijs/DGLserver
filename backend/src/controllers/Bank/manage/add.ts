import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import getBankModel from '../../../models/Bank.js';
import { z } from 'zod';
import Enums from '../../../func/Enums.js';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import mongoose from 'mongoose';
import addLog from '../../../services/Logs.js';
import getStoreModel from '../../../models/Store.js';
// import getBankModel from '../../../models/Bank.js';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
  type: z
    .enum(Enums.BankTypes as [string, ...string[]])
    .refine((val) => !!val, { message: 'Account type is required' }),
  currency: z
    .enum(Enums.currencies as [string, ...string[]])
    .refine((val) => !!val, { message: 'Currency is required' }),
  store: z.string().optional(),
});
const addBank = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, type, currency, store } = schema.parse(req.body);
    const addData: any = {
      name,
      type,
      currency,
    };
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Model = getBankModel();
      if (store) {
        const isStore = await getStoreModel().findOne({
          _id: store,
          isDeleted: false,
        });
        if (!isStore) {
          throwError(`Store with id ${store} not found`);
          return;
        }
        addData.store = isStore._id;
      }
      const create = await Model.create(
        [
          {
            ...addData,
            by: {
              name: req.names!,
              _id: req.id!,
            },
          },
        ],
        { session }
      );
      if (!create.length) {
        throwError('Bank Creation Failed');
        return;
      }
      // add logs
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'bank',
            _id: create[0]._id,
          },
          action: 'create',
          new: addData,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(create);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);

export default addBank;
