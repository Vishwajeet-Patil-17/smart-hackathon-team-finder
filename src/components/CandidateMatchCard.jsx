import React, { useState } from 'react';
import { Check, Mail, UserPlus, Sparkles, AlertCircle, Briefcase, GraduationCap, Clock } from 'lucide-react';

export const CandidateMatchCard = ({
  recommendation,
  onInvite,
  isTeamFull = false,
}) => {
  const {
    candidate,
    overallMatchScore,
    skillMatchScore,
    experienceMatchScore,
    domainMatchScore,
    availabilityMatchScore,
    matchingSkills,
    missingSkills,
    suggestedRole,
    explanation,
    hasPendingInvitation,
  } = recommendation;

  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleInput, setRoleInput] = useState(suggestedRole);
  const [messageInput, setMessageInput] = useState(
    `Hi ${candidate.fullName.split(' ')[0]}! Your skillset matches our project requirements well. Would you like to join as our ${suggestedRole}?`
  );
  const [errorMsg, setErrorMsg] = useState('');

  const getScoreBadge = (score) => {
    if (score >= 85) return 'text-emerald-300 bg-emerald-950/80 border-emerald-800';
    if (score >= 70) return 'text-indigo-300 bg-indigo-950/80 border-indigo-800';
    if (score >= 50) return 'text-amber-300 bg-amber-950/80 border-amber-800';
    return 'text-rose-300 bg-rose-950/80 border-rose-800';
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setErrorMsg('');
    try {
      await onInvite(candidate.id, roleInput, messageInput);
      setShowInviteModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm ring-1 ring-white/10">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-white text-base flex items-center gap-2">
                {candidate.fullName}
                <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {candidate.academicYear}
                </span>
              </h4>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <span>{candidate.department}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${getScoreBadge(overallMatchScore)}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{overallMatchScore}% Match</span>
            </div>
          </div>
        </div>

        {/* Suggested Role & Bio */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-medium flex-wrap">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Suggested Role:</span>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-semibold text-[11px]">
              {suggestedRole}
            </span>
            <span className="text-slate-600">|</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">{candidate.availability}</span>
          </div>
          {candidate.bio && (
            <p className="text-slate-400 line-clamp-2 italic text-[11px]">"{candidate.bio}"</p>
          )}
        </div>

        {/* 4 Deterministic Component Sub-scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Skill (S: 40%)</div>
            <div className="text-sm font-bold text-white">{skillMatchScore}%</div>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Experience (20%)</div>
            <div className="text-sm font-bold text-white">{experienceMatchScore}%</div>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Domain (20%)</div>
            <div className="text-sm font-bold text-white">{domainMatchScore}%</div>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Availability (20%)</div>
            <div className="text-sm font-bold text-white">{availabilityMatchScore}%</div>
          </div>
        </div>

        {/* Matching and Missing Skills */}
        <div className="space-y-1.5 text-xs">
          {matchingSkills && matchingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Matches:
              </span>
              {matchingSkills.map((s, idx) => (
                <span key={idx} className="bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          )}

          {missingSkills && missingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" /> Missing:
              </span>
              {missingSkills.map((s, idx) => (
                <span key={idx} className="bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Explanation */}
        <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
          <strong className="text-slate-300">Why recommended:</strong> {explanation}
        </p>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          {hasPendingInvitation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-medium">
              <Mail className="w-3.5 h-3.5" />
              Invitation Pending Response
            </span>
          ) : isTeamFull ? (
            <span className="text-xs text-slate-500 font-medium py-1">
              Team is full (Max capacity reached)
            </span>
          ) : (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite to Team
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800 text-slate-200">
            <h3 className="text-lg font-bold text-white">
              Invite {candidate.fullName} to Team
            </h3>
            <p className="text-xs text-slate-400">
              Specify the proposed role for this student and an optional welcome note.
            </p>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proposed Role</label>
                <input
                  type="text"
                  required
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invitation Message</label>
                <textarea
                  rows={3}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isInviting ? 'Sending...' : 'Confirm & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
