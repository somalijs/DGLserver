import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import getTransactionModel from '../../../models/Transaction.js';
import { throwError } from '../../../func/Error.js';
import getBankModel from '../../../models/Bank.js';

const getPayouts = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, date } = req.query;

    const isAdmin = req.role === 'admin';
    // const isManger = req.role === 'manager';
    // const isStaff = req.role === 'staff';

    let match: any = {
      isDeleted: false,
      type: 'payout',
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
        throwError('you store has no associated account for payouts', 400);
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
                  case: { $eq: ['$payout.model', 'agent'] },
                  then: '$payout.agent.name',
                },
                {
                  case: { $eq: ['$payout.model', 'customer'] },
                  then: '$payout.customer.name',
                },
                {
                  case: { $eq: ['$payout.model', 'supplier'] },
                  then: '$payout.supplier.name',
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
          model: '$payout.model',
        },
      },
    ]);
    if (!transactions.length) {
      let msg = ``;
      if (id) {
        msg = `Payout not Found `;
      } else {
        msg = `No Payouts Found ${date ? `on ${date}` : ''}`;
      }
      throwError(msg);
    }
    res.status(200).json(transactions);
  }
);

export default getPayouts;
