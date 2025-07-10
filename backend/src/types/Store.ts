import mongoose from 'mongoose';
import { name_idType } from './Config.js';

type StoreType = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  location?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  by: name_idType;

  createdAt?: number;
};

export default StoreType;
