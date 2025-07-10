import mongoose from 'mongoose';
import { name_idType } from './Config.js';

export type LogTypes = {
  _id?: mongoose.Types.ObjectId;
  profile: 'user' | 'agent';
  model: {
    type:
      | 'user'
      | 'agent'
      | 'verification'
      | 'agent'
      | 'bank'
      | 'transaction'
      | 'supplier'
      | 'customer'
      | 'payment'
      | 'payout';
    _id: mongoose.Types.ObjectId;
  };
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'reset Password';
  login?: {
    ip: string;
    method: string;
    success: boolean;
  };
  new?: {};
  old?: {};
  by: name_idType;
  createdAt?: number;
};
