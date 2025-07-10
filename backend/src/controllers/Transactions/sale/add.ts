import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import zodFields from '../../../zod/Fields.js';

import { Refs } from '../../../func/gen/index.js';
import validateSale from './validators/validateSale.js';
import validateDetails from './validators/validateDetails.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import getSaleModel from '../../../models/Sale.js';
import getTransactionModel from '../../../models/Transaction.js';

import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
export const detailSchema = z.object({
  label: z.string().min(2, 'Label is required'),
  quantity: z
    .number()
    .gt(0, 'Quantity must be greater than 0')
    .int('Quantity must be a whole number'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
});
export const saleSchema = z.object({
  by: z.string().min(2, 'Seller id is required'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  details: z.array(z.any()).optional(),

  store: z.string().min(2, 'store id is required'),
  index: z.number().int('Index must be a whole number'),
});
const schema = z.object({
  date: zodFields.date,

  sales: z.array(z.any()).min(1, 'At least one detail is required'),
});

export type Sale = z.infer<typeof saleSchema>;
export type Detail = z.infer<typeof detailSchema>;
const addSale = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const currency = 'KSH';
    const { sales, date } = schema.parse(req.body);
    // validate sales
    const data = await validateSale({ sales, currency, req });
    for (const sale of data || []) {
      await validateDetails({
        details: sale.details as Detail[],
        index: sale.index as number,
        amount: sale.amount as number,
      });
    }
    // start sesstion
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Sale = getSaleModel();
      const Transaction = getTransactionModel();

      const salesRefs = await Sale.distinct('ref');
      const saleCreateData = {
        ref: Refs({ ids: salesRefs, length: 5, prefix: 'TS' }),
        date,
        by: {
          name: req.names!,
          _id: req.id!,
        },
      };
      const createSale = await Sale.create([saleCreateData], { session });
      const sale = createSale[0];
      if (!sale) {
        throwError(`Sale creation failed`);
      }

      for (const item of data || []) {
        const transRefs = await Transaction.distinct('ref');

        const base = {
          date,
          type: 'sale',
          ref: Refs({ ids: transRefs, length: 5, prefix: 'TR' }),
          currency: currency,
          amount: item.amount,
          to: item.to,
        };
        const saleBase: any = {
          by: item.by,
          id: sale._id,
        };
        if (item.store) {
          saleBase.store = item.store;
        }
        if (item.details && item.details.length) {
          saleBase.details = item.details;
        }
        const create = await Transaction.create(
          [
            {
              ...base,
              sale: saleBase,
              by: {
                _id: req.id!,
                name: req.names!,
              },
            },
          ],
          { session }
        );
        if (!create.length) {
          throwError('Transaction creation failed');
        }
      }
      await session.commitTransaction();
      res.status(200).json('all submitted');
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);

export default addSale;
