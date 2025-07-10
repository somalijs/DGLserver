import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../func/Error.js';
import getStoreModel from '../../models/Store.js';
import addLog from '../../services/Logs.js';

const Schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
  location: z.string().optional(),
});
const addStore = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, location } = Schema.parse(req.body);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Store = getStoreModel();
      // check if store name exist
      const isName = await Store.findOne({
        name,
        isDeleted: false,
      });
      if (isName) {
        throwError('Store  already exist');
      }
      const createData = {
        name,
        location,
      };
      const store = await Store.create(
        [
          {
            ...createData,
            by: {
              name: req.names!,
              _id: req.id!,
            },
          },
        ],
        { session }
      );
      if (!store.length) {
        throwError('Store Creation Failed');
      }
      // add logs
      // add Log
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'agent',
            _id: store[0]._id,
          },
          action: 'create',
          new: createData,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      //
      await session.commitTransaction();
      res.status(201).json(store);
    } catch (error) {
      await handleTransactionError({ session, error });
      throw error;
    } finally {
      await session.endSession();
    }
  }
);

export default addStore;
