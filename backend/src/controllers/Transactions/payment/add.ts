import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import { z } from 'zod';
import zodFields from '../../../zod/Fields.js';
import Enums from '../../../func/Enums.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import getSupplierModel from '../../../models/Supplier.js';
import getCustomerModel from '../../../models/Customer.js';
import getAgentModel from '../../../models/Agent.js';
import getBankModel from '../../../models/Bank.js';
import getTransactionModel from '../../../models/Transaction.js';
import Refs from '../../../func/gen/Refs.js';
import addLog from '../../../services/Logs.js';

const base = z.object({
  date: zodFields.date,
  model: z
    .enum(Enums.paymentTypeModels as [string, ...string[]])
    .refine((val) => !!val, { message: 'type is required' }),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  id: z.string().min(1, 'Id is required'),
});
const currencySchema = z.object({
  currency: z
    .enum(Enums.currencies as [string, ...string[]])
    .refine((val) => !!val, { message: 'currency is required' }),
});
const toSchema = z.object({
  to: z.string().min(1, 'Id is required'),
});
const fromSchema = z.object({
  from: z.string().min(1, 'Id is required'),
});
const createPayment = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { date, model, amount, id } = base.parse(req.body);
    let currency = 'KSH';
    let accountCurrency;
    if (req.role === 'admin') {
      currency = currencySchema.parse(req.body).currency;
    }
    // sart session
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Supplier = getSupplierModel();
      const Customer = getCustomerModel();
      const Agent = getAgentModel();
      const Bank = getBankModel();
      const Transaction = getTransactionModel();
      let createData: any = {
        type: 'payment',
        date,
        currency,
        amount,
      };
      let isExist;
      if (model === 'supplier') {
        isExist = await Supplier.findOne({
          _id: id,
          isDeleted: false,
        }).session(session);
        if (isExist) {
          createData.payment = {
            model: 'supplier',
            supplier: {
              name: isExist.name,
              _id: isExist._id,
            },
          };
        }
        if (req.role === 'admin') {
          const fromID = fromSchema.parse(req.body).from;
          const isBank = await Bank.findOne({
            _id: fromID,
            currency,
            isDeleted: false,
          }).session(session);

          if (!isBank) {
            throwError(`bank with ${fromID} not found`);
            return;
          }
          accountCurrency = isBank.currency;
          createData.from = {
            _id: isBank._id,
            name: isBank.name,
          };
        }
      } else if (model === 'customer') {
        isExist = await Customer.findOne({
          _id: id,
          isDeleted: false,
        }).session(session);
        if (isExist) {
          createData.payment = {
            model: 'customer',
            customer: {
              name: isExist.name,
              _id: isExist._id,
            },
          };
          if (req.role === 'admin') {
            const toID = toSchema.parse(req.body).to;
            const isBank = await Bank.findOne({
              _id: toID,
              currency,
              isDeleted: false,
            }).session(session);

            if (!isBank) {
              throwError(`bank with ${toID} not found`);
              return;
            }
            accountCurrency = isBank.currency;
            createData.to = {
              _id: isBank._id,
              name: isBank.name,
            };
          }
        }
      } else if (model === 'agent') {
        isExist = await Agent.findOne({
          _id: id,
          isDeleted: false,
        }).session(session);
        if (isExist) {
          createData.payment = {
            model: 'agent',
            agent: {
              name: isExist.name,
              _id: isExist._id,
            },
          };
          if (req.role === 'admin') {
            const fromID = fromSchema.parse(req.body).from;
            const isBank = await Bank.findOne({
              _id: fromID,
              currency,
              isDeleted: false,
            }).session(session);
            if (!isBank) {
              throwError(`bank with ${fromID} not found`);
              return;
            }
            accountCurrency = isBank.currency;
            createData.from = {
              _id: isBank._id,
              name: isBank.name,
            };
          }
        }
      } else {
        throwError('Invalid model');
        return;
      }
      if (!isExist) {
        throwError(`${model} not found`);
        return;
      }
      if (req.role !== 'admin') {
        const isBank = await Bank.findOne({
          store: req.store,
          isDeleted: false,
        })
          .session(session)
          .sort({ createdAt: -1 });
        if (!isBank) {
          throwError(`your store has no account for payment`);
          return;
        }
        accountCurrency = isBank.currency;
        if (['agent', 'supplier'].includes(model)) {
          createData.from = {
            _id: isBank._id,
            name: isBank.name,
          };
        } else {
          createData.to = {
            _id: isBank._id,
            name: isBank.name,
          };
        }
      }
      const getRefs = await Transaction.distinct('ref');
      createData.ref = Refs({ ids: getRefs, length: 5, prefix: 'TS' });
      if (accountCurrency !== currency) {
        throwError('currency mismatch');
        return;
      }
      const creates = await Transaction.create(
        [
          {
            ...createData,
            by: {
              _id: req.id!,
              name: req.names!,
            },
          },
        ],
        { session }
      );
      if (!creates.length) {
        throwError('Transaction Creation Failed');
        return;
      }
      const create: any = creates[0];
      // add logs
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'payment',
            _id: create._id,
          },
          action: 'create',
          new: createData,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(create);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);

export default createPayment;
