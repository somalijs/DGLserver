import { Schema, Document, Model } from 'mongoose';

import { getDatabaseInstance } from '../config/database.js';
import { bySchema } from './Config.js';
import SaleType from '../types/Sale.js';

// 1. Document type: This represents a single document (row)
export type SaleDocument = SaleType & Document;

// 2. Schema
const saleSchema = new Schema<SaleDocument>(
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
    ref: {
      type: String,
      unique: [true, 'Sale ref must be unique'],
      required: [true, 'Sale ref is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    by: bySchema,
  },
  {
    timestamps: true,
  }
);

// 3. Model getter
const getSaleModel = (): Model<SaleDocument> => {
  const db = getDatabaseInstance('application');

  // Ensure reuse if already compiled
  return (
    (db.models.Sale as Model<SaleDocument>) ||
    db.model<SaleDocument>('Sale', saleSchema)
  );
};

export default getSaleModel;
