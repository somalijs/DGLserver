import { z } from 'zod';

import moment from 'moment';

const genderEnum = ['male', 'female'] as const;
const profileEnums = ['admin', 'manager', 'staff'] as const;
const zodFields = {
  email: z.string().email('Please enter a valid email address'),
  gender: z.enum(genderEnum),
  role: z.enum(profileEnums),
  // Date must be valid AND NOT in future
  date: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      'Date must be in format DD/MM/YYYY'
    )
    .refine((val) => moment(val, 'DD/MM/YYYY', true).isValid(), {
      message: 'Date is not a valid calendar date',
    }),
  dateFree: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      'Date must be in format DD/MM/YYYY'
    )
    .refine((val) => moment(val, 'DD/MM/YYYY', true).isValid(), {
      message: 'Date is not a valid calendar date',
    }),
};

export default zodFields;
