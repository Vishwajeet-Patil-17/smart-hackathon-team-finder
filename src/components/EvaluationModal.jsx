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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 my-8 space-y-5 text-gray-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                type === 'leader' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {type === 'leader' ? 'Team Leader Evaluation' : 'Confidential Peer Evaluation'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              Evaluating: {targetMemberName}
            </h3>
            <p className="text-xs text-gray-500">
              Role: <span className="font-medium text-gray-800">{targetMemberRole}</span> | Project: <span className="font-medium text-gray-800">{projectName}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600 flex items-center gap-1 justify-end">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400 font-normal">/5.0</span>
            </div>
            <span className="text-[10px] text-gray-500">Rubric Average</span>
          </div>
        </div>

        {/* Policy notice */}
        {type === 'peer' && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Confidentiality Guarantee:</strong> Your individual ratings and comments are strictly confidential and will never reveal your identity to teammates. Evaluations directly feed into the transparent 0.50T + 0.30D + 0.20P reliability score.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluation Period / Sprint</label>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="Sprint 1 - Ideation & Architecture" className="bg-white text-gray-900">Sprint 1 - Ideation & Architecture</option>
              <option value="Sprint 2 - Core Implementation" className="bg-white text-gray-900">Sprint 2 - Core Implementation</option>
              <option value="Final Sprint" className="bg-white text-gray-900">Final Sprint & Project Delivery</option>
            </select>
          </div>

          {/* Rubric Rating Categories */}
          <div className="space-y-3 divide-y divide-gray-200">
            {rubric.map(({ key, label, desc }) => {
              const currentVal = ratings[key];

              return (
                <div key={key} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-gray-900">{label}</span>
                      <p className="text-[11px] text-gray-500">{desc}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
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
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs font-bold'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Constructive Feedback & Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Highlight standout efforts or areas for collaborative improvement..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
