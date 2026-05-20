import { isAllowedForBudget, stagePenalty } from "../domain/budget.js";
import { evaluateSupportAgainstSkills, getSkillCompatibilityTags } from "../domain/compatibility.js";
import { evaluateItemSlotCompatibility, getItemSynergyTags, getSlotPriority, indexModifiers, resolveItemModifiers } from "../domain/items.js";

function countIntersection(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((tag) => rightSet.has(tag)).length;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function scoreArchetype(request, archetype) {
  const tagMatches = countIntersection(request.tags, archetype.tags);
  const preferredMatches = countIntersection(request.tags, archetype.preferredStats);
  const forbiddenMatches = countIntersection(request.tags, archetype.forbiddenStats);

  return {
    score: tagMatches * 15 + preferredMatches * 8 - forbiddenMatches * 30,
    reasons: unique([
      ...request.tags.filter((tag) => archetype.tags.includes(tag)).map((tag) => `matches ${tag}`),
      ...request.tags.filter((tag) => archetype.preferredStats.includes(tag)).map((tag) => `prefers ${tag}`),
      ...request.tags.filter((tag) => archetype.forbiddenStats.includes(tag)).map((tag) => `conflicts with ${tag}`)
    ])
  };
}

export function scoreCandidate(request, archetypes, candidate) {
  const candidateTags = unique([
    ...(candidate.tags ?? []),
    ...(candidate.scalingTags ?? []),
    ...(candidate.compatibleTags ?? []),
    ...(candidate.bonuses ?? []),
    ...(candidate.mechanics ?? []),
    ...(candidate.buildEnablers ?? [])
  ]);

  const archetypeTags = unique(archetypes.flatMap((archetype) => [
    ...(archetype.tags ?? []),
    ...(archetype.preferredStats ?? [])
  ]));

  const requestMatches = countIntersection(request.tags, candidateTags);
  const archetypeMatches = countIntersection(archetypeTags, candidateTags);
  const budgetPenalty = stagePenalty(candidate.stage, request.budget);
  const unavailablePenalty = isAllowedForBudget(candidate.stage, request.budget) ? 0 : 15;

  const score = requestMatches * 20 + archetypeMatches * 7 - budgetPenalty - unavailablePenalty;

  return {
    score,
    allowedForBudget: isAllowedForBudget(candidate.stage, request.budget),
    reasons: unique([
      ...request.tags.filter((tag) => candidateTags.includes(tag)).map((tag) => `matches request tag ${tag}`),
      ...archetypeTags.filter((tag) => candidateTags.includes(tag)).slice(0, 5).map((tag) => `supports archetype tag ${tag}`),
      candidate.stage && !isAllowedForBudget(candidate.stage, request.budget)
        ? `above ${request.budget} budget`
        : null
    ])
  };
}

export function scoreSupportCandidate(request, archetypes, candidate, skills = []) {
  const base = scoreCandidate(request, archetypes, candidate);
  const skillTags = unique(skills.flatMap(getSkillCompatibilityTags));
  const compatibility = evaluateSupportAgainstSkills(candidate, skills);
  const bonusMatches = countIntersection(candidate.bonuses ?? [], skillTags);
  const incompatibilityPenalty = compatibility.isCompatible ? 0 : 100;
  const skillScore = compatibility.score + bonusMatches * 8 - incompatibilityPenalty;

  return {
    ...base,
    score: base.score + skillScore,
    compatibleWithPrimarySkill: compatibility.isCompatible,
    compatibility,
    reasons: unique([
      ...base.reasons,
      ...((candidate.bonuses ?? []).filter((tag) => skillTags.includes(tag)).map((tag) => `scales skill tag ${tag}`)),
      ...(compatibility.reasons ?? [])
    ])
  };
}

export function scoreItemCandidate(request, archetypes, item, gameData = {}, skills = []) {
  const modifierIndex = indexModifiers(gameData.modifiers ?? []);
  const itemTags = getItemSynergyTags(item, modifierIndex);
  const archetypeTags = unique(archetypes.flatMap((archetype) => [
    ...(archetype.tags ?? []),
    ...(archetype.preferredStats ?? [])
  ]));
  const requestMatches = countIntersection(request.tags, itemTags);
  const archetypeMatches = countIntersection(archetypeTags, itemTags);
  const enablerMatches = countIntersection(item.buildEnablers ?? [], archetypeTags);
  const modifierMatches = resolveItemModifiers(item, modifierIndex)
    .filter((modifier) => countIntersection(modifier.tags ?? [], [...request.tags, ...archetypeTags]) > 0);
  const slotPriority = getSlotPriority(item, request, archetypes);
  const slotCompatibility = evaluateItemSlotCompatibility(item, request, archetypes, skills);
  const hasDirectMatch =
    requestMatches > 0 ||
    archetypeMatches > 0 ||
    enablerMatches > 0 ||
    modifierMatches.length > 0 ||
    countIntersection(item.roles ?? [], request.tags ?? []) > 0;
  const budgetPenalty = stagePenalty(item.stage, request.budget);
  const unavailablePenalty = isAllowedForBudget(item.stage, request.budget) ? 0 : 15;
  const roleBonus = hasDirectMatch ? countIntersection(item.roles ?? [], ["build_enabler", "scaling_multiplier"]) * 12 : 0;
  const slotPenalty = slotCompatibility.isCompatible ? 0 : 120;
  const score =
    requestMatches * 18 +
    archetypeMatches * 8 +
    enablerMatches * 20 +
    modifierMatches.length * 12 +
    slotPriority +
    slotCompatibility.score +
    roleBonus -
    budgetPenalty -
    unavailablePenalty -
    slotPenalty;

  return {
    score,
    allowedForBudget: isAllowedForBudget(item.stage, request.budget),
    slotPriority,
    slotCompatibility,
    matchedModifiers: modifierMatches.map((modifier) => ({
      id: modifier.id,
      text: modifier.text,
      tags: modifier.tags
    })),
    reasons: unique([
      ...request.tags.filter((tag) => itemTags.includes(tag)).map((tag) => `matches request tag ${tag}`),
      ...archetypeTags.filter((tag) => itemTags.includes(tag)).slice(0, 6).map((tag) => `supports archetype tag ${tag}`),
      ...modifierMatches.map((modifier) => `matched modifier ${modifier.text}`),
      ...((item.buildEnablers ?? []).filter((tag) => archetypeTags.includes(tag)).map((tag) => `enables ${tag}`)),
      slotPriority > 0 && hasDirectMatch ? `slot ${item.slot ?? "jewel"} has priority for this build` : null,
      ...(hasDirectMatch ? slotCompatibility.reasons ?? [] : []),
      item.stage && !isAllowedForBudget(item.stage, request.budget) ? `above ${request.budget} budget` : null
    ])
  };
}

export function rankCandidates(request, archetypes, candidates, limit = 5, scorer = scoreCandidate) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      recommendation: scorer(request, archetypes, candidate)
    }))
    .filter((candidate) => candidate.recommendation.score > 0 && candidate.recommendation.reasons.length > 0)
    .sort((left, right) => right.recommendation.score - left.recommendation.score)
    .slice(0, limit);
}
