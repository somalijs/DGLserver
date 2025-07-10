import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';

import { throwError } from '../../func/Error.js';
import getStoreModel from '../../models/Store.js';
import mongoose from 'mongoose';

const getStores = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, status, type, bank } = req.query;
    let query: {
      _id?: mongoose.Types.ObjectId;
      isActive?: boolean;
      isDeleted: boolean;
    } = {
      isDeleted: false,
    };
    if (id) {
      query._id = new mongoose.Types.ObjectId(id as string);
    }

    if (['active', 'inactive'].includes(status as string)) {
      query.isActive = status === 'active' ? true : false;
    }
    const Store = getStoreModel();
    const find = await Store.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'banks',
          localField: '_id',
          foreignField: 'store',
          as: 'banks',
        },
      },
      {
        $unwind: {
          path: '$banks',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'sale.store._id',
          as: 'sales',
        },
      },
      {
        $lookup: {
          from: 'agents',
          localField: '_id',
          foreignField: 'store',
          as: 'agents',
        },
      },
      {
        $addFields: {
          total: {
            $round: [
              {
                $sum: '$sales.amount',
              },
              2,
            ],
          },
          bankID: '$banks._id',
          agents: {
            $size: '$agents',
          },
        },
      },
      {
        $unwind: {
          path: '$agents',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          status: {
            $cond: { if: '$isActive', then: 'active', else: 'inactive' },
          },
          name: { $toUpper: '$name' },
        },
      },
      {
        $project: {
          sales: 0,
        },
      },
    ]);
    let resData = find;
    if (!resData.length) {
      throwError(id ? 'Store not found' : 'Stores not found');
      return;
    }
    if (type === 'options') {
      if (bank === 'false') {
        resData = find
          .filter((item) => !item.banks.length)
          .map((item) => ({ value: item._id, label: item.name }));
      } else {
        resData = find.map((item) => ({ value: item._id, label: item.name }));
      }
    }

    res.status(200).json(id ? resData[0] : resData);
  }
);

export default getStores;
