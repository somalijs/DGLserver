import { z } from 'zod';

export const phoneZod = z.object({
  number: z
    .string()
    .min(5, 'Phone number must be at least 5 characters')
    .regex(/^\d+$/, 'Phone number can only contain digits')
    .optional()
    .or(z.literal('')), // Make number optional
  dialCode: z
    .string()
    .min(1, 'Dial code is required')
    .regex(/^\+\d+$/, "Dial code must start with '+' followed by numbers")
    .optional()
    .or(z.literal('')), // Make dial code optional
});

export const phoneRequied = z.object({
  number: z
    .string()
    .min(5, 'Phone number must be at least 5 characters')
    .regex(/^\d+$/, 'Phone number can only contain digits'),
  dialCode: z
    .string()
    .min(1, 'Dial code is required')
    .regex(/^\+\d+$/, "Dial code must start with '+' followed by numbers"),
});
