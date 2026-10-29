/**
 * Calculates project-specific reliability score with transparent safeguards
 * Formula: Reliability Score = 0.50T + 0.30D + 0.20P
 */
export function calculateReliabilityScore(
  userId,
  projectId,
  tasks = [],
  peerEvaluations = [],
  isProjectCompleted = false
) {
  const memberTasks = tasks.filter(t => t.assignedTo === userId && t.projectId === projectId);
  const memberPeerEvals = peerEvaluations.filter(
    e => e.evaluatedMemberId === userId && e.projectId === projectId
  );

  const totalTasksAssigned = memberTasks.length;
  const completedTasks = memberTasks.filter(t => t.status === 'Completed');
  const completedTasksCount = completedTasks.length;

  // Safeguard: Zero tasks assigned
  if (totalTasksAssigned === 0) {
    return {
      userId,
      projectId,
      overallScore: null,
      isInsufficientData: true,
      isProvisional: true,
      insufficientReason: 'No tasks have been assigned to this member yet.',
      components: {
        T: { score: 0, weight: 0.5, contribution: 0, totalTasksAssigned: 0, tasksCompleted: 0, completionRate: 0 },
        D: { score: 0, weight: 0.3, contribution: 0, totalCompletedTasks: 0, tasksCompletedOnTime: 0, onTimeRate: 0 },
        P: { score: 0, weight: 0.2, contribution: 0, evaluationsReceivedCount: 0, rawAverageRating: 0, normalizedScore: 0 },
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  // T: Task completion percentage (0 - 100)
  const completionRate = (completedTasksCount / totalTasksAssigned) * 100;
  const T = Math.round(completionRate * 10) / 10;

  // D: Percentage of completed tasks finished on time (0 - 100)
  let tasksCompletedOnTime = 0;
  for (const ct of completedTasks) {
    if (ct.completedOnTime === true) {
      tasksCompletedOnTime++;
    } else if (ct.completedAt && ct.deadline) {
      const isOntime = new Date(ct.completedAt) <= new Date(ct.deadline);
      if (isOntime) tasksCompletedOnTime++;
    } else {
      tasksCompletedOnTime++;
    }
  }

  let onTimeRate = 0;
  if (completedTasksCount > 0) {
    onTimeRate = (tasksCompletedOnTime / completedTasksCount) * 100;
  }
  const D = Math.round(onTimeRate * 10) / 10;

  // P: Normalized peer evaluation score (0 - 100)
  // Formula: P = ((Average Rating - 1) / 4) * 100
  let rawAverageRating = 0;
  let P = 75;
  const evalsCount = memberPeerEvals.length;

  if (evalsCount > 0) {
    const totalRatingSum = memberPeerEvals.reduce((sum, e) => sum + e.averageRating, 0);
    rawAverageRating = totalRatingSum / evalsCount;
    const normalized = ((rawAverageRating - 1) / 4) * 100;
    P = Math.min(100, Math.max(0, Math.round(normalized * 10) / 10));
  } else {
    rawAverageRating = 0;
    P = 50;
  }

  const tContribution = 0.5 * T;
  const dContribution = 0.3 * D;
  const pContribution = 0.2 * P;

  const rawOverall = tContribution + dContribution + pContribution;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall * 10) / 10));

  const isProvisional = !isProjectCompleted || evalsCount === 0;

  return {
    userId,
    projectId,
    overallScore,
    isInsufficientData: false,
    isProvisional,
    components: {
      T: {
        score: T,
        weight: 0.5,
        contribution: Math.round(tContribution * 10) / 10,
        totalTasksAssigned,
        tasksCompleted: completedTasksCount,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      D: {
        score: D,
        weight: 0.3,
        contribution: Math.round(dContribution * 10) / 10,
        totalCompletedTasks: completedTasksCount,
        tasksCompletedOnTime,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
      },
      P: {
        score: P,
        weight: 0.2,
        contribution: Math.round(pContribution * 10) / 10,
        evaluationsReceivedCount: evalsCount,
        rawAverageRating: Math.round(rawAverageRating * 10) / 10,
        normalizedScore: P,
      },
    },
    calculatedAt: new Date().toISOString(),
  };
}
