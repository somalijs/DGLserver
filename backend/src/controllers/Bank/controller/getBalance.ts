import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import getBankModel from '../../../models/Bank.js';
import { getBankAggregate } from './statement.js';
import { throwError } from '../../../func/Error.js';

const getBalance = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id }: any = req.params;
    if (!id) {
      throwError('Id is required');
    }
    const balance = await getBankBalance(id);
    res.status(200).json(balance);
  }
);

export async function getBankBalance(id: any) {
  const Model = getBankModel();
  const match = {
    _id: new mongoose.Types.ObjectId(id),
    isDeleted: false,
  };
  const find = await getBankAggregate({ Model, match });
  if (!find.length) {
    throw new Error('Bank not found');
  }
  return find[0].balance;
}
export default getBalance;
