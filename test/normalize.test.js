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

test("normalizes archetype records", () => {
  const normalized = normalizeRawData({
    records: [
      {
        kind: "archetype",
        key: "fire_test",
        displayName: "Fire Test",
        tags: ["Fire"],
        preferredStats: ["Fire Damage"],
        forbiddenStats: ["Minion"],
        budgetProfile: "mid"
      }
    ]
  });

  assert.equal(normalized.archetypes[0].id, "archetype.fire_test");
  assert.deepEqual(normalized.archetypes[0].preferredStats, ["fire_damage"]);
  assert.equal(normalized.archetypes[0].budgetProfile, "mid");
});

test("normalizes unique item and jewel records", () => {
  const normalized = normalizeRawData({
    records: [
      {
        kind: "unique_item",
        key: "test_quiver",
        displayName: "Test Quiver",
        slot: "Quiver",
        slotRequirements: {
          requiresAnyTags: ["Bow"],
          forbiddenTags: ["Spell"]
        },
        roles: ["Damage"],
        tags: ["Cold"],
        modifiers: ["cold_damage"],
        buildEnablers: ["Freeze"],
        tier: "mid"
      },
      {
        kind: "unique_jewel",
        key: "test_jewel",
        displayName: "Test Jewel",
        tags: ["Jewel", "Cold"],
        roles: ["Scaling Multiplier"],
        modifiers: ["mod.cold_damage"],
        radiusRules: ["Small"],
        treeInteractions: ["Cold Cluster"],
        tier: "endgame"
      }
    ]
  });

  assert.equal(normalized.uniqueItems[0].id, "unique.test_quiver");
  assert.equal(normalized.uniqueItems[0].slot, "quiver");
  assert.deepEqual(normalized.uniqueItems[0].modifiers, ["mod.cold_damage"]);
  assert.equal(normalized.uniqueJewels[0].id, "unique_jewel.test_jewel");
  assert.deepEqual(normalized.uniqueJewels[0].treeInteractions, ["cold_cluster"]);
});
