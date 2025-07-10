import mongoose from 'mongoose';
import { name_idType } from './Config.js';

type BaseBankType = {
  _id?: mongoose.Types.ObjectId;
  date: string;
  ref: string;
  amount: number;
  currency: 'KSH' | 'USD';
  isDeleted?: boolean;
  by?: name_idType;
};

// When type is 'sale', include the `sale` field
type SaleTransactionType = BaseBankType & {
  type: 'sale';
  sale: {
    details: { label: string; amount: number; quantity: number }[];
    by: name_idType;
    store?: name_idType;
  };
  to: name_idType;
};

// When type is 'transfer', omit the `sale` field
type TransferTransactionType = BaseBankType & {
  type: 'transfer';
  from: name_idType;
  to: name_idType;
};
type PaymentType = BaseBankType & {
  type: 'payment';
  payment: customerPaymnet | supplierPaymnet | agentPaymnet;
} & (
    | { from: name_idType; to?: name_idType }
    | { from?: name_idType; to: name_idType }
  );

type PayoutType = BaseBankType & {
  type: 'payout';
  payout: customerPaymnet | supplierPaymnet | agentPaymnet;
} & (
    | { from: name_idType; to?: name_idType }
    | { from?: name_idType; to: name_idType }
  );
type customerPaymnet = {
  model: 'customer';
  customer: name_idType;
};
type supplierPaymnet = {
  model: 'supplier';
  supplier: name_idType;
};
type agentPaymnet = {
  model: 'agent';
  agent: name_idType;
};
type TransactionType =
  | SaleTransactionType
  | TransferTransactionType
  | PaymentType
  | PayoutType;

export default TransactionType;
