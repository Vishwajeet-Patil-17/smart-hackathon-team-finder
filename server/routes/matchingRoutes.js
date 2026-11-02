import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { calculateCandidateMatch } from '../services/matchingService.js';
import { analyzeTeamBalance } from '../services/teamBalanceService.js';

const router = Router();

function sanitizeUser(u) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    department: u.department,
    academicYear: u.academicYear,
    skills: u.skills || [],
    experienceLevel: u.experienceLevel || 'Intermediate',
    interests: u.interests || [],
    preferredRoles: u.preferredRoles || [],
    availability: u.availability || '15-20 hrs/week',
    bio: u.bio || '',
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    relevantExperience: u.relevantExperience,
  };
}

router.get('/:projectId/candidates', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const currentTeamSize = project.teamMembers?.length || 0;
    const isTeamFull = currentTeamSize >= project.totalTeamSize;
    const isClosed = project.recruitmentStatus !== 'Open';

    if (isTeamFull || isClosed) {
      res.status(200).json({
        recommendations: [],
        status: isTeamFull ? 'Team is currently full.' : 'Recruitment is currently closed.',
        isTeamFull,
        isClosed,
      });
      return;
    }

    const allUsers = await dbStore.getAllUsers();
    const invitations = await dbStore.getInvitationsByProject(project.id);
    const pendingInvitedCandidateIds = invitations
      .filter(i => i.status === 'Pending')
      .map(i => i.candidateId);

    const teamMemberIds = new Set((project.teamMembers || []).map(m => m.userId));
    teamMemberIds.add(project.leaderId);

    const eligibleCandidates = allUsers
      .filter(u => !teamMemberIds.has(u.id))
      .map(sanitizeUser);

    const recommendations = eligibleCandidates.map(candidate =>
      calculateCandidateMatch(project, candidate, pendingInvitedCandidateIds)
    );

    recommendations.sort((a, b) => b.overallMatchScore - a.overallMatchScore);

    res.status(200).json({
      recommendations,
      formula: 'Match Score = 0.40S + 0.20E + 0.20D + 0.20A',
      currentTeamSize,
      totalTeamSize: project.totalTeamSize,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:projectId/balance', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const allUsers = await dbStore.getAllUsers();
    const invitations = await dbStore.getInvitationsByProject(project.id);
    const pendingCandidateIds = invitations
      .filter(i => i.status === 'Pending')
      .map(i => i.candidateId);

    const candidates = allUsers.map(sanitizeUser);
    const analysis = analyzeTeamBalance(project, candidates, pendingCandidateIds);

    res.status(200).json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
