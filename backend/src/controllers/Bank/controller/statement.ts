import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import getBankModel from '../../../models/Bank.js';

const getStatement = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id }: any = req.query;
    const match: any = {
      isDeleted: false,
    };
    if (id) {
      match._id = new mongoose.Types.ObjectId(id);
    }

    const Model = getBankModel();

    const finds = await getBankAggregate({ Model, match });

    res.status(200).json({ data: finds });
  }
);

export const getBankAggregate = async ({ Model, match }: any) => {
  const finds = await Model.aggregate([
    {
      $match: match,
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
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'to._id',
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $addFields: {
              line: 'add',
              amount: { $round: ['$amount', 2] },
            },
          },
        ],
        as: 'ins',
      },
    },
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'from._id',
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $addFields: {
              line: 'sub',
              // rount amount
              amount: { $round: ['$amount', 2] },
            },
          },
        ],
        as: 'outs',
      },
    },
    {
      $addFields: {
        inTotal: { $sum: '$ins.amount' },
        outTotal: { $sum: '$outs.amount' },
      },
    },
    {
      $addFields: {
        balance: {
          $round: [{ $subtract: ['$inTotal', '$outTotal'] }, 2],
        },
        storeName: '$stores.name',
        transactions: {
          $sortArray: {
            input: {
              $map: {
                input: { $concatArrays: ['$ins', '$outs'] },
                as: 'tx',
                in: {
                  $mergeObjects: [
                    '$$tx',
                    {
                      parsedDate: {
                        $dateFromString: {
                          dateString: '$$tx.date',
                          format: '%d/%m/%Y',
                        },
                      },
                    },
                  ],
                },
              },
            },
            sortBy: { parsedDate: 1, createdAt: 1 },
          },
        },
      },
    },
  ]);
  return finds;
};
export default getStatement;
