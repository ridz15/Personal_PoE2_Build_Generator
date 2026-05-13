const form = document.querySelector("#build-form");
const input = document.querySelector("#query");
const summary = document.querySelector("#summary");
const results = document.querySelector("#results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await generate(input.value);
});

for (const button of document.querySelectorAll("[data-query]")) {
  button.addEventListener("click", async () => {
    input.value = button.dataset.query;
    await generate(input.value);
  });
}

await generate(input.value);

async function generate(query) {
  summary.innerHTML = panel("Working", "Generating recommendation...");
  results.innerHTML = "";

  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query })
  });

  const payload = await response.json();
  if (!response.ok) {
    summary.innerHTML = panel("Error", payload.error ?? "Unable to generate build.");
    return;
  }

  render(payload);
}

function render(result) {
  summary.innerHTML = [
    panel("Primary Skill", firstName(result.skills)),
    panel("Archetype", firstName(result.archetypes)),
    panel("Budget", result.request.budget),
    panel("Goal", result.request.goal)
  ].join("");

  results.innerHTML = [
    section("Support Gems", result.supportGems),
    section("Lineage Support", result.lineageSupportGems),
    section("Unique Items", result.uniqueItems),
    section("Unique Jewels", result.uniqueJewels),
    section("Cultivated Targets", result.cultivatedUpgrades),
    progression(result.progressionTiers)
  ].join("");
}

function section(title, items = []) {
  if (items.length === 0) return "";
  return `<article class="card"><h3>${escapeHtml(title)}</h3><div class="card-list">${items.map(item).join("")}</div></article>`;
}

function progression(tiers) {
  if (!tiers) return "";
  const rows = Object.values(tiers)
    .map((tier) => {
      const names = [
        ...tier.skills,
        ...tier.supportGems,
        ...tier.lineageSupportGems,
        ...tier.uniqueItems,
        ...tier.uniqueJewels,
        ...tier.cultivatedUpgrades
      ].map((candidate) => candidate.name);
      return names.length > 0 ? `<div class="item"><strong>${escapeHtml(tier.stage)}</strong><span class="meta">${escapeHtml(names.join(", "))}</span></div>` : "";
    })
    .join("");

  return rows ? `<article class="card"><h3>Progression</h3><div class="card-list">${rows}</div></article>` : "";
}

function item(candidate) {
  const score = candidate.recommendation?.score ?? 0;
  const upgrade = candidate.recommendation?.allowedForBudget === false ? " upgrade" : "";
  const reasons = (candidate.recommendation?.reasons ?? []).slice(0, 3).join("; ");
  const mods = (candidate.recommendation?.matchedModifiers ?? []).map((modifier) => modifier.text).join(", ");
  const detail = [reasons, mods ? `Mods: ${mods}` : ""].filter(Boolean).join(" | ");

  return `<div class="item"><strong>${escapeHtml(candidate.name)}</strong><span class="meta${upgrade}">Score ${score}${upgrade ? " | upgrade later" : ""}</span><span class="meta">${escapeHtml(detail)}</span></div>`;
}

function panel(title, body) {
  return `<article class="panel"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body || "None")}</p></article>`;
}

function firstName(items = []) {
  return items[0]?.name ?? "None";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

