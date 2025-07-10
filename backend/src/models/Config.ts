import mongoose from 'mongoose';
import { name_idType } from '../types/Config.js';
import Enums from '../func/Enums.js';
import { Schema } from 'mongoose';

export const name_idSchema = new mongoose.Schema<name_idType>({
  name: String,
  _id: mongoose.Schema.Types.ObjectId,
});
export const bySchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agent',
};
export const phoneSchema = new mongoose.Schema<
  { number: string; dialCode: string } & mongoose.Document
>({
  _id: false,
  number: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  dialCode: {
    type: String,
    required: [true, 'Dial code is required'],
  },
});

export const loginSchema = new mongoose.Schema<
  { ip: string; method: string; success: boolean } & mongoose.Document
>({
  _id: false,
  ip: {
    type: String,
    required: [true, 'IP address is required'],
  },
  method: {
    type: String,
    required: [true, 'Method is required'],
  },
  success: {
    type: Boolean,
    required: [true, 'Success is required'],
  },
});

export const modelSchema = new mongoose.Schema<
  { type: string; _id: mongoose.Schema.Types.ObjectId } & mongoose.Document
>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Model is required'],
  },
  type: {
    type: String,
    enum: Enums.models,
    required: [true, 'Type is required'],
  },
});

export const bankSchema = new mongoose.Schema<
  { name: string; _id: mongoose.Schema.Types.ObjectId } & mongoose.Document
>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Bank is required'],
  },
  name: {
    type: String,
    required: [true, 'Bank name is required'],
  },
});

export const storeSchema = new mongoose.Schema<
  { name: string; _id: mongoose.Schema.Types.ObjectId } & mongoose.Document
>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Store is required'],
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
  },
});

export const saleDetailSchema = new mongoose.Schema(
  {
    label: { type: String, required: [true, 'Label is required'] },
    amount: { type: Number, required: [true, 'Amount is required'] },
    quantity: { type: Number, required: [true, 'Quantity is required'] },
  },
  { _id: false }
);

export const agentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, ref: 'Agent' }, // or any relevant model
    name: { type: String, required: true },
  },
  { _id: false } // prevents creation of extra _id for subdocuments
);
export const customerSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' }, // or any relevant model
    name: { type: String, required: true },
  },
  { _id: false } // prevents creation of extra _id for subdocuments
);
export const supplierSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier' }, // or any relevant model
    name: { type: String, required: true },
  },
  { _id: false } // prevents creation of extra _id for subdocuments
);
