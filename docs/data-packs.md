# Data Packs

Data packs are curated source records that can later be normalized into generator data.

Use this flow:

```powershell
node src/cli.js normalize data/packs/curated-starter-pack.json
node src/cli.js validate data/app/base-game-data.json
```

## Record Kinds

Supported by the current normalizer:

- `active_skill`
- `support`
- `lineage_support`
- `modifier`
- `archetype`
- `unique_item`
- `unique_jewel`

Planned next:

- `item_base`
- `cultivated_modifier`

## Validation Goals

The validator checks:

- missing collections,
- duplicate ids,
- missing names,
- invalid stages,
- unique item or jewel modifier references,
- missing support compatibility rules,
- invalid slot requirement shapes,
- uncommon archetype tags.
