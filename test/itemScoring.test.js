import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseBuildRequest } from "../src/generator/requestParser.js";
import { recommendBuild } from "../src/generator/recommendationEngine.js";
import { scoreArchetype, scoreItemCandidate } from "../src/scoring/tagScore.js";
import { evaluateItemSlotCompatibility } from "../src/domain/items.js";

const gameData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));

test("scores item modifiers and build enablers", () => {
  const request = parseBuildRequest("fire ignite spell mid balanced");
  const archetypes = gameData.archetypes
    .map((archetype) => ({ ...archetype, recommendation: scoreArchetype(request, archetype) }))
    .filter((archetype) => archetype.id === "archetype.fire_ignite_spell");
  const item = gameData.uniqueItems.find((candidate) => candidate.id === "unique.emberwake_mock");
  const result = scoreItemCandidate(request, archetypes, item, gameData);

  assert.ok(result.score > 0);
  assert.equal(result.allowedForBudget, true);
  assert.ok(result.matchedModifiers.some((modifier) => modifier.id === "mod.ignite_magnitude"));
  assert.ok(result.reasons.some((reason) => reason.includes("enables ignite")));
});

test("prioritizes quiver for projectile bow poison builds", () => {
  const result = recommendBuild("poison projectile bow mid damage", gameData);
  const quiver = result.uniqueItems[0];

  assert.equal(quiver.id, "unique.venom_quiver_mock");
  assert.ok(quiver.recommendation.slotPriority > 0);
  assert.ok(quiver.recommendation.matchedModifiers.some((modifier) => modifier.id === "mod.poison_magnitude"));
  assert.equal(quiver.recommendation.slotCompatibility.isCompatible, true);
});

test("recommends unique jewels for endgame requests when tags fit", () => {
  const result = recommendBuild("defense spirit endgame tanky", gameData);
  const jewel = result.uniqueJewels.find((candidate) => candidate.id === "unique_jewel.darkness_mock");

  assert.ok(jewel);
  assert.equal(jewel.recommendation.allowedForBudget, true);
});

test("blocks quiver from fire spell builds through slot compatibility", () => {
  const result = recommendBuild("fire ignite spell mid balanced", gameData);
  const quiver = result.uniqueItems.find((candidate) => candidate.id === "unique.venom_quiver_mock");

  assert.equal(quiver, undefined);
});

test("evaluates slot compatibility reasons", () => {
  const request = parseBuildRequest("fire ignite spell mid balanced");
  const archetypes = gameData.archetypes.filter((archetype) => archetype.id === "archetype.fire_ignite_spell");
  const skill = gameData.skills.find((candidate) => candidate.id === "skill.firebolt");
  const quiver = gameData.uniqueItems.find((candidate) => candidate.id === "unique.venom_quiver_mock");
  const result = evaluateItemSlotCompatibility(quiver, request, archetypes, [skill]);

  assert.equal(result.isCompatible, false);
  assert.ok(result.blockedTags.includes("spell"));
});
