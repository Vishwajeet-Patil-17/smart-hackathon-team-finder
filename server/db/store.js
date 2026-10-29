import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UserModel,
  ProjectModel,
  InvitationModel,
  TaskModel,
  LeaderEvalModel,
  PeerEvalModel,
  TeamMessageModel,
} from '../models/schemas.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'local_store.json');

// In-Memory Fallback State
let memoryUsers = [];
let memoryProjects = [];
let memoryInvitations = [];
let memoryTasks = [];
let memoryLeaderEvals = [];
let memoryPeerEvals = [];
let memoryMessages = [];

function loadLocalStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) memoryUsers = data.users;
      if (Array.isArray(data.projects)) memoryProjects = data.projects;
      if (Array.isArray(data.invitations)) memoryInvitations = data.invitations;
      if (Array.isArray(data.tasks)) memoryTasks = data.tasks;
      if (Array.isArray(data.leaderEvals)) memoryLeaderEvals = data.leaderEvals;
      if (Array.isArray(data.peerEvals)) memoryPeerEvals = data.peerEvals;
      if (Array.isArray(data.messages)) memoryMessages = data.messages;
      console.log(`[Store] Loaded ${memoryUsers.length} users and ${memoryProjects.length} projects from local_store.json.`);
    }
  } catch (e) {
    console.warn('[Store] Local store load warning:', e.message);
  }
}

export function saveLocalStore() {
  try {
    const data = {
      users: memoryUsers,
      projects: memoryProjects,
      invitations: memoryInvitations,
      tasks: memoryTasks,
      leaderEvals: memoryLeaderEvals,
      peerEvals: memoryPeerEvals,
      messages: memoryMessages,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Store] Local store save warning:', e.message);
  }
}

// Seed Users
const SEED_USERS = [
  {
    id: 'usr_vishwajeet_patil',
    fullName: 'Vishwajeet Patil',
    email: 'vishwajeet.patil@walchandsangli.ac.in',
    passwordHash: '$2b$10$aG3o5oTrdNKenVleiQa6pO/UnJdAmCCUHAjqlnrT9WNFZwCwLDMiK', // Vishwajeet@2006
    department: 'Computer Science & Engineering',
    academicYear: 'Third Year',
    skills: [
      { name: 'React', proficiency: 'Advanced' },
      { name: 'Node.js', proficiency: 'Advanced' },
      { name: 'TypeScript', proficiency: 'Advanced' },
      { name: 'MongoDB', proficiency: 'Advanced' },
      { name: 'Python', proficiency: 'Intermediate' },
    ],
    experienceLevel: 'Advanced',
    interests: ['Campus Automation', 'Full Stack Development', 'AI & Machine Learning'],
    preferredRoles: ['Team Leader', 'Full Stack Developer'],
    availability: '20+ hrs/week',
    bio: 'WCE CSE Third Year student. Passionate full stack developer and hackathon enthusiast.',
    githubUrl: 'https://github.com/vishwajeet-patil',
    linkedinUrl: 'https://linkedin.com/in/vishwajeet-patil',
    relevantExperience: 'Lead developer for Smart Hackathon Team Finder.',
    idCard: {
      assetId: 'id_card_wce_vishwajeet',
      resourceType: 'image',
      format: 'png',
      secureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      uploadedAt: new Date().toISOString(),
      isRestricted: true,
      storageProvider: 'secure-local-vault',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_rohit_leader',
    fullName: 'Rohit Patil',
    email: 'rohit.patil@walchandsangli.ac.in',
    passwordHash: '$2b$10$dfnMKDKPT836sZs8B3lePuouzOIxIAiKZeJ7GS0DaH/IiOzm9UpsG', // Password@123
    department: 'Computer Science & Engineering',
    academicYear: 'Third Year',
    skills: [
      { name: 'React', proficiency: 'Advanced' },
      { name: 'Node.js', proficiency: 'Advanced' },
      { name: 'MongoDB', proficiency: 'Intermediate' },
      { name: 'TypeScript', proficiency: 'Intermediate' },
    ],
    experienceLevel: 'Advanced',
    interests: ['Campus Automation', 'Web Development', 'FinTech'],
    preferredRoles: ['Team Leader', 'Full Stack Developer'],
    availability: '20+ hrs/week',
    bio: 'WCE CSE Third Year student. Passionate about building impactful hackathon solutions and leading engineering teams.',
    githubUrl: 'https://github.com/rohit-patil-wce',
    linkedinUrl: 'https://linkedin.com/in/rohit-patil-wce',
    relevantExperience: 'Winner Smart India Hackathon internal round 2025.',
    idCard: {
      assetId: 'id_card_wce_rohit',
      resourceType: 'image',
      format: 'png',
      secureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      uploadedAt: new Date().toISOString(),
      isRestricted: true,
      storageProvider: 'secure-local-vault',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_aniket_candidate',
    fullName: 'Aniket Shinde',
    email: 'aniket.shinde@walchandsangli.ac.in',
    passwordHash: '$2b$10$dfnMKDKPT836sZs8B3lePuouzOIxIAiKZeJ7GS0DaH/IiOzm9UpsG', // Password@123
    department: 'Information Technology',
    academicYear: 'Third Year',
    skills: [
      { name: 'Python', proficiency: 'Expert' },
      { name: 'Machine Learning', proficiency: 'Advanced' },
      { name: 'FastAPI', proficiency: 'Intermediate' },
      { name: 'Docker', proficiency: 'Intermediate' },
    ],
    experienceLevel: 'Advanced',
    interests: ['Artificial Intelligence', 'Data Science', 'Smart Agriculture'],
    preferredRoles: ['AI/ML Engineer', 'Backend Developer'],
    availability: '15-20 hrs/week',
    bio: 'WCE IT student focused on Machine Learning pipelines and high-throughput backend services.',
    githubUrl: 'https://github.com/aniket-shinde-wce',
    linkedinUrl: 'https://linkedin.com/in/aniket-shinde-wce',
    relevantExperience: 'Built ML prediction system for agricultural yield.',
    idCard: {
      assetId: 'id_card_wce_aniket',
      resourceType: 'image',
      format: 'png',
      secureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      uploadedAt: new Date().toISOString(),
      isRestricted: true,
      storageProvider: 'secure-local-vault',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr_neha_ui',
    fullName: 'Neha Kulkarni',
    email: 'neha.kulkarni@walchandsangli.ac.in',
    passwordHash: '$2b$10$dfnMKDKPT836sZs8B3lePuouzOIxIAiKZeJ7GS0DaH/IiOzm9UpsG', // Password@123
    department: 'Electronics Engineering',
    academicYear: 'Fourth Year',
    skills: [
      { name: 'Figma', proficiency: 'Expert' },
      { name: 'UI/UX Design', proficiency: 'Expert' },
      { name: 'Tailwind CSS', proficiency: 'Advanced' },
      { name: 'React', proficiency: 'Intermediate' },
    ],
    experienceLevel: 'Advanced',
    interests: ['Design Systems', 'EdTech', 'HealthTech'],
    preferredRoles: ['UI/UX Designer', 'Frontend Developer'],
    availability: '15-20 hrs/week',
    bio: 'Final year Electronics student passionate about accessible design systems and delightful web interfaces.',
    idCard: {
      assetId: 'id_card_wce_neha',
      resourceType: 'image',
      format: 'png',
      secureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      uploadedAt: new Date().toISOString(),
      isRestricted: true,
      storageProvider: 'secure-local-vault',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let storeInitialized = false;

export async function initStore() {
  if (storeInitialized) return;
  storeInitialized = true;

  // 1. First, load existing local file state if present
  loadLocalStore();

  // 2. Ensure all SEED_USERS are in memoryUsers and passwords are synchronized
  for (const seed of SEED_USERS) {
    const existingIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === seed.email.toLowerCase());
    if (existingIdx === -1) {
      memoryUsers.push({ ...seed });
    } else {
      // Synchronize passwordHash and vital fields
      memoryUsers[existingIdx].passwordHash = seed.passwordHash;
      if (!memoryUsers[existingIdx].fullName) memoryUsers[existingIdx].fullName = seed.fullName;
      if (!memoryUsers[existingIdx].department) memoryUsers[existingIdx].department = seed.department;
      if (!memoryUsers[existingIdx].academicYear) memoryUsers[existingIdx].academicYear = seed.academicYear;
      if (!memoryUsers[existingIdx].skills || memoryUsers[existingIdx].skills.length === 0) memoryUsers[existingIdx].skills = seed.skills;
    }
  }

  // Save updated local store immediately
  saveLocalStore();

  // If MongoDB Atlas is connected, ensure seeds exist in MongoDB Atlas
  if (mongoose.connection.readyState === 1) {
    try {
      for (const seed of SEED_USERS) {
        const existing = await UserModel.findOne({ email: seed.email.toLowerCase() }).lean();
        if (!existing) {
          const created = await UserModel.create({
            fullName: seed.fullName,
            email: seed.email.toLowerCase().trim(),
            passwordHash: seed.passwordHash,
            department: seed.department,
            academicYear: seed.academicYear,
            skills: seed.skills,
            experienceLevel: seed.experienceLevel,
            interests: seed.interests,
            preferredRoles: seed.preferredRoles,
            availability: seed.availability,
            bio: seed.bio,
            githubUrl: seed.githubUrl,
            linkedinUrl: seed.linkedinUrl,
            relevantExperience: seed.relevantExperience,
            idCard: seed.idCard,
          });
          console.log(`[Store] Seeded ${seed.fullName} (${seed.email}) into MongoDB Atlas.`);
          const memIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === seed.email.toLowerCase());
          if (memIdx !== -1) {
            memoryUsers[memIdx].id = created._id.toString();
          }
        } else {
          const memIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === seed.email.toLowerCase());
          if (memIdx !== -1) {
            memoryUsers[memIdx].id = existing._id.toString();
          }
        }
      }

      // Also pull all existing users from MongoDB into memory
      const allMongoUsers = await UserModel.find({}).lean();
      for (const mUser of allMongoUsers) {
        const mapped = { ...mUser, id: mUser._id.toString() };
        const idx = memoryUsers.findIndex(u => u.email.toLowerCase() === mapped.email.toLowerCase());
        if (idx === -1) {
          memoryUsers.push(mapped);
        } else {
          memoryUsers[idx] = { ...memoryUsers[idx], ...mapped };
        }
      }
    } catch (err) {
      console.warn('[Store] MongoDB Atlas seed sync warning:', err.message);
    }
  }

  // Initialize default project if empty
  if (memoryProjects.length === 0) {
    const leader = memoryUsers.find(u => u.email === 'rohit.patil@walchandsangli.ac.in') || memoryUsers[0];
    memoryProjects.push({
      id: 'proj_smart_campus_wce',
      name: 'Smart WCE Campus & Hostel IoT Navigator',
      idea: 'An intelligent campus IoT navigation and real-time lab equipment availability tracking system for Walchand College of Engineering, Sangli.',
      description: 'Comprehensive web platform integrating IoT sensor nodes across department labs with interactive routing.',
      problemStatement: 'Students often struggle to locate open hardware labs, free computing stations, and campus facilities across WCE.',
      domain: 'Smart Campus & IoT',
      technicalApproach: 'React frontend with interactive SVG campus blueprint; Node.js backend with Dijkstra routing algorithms and MQTT IoT telemetry.',
      requiredSkills: [
        { skill: 'React', minProficiency: 'Intermediate', isMandatory: true },
        { skill: 'Node.js', minProficiency: 'Intermediate', isMandatory: true },
        { skill: 'Python', minProficiency: 'Intermediate', isMandatory: false },
        { skill: 'Figma', minProficiency: 'Intermediate', isMandatory: false },
      ],
      requiredRoles: ['Frontend Developer', 'Backend Developer', 'AI/ML Engineer', 'UI/UX Designer'],
      totalTeamSize: 4,
      preferredExperienceLevel: 'Intermediate',
      memberResponsibilities: 'Frontend maps interface, IoT sensor MQTT gateway, and cloud database synchronization.',
      timeline: '4 Weeks',
      expectedAvailability: '15-20 hrs/week',
      recruitmentStatus: 'Open',
      leaderId: leader ? leader.id : 'usr_rohit_leader',
      leaderName: leader ? leader.fullName : 'Rohit Patil',
      leaderEmail: leader ? leader.email : 'rohit.patil@walchandsangli.ac.in',
      teamMembers: [
        {
          userId: leader ? leader.id : 'usr_rohit_leader',
          name: leader ? leader.fullName : 'Rohit Patil',
          email: leader ? leader.email : 'rohit.patil@walchandsangli.ac.in',
          role: 'Team Leader',
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export const dbStore = {
  // Users
  async findUserByEmail(email) {
    await initStore();
    if (!email) return null;
    const normalized = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const doc = await UserModel.findOne({
          email: { $regex: new RegExp(`^${escaped}$`, 'i') },
        }).lean();
        if (doc) {
          const user = { ...doc, id: doc._id?.toString() || doc.id };
          // Keep memory store updated
          const idx = memoryUsers.findIndex(u => u.email.toLowerCase() === normalized);
          if (idx === -1) memoryUsers.push(user);
          else memoryUsers[idx] = user;
          return user;
        }
      } catch (e) {
        console.warn('[Store] MongoDB findUserByEmail fallback:', e.message);
      }
    }

    return memoryUsers.find(u => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id) {
    await initStore();
    if (!id) return null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const doc = await UserModel.findById(id).lean();
        if (doc) return { ...doc, id: doc._id?.toString() || doc.id };
      } catch (e) {
        // Fallback
      }
    }
    return memoryUsers.find(u => u.id === id || u._id?.toString() === id) || null;
  },

  async createUser(userData) {
    await initStore();
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const normalizedEmail = (userData.email || '').toLowerCase().trim();

    const user = {
      ...userData,
      email: normalizedEmail,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await UserModel.create({
          fullName: user.fullName,
          email: normalizedEmail,
          passwordHash: user.passwordHash,
          department: user.department,
          academicYear: user.academicYear,
          skills: user.skills,
          experienceLevel: user.experienceLevel,
          interests: user.interests,
          preferredRoles: user.preferredRoles,
          availability: user.availability,
          bio: user.bio,
          githubUrl: user.githubUrl,
          linkedinUrl: user.linkedinUrl,
          relevantExperience: user.relevantExperience,
          idCard: user.idCard,
        });
        user.id = created._id.toString();
      } catch (e) {
        console.warn('[Store] MongoDB Atlas user creation failed, retained in memory:', e.message);
      }
    }

    // Add or update in memory cache
    const existingIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingIdx !== -1) {
      memoryUsers[existingIdx] = user;
    } else {
      memoryUsers.push(user);
    }

    saveLocalStore();
    return user;
  },

  async updateUser(id, updates) {
    await initStore();
    const idx = memoryUsers.findIndex(u => u.id === id || u._id?.toString() === id);
    if (idx !== -1) {
      memoryUsers[idx] = {
        ...memoryUsers[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveLocalStore();
    }
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await UserModel.findByIdAndUpdate(id, updates);
      } catch (e) {
        // ignore
      }
    }
    return this.findUserById(id);
  },

  async getAllUsers() {
    await initStore();
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await UserModel.find({}).lean();
        if (docs && docs.length > 0) {
          return docs.map(d => ({ ...d, id: d._id?.toString() || d.id }));
        }
      } catch (e) {
        // Fallback to memory
      }
    }
    return [...memoryUsers];
  },

  // Projects
  async getAllProjects() {
    await initStore();
    return [...memoryProjects];
  },

  async findProjectById(id) {
    await initStore();
    return memoryProjects.find(p => p.id === id) || null;
  },

  async createProject(projectData) {
    await initStore();
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const project = {
      ...projectData,
      id,
      teamMembers: projectData.teamMembers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryProjects.unshift(project);
    return project;
  },

  async updateProject(id, updates) {
    await initStore();
    const idx = memoryProjects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    memoryProjects[idx] = {
      ...memoryProjects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return memoryProjects[idx];
  },

  async addTeamMember(projectId, member) {
    await initStore();
    const project = await this.findProjectById(projectId);
    if (!project) return null;
    const exists = project.teamMembers.some(m => m.userId === member.userId);
    if (!exists) {
      project.teamMembers.push({
        ...member,
        joinedAt: new Date().toISOString(),
      });
      await this.updateProject(projectId, { teamMembers: project.teamMembers });
    }
    return project;
  },

  // Invitations
  async getInvitationsByCandidate(candidateId) {
    await initStore();
    return memoryInvitations.filter(i => i.candidateId === candidateId);
  },

  async getInvitationsByProject(projectId) {
    await initStore();
    return memoryInvitations.filter(i => i.projectId === projectId);
  },

  async findInvitationById(id) {
    await initStore();
    return memoryInvitations.find(i => i.id === id) || null;
  },

  async createInvitation(invData) {
    await initStore();
    const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const inv = {
      ...invData,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryInvitations.unshift(inv);
    return inv;
  },

  async updateInvitation(id, updates) {
    await initStore();
    const idx = memoryInvitations.findIndex(i => i.id === id);
    if (idx === -1) return null;
    memoryInvitations[idx] = {
      ...memoryInvitations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return memoryInvitations[idx];
  },

  // Tasks
  async getTasksByProject(projectId) {
    await initStore();
    return memoryTasks.filter(t => t.projectId === projectId);
  },

  async getTasksByMember(userId) {
    await initStore();
    return memoryTasks.filter(t => t.assignedTo === userId);
  },

  async findTaskById(id) {
    await initStore();
    return memoryTasks.find(t => t.id === id) || null;
  },

  async createTask(taskData) {
    await initStore();
    const id = 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date();
    const deadlineDate = new Date(taskData.deadline);
    const task = {
      ...taskData,
      id,
      status: taskData.status || 'Pending',
      isOverdue: deadlineDate < now && taskData.status !== 'Completed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    memoryTasks.push(task);
    return task;
  },

  async updateTask(id, updates) {
    await initStore();
    const idx = memoryTasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const current = memoryTasks[idx];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === 'Completed' && !current.completedAt) {
      updated.completedAt = new Date().toISOString();
      if (updated.deadline) {
        updated.completedOnTime = new Date(updated.completedAt) <= new Date(updated.deadline);
      } else {
        updated.completedOnTime = true;
      }
    }

    if (updated.deadline && updated.status !== 'Completed') {
      updated.isOverdue = new Date(updated.deadline) < new Date();
    } else {
      updated.isOverdue = false;
    }

    memoryTasks[idx] = updated;
    return updated;
  },

  async deleteTask(id) {
    await initStore();
    const idx = memoryTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      memoryTasks.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Leader Evaluations
  async getLeaderEvaluations(projectId) {
    await initStore();
    return memoryLeaderEvals.filter(e => e.projectId === projectId);
  },

  async saveLeaderEvaluation(evalData) {
    await initStore();
    const existingIdx = memoryLeaderEvals.findIndex(
      e => e.projectId === evalData.projectId &&
           e.memberId === evalData.memberId &&
           e.evaluationPeriod === evalData.evaluationPeriod
    );

    if (existingIdx !== -1) {
      memoryLeaderEvals[existingIdx] = {
        ...memoryLeaderEvals[existingIdx],
        ...evalData,
        updatedAt: new Date().toISOString(),
      };
      return memoryLeaderEvals[existingIdx];
    } else {
      const id = 'leval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newEval = {
        ...evalData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryLeaderEvals.push(newEval);
      return newEval;
    }
  },

  // Peer Evaluations
  async getPeerEvaluationsByProject(projectId) {
    await initStore();
    return memoryPeerEvals.filter(e => e.projectId === projectId);
  },

  async getPeerEvaluationsForMember(projectId, memberId) {
    await initStore();
    return memoryPeerEvals.filter(
      e => e.projectId === projectId && e.evaluatedMemberId === memberId
    );
  },

  async savePeerEvaluation(evalData) {
    await initStore();
    const existingIdx = memoryPeerEvals.findIndex(
      e => e.projectId === evalData.projectId &&
           e.evaluatorId === evalData.evaluatorId &&
           e.evaluatedMemberId === evalData.evaluatedMemberId &&
           e.evaluationPeriod === evalData.evaluationPeriod
    );

    if (existingIdx !== -1) {
      memoryPeerEvals[existingIdx] = {
        ...memoryPeerEvals[existingIdx],
        ...evalData,
        updatedAt: new Date().toISOString(),
      };
      return memoryPeerEvals[existingIdx];
    } else {
      const id = 'peval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newEval = {
        ...evalData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryPeerEvals.push(newEval);
      return newEval;
    }
  },

  // Discussions
  async getMessagesByProject(projectId) {
    await initStore();
    return memoryMessages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async createMessage(msgData) {
    await initStore();
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const msg = {
      ...msgData,
      id,
      timestamp: new Date().toISOString(),
    };
    memoryMessages.push(msg);
    return msg;
  },
};
