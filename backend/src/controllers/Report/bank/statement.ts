import mongoose from 'mongoose';
import { getBankAggregate } from '../../Bank/controller/statement.js';
import getBankModel from '../../../models/Bank.js';

const bankStatement = async ({ id }: { id: mongoose.Types.ObjectId }) => {
  const match: any = {
    isDeleted: false,
    _id: id,
  };
  const data = await getBankAggregate({ Model: getBankModel(), match });
  return data;
};

export default bankStatement;
