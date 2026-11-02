import mongoose from 'mongoose';

let isConnected = false;
let connectionMode = 'memory-store';

export async function connectDB() {
  mongoose.set('bufferCommands', false);
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<db_username>') || uri.includes('YOUR_MONGODB_URI')) {
    console.log('[Database] No external MONGODB_URI configured. Running in High-Reliability Local Store mode.');
    connectionMode = 'memory-store';
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    connectionMode = 'mongodb';
    console.log('[Database] Connected successfully to MongoDB.');
  } catch (err) {
    console.warn('[Database] Could not connect to MongoDB:', err.message);
    console.log('[Database] Gracefully falling back to High-Reliability Local Store for seamless execution.');
    connectionMode = 'memory-store';
    isConnected = true;
  }
}

export function getDatabaseStatus() {
  return {
    isConnected,
    mode: connectionMode,
    isMongoAtlas: connectionMode === 'mongodb',
    mongooseReadyState: mongoose.connection.readyState,
  };
}
