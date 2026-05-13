# Architecture

## Goal

Create a patch-aware recommendation engine that can grow toward a PoB2 fork integration.

The generator should treat game data as normalized records. It should not hardcode complete builds. It should score candidates by tags, mechanics, restrictions, budget, and progression stage.

## Flow

```text
Build request
  -> request parser
  -> archetype matcher
  -> candidate builder
  -> scoring engine
  -> recommendation result
```

Patch updates use a separate path:

```text
Old snapshot + new snapshot
  -> diff engine
  -> changed entities
  -> affected scaling tags
  -> affected archetypes
```

## Future PoB2 Integration Points

When this becomes a real PoB2 fork module, look for:

- skill and support gem data,
- item and modifier data,
- passive tree data,
- build model/import-export code,
- DPS calculation entry points,
- defense/EHP calculation entry points,
- reservation/spirit calculation entry points,
- UI panel or sidebar registration.

The generator should create candidate build states, then ask the existing calculator to validate DPS, defense, and resource constraints.

