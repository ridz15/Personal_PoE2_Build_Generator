import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mergeGameData } from "../src/data/mergeGameData.js";
import { normalizeRawData } from "../src/data/normalize.js";
import { validateGameData } from "../src/data/validateGameData.js";
import { recommendBuild } from "../src/generator/recommendationEngine.js";

const baseData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));
const rawPack = JSON.parse(await readFile("data/packs/curated-starter-pack.json", "utf8"));

test("merges curated packs into base game data", () => {
  const incoming = normalizeRawData(rawPack);
  const result = mergeGameData(baseData, incoming);

  assert.equal(result.ok, true);
  assert.ok(result.report.added.some((entry) => entry.id === "skill.ice_shot_mock"));
  assert.equal(validateGameData(result.merged).valid, true);
});

test("uses merged data for cold projectile recommendations", () => {
  const incoming = normalizeRawData(rawPack);
  const result = mergeGameData(baseData, incoming);
  const recommendation = recommendBuild("cold projectile bow mid damage", result.merged);

  assert.equal(recommendation.skills[0].id, "skill.ice_shot_mock");
  assert.ok(recommendation.supportGems.some((support) => support.id === "support.cold_penetration_mock"));
  assert.equal(recommendation.uniqueItems[0].id, "unique.frost_fletched_quiver_mock");
  assert.ok(recommendation.uniqueJewels.some((jewel) => jewel.id === "unique_jewel.winter_focus_jewel_mock"));
  assert.equal(recommendation.uniqueItems.some((item) => item.id === "unique.emberwake_mock"), false);
});

test("reports merge conflicts by default", () => {
  const incoming = {
    skills: [{ ...baseData.skills[0] }]
  };
  const result = mergeGameData(baseData, incoming);

  assert.equal(result.ok, false);
  assert.equal(result.report.conflicts[0].id, baseData.skills[0].id);
});

test("can skip merge conflicts", () => {
  const incoming = {
    skills: [{ ...baseData.skills[0], name: "Changed" }]
  };
  const result = mergeGameData(baseData, incoming, { strategy: "skip" });

  assert.equal(result.ok, true);
  assert.equal(result.report.skipped.length, 1);
  assert.equal(result.merged.skills[0].name, baseData.skills[0].name);
});
