import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { api } from '../services/api.js';
import { CandidateMatchCard } from './CandidateMatchCard.jsx';
import { TaskBoard } from './TaskBoard.jsx';
import { ProfileViewModal } from './ProfileViewModal.jsx';
import { EvaluationModal } from './EvaluationModal.jsx';
import { ReliabilityCard } from './ReliabilityCard.jsx';
import {
  Shield,
  Users,
  Target,
  Mail,
  Award,
  Layers,
  Sparkles,
  Clock,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ArrowRight,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

const CACHE_PREFIX = 'smart_hackathon_leader_cache_';

const getCachedDashboard = (projId) => {
  if (!projId || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${projId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedDashboard = (projId, data) => {
  if (!projId || !data || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${projId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
};

const POPULAR_SKILL_PRESETS = [
  'React',
  'Node.js',
  'MongoDB',
  'TypeScript',
  'Python',
  'Docker',
  'Tailwind CSS',
  'FastAPI',
  'Express.js',
  'UI/UX Design',
];

const POPULAR_ROLE_PRESETS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'DevOps Engineer',
  'ML / AI Engineer',
];

export const LeaderDashboard = ({
  initialProjectId,
  onOpenCreateProject,
  onOpenAuth,
  onNavigateToStudent,
}) => {
  const { user } = useAuth();
  const [projectsLed, setProjectsLed] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId || '');
  
  // Instant display from cache if available
  const [dashboardData, setDashboardData] = useState(() => getCachedDashboard(initialProjectId));
  const [isLoading, setIsLoading] = useState(!dashboardData && Boolean(user));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(dashboardData ? new Date() : null);

  const [activeTab, setActiveTab] = useState('balance');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Evaluation and Profile modals
  const [evalModalTarget, setEvalModalTarget] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Inline project creation state
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    idea: '',
    description: '',
    problemStatement: '',
    technicalApproach: '',
    totalTeamSize: 4,
    preferredExperienceLevel: 'Intermediate',
    timeline: '4-Week Hackathon Sprint',
    expectedAvailability: '15-20 hrs/week',
    skills: [
      { skill: 'React', minProficiency: 'Intermediate', isMandatory: true },
      { skill: 'Node.js', minProficiency: 'Intermediate', isMandatory: true },
      { skill: 'MongoDB', minProficiency: 'Intermediate', isMandatory: true },
    ],
    roles: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer'],
  });
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillProf, setCustomSkillProf] = useState('Intermediate');
  const [customRoleName, setCustomRoleName] = useState('');

  // Stabilize state via refs to prevent re-render cascading and infinite loops
  const dashboardDataRef = useRef(dashboardData);
  useEffect(() => {
    dashboardDataRef.current = dashboardData;
  }, [dashboardData]);

  const activeProjectIdRef = useRef(activeProjectId);
  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const fetchDashboardData = useCallback(async (projId, silent = false) => {
    if (!projId) {
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    const cached = getCachedDashboard(projId);
    const hasCurrentData = Boolean(dashboardDataRef.current);

    if (cached && !hasCurrentData) {
      setDashboardData(cached);
      setIsLoading(false);
      setIsSyncing(true);
    } else if (!hasCurrentData && !silent) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const data = await api.getLeaderDashboard(projId);
      setDashboardData(data);
      setCachedDashboard(projId, data);
      setLastSyncTime(new Date());
      setActionFeedback(null);
    } catch (e) {
      console.warn('Failed to fetch leader dashboard:', e);
      // Surface errors on initial fetch (when no data exists) or when explicitly not silent
      if (!silent || !dashboardDataRef.current) {
        if (!cached) {
          setDashboardData(null);
        }
        setActionFeedback({
          type: 'error',
          message: e.message || 'Access Denied: Only the team leader of this project can view this dashboard.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []); // Completely stable! No dashboardData dep.

  const fetchDashboardDataRef = useRef(fetchDashboardData);
  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjectsLed([]);
      setActiveProjectId('');
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getProjects();
      const allProjects = res.projects || [];
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userId = user?.id ? String(user.id) : (user?._id ? String(user._id) : '');

      const led = allProjects.filter(p => {
        const pLeaderId = p.leaderId ? String(typeof p.leaderId === 'object' ? (p.leaderId._id ?? p.leaderId.id ?? p.leaderId) : p.leaderId) : '';
        const pLeaderEmail = (p.leaderEmail || '').toLowerCase().trim();
        const isMemberLeader = Array.isArray(p.teamMembers) && p.teamMembers.some(m => {
          const mId = m.userId ? String(typeof m.userId === 'object' ? (m.userId._id ?? m.userId.id ?? m.userId) : m.userId) : '';
          const mEmail = (m.email || '').toLowerCase().trim();
          const isRoleLeader = (m.role || '').toLowerCase().includes('leader');
          return isRoleLeader && ((Boolean(userId) && mId === userId) || (Boolean(userEmail) && mEmail === userEmail));
        });

        return (Boolean(userId) && Boolean(pLeaderId) && pLeaderId === userId) ||
               (Boolean(userEmail) && Boolean(pLeaderEmail) && pLeaderEmail === userEmail) ||
               isMemberLeader;
      });

      setProjectsLed(led);
      if (led.length > 0) {
        const currentActive = activeProjectIdRef.current;
        const targetId = (currentActive && led.some(p => String(p.id || p._id) === String(currentActive)))
          ? currentActive
          : String(led[0].id || led[0]._id);

        if (targetId !== currentActive) {
          setActiveProjectId(targetId);
        } else {
          // Trigger fetch via ref
          if (fetchDashboardDataRef.current) {
            await fetchDashboardDataRef.current(targetId);
          }
        }
      } else {
        setActiveProjectId('');
        setDashboardData(null);
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
      setProjectsLed([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Depends strictly on user

  const fetchProjectsRef = useRef(fetchProjects);
  useEffect(() => {
    fetchProjectsRef.current = fetchProjects;
  }, [fetchProjects]);

  const { subscribe } = useRealtime();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (initialProjectId && String(initialProjectId) !== String(activeProjectIdRef.current)) {
      setActiveProjectId(String(initialProjectId));
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      // Check cache first for instant render
      const cached = getCachedDashboard(activeProjectId);
      if (cached) {
        setDashboardData(cached);
      }
      fetchDashboardData(activeProjectId);
    }
  }, [activeProjectId, fetchDashboardData]);

  // Real-time synchronization
  useEffect(() => {
    if (!activeProjectId) return;

    const unsubs = [
      subscribe('task:created', () => fetchDashboardDataRef.current?.(activeProjectId, true)),
      subscribe('task:updated', () => fetchDashboardDataRef.current?.(activeProjectId, true)),
      subscribe('invitation:accepted', () => {
        fetchDashboardDataRef.current?.(activeProjectId, true);
        fetchProjectsRef.current?.();
      }),
      subscribe('invitation:rejected', () => fetchDashboardDataRef.current?.(activeProjectId, true)),
      subscribe('join_request:sent', () => fetchDashboardDataRef.current?.(activeProjectId, true)),
      subscribe('join_request:approved', () => {
        fetchDashboardDataRef.current?.(activeProjectId, true);
        fetchProjectsRef.current?.();
      }),
      subscribe('project:updated', () => fetchDashboardDataRef.current?.(activeProjectId, true)),
    ];

    // Visibility-aware background polling every 20 seconds
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchDashboardDataRef.current?.(activeProjectId, true);
      }
    }, 20000);

    return () => {
      unsubs.forEach(u => u && u());
      clearInterval(pollInterval);
    };
  }, [activeProjectId, subscribe]);

  const handleInvite = async (candidateId, proposedRole, message) => {
    if (!activeProjectId) return;
    try {
      await api.sendInvitation({
        projectId: activeProjectId,
        candidateId,
        proposedRole,
        message,
      });
      setActionFeedback({ type: 'success', message: 'Invitation sent successfully to candidate!' });
      await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to send invitation.' });
    }
  };

  const handleCancelInvite = async (invId) => {
    try {
      await api.cancelInvitation(invId);
      setActionFeedback({ type: 'success', message: 'Invitation cancelled.' });
      if (activeProjectId) await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to cancel invitation.' });
    }
  };

  const handleApproveJoinRequest = async (requestId) => {
    try {
      const res = await api.approveJoinRequest(requestId);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Candidate approved and added to team successfully!',
      });
      if (activeProjectId) {
        await fetchDashboardData(activeProjectId, true);
        await fetchProjects();
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to approve join request.' });
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      await api.rejectInvitation(requestId);
      setActionFeedback({ type: 'success', message: 'Join request declined.' });
      if (activeProjectId) await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to decline join request.' });
    }
  };

  const handleTaskCreated = async (taskData) => {
    try {
      await api.createTask(taskData);
      setActionFeedback({ type: 'success', message: 'Sprint task created successfully.' });
      if (activeProjectId) await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to create task.' });
    }
  };

  const handleTaskStatusChanged = async (taskId, status) => {
    try {
      await api.updateTaskStatus(taskId, status);
      if (activeProjectId) await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update task status.' });
    }
  };

  const handleLeaderEvalSubmit = async (evalData) => {
    try {
      await api.submitLeaderEvaluation(evalData);
      setActionFeedback({ type: 'success', message: 'Leader evaluation submitted successfully.' });
      if (activeProjectId) await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to submit evaluation.' });
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeProjectId) return;
    try {
      await api.updateProject(activeProjectId, { recruitmentStatus: newStatus });
      setActionFeedback({ type: 'success', message: `Recruitment status changed to ${newStatus}.` });
      await fetchDashboardData(activeProjectId, true);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Inline Project Creation Handlers
  const handleAddPresetSkill = (skillName) => {
    if (newProjectForm.skills.some(s => s.skill.toLowerCase() === skillName.toLowerCase())) return;
    setNewProjectForm(prev => ({
      ...prev,
      skills: [...prev.skills, { skill: skillName, minProficiency: 'Intermediate', isMandatory: true }],
    }));
  };

  const handleAddCustomSkill = () => {
    if (!customSkillName.trim()) return;
    if (newProjectForm.skills.some(s => s.skill.toLowerCase() === customSkillName.trim().toLowerCase())) return;
    setNewProjectForm(prev => ({
      ...prev,
      skills: [...prev.skills, { skill: customSkillName.trim(), minProficiency: customSkillProf, isMandatory: true }],
    }));
    setCustomSkillName('');
  };

  const handleRemoveSkill = (index) => {
    setNewProjectForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleToggleRole = (roleName) => {
    setNewProjectForm(prev => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter(r => r !== roleName) : [...prev.roles, roleName],
      };
    });
  };

  const handleAddCustomRole = () => {
    if (!customRoleName.trim()) return;
    if (newProjectForm.roles.includes(customRoleName.trim())) return;
    setNewProjectForm(prev => ({
      ...prev,
      roles: [...prev.roles, customRoleName.trim()],
    }));
    setCustomRoleName('');
  };

  const handleInlineProjectSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newProjectForm.name.trim() || !newProjectForm.idea.trim() || !newProjectForm.problemStatement.trim() || !newProjectForm.technicalApproach.trim()) {
      setCreateError('Please complete all required fields (Project Name, Hackathon Idea, Problem Statement, and Technical Approach).');
      return;
    }
    if (newProjectForm.skills.length === 0) {
      setCreateError('Please select or add at least one required technical skill.');
      return;
    }
    if (newProjectForm.roles.length === 0) {
      setCreateError('Please specify at least one required team role.');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const res = await api.createProject({
        name: newProjectForm.name.trim(),
        idea: newProjectForm.idea.trim(),
        description: newProjectForm.description.trim() || newProjectForm.idea.trim(),
        problemStatement: newProjectForm.problemStatement.trim(),
        technicalApproach: newProjectForm.technicalApproach.trim(),
        totalTeamSize: Number(newProjectForm.totalTeamSize) || 4,
        preferredExperienceLevel: newProjectForm.preferredExperienceLevel,
        timeline: newProjectForm.timeline,
        expectedAvailability: newProjectForm.expectedAvailability,
        requiredSkills: newProjectForm.skills,
        requiredRoles: newProjectForm.roles,
      });

      const newProj = res.project || res;
      const newId = String(newProj.id || newProj._id);

      setActionFeedback({
        type: 'success',
        message: `Project "${newProj.name}" launched successfully! Leader dashboard is now active.`,
      });

      setShowInlineCreate(false);
      setProjectsLed(prev => [newProj, ...prev]);
      setActiveProjectId(newId);
      await fetchDashboardData(newId);
    } catch (err) {
      setCreateError(err.message || 'Failed to create project. Please verify all details.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // 1. Not Logged In View
  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm my-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Team Leader Dashboard</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Please sign in to manage your hackathon projects, inspect candidate matching, and review sprint progress.
          </p>
        </div>
        <button
          onClick={() => onOpenAuth?.('login')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Sign In as Team Leader
        </button>
      </div>
    );
  }

  // 2. Initial Loading State (only if no cache exists)
  if (isLoading && projectsLed.length === 0 && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-gray-500 text-sm gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="font-medium">Loading your projects...</span>
      </div>
    );
  }

  // 3. Inline Project Creation Card (When user has 0 projects led OR clicked "+ New Project")
  if ((!isLoading && projectsLed.length === 0) || showInlineCreate) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 my-4">
        {actionFeedback && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Leader Onboarding
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  Launch Your Hackathon Project as Team Leader
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set up your project idea, required skills, and team capacity. Your Team Leader Dashboard activates immediately on creation.
                </p>
              </div>
            </div>

            {projectsLed.length > 0 && (
              <button
                type="button"
                onClick={() => setShowInlineCreate(false)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer border border-gray-300"
              >
                Back to Dashboard
              </button>
            )}
          </div>

          {createError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleInlineProjectSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-semibold text-gray-800">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Smart Campus Energy Optimizer"
                  value={newProjectForm.name}
                  onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-semibold text-gray-800">
                  Hackathon Idea / Short Pitch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="One-line elevator pitch explaining the core software concept..."
                  value={newProjectForm.idea}
                  onChange={e => setNewProjectForm({ ...newProjectForm, idea: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-800">
                  Problem Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What technical problem does this hackathon project address?"
                  value={newProjectForm.problemStatement}
                  onChange={e => setNewProjectForm({ ...newProjectForm, problemStatement: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-800">
                  Technical Approach <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Architecture, libraries, APIs, and methodology to build this solution..."
                  value={newProjectForm.technicalApproach}
                  onChange={e => setNewProjectForm({ ...newProjectForm, technicalApproach: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-800">Total Team Size (including Leader)</label>
                <select
                  value={newProjectForm.totalTeamSize}
                  onChange={e => setNewProjectForm({ ...newProjectForm, totalTeamSize: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                >
                  <option value={2}>2 Members (Pair Programming)</option>
                  <option value={3}>3 Members (Compact Squad)</option>
                  <option value={4}>4 Members (Standard Hackathon Team)</option>
                  <option value={5}>5 Members (Extended Team)</option>
                  <option value={6}>6 Members (Large Sprint Team)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-800">Preferred Experience Level</label>
                <select
                  value={newProjectForm.preferredExperienceLevel}
                  onChange={e => setNewProjectForm({ ...newProjectForm, preferredExperienceLevel: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
                >
                  <option value="Beginner">Beginner Friendly (1st & 2nd Year)</option>
                  <option value="Intermediate">Intermediate (Hands-on experience)</option>
                  <option value="Advanced">Advanced (Production-ready Hackathon)</option>
                </select>
              </div>
            </div>

            {/* Skills Selection */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs">Required Technical Skills</h4>
                  <p className="text-[11px] text-gray-500">
                    Smart matching uses these to calculate candidate compatibility (Formula: 0.50S + 0.25E + 0.25A).
                  </p>
                </div>
              </div>

              {/* Quick Add Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-gray-500 font-medium mr-1">Quick add:</span>
                {POPULAR_SKILL_PRESETS.map(sk => {
                  const isAdded = newProjectForm.skills.some(s => s.skill.toLowerCase() === sk.toLowerCase());
                  return (
                    <button
                      key={sk}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddPresetSkill(sk)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border-gray-300 hover:border-indigo-300'
                      }`}
                    >
                      + {sk}
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Skills List */}
              <div className="flex flex-wrap gap-2 pt-1">
                {newProjectForm.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-lg font-medium"
                  >
                    <span>{s.skill}</span>
                    <span className="text-[10px] text-indigo-500 font-mono">({s.minProficiency})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-indigo-400 hover:text-indigo-700 ml-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Custom Skill Input */}
              <div className="flex items-center gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. GraphQL, Solidity)"
                  value={customSkillName}
                  onChange={e => setCustomSkillName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                />
                <select
                  value={customSkillProf}
                  onChange={e => setCustomSkillProf(e.target.value)}
                  className="p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold border border-gray-300 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Roles Selection */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900 text-xs">Required Team Roles</h4>
                <p className="text-[11px] text-gray-500">
                  Select the roles you need filled to evaluate team-balance coverage.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_ROLE_PRESETS.map(role => {
                  const isSelected = newProjectForm.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleRole(role)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {role}
                    </button>
                  );
                })}
              </div>

              {/* Custom Role Input */}
              <div className="flex items-center gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  placeholder="Custom role name"
                  value={customRoleName}
                  onChange={e => setCustomRoleName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold border border-gray-300 cursor-pointer"
                >
                  Add Role
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
              {onNavigateToStudent && (
                <button
                  type="button"
                  onClick={onNavigateToStudent}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold border border-gray-300 transition-colors cursor-pointer"
                >
                  Return to Student Dashboard
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmittingProject}
                className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmittingProject ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Launching Project...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Launch Hackathon Project & Open Leader Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Loading fallback if no data could be loaded
  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 text-sm gap-4 p-6">
        {actionFeedback && actionFeedback.type === 'error' ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl max-w-md text-center text-xs space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-rose-900 mb-1">Unable to Load Dashboard</p>
              <p className="text-rose-700 leading-relaxed">{actionFeedback.message}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionFeedback(null);
                  if (activeProjectId) {
                    fetchDashboardData(activeProjectId);
                  } else {
                    fetchProjects();
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {onNavigateToStudent && (
                <button
                  type="button"
                  onClick={onNavigateToStudent}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-medium cursor-pointer shadow-xs transition-colors"
                >
                  Return to Student Dashboard
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="font-medium text-gray-700">Loading Team Leader dashboard...</span>
            <button
              type="button"
              onClick={() => {
                if (activeProjectId) {
                  fetchDashboardData(activeProjectId);
                } else {
                  fetchProjects();
                }
              }}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
            >
              Taking too long? Click here to refresh
            </button>
          </div>
        )}
      </div>
    );
  }

  const {
    project,
    teamMembers = [],
    currentTeamSize = 1,
    requiredTeamSize = 4,
    isTeamFull = false,
    candidateRecommendations = [],
    teamBalance = {
      roleCoveragePercentage: 0,
      skillCoveragePercentage: 0,
      coveredRoles: [],
      missingRoles: [],
      coveredSkills: [],
      missingSkills: [],
      recommendedCandidatesForMissingRoles: [],
    },
    activeInvitations = [],
    pendingJoinRequests = [],
    tasks = [],
    taskCompletionPercentage = 0,
    memberProgress = [],
  } = dashboardData;

  const currentProjectLed = projectsLed.find(p => String(p.id || p._id) === String(activeProjectId));

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs transition-all ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Project Selector & Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Leader Portal
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  project.recruitmentStatus === 'Open'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  Status: {project.recruitmentStatus}
                </span>

                {/* Live Background Sync Indicator */}
                {isSyncing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                ) : lastSyncTime ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Live</span>
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{project.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Compact Project Selector Dropdown with Capacity Badges */}
            {projectsLed.length > 1 && (
              <div className="relative">
                <select
                  value={activeProjectId}
                  onChange={e => setActiveProjectId(e.target.value)}
                  className="text-xs py-2 px-3 pr-8 border border-gray-300 rounded-xl bg-white text-gray-800 font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs cursor-pointer appearance-none"
                >
                  {projectsLed.map(p => {
                    const id = String(p.id || p._id);
                    const count = (p.members || p.teamMembers || []).length || 1;
                    const max = p.totalTeamSize || p.requiredTeamSize || 4;
                    const status = p.recruitmentStatus || 'Open';
                    return (
                      <option key={id} value={id}>
                        {p.name} — [{count}/{max} Members • {status}]
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Quick Button to Launch Another Project */}
            <button
              type="button"
              onClick={() => setShowInlineCreate(true)}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>New Project</span>
            </button>

            {/* Recruitment Status Control */}
            <select
              value={project.recruitmentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs p-2 border border-gray-300 rounded-xl bg-white text-gray-800 font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs cursor-pointer"
            >
              <option value="Open">Recruitment: Open</option>
              <option value="Closed">Recruitment: Closed</option>
              <option value="Completed">Project: Completed</option>
            </select>

            {project.recruitmentStatus === 'Completed' ? (
              <button
                type="button"
                onClick={() => handleStatusChange('Open')}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Reopen Project
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('Completed')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Key Metrics KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Team Capacity</span>
            <div className="font-bold text-gray-900 text-base mt-0.5 font-mono">
              {currentTeamSize} / {requiredTeamSize} Students
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentTeamSize / requiredTeamSize) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Role Coverage</span>
            <div className="font-bold text-gray-900 text-base mt-0.5 font-mono">
              {teamBalance.roleCoveragePercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${teamBalance.roleCoveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Skill Coverage</span>
            <div className="font-bold text-gray-900 text-base mt-0.5 font-mono">
              {teamBalance.skillCoveragePercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${teamBalance.skillCoveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Tasks Completed</span>
            <div className="font-bold text-gray-900 text-base mt-0.5 font-mono">
              {taskCompletionPercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${taskCompletionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PENDING JOIN REQUESTS ALERT */}
      {pendingJoinRequests.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Pending Student Join Requests ({pendingJoinRequests.length})</span>
            </div>
            <span className="text-[11px] text-gray-500">
              Students wanting to collaborate on {project.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {pendingJoinRequests.map(req => (
              <div
                key={req.id}
                className="p-4 bg-white border border-gray-200 rounded-xl space-y-2.5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">{req.candidateName}</h5>
                      <p className="text-[11px] text-gray-500">
                        {req.candidateAcademicYear} • {req.candidateDepartment}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold">
                      Role: {req.proposedRole}
                    </span>
                  </div>

                  {req.message && (
                    <p className="text-gray-700 italic bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[11px]">
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        const prof = await api.getProfile(req.candidateId);
                        setSelectedCandidate(prof.profile);
                      } catch {
                        setSelectedCandidate({
                          id: req.candidateId,
                          fullName: req.candidateName,
                          email: req.candidateEmail,
                          department: req.candidateDepartment,
                          academicYear: req.candidateAcademicYear,
                        });
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer underline underline-offset-2"
                  >
                    View Profile & ID Card
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRejectJoinRequest(req.id || req._id)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveJoinRequest(req.id || req._id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Team-Balance Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'candidates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart Matching Candidates ({candidateRecommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('join-requests')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'join-requests'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Join Requests</span>
          {pendingJoinRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              {pendingJoinRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sprint Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'evaluations'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Member Evaluations & Reliability</span>
        </button>
      </div>

      {/* TAB 1: TEAM-BALANCE ANALYSIS */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Team-Balance Analysis</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Evaluates role distribution and technical skill coverage across all {teamMembers.length} active team members.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Coverage */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">Role Coverage</span>
                  <span className="text-sm font-bold text-indigo-600 font-mono">
                    {teamBalance.roleCoveragePercentage}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${teamBalance.roleCoveragePercentage}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Covered Roles ({teamBalance.coveredRoles.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.coveredRoles.length > 0 ? (
                        teamBalance.coveredRoles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px]">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No roles covered yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Missing Roles ({teamBalance.missingRoles.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.missingRoles.length > 0 ? (
                        teamBalance.missingRoles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-medium">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-700 font-medium">All required team roles covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Coverage */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">Skill Coverage</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">
                    {teamBalance.skillCoveragePercentage}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${teamBalance.skillCoveragePercentage}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Covered Skills ({teamBalance.coveredSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.coveredSkills.length > 0 ? (
                        teamBalance.coveredSkills.map((s, i) => {
                          const name = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                          return (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px]">
                              {name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 italic">No skills covered yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Missing Skills ({teamBalance.missingSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.missingSkills.length > 0 ? (
                        teamBalance.missingSkills.map((s, i) => {
                          const name = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                          return (
                            <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium">
                              {name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-emerald-700 font-medium">All required skills covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Candidates for Missing Roles */}
            {teamBalance.recommendedCandidatesForMissingRoles && teamBalance.recommendedCandidatesForMissingRoles.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Candidates Specifically Matching Missing Roles & Skills</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teamBalance.recommendedCandidatesForMissingRoles.map(rec => (
                    <CandidateMatchCard
                      key={rec.candidate.id}
                      recommendation={rec}
                      onInvite={handleInvite}
                      onViewProfile={c => setSelectedCandidate(c)}
                      isTeamFull={isTeamFull}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Team Members Roster */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Current Team Members ({teamMembers.length} / {requiredTeamSize})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMembers.map(m => {
                const memberName = m.fullName || m.name || 'Team Member';
                const initial = memberName.charAt(0);

                return (
                  <div
                    key={m.userId}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{memberName}</div>
                        <div className="text-[11px] text-gray-500">{m.academicYear || 'WCE'} • {m.department || 'Engineering'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-gray-500">Role:</span>
                      <span className="font-semibold text-indigo-700">{m.role || 'Member'}</span>
                    </div>

                    {m.userId !== user?.id && (
                      project.recruitmentStatus === 'Completed' ? (
                        <button
                          onClick={() => setEvalModalTarget({ userId: m.userId, fullName: memberName, role: m.role || 'Member' })}
                          className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Evaluate Member Rubric
                        </button>
                      ) : (
                        <div className="text-[10px] text-center text-gray-400 py-1 font-medium bg-gray-100 rounded border border-gray-200">
                          Evaluation unlocks on project completion
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE MATCHING */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>Candidate Recommendations</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Formula: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px] border border-gray-200">0.50S + 0.25E + 0.25A</code>
                </p>
              </div>

              {isTeamFull && (
                <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                  Team is Full ({currentTeamSize}/{requiredTeamSize})
                </span>
              )}
            </div>
          </div>

          {candidateRecommendations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-xs">
              {isTeamFull
                ? 'Your team has reached maximum capacity. Recruitment is fulfilled.'
                : 'No additional candidate recommendations available at this time.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateRecommendations.map(rec => (
                <CandidateMatchCard
                  key={rec.candidate.id}
                  recommendation={rec}
                  onInvite={handleInvite}
                  onViewProfile={c => setSelectedCandidate(c)}
                  isTeamFull={isTeamFull}
                />
              ))}
            </div>
          )}

          {/* Active Pending Invitations */}
          {activeInvitations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Pending Outgoing Invitations ({activeInvitations.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activeInvitations.map(inv => (
                  <div
                    key={inv.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{inv.candidateName}</div>
                      <div className="text-[11px] text-gray-500">Proposed: {inv.proposedRole}</div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded font-medium cursor-pointer"
                    >
                      Cancel Invitation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: JOIN REQUESTS */}
      {activeTab === 'join-requests' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Candidate Join Requests</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and respond to students who submitted join requests for <strong className="text-gray-800">{project.name}</strong>.
              </p>
            </div>

            <button
              onClick={() => fetchDashboardData(activeProjectId)}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Refresh Requests</span>
            </button>
          </div>

          {/* Pending Requests List */}
          {pendingJoinRequests.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
              <p className="font-medium text-gray-700">No pending join requests for this project at this time.</p>
              <p className="text-[11px] text-gray-400">
                When students request to join your hackathon project, their requests and proposed roles will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingJoinRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{req.candidateName}</h4>
                        <p className="text-xs text-gray-500">
                          {req.candidateAcademicYear || 'WCE'} • {req.candidateDepartment || 'Engineering'}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{req.candidateEmail}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shrink-0">
                        Role: {req.proposedRole}
                      </span>
                    </div>

                    {req.message && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700 italic">
                        "{req.message}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 flex-wrap">
                    <button
                      onClick={async () => {
                        try {
                          const prof = await api.getProfile(req.candidateId);
                          setSelectedCandidate(prof.profile);
                        } catch {
                          setSelectedCandidate({
                            id: req.candidateId,
                            fullName: req.candidateName,
                            email: req.candidateEmail,
                            department: req.candidateDepartment,
                            academicYear: req.candidateAcademicYear,
                          });
                        }
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer underline underline-offset-2"
                    >
                      View Student Profile & ID Card
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectJoinRequest(req.id || req._id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveJoinRequest(req.id || req._id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Add to Team</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS & DEADLINES */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Assigned Tasks Summary for Leader */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Sprint Tasks Assignment Summary ({tasks.length})</span>
              </h4>
              <span className="text-xs text-gray-500 font-mono">
                {tasks.filter(t => t.status === 'Completed').length} / {tasks.length} Completed
              </span>
            </div>

            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-[11px]">
                      <th className="py-2 px-3">Task Title</th>
                      <th className="py-2 px-3">Assigned Member</th>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Deadline</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-900">{t.title}</td>
                        <td className="py-2 px-3 text-gray-600">{t.assignedToName || 'Unassigned'}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.priority === 'Urgent'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : t.priority === 'High'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 font-mono">
                          {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No tasks created yet for this project.</p>
            )}
          </div>

          <TaskBoard
            tasks={tasks}
            teamMembers={teamMembers}
            isLeader={true}
            currentUserId={user?.id || ''}
            projectId={project.id}
            onTaskCreated={handleTaskCreated}
            onTaskStatusChanged={handleTaskStatusChanged}
            onTaskEdited={() => fetchDashboardData(activeProjectId, true)}
          />
        </div>
      )}

      {/* TAB 5: MEMBER EVALUATIONS & RELIABILITY */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Team Member Evaluations & Reliability Scores</span>
            </h3>
            <p className="text-xs text-gray-500">
              Evaluations inform transparent collaboration metrics: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px] border border-gray-200">0.50T + 0.30D + 0.20P</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {memberProgress.map(mp => {
              const mName = mp.memberName || mp.name || 'Team Member';
              const mInitial = (mName || 'M').charAt(0);
              const isNotCurrentUser = String(mp.memberId) !== String(user?.id || user?._id || '');
              const isProjectCompleted = (project?.recruitmentStatus || '') === 'Completed';

              return (
                <div key={mp.memberId} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                        {mInitial}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{mName}</h4>
                        <p className="text-xs text-gray-500">Role: <span className="font-medium text-gray-700">{mp.role || 'Member'}</span></p>
                      </div>
                    </div>

                    {isNotCurrentUser && (
                      isProjectCompleted ? (
                        <button
                          type="button"
                          onClick={() => setEvalModalTarget({ userId: mp.memberId, fullName: mName, role: mp.role })}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Submit / Update Leader Evaluation
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl font-medium">
                          Evaluations are available only after the project is marked as completed by the team leader.
                        </span>
                      )
                    )}
                  </div>

                <ReliabilityCard
                  reliability={mp.reliabilityScore}
                  studentName={mp.memberName}
                />
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Leader Evaluation Modal */}
      {evalModalTarget && (
        <EvaluationModal
          isOpen={Boolean(evalModalTarget)}
          onClose={() => setEvalModalTarget(null)}
          type="leader"
          projectId={project.id}
          projectName={project.name}
          targetMemberId={evalModalTarget.userId}
          targetMemberName={evalModalTarget.fullName}
          targetMemberRole={evalModalTarget.role}
          onSubmit={handleLeaderEvalSubmit}
        />
      )}

      {/* Candidate Profile & ID Card Preview Modal */}
      {selectedCandidate && (
        <ProfileViewModal
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
          profile={selectedCandidate}
          isSelf={selectedCandidate.id === user?.id}
        />
      )}
    </div>
  );
};
