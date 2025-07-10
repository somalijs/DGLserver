import { ExpressResponse } from "../types/Express.js";
import mongoose from "mongoose";

export type setTokenType = {
  name: string;
  id: mongoose.Types.ObjectId;
  res: ExpressResponse;
};
