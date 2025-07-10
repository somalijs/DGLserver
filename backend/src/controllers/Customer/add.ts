import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import { phoneRequied } from '../../zod/Config.js';
import { handleTransactionError, throwError } from '../../func/Error.js';
import mongoose from 'mongoose';
import getCustomerModel from '../../models/Customer.js';
import addLog from '../../services/Logs.js';
import Enums from '../../func/Enums.js';
const schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
  currency: z
    .enum(Enums.currencies as [string, ...string[]])
    .refine((val) => !!val, { message: 'Currency is required' }),
  creditLimit: z.number().min(0, 'Credit limit should be at least 0'),
  address: z.string().optional(),
  phone: phoneRequied.optional(),
});
const addCustomer = expressAsyncHandler(async (req: any, res: any) => {
  const data = schema.parse(req.body);
  const { name, address, phone, currency, creditLimit } = data;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const Model = getCustomerModel();
    // check if name exist
    const isName = await Model.findOne({
      name,
      isDeleted: false,
    });
    if (isName) {
      throwError('Customer name already exist');
    }
    const createData = {
      name,
      address,
      phone,
      currency,
      creditLimit,
    };
    const create = await Model.create(
      [
        {
          ...createData,
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      ],
      { session }
    );
    if (!create[0]) {
      throwError('Failed to add customer');
    }
    // add Logs
    await addLog({
      session,
      data: {
        profile: 'agent',
        model: {
          type: 'customer',
          _id: create[0]._id,
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
    res.status(201).json(create[0]);
  } catch (error) {
    await handleTransactionError({ session, error });
  } finally {
    await session.endSession();
  }
});

export default addCustomer;
