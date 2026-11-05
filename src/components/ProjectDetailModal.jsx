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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 my-8 space-y-4 text-xs text-gray-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                project.recruitmentStatus === 'Open'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {project.recruitmentStatus}
              </span>
              {isLoadingFresh && (
                <span className="text-[10px] text-gray-400 italic">Syncing...</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
            <p className="text-gray-500 mt-0.5">
              Led by <strong className="text-gray-800">{project.leaderName}</strong> ({project.leaderEmail})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {/* Join Request Status Feedback */}
          {joinFeedback && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              joinStatus === 'success' || joinStatus === 'already_sent'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {joinStatus === 'success' || joinStatus === 'already_sent' ? (
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{joinFeedback}</div>
            </div>
          )}

          {/* Idea & Problem */}
          <div className="space-y-2">
            <h5 className="font-semibold text-gray-700">Project Idea</h5>
            <p className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-700 italic">
              "{project.idea}"
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Problem Statement</h5>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              {project.problemStatement}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Detailed Description</h5>
            <p className="text-gray-700 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Technical Approach</h5>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              {project.technicalApproach}
            </p>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Team Capacity</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">
                {currentSize} / {project.totalTeamSize} Students
              </p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Experience Level</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{project.preferredExperienceLevel}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Timeline</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{project.timeline}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Availability</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{project.expectedAvailability}</p>
            </div>
          </div>

          {/* Required Skills & Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h5 className="font-semibold text-gray-700 mb-1.5">Required Skills</h5>
              <div className="flex flex-wrap gap-1">
                {(project.requiredSkills || []).map((s, idx) => {
                  const name = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                  const prof = typeof s === 'object' && s !== null ? s.minProficiency : '';
                  return (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                      {name} {prof && `(${prof})`}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-gray-700 mb-1.5">Required Roles</h5>
              <div className="flex flex-wrap gap-1">
                {(project.requiredRoles || []).map((r, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h5 className="font-semibold text-gray-700 mb-1.5">Current Team Members ({currentSize})</h5>
            <div className="space-y-1.5">
              {(project.teamMembers || []).map((m, idx) => {
                const memberName = m.fullName || m.name || 'Team Member';
                const initial = memberName.charAt(0).toUpperCase();

                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{memberName}</div>
                        <div className="text-[10px] text-gray-500">{m.academicYear || 'WCE'} • {m.department || 'Engineering'}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 shadow-2xs">
                      {m.role || 'Member'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Request Form Drawer */}
          {showJoinForm && canRequestJoin && (
            <form onSubmit={handleSendJoinRequest} className="bg-gray-50 border border-indigo-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Request to Join This Team</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Proposed Role in Project
                </label>
                <div className="flex gap-2">
                  <select
                    value={proposedRole}
                    onChange={e => setProposedRole(e.target.value)}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="" className="bg-white text-gray-900">Select a required role or specify custom...</option>
                    {(project.requiredRoles || []).map(r => (
                      <option key={r} value={r} className="bg-white text-gray-900">{r}</option>
                    ))}
                    <option value="Full Stack Developer" className="bg-white text-gray-900">Full Stack Developer</option>
                    <option value="Frontend Developer" className="bg-white text-gray-900">Frontend Developer</option>
                    <option value="Backend Developer" className="bg-white text-gray-900">Backend Developer</option>
                    <option value="AI/ML Engineer" className="bg-white text-gray-900">AI/ML Engineer</option>
                    <option value="UI/UX Designer" className="bg-white text-gray-900">UI/UX Designer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Pitch to Team Leader (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share how your skills align with this project idea and what you can contribute..."
                  value={joinMessage}
                  onChange={e => setJoinMessage(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingJoin ? 'Submitting...' : 'Submit Join Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 flex-wrap gap-2">
          <div>
            {isLeader ? (
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <Shield className="w-4 h-4" /> You lead this project
              </span>
            ) : isMember ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> You are on this team
              </span>
            ) : isFull ? (
              <span className="text-gray-500 font-medium">Team is currently full</span>
            ) : joinStatus === 'already_sent' ? (
              <span className="text-indigo-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Join Request Pending
              </span>
            ) : (
              <span className="text-gray-500">Recruitment open for eligible candidates</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Request to Join button */}
            {canRequestJoin && joinStatus !== 'already_sent' && !showJoinForm && (
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
