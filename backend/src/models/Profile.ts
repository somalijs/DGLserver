import mongoose from 'mongoose';
import ProfileType from '../types/Profile.js';
import { bySchema, phoneSchema } from './Config.js';
import Enums from '../func/Enums.js';
import bcrypt from 'bcrypt';
export type ProfileDocument = ProfileType &
  mongoose.Document & {
    matchPassword(candidatePassword: string): Promise<boolean>;
  };

const profileSchema = new mongoose.Schema<ProfileDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    surname: {
      type: String,
      required: [true, 'Surname is required'],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: phoneSchema,
    },
    gender: {
      type: String,
      enum: Enums.gender,
      required: [true, 'Gender is required'],
    },
    role: {
      type: String,
      enum: Enums.profileRoles,
      required: [true, 'Role is required'],
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [
        function () {
          return this.role !== 'admin';
        },
        'Store is required for non-admins',
      ],
    },
    salary: {
      type: Number,
      min: 0,
      default: 0,
    },
    commissionPercentage: {
      type: Number,
      min: 0,
      default: 0,
      max: 100,
    },
    password: String,
    isActive: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
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
profileSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};
export default profileSchema;
