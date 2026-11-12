# PostgreSQL data model and sizes

## Core counts from the measured instance

| Table | Schema | Measured rows | Synthetic profile rows | Important relations |
|---|---|---:|---:|---|
| `targetAttackPriority` (TAP) | `replications` | 213,445 | 213,445 | main demand row, legacyRafiki unique, targetId, objectiveId, sectorId |
| `operationalPlan` | `replications` | 14,372 | 14,372 | array `attackDemandIds`, `warriorMissionIds` |
| `warriorMission` | `replications` | 6,641 | 6,641 | mission names |
| `target` | `replications` | 352,756 | 352,756 | country, code, point/entity |
| `area` | `replications` | 422,875 | 422,875 | sector name |
| `gdsObjective` | `replications` | 56,334 | 56,334 | glxId join, attackPlan/mission |
| `missionOrder` | `replications` | 377,139 | 377,139 | connectedMoIds array, large entity/TOAST |
| `component` | `replications` | 644,138 | 644,138 | target component |
| `gdsMission` | `replications` | approximately 23k in screenshot | 23,148 | mission entity |
| `gdsConnectionData` | `replications` | not shown as precise count | 500 | HQ selection arrays; synthetic size inferred |
| `gdsAttackPlan` | `replications` | not shown as precise count | 23,500 | objective attackPlanId; synthetic size inferred |
| `aggregatedAmmunition` | `global` | several hundred; profile not explicit | 528 | jsonb ammunition IDs |
| `targetAttackPriorityPolicy`, `score` | `replications` | not readable | inferred | filter subqueries |

## Exact array cardinality generator

- `attackDemandIds`: **145,839** members over 14,372 plans. 4,990 have empty arrays, 9,382 nonempty. Seven largest arrays: 2,087; 1,712; 1,698; 1,546; 1,535; 1,464; 1,092. Remaining 9,375 plans have 14 or 15 entries, yielding the exact member count.
- `attackDemandIds` distinct values: **86,281**. Synthetic `legacyRafiki` uses deterministic `D-000000001` identifiers; real system appeared to use UUID/string keys. These memberships can appear under multiple plans.
- `warriorMissionIds`: **15,050** members, with **13,766** plans holding at least one; most hold one.
- TAP `legacyRafiki` unique: **213,445**. `targetId` populated for 209,506 rows; ~3,939 null; ~133,820 distinct targets among populated IDs were measured in the source (the generated distribution does not match the latter count exactly). `objectiveId` nonnull in 158,773 rows and 8,694 distinct objective IDs; `sectorId` nonnull in 53,257 rows, 82 distinct sectors.
- `entity` JSONB on TAP: measured ~359 MB total (average ~1,767 B per row; largest ~16,510 B). The seeded `entity.description` is **repeat-compressible**; logical JSON string length is larger, but Postgres TOAST and wire/compression sizes will differ. Do not claim exact heap/TOAST replication.
- Other observed TOAST-heavy payloads: target entity ~1.08 GB; mission-order entity arrays ~1.9 GB. Default seed is smaller. Large bytes must be separately inflated before testing disk/GC behavior.
- Physical indexes on TAP: measured ~48 indexes totaling ~388MB with duplicate legacy+generated single-field indexes (roughly ~190 MB redundant). Lab creates representative duplicates; it does **not** fake exact 48 index definitions. Plan GIN index on `attackDemandIds` ~12 MB in observed DB; base subquery expanding entire plan table does not use this index.

## Exact join path — why it is expensive

```
TAP.legacyRafiki
  -> [ALL plans] unnest(operationalPlan.attackDemandIds) [145,839 occurrences]
  -> SELECT DISTINCT ON(plan.id, demand_ref) -> sorting, spills at work_mem=4MB
  -> LEFT JOIN TAP legacyRafiki
  -> LATERAL UNNEST matchedPlan.warriorMissionIds
  -> LEFT JOIN warriorMission
  -> GROUP BY TAP.id + string_agg(DISTINCT ...)
```

The original plan fan-out runs before selection is applied to the outer demand rows. Its measured standalone runtime ~307 ms and 12 MB temporary disk. Overall query performance depends on plan count and selection breadth; synthetic benchmarks must be compared within the same local run, not against production wall-clock numbers.

## Why no normalized FK tables?

The original contract uses `varchar[]` and JSONB arrays. Creating junction tables as the default would solve the wrong investigation: the whole point is to see the original fan-out and measure a candidate. A normalized `plan_attack_demand` junction table can be added later to a **separate** branch with event-sync maintenance and migration cost accounted for. Existing schema must remain as the baseline.

## Parameter inventory

The common `BoardQuery` includes selected demand, operational plan, warrior mission, attack plan, mission, objective, mission order and connection-data IDs; campaign/score, target/country, sector, attack status, factor, policy, partner, and group-by (up to 19). The real repository has more flags; add them only with source evidence and golden cases.
