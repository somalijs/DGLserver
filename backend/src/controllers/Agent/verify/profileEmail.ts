import expressAsyncHandler from "express-async-handler";

import { ExpressRequest, ExpressResponse } from "../../../types/Express.js";
import getAgentModel from "../../../models/Agent.js";
import mongoose from "mongoose";
import { handleTransactionError, throwError } from "../../../func/Error.js";

import addLog from "../../../services/Logs.js";
import Profile from "../../../services/profile/index.js";

// @desc verify profile email
// @route PUT /api/v1/agents/verifyProfileEmail/:_id/:token
// @access Private

const profileEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { token, _id } = req.params;

    if (!token || !_id) {
      throwError("Token and Id are required");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const verify = await Profile.verifyProfileEmail({
        _id: _id,
        token: token,
        model: "agent",
        session,
        Model: getAgentModel(),
      });
      if (!verify) {
        throwError("Verification Failed");
        return;
      }
      const user = verify;
      // add Log
      await addLog({
        session,
        data: {
          profile: "agent",
          model: {
            type: "agent",
            _id: user._id,
          },
          action: "update",
          new: [{ action: "email verified" }],
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Verification Success" });
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      session.endSession();
    }
  }
);

export { profileEmail };
