import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeRawData } from "../src/data/normalize.js";
import { validateGameData } from "../src/data/validateGameData.js";

const gameData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));
const appBaseData = JSON.parse(await readFile("data/app/base-game-data.json", "utf8"));
const curatedPack = JSON.parse(await readFile("data/packs/curated-starter-pack.json", "utf8"));

test("validates fixture game data", () => {
  const report = validateGameData(gameData);

  assert.equal(report.valid, true);
  assert.equal(report.errors.length, 0);
});

test("validates app base game data without unique mocks", () => {
  const report = validateGameData(appBaseData);

  assert.equal(report.valid, true);
  assert.equal(report.errors.length, 0);
  assert.equal(appBaseData.uniqueItems.length, 0);
  assert.equal(appBaseData.uniqueJewels.length, 0);
});

test("detects missing modifier references", () => {
  const broken = structuredClone(gameData);
  broken.uniqueItems[0].modifiers.push("mod.not_real");
  const report = validateGameData(broken);

  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.code === "unknown_modifier"));
});

test("detects duplicate ids", () => {
  const broken = structuredClone(gameData);
  broken.skills.push({ ...broken.skills[0] });
  const report = validateGameData(broken);

  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.code === "duplicate_id"));
});

test("normalizes archetype records from curated packs", () => {
  const normalized = normalizeRawData(curatedPack);

  assert.ok(normalized.archetypes.some((archetype) => archetype.id === "archetype.cold_projectile_attack"));
  assert.ok(normalized.skills.some((skill) => skill.id === "skill.ice_shot_mock"));
  assert.ok(normalized.uniqueItems.some((item) => item.id === "unique.frost_fletched_quiver_mock"));
  assert.ok(normalized.uniqueJewels.some((jewel) => jewel.id === "unique_jewel.winter_focus_jewel_mock"));
});
