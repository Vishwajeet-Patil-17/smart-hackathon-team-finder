import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const userId = req.user.id;
    const isMember = project.teamMembers?.some(m => m.userId === userId) || project.leaderId === userId;
    if (!isMember) {
      res.status(403).json({ error: 'Unauthorized: Only team members can access project discussions.' });
      return;
    }

    const messages = await dbStore.getMessagesByProject(projectId);
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const userId = req.user.id;
    const user = await dbStore.findUserById(userId);
    const memberObj = project.teamMembers?.find(m => m.userId === userId);
    const isLeader = project.leaderId === userId;

    if (!memberObj && !isLeader) {
      res.status(403).json({ error: 'Unauthorized: Only team members can post to project discussions.' });
      return;
    }

    const authorRole = isLeader ? 'Team Leader' : (memberObj?.role || 'Team Member');

    const newMessage = await dbStore.createMessage({
      projectId,
      authorId: userId,
      authorName: user.fullName,
      authorRole,
      content: content.trim(),
    });

    res.status(201).json({
      message: 'Message posted.',
      discussionMessage: newMessage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
