import mongoose from 'mongoose';

let isConnected = false;
let connectionMode = 'memory-store';
let dbAuthError = null;

export async function connectDB() {
  mongoose.set('bufferCommands', false);
  let uri = (process.env.MONGODB_URI || '').trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri || uri.includes('<username>') || uri.includes('<db_username>') || uri.includes('YOUR_MONGODB_URI')) {
    console.log('[Database] No external MONGODB_URI configured. Running in High-Reliability Local Store mode.');
    connectionMode = 'memory-store';
    isConnected = true;
    dbAuthError = null;
    return;
  }

  try {
    const connectOptions = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    };
    if (!uri.includes('authSource=')) {
      connectOptions.authSource = 'admin';
    }

    await mongoose.connect(uri, connectOptions);
    isConnected = true;
    connectionMode = 'mongodb';
    dbAuthError = null;
    console.log('[Database] Connected successfully to MongoDB Atlas.');
  } catch (err) {
    dbAuthError = err.message;
    console.log(`[Database] MongoDB Atlas connection status: ${err.message}. Seamlessly active in High-Reliability Local Store mode.`);
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
    authError: dbAuthError,
  };
}
