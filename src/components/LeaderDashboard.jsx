import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { CandidateMatchCard } from './CandidateMatchCard.jsx';
import { TaskBoard } from './TaskBoard.jsx';
import { TeamDiscussion } from './TeamDiscussion.jsx';
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
} from 'lucide-react';

export const LeaderDashboard = ({
  initialProjectId,
  onOpenCreateProject,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [projectsLed, setProjectsLed] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId || '');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [activeTab, setActiveTab] = useState('balance');

  // Evaluation modal state
  const [evalModalTarget, setEvalModalTarget] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      const led = res.projects.filter(p => p.leaderId === user?.id);
      setProjectsLed(led);
      if (led.length > 0 && (!activeProjectId || !led.some(p => p.id === activeProjectId))) {
        setActiveProjectId(led[0].id);
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
    }
  };

  const fetchDashboardData = async (projId) => {
    if (!projId) return;
    setIsLoading(true);
    try {
      const data = await api.getLeaderDashboard(projId);
      setDashboardData(data);
    } catch (e) {
      console.warn('Failed to fetch leader dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    if (activeProjectId) {
      fetchDashboardData(activeProjectId);
    }
  }, [activeProjectId]);

  const handleInvite = async (candidateId, proposedRole, message) => {
    if (!activeProjectId) return;
    await api.sendInvitation({
      projectId: activeProjectId,
      candidateId,
      proposedRole,
      message,
    });
    await fetchDashboardData(activeProjectId);
  };

  const handleCancelInvite = async (invId) => {
    await api.cancelInvitation(invId);
    if (activeProjectId) await fetchDashboardData(activeProjectId);
  };

  const handleTaskCreated = async (taskData) => {
    await api.createTask(taskData);
    if (activeProjectId) await fetchDashboardData(activeProjectId);
  };

  const handleTaskStatusChanged = async (taskId, status) => {
    await api.updateTaskStatus(taskId, status);
    if (activeProjectId) await fetchDashboardData(activeProjectId);
  };

  const handleLeaderEvalSubmit = async (evalData) => {
    await api.submitLeaderEvaluation(evalData);
    if (activeProjectId) await fetchDashboardData(activeProjectId);
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeProjectId) return;
    try {
      await api.updateProject(activeProjectId, { recruitmentStatus: newStatus });
      await fetchDashboardData(activeProjectId);
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">Team Leader Dashboard</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please sign in to manage your hackathon projects, inspect candidate matching, and review sprint progress.
          </p>
        </div>
        <button
          onClick={() => onOpenAuth?.('login')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Sign In as Team Leader
        </button>
      </div>
    );
  }

  if (projectsLed.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white">Team Leader Dashboard</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          You are not currently leading a project. When you create a hackathon project, you automatically become its Team Leader with candidate matching, team-balance analysis, and task controls.
        </p>
        <button
          onClick={onOpenCreateProject}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          <Target className="w-4 h-4" />
          <span>Create Project as Leader</span>
        </button>
      </div>
    );
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
        Loading Team Leader dashboard...
      </div>
    );
  }

  const {
    project,
    teamMembers,
    currentTeamSize,
    requiredTeamSize,
    isTeamFull,
    candidateRecommendations,
    teamBalance,
    activeInvitations,
    tasks,
    taskCompletionPercentage,
    memberProgress,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Project Selector & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                  Leader Portal
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  project.recruitmentStatus === 'Open'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  Status: {project.recruitmentStatus}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{project.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {projectsLed.length > 1 && (
              <select
                value={activeProjectId}
                onChange={e => setActiveProjectId(e.target.value)}
                className="text-xs p-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-200 font-medium focus:outline-hidden focus:border-indigo-500"
              >
                {projectsLed.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <select
              value={project.recruitmentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs p-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
            >
              <option value="Open">Recruitment Open</option>
              <option value="Closed">Recruitment Closed</option>
              <option value="Completed">Project Completed</option>
            </select>
          </div>
        </div>

        {/* Project Key Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Team Capacity</span>
            <div className="font-bold text-white text-base mt-0.5">
              {currentTeamSize} / {requiredTeamSize} Students
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (currentTeamSize / requiredTeamSize) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Role Coverage</span>
            <div className="font-bold text-white text-base mt-0.5">
              {teamBalance.roleCoveragePercentage}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${teamBalance.roleCoveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Skill Coverage</span>
            <div className="font-bold text-white text-base mt-0.5">
              {teamBalance.skillCoveragePercentage}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${teamBalance.skillCoveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Tasks Completed</span>
            <div className="font-bold text-white text-base mt-0.5">
              {taskCompletionPercentage}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${taskCompletionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart Matching Candidates ({candidateRecommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Member Evaluations & Reliability</span>
        </button>

        <button
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'discussion'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Discussion</span>
        </button>
      </div>

      {/* TAB 1: TEAM-BALANCE ANALYSIS */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Team-Balance Analysis</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates role distribution and technical skill coverage across all {teamMembers.length} active team members.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Coverage */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">Role Coverage</span>
                  <span className="text-sm font-bold text-indigo-400">
                    {teamBalance.roleCoveragePercentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${teamBalance.roleCoveragePercentage}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Covered Roles ({teamBalance.coveredRoles.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.coveredRoles.length > 0 ? (
                        teamBalance.coveredRoles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800 rounded text-[11px]">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">No roles covered yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Missing Roles ({teamBalance.missingRoles.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.missingRoles.length > 0 ? (
                        teamBalance.missingRoles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800 rounded text-[11px] font-medium">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-400 font-medium">All required team roles covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Coverage */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">Skill Coverage</span>
                  <span className="text-sm font-bold text-blue-400">
                    {teamBalance.skillCoveragePercentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${teamBalance.skillCoveragePercentage}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Covered Skills ({teamBalance.coveredSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.coveredSkills.length > 0 ? (
                        teamBalance.coveredSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800 rounded text-[11px]">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">No skills covered yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Missing Skills ({teamBalance.missingSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teamBalance.missingSkills.length > 0 ? (
                        teamBalance.missingSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800 rounded text-[11px] font-medium">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-400 font-medium">All required skills covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Candidates for Missing Roles */}
            {teamBalance.recommendedCandidatesForMissingRoles.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Candidates Specifically Matching Missing Roles & Skills</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teamBalance.recommendedCandidatesForMissingRoles.map(rec => (
                    <CandidateMatchCard
                      key={rec.candidate.id}
                      recommendation={rec}
                      onInvite={handleInvite}
                      isTeamFull={isTeamFull}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Team Members Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Current Team Members ({teamMembers.length} / {requiredTeamSize})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMembers.map(m => (
                <div
                  key={m.userId}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {m.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{m.fullName}</div>
                      <div className="text-[11px] text-slate-400">{m.academicYear} • {m.department}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-semibold text-indigo-300">{m.role}</span>
                  </div>

                  {m.userId !== user?.id && (
                    <button
                      onClick={() => setEvalModalTarget(m)}
                      className="w-full py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Evaluate Member Rubric
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE MATCHING */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Candidate Recommendations</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Formula: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px] border border-slate-800">0.40S + 0.20E + 0.20D + 0.20A</code>
                </p>
              </div>

              {isTeamFull && (
                <span className="text-xs font-bold px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg">
                  Team is Full ({currentTeamSize}/{requiredTeamSize})
                </span>
              )}
            </div>
          </div>

          {candidateRecommendations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
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
                  isTeamFull={isTeamFull}
                />
              ))}
            </div>
          )}

          {/* Active Pending Invitations */}
          {activeInvitations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Pending Outgoing Invitations ({activeInvitations.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activeInvitations.map(inv => (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-white">{inv.candidateName}</div>
                      <div className="text-[11px] text-slate-400">Proposed: {inv.proposedRole}</div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-950/40 rounded font-medium cursor-pointer"
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

      {/* TAB 3: TASKS & DEADLINES */}
      {activeTab === 'tasks' && (
        <TaskBoard
          tasks={tasks}
          teamMembers={teamMembers}
          isLeader={true}
          currentUserId={user?.id || ''}
          projectId={project.id}
          onTaskCreated={handleTaskCreated}
          onTaskStatusChanged={handleTaskStatusChanged}
        />
      )}

      {/* TAB 4: MEMBER EVALUATIONS & RELIABILITY */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Team Member Evaluations & Reliability Scores</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluations inform transparent collaboration metrics: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px] border border-slate-800">0.50T + 0.30D + 0.20P</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {memberProgress.map(mp => (
              <div key={mp.memberId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                      {mp.memberName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{mp.memberName}</h4>
                      <p className="text-xs text-slate-400">Role: <span className="font-medium text-slate-300">{mp.role}</span></p>
                    </div>
                  </div>

                  {mp.memberId !== user?.id && (
                    <button
                      onClick={() => setEvalModalTarget({ userId: mp.memberId, fullName: mp.memberName, role: mp.role })}
                      className="px-3.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Submit / Update Leader Evaluation
                    </button>
                  )}
                </div>

                <ReliabilityCard
                  reliability={mp.reliabilityScore}
                  studentName={mp.memberName}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TEAM DISCUSSION */}
      {activeTab === 'discussion' && (
        <TeamDiscussion
          projectId={project.id}
          projectName={project.name}
          currentUserId={user?.id || ''}
        />
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
    </div>
  );
};
