import mongoose, { Model } from 'mongoose';
import { LogTypes } from '../types/Logs.js';
import Enums from '../func/Enums.js';
import { loginSchema, modelSchema, name_idSchema } from './Config.js';
import { getDatabaseInstance } from '../config/database.js';

export type LogDocument = LogTypes & Model<mongoose.Document>;

const logSchema = new mongoose.Schema<LogDocument>(
  {
    profile: {
      type: String,
      enum: Enums.profiles,
      required: [true, 'Profile is required'],
    },
    model: {
      type: modelSchema,
      required: [true, 'Model is required'],
    },
    action: {
      type: String,
      enum: Enums.logActions,
      required: [true, 'Action is required'],
    },
    by: {
      type: name_idSchema,
      required: [true, 'Creator is required'],
    },

    //
    new: {},
    old: {},
    login: {
      type: loginSchema,
      required: [
        function () {
          return this.action === 'login';
        },
        'Login details is required',
      ],
    },
  },
  {
    timestamps: true,
  }
);

const getLogModel = (): Model<LogDocument> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.Log as Model<LogDocument>) ||
    db.model<LogDocument>('Log', logSchema)
  );
};

export default getLogModel;
