# Personal PoE2 Build Generator

Patch-aware build recommendation engine for personal Path of Exile 2 planning.

This repository starts as a dependency-free JavaScript prototype. The first goal is not to replace Path of Building style calculations. The first goal is to create a small, inspectable recommendation engine that can:

- map a build request to scaling tags,
- recommend skill, support, unique, unique jewel, and lineage support candidates,
- explain why each candidate matches,
- diff game-data snapshots after patches,
- identify archetypes affected by changed or newly added data.

## Quick Start

```powershell
node src/cli.js recommend "fire ignite spell starter balanced"
node src/cli.js recommend "poison projectile bow mid damage" --format pretty
node src/cli.js merge data/fixtures/game-data.json data/packs/curated-starter-pack.json data/merged/game-data.json
node src/cli.js recommend "cold projectile bow mid damage" --data data/merged/game-data.json --format pretty
node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json
node src/cli.js normalize data/raw/sample-source.json
node src/cli.js import data/raw/sample-source.json
node src/cli.js validate data/fixtures/game-data.json
node src/cli.js normalize data/packs/curated-starter-pack.json
node src/server.js
node --test
```

## Current Scope

The current data is intentionally tiny fixture data. It exists to prove the architecture:

- skills
- support gems
- lineage support gems
- unique items
- unique jewels
- modifiers
- archetypes

Real PoE2 data can be imported later through a normalizer layer without changing the generator API.

## Local UI

Run:

```powershell
node src/server.js
```

Then open:

```text
http://localhost:4173
```

## Data Import Direction

The prototype includes a tiny raw-source format in `data/raw/sample-source.json` and a normalizer in `src/data/normalize.js`.

The intended long-term flow is:

```text
PoE2 source data or curated patch scrape
  -> raw records
  -> normalized generator data
  -> patch snapshot
  -> diff and affected archetype detection
```

## Validation

Run:

```powershell
node src/cli.js validate data/fixtures/game-data.json
```

Validation catches missing ids, duplicate ids, broken modifier references, invalid stages, loose support compatibility rules, invalid slot requirement shapes, and uncommon archetype tags.

## Merging Data Packs

Run:

```powershell
node src/cli.js merge data/fixtures/game-data.json data/packs/curated-starter-pack.json data/merged/game-data.json
node src/cli.js recommend "cold projectile bow mid damage" --data data/merged/game-data.json --format pretty
```

Conflict strategies:

```powershell
node src/cli.js merge base.json pack.json out.json --strategy skip
node src/cli.js merge base.json pack.json out.json --strategy replace
```

To run the UI with merged data:

```powershell
$env:DATA_PATH="data/merged/game-data.json"; node src/server.js
```
