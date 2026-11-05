import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { api } from '../services/api.js';
import { ReliabilityCard } from './ReliabilityCard.jsx';
import { EvaluationModal } from './EvaluationModal.jsx';
import { ProjectDetailModal } from './ProjectDetailModal.jsx';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  Star,
  Users,
  ArrowRight,
  Plus,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
} from 'lucide-react';

const STUDENT_CACHE_PREFIX = 'smart_hackathon_student_cache_';

const getCachedStudentDashboard = (uid) => {
  if (!uid || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${STUDENT_CACHE_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedStudentDashboard = (uid, data) => {
  if (!uid || !data || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${STUDENT_CACHE_PREFIX}${uid}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Student cache write warning:', e);
  }
};

export const StudentDashboard = ({
  onNavigateToLeader,
  onOpenCreateProject,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const userId = user?.id || user?._id || '';

  const [dashboardData, setDashboardData] = useState(() => getCachedStudentDashboard(userId));
  const [isLoading, setIsLoading] = useState(!dashboardData && Boolean(user));
  const [selectedProject, setSelectedProject] = useState(null);

  const [actionFeedback, setActionFeedback] = useState(null);

  // Peer eval modal state
  const [peerEvalTarget, setPeerEvalTarget] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [selectedReliabilityIdx, setSelectedReliabilityIdx] = useState(0);

  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const fetchDashboard = async (silent = false) => {
    if (!user) {
      if (!silent) setIsLoading(false);
      return;
    }
    const currentCached = getCachedStudentDashboard(userId);
    if (currentCached && !dashboardData) {
      setDashboardData(currentCached);
    }
    if (!silent && !dashboardData && !currentCached) {
      setIsLoading(true);
    }
    try {
      const data = await api.getStudentDashboard();
      setDashboardData(data);
      setCachedStudentDashboard(userId, data);
    } catch (err) {
      console.warn('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      const cached = getCachedStudentDashboard(userId);
      if (cached) {
        setDashboardData(cached);
        setIsLoading(false);
      }
    }
    fetchDashboard(Boolean(dashboardData));
  }, [user]);

  // Real-time synchronization
  useEffect(() => {
    if (!user) return;

    const unsubs = [
      subscribe('invitation:sent', (data) => {
        if (data.candidateId === user.id) {
          fetchDashboard(true);
          setActionFeedback({ type: 'info', message: 'You received a new team invitation!' });
        }
      }),
      subscribe('task:created', (data) => {
        if (data.assignedTo === user.id) {
          fetchDashboard(true);
          setActionFeedback({ type: 'info', message: `New task assigned to you: "${data.task?.title}"` });
        }
      }),
      subscribe('task:status_updated', () => {
        fetchDashboard(true);
      }),
      subscribe('task:updated', () => {
        fetchDashboard(true);
      }),
      subscribe('invitation:responded', () => {
        fetchDashboard(true);
      }),
      subscribe('project:completed', () => {
        fetchDashboard(true);
      }),
    ];

    return () => {
      unsubs.forEach(un => un && un());
    };
  }, [user, subscribe]);

  const handleRespondInvitation = async (invitationId, status) => {
    try {
      await api.respondInvitation(invitationId, status);
      setActionFeedback({
        type: 'success',
        message: `Invitation successfully ${status.toLowerCase()}ed!`,
      });
      fetchDashboard(true);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to respond to invitation.',
      });
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await api.updateTaskStatus(taskId, status);
      fetchDashboard(true);
      setActionFeedback({
        type: 'success',
        message: `Task marked as ${status}!`,
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update task status.',
      });
    }
  };

  const handlePeerEvalSubmit = async (formData) => {
    try {
      await api.submitPeerEvaluation(formData);
      setActionFeedback({
        type: 'success',
        message: 'Peer evaluation recorded securely.',
      });
      setPeerEvalTarget(null);
      fetchDashboard(true);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to submit peer evaluation.',
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
        <p className="text-gray-600 max-w-md mx-auto text-sm">
          Sign in with your Walchand College of Engineering email to access your team invitations, assigned sprint tasks, and peer evaluations.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-gray-500">Loading your student dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const {
    profile,
    profileCompletionPercentage,
    projectsCreated = [],
    projectsJoined = [],
    pendingInvitations = [],
    sentJoinRequests = [],
    recommendedProjects = [],
    assignedTasks = [],
    peerEvaluationsToSubmit = [],
    reliabilityScores = [],
  } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 text-gray-800">
      {/* Action Notification */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border shadow-xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome, {profile.fullName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {profile.academicYear} • {profile.department}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {profile.email} • Experience: <strong className="text-gray-700">{profile.experienceLevel}</strong>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {(profile.skills || []).map((sk, idx) => {
              const skillName = typeof sk === 'object' && sk !== null ? (sk.name || sk.skill || '') : String(sk);
              const prof = typeof sk === 'object' && sk !== null ? sk.proficiency : '';
              if (!skillName) return null;
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-[11px] rounded-md font-mono inline-flex items-center gap-1"
                >
                  <span>{skillName}</span>
                  {prof && <span className="text-[10px] text-gray-400">({prof})</span>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="w-full md:w-64 bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Profile Completeness</span>
            <span className="font-bold text-indigo-600">{profileCompletionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${profileCompletionPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {profileCompletionPercentage === 100
              ? 'Complete profile maximizes matching accuracy!'
              : 'Add bio, GitHub, ID card, and skills for optimal matchmaking.'}
          </p>
        </div>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-base">
              Pending Team Invitations ({pendingInvitations.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map(inv => (
              <div
                key={inv.id}
                className="bg-white border border-indigo-200 p-4 rounded-xl space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{inv.projectName}</h4>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      Proposed Role: <strong>{inv.proposedRole}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Leader: {inv.leaderName}
                  </span>
                </div>

                {inv.message && (
                  <p className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded-lg border border-gray-200">
                    "{inv.message}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleRespondInvitation(inv.id, 'Rejected')}
                    className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border border-gray-300 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(inv.id, 'Accepted')}
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    Accept & Join Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Join Requests */}
      {sentJoinRequests && sentJoinRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Your Sent Join Requests ({sentJoinRequests.length})</span>
            </h4>
            <span className="text-[11px] text-gray-500">Status of your team applications</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sentJoinRequests.map(req => (
              <div
                key={req.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-gray-900 leading-tight">{req.projectName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      req.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : req.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Applied Role: <strong className="text-gray-800">{req.proposedRole}</strong>
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Leader: {req.leaderName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Tasks & Peer Reviews & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Tasks */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">Your Assigned Tasks</h3>
              </div>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                {assignedTasks.filter(t => t.status !== 'Completed').length} Pending
              </span>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs">
                No tasks assigned to you right now. Join projects or coordinate with your team leader.
              </div>
            ) : (
              <div className="space-y-3">
                {assignedTasks.map(task => {
                  const isExpanded = Boolean(expandedTasks[task.id]);

                  const statusBadgeStyle =
                    task.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : task.status === 'In Progress'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200';

                  const priorityBadgeStyle =
                    task.priority === 'Urgent'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : task.priority === 'High'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';

                  const deadlineFormatted = !isNaN(new Date(task.deadline).getTime())
                    ? new Date(task.deadline).toLocaleDateString()
                    : task.deadline;

                  const assignedDateFormatted = task.createdAt && !isNaN(new Date(task.createdAt).getTime())
                    ? new Date(task.createdAt).toLocaleDateString()
                    : 'Recent';

                  return (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl space-y-3 transition-colors hover:border-gray-300 text-xs shadow-2xs"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadgeStyle}`}>
                              {task.priority} Priority
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                              {task.status}
                            </span>
                            {task.projectName && (
                              <span className="text-[10px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                <FolderGit2 className="w-3 h-3 text-indigo-600" />
                                {task.projectName}
                              </span>
                            )}
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h5>
                        </div>

                        <button
                          onClick={() => toggleTaskExpand(task.id)}
                          className="p-1 hover:bg-white text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0 border border-gray-200"
                          title={isExpanded ? 'Collapse details' : 'Expand full details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Task Description */}
                      {task.description ? (
                        <div className="text-gray-700 leading-relaxed text-xs bg-white p-3 rounded-lg border border-gray-200">
                          <p className={isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}>
                            {task.description}
                          </p>
                          {task.description.length > 100 && (
                            <button
                              onClick={() => toggleTaskExpand(task.id)}
                              className="text-[11px] text-indigo-600 font-semibold hover:underline mt-1.5 inline-block cursor-pointer"
                            >
                              {isExpanded ? 'Show less' : 'Read full description...'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic">No additional description provided.</div>
                      )}

                      {/* Detail Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Assigned by: <strong className="text-gray-800">{task.assignedByName || task.createdByName || 'Team Leader'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>Assigned on: <strong className="text-gray-800">{assignedDateFormatted}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Deadline: <strong className="text-gray-800">{deadlineFormatted}</strong></span>
                        </div>

                        {task.isOverdue && (
                          <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>⚠ OVERDUE — Deadline was {deadlineFormatted}</span>
                          </div>
                        )}

                        {task.status === 'Completed' && (
                          <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              ✓ Completed {task.completedOnTime === false ? 'with delay' : 'on time'}
                              {task.completedAt && !isNaN(new Date(task.completedAt).getTime())
                                ? ` on ${new Date(task.completedAt).toLocaleDateString()}`
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => handleTaskStatus(task.id, 'In Progress')}
                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium cursor-pointer border border-gray-300 transition-colors"
                          >
                            Start Task (In Progress)
                          </button>
                        )}
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => handleTaskStatus(task.id, 'Completed')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Peer Evaluations to Submit */}
          {peerEvaluationsToSubmit.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-900 text-base">Peer Evaluations</h3>
                </div>
                <span className="text-[11px] text-gray-500">
                  Strictly Confidential • No Self-Evaluation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {peerEvaluationsToSubmit.map((pe, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{pe.teammateName}</div>
                      <div className="text-[11px] text-gray-500">{pe.teammateRole} • {pe.projectName}</div>
                    </div>

                    <div>
                      {pe.alreadySubmitted ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (() => {
                        const relatedProj = (projectsJoined || []).find(p => String(p.id) === String(pe.projectId)) ||
                                            (projectsCreated || []).find(p => String(p.id) === String(pe.projectId));
                        const isCompleted = pe.isCompleted || (relatedProj && relatedProj.recruitmentStatus === 'Completed');
                        return isCompleted ? (
                          <button
                            onClick={() => setPeerEvalTarget(pe)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                          >
                            Evaluate Peer
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                            Available after project completion
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Projects (Algorithmic Match) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">Recommended Projects for You</h3>
              </div>
              <span className="text-[11px] text-gray-500">
                Formula: <code className="text-indigo-600 font-mono">0.50S + 0.25E + 0.25A</code>
              </span>
            </div>

            {recommendedProjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs">
                No matching open projects right now. You can create your own team!
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedProjects.map(({ project, matchScore, suggestedRole }) => (
                  <div
                    key={project.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4 text-xs hover:border-gray-300 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{project.name}</h4>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{project.idea}</p>
                      <div className="text-[11px] text-gray-500 pt-1">
                        Suggested Role: <strong className="text-indigo-600">{suggestedRole}</strong> • Led by {project.leaderName}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-2">
                      <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-bold text-sm">
                        {matchScore}% Match
                      </div>
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Projects Led/Joined & Reliability Card */}
        <div className="space-y-6">
          {/* Projects Led (Team Leader Controls) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                <span>Projects You Lead ({projectsCreated.length})</span>
              </h4>
            </div>

            {projectsCreated.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs">
                You haven't created a project yet.
                <button
                  onClick={onOpenCreateProject}
                  className="mt-2 block mx-auto text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsCreated.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{p.name}</span>
                      <span className="text-[10px] bg-white text-indigo-700 border border-gray-200 px-2 py-0.5 rounded font-medium">
                        {p.teamMembers?.length || 0} / {p.totalTeamSize} Members
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateToLeader(p.id || p._id)}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Open Team Leader Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Joined */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Projects Joined ({projectsJoined.length})</span>
            </h4>

            {projectsJoined.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs">
                You haven't joined other teams yet. Check recommendations or browse projects!
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsJoined.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{p.name}</span>
                      <span className="text-[10px] text-gray-500">Led by {p.leaderName}</span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Your Role: <strong>{p.teamMembers?.find(m => String(m.userId) === String(profile?.id || profile?._id) || (m.email && profile?.email && m.email.toLowerCase() === profile.email.toLowerCase()))?.role || 'Member'}</strong>
                    </div>
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      View Team & Progress Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reliability Score Card */}
          {reliabilityScores && reliabilityScores.length > 0 && (
            <div className="space-y-3">
              {reliabilityScores.length > 1 && (
                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-600 font-semibold">Select Project Reliability Score:</span>
                    <span className="text-[10px] bg-gray-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                      {reliabilityScores.length} Projects
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {reliabilityScores.map((score, idx) => (
                      <button
                        key={score.projectId || idx}
                        onClick={() => setSelectedReliabilityIdx(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          selectedReliabilityIdx === idx
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {score.projectName || `Project ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ReliabilityCard
                reliability={reliabilityScores[selectedReliabilityIdx] || reliabilityScores[0]}
                studentName={profile.fullName}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Peer Eval Modal */}
      {peerEvalTarget && (
        <EvaluationModal
          isOpen={Boolean(peerEvalTarget)}
          onClose={() => setPeerEvalTarget(null)}
          type="peer"
          projectId={peerEvalTarget.projectId}
          projectName={peerEvalTarget.projectName}
          targetMemberId={peerEvalTarget.teammateId}
          targetMemberName={peerEvalTarget.teammateName}
          targetMemberRole={peerEvalTarget.teammateRole}
          onSubmit={handlePeerEvalSubmit}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          currentUserId={profile.id}
          onOpenLeaderDashboard={onNavigateToLeader}
        />
      )}
    </div>
  );
};
