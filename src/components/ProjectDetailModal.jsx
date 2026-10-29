import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Users, CheckCircle2, Shield, ArrowRight, UserPlus, Clock, Send, AlertCircle } from 'lucide-react';

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project: initialProject,
  currentUserId,
  onOpenLeaderDashboard,
  onOpenAuth,
}) => {
  const [project, setProject] = useState(initialProject);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [proposedRole, setProposedRole] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null); // 'success' | 'already_sent' | null
  const [joinFeedback, setJoinFeedback] = useState('');

  // Always fetch fresh project details when modal opens or initialProject changes
  useEffect(() => {
    if (!isOpen || !initialProject?.id) return;
    setProject(initialProject);
    setShowJoinForm(false);
    setJoinStatus(null);
    setJoinFeedback('');

    setIsLoadingFresh(true);
    api.getProject(initialProject.id)
      .then(res => {
        if (res?.project) {
          setProject(res.project);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch fresh project details:', err);
      })
      .finally(() => {
        setIsLoadingFresh(false);
      });

    // Check if current user already sent a pending join request
    if (currentUserId) {
      api.getMyJoinRequests()
        .then(res => {
          const reqs = res.joinRequests || [];
          const existing = reqs.find(r => r.projectId === initialProject.id && r.status === 'Pending');
          if (existing) {
            setJoinStatus('already_sent');
            setJoinFeedback(`You already submitted a join request for "${existing.proposedRole}". Awaiting team leader approval.`);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialProject?.id, currentUserId]);

  if (!isOpen || !project) return null;

  const isLeader = project.leaderId === currentUserId || String(project.leaderId) === String(currentUserId);
  const isMember = (project.teamMembers || []).some(m => m.userId === currentUserId || String(m.userId) === String(currentUserId));
  const currentSize = project.teamMembers?.length || 0;
  const isFull = currentSize >= project.totalTeamSize;
  const canRequestJoin = Boolean(currentUserId) && !isLeader && !isMember && !isFull && project.recruitmentStatus === 'Open';

  const defaultRole = (project.requiredRoles && project.requiredRoles[0]) || 'Full Stack Developer';

  const handleSendJoinRequest = async (e) => {
    e.preventDefault();
    setIsSubmittingJoin(true);
    setJoinFeedback('');

    try {
      const roleToSend = proposedRole.trim() || defaultRole;
      const res = await api.sendJoinRequest({
        projectId: project.id,
        proposedRole: roleToSend,
        message: joinMessage.trim(),
      });

      setJoinStatus('success');
      setJoinFeedback(res.message || 'Join request sent successfully! The project leader will review it.');
      setShowJoinForm(false);
    } catch (err) {
      setJoinFeedback(err.message || 'Failed to send join request.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 my-8 space-y-4 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                {project.domain}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                project.recruitmentStatus === 'Open'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {project.recruitmentStatus}
              </span>
              {isLoadingFresh && (
                <span className="text-[10px] text-slate-500 italic">Syncing...</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white">{project.name}</h3>
            <p className="text-slate-400 mt-0.5">
              Led by <strong className="text-slate-200">{project.leaderName}</strong> ({project.leaderEmail})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {/* Join Request Status Feedback */}
          {joinFeedback && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              joinStatus === 'success' || joinStatus === 'already_sent'
                ? 'bg-indigo-950/60 border-indigo-800 text-indigo-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {joinStatus === 'success' || joinStatus === 'already_sent' ? (
                <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{joinFeedback}</div>
            </div>
          )}

          {/* Idea & Problem */}
          <div className="space-y-2">
            <h5 className="font-semibold text-slate-300">Project Idea</h5>
            <p className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-300 italic">
              "{project.idea}"
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-300 mb-1">Problem Statement</h5>
            <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {project.problemStatement}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-300 mb-1">Detailed Description</h5>
            <p className="text-slate-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-300 mb-1">Technical Approach</h5>
            <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {project.technicalApproach}
            </p>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Team Capacity</span>
              <p className="font-bold text-white text-sm mt-0.5">
                {currentSize} / {project.totalTeamSize} Students
              </p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience Level</span>
              <p className="font-bold text-white text-sm mt-0.5">{project.preferredExperienceLevel}</p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Timeline</span>
              <p className="font-bold text-white text-sm mt-0.5">{project.timeline}</p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Availability</span>
              <p className="font-bold text-white text-sm mt-0.5">{project.expectedAvailability}</p>
            </div>
          </div>

          {/* Required Skills & Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h5 className="font-semibold text-slate-300 mb-1.5">Required Skills</h5>
              <div className="flex flex-wrap gap-1">
                {(project.requiredSkills || []).map((s, idx) => (
                  <span key={idx} className="bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded text-[11px]">
                    {s.skill} {s.minProficiency && `(${s.minProficiency})`}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-slate-300 mb-1.5">Required Roles</h5>
              <div className="flex flex-wrap gap-1">
                {(project.requiredRoles || []).map((r, idx) => (
                  <span key={idx} className="bg-slate-800/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h5 className="font-semibold text-slate-300 mb-1.5">Current Team Members ({currentSize})</h5>
            <div className="space-y-1.5">
              {(project.teamMembers || []).map((m, idx) => {
                const memberName = m.fullName || m.name || 'Team Member';
                const initial = memberName.charAt(0).toUpperCase();

                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{memberName}</div>
                        <div className="text-[10px] text-slate-400">{m.academicYear || 'WCE'} • {m.department || 'Engineering'}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {m.role || 'Member'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Request Form Drawer */}
          {showJoinForm && canRequestJoin && (
            <form onSubmit={handleSendJoinRequest} className="bg-slate-950 border border-indigo-900/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span>Request to Join This Team</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Proposed Role in Project
                </label>
                <div className="flex gap-2">
                  <select
                    value={proposedRole}
                    onChange={e => setProposedRole(e.target.value)}
                    className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="">Select a required role or specify custom...</option>
                    {(project.requiredRoles || []).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="AI/ML Engineer">AI/ML Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Pitch to Team Leader (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share how your skills align with this project idea and what you can contribute..."
                  value={joinMessage}
                  onChange={e => setJoinMessage(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingJoin ? 'Submitting...' : 'Submit Join Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
          <div>
            {isLeader ? (
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <Shield className="w-4 h-4" /> You lead this project
              </span>
            ) : isMember ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> You are on this team
              </span>
            ) : isFull ? (
              <span className="text-slate-500 font-medium">Team is currently full</span>
            ) : joinStatus === 'already_sent' ? (
              <span className="text-indigo-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Join Request Pending
              </span>
            ) : (
              <span className="text-slate-400">Recruitment open for eligible candidates</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Request to Join button */}
            {canRequestJoin && joinStatus !== 'already_sent' && !showJoinForm && (
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request to Join Team</span>
              </button>
            )}

            {!currentUserId && onOpenAuth && !isFull && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Sign In to Request Joining</span>
              </button>
            )}

            {isLeader && onOpenLeaderDashboard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLeaderDashboard(project.id);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open Team Leader Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
