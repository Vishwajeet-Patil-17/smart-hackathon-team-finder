import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  UserModel,
  ProjectModel,
  InvitationModel,
  TaskModel,
  LeaderEvalModel,
  PeerEvalModel,
  TeamMessageModel,
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'local_store.json');

// In-Memory Fallback State (initialized empty)
let memoryUsers = [];
let memoryProjects = [];
let memoryInvitations = [];
let memoryTasks = [];
let memoryLeaderEvals = [];
let memoryPeerEvals = [];
let memoryMessages = [];

function docToObj(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const strId = obj._id ? obj._id.toString() : (obj.id ? obj.id.toString() : '');
  if (strId) {
    obj.id = strId;
    obj._id = strId;
  }
  return obj;
}

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
      console.log(`[Store] Local cache initialized with ${memoryUsers.length} users, ${memoryProjects.length} projects.`);
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

let storeInitialized = false;

export async function initStore() {
  if (storeInitialized) return;
  storeInitialized = true;

  // 1. Load local cache if present
  loadLocalStore();

  // 2. Synchronize memory cache from MongoDB Atlas if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const mongoUsers = await UserModel.find({}).lean();
      if (mongoUsers && mongoUsers.length > 0) {
        memoryUsers = mongoUsers.map(docToObj);
      }

      const mongoProjects = await ProjectModel.find({}).lean();
      if (mongoProjects && mongoProjects.length > 0) {
        memoryProjects = mongoProjects.map(docToObj);
      }

      const mongoInvitations = await InvitationModel.find({}).lean();
      if (mongoInvitations && mongoInvitations.length > 0) {
        memoryInvitations = mongoInvitations.map(docToObj);
      }

      const mongoTasks = await TaskModel.find({}).lean();
      if (mongoTasks && mongoTasks.length > 0) {
        memoryTasks = mongoTasks.map(docToObj);
      }

      const mongoLeaderEvals = await LeaderEvalModel.find({}).lean();
      if (mongoLeaderEvals && mongoLeaderEvals.length > 0) {
        memoryLeaderEvals = mongoLeaderEvals.map(docToObj);
      }

      const mongoPeerEvals = await PeerEvalModel.find({}).lean();
      if (mongoPeerEvals && mongoPeerEvals.length > 0) {
        memoryPeerEvals = mongoPeerEvals.map(docToObj);
      }

      saveLocalStore();
      console.log(`[Store] Synchronized with MongoDB Atlas: ${mongoUsers.length} users, ${mongoProjects.length} projects.`);
    } catch (err) {
      console.warn('[Store] MongoDB Atlas synchronization warning:', err.message);
    }
  }
}

export const dbStore = {
  // Clear all data from MongoDB and memory
  async clearAllData() {
    if (mongoose.connection.readyState === 1) {
      try {
        await Promise.all([
          UserModel.deleteMany({}),
          ProjectModel.deleteMany({}),
          InvitationModel.deleteMany({}),
          TaskModel.deleteMany({}),
          LeaderEvalModel.deleteMany({}),
          PeerEvalModel.deleteMany({}),
          TeamMessageModel.deleteMany({}),
        ]);
        console.log('[Store] MongoDB Atlas collections completely emptied.');
      } catch (err) {
        console.warn('[Store] Error clearing MongoDB Atlas collections:', err.message);
      }
    }
    memoryUsers = [];
    memoryProjects = [];
    memoryInvitations = [];
    memoryTasks = [];
    memoryLeaderEvals = [];
    memoryPeerEvals = [];
    memoryMessages = [];
    saveLocalStore();
    return true;
  },

  // USERS
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
          const user = docToObj(doc);
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

  async findUserByName(name) {
    await initStore();
    if (!name) return null;
    const clean = name.trim();
    if (mongoose.connection.readyState === 1) {
      try {
        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const doc = await UserModel.findOne({
          fullName: { $regex: new RegExp(`^${escaped}$`, 'i') },
        }).lean();
        if (doc) return docToObj(doc);
      } catch (e) {
        // Fallback
      }
    }
    return memoryUsers.find(u => u.fullName && u.fullName.toLowerCase() === clean.toLowerCase()) || null;
  },

  async findUserById(id) {
    await initStore();
    if (!id) return null;
    const idStr = String(id);

    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await UserModel.findById(idStr).lean();
        }
        if (!doc) {
          doc = await UserModel.findOne({ id: idStr }).lean();
        }
        if (doc) return docToObj(doc);
      } catch (e) {
        // Fallback
      }
    }
    return memoryUsers.find(u => u.id === idStr || u._id?.toString() === idStr) || null;
  },

  async createUser(userData) {
    await initStore();
    const normalizedEmail = (userData.email || '').toLowerCase().trim();

    let user = {
      ...userData,
      email: normalizedEmail,
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
          skills: user.skills || [],
          experienceLevel: user.experienceLevel || 'Intermediate',
          interests: user.interests || [],
          preferredRoles: user.preferredRoles || [],
          availability: user.availability || '15-20 hrs/week',
          bio: user.bio || '',
          githubUrl: user.githubUrl,
          linkedinUrl: user.linkedinUrl,
          relevantExperience: user.relevantExperience,
          idCard: user.idCard,
        });
        user = docToObj(created);
        console.log(`[Store] Created user in MongoDB Atlas: ${user.fullName} (${user.email}) ID: ${user.id}`);
      } catch (e) {
        console.warn('[Store] MongoDB Atlas user creation error, falling back to memory:', e.message);
        user.id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      user.id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

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
    const idStr = String(id);
    let updatedUser = null;

    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await UserModel.findByIdAndUpdate(idStr, updates, { returnDocument: 'after' }).lean();
        }
        if (!doc) {
          doc = await UserModel.findOneAndUpdate({ id: idStr }, updates, { returnDocument: 'after' }).lean();
        }
        if (doc) updatedUser = docToObj(doc);
      } catch (e) {
        console.warn('[Store] MongoDB updateUser error:', e.message);
      }
    }

    const idx = memoryUsers.findIndex(u => u.id === idStr || u._id?.toString() === idStr);
    if (idx !== -1) {
      memoryUsers[idx] = {
        ...memoryUsers[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (!updatedUser) updatedUser = memoryUsers[idx];
      saveLocalStore();
    }

    return updatedUser || this.findUserById(id);
  },

  async getAllUsers() {
    await initStore();
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await UserModel.find({}).lean();
        if (docs && docs.length > 0) {
          const users = docs.map(docToObj);
          memoryUsers = users;
          return users;
        }
      } catch (e) {
        // Fallback to memory
      }
    }
    return [...memoryUsers];
  },

  // PROJECTS
  async getAllProjects() {
    await initStore();
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await ProjectModel.find({}).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) {
          const projs = docs.map(docToObj);
          memoryProjects = projs;
          return projs;
        }
      } catch (e) {
        // Fallback
      }
    }
    return [...memoryProjects];
  },

  async findProjectById(id) {
    await initStore();
    if (!id) return null;
    const idStr = String(id);

    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await ProjectModel.findById(idStr).lean();
        }
        if (!doc) {
          doc = await ProjectModel.findOne({ id: idStr }).lean();
        }
        if (doc) return docToObj(doc);
      } catch (e) {
        // Fallback
      }
    }
    return memoryProjects.find(p => p.id === idStr || p._id?.toString() === idStr) || null;
  },

  async createProject(projectData) {
    await initStore();
    const normalizedMembers = (projectData.teamMembers || []).map(m => ({
      ...m,
      fullName: m.fullName || m.name || 'Team Member',
      name: m.name || m.fullName || 'Team Member',
      joinedAt: m.joinedAt || new Date().toISOString(),
    }));

    let project = {
      ...projectData,
      teamMembers: normalizedMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await ProjectModel.create({
          name: project.name,
          idea: project.idea,
          description: project.description,
          problemStatement: project.problemStatement,
          domain: project.domain,
          technicalApproach: project.technicalApproach,
          requiredSkills: project.requiredSkills || [],
          requiredRoles: project.requiredRoles || [],
          totalTeamSize: project.totalTeamSize || 4,
          preferredExperienceLevel: project.preferredExperienceLevel || 'Intermediate',
          memberResponsibilities: project.memberResponsibilities || '',
          timeline: project.timeline || '4 Weeks',
          expectedAvailability: project.expectedAvailability || '15-20 hrs/week',
          recruitmentStatus: project.recruitmentStatus || 'Open',
          leaderId: project.leaderId,
          leaderName: project.leaderName,
          leaderEmail: project.leaderEmail,
          teamMembers: normalizedMembers,
        });
        project = docToObj(created);
        console.log(`[Store] Created project in MongoDB Atlas: ${project.name} (ID: ${project.id})`);
      } catch (e) {
        console.warn('[Store] MongoDB Atlas project creation error, falling back to memory:', e.message);
        project.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      project.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    memoryProjects.unshift(project);
    saveLocalStore();
    return project;
  },

  async updateProject(id, updates) {
    await initStore();
    const idStr = String(id);

    if (updates.teamMembers) {
      updates.teamMembers = updates.teamMembers.map(m => ({
        ...m,
        fullName: m.fullName || m.name || 'Team Member',
        name: m.name || m.fullName || 'Team Member',
      }));
    }

    let updatedProject = null;
    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await ProjectModel.findByIdAndUpdate(idStr, updates, { returnDocument: 'after' }).lean();
        }
        if (!doc) {
          doc = await ProjectModel.findOneAndUpdate({ id: idStr }, updates, { returnDocument: 'after' }).lean();
        }
        if (doc) updatedProject = docToObj(doc);
      } catch (e) {
        console.warn('[Store] MongoDB updateProject error:', e.message);
      }
    }

    const idx = memoryProjects.findIndex(p => p.id === idStr || p._id?.toString() === idStr);
    if (idx !== -1) {
      memoryProjects[idx] = {
        ...memoryProjects[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (!updatedProject) updatedProject = memoryProjects[idx];
      saveLocalStore();
    }

    return updatedProject || this.findProjectById(id);
  },

  async addTeamMember(projectId, member) {
    await initStore();
    const project = await this.findProjectById(projectId);
    if (!project) return null;

    const exists = project.teamMembers.some(m => String(m.userId) === String(member.userId));
    if (!exists) {
      const fullName = member.fullName || member.name || 'Team Member';
      const updatedMembers = [
        ...project.teamMembers,
        {
          ...member,
          fullName,
          name: member.name || fullName,
          joinedAt: new Date().toISOString(),
        },
      ];
      return await this.updateProject(projectId, { teamMembers: updatedMembers });
    }
    return project;
  },

  // INVITATIONS & JOIN REQUESTS
  async getInvitationsByCandidate(candidateId) {
    await initStore();
    const cIdStr = String(candidateId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await InvitationModel.find({
          candidateId: cIdStr,
          $or: [{ type: 'invitation' }, { type: { $exists: false } }],
        }).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.filter(i => String(i.candidateId) === cIdStr && (!i.type || i.type === 'invitation'));
  },

  async getInvitationsByProject(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await InvitationModel.find({
          projectId: pIdStr,
          $or: [{ type: 'invitation' }, { type: { $exists: false } }],
        }).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.filter(i => String(i.projectId) === pIdStr && (!i.type || i.type === 'invitation'));
  },

  async getJoinRequestsByProject(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const orClauses = [{ projectId: pIdStr }];
        if (mongoose.Types.ObjectId.isValid(pIdStr)) {
          orClauses.push({ projectId: new mongoose.Types.ObjectId(pIdStr) });
        }
        const docs = await InvitationModel.find({
          $or: orClauses,
          type: 'join_request',
        }).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.filter(i => (String(i.projectId) === pIdStr || i.projectId?.toString() === pIdStr) && i.type === 'join_request');
  },

  async getJoinRequestsForLeader(leaderId, leaderEmail) {
    await initStore();
    const lIdStr = String(leaderId);
    const lEmailNorm = (leaderEmail || '').toLowerCase();
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await InvitationModel.find({
          type: 'join_request',
          $or: [
            { leaderId: lIdStr },
            { leaderEmail: lEmailNorm },
          ],
        }).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.filter(
      i => i.type === 'join_request' &&
      (String(i.leaderId) === lIdStr || (i.leaderEmail && i.leaderEmail.toLowerCase() === lEmailNorm))
    );
  },

  async getJoinRequestsByCandidate(candidateId) {
    await initStore();
    const cIdStr = String(candidateId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await InvitationModel.find({
          candidateId: cIdStr,
          type: 'join_request',
        }).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.filter(i => String(i.candidateId) === cIdStr && i.type === 'join_request');
  },

  async findInvitationById(id) {
    await initStore();
    const idStr = String(id);
    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await InvitationModel.findById(idStr).lean();
        }
        if (!doc) {
          doc = await InvitationModel.findOne({ id: idStr }).lean();
        }
        if (doc) return docToObj(doc);
      } catch (e) {
        // fallback
      }
    }
    return memoryInvitations.find(i => String(i.id) === idStr || i._id?.toString() === idStr) || null;
  },

  async createInvitation(invData) {
    await initStore();
    let inv = {
      ...invData,
      type: invData.type || 'invitation',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await InvitationModel.create(inv);
        inv = docToObj(created);
        console.log(`[Store] Created invitation in MongoDB Atlas (ID: ${inv.id})`);
      } catch (e) {
        inv.id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      inv.id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    memoryInvitations.unshift(inv);
    saveLocalStore();
    return inv;
  },

  async createJoinRequest(reqData) {
    await initStore();
    let joinReq = {
      ...reqData,
      type: 'join_request',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await InvitationModel.create(joinReq);
        joinReq = docToObj(created);
        console.log(`[Store] Created join request in MongoDB Atlas (ID: ${joinReq.id})`);
      } catch (e) {
        joinReq.id = 'jreq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      joinReq.id = 'jreq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    memoryInvitations.unshift(joinReq);
    saveLocalStore();
    return joinReq;
  },

  async updateInvitation(id, updates) {
    await initStore();
    const idStr = String(id);
    let updatedInv = null;

    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await InvitationModel.findByIdAndUpdate(idStr, updates, { returnDocument: 'after' }).lean();
        }
        if (!doc) {
          doc = await InvitationModel.findOneAndUpdate({ id: idStr }, updates, { returnDocument: 'after' }).lean();
        }
        if (doc) updatedInv = docToObj(doc);
      } catch (e) {
        // fallback
      }
    }

    const idx = memoryInvitations.findIndex(i => String(i.id) === idStr || i._id?.toString() === idStr);
    if (idx !== -1) {
      memoryInvitations[idx] = {
        ...memoryInvitations[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (!updatedInv) updatedInv = memoryInvitations[idx];
      saveLocalStore();
    }

    return updatedInv || this.findInvitationById(id);
  },

  // TASKS
  async getTasksByProject(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await TaskModel.find({ projectId: pIdStr }).sort({ deadline: 1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryTasks.filter(t => String(t.projectId) === pIdStr);
  },

  async getTasksByMember(userId) {
    await initStore();
    const uIdStr = String(userId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await TaskModel.find({ assignedTo: uIdStr }).sort({ deadline: 1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryTasks.filter(t => String(t.assignedTo) === uIdStr);
  },

  async findTaskById(id) {
    await initStore();
    const idStr = String(id);
    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await TaskModel.findById(idStr).lean();
        }
        if (!doc) {
          doc = await TaskModel.findOne({ id: idStr }).lean();
        }
        if (doc) return docToObj(doc);
      } catch (e) {
        // fallback
      }
    }
    return memoryTasks.find(t => String(t.id) === idStr || t._id?.toString() === idStr) || null;
  },

  async createTask(taskData) {
    await initStore();
    const now = new Date();
    const deadlineDate = new Date(taskData.deadline);
    let task = {
      ...taskData,
      status: taskData.status || 'Pending',
      isOverdue: deadlineDate < now && taskData.status !== 'Completed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await TaskModel.create(task);
        task = docToObj(created);
        console.log(`[Store] Created task in MongoDB Atlas: ${task.title} (ID: ${task.id})`);
      } catch (e) {
        task.id = 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      task.id = 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    memoryTasks.push(task);
    saveLocalStore();
    return task;
  },

  async updateTask(id, updates) {
    await initStore();
    const idStr = String(id);
    let updatedTask = null;

    if (updates.status === 'Completed' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
      if (updates.deadline) {
        updates.completedOnTime = new Date(updates.completedAt) <= new Date(updates.deadline);
      }
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let doc = null;
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          doc = await TaskModel.findByIdAndUpdate(idStr, updates, { returnDocument: 'after' }).lean();
        }
        if (!doc) {
          doc = await TaskModel.findOneAndUpdate({ id: idStr }, updates, { returnDocument: 'after' }).lean();
        }
        if (doc) updatedTask = docToObj(doc);
      } catch (e) {
        // fallback
      }
    }

    const idx = memoryTasks.findIndex(t => String(t.id) === idStr || t._id?.toString() === idStr);
    if (idx !== -1) {
      memoryTasks[idx] = {
        ...memoryTasks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (!updatedTask) updatedTask = memoryTasks[idx];
      saveLocalStore();
    }

    return updatedTask || this.findTaskById(id);
  },

  async deleteTask(id) {
    await initStore();
    const idStr = String(id);

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          await TaskModel.findByIdAndDelete(idStr);
        } else {
          await TaskModel.findOneAndDelete({ id: idStr });
        }
      } catch (e) {
        // fallback
      }
    }

    const idx = memoryTasks.findIndex(t => String(t.id) === idStr || t._id?.toString() === idStr);
    if (idx !== -1) {
      memoryTasks.splice(idx, 1);
      saveLocalStore();
      return true;
    }
    return false;
  },

  // LEADER EVALUATIONS
  async getLeaderEvaluations(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await LeaderEvalModel.find({ projectId: pIdStr }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryLeaderEvals.filter(e => String(e.projectId) === pIdStr);
  },

  async saveLeaderEvaluation(evalData) {
    await initStore();
    let savedEval = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          projectId: evalData.projectId,
          memberId: evalData.memberId,
          evaluationPeriod: evalData.evaluationPeriod,
        };
        const updated = await LeaderEvalModel.findOneAndUpdate(
          query,
          evalData,
          { upsert: true, returnDocument: 'after' }
        ).lean();
        savedEval = docToObj(updated);
      } catch (e) {
        console.warn('[Store] MongoDB saveLeaderEvaluation error:', e.message);
      }
    }

    const existingIdx = memoryLeaderEvals.findIndex(
      e => String(e.projectId) === String(evalData.projectId) &&
           String(e.memberId) === String(evalData.memberId) &&
           e.evaluationPeriod === evalData.evaluationPeriod
    );

    if (existingIdx !== -1) {
      memoryLeaderEvals[existingIdx] = {
        ...memoryLeaderEvals[existingIdx],
        ...evalData,
        updatedAt: new Date().toISOString(),
      };
      if (!savedEval) savedEval = memoryLeaderEvals[existingIdx];
    } else {
      const newEval = savedEval || {
        ...evalData,
        id: 'leval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryLeaderEvals.push(newEval);
      if (!savedEval) savedEval = newEval;
    }

    saveLocalStore();
    return savedEval;
  },

  // PEER EVALUATIONS
  async getPeerEvaluationsByProject(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await PeerEvalModel.find({ projectId: pIdStr }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryPeerEvals.filter(e => String(e.projectId) === pIdStr);
  },

  async getPeerEvaluationsForMember(projectId, memberId) {
    await initStore();
    const pIdStr = String(projectId);
    const mIdStr = String(memberId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await PeerEvalModel.find({
          projectId: pIdStr,
          evaluatedMemberId: mIdStr,
        }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryPeerEvals.filter(
      e => String(e.projectId) === pIdStr && String(e.evaluatedMemberId) === mIdStr
    );
  },

  async savePeerEvaluation(evalData) {
    await initStore();
    let savedEval = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          projectId: evalData.projectId,
          evaluatorId: evalData.evaluatorId,
          evaluatedMemberId: evalData.evaluatedMemberId,
          evaluationPeriod: evalData.evaluationPeriod,
        };
        const updated = await PeerEvalModel.findOneAndUpdate(
          query,
          evalData,
          { upsert: true, returnDocument: 'after' }
        ).lean();
        savedEval = docToObj(updated);
      } catch (e) {
        console.warn('[Store] MongoDB savePeerEvaluation error:', e.message);
      }
    }

    const existingIdx = memoryPeerEvals.findIndex(
      e => String(e.projectId) === String(evalData.projectId) &&
           String(e.evaluatorId) === String(evalData.evaluatorId) &&
           String(e.evaluatedMemberId) === String(evalData.evaluatedMemberId) &&
           e.evaluationPeriod === evalData.evaluationPeriod
    );

    if (existingIdx !== -1) {
      memoryPeerEvals[existingIdx] = {
        ...memoryPeerEvals[existingIdx],
        ...evalData,
        updatedAt: new Date().toISOString(),
      };
      if (!savedEval) savedEval = memoryPeerEvals[existingIdx];
    } else {
      const newEval = savedEval || {
        ...evalData,
        id: 'peval_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryPeerEvals.push(newEval);
      if (!savedEval) savedEval = newEval;
    }

    saveLocalStore();
    return savedEval;
  },

  // TEAM MESSAGES
  async getMessagesByProject(projectId) {
    await initStore();
    const pIdStr = String(projectId);
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await TeamMessageModel.find({ projectId: pIdStr }).sort({ timestamp: 1 }).lean();
        if (docs && docs.length > 0) return docs.map(docToObj);
      } catch (e) {
        // fallback
      }
    }
    return memoryMessages
      .filter(m => String(m.projectId) === pIdStr)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async createMessage(msgData) {
    await initStore();
    let msg = {
      ...msgData,
      timestamp: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await TeamMessageModel.create(msg);
        msg = docToObj(created);
      } catch (e) {
        msg.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
    } else {
      msg.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    memoryMessages.push(msg);
    saveLocalStore();
    return msg;
  },
};
