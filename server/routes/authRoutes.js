import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { dbStore } from '../db/store.js';
import { generateToken, authenticate } from '../middleware/authMiddleware.js';
import { uploadIdCardImage, generateAuthorizedIdCardViewUrl } from '../services/cloudinaryService.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const WCE_EMAIL_REGEX = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)+@walchandsangli\.ac\.in$/;

export const VALID_ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
];

router.post('/upload-id', upload.single('idCardPhoto'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Please select a valid student ID card photo (JPEG, PNG, or WebP).' });
      return;
    }

    const uploadResult = await uploadIdCardImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(200).json({
      message: 'ID Card uploaded securely.',
      idCard: {
        assetId: uploadResult.assetId,
        resourceType: uploadResult.resourceType,
        format: uploadResult.format,
        secureUrl: uploadResult.secureUrl,
        uploadedAt: uploadResult.uploadedAt,
        isRestricted: uploadResult.isRestricted,
        storageProvider: uploadResult.storageProvider,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to upload student ID card photo.' });
  }
});

router.post('/register', upload.single('idCardPhoto'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      department,
      academicYear,
      skills,
      experienceLevel,
      interests,
      preferredRoles,
      availability,
      bio,
      githubUrl,
      linkedinUrl,
      relevantExperience,
      uploadedIdCardData,
    } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Please provide Full Name, College Email, and Password.' });
      return;
    }

    const safeDepartment = (department && department.trim()) || 'Computer Science and Engineering';
    const safeAcademicYear = (academicYear && VALID_ACADEMIC_YEARS.includes(academicYear)) ? academicYear : 'Third Year';
    const safeBio = (bio && bio.trim()) || 'Walchand College engineering student and active hackathon participant.';

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: 'Password and Confirm Password do not match.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      res.status(400).json({
        error: 'Please enter a valid email address (e.g., name.surname@walchandsangli.ac.in or student@domain.com).',
      });
      return;
    }

    const existingUser = await dbStore.findUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ error: 'A student account with this email already exists. Please Sign In instead.' });
      return;
    }

    let idCard = null;
    if (req.file) {
      idCard = await uploadIdCardImage(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (idCard) idCard.isRestricted = false;
    } else if (uploadedIdCardData) {
      try {
        idCard = typeof uploadedIdCardData === 'string' ? JSON.parse(uploadedIdCardData) : uploadedIdCardData;
        if (idCard) idCard.isRestricted = false;
      } catch (e) {
        // ignore
      }
    }

    if (!idCard) {
      idCard = {
        assetId: `id_card_wce_${Date.now()}`,
        resourceType: 'image',
        format: 'png',
        secureUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        uploadedAt: new Date().toISOString(),
        isRestricted: false,
        storageProvider: 'secure-local-vault',
      };
    }

    let parsedSkills = [];
    if (typeof skills === 'string') {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        parsedSkills = skills.split(',').map(s => ({ name: s.trim(), proficiency: 'Intermediate' }));
      }
    } else if (Array.isArray(skills)) {
      parsedSkills = skills;
    }

    let parsedInterests = [];
    if (typeof interests === 'string') {
      parsedInterests = interests.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(interests)) {
      parsedInterests = interests;
    }

    let parsedRoles = [];
    if (typeof preferredRoles === 'string') {
      parsedRoles = preferredRoles.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(preferredRoles)) {
      parsedRoles = preferredRoles;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await dbStore.createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      department: safeDepartment,
      academicYear: safeAcademicYear,
      skills: parsedSkills,
      experienceLevel: experienceLevel || 'Intermediate',
      interests: parsedInterests,
      preferredRoles: parsedRoles,
      availability: availability || '15-20 hrs/week',
      bio: safeBio,
      githubUrl: githubUrl ? githubUrl.trim() : undefined,
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : undefined,
      relevantExperience: relevantExperience ? relevantExperience.trim() : undefined,
      idCard,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      department: newUser.department,
      academicYear: newUser.academicYear,
    });

    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      message: 'Registration successful! Welcome to WCE Smart Hackathon Team Finder.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: err.message || 'Registration failed due to a server error.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both college email and password.' });
      return;
    }

    const searchIdentifier = String(email).trim();
    const normalizedEmail = searchIdentifier.toLowerCase();
    let user = await dbStore.findUserByEmail(normalizedEmail);
    if (!user) {
      user = await dbStore.findUserByName(searchIdentifier);
    }
    if (!user) {
      res.status(401).json({
        error: 'No student account found for this email or name. Please verify your email or click "Register Student Account".',
      });
      return;
    }

    const rawPassword = String(password);
    const cleanPass = rawPassword.trim();
    let isMatch = false;

    if (user.passwordHash) {
      isMatch = await bcrypt.compare(cleanPass, user.passwordHash);
      if (!isMatch && cleanPass !== rawPassword) {
        isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
      }
    }

    if (!isMatch) {
      res.status(401).json({
        error: 'Incorrect password for this student account. Please re-check your password.',
      });
      return;
    }

    const userId = user.id || user._id?.toString();
    const token = generateToken({
      id: userId,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      academicYear: user.academicYear,
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: { ...safeUser, id: userId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await dbStore.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'Student account not found.' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/id-card', authenticate, async (req, res) => {
  try {
    const user = await dbStore.findUserById(req.user.id);
    if (!user || !user.idCard) {
      res.status(404).json({ error: 'No student ID card found for this account.' });
      return;
    }

    const viewUrl = generateAuthorizedIdCardViewUrl(user.idCard.assetId, user.idCard.secureUrl);
    res.status(200).json({
      assetId: user.idCard.assetId,
      format: user.idCard.format,
      uploadedAt: user.idCard.uploadedAt,
      storageProvider: user.idCard.storageProvider,
      viewUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' });
});

export default router;
