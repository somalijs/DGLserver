import { Schema, Document, Model } from 'mongoose';
import TransactionType from '../types/Transaction.js';
import { getDatabaseInstance } from '../config/database.js';
import {
  agentSchema,
  bankSchema,
  customerSchema,
  saleDetailSchema,
  storeSchema,
  supplierSchema,
} from './Config.js';
import Enums from '../func/Enums.js';

// 1. Document type: This represents a single document (row)
export type TransactionDocument = TransactionType & Document;

const saleSchema = new Schema(
  {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale id is required'],
    },
    details: {
      type: [saleDetailSchema],
    },
    store: {
      type: storeSchema,
    },
    by: {
      type: agentSchema,
      required: [true, 'Agent is required'],
    },
  },
  { _id: false }
);
const paymentSchema = new Schema(
  {
    model: {
      type: String,
      enum: Enums.paymentTypeModels,
      required: [true, 'Payment Model is required'],
    },
    customer: customerSchema,
    supplier: supplierSchema,
    agent: agentSchema,
  },
  { _id: false }
);

// 2. Schema
const transactionSchema = new Schema<TransactionDocument>(
  {
    date: {
      type: String,
      validate: {
        validator: function (value: string) {
          // Regex to match dd/mm/yyyy format with basic day/month validity
          return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(
            value
          );
        },
        message: 'Date must be in format DD/MM/YYYY',
      },
      required: [true, 'Transaction date is required'],
    },
    type: {
      type: String,
      enum: Enums.transactionTypes,
      required: [true, 'Transaction type is required'],
    },
    ref: {
      type: String,
      unique: [true, 'Transaction ref must be unique'],
      required: [true, 'Transaction ref is required'],
    },
    currency: {
      type: String,
      enum: ['KSH', 'USD'],
      required: [true, 'Transaction currency is required'],
    },
    amount: {
      type: Number,
      min: 0,
      required: [true, 'Transaction amount is required'],
    },
    to: {
      type: bankSchema,
      required: function () {
        return (
          (this as any).payment?.model === 'customer' ||
          this.type === 'sale' ||
          (this as any).payout?.model === 'supplier' ||
          (this as any).payout?.model === 'agent'
        );
      },
    },
    from: {
      type: bankSchema,
      required: function () {
        return (
          (this as any).payment?.model === 'supplier' ||
          (this as any).payout?.model === 'customer' ||
          (this as any).payment?.model === 'agent'
        );
      },
    },
    sale: {
      type: saleSchema,
      required: function () {
        return this.type === 'sale';
      },
    },
    payment: {
      type: paymentSchema,
      required: function () {
        return this.type === 'payment';
      },
    },
    payout: {
      type: paymentSchema,
      required: function () {
        return this.type === 'payout';
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    by: {
      type: agentSchema,
      required: [true, 'creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// 3. Model getter
const getTransactionModel = (): Model<TransactionDocument> => {
  const db = getDatabaseInstance('application');

  // Ensure reuse if already compiled
  return (
    (db.models.Transaction as Model<TransactionDocument>) ||
    db.model<TransactionDocument>('Transaction', transactionSchema)
  );
};

export default getTransactionModel;
