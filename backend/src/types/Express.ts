import { Request, Response, NextFunction } from 'express';
import { phoneType } from './Config.js';
import mongoose from 'mongoose';
type Store = {
  name: string;
  _id: mongoose.Types.ObjectId;
};
type profile = {
  id?: mongoose.Types.ObjectId;
  name?: string;
  surname?: string;
  names?: string;
  phoneNumber?: string;
  gender?: string;
  phone?: phoneType;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
  stores?: Store[];

  store?: mongoose.Types.ObjectId;
  isActive?: boolean;
  db?: string;
};
export type ExpressRequest = Request & profile;
export type ExpressResponse = Response;
export type ExpressNextFunction = NextFunction;
