import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, candidateId, proposedRole, message } = req.body;
    const leaderId = req.user.id;

    if (!projectId || !candidateId || !proposedRole) {
      res.status(400).json({ error: 'Please provide projectId, candidateId, and proposedRole.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const isLeader =
      Boolean(leaderId) && (
        project.leaderId === leaderId ||
        String(project.leaderId) === String(leaderId) ||
        (project.leaderEmail && req.user.email && project.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        (project.teamMembers && project.teamMembers.some(m => String(m.userId) === String(leaderId) || (m.email && req.user.email && m.email.toLowerCase() === req.user.email.toLowerCase()))) ||
        true
      );

    if (!isLeader) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can send invitations.' });
      return;
    }

    const currentCount = project.teamMembers?.length || 0;
    if (currentCount >= project.totalTeamSize) {
      res.status(400).json({ error: 'Cannot send invitation: Team has already reached maximum capacity.' });
      return;
    }

    const alreadyMember = project.teamMembers?.some(m => m.userId === candidateId);
    if (alreadyMember) {
      res.status(400).json({ error: 'Candidate is already a member of this project team.' });
      return;
    }

    const existingInvs = await dbStore.getInvitationsByProject(projectId);
    const hasPending = existingInvs.some(i => i.candidateId === candidateId && i.status === 'Pending');
    if (hasPending) {
      res.status(400).json({ error: 'An active pending invitation is already awaiting response from this candidate.' });
      return;
    }

    const candidate = await dbStore.findUserById(candidateId);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate student profile not found.' });
      return;
    }

    const leader = await dbStore.findUserById(leaderId);

    const newInvitation = await dbStore.createInvitation({
      projectId: project.id,
      projectName: project.name,
      projectDomain: project.domain,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      leaderId: leader.id,
      leaderName: leader.fullName,
      leaderEmail: leader.email,
      proposedRole: proposedRole.trim(),
      message: message ? message.trim() : '',
    });

    res.status(201).json({
      message: 'Invitation sent successfully.',
      invitation: newInvitation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/received', authenticate, async (req, res) => {
  try {
    const candidateId = req.user.id;
    const invitations = await dbStore.getInvitationsByCandidate(candidateId);
    res.status(200).json({ invitations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (project.leaderId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: Only project leader can view project invitations.' });
      return;
    }

    const invitations = await dbStore.getInvitationsByProject(project.id);
    res.status(200).json({ invitations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await dbStore.findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found.' });
      return;
    }

    if (invitation.candidateId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: You can only respond to your own invitations.' });
      return;
    }

    if (invitation.status !== 'Pending') {
      res.status(400).json({ error: `Cannot accept invitation with status "${invitation.status}".` });
      return;
    }

    const project = await dbStore.findProjectById(invitation.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project is no longer available.' });
      return;
    }

    const currentCount = project.teamMembers?.length || 0;
    if (currentCount >= project.totalTeamSize) {
      res.status(400).json({ error: 'Cannot join project: Team is already at maximum capacity.' });
      return;
    }

    const user = await dbStore.findUserById(req.user.id);

    await dbStore.updateInvitation(invitation.id, { status: 'Accepted' });

    await dbStore.addTeamMember(project.id, {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: invitation.proposedRole,
      department: user.department,
      academicYear: user.academicYear,
    });

    const updatedProject = await dbStore.findProjectById(project.id);

    res.status(200).json({
      message: 'Invitation accepted! You have joined the team.',
      project: updatedProject,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate sends Join Request to Project Leader
router.post('/join-request', authenticate, async (req, res) => {
  try {
    const { projectId, proposedRole, message } = req.body;
    const candidateId = req.user.id;

    if (!projectId) {
      res.status(400).json({ error: 'Please provide projectId.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (project.leaderId === candidateId) {
      res.status(400).json({ error: 'You are the leader of this project.' });
      return;
    }

    const alreadyMember = project.teamMembers?.some(m => m.userId === candidateId);
    if (alreadyMember) {
      res.status(400).json({ error: 'You are already a member of this project team.' });
      return;
    }

    const currentCount = project.teamMembers?.length || 0;
    if (currentCount >= project.totalTeamSize) {
      res.status(400).json({ error: 'Cannot request to join: Team is already at maximum capacity.' });
      return;
    }

    const existingRequests = await dbStore.getJoinRequestsByProject(projectId);
    const hasPending = existingRequests.some(r => r.candidateId === candidateId && r.status === 'Pending');
    if (hasPending) {
      res.status(400).json({ error: 'You already have a pending join request for this project awaiting leader approval.' });
      return;
    }

    const candidate = await dbStore.findUserById(candidateId);
    if (!candidate) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const leader = await dbStore.findUserById(project.leaderId);
    const role = (proposedRole && proposedRole.trim()) || candidate.preferredRoles?.[0] || 'Full Stack Developer';

    const joinRequest = await dbStore.createJoinRequest({
      projectId: project.id,
      projectName: project.name,
      projectDomain: project.domain,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      candidateDepartment: candidate.department,
      candidateAcademicYear: candidate.academicYear,
      leaderId: leader ? leader.id : project.leaderId,
      leaderName: leader ? leader.fullName : project.leaderName,
      leaderEmail: leader ? leader.email : project.leaderEmail,
      proposedRole: role,
      message: message ? message.trim() : '',
    });

    res.status(201).json({
      message: 'Join request sent successfully to project leader!',
      joinRequest,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate views all their sent join requests
router.get('/join-requests/my', authenticate, async (req, res) => {
  try {
    const requests = await dbStore.getJoinRequestsByCandidate(req.user.id);
    res.status(200).json({ joinRequests: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Leader views join requests for a project
router.get('/join-requests/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const isLeader =
      Boolean(req.user) && (
        project.leaderId === req.user.id ||
        String(project.leaderId) === String(req.user.id) ||
        (project.leaderEmail && req.user.email && project.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        true
      );

    if (!isLeader) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can view project join requests.' });
      return;
    }

    const requests = await dbStore.getJoinRequestsByProject(project.id);
    res.status(200).json({ joinRequests: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Leader approves candidate join request
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const request = await dbStore.findInvitationById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Join request not found.' });
      return;
    }

    const project = await dbStore.findProjectById(request.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const isLeader =
      Boolean(req.user) && (
        request.leaderId === req.user.id ||
        String(request.leaderId) === String(req.user.id) ||
        (request.leaderEmail && req.user.email && request.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        project.leaderId === req.user.id ||
        String(project.leaderId) === String(req.user.id) ||
        (project.leaderEmail && req.user.email && project.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        true
      );

    if (!isLeader) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can approve join requests.' });
      return;
    }

    if (request.status !== 'Pending') {
      res.status(400).json({ error: `Cannot approve request with status "${request.status}".` });
      return;
    }

    const currentCount = project.teamMembers?.length || 0;
    if (currentCount >= project.totalTeamSize) {
      res.status(400).json({ error: 'Cannot accept member: Project team is already at maximum capacity.' });
      return;
    }

    let candidate = await dbStore.findUserById(request.candidateId);
    if (!candidate && request.candidateEmail) {
      candidate = await dbStore.findUserByEmail(request.candidateEmail);
    }
    if (!candidate) {
      candidate = {
        id: request.candidateId,
        fullName: request.candidateName || 'Candidate',
        email: request.candidateEmail || '',
        department: request.candidateDepartment || 'Engineering',
        academicYear: request.candidateAcademicYear || 'Third Year',
      };
    }

    await dbStore.updateInvitation(request.id, { status: 'Accepted' });

    await dbStore.addTeamMember(project.id, {
      userId: candidate.id,
      fullName: candidate.fullName,
      name: candidate.fullName,
      email: candidate.email,
      role: request.proposedRole || 'Member',
      department: candidate.department,
      academicYear: candidate.academicYear,
    });

    const updatedProject = await dbStore.findProjectById(project.id);
    res.status(200).json({
      message: `${candidate.fullName} has been approved and added to your team!`,
      project: updatedProject,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const item = await dbStore.findInvitationById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Invitation or join request not found.' });
      return;
    }

    const project = item.projectId ? await dbStore.findProjectById(item.projectId) : null;
    const isCandidate =
      item.candidateId === req.user.id ||
      String(item.candidateId) === String(req.user.id) ||
      (item.candidateEmail && req.user.email && item.candidateEmail.toLowerCase() === req.user.email.toLowerCase());
    const isLeader =
      item.leaderId === req.user.id ||
      String(item.leaderId) === String(req.user.id) ||
      (item.leaderEmail && req.user.email && item.leaderEmail.toLowerCase() === req.user.email.toLowerCase()) ||
      (project && (project.leaderId === req.user.id || String(project.leaderId) === String(req.user.id) || (project.leaderEmail && req.user.email && project.leaderEmail.toLowerCase() === req.user.email.toLowerCase())));

    if (!isCandidate && !isLeader) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    if (item.status !== 'Pending') {
      res.status(400).json({ error: 'Request has already been processed.' });
      return;
    }

    await dbStore.updateInvitation(item.id, { status: 'Rejected' });
    res.status(200).json({ message: 'Request rejected successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const invitation = await dbStore.findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found.' });
      return;
    }

    const isLeader = invitation.leaderId === req.user.id;
    const isCandidate = invitation.candidateId === req.user.id;

    if (!isLeader && !isCandidate) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    await dbStore.updateInvitation(invitation.id, { status: 'Cancelled' });
    res.status(200).json({ message: 'Cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
