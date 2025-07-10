import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import v1Routes from './v1Routes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
await connectDB();
const app = express();
const allowedValues = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cookieParser());
app.use(
  cors({
    origin: allowedValues, // Your frontend port
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

v1Routes(app);
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get('/', (_, res) => {
  res.send('Welcome to WARQADBOX');
});
// Error handling middleware
app.use(notFound);
app.use(errorHandler);
