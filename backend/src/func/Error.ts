import mongoose from 'mongoose';

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export const throwError = (message: string, statusCode = 400) => {
  // console.log(`Error: ${statusCode}`);
  throw new HttpError(message, statusCode);
};

export async function handleTransactionError({
  session,
  error,
}: {
  session: mongoose.ClientSession;
  error: any;
}) {
  // Only abort transaction if it's still active
  if (session && session.inTransaction()) {
    await session.abortTransaction();
  }
  throw error;
}
