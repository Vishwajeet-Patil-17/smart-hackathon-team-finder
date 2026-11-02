import React from 'react';
import { ShieldAlert, Award, Clock, CheckCircle2, Star, HelpCircle } from 'lucide-react';

export const ReliabilityCard = ({ reliability, studentName }) => {
  if (reliability.isInsufficientData) {
    return (
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-amber-300 shadow-sm">
        <div className="flex items-center gap-2 font-medium mb-1">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Reliability Score: Insufficient Data</span>
        </div>
        <p className="text-xs text-amber-200/80">
          {reliability.insufficientReason || 'No tasks or peer evaluations have been recorded for this student on this project yet.'}
        </p>
        <div className="mt-2 text-[11px] text-amber-300 font-mono bg-slate-950/80 p-2 rounded border border-amber-800/40">
          Safeguard Active: System does not fabricate scores without verified database records.
        </div>
      </div>
    );
  }

  const overall = reliability.overallScore ?? 0;
  const { T, D, P } = reliability.components;

  const getScoreBadgeColor = (val) => {
    if (val >= 85) return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    if (val >= 70) return 'bg-indigo-950 text-indigo-300 border-indigo-800';
    if (val >= 50) return 'bg-amber-950 text-amber-300 border-amber-800';
    return 'bg-rose-950 text-rose-300 border-rose-800';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white text-base">
              {studentName ? `${studentName}'s Reliability Score` : 'Project Reliability Score'}
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Formula: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px] border border-slate-800">0.50T + 0.30D + 0.20P</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reliability.isProvisional && (
            <span className="text-[11px] px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-md font-medium">
              Provisional
            </span>
          )}
          <div className={`px-3 py-1 rounded-lg border font-bold text-lg ${getScoreBadgeColor(overall)}`}>
            {overall.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* T Component */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Task Completion (T)
            </span>
            <span className="font-mono text-slate-500 text-[11px]">50% Weight</span>
          </div>
          <div className="text-base font-bold text-white">
            {T.score}%
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({T.tasksCompleted}/{T.totalTasksAssigned} tasks)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, T.score)}%` }} />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-slate-200">+{T.contribution.toFixed(1)} pts</span>
          </div>
        </div>

        {/* D Component */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              On-Time Rate (D)
            </span>
            <span className="font-mono text-slate-500 text-[11px]">30% Weight</span>
          </div>
          <div className="text-base font-bold text-white">
            {D.score}%
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({D.tasksCompletedOnTime}/{D.totalCompletedTasks} on time)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, D.score)}%` }} />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-slate-200">+{D.contribution.toFixed(1)} pts</span>
          </div>
        </div>

        {/* P Component */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Peer Evaluation (P)
            </span>
            <span className="font-mono text-slate-500 text-[11px]">20% Weight</span>
          </div>
          <div className="text-base font-bold text-white">
            {P.score}%
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({P.rawAverageRating > 0 ? `${P.rawAverageRating.toFixed(1)}/5★` : 'Provisional'})
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, P.score)}%` }} />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-slate-200">+{P.contribution.toFixed(1)} pts</span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg flex items-start gap-2 border border-slate-800">
        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Methodology Note:</strong> This collaboration score reflects verified database records of completed milestones and peer ratings.
        </span>
      </div>
    </div>
  );
};
