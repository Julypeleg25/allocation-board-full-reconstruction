# Experiments, test results and known limitations

## Setup

```bash
npm install
npm run build:shared
npm run db:up
npm run db:seed:smoke
npm run dev:api
npm run dev:client
```

API uses `http://127.0.0.1:4300/graphql`, Angular `http://127.0.0.1:4200`. Smoke seed is a **small functional profile**, not a performance approximation of 60,000 rows. To study high fan-out: `npm run db:seed:profile`. This intentionally truncates the LOCAL synthetic database.

## Baseline-vs-candidate SQL

`BOARD_SEARCH_MODE=baseline` uses the original shape: full derived plan table built via `unnest + DISTINCT ON`, aggregate per demand. `BOARD_SEARCH_MODE=candidate` uses per-TAP membership GIN containment. Both need correctness checks. `npm run bench:parity` compares plan name results across a demand sample. `npm run db:explain` saves both plans to `artifacts/explain.json`; `EXPLAIN_SUBSET` adjusts the sample size. Unless `ALLOW_LOCAL_EXPLAIN=true`, the HTTP endpoint refuses query-plan execution. CLI explain is **local-only** and always connects to `allocation_lab` via loopback.

## Load

`CLIENTS=5 BOARDS_PER_CLIENT=3 DURATION_SECONDS=20 npm run load` opens actual `graphql-ws` subscriptions (one per board per client) while polling `/api/metrics`. Increase clients gradually; the API enforces `BOARD_MAX_ACTIVE_SUBSCRIPTIONS` and per-client caps and has a bounded search queue. Observe DB `pg_stat_activity` and Node heap/RSS. The script is not a production load generator, and the test client may be a bottleneck at large counts.

## Correctness checks

- `npm run test`: dependency-free seed size and static safety checks; not an integration test.
- `npm run check`: TypeScript parsing only; not a full typecheck.
- `npm run build:api`, `npm run build:client`: real typechecking and bundles, require dependencies.
- `npm run bench:parity`: DB-level baseline/candidate associations; no guarantee that all 19 real grouping cases match production.
- Human verification: global eye after moving leaves between two parents, no accidental hide of unrelated node, stable sort, 5,000 display cap, empty/no-selection behavior.

## Physical bytes

Real heap, disk and TOAST size depend on realistic text entropy, PostgreSQL settings and compression. The SQL seed uses compressible strings on purpose to keep test setup feasible. Compare baseline/candidate on the *same seed*, not absolute disk size against the screenshots. To emulate true 359MB of TAP JSONB and >1GB target/mission-order TOAST, add a separate local inflation script with non-repeating data and measure disk capacity first. No such heavy operation runs automatically.

## Known code gaps

A true production-style clone would need full replica syncing, entire Hasura schema definitions, all event types and protobufs, mapping SDK, user auth/multi-tenant permissions, complete `AllocationBoardSearchParametersEntity`, full Angular layer tree and all 19 grouping scenarios golden tested. These were not visible. The reconstructed defaults are **not production deployment recommendations**.
