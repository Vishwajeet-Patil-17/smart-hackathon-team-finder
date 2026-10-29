import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, priority, deadline } = req.body;
    const leaderId = req.user.id;

    if (!projectId || !title || !assignedTo || !deadline) {
      res.status(400).json({ error: 'Please provide projectId, task title, assigned member, and deadline.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (project.leaderId !== leaderId) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can create and assign tasks.' });
      return;
    }

    const isMember = project.teamMembers?.some(m => m.userId === assignedTo);
    if (!isMember) {
      res.status(400).json({ error: 'Assigned student must be a registered member of this project team.' });
      return;
    }

    const assignedUser = await dbStore.findUserById(assignedTo);

    const task = await dbStore.createTask({
      projectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedTo,
      assignedToName: assignedUser ? assignedUser.fullName : 'Team Member',
      createdBy: leaderId,
      priority: priority || 'Medium',
      deadline: new Date(deadline).toISOString(),
    });

    res.status(201).json({
      message: 'Task assigned successfully.',
      task,
    });
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

    const userId = req.user.id;
    const isMember = project.teamMembers?.some(m => m.userId === userId) || project.leaderId === userId;
    if (!isMember) {
      res.status(403).json({ error: 'Unauthorized: You must be a project member to view tasks.' });
      return;
    }

    const tasks = await dbStore.getTasksByProject(project.id);
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const tasks = await dbStore.getTasksByMember(req.user.id);
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      res.status(400).json({ error: 'Invalid task status. Must be Pending, In Progress, or Completed.' });
      return;
    }

    const task = await dbStore.findTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const project = await dbStore.findProjectById(task.projectId);
    const userId = req.user.id;

    if (task.assignedTo !== userId && project?.leaderId !== userId) {
      res.status(403).json({ error: 'Unauthorized to update this task.' });
      return;
    }

    const updated = await dbStore.updateTask(task.id, { status });
    res.status(200).json({
      message: 'Task status updated.',
      task: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await dbStore.findTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const project = await dbStore.findProjectById(task.projectId);
    if (project?.leaderId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can edit task details.' });
      return;
    }

    const { title, description, assignedTo, priority, deadline, status } = req.body;
    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (priority) updates.priority = priority;
    if (deadline) updates.deadline = new Date(deadline).toISOString();
    if (status) updates.status = status;

    if (assignedTo && assignedTo !== task.assignedTo) {
      const assignedUser = await dbStore.findUserById(assignedTo);
      if (assignedUser) {
        updates.assignedTo = assignedTo;
        updates.assignedToName = assignedUser.fullName;
      }
    }

    const updated = await dbStore.updateTask(task.id, updates);
    res.status(200).json({
      message: 'Task updated.',
      task: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
