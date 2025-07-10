import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import getTransactionModel from '../../../models/Transaction.js';
import { throwError } from '../../../func/Error.js';
import getBankModel from '../../../models/Bank.js';

const getPayments = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, date } = req.query;

    const isAdmin = req.role === 'admin';
    // const isManger = req.role === 'manager';
    // const isStaff = req.role === 'staff';

    let match: any = {
      isDeleted: false,
      type: 'payment',
    };
    if (date) {
      match.date = date;
    }
    let bankID;
    if (!isAdmin) {
      const isBank = await getBankModel()
        .findOne({
          store: req.store,
          isDeleted: false,
        })
        .sort({ createdAt: -1 });
      if (!isBank) {
        throwError('you store has no associated account for payments', 400);
        return;
      }
      bankID = new mongoose.Types.ObjectId(isBank._id);
    }

    if (id) {
      match['_id'] = new mongoose.Types.ObjectId(id as string);
    }
    const Transaction = getTransactionModel();

    const transactions = await Transaction.aggregate([
      {
        $match: {
          ...match,
          $or: [{ 'to._id': bankID }, { 'from._id': bankID }],
        },
      },
      {
        $addFields: {
          profileName: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$payment.model', 'agent'] },
                  then: '$payment.agent.name',
                },
                {
                  case: { $eq: ['$payment.model', 'customer'] },
                  then: '$payment.customer.name',
                },
                {
                  case: { $eq: ['$payment.model', 'supplier'] },
                  then: '$payment.supplier.name',
                },
              ],
              default: null,
            },
          },
          bank: {
            $cond: {
              if: { $ifNull: ['$from.name', false] },
              then: '$from.name',
              else: '$to.name',
            },
          },
          model: '$payment.model',
        },
      },
      {
        $addFields: {
          viewBox: {
            profile: '$model',
            name: '$profileName',
            date: '$date',
            amount: '$amount',
            currency: '$currency',
            bank: '$bank',
          },
          byName: '$by.name',
        },
      },
    ]);
    if (!transactions.length) {
      let msg = ``;
      if (id) {
        msg = `Payment not Found `;
      } else {
        msg = `No Payments Found ${date ? `on ${date}` : ''}`;
      }
      throwError(msg);
    }
    res.status(200).json(transactions);
  }
);

export default getPayments;
