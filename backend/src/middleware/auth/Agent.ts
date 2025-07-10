import expressAsyncHandler from 'express-async-handler';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';
//import getAgentModel from "../../models/Agent.js";
import jwt from 'jsonwebtoken';
import Tokens from '../../func/Tokens.js';
import JwtAuthCookieReturnType from '../../types/Jwt.js';
import getAgentModel from '../../models/Agent.js';
import { throwError } from '../../func/Error.js';
import mongoose from 'mongoose';
const Agent = expressAsyncHandler(
  async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    const token = Tokens.getCookie({
      name: 'agentAuth',
      res,
      req,
      error: true,
    });
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtAuthCookieReturnType;
    //

    const finds = await getAgentInfo({
      id: decoded.id,
    });
    const find = finds[0];
    // const find = await Agent.findById(decoded.id);

    if (!find) {
      throwError('Invalid Credentials', 401);
      return;
    }
    req.id = find._id;
    req.name = find.name;
    req.surname = find.surname;
    req.names = `${find.name} ${find.surname}`;
    req.phoneNumber = find?.phone?.number
      ? `${find.phone.dialCode}${find.phone.number}`
      : '';
    req.gender = find.gender;
    req.phone = find.phone;
    req.email = find.email;
    req.store = find.store;
    req.role = find.role;
    req.password = find.password;
    req.status = find.isActive ? 'active' : 'inactive';
    req.isEmailVerified = find.isEmailVerified;
    req.stores = find.stores;
    req.isActive = find.isActive;
    req.db = find.role === 'admin' ? 'application' : find.stores?.[0]?.name;
    next();
  }
);

function getAgentInfo({ id }: { id: string }) {
  const find = getAgentModel().aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: 'isDeleted',
        foreignField: 'isDeleted',
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $addFields: {
              storeID: '$_id',
            },
          },
          {
            $lookup: {
              from: 'banks',
              localField: '_id',
              foreignField: 'store',
              as: 'banks',
            },
          },
          {
            $unwind: {
              path: '$banks',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              bankID: '$banks._id',
            },
          },
        ],
        as: 'stores',
      },
    },
    {
      $addFields: {
        stores: {
          $cond: {
            if: { $eq: ['$role', 'admin'] },
            then: '$stores', // keep all stores for admin
            else: {
              $filter: {
                input: '$stores',
                as: 'store',
                cond: { $eq: ['$$store._id', '$store'] }, // only match agent's store
              },
            },
          },
        },
      },
    },
  ]);

  return find;
}
export default Agent;
