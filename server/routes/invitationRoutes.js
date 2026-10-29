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

    if (project.leaderId !== leaderId) {
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

router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const invitation = await dbStore.findInvitationById(req.params.id);
    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found.' });
      return;
    }

    if (invitation.candidateId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    if (invitation.status !== 'Pending') {
      res.status(400).json({ error: 'Invitation has already been processed.' });
      return;
    }

    await dbStore.updateInvitation(invitation.id, { status: 'Rejected' });
    res.status(200).json({ message: 'Invitation rejected.' });
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

    if (invitation.leaderId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can cancel invitations.' });
      return;
    }

    await dbStore.updateInvitation(invitation.id, { status: 'Cancelled' });
    res.status(200).json({ message: 'Invitation cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
