import { scoreCandidate } from "../scoring/tagScore.js";

export function recommendCultivatedUpgrades(request, archetypes, modifiers = []) {
  return modifiers
    .filter((modifier) => (modifier.appliesTo ?? []).includes("cultivated_unique") || (modifier.tags ?? []).includes("cultivated"))
    .map((modifier) => {
      const candidate = {
        id: `cultivated.${modifier.id}`,
        name: modifier.text,
        stage: "aspirational",
        tags: [...(modifier.tags ?? []), modifier.statKey].filter(Boolean),
        modifiers: [modifier.id],
        roles: ["cultivated", "aspirational_upgrade"],
        source: "Vaal Cultivation Orb"
      };
      const recommendation = scoreCandidate(request, archetypes, candidate);

      return {
        ...candidate,
        modifier,
        recommendation: {
          ...recommendation,
          reasons: [
            ...recommendation.reasons,
            "requires cultivated unique outcome",
            "aspirational upgrade target"
          ]
        }
      };
    })
    .filter((candidate) => candidate.recommendation.score > 0)
    .sort((left, right) => right.recommendation.score - left.recommendation.score)
    .slice(0, 5);
}

