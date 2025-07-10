import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';

import { throwError } from '../../../func/Error.js';
import mongoose from 'mongoose';
import getAgentModel from '../../../models/Agent.js';

const getAgents = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { id, status, type } = req.query;

    let query: {
      _id?: mongoose.Types.ObjectId;
      isActive?: boolean;
      isDeleted: boolean;
      store?: mongoose.Types.ObjectId;
    } = {
      isDeleted: false,
    };
    if (id) {
      query._id = new mongoose.Types.ObjectId(id as string);
    }
    if (['active', 'inactive'].includes(status as string)) {
      query.isActive = status === 'active' ? true : false;
    }
    if (req.role !== 'admin') {
      query.store = new mongoose.Types.ObjectId(req.store);
    }
    const Agent = getAgentModel();
    const find = await Agent.aggregate([
      {
        $match: query,
      },

      // 1. Lookup stores first
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'stores',
        },
      },
      // 2. Then unwind the stores
      {
        $unwind: {
          path: '$stores',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 3. Lookup verifications with $expr
      {
        $lookup: {
          from: 'verifications',
          let: { agentId: '$_id' },
          pipeline: [
            {
              $match: {
                type: 'emailVerification',
                model: 'agent',
                isUsed: false,
                $expr: {
                  $eq: ['$$agentId', '$agent._id'],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: 'verifications',
        },
      },
      {
        $unwind: {
          path: '$verifications',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 4. Add derived fields
      {
        $addFields: {
          status: {
            $cond: { if: '$isActive', then: 'active', else: 'inactive' },
          },
          names: {
            $concat: ['$name', ' ', '$surname'],
          },
          newEmail: '$verifications.email',
          store: { $toUpper: '$stores.name' },
        },
      },
      {
        $project: {
          password: 0,
          verifications: 0,
        },
      },
      // 6. Sort by name
      {
        $sort: {
          names: -1,
        },
      },
    ]);

    if (!find.length) {
      throwError(id ? 'Agent not found' : 'Agents not found');
      return;
    }
    let resData: any = [];
    if (type === 'options') {
      resData = find.map((agent) => {
        return {
          label: agent.names,
          value: agent._id,
        };
      });
    } else {
      resData = find;
    }
    res.status(200).json(id ? resData[0] : resData);
  }
);

export default getAgents;
