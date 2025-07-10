import { Schema, Document, Model } from 'mongoose';
import BankType from '../types/Bank.js';
import { getDatabaseInstance } from '../config/database.js';
import { bySchema } from './Config.js';

// 1. Document type: This represents a single document (row)
export type BankDocument = BankType & Document;

// 2. Schema
const bankSchema = new Schema<BankDocument>(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: [true, 'Account name must be unique'],
      required: [true, 'Bank name is required'],
    },
    type: {
      type: String,
      enum: ['bank', 'drawer'],
      required: [true, 'Bank type is required'],
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    currency: {
      type: String,
      enum: ['KSH', 'USD'],
      required: [true, 'Bank currency is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    by: bySchema,
  },
  {
    timestamps: true,
  }
);

// 3. Model getter
const getBankModel = (): Model<BankDocument> => {
  const db = getDatabaseInstance('application');

  // Ensure reuse if already compiled
  return (
    (db.models.Bank as Model<BankDocument>) ||
    db.model<BankDocument>('Bank', bankSchema)
  );
};

export default getBankModel;
