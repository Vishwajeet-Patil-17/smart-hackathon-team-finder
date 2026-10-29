import React from 'react';
import { Users, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project,
  currentUserId,
  onOpenLeaderDashboard,
}) => {
  if (!isOpen || !project) return null;

  const isLeader = project.leaderId === currentUserId;
  const isMember = project.teamMembers?.some(m => m.userId === currentUserId);
  const currentSize = project.teamMembers?.length || 0;
  const isFull = currentSize >= project.totalTeamSize;

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
            </div>
            <h3 className="text-lg font-bold text-white">{project.name}</h3>
            <p className="text-slate-400 mt-0.5">
              Led by <strong className="text-slate-200">{project.leaderName}</strong> ({project.leaderEmail})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
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
              {(project.teamMembers || []).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {m.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{m.fullName}</div>
                      <div className="text-[10px] text-slate-400">{m.academicYear} • {m.department}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
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
