function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function allIncluded(required = [], available = []) {
  const availableSet = new Set(available);
  return required.every((tag) => availableSet.has(tag));
}

function anyIncluded(required = [], available = []) {
  if (required.length === 0) return true;
  const availableSet = new Set(available);
  return required.some((tag) => availableSet.has(tag));
}

function noneIncluded(forbidden = [], available = []) {
  const availableSet = new Set(available);
  return forbidden.every((tag) => !availableSet.has(tag));
}

export function getSkillCompatibilityTags(skill) {
  return unique([
    ...(skill.tags ?? []),
    ...(skill.mechanics ?? []),
    ...(skill.scalingTags ?? [])
  ]);
}

export function evaluateSupportCompatibility(support, skill) {
  const skillTags = getSkillCompatibilityTags(skill);
  const requiresAll = support.requiresAllTags ?? [];
  const requiresAny = support.requiresAnyTags ?? support.compatibleTags ?? [];
  const forbidden = support.forbiddenTags ?? [];
  const requiredMechanics = support.mechanicRequirements ?? [];
  const mechanics = skill.mechanics ?? [];

  const missingAll = requiresAll.filter((tag) => !skillTags.includes(tag));
  const matchedAny = requiresAny.filter((tag) => skillTags.includes(tag));
  const blockedTags = forbidden.filter((tag) => skillTags.includes(tag));
  const missingMechanics = requiredMechanics.filter((mechanic) => !mechanics.includes(mechanic));
  const isCompatible =
    allIncluded(requiresAll, skillTags) &&
    anyIncluded(requiresAny, skillTags) &&
    noneIncluded(forbidden, skillTags) &&
    allIncluded(requiredMechanics, mechanics);

  return {
    isCompatible,
    score:
      matchedAny.length * 18 +
      requiresAll.length * 12 +
      requiredMechanics.length * 14 -
      missingAll.length * 25 -
      blockedTags.length * 40 -
      missingMechanics.length * 35,
    matchedAny,
    missingAll,
    blockedTags,
    missingMechanics,
    reasons: buildCompatibilityReasons({
      matchedAny,
      requiresAll,
      requiredMechanics,
      missingAll,
      blockedTags,
      missingMechanics,
      isCompatible
    })
  };
}

export function evaluateSupportAgainstSkills(support, skills = []) {
  if (skills.length === 0) {
    return {
      isCompatible: true,
      score: 0,
      reasons: []
    };
  }

  const evaluations = skills.map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    ...evaluateSupportCompatibility(support, skill)
  }));
  const best = evaluations.sort((left, right) => right.score - left.score)[0];

  return {
    ...best,
    allEvaluations: evaluations
  };
}

function buildCompatibilityReasons(evaluation) {
  return unique([
    ...evaluation.matchedAny.map((tag) => `matches any-required skill tag ${tag}`),
    ...evaluation.requiresAll.map((tag) => `requires skill tag ${tag}`),
    ...evaluation.requiredMechanics.map((mechanic) => `requires mechanic ${mechanic}`),
    ...evaluation.missingAll.map((tag) => `missing required skill tag ${tag}`),
    ...evaluation.blockedTags.map((tag) => `blocked by skill tag ${tag}`),
    ...evaluation.missingMechanics.map((mechanic) => `missing required mechanic ${mechanic}`),
    evaluation.isCompatible ? "passes compatibility rules" : "fails compatibility rules"
  ]);
}

