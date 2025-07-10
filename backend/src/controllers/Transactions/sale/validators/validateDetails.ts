import { ZodError } from 'zod';
import { Detail, detailSchema } from '../add.js';
import { throwError } from '../../../../func/Error.js';

async function validateDetails({
  details = [],
  index,
  amount,
}: {
  details: Detail[];
  index: number;
  amount: number;
}) {
  const errorsList: { index: number; message: string }[] = [];

  for (const detail of details) {
    try {
      if (detail) detailSchema.parse(detail);
    } catch (err: any) {
      if (err instanceof ZodError) {
        const errorMessage = err.errors
          .map((e) =>
            e.message === 'Required'
              ? `${e.path.join('.') || 'field'} is required`
              : e.message
          )
          .join(' & ');

        errorsList.push({
          index: index,
          message: errorMessage,
        });
      } else {
        errorsList.push({
          index: index,
          message: err.message || 'Unknown error',
        });
      }
    }
  }

  if (errorsList.length > 0) {
    throwError(`${errorsList[0].index} - ${errorsList[0].message}`);
    return;
  }
  const detailsTotal = details.reduce(
    (prev, curr) => prev + (curr.quantity || 0) * (curr.amount || 0),
    0
  );
  if (details.length && amount !== detailsTotal) {
    throwError(`${index} - Total amount does not match`);
    return;
  }

  return true;
}

export default validateDetails;
