import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import Tokens from '../../../func/Tokens.js';

const logout = expressAsyncHandler(
  async (_req: ExpressRequest, res: ExpressResponse) => {
    await Tokens.deleteCookie('agentAuth', res);
    res.status(200).json({ message: 'logged out' });
  }
);

export default logout;
