import mongoose from 'mongoose';
import { env } from './env.js';

interface MongoConfigOptions {
  uri?: string;
}

export async function connectMongo(options?: MongoConfigOptions): Promise<typeof mongoose> {
  const uri = options?.uri || env.MONGODB_URI;

  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: env.NODE_ENV !== 'production', // Build indexes in dev, manage via migrations in prod
    });

    console.log(`✅ [MongoDB] Connected successfully to: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('❌ [MongoDB] Connection failed:', error);
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  console.log('📦 [MongoDB] Pool connected to server');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ [MongoDB] Pool error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB] Disconnected from server');
});

export async function disconnectMongo(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 [MongoDB] Connection closed gracefully');
  } catch (error) {
    console.error('❌ [MongoDB] Error closing connection:', error);
  }
}
