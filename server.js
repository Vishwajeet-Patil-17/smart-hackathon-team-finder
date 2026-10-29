import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/db/connection.js';
import { initStore } from './server/db/store.js';

// Routes
import authRoutes from './server/routes/authRoutes.js';
import profileRoutes from './server/routes/profileRoutes.js';
import projectRoutes from './server/routes/projectRoutes.js';
import matchingRoutes from './server/routes/matchingRoutes.js';
import invitationRoutes from './server/routes/invitationRoutes.js';
import taskRoutes from './server/routes/taskRoutes.js';
import evaluationRoutes from './server/routes/evaluationRoutes.js';
import discussionRoutes from './server/routes/discussionRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import systemRoutes from './server/routes/systemRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Parse command line arguments (--port 3000 --host 0.0.0.0)
  const args = process.argv.slice(2);
  const portArgIdx = args.indexOf('--port');
  const hostArgIdx = args.indexOf('--host');

  let PORT = 3000;
  if (portArgIdx !== -1 && args[portArgIdx + 1]) {
    PORT = parseInt(args[portArgIdx + 1], 10);
  } else if (process.env.PORT && process.env.PORT !== '8080') {
    PORT = parseInt(process.env.PORT, 10);
  }

  const HOST = hostArgIdx !== -1 && args[hostArgIdx + 1] ? args[hostArgIdx + 1] : '0.0.0.0';

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS and security headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Connect to Database
  await connectDB();
  await initStore();

  // API Routes mounted under /api
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/matching', matchingRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/discussions', discussionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/system', systemRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'Smart Hackathon Team Finder - WCE Sangli',
      timestamp: new Date().toISOString(),
    });
  });

  // Direct ZIP download endpoint for exporting project to local machine
  app.get(['/api/download-zip', '/smart-hackathon-team-finder.zip'], (req, res) => {
    const zipPath = path.resolve(__dirname, 'public', 'smart-hackathon-team-finder.zip');
    res.download(zipPath, 'smart-hackathon-team-finder.zip', err => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'Zip archive not found' });
      }
    });
  });

  // Global API error handler
  app.use((err, req, res, next) => {
    console.error('[API Error]:', err);
    if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    if (!res.headersSent) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Mount Vite middleware in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`  Smart Hackathon Team Finder - WCE Sangli`);
    console.log(`  Mini-Project II Full-Stack Server Running`);
    console.log(`  Local URL: http://${HOST}:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('[Server Error] Failed to start server:', err);
  process.exit(1);
});
