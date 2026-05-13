const STAGES = ["starter", "mid", "endgame", "aspirational"];

export function buildProgressionTiers(result) {
  const tiers = Object.fromEntries(STAGES.map((stage) => [stage, emptyTier(stage)]));

  addToTiers(tiers, "skills", result.skills);
  addToTiers(tiers, "supportGems", result.supportGems);
  addToTiers(tiers, "lineageSupportGems", result.lineageSupportGems);
  addToTiers(tiers, "uniqueItems", result.uniqueItems);
  addToTiers(tiers, "uniqueJewels", result.uniqueJewels);
  addToTiers(tiers, "cultivatedUpgrades", result.cultivatedUpgrades);

  return tiers;
}

function emptyTier(stage) {
  return {
    stage,
    skills: [],
    supportGems: [],
    lineageSupportGems: [],
    uniqueItems: [],
    uniqueJewels: [],
    cultivatedUpgrades: []
  };
}

function addToTiers(tiers, key, candidates = []) {
  for (const candidate of candidates ?? []) {
    const stage = normalizeStage(candidate.stage);
    tiers[stage][key].push(candidate);
  }
}

function normalizeStage(stage) {
  return STAGES.includes(stage) ? stage : "starter";
}

