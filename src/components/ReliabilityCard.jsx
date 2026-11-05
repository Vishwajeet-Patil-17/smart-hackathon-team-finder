import React from 'react';
import { ShieldAlert, Award, Clock, CheckCircle2, Star, HelpCircle, FolderGit2 } from 'lucide-react';

export const ReliabilityCard = ({ reliability, studentName, compact = false }) => {
  if (!reliability) {
    return null;
  }

  if (reliability.isInsufficientData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="font-semibold text-sm">
            {reliability.projectName ? `${reliability.projectName} — Reliability Score` : 'Reliability Score: Insufficient Data'}
          </span>
        </div>
        <p className="text-xs text-amber-700 leading-relaxed">
          {reliability.insufficientReason || 'No tasks or peer evaluations have been recorded for this student on this project yet.'}
        </p>
        <div className="text-[11px] text-amber-800 font-mono bg-white p-2 rounded border border-amber-200">
          Safeguard Active: System does not fabricate scores without verified database records.
        </div>
      </div>
    );
  }

  const overall = Number(reliability.overallScore ?? 0);
  const components = reliability.components || {};
  const T = components.T || { score: 0, contribution: 0, tasksCompleted: 0, totalTasksAssigned: 0 };
  const D = components.D || { score: 0, contribution: 0, tasksCompletedOnTime: 0, totalCompletedTasks: 0 };
  const P = components.P || { score: 0, contribution: 0, rawAverageRating: 0 };

  const getScoreBadgeColor = (val) => {
    if (val >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 70) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (val >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-gray-900 text-base">
              {studentName ? `${studentName}'s Reliability Score` : 'Project Reliability Score'}
            </h4>
            {reliability.projectName && (
              <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-indigo-700 border border-gray-200 rounded-md font-medium flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 text-indigo-600" />
                {reliability.projectName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Formula: <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px] border border-gray-200">0.50T + 0.30D + 0.20P</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reliability.isProvisional && (
            <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-medium">
              Provisional
            </span>
          )}
          <div className={`px-3 py-1 rounded-lg border font-bold text-lg ${getScoreBadgeColor(overall)}`}>
            {overall.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-3 pt-1`}>
        {/* T Component */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Task Completion (T)
            </span>
            <span className="font-mono text-gray-400 text-[11px]">50% Weight</span>
          </div>
          <div className="text-base font-bold text-gray-900">
            {T.score}%
            <span className="text-xs font-normal text-gray-500 ml-1.5">
              ({T.tasksCompleted || 0}/{T.totalTasksAssigned || 0} tasks)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, T.score || 0))}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-gray-800">+{Number(T.contribution || 0).toFixed(1)} pts</span>
          </div>
        </div>

        {/* D Component */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              On-Time Rate (D)
            </span>
            <span className="font-mono text-gray-400 text-[11px]">30% Weight</span>
          </div>
          <div className="text-base font-bold text-gray-900">
            {D.score}%
            <span className="text-xs font-normal text-gray-500 ml-1.5">
              ({D.tasksCompletedOnTime || 0}/{D.totalCompletedTasks || 0} on time)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, D.score || 0))}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-gray-800">+{Number(D.contribution || 0).toFixed(1)} pts</span>
          </div>
        </div>

        {/* P Component */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              Peer Evaluation (P)
            </span>
            <span className="font-mono text-gray-400 text-[11px]">20% Weight</span>
          </div>
          <div className="text-base font-bold text-gray-900">
            {P.score}%
            <span className="text-xs font-normal text-gray-500 ml-1.5">
              ({P.rawAverageRating > 0 ? `${Number(P.rawAverageRating).toFixed(1)}/5★` : 'Provisional'})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, P.score || 0))}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>Contribution:</span>
            <span className="font-semibold text-gray-800">+{Number(P.contribution || 0).toFixed(1)} pts</span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-lg flex items-start gap-2 border border-gray-200">
        <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <span>
          <strong>Safeguard & Evaluation Note:</strong> Reliability score is calculated across verified task deadlines and peer evaluations submitted after project completion.
        </span>
      </div>
    </div>
  );
};
