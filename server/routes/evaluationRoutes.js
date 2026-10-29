import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { calculateReliabilityScore } from '../services/reliabilityService.js';

const router = Router();

function calculateAverage(ratings) {
  const values = Object.values(ratings);
  const sum = values.reduce((a, b) => a + Number(b), 0);
  return Math.round((sum / values.length) * 10) / 10;
}

router.post('/leader', authenticate, async (req, res) => {
  try {
    const { projectId, memberId, evaluationPeriod, ratings, comment } = req.body;
    const leaderId = req.user.id;

    if (!projectId || !memberId || !ratings) {
      res.status(400).json({ error: 'Please provide projectId, memberId, and complete rating rubric.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (project.leaderId !== leaderId) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can submit leader evaluations.' });
      return;
    }

    if (memberId === leaderId) {
      res.status(400).json({ error: 'Project leaders cannot evaluate themselves via the leader evaluation form.' });
      return;
    }

    const member = await dbStore.findUserById(memberId);
    if (!member) {
      res.status(404).json({ error: 'Evaluated member not found.' });
      return;
    }

    const avg = calculateAverage(ratings);

    const saved = await dbStore.saveLeaderEvaluation({
      projectId,
      leaderId,
      memberId,
      memberName: member.fullName,
      evaluationPeriod: evaluationPeriod || 'Sprint Evaluation',
      ratings,
      averageRating: avg,
      comment: comment ? comment.trim() : '',
    });

    res.status(200).json({
      message: 'Leader evaluation saved successfully.',
      evaluation: saved,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/peer', authenticate, async (req, res) => {
  try {
    const { projectId, evaluatedMemberId, evaluationPeriod, ratings, comment } = req.body;
    const evaluatorId = req.user.id;

    if (!projectId || !evaluatedMemberId || !ratings) {
      res.status(400).json({ error: 'Please provide projectId, evaluatedMemberId, and rubric ratings.' });
      return;
    }

    if (evaluatorId === evaluatedMemberId) {
      res.status(400).json({ error: 'Self-evaluation is strictly prohibited. You can only evaluate peers.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const isEvaluatorMember =
      project.teamMembers?.some(m => m.userId === evaluatorId) || project.leaderId === evaluatorId;
    const isEvaluatedMember =
      project.teamMembers?.some(m => m.userId === evaluatedMemberId) || project.leaderId === evaluatedMemberId;

    if (!isEvaluatorMember || !isEvaluatedMember) {
      res.status(403).json({ error: 'Both evaluator and evaluated student must be active members of this project.' });
      return;
    }

    const evaluatedUser = await dbStore.findUserById(evaluatedMemberId);
    const avg = calculateAverage(ratings);

    const saved = await dbStore.savePeerEvaluation({
      projectId,
      evaluatorId,
      evaluatedMemberId,
      evaluatedMemberName: evaluatedUser ? evaluatedUser.fullName : 'Teammate',
      evaluationPeriod: evaluationPeriod || 'Sprint Evaluation',
      ratings,
      averageRating: avg,
      comment: comment ? comment.trim() : '',
      isConfidential: true,
    });

    res.status(200).json({
      message: 'Peer evaluation submitted confidentially.',
      evaluation: {
        id: saved.id,
        projectId: saved.projectId,
        evaluatedMemberId: saved.evaluatedMemberId,
        averageRating: saved.averageRating,
        evaluationPeriod: saved.evaluationPeriod,
        isConfidential: true,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/project/:projectId/reliability/:memberId', authenticate, async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const requesterId = req.user.id;
    const isAuthorized =
      project.leaderId === requesterId ||
      memberId === requesterId ||
      project.teamMembers?.some(m => m.userId === requesterId);

    if (!isAuthorized) {
      res.status(403).json({ error: 'Unauthorized to access this reliability information.' });
      return;
    }

    const tasks = await dbStore.getTasksByProject(projectId);
    const peerEvals = await dbStore.getPeerEvaluationsByProject(projectId);
    const isCompleted = project.recruitmentStatus === 'Completed';

    const reliability = calculateReliabilityScore(memberId, projectId, tasks, peerEvals, isCompleted);
    res.status(200).json({ reliability });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/project/:projectId/summary', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const leaderEvals = await dbStore.getLeaderEvaluations(projectId);
    const peerEvals = await dbStore.getPeerEvaluationsByProject(projectId);
    const tasks = await dbStore.getTasksByProject(projectId);

    const peerSummaries = (project.teamMembers || []).map(m => {
      const received = peerEvals.filter(pe => pe.evaluatedMemberId === m.userId);
      const avg = received.length > 0
        ? Math.round((received.reduce((acc, cur) => acc + cur.averageRating, 0) / received.length) * 10) / 10
        : 0;
      const reliability = calculateReliabilityScore(
        m.userId,
        projectId,
        tasks,
        peerEvals,
        project.recruitmentStatus === 'Completed'
      );

      return {
        memberId: m.userId,
        memberName: m.fullName,
        role: m.role,
        evaluationsReceived: received.length,
        averageRating: avg,
        reliability,
      };
    });

    res.status(200).json({
      leaderEvaluations: leaderEvals,
      peerSummaries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
