import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recommendBuild } from "../src/generator/recommendationEngine.js";
import { formatRecommendation } from "../src/format/pretty.js";

const gameData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));

test("adds progression tiers to recommendations", () => {
  const result = recommendBuild("poison projectile bow mid damage", gameData);

  assert.ok(result.progressionTiers.starter.supportGems.some((candidate) => candidate.id === "support.deadly_poison"));
  assert.ok(result.progressionTiers.mid.uniqueItems.some((candidate) => candidate.id === "unique.venom_quiver_mock"));
  assert.ok(result.progressionTiers.endgame.lineageSupportGems.some((candidate) => candidate.id === "lineage.arakaalis_lust"));
});

test("adds cultivated aspirational upgrade targets", () => {
  const result = recommendBuild("fire ignite spell aspirational damage", gameData);

  assert.ok(result.cultivatedUpgrades.some((candidate) => candidate.id === "cultivated.mod.cultivated_plus_fire_level"));
  assert.ok(result.progressionTiers.aspirational.cultivatedUpgrades.length > 0);
});

test("formats recommendation as readable text", () => {
  const result = recommendBuild("fire ignite spell mid balanced", gameData);
  const pretty = formatRecommendation(result);

  assert.match(pretty, /Build Request:/u);
  assert.match(pretty, /Primary Skill/u);
  assert.match(pretty, /Progression Tiers/u);
});

