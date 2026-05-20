function normalizeTag(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/'/gu, "")
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function normalizeTags(values = []) {
  return [...new Set(values.map(normalizeTag).filter(Boolean))];
}

function normalizeStage(stage) {
  const normalized = normalizeTag(stage);
  return ["starter", "mid", "endgame", "aspirational"].includes(normalized) ? normalized : "starter";
}

export function normalizeRawData(rawSource) {
  const output = {
    version: rawSource.version ?? "unknown",
    skills: [],
    supportGems: [],
    lineageSupportGems: [],
    uniqueItems: [],
    uniqueJewels: [],
    modifiers: [],
    archetypes: []
  };

  for (const record of rawSource.records ?? []) {
    const normalized = normalizeRecord(record);
    if (!normalized) continue;
    output[normalized.collection].push(normalized.entity);
  }

  return output;
}

function normalizeRecord(record) {
  if (record.kind === "active_skill") {
    return {
      collection: "skills",
      entity: {
        id: `skill.${normalizeTag(record.key ?? record.displayName)}`,
        name: record.displayName,
        tags: normalizeTags(record.tags),
        mechanics: normalizeTags(record.mechanics),
        scalingTags: normalizeTags(record.scalesWith)
      }
    };
  }

  if (record.kind === "support" || record.kind === "lineage_support") {
    return {
      collection: record.kind === "lineage_support" ? "lineageSupportGems" : "supportGems",
      entity: {
        id: `${record.kind === "lineage_support" ? "lineage" : "support"}.${normalizeTag(record.key ?? record.displayName)}`,
        name: record.displayName,
        tags: normalizeTags(record.tags),
        compatibleTags: normalizeTags(record.requiresAnyTag),
        requiresAllTags: normalizeTags(record.requiresAllTags),
        requiresAnyTags: normalizeTags(record.requiresAnyTags ?? record.requiresAnyTag),
        forbiddenTags: normalizeTags(record.forbiddenTags),
        mechanicRequirements: normalizeTags(record.mechanicRequirements),
        bonuses: normalizeTags(record.grants),
        restrictions: normalizeTags(record.restrictions),
        downsides: normalizeTags(record.downsides),
        dropSource: record.dropSource ? normalizeTag(record.dropSource) : undefined,
        stage: normalizeStage(record.tier)
      }
    };
  }

  if (record.kind === "modifier") {
    return {
      collection: "modifiers",
      entity: {
        id: `mod.${normalizeTag(record.key ?? record.displayName)}`,
        text: record.displayName,
        statKey: normalizeTag(record.stat ?? record.key),
        value: record.value ?? null,
        appliesTo: normalizeTags(record.appliesTo),
        tags: normalizeTags(record.tags)
      }
    };
  }

  if (record.kind === "unique_item") {
    return {
      collection: "uniqueItems",
      entity: {
        id: `unique.${normalizeTag(record.key ?? record.displayName)}`,
        name: record.displayName,
        slot: normalizeTag(record.slot),
        slotRequirements: normalizeSlotRequirements(record.slotRequirements),
        roles: normalizeTags(record.roles),
        tags: normalizeTags(record.tags),
        modifiers: normalizeModifierRefs(record.modifiers),
        buildEnablers: normalizeTags(record.buildEnablers),
        stage: normalizeStage(record.tier)
      }
    };
  }

  if (record.kind === "unique_jewel") {
    return {
      collection: "uniqueJewels",
      entity: {
        id: `unique_jewel.${normalizeTag(record.key ?? record.displayName)}`,
        name: record.displayName,
        tags: normalizeTags(record.tags),
        roles: normalizeTags(record.roles),
        modifiers: normalizeModifierRefs(record.modifiers),
        radiusRules: normalizeTags(record.radiusRules),
        treeInteractions: normalizeTags(record.treeInteractions),
        stage: normalizeStage(record.tier)
      }
    };
  }

  if (record.kind === "archetype") {
    return {
      collection: "archetypes",
      entity: {
        id: `archetype.${normalizeTag(record.key ?? record.displayName)}`,
        name: record.displayName,
        tags: normalizeTags(record.tags),
        preferredStats: normalizeTags(record.preferredStats),
        forbiddenStats: normalizeTags(record.forbiddenStats),
        budgetProfile: normalizeStage(record.budgetProfile)
      }
    };
  }

  return null;
}

function normalizeSlotRequirements(requirements = {}) {
  return {
    requiresAllTags: normalizeTags(requirements.requiresAllTags),
    requiresAnyTags: normalizeTags(requirements.requiresAnyTags),
    forbiddenTags: normalizeTags(requirements.forbiddenTags)
  };
}

function normalizeModifierRefs(modifiers = []) {
  return modifiers.map((modifier) => modifier.startsWith("mod.") ? modifier : `mod.${normalizeTag(modifier)}`);
}

export function toPatchSnapshot(normalizedData) {
  const entities = [
    ...(normalizedData.skills ?? []).map((entity) => snapshotEntity("skill", entity)),
    ...(normalizedData.supportGems ?? []).map((entity) => snapshotEntity("supportGem", entity)),
    ...(normalizedData.lineageSupportGems ?? []).map((entity) => snapshotEntity("lineageSupportGem", entity)),
    ...(normalizedData.uniqueItems ?? []).map((entity) => snapshotEntity("uniqueItem", entity)),
    ...(normalizedData.uniqueJewels ?? []).map((entity) => snapshotEntity("uniqueJewel", entity)),
    ...(normalizedData.modifiers ?? []).map((entity) => snapshotEntity("modifier", entity))
  ];

  return {
    version: normalizedData.version ?? "unknown",
    entities
  };
}

function snapshotEntity(type, entity) {
  return {
    id: entity.id,
    type,
    name: entity.name ?? entity.text,
    tags: entity.tags ?? [],
    value: entity.value ?? null
  };
}
