import { calculateCandidateMatch } from './matchingService.js';

function normalizeRole(role) {
  return (role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Deterministic Team Balance Analysis Service
 */
export function analyzeTeamBalance(
  project,
  allCandidates = [],
  pendingCandidateIds = []
) {
  const requiredRoles = project.requiredRoles || [];
  const requiredSkills = project.requiredSkills || [];
  const currentMembers = project.teamMembers || [];

  // 1. Analyze Role Coverage
  const coveredRolesSet = new Set();
  const roleCounts = {};

  for (const reqRole of requiredRoles) {
    const normReq = normalizeRole(reqRole);
    const matchedMember = currentMembers.find(m => {
      const normMemberRole = normalizeRole(m.role);
      return normMemberRole.includes(normReq) || normReq.includes(normMemberRole);
    });

    if (matchedMember) {
      coveredRolesSet.add(reqRole);
      roleCounts[reqRole] = (roleCounts[reqRole] || 0) + 1;
    }
  }

  const coveredRoles = Array.from(coveredRolesSet);
  const missingRoles = requiredRoles.filter(r => !coveredRolesSet.has(r));

  const totalRequiredRoles = requiredRoles.length;
  const coveredRolesCount = coveredRoles.length;
  const roleCoveragePercentage =
    totalRequiredRoles > 0
      ? Math.round((coveredRolesCount / totalRequiredRoles) * 100)
      : 100;

  // 2. Analyze Skill Coverage across all team members
  const memberSkillsSet = new Set();
  for (const member of currentMembers) {
    const mIdStr = String(member.userId?._id || member.userId || member.id || member._id || '');
    const userProfile = allCandidates.find(c => String(c.id || c._id || '') === mIdStr);
    if (userProfile && userProfile.skills) {
      for (const s of userProfile.skills) {
        const sName = typeof s === 'string' ? s : (s?.name || s?.skill || '');
        if (sName) memberSkillsSet.add(sName.toLowerCase().trim());
      }
    }
  }

  const coveredSkills = [];
  const missingSkills = [];

  for (const req of requiredSkills) {
    const reqSkillName = typeof req === 'string' ? req : (req?.skill || req?.name || '');
    const reqNorm = reqSkillName.toLowerCase().trim();
    if (!reqNorm) continue;
    const isCovered = Array.from(memberSkillsSet).some(
      s => s === reqNorm || s.includes(reqNorm) || reqNorm.includes(s)
    );
    if (isCovered) {
      coveredSkills.push(reqSkillName);
    } else {
      missingSkills.push(reqSkillName);
    }
  }

  const totalRequiredSkills = requiredSkills.length;
  const coveredSkillsCount = coveredSkills.length;
  const skillCoveragePercentage =
    totalRequiredSkills > 0
      ? Math.round((coveredSkillsCount / totalRequiredSkills) * 100)
      : 100;

  // 3. Roles needing additional members
  const rolesNeedingMembers = [];
  for (const mRole of missingRoles) {
    rolesNeedingMembers.push({ role: mRole, neededCount: 1 });
  }

  // 4. Recommend eligible candidates tailored for missing roles
  const leaderIdStr = String(project.leaderId?._id || project.leaderId || '');
  const memberIdSet = new Set(currentMembers.map(m => String(m.userId?._id || m.userId || m.id || m._id || '')));
  if (leaderIdStr) memberIdSet.add(leaderIdStr);

  const eligibleCandidates = allCandidates.filter(c => {
    const cId = String(c?.id || c?._id || '');
    if (!cId || memberIdSet.has(cId)) return false;
    return true;
  });

  const recommendedCandidates = [];
  for (const candidate of eligibleCandidates) {
    const candPrefRolesNorm = (candidate.preferredRoles || []).map(normalizeRole);
    const hasMissingRolePreference = missingRoles.some(mr =>
      candPrefRolesNorm.some(pr => pr.includes(normalizeRole(mr)) || normalizeRole(mr).includes(pr))
    );

    const candSkillsNorm = (candidate.skills || []).map(s => {
      const sName = typeof s === 'string' ? s : (s?.name || s?.skill || '');
      return sName.toLowerCase().trim();
    }).filter(Boolean);

    const hasMissingSkill = missingSkills.some(ms =>
      candSkillsNorm.some(cs => cs.includes(ms.toLowerCase()) || ms.toLowerCase().includes(cs))
    );

    if (hasMissingRolePreference || hasMissingSkill || missingRoles.length === 0) {
      const match = calculateCandidateMatch(project, candidate, pendingCandidateIds);
      if (match) recommendedCandidates.push(match);
    }
  }

  recommendedCandidates.sort((a, b) => b.overallMatchScore - a.overallMatchScore);

  return {
    totalRequiredRoles,
    coveredRolesCount,
    roleCoveragePercentage,
    coveredRoles,
    missingRoles,
    totalRequiredSkills,
    coveredSkillsCount,
    skillCoveragePercentage,
    coveredSkills,
    missingSkills,
    rolesNeedingMembers,
    recommendedCandidatesForMissingRoles: recommendedCandidates.slice(0, 6),
  };
}
