import { Model } from 'mongoose';
import { getDatabaseInstance } from '../config/database.js';
import profileSchema, { ProfileDocument } from './Profile.js';

// Function to get the model for a specifc database
const getAgentModel = (): Model<ProfileDocument> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.Agent as Model<ProfileDocument>) ||
    db.model<ProfileDocument>('Agent', profileSchema)
  );
};

export default getAgentModel;
