import expressAsyncHandler from 'express-async-handler';
import { z } from 'zod';
import { phoneRequied } from '../../zod/Config.js';
import { handleTransactionError, throwError } from '../../func/Error.js';
import mongoose from 'mongoose';
import getCustomerModel from '../../models/Customer.js';
import addLog from '../../services/Logs.js';
import Enums from '../../func/Enums.js';
import Filters from '../../func/filters/index.js';
const schema = z.object({
  name: z
    .string()
    .min(3, 'Name should be at least 3 characters long')
    .transform((name) => name.toLowerCase().replace(/\s+/g, ' ')),
  creditLimit: z.number().min(0, 'Credit limit should be at least 0'),
  currency: z
    .enum(Enums.currencies as [string, ...string[]])
    .refine((val) => !!val, { message: 'Currency is required' }),
  address: z.string(),
  phone: phoneRequied,
});
type DetailsType = z.infer<typeof schema>;
const updateCustomer = expressAsyncHandler(async (req: any, res: any) => {
  const data = schema.parse(req.body);
  const { id } = req.params;
  const { name, address, phone, currency, creditLimit } = data;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const Model = getCustomerModel();
    // check if exist
    const isExist = await Model.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!isExist) {
      throwError(`Customer with id ${id} not found`);
      return;
    }
    let datas: any = {};
    const news: any = {
      name,
      address,
      currency,
      creditLimit,
    };
    const olds: any = {
      name: isExist.name,
      address: isExist.address,
      currency: isExist.currency,
      creditLimit: isExist.creditLimit,
    };
    let phones;
    if (isExist?.phone?.number) {
      phones = Filters.compareObjects<DetailsType>({
        new: phone as any,
        old: isExist?.phone as any,
      });
    } else {
      phones = {
        new: {
          number: phone.number,
          dialCode: phone.dialCode,
        },
      };
    }
    const details = Filters.compareObjects<DetailsType>({
      new: news as DetailsType,
      old: olds as DetailsType,
    });
    if (!details && !phones) {
      throwError('No changes found');
      return;
    }
    datas = {
      ...details,
    };
    if (phones) {
      datas.new = {
        ...datas.new,
        phone: phone,
      };
      datas.old = {
        ...datas.old,
        phone: isExist.phone,
      };
    }
    // create
    const update = await Model.findOneAndUpdate(
      { _id: isExist._id },
      { $set: { ...datas.new } },
      { new: true, session, runValidators: true }
    );
    if (!update) {
      throwError('Failed to update customer');
      return;
    }

    // add Logs
    await addLog({
      session,
      data: {
        profile: 'agent',
        model: {
          type: 'customer',
          _id: update._id,
        },
        action: 'update',
        new: datas.new,
        old: datas.old,
        by: {
          name: req.names!,
          _id: req.id!,
        },
      },
    });
    await session.commitTransaction();
    res.status(200).json(update);
  } catch (error) {
    await handleTransactionError({ session, error });
  } finally {
    await session.endSession();
  }
});

export default updateCustomer;
