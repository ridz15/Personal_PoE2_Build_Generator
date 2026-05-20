const REQUIRED_COLLECTIONS = [
  "skills",
  "supportGems",
  "lineageSupportGems",
  "uniqueItems",
  "uniqueJewels",
  "modifiers",
  "archetypes"
];

const VALID_STAGES = new Set(["starter", "mid", "endgame", "aspirational"]);
const BASE_KNOWN_TAGS = [
  "ailment",
  "ailment_magnitude",
  "attack",
  "attack_speed",
  "bow",
  "cast_speed",
  "chaos",
  "cold",
  "critical",
  "cultivated",
  "damage",
  "damage_over_time",
  "defense",
  "fire",
  "freeze",
  "gem_level",
  "hit",
  "ignite",
  "jewel",
  "lightning",
  "melee",
  "minion",
  "modifier_magnitude",
  "penetration",
  "physical",
  "poison",
  "projectile",
  "resource",
  "resistance",
  "spirit",
  "spell",
  "totem"
];

export function validateGameData(gameData) {
  const report = {
    valid: true,
    errors: [],
    warnings: []
  };

  validateCollections(gameData, report);
  validateIds(gameData, report);
  validateStages(gameData, report);
  validateModifierReferences(gameData, report);
  validateSupportRules(gameData, report);
  validateSlotRequirements(gameData, report);
  validateArchetypeTags(gameData, report);

  report.valid = report.errors.length === 0;
  return report;
}

function validateCollections(gameData, report) {
  for (const collection of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(gameData[collection])) {
      report.errors.push({
        code: "missing_collection",
        message: `Missing collection: ${collection}`,
        path: collection
      });
    }
  }
}

function validateIds(gameData, report) {
  const seen = new Map();

  for (const collection of REQUIRED_COLLECTIONS) {
    for (const entity of gameData[collection] ?? []) {
      if (!entity.id) {
        report.errors.push({
          code: "missing_id",
          message: `Entity in ${collection} is missing id`,
          path: collection
        });
        continue;
      }

      if (!entity.name && !entity.text) {
        report.errors.push({
          code: "missing_name",
          message: `${entity.id} is missing name/text`,
          path: `${collection}.${entity.id}`
        });
      }

      if (seen.has(entity.id)) {
        report.errors.push({
          code: "duplicate_id",
          message: `Duplicate id: ${entity.id}`,
          path: `${seen.get(entity.id)} and ${collection}`
        });
      }

      seen.set(entity.id, collection);
    }
  }
}

function validateStages(gameData, report) {
  for (const collection of ["supportGems", "lineageSupportGems", "uniqueItems", "uniqueJewels"]) {
    for (const entity of gameData[collection] ?? []) {
      if (entity.stage && !VALID_STAGES.has(entity.stage)) {
        report.errors.push({
          code: "invalid_stage",
          message: `${entity.id} has invalid stage: ${entity.stage}`,
          path: `${collection}.${entity.id}.stage`
        });
      }
    }
  }
}

function validateModifierReferences(gameData, report) {
  const modifierIds = new Set((gameData.modifiers ?? []).map((modifier) => modifier.id));

  for (const collection of ["uniqueItems", "uniqueJewels"]) {
    for (const entity of gameData[collection] ?? []) {
      for (const modifierId of entity.modifiers ?? []) {
        if (!modifierIds.has(modifierId)) {
          report.errors.push({
            code: "unknown_modifier",
            message: `${entity.id} references missing modifier ${modifierId}`,
            path: `${collection}.${entity.id}.modifiers`
          });
        }
      }
    }
  }
}

function validateSupportRules(gameData, report) {
  for (const collection of ["supportGems", "lineageSupportGems"]) {
    for (const support of gameData[collection] ?? []) {
      const hasAnyRule =
        hasValues(support.requiresAllTags) ||
        hasValues(support.requiresAnyTags) ||
        hasValues(support.compatibleTags) ||
        hasValues(support.mechanicRequirements);

      if (!hasAnyRule) {
        report.warnings.push({
          code: "loose_support_rule",
          message: `${support.id} has no explicit compatibility rule`,
          path: `${collection}.${support.id}`
        });
      }
    }
  }
}

function validateSlotRequirements(gameData, report) {
  for (const collection of ["uniqueItems", "uniqueJewels"]) {
    for (const item of gameData[collection] ?? []) {
      if (collection === "uniqueItems" && !item.slot) {
        report.errors.push({
          code: "missing_slot",
          message: `${item.id} is missing slot`,
          path: `${collection}.${item.id}.slot`
        });
      }

      const requirements = item.slotRequirements;
      if (!requirements) continue;

      for (const field of ["requiresAllTags", "requiresAnyTags", "forbiddenTags"]) {
        if (requirements[field] !== undefined && !Array.isArray(requirements[field])) {
          report.errors.push({
            code: "invalid_slot_requirement",
            message: `${item.id} slotRequirements.${field} must be an array`,
            path: `${collection}.${item.id}.slotRequirements.${field}`
          });
        }
      }
    }
  }
}

function validateArchetypeTags(gameData, report) {
  const knownTags = collectKnownTags(gameData);

  for (const archetype of gameData.archetypes ?? []) {
    for (const tag of [...(archetype.tags ?? []), ...(archetype.preferredStats ?? []), ...(archetype.forbiddenStats ?? [])]) {
      if (!knownTags.has(tag)) {
        report.warnings.push({
          code: "unknown_archetype_tag",
          message: `${archetype.id} references uncommon tag ${tag}`,
          path: `archetypes.${archetype.id}`
        });
      }
    }
  }
}

function collectKnownTags(gameData) {
  const values = new Set(BASE_KNOWN_TAGS);
  const collections = ["skills", "supportGems", "lineageSupportGems", "uniqueItems", "uniqueJewels", "modifiers"];

  for (const collection of collections) {
    for (const entity of gameData[collection] ?? []) {
      for (const field of ["tags", "mechanics", "scalingTags", "compatibleTags", "requiresAllTags", "requiresAnyTags", "forbiddenTags", "mechanicRequirements", "bonuses", "roles", "buildEnablers", "appliesTo"]) {
        for (const value of entity[field] ?? []) {
          values.add(value);
        }
      }

      if (entity.statKey) {
        values.add(entity.statKey);
      }
    }
  }

  return values;
}

function hasValues(value) {
  return Array.isArray(value) && value.length > 0;
}
