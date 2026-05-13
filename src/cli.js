#!/usr/bin/env node
import { resolve } from "node:path";
import { loadJson } from "./data/loadJson.js";
import { normalizeRawData, toPatchSnapshot } from "./data/normalize.js";
import { recommendBuild } from "./generator/recommendationEngine.js";
import { affectedArchetypes, diffSnapshots, summarizePatchImpact } from "./patch/diffEngine.js";

const DEFAULT_DATA_PATH = "data/fixtures/game-data.json";

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "recommend") {
    await recommend(args.join(" "));
    return;
  }

  if (command === "diff") {
    await diff(args[0], args[1]);
    return;
  }

  if (command === "normalize") {
    await normalize(args[0]);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

async function recommend(input) {
  if (!input) {
    throw new Error("Missing build request. Example: node src/cli.js recommend \"fire ignite spell starter\"");
  }

  const gameData = await loadJson(resolve(DEFAULT_DATA_PATH));
  const result = recommendBuild(input, gameData);

  console.log(JSON.stringify(result, null, 2));
}

async function diff(previousPath, nextPath) {
  if (!previousPath || !nextPath) {
    throw new Error("Missing snapshot paths. Example: node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json");
  }

  const [previousSnapshot, nextSnapshot, gameData] = await Promise.all([
    loadJson(resolve(previousPath)),
    loadJson(resolve(nextPath)),
    loadJson(resolve(DEFAULT_DATA_PATH))
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

function printUsage() {
  console.log(`Usage:
  node src/cli.js recommend "fire ignite spell starter balanced"
  node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json
  node src/cli.js normalize data/raw/sample-source.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
