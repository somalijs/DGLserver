import { Schema, Document, Model } from 'mongoose';

import { getDatabaseInstance } from '../config/database.js';
import { agentSchema, phoneSchema } from './Config.js';
import { SupplierProfileType } from '../types/InvoiceProfile.js';

// 1. Document type: This represents a single document (row)
export type SupplierDocument = SupplierProfileType & Document;

// 2. Schema
const saleSchema = new Schema<SupplierDocument>(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
    },
    currency: {
      type: String,
      enum: ['KSH', 'USD'],
      required: [true, 'Supplier currency is required'],
    },
    phone: {
      type: phoneSchema,
    },
    address: {
      type: String,
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
const getSupplierModel = (): Model<SupplierDocument> => {
  const db = getDatabaseInstance('application');

  // Ensure reuse if already compiled
  return (
    (db.models.Supplier as Model<SupplierDocument>) ||
    db.model<SupplierDocument>('Supplier', saleSchema)
  );
};

export default getSupplierModel;
