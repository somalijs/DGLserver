import express from 'express';
import Agent from './routes/Agent.js';
import Store from './routes/Store.js';
import Bank from './routes/Bank.js';
import Sale from './routes/Sale.js';
import Supplier from './routes/Supplier.js';
import Customer from './routes/Customer.js';
import Payment from './routes/Payment.js';
import Payouts from './routes/Payouts.js';
import Report from './routes/Report.js';
const v1Routes = (app: express.Application) => {
  const apiVersion = '/api/v1';
  app.use(`${apiVersion}/agents`, Agent);
  app.use(`${apiVersion}/stores`, Store);
  app.use(`${apiVersion}/banks`, Bank);
  app.use(`${apiVersion}/sales`, Sale);
  app.use(`${apiVersion}/suppliers`, Supplier);
  app.use(`${apiVersion}/customers`, Customer);
  app.use(`${apiVersion}/payments`, Payment);
  app.use(`${apiVersion}/payouts`, Payouts);
  app.use(`${apiVersion}/reports`, Report);
};

export default v1Routes;
