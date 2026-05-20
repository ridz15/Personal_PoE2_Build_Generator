import { parseBuildRequest } from "./requestParser.js";
import { recommendCultivatedUpgrades } from "./cultivated.js";
import { buildProgressionTiers } from "./progression.js";
import { rankCandidates, scoreArchetype, scoreItemCandidate, scoreSupportCandidate } from "../scoring/tagScore.js";

function topArchetypes(request, archetypes) {
  const ranked = archetypes
    .map((archetype) => ({
      ...archetype,
      recommendation: scoreArchetype(request, archetype)
    }))
    .filter((archetype) => archetype.recommendation.score > 0)
    .sort((left, right) => right.recommendation.score - left.recommendation.score)
    .slice(0, 3);

  const focused = ranked.filter((archetype) => archetype.recommendation.score >= 30);
  if (focused.length === 0) return ranked.slice(0, 1);

  const topScore = focused[0].recommendation.score;
  return focused.filter((archetype) => archetype.recommendation.score >= topScore * 0.8);
}

export function recommendBuild(input, gameData) {
  const request = typeof input === "string" ? parseBuildRequest(input) : input;
  const archetypes = topArchetypes(request, gameData.archetypes ?? []);
  const skills = rankCandidates(request, archetypes, gameData.skills ?? [], 5);
  const primarySkills = skills.slice(0, 1);
  const supportScorer = (supportRequest, supportArchetypes, support) =>
    scoreSupportCandidate(supportRequest, supportArchetypes, support, primarySkills);
  const itemScorer = (itemRequest, itemArchetypes, item) =>
    scoreItemCandidate(itemRequest, itemArchetypes, item, gameData, primarySkills);

  const result = {
    request,
    archetypes,
    skills,
    supportGems: rankCandidates(request, archetypes, gameData.supportGems ?? [], 6, supportScorer),
    lineageSupportGems: rankCandidates(request, archetypes, gameData.lineageSupportGems ?? [], 4, supportScorer),
    uniqueItems: rankCandidates(request, archetypes, gameData.uniqueItems ?? [], 5, itemScorer),
    uniqueJewels: rankCandidates(request, archetypes, gameData.uniqueJewels ?? [], 5, itemScorer),
    cultivatedUpgrades: recommendCultivatedUpgrades(request, archetypes, gameData.modifiers ?? []),
    statPriorities: buildStatPriorities(request, archetypes)
  };

  return {
    ...result,
    progressionTiers: buildProgressionTiers(result)
  };
}

function buildStatPriorities(request, archetypes) {
  const priorityCounts = new Map();

  for (const tag of request.tags) {
    priorityCounts.set(tag, (priorityCounts.get(tag) ?? 0) + 2);
  }

  for (const archetype of archetypes) {
    for (const stat of archetype.preferredStats ?? []) {
      priorityCounts.set(stat, (priorityCounts.get(stat) ?? 0) + 1);
    }
  }

  return [...priorityCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([tag, weight]) => ({ tag, weight }));
}
