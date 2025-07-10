import mongoose from 'mongoose';
import StoreType from '../types/Store.js';
import { getDatabaseInstance } from '../config/database.js';
import { Model } from 'mongoose';
import { bySchema } from './Config.js';
export type StoreDocument = StoreType & Model<mongoose.Document>;

const storeSchema = new mongoose.Schema<StoreDocument>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
    },
    location: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
const getStoreModel = (): Model<StoreDocument> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.Store as Model<StoreDocument>) ||
    db.model<StoreDocument>('Store', storeSchema)
  );
};

export default getStoreModel;
