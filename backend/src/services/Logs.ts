import mongoose from 'mongoose';
import getLogModel from '../models/Logs.js';
import { LogTypes } from '../types/Logs.js';
import { throwError } from '../func/Error.js';

const addLog = async ({
  data,
  session,
}: {
  data: LogTypes;
  session?: mongoose.ClientSession;
}) => {
  const Log = getLogModel();
  const createData: LogTypes = {
    profile: data.profile,
    model: data.model,
    action: data.action,
    by: data.by,
  };
  if (data?.action === 'login') {
    createData.login = data.login;
  }
  if (['create', 'update'].includes(data?.action)) {
    createData.new = data.new;
  }
  const create = await Log.create([createData], { session });
  if (!create.length) {
    throwError('Log Creation Failed');
  }
  return create[0];
};

export default addLog;
