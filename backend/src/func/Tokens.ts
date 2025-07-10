import jwt from 'jsonwebtoken';
import { throwError } from './Error.js';
import { setTokenType } from '../types/Tokens.js';
import { ExpressRequest, ExpressResponse } from '../types/Express.js';
type Props = {
  name: string;
  res: ExpressResponse;
  req: ExpressRequest;
  error: boolean;
};
const Tokens = {
  setCookie: ({ name, id, res }: setTokenType) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    });
    res.cookie(name, token, {
      // path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return token;
  },

  getCookie: ({ name, res, req, error = true }: Props): string => {
    const token = req.cookies?.[name];
    //   console.log('token', token);
    if (error && !token) {
      res.status(401);
      throwError('Keys Are Missing');
    }

    return token;
  },

  deleteCookie: (name: string, res: ExpressResponse) => {
    res.cookie(name, '', {
      path: '/',
      httpOnly: process.env.NODE_ENV !== 'development',
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV !== 'development' ? process.env.DOMAIN : '',
      maxAge: 0,
    });
  },
};

export default Tokens;
