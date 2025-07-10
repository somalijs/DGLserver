import getBanks from './controller/get.js';
import getBalance from './controller/getBalance.js';
import addBank from './manage/add.js';
import { updateBank } from './manage/update.js';

const Bank = {
  addBank,
  updateBank,
  getBanks,
  getBalance,
};

export default Bank;
