import mongoose from 'mongoose';

let connection : mongoose.Connection | null =  null;

export const connectDB = async () => {
  if (connection) {
    console.log('🟢 Using existing MongoDB connection');
    return connection;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    connection = conn.connection; // Store the connection for reuse

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to get a specific database instance (no need to call `mongoose.connect` again)
export const getDatabaseInstance = (dbName:string) => {
  if (!connection) {
    throw new Error('MongoDB connection is not established yet.');
  }
  return connection.useDb(dbName); // Use the `useDb` method to switch between databases
};