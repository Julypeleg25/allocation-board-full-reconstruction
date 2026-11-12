# Investigation plan — from architecture to production-grade refactor

The *original* application is a separate source of truth. This lab is not a replacement; it is a reproducible hypothesis-testing workspace. Stages have strict gates. Do not simultaneously optimize SQL, NgRx, and network protocol and then infer a cause from a single timing.

## Stage 0 — runtime and correctness acceptance

- Run `npm install`, `npm run build:shared`, `npm run build:api`, `npm run build:client`, `npm run test`.
- Start local Docker DB, smoke seed; verify `/api/health`, `/graphql`, `searchBoard`, `boardUpdates`, `simulateLocalChange` (only if explicitly enabled), and exact connection cleanup.
- Enumerate real-repo parameter combinations and expected results; save golden input/results in a locally generated fixture, **not** production secrets or identifiers.
- Compare duplicate group values, null/missing data, mixed selected IDs, nested 19 options, stable ordering, full count, 5,000 displayed leaves and global eye.

## Stage 1 — SQL fingerprint and query-plan cost

- Compare no grouping; TAP-local grouping; plan grouping; warrior grouping; multi plan+target grouping and HQ+campaign cross-selection.
- Record `EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)`, spill bytes, `Sort Method`, actual row counts, loops, join algorithm, planner estimates, GIN/index utilization.
- Measure the `DISTINCT ON(plan.id, unnest(array))` subquery alone, and correlate with whole-query time.
- Test local candidate with plan array GIN containment; **do not assume it wins**. Compare `EXISTS`, semi-joins, scoped demand-first plan selection, `LATERAL` expansion after narrowing, derived junction read model. Keep non-array path free of unnecessary joins.
- Inspect correlated-union / HQ combinations separately. Verify `objectiveId` semantics and plan affiliation; avoid cross-plan mission combinations.

## Stage 2 — query/payload and first paint

- Separate count vs display rows without changing the semantics of `fullQueryAttackDemandCount`. A SQL limit by itself would break full counts and grouping metadata. Consider `COUNT(*) OVER()` or a separate count query **only after** correctness verification; compare transaction snapshots and consistency.
- Measure materialized 60,000-result array, Node process peak memory, JSON parse/stringify, WebSocket frame size and `NoCache` behavior. Query results and option lists may be combined; identify critical path for first paint.
- If acceptable, send summaries and only the 5,000 visible data records while calculating full count and required folder counts server-side. Retain **all** group nodes/global eye policies and selected-state parity. Test multi-valued memberships.

## Stage 3 — server subscriptions and capacity

- Map WS connection -> user -> board -> query -> poll interval -> DB pool connection -> response buffers. Sample 1, 5, 10, 25 clients with 1, 3, 10 boards. Repeat under sync event storms.
- Confirm cleanup on board close, route change, browser tab close, reconnect, failed DB queries and shutdown.
- Use bounded query concurrency/queue, cancellation where supported, timeout and overload policy. Avoid generating a new full tree every tick if no data changed; but **no change gate can suppress a real update**. Never replace lossless equality with an unproven hash.
- Prove total connections = number of backend processes * each pool max + other services; check `pg_stat_activity`, checkout queue and slow-client socket backpressure.

## Stage 4 — client main thread and selectors

- Profile `diffDictionaries`, leaf-count traversal, tree build and selectors with Chrome Performance. Differentiate `self time`, inclusive time and GC. The supplied screenshots show `calculateNodesLeafCount` queue shifts + `.includes` and selectors allocating/merging dictionaries.
- Replace quadratic queue operations with work-index and sets; preserve per-leaf de-duplication and parent graph. Memoize by immutable subtree changes, not by mutable object reference if reducers change nested arrays in place.
- Prove values returned by selectors and full global eye states are identical on multi-parent test graphs. Limit DOM elements via CDK virtual scroll, avoid recreating arrays/objects on each NgRx tick, never accidentally trigger every board update on map view changes.
- Use performance budgets on main thread: interactions produce no >50ms long task under representative workload, 5,000-visible-node latency and heap measured.

## Stage 5 — indexes/physical model (requires DBA gate)

- Work on local synthetic DB first, then a nonproduction copy. Compare GIN `@>` / `ANY`, B-tree membership, dedicated junction table and maintenance burden, materialized view refresh cost, per-row JSONB GIN and query-specific multicolumn indexes.
- Do not drop the observed duplicate legacy/codegen indexes in the real database without a dependency and workload audit. Index bloat is real but not equivalent to the single query's fan-out bottleneck.
- Measure `work_mem` per operation * concurrent sessions; a global 32MB increase can multiply memory under large concurrency. Prefer changing query shape first.

## Stage 6 — gated rollout

- Keep original behavior and output golden fixtures. Use sequential, independently reversible PRs: instrumentation; SQL path; count/payload; streams/capacity; tree/eye; optional physical schema.
- Canary with synthetic and read-only production-observability counters. Under 60k board and 5k visible cap, require results parity, stable group order, preserved global eye, no lost subscription update and p95/peak-memory improvement under concurrent clients.
