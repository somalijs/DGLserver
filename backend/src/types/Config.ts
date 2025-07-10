import mongoose from 'mongoose';

export type phoneType = {
  dialCode: string;
  number: string;
};
export type genderType = 'male' | 'female';
export type name_idType = {
  name: string;
  _id: mongoose.Types.ObjectId;
};

export type TypeFields = {
  gender: 'male' | 'female';
  profileRoles: 'admin' | 'manager' | 'staff';
  profiles: 'user' | 'agent';
};
