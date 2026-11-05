import React, { useState } from 'react';
import { Check, Mail, UserPlus, Sparkles, AlertCircle, Briefcase, GraduationCap, Clock } from 'lucide-react';

export const CandidateMatchCard = ({
  recommendation,
  onInvite,
  onViewProfile,
  isTeamFull = false,
}) => {
  const {
    candidate,
    overallMatchScore,
    skillMatchScore,
    experienceMatchScore,
    availabilityMatchScore,
    matchingSkills,
    missingSkills,
    suggestedRole,
    explanation,
    hasPendingInvitation,
  } = recommendation;

  const candidateName = candidate?.fullName || 'Student Candidate';
  const firstName = candidateName.split(' ')[0] || 'Candidate';
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleInput, setRoleInput] = useState(suggestedRole);
  const [messageInput, setMessageInput] = useState(
    `Hi ${firstName}! Your skillset matches our project requirements well. Would you like to join as our ${suggestedRole}?`
  );
  const [errorMsg, setErrorMsg] = useState('');

  const getScoreBadge = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setErrorMsg('');
    try {
      await onInvite(candidate?.id || candidate?._id, roleInput, messageInput);
      setShowInviteModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-all space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {candidateName.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                {candidateName}
                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                  {candidate.academicYear || 'Third Year'}
                </span>
              </h4>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
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
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-gray-700 font-medium flex-wrap">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Suggested Role:</span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold text-[11px]">
              {suggestedRole}
            </span>
            <span className="text-gray-300">|</span>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">{candidate.availability}</span>
          </div>
          {candidate.bio && (
            <p className="text-gray-600 line-clamp-2 italic text-[11px]">"{candidate.bio}"</p>
          )}
        </div>

        {/* 3 Deterministic Component Sub-scores */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Skill (S)</div>
            <div className="text-sm font-bold text-gray-900">{skillMatchScore}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Experience (E)</div>
            <div className="text-sm font-bold text-gray-900">{experienceMatchScore}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Availability (A)</div>
            <div className="text-sm font-bold text-gray-900">{availabilityMatchScore}%</div>
          </div>
        </div>

        {/* Matching and Missing Skills */}
        <div className="space-y-1.5 text-xs">
          {matchingSkills && matchingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Matches:
              </span>
              {matchingSkills.map((s, idx) => {
                const name = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                return (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    {name}
                  </span>
                );
              })}
            </div>
          )}

          {missingSkills && missingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" /> Missing:
              </span>
              {missingSkills.map((s, idx) => {
                const name = typeof s === 'object' && s !== null ? (s.skill || s.name || '') : String(s);
                return (
                  <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Explanation */}
        <p className="text-[11px] text-gray-600 leading-relaxed border-t border-gray-200 pt-2">
          <strong className="text-gray-800">Why recommended:</strong> {explanation}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
          {onViewProfile ? (
            <button
              type="button"
              onClick={() => onViewProfile(candidate)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
            >
              View Profile & ID Card
            </button>
          ) : <div />}

          <div>
            {hasPendingInvitation ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                <Mail className="w-3.5 h-3.5" />
                Invitation Pending Response
              </span>
            ) : isTeamFull ? (
              <span className="text-xs text-gray-500 font-medium py-1">
                Team is full (Max capacity reached)
              </span>
            ) : (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite to Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-200 text-gray-800">
            <h3 className="text-lg font-bold text-gray-900">
              Invite {candidate.fullName} to Team
            </h3>
            <p className="text-xs text-gray-500">
              Specify the proposed role for this student and an optional welcome note.
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proposed Role</label>
                <input
                  type="text"
                  required
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Invitation Message</label>
                <textarea
                  rows={3}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
