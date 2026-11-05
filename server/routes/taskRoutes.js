import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { broadcastEvent } from '../services/realtimeService.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, priority, deadline } = req.body;

    if (!projectId || !title || !assignedTo || !deadline) {
      res.status(400).json({ error: 'Please provide projectId, title, assignedTo, and deadline.' });
      return;
    }

    const project = await dbStore.findProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const userEmail = (req.user.email || '').toLowerCase().trim();
    const isLeader =
      String(project.leaderId) === String(req.user.id) ||
      (project.leaderEmail && project.leaderEmail.toLowerCase().trim() === userEmail);

    if (!isLeader) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can assign tasks.' });
      return;
    }

    const assignedUser = await dbStore.findUserById(assignedTo);
    if (!assignedUser) {
      res.status(404).json({ error: 'Assigned team member not found.' });
      return;
    }

    const isMember =
      String(project.leaderId) === String(assignedUser.id) ||
      (project.leaderEmail && assignedUser.email && project.leaderEmail.toLowerCase().trim() === assignedUser.email.toLowerCase().trim()) ||
      project.teamMembers?.some(m =>
        String(m.userId) === String(assignedUser.id) ||
        (m.email && assignedUser.email && m.email.toLowerCase().trim() === assignedUser.email.toLowerCase().trim())
      );

    if (!isMember) {
      res.status(400).json({ error: 'Tasks can only be assigned to existing team members of this project.' });
      return;
    }

    const task = await dbStore.createTask({
      projectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.fullName,
      assignedToEmail: assignedUser.email,
      createdBy: String(project.leaderId || req.user.id),
      createdByName: req.user.fullName || project.leaderName || 'Team Leader',
      priority: priority || 'Medium',
      deadline: new Date(deadline).toISOString(),
      status: 'Pending',
      completedOnTime: null,
    });

    broadcastEvent('task:created', {
      task,
      projectId,
      assignedTo: assignedUser.id,
      assignedToEmail: assignedUser.email,
    });

    res.status(201).json({
      message: 'Task created and assigned successfully.',
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
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const isMember =
      project.teamMembers?.some(m =>
        String(m.userId) === String(userId) ||
        (m.email && m.email.toLowerCase().trim() === userEmail)
      ) ||
      String(project.leaderId) === String(userId) ||
      (project.leaderEmail && project.leaderEmail.toLowerCase().trim() === userEmail);

    if (!isMember) {
      res.status(403).json({ error: 'Unauthorized: You must be a project member to view tasks.' });
      return;
    }

    const tasks = await dbStore.getTasksByProject(project.id || project._id);
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const tasks = await dbStore.getTasksByMember(req.user.id, req.user.email);
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
    const userEmail = (req.user.email || '').toLowerCase().trim();

    const isAssigned =
      String(task.assignedTo) === String(userId) ||
      (task.assignedToEmail && task.assignedToEmail.toLowerCase() === userEmail);
    const isLeader =
      String(project?.leaderId) === String(userId) ||
      (project?.leaderEmail && project.leaderEmail.toLowerCase().trim() === userEmail);

    if (!isAssigned && !isLeader) {
      res.status(403).json({ error: 'Unauthorized to update this task.' });
      return;
    }

    const updated = await dbStore.updateTask(task.id || task._id || req.params.id, { status });

    broadcastEvent('task:updated', {
      task: updated,
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      status,
    });

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
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const isLeader =
      String(project?.leaderId) === String(req.user.id) ||
      (project?.leaderEmail && project.leaderEmail.toLowerCase().trim() === userEmail);

    if (!isLeader) {
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

    if (assignedTo && String(assignedTo) !== String(task.assignedTo)) {
      const assignedUser = await dbStore.findUserById(assignedTo);
      if (assignedUser) {
        updates.assignedTo = String(assignedTo);
        updates.assignedToName = assignedUser.fullName;
        updates.assignedToEmail = assignedUser.email;
      }
    }

    const updated = await dbStore.updateTask(task.id || task._id || req.params.id, updates);

    broadcastEvent('task:updated', {
      task: updated,
      projectId: task.projectId,
      assignedTo: updated.assignedTo,
      status: updated.status,
    });

    res.status(200).json({
      message: 'Task updated successfully.',
      task: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
