const PROFICIENCY_WEIGHTS = {
  Beginner: 0.6,
  Intermediate: 0.8,
  Advanced: 0.95,
  Expert: 1.0,
};

const EXPERIENCE_TIERS = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates deterministic Skill Match Score S (0 - 100)
 */
export function calculateSkillMatch(requiredSkills, candidateSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, matchingSkills: [], missingSkills: [] };
  }

  const matchingSkills = [];
  const missingSkills = [];
  let totalWeight = 0;
  let earnedScore = 0;

  for (const req of requiredSkills) {
    const reqNormalized = normalizeText(req.skill);
    const weight = req.isMandatory ? 1.5 : 1.0;
    totalWeight += weight;

    const matched = (candidateSkills || []).find(
      s => normalizeText(s.name) === reqNormalized ||
           reqNormalized.includes(normalizeText(s.name)) ||
           normalizeText(s.name).includes(reqNormalized)
    );

    if (matched) {
      matchingSkills.push(req.skill);
      const profWeight = PROFICIENCY_WEIGHTS[matched.proficiency] || 0.8;
      earnedScore += weight * profWeight;
    } else {
      missingSkills.push(req.skill);
    }
  }

  const normalizedScore = totalWeight > 0 ? (earnedScore / totalWeight) * 100 : 100;
  return {
    score: Math.min(100, Math.max(0, Math.round(normalizedScore * 10) / 10)),
    matchingSkills,
    missingSkills,
  };
}

/**
 * Calculates deterministic Experience Match Score E (0 - 100)
 */
export function calculateExperienceMatch(projectPreferred, candidateExperience) {
  const reqTier = EXPERIENCE_TIERS[projectPreferred] || 2;
  const candTier = EXPERIENCE_TIERS[candidateExperience] || 2;

  if (candTier >= reqTier) {
    return 100;
  }
  const diff = reqTier - candTier;
  if (diff === 1) return 75;
  if (diff === 2) return 50;
  return 25;
}

/**
 * Calculates deterministic Interest & Domain Match Score D (0 - 100)
 */
export function calculateDomainMatch(projectDomain, projectIdea, candidateInterests) {
  if (!candidateInterests || candidateInterests.length === 0) {
    return 40;
  }

  const normDomain = normalizeText(projectDomain);
  const normIdea = normalizeText(projectIdea);

  let directDomainMatch = false;
  let matchedInterestsCount = 0;

  for (const interest of candidateInterests) {
    const normInterest = normalizeText(interest);
    if (normInterest === normDomain || normDomain.includes(normInterest) || normInterest.includes(normDomain)) {
      directDomainMatch = true;
      matchedInterestsCount++;
    } else if (normIdea.includes(normInterest)) {
      matchedInterestsCount++;
    }
  }

  if (directDomainMatch) {
    return Math.min(100, 80 + matchedInterestsCount * 10);
  } else if (matchedInterestsCount > 0) {
    return Math.min(85, 50 + matchedInterestsCount * 15);
  }
  return 45;
}

/**
 * Calculates deterministic Availability Match Score A (0 - 100)
 */
export function calculateAvailabilityMatch(projectAvailability, candidateAvailability) {
  const normProj = normalizeText(projectAvailability || '');
  const normCand = normalizeText(candidateAvailability || '');

  if (normProj === normCand) return 100;
  if (normCand.includes('20') || normCand.includes('full')) return 100;
  if (normCand.includes('15') && (normProj.includes('15') || normProj.includes('10'))) return 90;
  if (normCand.includes('10')) return 70;
  if (normCand.includes('weekend')) return 60;
  return 80;
}

/**
 * Suggests the best-fitting role based on candidate's preferred roles and project required roles
 */
export function suggestRole(projectRequiredRoles, candidatePreferredRoles, matchingSkills) {
  const reqRoles = projectRequiredRoles || [];
  const prefRoles = candidatePreferredRoles || [];

  for (const reqRole of reqRoles) {
    for (const prefRole of prefRoles) {
      if (normalizeText(reqRole) === normalizeText(prefRole)) {
        return reqRole;
      }
    }
  }

  for (const reqRole of reqRoles) {
    for (const prefRole of prefRoles) {
      if (normalizeText(reqRole).includes(normalizeText(prefRole)) ||
          normalizeText(prefRole).includes(normalizeText(reqRole))) {
        return reqRole;
      }
    }
  }

  const lowerSkills = (matchingSkills || []).map(s => s.toLowerCase());
  if (lowerSkills.some(s => s.includes('react') || s.includes('vue') || s.includes('html') || s.includes('css'))) {
    const fRole = reqRoles.find(r => r.toLowerCase().includes('frontend'));
    if (fRole) return fRole;
  }
  if (lowerSkills.some(s => s.includes('node') || s.includes('python') || s.includes('express') || s.includes('mongo') || s.includes('sql'))) {
    const bRole = reqRoles.find(r => r.toLowerCase().includes('backend') || r.toLowerCase().includes('database'));
    if (bRole) return bRole;
  }
  if (lowerSkills.some(s => s.includes('figma') || s.includes('ui') || s.includes('design'))) {
    const dRole = reqRoles.find(r => r.toLowerCase().includes('designer') || r.toLowerCase().includes('ui/ux'));
    if (dRole) return dRole;
  }

  return reqRoles[0] || 'Team Contributor';
}

/**
 * Generates clear deterministic natural language explanation of recommendation
 */
export function generateMatchExplanation(
  overallScore,
  S,
  E,
  D,
  A,
  matchingSkills,
  missingSkills,
  suggestedRole
) {
  const parts = [];
  if (S >= 80) {
    parts.push(`Strong technical match with ${matchingSkills.length} key required skill(s) covered (${matchingSkills.join(', ')}).`);
  } else if (S >= 50) {
    parts.push(`Partial technical match covering: ${matchingSkills.join(', ')}.`);
  } else {
    parts.push(`Entry technical coverage; missing: ${(missingSkills || []).slice(0, 3).join(', ')}.`);
  }

  if (E >= 90) {
    parts.push('Candidate experience tier fully aligns with project demands.');
  }

  if (D >= 75) {
    parts.push('Demonstrated domain focus matches the project scope.');
  }

  parts.push(`Recommended for role: "${suggestedRole}".`);
  return parts.join(' ');
}

/**
 * Deterministic Candidate Match Recommendation Engine
 * Match Score = 0.40S + 0.20E + 0.20D + 0.20A
 */
export function calculateCandidateMatch(project, candidate, pendingInvitationIds = []) {
  const { score: S, matchingSkills, missingSkills } = calculateSkillMatch(
    project.requiredSkills,
    candidate.skills
  );

  const E = calculateExperienceMatch(
    project.preferredExperienceLevel,
    candidate.experienceLevel
  );

  const D = calculateDomainMatch(
    project.domain,
    project.idea,
    candidate.interests
  );

  const A = calculateAvailabilityMatch(
    project.expectedAvailability,
    candidate.availability
  );

  const rawScore = 0.4 * S + 0.2 * E + 0.2 * D + 0.2 * A;
  const overallMatchScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  const suggestedRole = suggestRole(
    project.requiredRoles,
    candidate.preferredRoles,
    matchingSkills
  );

  const explanation = generateMatchExplanation(
    overallMatchScore,
    S,
    E,
    D,
    A,
    matchingSkills,
    missingSkills,
    suggestedRole
  );

  return {
    candidate,
    overallMatchScore,
    skillMatchScore: S,
    experienceMatchScore: E,
    domainMatchScore: D,
    availabilityMatchScore: A,
    matchingSkills,
    missingSkills,
    suggestedRole,
    explanation,
    hasPendingInvitation: pendingInvitationIds.includes(candidate.id),
  };
}
