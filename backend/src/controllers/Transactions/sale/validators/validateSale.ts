import { ZodError } from 'zod';
import { throwError } from '../../../../func/Error.js';
import getAgentModel from '../../../../models/Agent.js';
import getStoreModel from '../../../../models/Store.js';
import { Sale, saleSchema } from '../add.js';
import getBankModel from '../../../../models/Bank.js';
import { ExpressRequest } from '../../../../types/Express.js';

async function validateSale({
  sales = [],
  currency,
  req,
}: {
  sales: Sale[];
  currency: string;
  req: ExpressRequest;
}) {
  const errorsList: { index: number; message: string }[] = [];
  let datas = [];
  for (const [i, sale] of sales.entries()) {
    const index = i + 1;

    try {
      const obj: any = {
        amount: sale.amount,
        index: index,
        details: sale.details,
      };
      saleSchema.parse(sale);
      const Agent = getAgentModel();
      const Store = getStoreModel();
      const isAdmin = req.role === 'admin';
      const Role = req.role;
      // check agent existance
      const agentQuery: any = {
        isDeleted: false,
        _id: sale.by,
      };

      if (Role === 'manager') {
        agentQuery.store = sale.store;
      } else if (Role === 'staff') {
        agentQuery._id = req.id;
      }

      const isAgent = await Agent.findOne(agentQuery);
      if (!isAgent) {
        throwError(`Agent not found`);
        return;
      }

      const storeQuery: any = {
        isDeleted: false,
      };
      if (isAdmin) {
        storeQuery._id = sale.store;
      } else {
        storeQuery._id = req.store;
      }
      const isStore = await Store.findOne(storeQuery);
      if (!isStore) {
        throwError(`Store not found`);
        return;
      }
      const isBank = await getBankModel()
        .findOne({
          store: isStore._id,
          currency,
          isDeleted: false,
        })
        .sort({ createdAt: 1 });
      if (!isBank) {
        throwError(` Drawer not found`);
        return;
      }

      obj.store = {
        _id: isStore._id,
        name: `${isStore.name}`,
      };

      obj.to = {
        _id: isBank._id,
        name: `${isBank.name}`,
      };
      obj.by = {
        _id: isAgent._id,
        name: `${isAgent.name} ${isAgent.surname}`,
      };
      datas.push(obj);
    } catch (err: any) {
      console.log(err);
      if (err instanceof ZodError) {
        const errorMessage = err.errors
          .map((e) =>
            e.message === 'Required'
              ? `${e.path.join('.') || 'field'} is required`
              : e.message
          )
          .join(' & ');

        errorsList.push({
          index: index,
          message: errorMessage,
        });
      } else {
        errorsList.push({
          index: index,
          message: err.message || 'Unknown error',
        });
      }
    }
  }

  if (errorsList.length > 0) {
    throwError(`${errorsList[0].index} - ${errorsList[0].message}`);
    return;
  }

  return datas;
}

export default validateSale;
