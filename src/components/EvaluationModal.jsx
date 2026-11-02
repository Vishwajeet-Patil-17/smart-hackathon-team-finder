import React, { useState } from 'react';
import { Star, ShieldCheck } from 'lucide-react';

export const EvaluationModal = ({
  isOpen,
  onClose,
  type,
  projectId,
  projectName,
  targetMemberId,
  targetMemberName,
  targetMemberRole,
  onSubmit,
}) => {
  const [ratings, setRatings] = useState({
    taskContribution: 4,
    communication: 4,
    teamwork: 4,
    responsibility: 4,
    technicalContribution: 4,
  });
  const [comment, setComment] = useState('');
  const [period, setPeriod] = useState('Final Sprint');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const rubric = [
    { key: 'taskContribution', label: 'Task Contribution', desc: 'Deliverables completed accurately and reliably.' },
    { key: 'communication', label: 'Communication & Updates', desc: 'Clear reporting, proactive in discussions and standups.' },
    { key: 'teamwork', label: 'Teamwork & Collaboration', desc: 'Cooperative attitude, assists teammates when blocked.' },
    { key: 'responsibility', label: 'Responsibility & Ownership', desc: 'Punctual with commitments, accountability for assigned code.' },
    { key: 'technicalContribution', label: 'Technical Contribution', desc: 'Architecture quality, clean code, and domain problem solving.' },
  ];

  const handleRatingChange = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  const avgRating =
    Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (type === 'leader') {
        await onSubmit({
          projectId,
          memberId: targetMemberId,
          evaluationPeriod: period,
          ratings,
          comment,
        });
      } else {
        await onSubmit({
          projectId,
          evaluatedMemberId: targetMemberId,
          evaluationPeriod: period,
          ratings,
          comment,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 my-8 space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                type === 'leader' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {type === 'leader' ? 'Team Leader Evaluation' : 'Confidential Peer Evaluation'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Evaluating: {targetMemberName}
            </h3>
            <p className="text-xs text-slate-400">
              Role: <span className="font-medium text-slate-300">{targetMemberRole}</span> | Project: <span className="font-medium text-slate-300">{projectName}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-400 flex items-center gap-1 justify-end">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-normal">/5.0</span>
            </div>
            <span className="text-[10px] text-slate-400">Rubric Average</span>
          </div>
        </div>

        {/* Policy notice */}
        {type === 'peer' && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Confidentiality Guarantee:</strong> Your individual ratings and comments are strictly confidential and will never reveal your identity to teammates. Evaluations directly feed into the transparent 0.50T + 0.30D + 0.20P reliability score.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Evaluation Period / Sprint</label>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="Sprint 1 - Ideation & Architecture" className="bg-slate-900 text-white">Sprint 1 - Ideation & Architecture</option>
              <option value="Sprint 2 - Core Implementation" className="bg-slate-900 text-white">Sprint 2 - Core Implementation</option>
              <option value="Final Sprint" className="bg-slate-900 text-white">Final Sprint & Project Delivery</option>
            </select>
          </div>

          {/* Rubric Rating Categories */}
          <div className="space-y-3 divide-y divide-slate-800">
            {rubric.map(({ key, label, desc }) => {
              const currentVal = ratings[key];

              return (
                <div key={key} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-white">{label}</span>
                      <p className="text-[11px] text-slate-400">{desc}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                      {currentVal} / 5
                    </span>
                  </div>

                  {/* Rating Buttons */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleRatingChange(key, val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          currentVal === val
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Written feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Constructive Feedback & Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Highlight standout efforts or areas for collaborative improvement..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
