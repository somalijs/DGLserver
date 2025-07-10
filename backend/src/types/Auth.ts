import mongoose from 'mongoose';
import { ProfileDocument } from '../models/Profile.js';

export type EmailLoginType = {
  Model: mongoose.Model<ProfileDocument>;
  email: string;
  password: string;
  session?: mongoose.ClientSession;
};
