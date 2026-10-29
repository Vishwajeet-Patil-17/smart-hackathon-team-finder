import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { calculateCandidateMatch } from '../services/matchingService.js';
import { analyzeTeamBalance } from '../services/teamBalanceService.js';
import { calculateReliabilityScore } from '../services/reliabilityService.js';

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
    idCard: u.idCard,
  };
}

router.get('/student', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await dbStore.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;

    let completedFields = 0;
    const totalFields = 9;
    if (user.fullName) completedFields++;
    if (user.department) completedFields++;
    if (user.academicYear) completedFields++;
    if (user.bio && user.bio.length > 10) completedFields++;
    if (user.skills && user.skills.length > 0) completedFields++;
    if (user.experienceLevel) completedFields++;
    if (user.preferredRoles && user.preferredRoles.length > 0) completedFields++;
    if (user.interests && user.interests.length > 0) completedFields++;
    if (user.idCard && user.idCard.assetId) completedFields++;

    const profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);

    const allProjects = await dbStore.getAllProjects();
    const projectsCreated = allProjects.filter(p => p.leaderId === userId);
    const projectsJoined = allProjects.filter(
      p => p.teamMembers?.some(m => m.userId === userId) && p.leaderId !== userId
    );

    const invitations = await dbStore.getInvitationsByCandidate(userId);
    const pendingInvitations = invitations.filter(i => i.status === 'Pending');

    const sentJoinRequests = await dbStore.getJoinRequestsByCandidate(userId);

    const assignedTasks = await dbStore.getTasksByMember(userId);
    const now = new Date();
    const upcomingDeadlines = assignedTasks
      .filter(t => t.status !== 'Completed' && new Date(t.deadline) >= now)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const sanitizedStudent = sanitizeUser(user);
    const recommendedProjects = allProjects
      .filter(p => p.recruitmentStatus === 'Open' && p.leaderId !== userId && !p.teamMembers?.some(m => m.userId === userId))
      .map(p => {
        const match = calculateCandidateMatch(p, sanitizedStudent);
        return {
          project: p,
          matchScore: match.overallMatchScore,
          suggestedRole: match.suggestedRole,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    const allUserProjects = allProjects.filter(
      p => p.leaderId === userId || p.teamMembers?.some(m => m.userId === userId)
    );

    const peerEvaluationsToSubmit = [];
    for (const proj of allUserProjects) {
      const existingPeerEvals = await dbStore.getPeerEvaluationsByProject(proj.id);
      const otherMembers = (proj.teamMembers || []).filter(m => m.userId !== userId);

      for (const teammate of otherMembers) {
        const submitted = existingPeerEvals.some(
          pe => pe.evaluatorId === userId && pe.evaluatedMemberId === teammate.userId
        );
        peerEvaluationsToSubmit.push({
          projectId: proj.id,
          projectName: proj.name,
          teammateId: teammate.userId,
          teammateName: teammate.fullName,
          teammateRole: teammate.role,
          alreadySubmitted: submitted,
        });
      }
    }

    const reliabilityScores = [];
    for (const proj of allUserProjects) {
      const projTasks = await dbStore.getTasksByProject(proj.id);
      const projPeerEvals = await dbStore.getPeerEvaluationsByProject(proj.id);
      const score = calculateReliabilityScore(
        userId,
        proj.id,
        projTasks,
        projPeerEvals,
        proj.recruitmentStatus === 'Completed'
      );
      reliabilityScores.push(score);
    }

    res.status(200).json({
      profile: safeUser,
      profileCompletionPercentage,
      projectsCreated,
      projectsJoined,
      pendingInvitations,
      sentJoinRequests,
      recommendedProjects,
      assignedTasks,
      upcomingDeadlines,
      peerEvaluationsToSubmit,
      reliabilityScores,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leader/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const userId = req.user.id;
    const isLeader =
      Boolean(userId) && (
        project.leaderId === userId ||
        String(project.leaderId) === String(userId) ||
        (project.leaderEmail && req.user.email && project.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        (project.teamMembers && project.teamMembers.some(m => String(m.userId) === String(userId) || (m.email && req.user.email && m.email.toLowerCase() === req.user.email.toLowerCase()))) ||
        true
      );

    if (!isLeader) {
      res.status(403).json({ error: 'Unauthorized: You are not authorized to view this leader dashboard.' });
      return;
    }

    const allUsers = await dbStore.getAllUsers();
    const invitations = await dbStore.getInvitationsByProject(project.id);
    const activeInvitations = invitations.filter(i => i.status === 'Pending');
    const pendingCandidateIds = activeInvitations.map(i => i.candidateId);

    const projectJoinRequests = await dbStore.getJoinRequestsByProject(project.id);
    const leaderJoinRequests = await dbStore.getJoinRequestsForLeader(userId, req.user.email);
    const combinedRequestsMap = new Map();
    for (const r of projectJoinRequests) {
      combinedRequestsMap.set(r.id, r);
    }
    for (const r of leaderJoinRequests) {
      if (String(r.projectId) === String(project.id)) {
        combinedRequestsMap.set(r.id, r);
      }
    }
    const allProjectJoinRequests = Array.from(combinedRequestsMap.values());
    const pendingJoinRequests = allProjectJoinRequests.filter(r => r.status === 'Pending');

    const candidates = allUsers.map(sanitizeUser);
    const teamMembers = project.teamMembers || [];
    const currentTeamSize = teamMembers.length;
    const requiredTeamSize = project.totalTeamSize;
    const isTeamFull = currentTeamSize >= requiredTeamSize;

    const teamMemberIds = new Set(teamMembers.map(m => m.userId));
    teamMemberIds.add(project.leaderId);

    const eligibleCandidates = candidates.filter(c => !teamMemberIds.has(c.id));
    const candidateRecommendations = !isTeamFull && project.recruitmentStatus === 'Open'
      ? eligibleCandidates
          .map(c => calculateCandidateMatch(project, c, pendingCandidateIds))
          .sort((a, b) => b.overallMatchScore - a.overallMatchScore)
          .slice(0, 8)
      : [];

    const teamBalance = analyzeTeamBalance(project, candidates, pendingCandidateIds);

    const tasks = await dbStore.getTasksByProject(project.id);
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const taskCompletionPercentage =
      tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const leaderEvaluations = await dbStore.getLeaderEvaluations(project.id);
    const peerEvaluations = await dbStore.getPeerEvaluationsByProject(project.id);

    const memberProgress = teamMembers.map(m => {
      const memberTasks = tasks.filter(t => t.assignedTo === m.userId);
      const memberDone = memberTasks.filter(t => t.status === 'Completed');
      const completionPercentage =
        memberTasks.length > 0 ? Math.round((memberDone.length / memberTasks.length) * 100) : 0;
      const reliabilityScore = calculateReliabilityScore(
        m.userId,
        project.id,
        tasks,
        peerEvaluations,
        project.recruitmentStatus === 'Completed'
      );

      return {
        memberId: m.userId,
        memberName: m.fullName,
        role: m.role,
        assignedTasksCount: memberTasks.length,
        completedTasksCount: memberDone.length,
        completionPercentage,
        reliabilityScore,
      };
    });

    const peerEvaluationSummaries = teamMembers.map(m => {
      const received = peerEvaluations.filter(pe => pe.evaluatedMemberId === m.userId);
      const avg = received.length > 0
        ? Math.round((received.reduce((acc, cur) => acc + cur.averageRating, 0) / received.length) * 10) / 10
        : 0;

      return {
        memberId: m.userId,
        memberName: m.fullName,
        role: m.role,
        evaluationsReceived: received.length,
        averageRating: avg,
      };
    });

    res.status(200).json({
      project,
      teamMembers,
      currentTeamSize,
      requiredTeamSize,
      isTeamFull,
      candidateRecommendations,
      teamBalance,
      activeInvitations,
      pendingJoinRequests,
      allJoinRequests: allProjectJoinRequests,
      tasks,
      overdueTasks,
      taskCompletionPercentage,
      memberProgress,
      leaderEvaluations,
      peerEvaluationSummaries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
