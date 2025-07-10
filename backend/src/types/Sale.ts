import mongoose from 'mongoose';
import { name_idType } from './Config.js';

type SaleType = {
  _id?: mongoose.Types.ObjectId;
  date: string;
  ref: string;
  isDeleted?: boolean;
  by?: name_idType;
};

export default SaleType;
