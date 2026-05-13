import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { affectedArchetypes, diffSnapshots, summarizePatchImpact } from "../src/patch/diffEngine.js";

const previousSnapshot = JSON.parse(await readFile("data/snapshots/patch-0.json", "utf8"));
const nextSnapshot = JSON.parse(await readFile("data/snapshots/patch-1.json", "utf8"));
const gameData = JSON.parse(await readFile("data/fixtures/game-data.json", "utf8"));

test("detects changed modifiers and added lineage support", () => {
  const diff = diffSnapshots(previousSnapshot, nextSnapshot);

  assert.equal(diff.changed.length, 1);
  assert.equal(diff.added.length, 1);
  assert.ok(diff.affectedTags.includes("ignite"));
  assert.ok(diff.affectedTags.includes("poison"));
});

test("maps patch affected tags to archetypes", () => {
  const diff = diffSnapshots(previousSnapshot, nextSnapshot);
  const affected = affectedArchetypes(diff, gameData.archetypes);

  assert.ok(affected.some((archetype) => archetype.id === "archetype.fire_ignite_spell"));
  assert.ok(affected.some((archetype) => archetype.id === "archetype.poison_projectile_attack"));
});

test("summarizes patch impact for readable UI output", () => {
  const diff = diffSnapshots(previousSnapshot, nextSnapshot);
  const summary = summarizePatchImpact(diff, gameData.archetypes);

  assert.equal(summary.severity, "medium");
  assert.ok(summary.lines.some((line) => line.includes("new entities")));
  assert.ok(summary.affectedArchetypes.length >= 2);
});
