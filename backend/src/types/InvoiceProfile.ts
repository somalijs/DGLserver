import mongoose from 'mongoose';
import { name_idType, phoneType } from './Config.js';

type Base = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  currency: 'KSH' | 'USD';
  phone?: phoneType;
  address?: string;
  isActive?: boolean;
  restricted?: boolean;
  isDeleted?: boolean;
  by?: name_idType;
};

type CustomerProfileType = Base & {
  creditLimit: number;
};

type SupplierProfileType = Base;
export { CustomerProfileType, SupplierProfileType };
