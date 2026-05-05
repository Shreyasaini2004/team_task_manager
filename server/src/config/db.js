import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required in .env');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  console.log('MongoDB connected');
}
