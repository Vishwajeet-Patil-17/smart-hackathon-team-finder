import mongoose from 'mongoose';

let isConnected = false;
let connectionMode = 'memory-store';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('YOUR_MONGODB_URI')) {
    console.log('[Database] MONGODB_URI not configured or placeholder detected. Operating in Memory/Local Store mode.');
    connectionMode = 'memory-store';
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    connectionMode = 'mongodb';
    console.log('[Database] Connected successfully to MongoDB Atlas.');
  } catch (err) {
    console.warn('[Database] Could not connect to MongoDB Atlas at provided URI:', err.message);
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
