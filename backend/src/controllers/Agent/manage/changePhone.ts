import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../../types/Express.js";
import Zod from "../../../zod/index.js";
import mongoose from "mongoose";
import { handleTransactionError, throwError } from "../../../func/Error.js";
import getAgentModel from "../../../models/Agent.js";
import addLog from "../../../services/Logs.js";

const changePhone = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const data = Zod.phoneRequied.parse(req.body);
    const { dialCode, number } = data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const Model = getAgentModel();

      const isExist = await Model.findOne({
        _id: req.params._id,
        isDeleted: false,
      }).session(session);
      if (!isExist) {
        throwError("Agent not found");
        return;
      }
      const isSame =
        isExist.phone.dialCode === dialCode && isExist.phone.number === number;
      if (isSame) {
        throwError(
          "Phone nummber cannot be the same as the current phone number"
        );
        return;
      }
      const update = await Model.findOneAndUpdate(
        { _id: isExist._id },
        { $set: { "phone.dialCode": dialCode, "phone.number": number } },
        { session }
      );
      if (!update) {
        throwError("Failed to update phone number");
        return;
      }
      // add logs
      await addLog({
        session,
        data: {
          profile: "agent",
          model: {
            type: "agent",
            _id: isExist._id,
          },
          action: "update",
          new: {
            phoneNUmber: `${dialCode}${number}`,
          },
          old: {
            phoneNUmber: `${isExist.phone.dialCode}${isExist.phone.number}`,
          },
          by: {
            name: req.names!,
            _id: req.id!,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(`Phone number updated to ${dialCode}${number}`);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default changePhone;
