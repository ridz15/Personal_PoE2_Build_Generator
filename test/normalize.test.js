import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeRawData, toPatchSnapshot } from "../src/data/normalize.js";

const rawSource = JSON.parse(await readFile("data/raw/sample-source.json", "utf8"));

test("normalizes raw records into generator collections", () => {
  const normalized = normalizeRawData(rawSource);

  assert.equal(normalized.version, "sample-source-0");
  assert.equal(normalized.skills[0].id, "skill.firebolt");
  assert.deepEqual(normalized.skills[0].tags, ["fire", "spell", "projectile", "hit"]);
  assert.equal(normalized.supportGems[0].id, "support.burning_support");
  assert.deepEqual(normalized.supportGems[0].requiresAllTags, ["hit"]);
  assert.deepEqual(normalized.supportGems[0].requiresAnyTags, ["fire"]);
  assert.deepEqual(normalized.supportGems[0].mechanicRequirements, ["ignite"]);
  assert.equal(normalized.modifiers[0].statKey, "plus_fire_skill_level");
});

test("creates patch snapshots from normalized data", () => {
  const normalized = normalizeRawData(rawSource);
  const snapshot = toPatchSnapshot(normalized);

  assert.equal(snapshot.version, "sample-source-0");
  assert.ok(snapshot.entities.some((entity) => entity.type === "skill"));
  assert.ok(snapshot.entities.some((entity) => entity.type === "modifier"));
});
