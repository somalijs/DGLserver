import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import { handleTransactionError, throwError } from '../../../func/Error.js';
import getAgentModel from '../../../models/Agent.js';
import addLog from '../../../services/Logs.js';
import { z } from 'zod';
import Filters from '../../../func/filters/index.js';
import { TypeFields } from '../../../types/Config.js';
import zodFields from '../../../zod/Fields.js';
type DetailsType = {
  name: string;
  surname: string;
  gender: TypeFields['gender'];
  role: TypeFields['profileRoles'];
};

const Schema = z.object({
  name: z.string().min(3, 'Name should be at least 3 characters long'),
  surname: z.string().min(3, 'Surname should be at least 3 characters long'),
  gender: zodFields.gender,
  role: zodFields.role,
  salary: z.number().min(0, 'Salary should be at least 0'),
  commissionPercentage: z
    .number()
    .min(0, 'Commission percentage should be at least 0')
    .max(100, 'Commission percentage should be at most 100'),
});

const updateDetails = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, surname, gender, role, salary, commissionPercentage } =
      Schema.parse(req.body);
    const Model = getAgentModel();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const isExist = await Model.findOne({
        _id: req.params._id,
        isDeleted: false,
      }).session(session);
      if (!isExist) {
        throwError('Agent not found');
        return;
      }
      const news: any = {
        name,
        surname,
        gender,
        role,
      };

      const olds: any = {
        name: isExist.name,
        surname: isExist.surname,
        gender: isExist.gender,
        role: isExist.role,
      };
      if (salary) {
        news.salary = salary;
        olds.salary = isExist.salary;
      }
      if (commissionPercentage) {
        news.commissionPercentage = commissionPercentage;
        olds.commissionPercentage = isExist.commissionPercentage;
      }
      const datas = Filters.compareObjects<DetailsType>({
        new: news as DetailsType,
        old: olds as DetailsType,
      });

      if (!datas) {
        throwError('No changes found');
        return;
      }
      const update = await Model.findOneAndUpdate(
        isExist._id,
        { ...datas.new },
        { new: true, session, runValidators: true }
      );
      if (!update) {
        throwError('Failed to update details');
        return;
      }

      // add logs
      await addLog({
        session,
        data: {
          profile: 'agent',
          model: {
            type: 'agent',
            _id: isExist._id,
          },
          new: datas?.new,
          old: datas?.old,
          action: 'update',
          by: {
            name: `${isExist.name} ${isExist.surname}`,
            _id: isExist._id,
          },
        },
      });
      await session.commitTransaction();
      res.status(200).json(`Details Updated Successfully`);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default updateDetails;
