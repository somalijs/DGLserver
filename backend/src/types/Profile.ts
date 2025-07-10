import mongoose from 'mongoose';
import { phoneType, genderType, name_idType } from './Config.js';

type ProfileType = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  surname: string;
  email: string;
  phone: phoneType;
  gender: genderType;
  role: 'admin' | 'manager' | 'staff';
  password: string;
  store?: mongoose.Types.ObjectId;
  salary?: number;
  commissionPercentage?: number;
  //
  isActive: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  by: name_idType;
  createdAt?: number;
};

export type ProfileEmailVerifyType = {
  model: 'agent' | 'user';
  _id: string;
  token: string;
};
export default ProfileType;
