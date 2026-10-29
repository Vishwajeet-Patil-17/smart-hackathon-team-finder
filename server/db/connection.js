import dotenv from 'dotenv';
dotenv.config({ override: true });
import mongoose from 'mongoose';

let isConnected = false;
let connectionMode = 'memory-store';

const ATLAS_FALLBACK_URI = 'mongodb+srv://hackteam:Hackteam%40123@cluster0.9dvxfih.mongodb.net/hackathon-team-finder?retryWrites=true&w=majority';

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
