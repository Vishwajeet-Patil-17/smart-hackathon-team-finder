import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { calculateCandidateMatch } from '../services/matchingService.js';
import { analyzeTeamBalance } from '../services/teamBalanceService.js';
import { calculateReliabilityScore } from '../services/reliabilityService.js';

const router = Router();

function sanitizeUser(u) {
  if (!u) return null;
  const uid = String(u.id || u._id || '');
  return {
    id: uid,
    _id: uid,
    fullName: u.fullName || 'Student',
    email: u.email || '',
    department: u.department || 'Engineering',
    academicYear: u.academicYear || 'Third Year',
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

    const userEmail = (user.email || '').toLowerCase().trim();
    const isUserLeader = (p) =>
      (userId && String(p.leaderId) === String(userId)) ||
      (userEmail && p.leaderEmail && p.leaderEmail.toLowerCase().trim() === userEmail);

    const isUserMember = (p) =>
      (p.teamMembers || []).some(m =>
        (userId && (String(m.userId) === String(userId) || String(m.id) === String(userId) || String(m._id) === String(userId))) ||
        (userEmail && m.email && m.email.toLowerCase().trim() === userEmail)
      );

    const allProjects = await dbStore.getAllProjects();
    const projectsCreated = allProjects.filter(p => isUserLeader(p));
    const projectsJoined = allProjects.filter(p => !isUserLeader(p) && isUserMember(p));

    const invitations = await dbStore.getInvitationsByCandidate(userId, userEmail);
    const pendingInvitations = invitations.filter(i => i.status === 'Pending');

    const sentJoinRequests = await dbStore.getJoinRequestsByCandidate(userId, userEmail);

    const rawAssignedTasks = await dbStore.getTasksByMember(userId, userEmail);
    const now = new Date();
    const assignedTasks = (rawAssignedTasks || []).map(t => {
      const proj = allProjects.find(p => String(p.id || p._id) === String(t.projectId || t.projectId?._id));
      const deadlineDate = new Date(t.deadline);
      const isOverdue = t.status !== 'Completed' && !isNaN(deadlineDate.getTime()) && deadlineDate < now;
      return {
        id: String(t.id || t._id),
        projectId: t.projectId ? String(t.projectId._id || t.projectId) : '',
        projectName: proj ? proj.name : (t.projectName || 'Team Project'),
        title: t.title || 'Untitled Task',
        description: t.description || '',
        assignedTo: String(t.assignedTo || userId),
        assignedToName: t.assignedToName || user.fullName,
        createdBy: String(t.createdBy || proj?.leaderId || ''),
        createdByName: t.createdByName || proj?.leaderName || 'Team Leader',
        priority: t.priority || 'Medium',
        deadline: t.deadline,
        status: t.status || 'Pending',
        isOverdue: Boolean(t.isOverdue || isOverdue),
        completedAt: t.completedAt || null,
        completedOnTime: t.completedOnTime ?? (t.completedAt && t.deadline ? new Date(t.completedAt) <= new Date(t.deadline) : null),
        createdAt: t.createdAt || new Date().toISOString(),
      };
    });
    const upcomingDeadlines = assignedTasks
      .filter(t => t.status !== 'Completed' && new Date(t.deadline) >= now)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const sanitizedStudent = sanitizeUser(user);
    const recommendedProjects = allProjects
      .filter(p => p.recruitmentStatus === 'Open' && !isUserLeader(p) && !isUserMember(p))
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
      p => isUserLeader(p) || isUserMember(p)
    );

    const peerEvaluationsToSubmit = [];
    for (const proj of allUserProjects) {
      const existingPeerEvals = await dbStore.getPeerEvaluationsByProject(proj.id);
      const otherMembers = (proj.teamMembers || []).filter(m =>
        String(m.userId) !== String(userId) && (!userEmail || !m.email || m.email.toLowerCase().trim() !== userEmail)
      );

      for (const teammate of otherMembers) {
        const submitted = existingPeerEvals.some(
          pe => (String(pe.evaluatorId) === String(userId)) && (String(pe.evaluatedMemberId) === String(teammate.userId))
        );
        peerEvaluationsToSubmit.push({
          projectId: proj.id,
          projectName: proj.name,
          projectStatus: proj.recruitmentStatus,
          isCompleted: proj.recruitmentStatus === 'Completed',
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
      score.projectName = proj.name;
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
    let project = await dbStore.findProjectById(projectId);

    const userId = req.user?.id ? String(req.user.id) : (req.user?._id ? String(req.user._id) : '');
    const userEmail = (req.user?.email || '').toLowerCase().trim();

    if (!project) {
      // If projectId is 'auto' or 'current' or wasn't found by raw id, search by leader
      const allProjects = await dbStore.getAllProjects();
      project = allProjects.find(p => {
        const pId = String(p.id || p._id || '');
        if (pId === String(projectId)) return true;
        if (projectId === 'auto' || projectId === 'current' || projectId === 'default') {
          const lId = String(p.leaderId?._id || p.leaderId || '');
          const lEmail = (p.leaderEmail || '').toLowerCase().trim();
          const isTeamLead = (p.teamMembers || []).some(m => {
            const mRole = (m.role || '').toLowerCase();
            const mUid = String(m.userId?._id || m.userId || m.id || '');
            const mEmail = (m.email || '').toLowerCase().trim();
            return (mRole.includes('leader') || mRole.includes('lead')) &&
              ((userId && mUid === userId) || (userEmail && mEmail === userEmail));
          });
          return (Boolean(userId) && lId === userId) || (Boolean(userEmail) && lEmail === userEmail) || isTeamLead;
        }
        return false;
      });
    }

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const projId = String(project.id || project._id || projectId);
    const leaderIdStr = project.leaderId
      ? String(typeof project.leaderId === 'object' ? (project.leaderId._id ?? project.leaderId.id ?? project.leaderId) : project.leaderId)
      : '';
    const leaderEmailStr = (project.leaderEmail || '').toLowerCase().trim();

    const isMemberLeader = (project.teamMembers || []).some(m => {
      const mRole = (m.role || '').toLowerCase();
      const mUserId = String(m.userId?._id || m.userId || m.id || '');
      const mEmail = (m.email || '').toLowerCase().trim();
      const isRoleLeader = mRole.includes('leader') || mRole.includes('lead');
      return isRoleLeader && (
        (Boolean(userId) && mUserId === userId) ||
        (Boolean(userEmail) && mEmail === userEmail)
      );
    });

    const isLeader =
      (Boolean(userId) && Boolean(leaderIdStr) && leaderIdStr === userId) ||
      (Boolean(userEmail) && Boolean(leaderEmailStr) && leaderEmailStr === userEmail) ||
      isMemberLeader;

    if (!isLeader) {
      res.status(403).json({ error: 'Access Denied: Only the team leader of this project can access the leader dashboard.' });
      return;
    }

    // Execute all sub-queries in parallel with safe error fallbacks
    const [
      allUsers,
      invitations,
      projectJoinRequests,
      leaderJoinRequests,
      tasks,
      leaderEvaluations,
      peerEvaluations
    ] = await Promise.all([
      dbStore.getAllUsers().catch(e => { console.warn('[Leader Dashboard] getAllUsers fallback:', e.message); return []; }),
      dbStore.getInvitationsByProject(projId).catch(e => { console.warn('[Leader Dashboard] getInvitations fallback:', e.message); return []; }),
      dbStore.getJoinRequestsByProject(projId).catch(e => { console.warn('[Leader Dashboard] getJoinRequests fallback:', e.message); return []; }),
      dbStore.getJoinRequestsForLeader(userId, userEmail).catch(e => { console.warn('[Leader Dashboard] getJoinRequestsForLeader fallback:', e.message); return []; }),
      dbStore.getTasksByProject(projId).catch(e => { console.warn('[Leader Dashboard] getTasks fallback:', e.message); return []; }),
      dbStore.getLeaderEvaluations(projId).catch(e => { console.warn('[Leader Dashboard] getLeaderEvaluations fallback:', e.message); return []; }),
      dbStore.getPeerEvaluationsByProject(projId).catch(e => { console.warn('[Leader Dashboard] getPeerEvaluations fallback:', e.message); return []; }),
    ]);

    const activeInvitations = (invitations || []).filter(i => i.status === 'Pending');
    const pendingCandidateIds = activeInvitations.map(i => String(i.candidateId?._id || i.candidateId || ''));

    const combinedRequestsMap = new Map();
    for (const r of (projectJoinRequests || [])) {
      const rId = String(r.id || r._id || '');
      if (rId) combinedRequestsMap.set(rId, { ...r, id: rId, _id: rId });
    }
    for (const r of (leaderJoinRequests || [])) {
      if (String(r.projectId?._id || r.projectId || '') === projId) {
        const rId = String(r.id || r._id || '');
        if (rId) combinedRequestsMap.set(rId, { ...r, id: rId, _id: rId });
      }
    }
    const allProjectJoinRequests = Array.from(combinedRequestsMap.values());
    const pendingJoinRequests = allProjectJoinRequests.filter(r => r.status === 'Pending');

    const candidates = (allUsers || []).map(sanitizeUser).filter(Boolean);
    const teamMembers = (project.teamMembers || []).map(m => {
      const mId = String(m.userId?._id || m.userId || m.id || m._id || '');
      const fName = m.fullName || m.name || 'Team Member';
      return {
        ...m,
        userId: mId,
        id: mId,
        _id: mId,
        fullName: fName,
        name: fName,
        role: m.role || 'Member',
      };
    });
    const currentTeamSize = teamMembers.length;
    const requiredTeamSize = project.totalTeamSize || 4;
    const isTeamFull = currentTeamSize >= requiredTeamSize;

    const teamMemberIds = new Set(teamMembers.map(m => String(m.userId)));
    if (leaderIdStr) teamMemberIds.add(leaderIdStr);
    if (userId) teamMemberIds.add(userId);

    const eligibleCandidates = candidates.filter(c => c && c.id && !teamMemberIds.has(String(c.id)));
    const candidateRecommendations = !isTeamFull && project.recruitmentStatus === 'Open'
      ? eligibleCandidates
          .map(c => calculateCandidateMatch(project, c, pendingCandidateIds))
          .filter(Boolean)
          .sort((a, b) => b.overallMatchScore - a.overallMatchScore)
          .slice(0, 8)
      : [];

    let teamBalance;
    try {
      teamBalance = analyzeTeamBalance(project, candidates, pendingCandidateIds);
    } catch (tbErr) {
      console.warn('[Leader Dashboard] analyzeTeamBalance fallback:', tbErr.message);
      teamBalance = {
        totalRequiredRoles: (project.requiredRoles || []).length,
        coveredRolesCount: 0,
        roleCoveragePercentage: 0,
        coveredRoles: [],
        missingRoles: project.requiredRoles || [],
        totalRequiredSkills: (project.requiredSkills || []).length,
        coveredSkillsCount: 0,
        skillCoveragePercentage: 0,
        coveredSkills: [],
        missingSkills: (project.requiredSkills || []).map(s => typeof s === 'string' ? s : (s.skill || s.name || '')),
        rolesNeedingMembers: [],
        recommendedCandidatesForMissingRoles: [],
      };
    }

    const overdueTasks = (tasks || []).filter(t => t.isOverdue);
    const completedTasks = (tasks || []).filter(t => t.status === 'Completed');
    const taskCompletionPercentage =
      (tasks || []).length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const memberProgress = teamMembers.map(m => {
      const mId = String(m.userId);
      const memberTasks = (tasks || []).filter(t => String(t.assignedTo?._id || t.assignedTo || '') === mId);
      const memberDone = memberTasks.filter(t => t.status === 'Completed');
      const completionPercentage =
        memberTasks.length > 0 ? Math.round((memberDone.length / memberTasks.length) * 100) : 0;
      
      let reliabilityScore;
      try {
        reliabilityScore = calculateReliabilityScore(
          mId,
          projId,
          tasks,
          peerEvaluations,
          project.recruitmentStatus === 'Completed'
        );
      } catch (relErr) {
        reliabilityScore = {
          userId: mId,
          projectId: projId,
          overallScore: null,
          isInsufficientData: true,
          insufficientReason: 'Calculating scores...',
          components: {},
        };
      }

      return {
        memberId: mId,
        memberName: m.fullName,
        role: m.role,
        assignedTasksCount: memberTasks.length,
        completedTasksCount: memberDone.length,
        completionPercentage,
        reliabilityScore,
      };
    });

    const peerEvaluationSummaries = teamMembers.map(m => {
      const mId = String(m.userId);
      const received = (peerEvaluations || []).filter(pe => String(pe.evaluatedMemberId?._id || pe.evaluatedMemberId || '') === mId);
      const avg = received.length > 0
        ? Math.round((received.reduce((acc, cur) => acc + (cur.averageRating || 0), 0) / received.length) * 10) / 10
        : 0;

      return {
        memberId: mId,
        memberName: m.fullName,
        role: m.role,
        evaluationsReceived: received.length,
        averageRating: avg,
      };
    });

    res.status(200).json({
      project: {
        ...project,
        id: projId,
        _id: projId,
      },
      teamMembers,
      currentTeamSize,
      requiredTeamSize,
      isTeamFull,
      candidateRecommendations,
      teamBalance,
      activeInvitations,
      pendingJoinRequests,
      allJoinRequests: allProjectJoinRequests,
      tasks: (tasks || []).map(t => ({ ...t, id: String(t.id || t._id || '') })),
      overdueTasks,
      taskCompletionPercentage,
      memberProgress,
      leaderEvaluations: leaderEvaluations || [],
      peerEvaluationSummaries,
    });
  } catch (err) {
    console.error('[Leader Dashboard Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve leader dashboard data.' });
  }
});

export default router;
