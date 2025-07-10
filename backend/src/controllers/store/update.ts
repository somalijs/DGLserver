import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../func/Error.js';
import getStoreModel from '../../models/Store.js';
// import addLog from '../../services/Logs.js';
import Filters from '../../func/filters/index.js';
import addLog from '../../services/Logs.js';

const Schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
  location: z.string(),
});
type DetailsType = {
  name: string;
  location: string;
};
const updateStore = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, location } = Schema.parse(req.body);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Store = getStoreModel();
      // check if store  exist
      const isExist = await Store.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
      if (!isExist) {
        throwError('Store not found');
        return;
      }
      // check name exist in another store
      const isName = await Store.findOne({
        name,
        _id: { $ne: isExist._id },
        isDeleted: false,
      });
      if (isName) {
        throwError('New Store name already exist');
      }

      const news = {
        name,
        location,
      };
      const olds = {
        name: isExist.name,
        location: isExist.location,
      };
      const datas = Filters.compareObjects<DetailsType>({
        new: news as DetailsType,
        old: olds as DetailsType,
      });
      if (!datas) {
        throwError('Make changes to update');
        return;
      }
      const update = await Store.findOneAndUpdate(
        { _id: isExist._id },
        {
          $set: datas.new,
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );
      if (!update) {
        throwError('Unable to update store');
        return;
      }
      //      add logs

      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'agent',
            _id: update._id,
          },
          action: 'update',
          new: datas.new,
          old: datas.old,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });

      await session.commitTransaction();
      res.status(201).json(update);
    } catch (error) {
      await handleTransactionError({ session, error });
      throw error;
    } finally {
      await session.endSession();
    }
  }
);

export default updateStore;
