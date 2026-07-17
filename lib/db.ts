import mongoose from 'mongoose';
import { validateEnv } from './env';

const rawMongodbUri = process.env.MONGODB_URI?.trim();
const MONGODB_URI = rawMongodbUri?.replace(/^(?:MONGODB_URI\s*=\s*)+/i, '').trim();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var mongooseCache: MongooseCache | undefined;
}

const globalMongoose = globalThis.mongooseCache || { conn: null, promise: null };

function createMongoosePromise() {
  // Validate all required env vars before attempting to connect
  validateEnv();

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  return mongoose
    .connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,           // Use IPv4 — avoids IPv6 resolution issues on some hosts
      bufferCommands: false,
    })
    .then((mongooseInstance) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ MongoDB connected successfully');
      }
      return mongooseInstance;
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      throw error;
    });
}

export async function connectDB() {
  if (globalMongoose.conn) {
    return globalMongoose.conn;
  }

  if (!globalMongoose.promise) {
    globalMongoose.promise = createMongoosePromise();
    globalThis.mongooseCache = globalMongoose;
  }

  globalMongoose.conn = await globalMongoose.promise;
  return globalMongoose.conn;
}
