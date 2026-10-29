import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
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
} from 'lucide-react';

export const StudentDashboard = ({
  onNavigateToLeader,
  onOpenCreateProject,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [selectedProject, setSelectedProject] = useState(null);

  const [actionFeedback, setActionFeedback] = useState(null);

  // Peer eval modal state
  const [peerEvalTarget, setPeerEvalTarget] = useState(null);

  const fetchDashboard = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getStudentDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleAcceptInvite = async (invId) => {
    try {
      await api.acceptInvitation(invId);
      setActionFeedback({ type: 'success', message: 'Invitation accepted! You have joined the hackathon team.' });
      await fetchDashboard();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to accept invitation.' });
    }
  };

  const handleRejectInvite = async (invId) => {
    try {
      await api.rejectInvitation(invId);
      setActionFeedback({ type: 'success', message: 'Invitation declined.' });
      await fetchDashboard();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reject invitation.' });
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await api.updateTaskStatus(taskId, status);
      await fetchDashboard();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update task.' });
    }
  };

  const handlePeerEvalSubmit = async (evalData) => {
    await api.submitPeerEvaluation(evalData);
    await fetchDashboard();
  };

  if (!user) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto text-xl font-bold">
          WCE
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">Smart Hackathon Team Finder</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Walchand College of Engineering, Sangli. Sign in or register with your college email to discover projects, invite teammates, and track sprint deliverables.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth?.('login')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Sign In with College Email
          </button>
          <button
            onClick={() => onOpenAuth?.('register')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer shadow-md"
          >
            Register Student Account
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
        Loading your student dashboard...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Unable to load student dashboard data. Please try signing in again.
      </div>
    );
  }

  const {
    profile,
    profileCompletionPercentage,
    projectsCreated,
    projectsJoined,
    pendingInvitations,
    sentJoinRequests = [],
    recommendedProjects,
    assignedTasks,
    peerEvaluationsToSubmit,
    reliabilityScores,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-md transition-all ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-indigo-400 tracking-wider uppercase">
              Walchand College of Engineering, Sangli • Student Hub
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {profile.fullName}!
            </h2>
            <p className="text-xs text-slate-400">
              {profile.academicYear} • {profile.department} • Availability: <span className="text-indigo-300 font-medium">{profile.availability}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateProject}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Profile Completion:</span>
            <span className="font-bold text-white">{profileCompletionPercentage}%</span>
          </div>
          <div className="w-48 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${profileCompletionPercentage}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400">
            {profileCompletionPercentage === 100
              ? 'Profile fully optimized for matching!'
              : 'Add skills, roles, and bio to improve recommendation accuracy.'}
          </span>
        </div>
      </div>

      {/* Pending Invitations Alert */}
      {pendingInvitations.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Mail className="w-5 h-5 text-amber-400" />
            <span>You have {pendingInvitations.length} Pending Project Invitation(s)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map(inv => (
              <div
                key={inv.id}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-white">{inv.projectName}</h5>
                    <p className="text-[11px] text-slate-400">
                      From: <strong className="text-slate-300">{inv.leaderName}</strong> ({inv.leaderEmail})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg text-[11px] font-semibold">
                    Role: {inv.proposedRole}
                  </span>
                </div>

                {inv.message && (
                  <p className="text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-[11px]">
                    "{inv.message}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleRejectInvite(inv.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept & Join Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Join Requests Status */}
      {sentJoinRequests.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Your Sent Join Requests ({sentJoinRequests.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Status of your team applications</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sentJoinRequests.map(req => (
              <div
                key={req.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-white leading-tight">{req.projectName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      req.status === 'Accepted'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : req.status === 'Rejected'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Applied Role: <strong className="text-slate-200">{req.proposedRole}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Your Assigned Tasks</h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                {assignedTasks.filter(t => t.status !== 'Completed').length} Pending
              </span>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs">
                No tasks assigned to you right now. Join projects or coordinate with your team leader.
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignedTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                            : 'bg-blue-950/60 text-blue-300 border-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                        <h5 className="font-semibold text-white">{task.title}</h5>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        {task.isOverdue && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        {task.status === 'Completed' && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Finished
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === 'Pending' && (
                        <button
                          onClick={() => handleTaskStatus(task.id, 'In Progress')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer border border-slate-700"
                        >
                          Start Task
                        </button>
                      )}
                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => handleTaskStatus(task.id, 'Completed')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peer Evaluations to Submit */}
          {peerEvaluationsToSubmit.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Peer Evaluations</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Strictly Confidential • No Self-Evaluation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {peerEvaluationsToSubmit.map((pe, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{pe.teammateName}</div>
                      <div className="text-[11px] text-slate-400">{pe.teammateRole} • {pe.projectName}</div>
                    </div>

                    <div>
                      {pe.alreadySubmitted ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => setPeerEvalTarget(pe)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer"
                        >
                          Evaluate Peer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Recommended Projects for You
                </h3>
              </div>
              <span className="text-xs text-indigo-400 font-semibold bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded-full">
                Deterministic Match Score
              </span>
            </div>

            {recommendedProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs">
                No open projects match your criteria at this moment.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedProjects.map(({ project, matchScore, suggestedRole }) => (
                  <div
                    key={project.id}
                    className="p-4 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{project.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                          {project.domain}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{project.idea}</p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Suggested Role: <strong className="text-indigo-400">{suggestedRole}</strong> • Led by {project.leaderName}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-2">
                      <div className="px-3 py-1 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-lg font-bold text-sm">
                        {matchScore}% Match
                      </div>
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <span>Projects You Lead ({projectsCreated.length})</span>
              </h4>
            </div>

            {projectsCreated.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs">
                You haven't created a project yet.
                <button
                  onClick={onOpenCreateProject}
                  className="mt-2 block mx-auto text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsCreated.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 border border-slate-700 px-2 py-0.5 rounded font-medium">
                        {p.teamMembers?.length || 0} / {p.totalTeamSize} Members
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateToLeader(p.id)}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Projects Joined ({projectsJoined.length})</span>
            </h4>

            {projectsJoined.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs">
                You haven't joined other teams yet. Check recommendations or browse projects!
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsJoined.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-400">Led by {p.leaderName}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Your Role: <strong>{p.teamMembers.find(m => m.userId === profile.id)?.role || 'Member'}</strong>
                    </div>
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="text-xs text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      View Team & Progress Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reliability Score Card */}
          {reliabilityScores.length > 0 && (
            <ReliabilityCard
              reliability={reliabilityScores[0]}
              studentName={profile.fullName}
            />
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
