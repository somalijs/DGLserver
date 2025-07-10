import expressAsyncHandler from 'express-async-handler';
import { throwError } from '../../func/Error.js';
import mongoose from 'mongoose';

import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import getCustomerModel from '../../models/Customer.js';

export const getCustomers = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, type } = req.query;
    const query: any = {
      isDeleted: false,
    };
    if (id) {
      query._id = new mongoose.Types.ObjectId(id as string);
    }
    const Model = getCustomerModel();

    const finds = await Model.aggregate([
      {
        $match: query,
      },
      {
        $addFields: {
          phoneNumber: {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $ifNull: ['$phone.dialCode', ''] }, ''] },
                  { $gt: [{ $ifNull: ['$phone.number', ''] }, ''] },
                ],
              },
              then: { $concat: ['$phone.dialCode', '$phone.number'] },
              else: '$$REMOVE',
            },
          },
        },
      },
    ]);
    if (!finds.length) {
      throwError(id ? 'Customer not found' : 'No Customers Found');
      return;
    }
    let resData = finds;
    if (type === 'select') {
      resData = finds.map((d) => {
        return {
          label: d.name,
          value: d._id,
          balance: d.balance,
        };
      });
    }
    res.json(id ? resData[0] : resData);
  }
);

export default getCustomers;
