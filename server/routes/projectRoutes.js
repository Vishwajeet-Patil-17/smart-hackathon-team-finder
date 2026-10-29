import { Router } from 'express';
import { dbStore } from '../db/store.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { domain, search, status } = req.query;
    let projects = await dbStore.getAllProjects();

    if (domain && typeof domain === 'string' && domain !== 'All') {
      projects = projects.filter(p => p.domain.toLowerCase() === domain.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'All') {
      projects = projects.filter(p => p.recruitmentStatus === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      projects = projects.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.domain.toLowerCase().includes(q) ||
             p.idea.toLowerCase().includes(q) ||
             p.requiredSkills.some(s => (s.skill || '').toLowerCase().includes(q))
      );
    }

    res.status(200).json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.status(200).json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      idea,
      description,
      problemStatement,
      domain,
      technicalApproach,
      requiredSkills,
      requiredRoles,
      totalTeamSize,
      preferredExperienceLevel,
      memberResponsibilities,
      timeline,
      expectedAvailability,
    } = req.body;

    if (!name || !idea || !description || !problemStatement || !domain || !technicalApproach) {
      res.status(400).json({ error: 'Please fill in all mandatory project definition fields.' });
      return;
    }

    const teamSize = Number(totalTeamSize) || 4;
    if (teamSize < 2 || teamSize > 10) {
      res.status(400).json({ error: 'Total required team size must be between 2 and 10 students.' });
      return;
    }

    const user = await dbStore.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const initialTeamMembers = [
      {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: 'Team Leader',
        department: user.department,
        academicYear: user.academicYear,
        joinedAt: new Date().toISOString(),
      },
    ];

    const project = await dbStore.createProject({
      name: name.trim(),
      idea: idea.trim(),
      description: description.trim(),
      problemStatement: problemStatement.trim(),
      domain: domain.trim(),
      technicalApproach: technicalApproach.trim(),
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : ['Full Stack Developer', 'UI/UX Designer'],
      totalTeamSize: teamSize,
      preferredExperienceLevel: preferredExperienceLevel || 'Intermediate',
      memberResponsibilities: memberResponsibilities || '',
      timeline: timeline || '4 Weeks',
      expectedAvailability: expectedAvailability || '15-20 hrs/week',
      recruitmentStatus: 'Open',
      leaderId: user.id,
      leaderName: user.fullName,
      leaderEmail: user.email,
      teamMembers: initialTeamMembers,
    });

    res.status(201).json({
      message: 'Project created successfully. You are now the Team Leader.',
      project,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await dbStore.findProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (project.leaderId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: Only the project leader can modify project details.' });
      return;
    }

    const {
      name,
      idea,
      description,
      problemStatement,
      domain,
      technicalApproach,
      requiredSkills,
      requiredRoles,
      totalTeamSize,
      preferredExperienceLevel,
      memberResponsibilities,
      timeline,
      expectedAvailability,
      recruitmentStatus,
    } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (idea) updates.idea = idea.trim();
    if (description) updates.description = description.trim();
    if (problemStatement) updates.problemStatement = problemStatement.trim();
    if (domain) updates.domain = domain.trim();
    if (technicalApproach) updates.technicalApproach = technicalApproach.trim();
    if (requiredSkills && Array.isArray(requiredSkills)) updates.requiredSkills = requiredSkills;
    if (requiredRoles && Array.isArray(requiredRoles)) updates.requiredRoles = requiredRoles;
    if (totalTeamSize) updates.totalTeamSize = Number(totalTeamSize);
    if (preferredExperienceLevel) updates.preferredExperienceLevel = preferredExperienceLevel;
    if (memberResponsibilities !== undefined) updates.memberResponsibilities = memberResponsibilities;
    if (timeline !== undefined) updates.timeline = timeline;
    if (expectedAvailability !== undefined) updates.expectedAvailability = expectedAvailability;
    if (recruitmentStatus) updates.recruitmentStatus = recruitmentStatus;

    const updated = await dbStore.updateProject(project.id, updates);
    res.status(200).json({
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
