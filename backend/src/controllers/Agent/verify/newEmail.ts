import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../../types/Express.js";
import getAgentModel from "../../../models/Agent.js";
import mongoose from "mongoose";
import { handleTransactionError, throwError } from "../../../func/Error.js";

import addLog from "../../../services/Logs.js";
import Profile from "../../../services/profile/index.js";
import Verification from "../../../services/verification/index.js";

// @desc verify profile email
// @route PUT /api/v1/agents/verifyProfileEmail/:_id/:token
// @access Private

const verifyNewEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { token, _id } = req.params;
    if (!token || !_id) {
      throwError("Token and Id are required");
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Model = getAgentModel();
      //check if exist
      const isExist = await Model.findOne({
        _id: _id,
        isDeleted: false,
      }).session(session);
      if (!isExist) {
        throwError("Agent not found");
        return;
      }
      if (!isExist.isEmailVerified) {
        throwError("Please use profile email verification first");
        return;
      }
      // verify email verification token
      const verify = await Verification.verifyEmailVerification({
        _id: _id,
        token: token,
        model: "agent",
        session,
      });
      if (!verify) {
        throwError("Verification Failed");
        return;
      }
      // update email profile
      const updateEmail = await Profile.updateEmail({
        Model,
        profile: "agent",
        email: verify.email,
        id: isExist._id,
        session,
      });
      if (!updateEmail) {
        throwError("Email Update Failed");
        return;
      }
      // add Log
      await addLog({
        session,
        data: {
          profile: "agent",
          model: {
            type: "agent",
            _id: updateEmail._id,
          },
          action: "update",
          new: {
            action: `Email updated from ${isExist.email} to ${updateEmail.email}`,
          },

          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res
        .status(200)
        .json({ seccess: true, message: "Email Updated Successfully" });
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);
export default verifyNewEmail;
