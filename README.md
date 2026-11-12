# Allocation Board — Full Reviewable Reconstruction

**Executable NestJS + Knex + PostgreSQL/PostGIS + Angular 20 + NgRx + GraphQL subscriptions** monorepo, with two query variants, synthetic data generation, profiling scripts, and original-bottleneck-shaped implementation.

> **Not the original proprietary repository.** There is no access to unseen source or actual DB rows. The photographed pipeline and measured data characteristics have been rebuilt; missing code and table columns were independently implemented and labeled. Excludes the pagination PR completely.

## Fast start (Windows with Docker Desktop or macOS/Linux with Docker)

Prerequisites: Node.js 22+, npm, Docker Desktop / Docker Engine with Compose, and **several GB of free disk for full profile**. Synthetic database is bound to `127.0.0.1:55432` and the API to `127.0.0.1:4300`.

```sh
npm install
npm run build:api
npm run db:up
npm run db:seed:smoke
npm run dev:api                   # terminal 1: localhost:4300/graphql
npm run dev:client                # terminal 2: localhost:4200
```

For exact photographed **row counts and operational-plan fan-out**, stop active queries, then run:

```sh
npm run db:seed:profile            # truncates LOCAL synthetic tables (can be slow)
npm run db:stats
npm run db:explain                 # EXPLAIN ANALYZE on LOCAL synthetic DB only
npm run bench:scenarios
npm run bench:parity
CLIENTS=5 BOARDS_PER_CLIENT=3 npm run load
```

Before running `db:seed:profile`, verify that Docker is pointing at the local compose instance and that disk capacity is sufficient. The PostGIS database seed inserts >2 million synthetic rows; row counts and relationships are more important than raw database sizes. Optional `db:inflate` generates multi-GB JSONB weights if heap/TOAST/GC are the explicit study goal.

## Study the real photographed problem

- `apps/allocation-board-search/src/infra/repository/attack-demand-tree-repository.service.ts`: finder-base OR selections, shared filters, query builder, group by, filter-option fan-out, full query materialization, 5,000 display cutoff.
- `apps/allocation-board-search/src/infra/repository/group-by-joins.ts`: full-table plan UNNEST + `DISTINCT ON` + LATERAL join; side-by-side optional GIN containment candidate.
- `apps/allocation-board-search/src/infra/repository/group-by.ts`: 19 options, `string_agg(DISTINCT ...)`, scalar groupings, and selected ID filter.
- `apps/allocation-board-search/src/infra/repository/build-grouped-results-tree.ts`: multi-level grouped tree and shared leaf identity.
- `apps/allocation-board-search/src/domain/use-cases/allocation-board-search-use-case.ts`: per-board GraphQL subscriptions, repeated search, concurrency cap and cancellation.
- `apps/allocation-board-search/src/infra/entity-change/entity-change-listener.service.ts`: simulated replication signal and per-board refetch.
- `apps/client/src/app`: standalone Angular 20, NgRx reducers/actions/effects, Apollo cache-free GraphQL WebSocket, CDK virtual scroll, map/eye mock.
- `packages/shared/src/legacy-algorithms.ts`: deliberately expensive client calculations vs optimized traversal; original fragments live under `reference/photographed-excerpts/apps/client/...`.
- `database/schema`, `database/seed`, `database/diagnostics`: PostgreSQL 14/PostGIS schema, FK vs array relationships, precise synthetic fan-out, EXPLAIN, index and connection diagnostics.
- `scripts/scenario.mjs`, `scripts/compare.mjs`, `scripts/load.mjs`: end-to-end wall time, full tree parity and multi-user load.

## Example API

```sh
curl -s http://127.0.0.1:4300/api/health
curl -s http://127.0.0.1:4300/api/metrics
curl -X POST http://127.0.0.1:4300/api/board/search \
 -H 'content-type: application/json' \
 -d '{"boardId":"test","allocationBoardFolderId":"folder-test","groupBy":["OPERATIONAL_PLAN","TARGET_COUNTRY"],"scoreFilters":{"campaignId":"137"}}'
```

GraphQL:

```graphql
query Search($input: JSON!) {
  searchBoard(input: $input) { fullQueryAttackDemandCount tree filters timings }
}
subscription Live($input: JSON!) {
  boardUpdates(input: $input) { fullQueryAttackDemandCount tree filters timings }
}
```

Only set `ALLOW_LOCAL_EXPLAIN=true` or `ENABLE_LOCAL_MUTATIONS=true` when investigating **isolated, disposable, local data**. The experimental mutation endpoint must not be enabled on a deployed service.

## Verification performed in file-generation environment

`npm test` passes eight dependency-free structural/profile tests. `node scripts/check.mjs` transpile-checks all included TypeScript sources for syntax. **A complete npm install, Angular/NestJS type-check, database seed, GraphQL integration test and measured performance run could not be executed here because Docker and package-download access were unavailable.** Treat them as mandatory local acceptance gates, not as already passed.

Start with `docs/RECONSTRUCTION_PROVENANCE.md` for the strict observed/inferred distinction, `docs/DATABASE_RELATIONS_AND_SHAPES.md` for all sizes/joins, and `docs/FLOWS_AND_REVIEW.md` for complete flow and investigation order.

## Extra investigation commands

```sh
npm run benchmark:client                    # shared-DAG counts: baseline O(N²) vs candidate
ALLOW_LOCAL_INFLATE=YES INFLATE_ROWS=10000 npm run db:inflate
EXPLAIN_SUBSET=18000 npm run db:explain
```

**Important correction:** the full SQL result is transferred from PostgreSQL to the NestJS process; **the response to the browser contains the server-built tree from the first 5,000 rows**, not necessarily the complete 60,000 SQL rows. This distinction matters for locating the payload bottleneck. The full count still forces the server to materialize all matched SQL rows in the reconstructed baseline. See `docs/FLOWS_AND_REVIEW.md`.
