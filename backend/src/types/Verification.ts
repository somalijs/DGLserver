import mongoose from 'mongoose';
import { name_idType } from './Config.js';
// Base shared structure
type BaseVerification = {
  _id?: mongoose.Types.ObjectId;
  token: string;
  expires: number;
  isUsed?: boolean;
  createdAt?: number;
};

// All combinations:
type EmailAgentVerification = BaseVerification & {
  type: 'emailVerification';
  model: 'agent';
  agent: name_idType;
  email: string;
};

type EmailUserVerification = BaseVerification & {
  type: 'emailVerification';
  model: 'user';
  user: name_idType;
  email: string;
};

type VerificationType = EmailAgentVerification | EmailUserVerification;

export type VerificationTypeOfVerify = {
  _id: string;
  token: string;
  model: 'agent' | 'user';
};

export default VerificationType;
