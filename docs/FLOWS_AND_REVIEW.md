# Complete inspection map: request to pixels and resource pressure

## A. Board open / grouping change

```
[Angular 20 AppComponent]
  -> NgRx BoardActions.watch({boardId, groupBy, selection, filters})
  -> BoardEffects (switchMap, cancels previous subscription)
  -> cache-free GraphQL WS subscribe(boardUpdates)
  -> NestJS BoardResolver / AllocationBoardSearchUseCase.subscribe
  -> request scheduler (bounded concurrent DB work)
  -> AttackDemandTreeRepositoryService.search
       Promise.all(searchRows, filterOptions)
       searchRows: baseFinderQuery -> WHERE filters -> groupBy joins -> GROUP BY + aggregate
         -> SQL result: entire selection, NO SQL LIMIT
       filterOptions: aggregation + 3 option lookups
       buildGroupedResultsTree: fullQueryAttackDemandCount, slice(0, 5000), group tree
  -> full GraphQL tree payload
  -> NgRx BoardActions.result -> reducer/store
  -> selectors: leaf-count calculation and flattened virtual rows
  -> CDK virtual list -> DOM paint
```

**Where to measure:** button click to action, action to WS frame, server scheduler queued wait, SQL start/end, rows/bytes materialized, filter options completion, tree JS build, serialization, WS transfer, reducer time, selectVirtualRows time, change detection, frame long tasks, heap peak, GC pauses.

## B. Subscription, poll and database changes

```
[open board] per-client + board WebSocket subscriber
  -> first search() immediately
  -> interval poll every BOARD_POLL_INTERVAL_MS (inferred)
  -> entity-change emitter -> requery
  -> deep equality compares whole result before emitting
  -> each emitted full result is reprocessed on the client
  -> close/unsubscribe -> cancel interval, RxJS event subscription and WS iterator
```

The source photographs indicate `exhaustMap` and `distinctUntilChanged(equal)` in production, with a server-side producer gate introduced in later investigation. This lab uses a per-subscriber `refresh()` with in-flight coalescing and full equality. That is **not** a byte-for-byte RxJS clone, but the same load factors are present. Check overlapping poll/changes and long queries carefully.

## C. Filters / join paths

1. Finder selection: direct IDs, HQ connection arrays, mission/attack-plan/objective IDs, campaign score and plan/mission selection. Some combinations are AND while HQ branch is OR; real precedence requires source parity.
2. Shared WHERE: non-null target, status, factor, family, policy, partner, target codes, operational/warrior mission membership, and SQL array/JSONB predicates.
3. Groups: TAP-local scalars (no additional join); objective, target and area join; attack plan join through objective; four multivalue fan-out paths (operationalPlan, warriorMission, ammunition, missionOrder).
4. `string_agg(DISTINCT ...)` and `GROUP BY tap.id`: collapse SQL rows back to one per demand after fan-out. Multi-value string split to multiple tree parents, not merely a text label.

## D. Global eye visibility and map

A leaf can be under multiple folder paths. Visibility is stored by **demand ID globally**; opening another board must use the same hidden state. `allDescendantLeafIds` computes unique IDs across the DAG; toggling a folder must not delete leaves or alter unrelated group associations. Test cases: leaf under multiple plans, two simultaneous boards, add/remove selected rows, hide from a nested folder, close one board, re-open with different group order. **A full map SDK is not recreated**; the shared eye/store behavior is represented and the source map effects fragments are included as reference.

## E. Multi-user failure modes

For `C` connected clients, `B` boards/client, `P` polls/minute, `Q` DB queries/refresh, the naive full-refetch budget is roughly `C*B*P*Q` SQL queries/minute, plus change events. The photographed code has main+filter option fan-out, so Q can reach 5. One 5,000-row client view does NOT imply only 5,000 SQL rows are computed. Fast DB calls can still accumulate large intermediate Node objects and JSON serialization peaks; idle SQL server traces do not exclude main-thread browser work.

Watch: connection count, each Knex pool size multiplied by processes, pending/waiting queries, target DB `max_connections`, per-client subscribers, stale subscription cleanup, duplicate watchers across tabs, `no-cache` results, queue limits, GC cycles, memory RSS, WS send-buffer growth, slow clients, event-loop delay, HTTP/WS backpressure and retry storms. The lab exposes `/api/metrics`; it is not a full distributed multi-process monitor.

## F. Benchmark design

Run identical selections and group order in `baseline` and `candidate` on the **same seeded instance** and same work_mem, buffer warm-up policy, pool sizing and max active sessions. For each scenario, record p50/p95 wall time, returned SQL rows, result bytes, temp spill, selected plan count, Node heap peak, WS payload size, Angular main-thread long task count, client FPS and number of nodes. Confirm semantic parity before accepting any optimization. Use a smoke profile for API behavior and full profile for plan cost.

### Database-to-Node vs Node-to-browser clarification

In the photographed repository `results.slice(0, queryLimit)` runs **inside the server**, after PostgreSQL has delivered the complete result array. Therefore the expensive full data transfer is **DB -> Node**, not necessarily **Node -> browser**. GraphQL normally carries the 5,000-row tree and filter options, unless other source paths attach additional full data. Always separately measure SQL result bytes, Node heap and outgoing WS frame bytes.
