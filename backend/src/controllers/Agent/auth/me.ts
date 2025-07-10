import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import { throwError } from '../../../func/Error.js';
import Tokens from '../../../func/Tokens.js';

const getMe = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    if (!req.isActive) {
      await Tokens.deleteCookie('agentAuth', res);
      throwError('You Account is Inactive', 401);
    }
    if (req.role !== 'admin') {
      if (!req.stores?.length) {
        await Tokens.deleteCookie('agentAuth', res);
        throwError('You have no active stores', 401);
      }
    }

    const resData = {
      id: req.id,
      name: req.name,
      surname: req.surname,
      names: req.names,
      phoneNumber: req.phoneNumber,
      gender: req.gender,
      phone: req.phone,
      email: req.email,
      role: req.role,
      status: req.status,
      isEmailVerified: req.isEmailVerified,
      stores: req.stores,
      store: req.store,
      homePath: '/', // include it now that it's safely defined
    };

    res.status(200).json(resData);
  }
);

export default getMe;
