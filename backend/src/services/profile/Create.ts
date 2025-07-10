import { ExpressRequest } from '../../types/Express.js';
import { ProfileDocument } from '../../models/Profile.js';
import { z } from 'zod';
import { phoneZod } from '../../zod/Config.js';
import Enums from '../../func/Enums.js';
import mongoose from 'mongoose';
import { throwError } from '../../func/Error.js';
import getStoreModel from '../../models/Store.js';

const profileSchema = z.object({
  name: z.string().min(3, 'Name should be at least 3 characters long'),
  surname: z.string().min(3, 'Surname should be at least 3 characters long'),
  email: z.string().email('Please enter a valid email address'),
  phone: phoneZod,
  gender: z
    .enum(Enums.gender as [string, ...string[]])
    .refine((val) => !!val, { message: 'Gender is required' }),
  role: z
    .enum(Enums.profileRoles as [string, ...string[]])
    .refine((val) => !!val, { message: 'Role is required' }),
  salary: z.number().min(0, 'Salary should be at least 0').optional(),
  commissionPercentage: z
    .number()
    .min(0, 'Commission percentage should be at least 0')
    .max(100, 'Commission percentage should be at most 100')
    .optional(),
});
const storeSchema = z.object({
  store: z.string().min(1, 'Store id is required'),
});
const CreateProfile = async ({
  Model,
  req,
  session,
}: {
  Model: mongoose.Model<ProfileDocument>;
  req: ExpressRequest;
  session?: mongoose.ClientSession;
}) => {
  const data = profileSchema.parse(req.body);

  const createData: any = {
    name: data.name,
    surname: data.surname,
    email: data.email,
    phone: data.phone,
    gender: data.gender,
    role: data.role,
    salary: data.salary,
    commissionPercentage: data.commissionPercentage,
  };
  if (data.role !== 'admin') {
    const storeId = storeSchema.parse(req.body).store;
    // check if taht valid mongoose id
    if (!mongoose.isValidObjectId(storeId)) {
      throwError('store id is not valid');
    }
    // check if store exist
    const isStore = await getStoreModel()
      .findOne({
        _id: storeId,
        isDeleted: false,
      })
      .session(session ? session : null);
    if (!isStore) {
      throwError('Store not found');
      return;
    }
    createData.store = isStore._id;
  }
  const profile = await Model.create([createData], { session });
  const plain = profile[0].toObject();
  return {
    ...plain,
    createData,
  };
};

export default CreateProfile;
