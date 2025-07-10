import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import { phoneRequied } from '../../zod/Config.js';
import { handleTransactionError, throwError } from '../../func/Error.js';
import mongoose from 'mongoose';
import getSupplierModel from '../../models/Supplier.js';
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
  address: z.string().optional(),
  phone: phoneRequied.optional(),
});
const addSupplier = expressAsyncHandler(async (req: any, res: any) => {
  const data = schema.parse(req.body);
  const { name, address, phone, currency } = data;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const Model = getSupplierModel();
    // check if name exist
    const isName = await Model.findOne({
      name,
      isDeleted: false,
    });
    if (isName) {
      throwError('Supplier name already exist');
    }
    const createData = {
      name,
      address,
      phone,
      currency,
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
      throwError('Failed to add supplier');
    }
    // add Logs
    await addLog({
      session,
      data: {
        profile: 'agent',
        model: {
          type: 'supplier',
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

export default addSupplier;
