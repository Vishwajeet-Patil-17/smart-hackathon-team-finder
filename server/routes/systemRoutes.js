import { Router } from 'express';
import { runAllTests } from '../tests/runTests.js';
import { getDatabaseStatus } from '../db/connection.js';
import { getCloudinaryStatus } from '../services/cloudinaryService.js';

const router = Router();

router.get('/status', async (req, res) => {
  const dbStatus = getDatabaseStatus();
  const cloudStatus = getCloudinaryStatus();

  res.status(200).json({
    institution: 'Walchand College of Engineering, Sangli',
    project: 'Smart Hackathon Team Finder (Mini-Project II)',
    database: {
      status: dbStatus.isConnected ? 'Connected & Operational' : 'Connecting...',
      mode: dbStatus.mode === 'mongodb' ? 'MongoDB Atlas (Mongoose)' : 'Local High-Reliability Store',
      isMongoAtlas: dbStatus.isMongoAtlas,
      note: dbStatus.isMongoAtlas
        ? 'Connected to live MongoDB Atlas cluster.'
        : 'Running in Local Store mode. To switch to MongoDB Atlas, set MONGODB_URI in .env.',
    },
    cloudinary: {
      status: cloudStatus.isConfigured ? 'Connected to Cloudinary' : 'Secure Vault Mode Active',
      cloudName: cloudStatus.cloudName,
      folder: cloudStatus.targetFolder,
      note: cloudStatus.isConfigured
        ? 'Student ID photos are saved to Cloudinary folder smart-hackathon-team-finder/id-cards.'
        : 'To connect Cloudinary, provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.',
    },
    matchingEngine: {
      formula: '0.40S + 0.20E + 0.20D + 0.20A',
      type: 'Deterministic Weighted Scoring',
    },
    reliabilityEngine: {
      formula: '0.50T + 0.30D + 0.20P',
      type: 'Deterministic Task & Evaluation Breakdown',
    },
    scopeCompliance: {
      resumeUpload: 'ABSENT (Strictly Excluded)',
      adminApproval: 'ABSENT (Zero-Approval Instant Registration)',
      projectReview: 'ABSENT (Strictly Excluded)',
    },
  });
});

router.get('/tests', async (req, res) => {
  try {
    const report = await runAllTests();
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
