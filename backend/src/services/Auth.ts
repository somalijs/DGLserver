import mongoose from "mongoose";
import getLogModel from "../models/Logs.js";
import { EmailLoginType } from "../types/Auth.js";
import { throwError } from "../func/Error.js";

async function emailLogin({ Model, email, password, session }: EmailLoginType) {
  // check if profile exists
  const isExist = await Model.findOne({ email, isDeleted: false }).session(
    session || null
  );
  if (!isExist) {
    return { ok: false, message: "Invalid Credentials", data: null };
  }
  // check if password is correct
  const isPasswordCorrect = await isExist.matchPassword(password);
  if (!isPasswordCorrect) {
    return { ok: false, message: "Invalid Credentials", data: isExist };
  }
  return { ok: true, data: isExist };
}

async function checkIfThreeAttemptFail({
  profile,
  id,
  session,
}: {
  profile: string;
  id: mongoose.Types.ObjectId;
  session: mongoose.ClientSession;
}) {
  const Model = getLogModel();

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const objectId = new mongoose.Types.ObjectId(id);

  const match = {
    action: "login",
    profile,
    createdAt: { $gte: tenMinutesAgo },
    "by._id": objectId, // ✅ converted to ObjectId
  };

  const find = await Model.find(match).session(session);

  if (find.length >= 3) {
    throwError("3 Attempt Failed, Please wait 10 minutes");
  }

  return false;
}

export const Auth = {
  emailLogin,
  checkIfThreeAttemptFail,
};
