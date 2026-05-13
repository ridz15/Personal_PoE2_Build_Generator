function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function indexModifiers(modifiers = []) {
  return new Map(modifiers.map((modifier) => [modifier.id, modifier]));
}

export function resolveItemModifiers(item, modifierIndex) {
  return (item.modifiers ?? [])
    .map((modifierId) => modifierIndex.get(modifierId))
    .filter(Boolean);
}

export function getItemSynergyTags(item, modifierIndex) {
  const modifiers = resolveItemModifiers(item, modifierIndex);

  return unique([
    ...(item.tags ?? []),
    ...(item.roles ?? []),
    ...(item.buildEnablers ?? []),
    ...(item.treeInteractions ?? []),
    ...modifiers.flatMap((modifier) => modifier.tags ?? []),
    ...modifiers.map((modifier) => modifier.statKey)
  ]);
}

export function getSlotPriority(item, request, archetypes = []) {
  const preferred = new Set(archetypes.flatMap((archetype) => archetype.preferredStats ?? []));
  const requestTags = new Set(request.tags ?? []);

  if (item.slot === "quiver" && (preferred.has("bow") || requestTags.has("bow") || requestTags.has("projectile"))) {
    return 18;
  }

  if (item.slot === "ring" && (preferred.has("ailment_magnitude") || requestTags.has("ignite") || requestTags.has("poison"))) {
    return 10;
  }

  if ((item.tags ?? []).includes("jewel") && (request.budget === "endgame" || request.budget === "aspirational")) {
    return 12;
  }

  return 0;
}

export function evaluateItemSlotCompatibility(item, request, archetypes = [], skills = []) {
  const requirements = item.slotRequirements ?? {};
  const availableTags = unique([
    ...(request.tags ?? []),
    ...archetypes.flatMap((archetype) => archetype.tags ?? []),
    ...archetypes.flatMap((archetype) => archetype.preferredStats ?? []),
    ...skills.flatMap((skill) => skill.tags ?? []),
    ...skills.flatMap((skill) => skill.mechanics ?? []),
    ...skills.flatMap((skill) => skill.scalingTags ?? [])
  ]);
  const requiresAll = requirements.requiresAllTags ?? [];
  const requiresAny = requirements.requiresAnyTags ?? [];
  const forbidden = requirements.forbiddenTags ?? [];
  const missingAll = requiresAll.filter((tag) => !availableTags.includes(tag));
  const matchedAny = requiresAny.filter((tag) => availableTags.includes(tag));
  const blockedTags = forbidden.filter((tag) => availableTags.includes(tag));
  const isCompatible =
    missingAll.length === 0 &&
    (requiresAny.length === 0 || matchedAny.length > 0) &&
    blockedTags.length === 0;

  return {
    isCompatible,
    matchedAny,
    missingAll,
    blockedTags,
    score: matchedAny.length * 10 + requiresAll.length * 8 - missingAll.length * 30 - blockedTags.length * 45,
    reasons: unique([
      ...matchedAny.map((tag) => `slot matches ${tag}`),
      ...requiresAll.map((tag) => `slot requires ${tag}`),
      ...missingAll.map((tag) => `slot missing required tag ${tag}`),
      ...blockedTags.map((tag) => `slot blocked by ${tag}`),
      isCompatible ? "passes slot compatibility" : "fails slot compatibility"
    ])
  };
}
