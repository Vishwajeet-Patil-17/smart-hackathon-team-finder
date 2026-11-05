import dotenv from 'dotenv';
dotenv.config({ override: true });
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UserModel,
  ProjectModel,
  InvitationModel,
  TaskModel,
  LeaderEvalModel,
  PeerEvalModel,
  TeamMessageModel,
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORE = path.resolve(__dirname, '..', 'db', 'local_store.json');

async function clearDatabase() {
  console.log('======================================================');
  console.log(' SMART HACKATHON TEAM FINDER: DATABASE PURGE UTILITY');
  console.log(' Walchand College of Engineering, Sangli');
  console.log('======================================================');

  // 1. Wipe local store cache
  try {
    const emptyState = {
      users: [],
      projects: [],
      invitations: [],
      tasks: [],
      leaderEvals: [],
      peerEvals: [],
      messages: [],
    };
    fs.writeFileSync(LOCAL_STORE, JSON.stringify(emptyState, null, 2), 'utf-8');
    console.log('✓ Cleared local store cache (local_store.json).');
  } catch (err) {
    console.warn('! Warning clearing local store:', err.message);
  }

  // 2. Connect to MongoDB Atlas if URI is provided
  let uri = (process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri || uri.includes('<username>') || uri.includes('<db_username>') || uri.includes('YOUR_MONGODB_URI')) {
    console.log('ℹ No external MongoDB Atlas connection URI provided in environment.');
    console.log('✓ All local store collections emptied. Schemas preserved.');
    console.log('======================================================');
    process.exit(0);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    const connectOptions = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    };
    if (!uri.includes('authSource=')) {
      connectOptions.authSource = 'admin';
    }

    await mongoose.connect(uri, connectOptions);
    console.log('✓ Connected to MongoDB Atlas.');

    console.log('Deleting all collection documents (preserving collections and schemas)...');

    const [usersRes, projRes, invRes, taskRes, leadRes, peerRes, msgRes] = await Promise.all([
      UserModel.deleteMany({}),
      ProjectModel.deleteMany({}),
      InvitationModel.deleteMany({}),
      TaskModel.deleteMany({}),
      LeaderEvalModel.deleteMany({}),
      PeerEvalModel.deleteMany({}),
      TeamMessageModel.deleteMany({}),
    ]);

    console.log(`✓ Removed ${usersRes.deletedCount} users.`);
    console.log(`✓ Removed ${projRes.deletedCount} projects.`);
    console.log(`✓ Removed ${invRes.deletedCount} invitations / join requests.`);
    console.log(`✓ Removed ${taskRes.deletedCount} tasks.`);
    console.log(`✓ Removed ${leadRes.deletedCount} leader evaluations.`);
    console.log(`✓ Removed ${peerRes.deletedCount} peer evaluations.`);
    console.log(`✓ Removed ${msgRes.deletedCount} team discussion messages.`);
    console.log('======================================================');
    console.log('✓ All database data cleared successfully. Schemas intact.');
    console.log('======================================================');
  } catch (err) {
    console.error('! Error clearing MongoDB Atlas collections:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDatabase();
