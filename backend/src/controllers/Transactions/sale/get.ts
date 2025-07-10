import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import getTransactionModel from '../../../models/Transaction.js';
import { throwError } from '../../../func/Error.js';

const getSales = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, date } = req.query;

    const isAdmin = req.role === 'admin';
    // const isManger = req.role === 'manager';
    // const isStaff = req.role === 'staff';

    let match: any = {
      isDeleted: false,
    };
    if (date) {
      match.date = date;
    }
    if (!isAdmin) {
      match = {
        ...match,
        'sale.store._id': new mongoose.Types.ObjectId(req.store),
      };
      if (req.role === 'staff') {
        match = {
          ...match,
          'sale.by._id': new mongoose.Types.ObjectId(req.id),
        };
      }
    }

    if (id) {
      match['sale.id'] = new mongoose.Types.ObjectId(id as string);
    }
    const Transaction = getTransactionModel();

    const transactions = await Transaction.aggregate([
      {
        $match: {
          ...match,
          //'sale.store._id': new mongoose.Types.ObjectId(req.store),
        },
      },
      {
        $lookup: {
          from: 'sales',
          localField: 'sale.id',
          foreignField: '_id',
          as: 'saleData',
        },
      },
      {
        $unwind: '$saleData',
      },
      {
        $addFields: {
          saleRef: '$saleData.ref',
        },
      },
      {
        $project: {
          saleData: 0, // remove intermediate field
        },
      },
    ]);
    if (!transactions.length) {
      let msg = ``;
      if (id) {
        msg = `Sale not Found `;
      } else {
        msg = `No Sales Found ${date ? `on ${date}` : ''}`;
      }
      throwError(msg);
    }
    res.status(200).json(transactions);
  }
);

export default getSales;
