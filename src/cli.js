#!/usr/bin/env node
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { loadJson } from "./data/loadJson.js";
import { mergeGameData } from "./data/mergeGameData.js";
import { formatRecommendation } from "./format/pretty.js";
import { normalizeRawData, toPatchSnapshot } from "./data/normalize.js";
import { validateGameData } from "./data/validateGameData.js";
import { recommendBuild } from "./generator/recommendationEngine.js";
import { affectedArchetypes, diffSnapshots, summarizePatchImpact } from "./patch/diffEngine.js";

const DEFAULT_DATA_PATH = "data/fixtures/game-data.json";

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "recommend") {
    await recommend(args);
    return;
  }

  if (command === "diff") {
    await diff(args);
    return;
  }

  if (command === "normalize") {
    await normalize(args[0]);
    return;
  }

  if (command === "import") {
    await importData(args[0], args[1]);
    return;
  }

  if (command === "validate") {
    await validate(args[0]);
    return;
  }

  if (command === "merge") {
    await merge(args);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

async function recommend(args) {
  const { values, options } = parseArgs(args);
  const input = values.join(" ");
  if (!input) {
    throw new Error("Missing build request. Example: node src/cli.js recommend \"fire ignite spell starter\"");
  }

  const gameData = await loadJson(resolve(options.data ?? DEFAULT_DATA_PATH));
  const result = recommendBuild(input, gameData);

  if (options.format === "pretty" || options.pretty) {
    console.log(formatRecommendation(result));
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

async function diff(args) {
  const { values, options } = parseArgs(args);
  const [previousPath, nextPath] = values;
  if (!previousPath || !nextPath) {
    throw new Error("Missing snapshot paths. Example: node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json");
  }

  const [previousSnapshot, nextSnapshot, gameData] = await Promise.all([
    loadJson(resolve(previousPath)),
    loadJson(resolve(nextPath)),
    loadJson(resolve(options.data ?? DEFAULT_DATA_PATH))
  ]);

  const patchDiff = diffSnapshots(previousSnapshot, nextSnapshot);
  const result = {
    ...patchDiff,
    affectedArchetypes: affectedArchetypes(patchDiff, gameData.archetypes ?? []),
    summary: summarizePatchImpact(patchDiff, gameData.archetypes ?? [])
  };

  console.log(JSON.stringify(result, null, 2));
}

async function normalize(rawPath) {
  if (!rawPath) {
    throw new Error("Missing raw source path. Example: node src/cli.js normalize data/raw/sample-source.json");
  }

  const rawSource = await loadJson(resolve(rawPath));
  const normalized = normalizeRawData(rawSource);

  console.log(JSON.stringify({
    normalized,
    patchSnapshot: toPatchSnapshot(normalized)
  }, null, 2));
}

async function importData(rawPath, outPath = "data/normalized/imported-game-data.json") {
  if (!rawPath) {
    throw new Error("Missing raw source path. Example: node src/cli.js import data/raw/sample-source.json");
  }

  const rawSource = await loadJson(resolve(rawPath));
  const normalized = normalizeRawData(rawSource);
  const destination = resolve(outPath);
  await mkdir(resolvePathDirectory(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  console.log(`Imported ${rawPath} -> ${outPath}`);
}

async function validate(path = DEFAULT_DATA_PATH) {
  const gameData = await loadJson(resolve(path));
  const report = validateGameData(gameData);

  console.log(formatValidationReport(report, path));
  if (!report.valid) {
    process.exitCode = 1;
  }
}

async function merge(args) {
  const { values, options } = parseArgs(args);
  const [basePath, packPath, outPath] = values;

  if (!basePath || !packPath || !outPath) {
    throw new Error("Missing merge paths. Example: node src/cli.js merge data/fixtures/game-data.json data/packs/curated-starter-pack.json data/merged/game-data.json");
  }

  const [baseData, rawPack] = await Promise.all([
    loadJson(resolve(basePath)),
    loadJson(resolve(packPath))
  ]);
  const incomingData = normalizeRawData(rawPack);
  const mergeResult = mergeGameData(baseData, incomingData, { strategy: options.strategy ?? "error" });

  if (!mergeResult.ok) {
    console.log(formatMergeReport(mergeResult.report));
    throw new Error("Merge conflicts detected. Use --strategy skip or --strategy replace.");
  }

  const validation = validateGameData(mergeResult.merged);
  if (!validation.valid) {
    console.log(formatValidationReport(validation, outPath));
    throw new Error("Merged data failed validation.");
  }

  const destination = resolve(outPath);
  await mkdir(resolvePathDirectory(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(mergeResult.merged, null, 2)}\n`, "utf8");

  console.log(formatMergeReport(mergeResult.report));
  console.log(formatValidationReport(validation, outPath));
  console.log(`Merged ${packPath} -> ${outPath}`);
}

function formatValidationReport(report, path) {
  const lines = [];
  lines.push(`Validation: ${path}`);
  lines.push(report.valid ? "Status: valid" : "Status: invalid");
  lines.push(`Errors: ${report.errors.length}`);
  lines.push(`Warnings: ${report.warnings.length}`);

  for (const error of report.errors) {
    lines.push(`ERROR ${error.code}: ${error.message}`);
  }

  for (const warning of report.warnings) {
    lines.push(`WARN ${warning.code}: ${warning.message}`);
  }

  return lines.join("\n");
}

function formatMergeReport(report) {
  return [
    "Merge report:",
    `Added: ${report.added.length}`,
    `Replaced: ${report.replaced.length}`,
    `Skipped: ${report.skipped.length}`,
    `Conflicts: ${report.conflicts.length}`,
    ...report.conflicts.map((conflict) => `CONFLICT ${conflict.collection}.${conflict.id}`)
  ].join("\n");
}

function resolvePathDirectory(path) {
  return path.replace(/[\\/][^\\/]+$/u, "");
}

function parseArgs(args) {
  const values = [];
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--pretty") {
      options.pretty = true;
      continue;
    }

    if (arg === "--format") {
      options.format = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--data") {
      options.data = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--strategy") {
      options.strategy = args[index + 1];
      index += 1;
      continue;
    }

    values.push(arg);
  }

  return { values, options };
}

function printUsage() {
  console.log(`Usage:
  node src/cli.js recommend "fire ignite spell starter balanced"
  node src/cli.js recommend "poison projectile bow mid damage" --format pretty
  node src/cli.js recommend "cold projectile bow mid damage" --data data/merged/game-data.json --format pretty
  node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json
  node src/cli.js normalize data/raw/sample-source.json
  node src/cli.js import data/raw/sample-source.json
  node src/cli.js validate data/fixtures/game-data.json
  node src/cli.js merge data/fixtures/game-data.json data/packs/curated-starter-pack.json data/merged/game-data.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
