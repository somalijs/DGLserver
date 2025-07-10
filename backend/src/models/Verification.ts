import mongoose from 'mongoose';
import VerificationType from '../types/Verification.js';
import Enums from '../func/Enums.js';
import { name_idSchema } from './Config.js';
import { getDatabaseInstance } from '../config/database.js';
import { Model } from 'mongoose';
export type VerificationDocument = VerificationType & Model<mongoose.Document>;

const verificationSchema = new mongoose.Schema<VerificationDocument>(
  {
    type: {
      type: String,
      enum: Enums.VerificationTypes,
      required: [true, 'Token type is required'],
    },
    model: {
      type: String,
      enum: Enums.profiles,
      required: [true, 'Token model is required'],
    },
    user: {
      type: name_idSchema,
      required: [
        function () {
          return this.model === 'user';
        },
        'user details is required',
      ],
    },
    agent: {
      type: name_idSchema,
      required: [
        function () {
          return this.model === 'agent';
        },
        'agent details is required',
      ],
    },
    email: {
      type: String,
      required: [
        function () {
          return this.type === 'emailVerification';
        },
        'email is required',
      ],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    expires: {
      type: Number,
      required: [true, 'Token expiration date is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const getVerificationModel = (): Model<VerificationDocument> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.Verification as Model<VerificationDocument>) ||
    db.model<VerificationDocument>('Verification', verificationSchema)
  );
};

export default getVerificationModel;
