import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

function sanitizePublicProfile(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    academicYear: user.academicYear,
    skills: user.skills || [],
    experienceLevel: user.experienceLevel || 'Intermediate',
    interests: user.interests || [],
    preferredRoles: user.preferredRoles || [],
    availability: user.availability || '15-20 hrs/week',
    bio: user.bio || '',
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    relevantExperience: user.relevantExperience,
    idCard: user.idCard,
  };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const users = await dbStore.getAllUsers();
    const publicProfiles = users.map(sanitizePublicProfile);
    res.status(200).json({ profiles: publicProfiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await dbStore.findUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }
    res.status(200).json({ profile: sanitizePublicProfile(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
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
    } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (department) updates.department = department.trim();
    if (academicYear) updates.academicYear = academicYear;
    if (skills && Array.isArray(skills)) updates.skills = skills;
    if (experienceLevel) updates.experienceLevel = experienceLevel;
    if (interests && Array.isArray(interests)) updates.interests = interests;
    if (preferredRoles && Array.isArray(preferredRoles)) updates.preferredRoles = preferredRoles;
    if (availability) updates.availability = availability;
    if (bio !== undefined) updates.bio = bio.trim();
    if (githubUrl !== undefined) updates.githubUrl = githubUrl ? githubUrl.trim() : '';
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl ? linkedinUrl.trim() : '';
    if (relevantExperience !== undefined) updates.relevantExperience = relevantExperience ? relevantExperience.trim() : '';

    const updated = await dbStore.updateUser(userId, updates);
    const { passwordHash: _, ...safeUser } = updated;

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
