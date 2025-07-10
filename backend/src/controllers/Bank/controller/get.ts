import expressAsyncHandler from 'express-async-handler';
import getBankModel from '../../../models/Bank.js';
import mongoose from 'mongoose';
import { throwError } from '../../../func/Error.js';

const getBanks = expressAsyncHandler(async (req: any, res: any) => {
  const Model = getBankModel();
  const { select, id, type, currency } = req.query;
  const query: any = {
    isDeleted: false,
  };
  const isAdmin = req.role === 'admin';
  if (id) {
    query._id = new mongoose.Types.ObjectId(id as string);
  }
  if (['bank', 'drawer'].includes(type)) {
    query.type = type;
  }
  if (!isAdmin) {
    query.store = new mongoose.Types.ObjectId(req.store);
  }
  if (currency) {
    query.currency = currency;
  }
  const finds = await Model.aggregate([
    {
      $match: query,
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
        storeName: '$stores.name',
      },
    },
  ]);
  if (!finds.length) {
    throwError(id ? 'Bank not found' : 'There are no banks');
    return;
  }
  let resData = finds;
  if (select === 'option') {
    resData = finds.map((item: any) => {
      return {
        value: item._id,
        type: item.type,
        label: currency ? `${item.name} (${item.currency})` : item.name,
        currency: item.currency,
      };
    });
  }
  res.status(200).json(id ? resData[0] : resData);
});

export default getBanks;
