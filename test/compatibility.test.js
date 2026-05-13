import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSupportCompatibility } from "../src/domain/compatibility.js";

const poisonAttackSkill = {
  id: "skill.poison_barrage",
  name: "Poison Barrage",
  tags: ["chaos", "attack", "projectile", "bow", "hit"],
  mechanics: ["poison"],
  scalingTags: ["chaos", "attack", "projectile", "attack_speed", "poison", "ailment_magnitude"]
};

test("passes when all compatibility rules match", () => {
  const support = {
    requiresAllTags: ["hit"],
    requiresAnyTags: ["chaos"],
    forbiddenTags: ["spell"],
    mechanicRequirements: ["poison"]
  };

  const result = evaluateSupportCompatibility(support, poisonAttackSkill);

  assert.equal(result.isCompatible, true);
  assert.ok(result.reasons.includes("passes compatibility rules"));
});

test("fails when a forbidden tag is present", () => {
  const support = {
    requiresAllTags: ["hit"],
    requiresAnyTags: ["chaos"],
    forbiddenTags: ["attack"],
    mechanicRequirements: ["poison"]
  };

  const result = evaluateSupportCompatibility(support, poisonAttackSkill);

  assert.equal(result.isCompatible, false);
  assert.deepEqual(result.blockedTags, ["attack"]);
});

test("fails when required mechanics are missing", () => {
  const support = {
    requiresAllTags: ["hit"],
    requiresAnyTags: ["chaos"],
    forbiddenTags: [],
    mechanicRequirements: ["ignite"]
  };

  const result = evaluateSupportCompatibility(support, poisonAttackSkill);

  assert.equal(result.isCompatible, false);
  assert.deepEqual(result.missingMechanics, ["ignite"]);
});

