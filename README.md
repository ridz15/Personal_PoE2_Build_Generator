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
node src/cli.js diff data/snapshots/patch-0.json data/snapshots/patch-1.json
node src/cli.js normalize data/raw/sample-source.json
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
