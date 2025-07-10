import { throwError } from '../../func/Error.js';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';
import Agent from './Agent.js';

const Protect = {
  agent: Agent,
};

export const Authorize = (...roles: string[]) => {
  if (roles.includes('admin')) {
    roles.push('manager'); // admin implicitly gets manager access
  }

  return (
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    const role = req.role!;
    if (!roles.includes(role)) {
      throwError(
        `You are not authorized to access this route as ${req.role}`,
        401
      );
    }
    next();
  };
};
export default Protect;
