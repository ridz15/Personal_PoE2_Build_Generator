export function formatRecommendation(result) {
  const lines = [];

  lines.push(`Build Request: ${result.request.raw}`);
  lines.push(`Budget: ${result.request.budget} | Goal: ${result.request.goal}`);
  lines.push("");
  appendSection(lines, "Matched Archetype", result.archetypes, formatSimpleCandidate);
  appendSection(lines, "Primary Skill", result.skills.slice(0, 1), formatSimpleCandidate);
  appendSection(lines, "Support Gems", result.supportGems, formatSimpleCandidate);
  appendSection(lines, "Lineage Support", result.lineageSupportGems, formatSimpleCandidate);
  appendSection(lines, "Unique Items", result.uniqueItems, formatItemCandidate);
  appendSection(lines, "Unique Jewels", result.uniqueJewels, formatItemCandidate);
  appendSection(lines, "Cultivated Targets", result.cultivatedUpgrades, formatCultivatedCandidate);
  appendStatPriorities(lines, result.statPriorities);
  appendProgression(lines, result.progressionTiers);

  return lines.join("\n");
}

function appendSection(lines, title, candidates = [], formatter) {
  if (!candidates || candidates.length === 0) return;
  lines.push(title);
  for (const candidate of candidates) {
    lines.push(...formatter(candidate).map((line) => `  ${line}`));
  }
  lines.push("");
}

function formatSimpleCandidate(candidate) {
  const score = candidate.recommendation?.score ?? 0;
  const reasons = (candidate.recommendation?.reasons ?? []).slice(0, 3).join("; ");
  const availability = candidate.recommendation?.allowedForBudget === false ? " (upgrade later)" : "";

  return [
    `- ${candidate.name}${availability}`,
    `  score: ${score}`,
    reasons ? `  why: ${reasons}` : null
  ].filter(Boolean);
}

function formatItemCandidate(candidate) {
  const lines = formatSimpleCandidate(candidate);
  const matchedMods = candidate.recommendation?.matchedModifiers ?? [];

  if (candidate.slot) {
    lines.splice(1, 0, `  slot: ${candidate.slot}`);
  }

  if (matchedMods.length > 0) {
    lines.push(`  matched mods: ${matchedMods.map((modifier) => modifier.text).join(", ")}`);
  }

  return lines;
}

function formatCultivatedCandidate(candidate) {
  const lines = formatSimpleCandidate(candidate);
  lines.push(`  source: ${candidate.source}`);
  return lines;
}

function appendStatPriorities(lines, priorities = []) {
  if (priorities.length === 0) return;
  lines.push("Stat Priorities");
  lines.push(`  ${priorities.slice(0, 8).map((priority) => priority.tag).join(", ")}`);
  lines.push("");
}

function appendProgression(lines, tiers) {
  if (!tiers) return;
  lines.push("Progression Tiers");
  for (const tier of Object.values(tiers)) {
    const names = [
      ...tier.skills,
      ...tier.supportGems,
      ...tier.lineageSupportGems,
      ...tier.uniqueItems,
      ...tier.uniqueJewels,
      ...tier.cultivatedUpgrades
    ].map((candidate) => candidate.name);

    if (names.length > 0) {
      lines.push(`  ${tier.stage}: ${names.slice(0, 8).join(", ")}`);
    }
  }
}

