# What is original, what is reconstructed?

This repository is a **new codebase**, not a recovered copy of the user's private monorepo. The task is to reproduce its visible architecture and SQL pathology so code review, SQL experiments, and multi-user stress analysis are possible without the real system. All data is synthetic. The pagination PR is deliberately excluded. **The 5,000 cutoff remains post-query.**

## Evidence categories

**Directly observed in supplied screenshots / written investigation screenshots:** PostgreSQL 14.7; tables `replications.targetAttackPriority`, `replications.operationalPlan`, `replications.warriorMission`, `replications.target`, `replications.area`, `replications.gdsObjective`, `replications.gdsConnectionData`, `global.aggregatedAmmunition`, etc.; Knex TypeScript; full `DISTINCT ON (op.id, demand_value)` over `unnest(op.attackDemandIds)`; lateral expansion for `warriorMissionIds`, `ammunitionOperationalIds`, `connectedMoIds`; optional HQ, campaign, operational-plan and target filters; `string_agg(DISTINCT ...)`; app-side `results.slice(0, queryLimit)`; 5,000 visible limit; global eye/folder identity; GraphQL subscription, poll, change emitter, no-cache client, NgRx tree/dictionary diff, frequent recomputation.

**Measured counts in images:** 213,445 TAP rows; 14,372 op plans; 9,382 nonempty plan arrays, 4,990 empty; 145,839 attackDemandId occurrences, 86,281 distinct demand values; max plan length 2,087; 13,766 plans with warrior missions and 15,050 mission refs; 352,756 targets; 377,139 mission orders; 422,875 areas; 644,138 components; 56,334 objectives; 6,641 warrior missions; TAP entity average ~1,767 B, 359 MB measured across table; plan `attackDemandIds` query raw `EXPLAIN ANALYZE` ~307ms with 12MB disk spill and 4MB `work_mem`. More detailed measurements in `docs/DATABASE_RELATIONS_AND_SHAPES.md`.

**Reconstructed / inferred:** actual original model DTO definitions, complete SQL precedence for every filter combination, matching GDS mission join key, GraphQL provider authentication, exact map engine/effects, exact NgRx action shape, window/layout service, UI appearance, DB volumes/storage parameters, index naming, scheduler limits, event listener tick intervals, synthetic `connectionDataIds` generator and `score` coverage. These are reasonable executable implementations, not evidence of original behavior. Neither DB heap nor TOAST/index total size is byte-identical to reality.

**Duplicated source evidence:** `reference/photographed-excerpts` contains earlier transcriptions of substantial client functions. Some are not compilable on their own. No PR files or source for the excluded pagination change are mixed into the live application.

## Important known differences that require checking against real repository

1. The original screenshot includes many more parameters, schema fields and service functions than readable here. This lab exposes the major ones, but not an exhaustive, proved production clone.
2. Original Apollo `NoCache` link is represented by a *cache-free GraphQL WS transport*; there is no local result cache. This is equivalent for the measured repeated full-result processing, not a byte-identical client transport.
3. The full production data has large off-heap/TOAST and replicated entity payloads. Synthetic rows reproduce join counts but not every physical byte distribution.
4. `getSharedQuery()` operates on SQL of varying complexity; HQ `OR` selection is approximated based on the SQL photo. Multi-select semantic parity must be proven with the live checkout.
5. The source's `flatGroupBy` may have additional names/icons, `parentsIds` vs `parentIds`, and sorting details. This lab preserves the **graph** (shared leaf across multiple paths) and selected order but must not be treated as a production replacement without golden tests.
6. A few server safeguards (query concurrency cap, max board subscriptions) are intentionally added **for lab safety**; do not infer they exist in the original repo.

## Rule for future work

No statement that this code 'proves' a production regression is valid without triangulating source screenshots, actual checkout and at least one `EXPLAIN (ANALYZE, BUFFERS)` from the same dataset. The lab isolates hypotheses and supports repeatable A/B tests.
