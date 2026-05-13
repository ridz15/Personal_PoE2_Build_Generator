const BUDGET_WORDS = new Set(["starter", "mid", "endgame", "aspirational"]);
const GOAL_WORDS = new Set(["damage", "dps", "tanky", "balanced"]);

const TOKEN_ALIASES = {
  ignite: ["ignite", "fire", "ailment_magnitude"],
  poison: ["poison", "chaos", "ailment_magnitude"],
  dot: ["damage_over_time"],
  projectile: ["projectile"],
  bow: ["bow", "projectile", "attack"],
  spell: ["spell"],
  attack: ["attack"],
  melee: ["melee"],
  totem: ["totem"],
  minion: ["minion"],
  fire: ["fire"],
  cold: ["cold"],
  lightning: ["lightning"],
  chaos: ["chaos"],
  physical: ["physical"]
};

export function parseBuildRequest(input) {
  const tokens = String(input)
    .toLowerCase()
    .split(/[^a-z0-9_+]+/u)
    .filter(Boolean);

  const tags = new Set();
  let budget = "starter";
  let goal = "balanced";

  for (const token of tokens) {
    if (BUDGET_WORDS.has(token)) {
      budget = token;
      continue;
    }

    if (GOAL_WORDS.has(token)) {
      goal = token === "dps" ? "damage" : token;
      continue;
    }

    for (const tag of TOKEN_ALIASES[token] ?? [token]) {
      tags.add(tag);
    }
  }

  return {
    raw: input,
    tokens,
    tags: [...tags],
    budget,
    goal
  };
}

