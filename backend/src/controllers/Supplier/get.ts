import expressAsyncHandler from 'express-async-handler';
import { throwError } from '../../func/Error.js';
import mongoose from 'mongoose';

import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import getSupplierModel from '../../models/Supplier.js';

export const getSuppliers = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, type } = req.query;
    const query: any = {
      isDeleted: false,
    };
    if (id) {
      query._id = new mongoose.Types.ObjectId(id as string);
    }
    const Model = getSupplierModel();

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
      throwError(id ? 'Supplier not found' : 'No Suppliers found');
      return;
    }
    let resData = finds;
    if (type === 'select') {
      resData = finds.map((supplier) => {
        return {
          label: supplier.name,
          value: supplier._id,
          balance: supplier.balance,
        };
      });
    }
    res.json(id ? resData[0] : resData);
  }
);

export default getSuppliers;
