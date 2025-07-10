import mongoose from 'mongoose';
import { name_idType } from './Config.js';

type BankType = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  type: 'bank' | 'drawer';
  currency: 'KSH' | 'USD';
  store?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  by?: name_idType;
  isActive?: boolean;
};

export default BankType;
