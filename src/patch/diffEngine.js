function indexById(snapshot) {
  return new Map((snapshot.entities ?? []).map((entity) => [entity.id, entity]));
}

function changedFields(before, after) {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [];

  for (const field of fields) {
    const beforeValue = JSON.stringify(before[field] ?? null);
    const afterValue = JSON.stringify(after[field] ?? null);

    if (beforeValue !== afterValue) {
      changed.push({
        field,
        before: before[field] ?? null,
        after: after[field] ?? null
      });
    }
  }

  return changed;
}

export function diffSnapshots(previousSnapshot, nextSnapshot) {
  const previous = indexById(previousSnapshot);
  const next = indexById(nextSnapshot);
  const added = [];
  const removed = [];
  const changed = [];
  const affectedTags = new Set();

  for (const [id, entity] of next.entries()) {
    if (!previous.has(id)) {
      added.push(entity);
      for (const tag of entity.tags ?? []) affectedTags.add(tag);
      continue;
    }

    const fields = changedFields(previous.get(id), entity);
    if (fields.length > 0) {
      changed.push({ id, type: entity.type, name: entity.name, fields, tags: entity.tags ?? [] });
      for (const tag of entity.tags ?? []) affectedTags.add(tag);
    }
  }

  for (const [id, entity] of previous.entries()) {
    if (!next.has(id)) {
      removed.push(entity);
      for (const tag of entity.tags ?? []) affectedTags.add(tag);
    }
  }

  return {
    previousVersion: previousSnapshot.version ?? "unknown",
    nextVersion: nextSnapshot.version ?? "unknown",
    added,
    removed,
    changed,
    affectedTags: [...affectedTags].sort()
  };
}

export function affectedArchetypes(diff, archetypes) {
  const affected = new Set(diff.affectedTags ?? []);

  return archetypes
    .map((archetype) => {
      const tags = new Set([...(archetype.tags ?? []), ...(archetype.preferredStats ?? [])]);
      const matches = [...affected].filter((tag) => tags.has(tag));

      return {
        id: archetype.id,
        name: archetype.name,
        affectedTags: matches
      };
    })
    .filter((archetype) => archetype.affectedTags.length > 0);
}

export function summarizePatchImpact(diff, archetypes = []) {
  const affected = affectedArchetypes(diff, archetypes);
  const lines = [];

  if (diff.added.length > 0) {
    lines.push(`${diff.added.length} new entities added`);
  }

  if (diff.changed.length > 0) {
    lines.push(`${diff.changed.length} entities changed`);
  }

  if (diff.removed.length > 0) {
    lines.push(`${diff.removed.length} entities removed`);
  }

  if (affected.length > 0) {
    lines.push(`Affected archetypes: ${affected.map((archetype) => archetype.name).join(", ")}`);
  }

  return {
    severity: estimateSeverity(diff, affected),
    lines,
    affectedArchetypes: affected
  };
}

function estimateSeverity(diff, affected) {
  if (diff.removed.length > 0) return "high";
  if (diff.changed.some((change) => change.fields.some((field) => field.field === "tags"))) return "high";
  if (affected.length >= 2 || diff.added.some((entity) => entity.type === "lineageSupportGem")) return "medium";
  if (diff.changed.length > 0 || diff.added.length > 0) return "low";
  return "none";
}
