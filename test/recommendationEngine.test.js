import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recommendBuild } from "../src/generator/recommendationEngine.js";

const gameData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));

test("recommends fire ignite spell candidates", () => {
  const result = recommendBuild("fire ignite spell starter balanced", gameData);

  assert.equal(result.archetypes[0].id, "archetype.fire_ignite_spell");
  assert.equal(result.skills[0].id, "skill.firebolt");
  assert.ok(result.supportGems.some((support) => support.id === "support.ignite_magnitude"));
  assert.ok(result.statPriorities.some((priority) => priority.tag === "ignite"));
});

test("keeps endgame lineage options but marks them above starter budget", () => {
  const result = recommendBuild("poison projectile attack starter damage", gameData);
  const lineage = result.lineageSupportGems.find((support) => support.id === "lineage.arakaalis_lust");

  assert.ok(lineage);
  assert.equal(lineage.recommendation.allowedForBudget, false);
});

test("scores supports against primary skill compatibility", () => {
  const result = recommendBuild("poison projectile attack starter damage", gameData);
  const poisonSupport = result.supportGems.find((support) => support.id === "support.deadly_poison");
  const controlledDestruction = result.supportGems.find((support) => support.id === "support.controlled_destruction");

  assert.ok(poisonSupport);
  assert.equal(poisonSupport.recommendation.compatibleWithPrimarySkill, true);
  assert.equal(controlledDestruction, undefined);
});

test("does not recommend supports that fail explicit mechanic rules", () => {
  const result = recommendBuild("poison projectile attack starter damage", gameData);
  const igniteSupport = result.supportGems.find((support) => support.id === "support.ignite_magnitude");

  assert.equal(igniteSupport, undefined);
});

test("scores supports against the top primary skill only", () => {
  const result = recommendBuild("fire ignite spell starter balanced", gameData);
  const poisonSupport = result.supportGems.find((support) => support.id === "support.deadly_poison");

  assert.equal(poisonSupport, undefined);
});
