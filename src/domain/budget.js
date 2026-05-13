const STAGE_ORDER = {
  starter: 0,
  mid: 1,
  endgame: 2,
  aspirational: 3
};

export function normalizeStage(stage) {
  return STAGE_ORDER[stage] === undefined ? "starter" : stage;
}

export function isAllowedForBudget(candidateStage = "starter", budget = "starter") {
  const candidateRank = STAGE_ORDER[normalizeStage(candidateStage)];
  const budgetRank = STAGE_ORDER[normalizeStage(budget)];
  return candidateRank <= budgetRank;
}

export function stagePenalty(candidateStage = "starter", budget = "starter") {
  const candidateRank = STAGE_ORDER[normalizeStage(candidateStage)];
  const budgetRank = STAGE_ORDER[normalizeStage(budget)];
  return Math.max(0, candidateRank - budgetRank) * 10;
}
