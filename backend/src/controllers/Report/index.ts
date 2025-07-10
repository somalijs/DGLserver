import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import getBankModel from '../../models/Bank.js';
import { throwError } from '../../func/Error.js';

import bankStatement from './bank/statement.js';

const schema = z.object({
  type: z
    .enum(['sale', 'customer', 'supplier', 'agent', 'bank', 'store'])
    .refine((val) => !!val, { message: 'report type is required' }),
});
const idSchema = z.object({
  id: z.string().min(1, 'Id is required'),
});
const report = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { type } = schema.parse(req.body);
    let bank;
    if (type === 'bank') {
      if (req.role !== 'admin') {
        const isBank = await getBankModel()
          .findOne({
            store: req.store,
            isDeleted: false,
          })
          .sort({ createdAt: -1 });
        if (!isBank) {
          throwError('you store has no associated account for statements', 400);
          return;
        }
        bank = isBank;
      } else {
        const { id } = idSchema.parse(req.body);
        const isBank = await getBankModel()
          .findOne({
            _id: id,
            isDeleted: false,
          })
          .sort({ createdAt: -1 });
        if (!isBank) {
          throwError('bank not found', 400);
          return;
        }
        bank = isBank;
      }
      if (!bank) {
        throwError('bank not found', 400);
        return;
      }
      const data = await bankStatement({ id: bank?._id });
      if (!data[0].transactions || !data[0].transactions.length) {
        throwError('No transactions found', 400);
        return;
      }
      res.status(200).json({
        data: data[0].transactions,
        label: `${bank.name}`,
        desc: 'Bank Statement',
      });
      return;
    }
    res.status(200).json(type);
  }
);

export default report;
