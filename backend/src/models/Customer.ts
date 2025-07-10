import { Schema, Document, Model } from 'mongoose';

import { getDatabaseInstance } from '../config/database.js';
import { agentSchema, phoneSchema } from './Config.js';
import { CustomerProfileType } from '../types/InvoiceProfile.js';

// 1. Document type: This represents a single document (row)
export type CustomerDocument = CustomerProfileType & Document;

// 2. Schema
const saleSchema = new Schema<CustomerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    currency: {
      type: String,
      enum: ['KSH', 'USD'],
      required: [true, 'Customer currency is required'],
    },
    phone: {
      type: phoneSchema,
    },
    address: {
      type: String,
    },
    creditLimit: {
      type: Number,
      min: 0,
      required: [true, 'Customer credit limit is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    restricted: {
      type: Boolean,
      default: false,
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
const getCustomerModel = (): Model<CustomerDocument> => {
  const db = getDatabaseInstance('application');

  // Ensure reuse if already compiled
  return (
    (db.models.Customer as Model<CustomerDocument>) ||
    db.model<CustomerDocument>('Customer', saleSchema)
  );
};

export default getCustomerModel;
