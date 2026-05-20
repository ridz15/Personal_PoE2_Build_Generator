const COLLECTIONS = [
  "skills",
  "supportGems",
  "lineageSupportGems",
  "uniqueItems",
  "uniqueJewels",
  "modifiers",
  "archetypes"
];

export function mergeGameData(baseData, incomingData, options = {}) {
  const strategy = options.strategy ?? "error";
  const merged = structuredClone(baseData);
  const report = {
    added: [],
    replaced: [],
    skipped: [],
    conflicts: []
  };

  for (const collection of COLLECTIONS) {
    merged[collection] ??= [];
    const existing = new Map(merged[collection].map((entity, index) => [entity.id, { entity, index }]));

    for (const incoming of incomingData[collection] ?? []) {
      const match = existing.get(incoming.id);

      if (!match) {
        merged[collection].push(incoming);
        existing.set(incoming.id, { entity: incoming, index: merged[collection].length - 1 });
        report.added.push({ collection, id: incoming.id });
        continue;
      }

      if (strategy === "replace") {
        merged[collection][match.index] = incoming;
        report.replaced.push({ collection, id: incoming.id });
        continue;
      }

      if (strategy === "skip") {
        report.skipped.push({ collection, id: incoming.id });
        continue;
      }

      report.conflicts.push({ collection, id: incoming.id });
    }
  }

  if (report.conflicts.length > 0 && strategy === "error") {
    return {
      merged: null,
      report,
      ok: false
    };
  }

  return {
    merged,
    report,
    ok: true
  };
}

