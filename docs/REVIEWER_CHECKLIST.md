# Thorough reviewer checklist

### Database and Knex

- [ ] All 19 group keys identified: TAP-local vs 1:1 relation vs one-to-many array/JSONB.
- [ ] `legacyRafiki` uniqueness, join aliases, grouping by TAP primary key and multi-plan fan-out.
- [ ] Query uses binding variables; no user-controlled SQL identifiers or unescaped LIKE search.
- [ ] Plan derived subquery `DISTINCT ON` cost, extra sorting, spill bytes, row estimates, index usage.
- [ ] Candidate query SQL results equal baseline for all null/multi associations; `EXPLAIN` A/B.
- [ ] Correct `fullQueryAttackDemandCount`, ordering, 5,000 cutoff, null filters and multi-values.
- [ ] `getFilters` fan-out and first-paint barrier measured separately; no duplicate scans when not required.
- [ ] PostgreSQL connections, wait queue, statement timeout, transaction read-only and pool pressure.

### Server and GraphQL

- [ ] Each viewer / tab / board creates the expected number of streams, no surprise duplicate subscription.
- [ ] Poll and entity-change signals do not spawn unbounded overlapping fetches.
- [ ] Cleanup on unsubscribe, disconnect, resubscribe, error and shutdown.
- [ ] Buffering/backpressure, queue saturation, oversized payload and event-loop lag.
- [ ] Full-result deep compare and JSON serialization CPU/memory measured on each refresh.
- [ ] Changes never get dropped by fast-path dedup or backpressure without explicit approval.

### Angular, NgRx, map and layers

- [ ] Store/selector reference stability, `OnPush`, no redundant eager deep equals.
- [ ] Multi-level grouping, `A,B` labels, DAG parent links and shared leaf identity.
- [ ] Global eye visibility across boards, hidden leaf count and folder inheritance; no local-only state.
- [ ] Target map state, selection sync, feature count/zoom, WebGL/DOM render bottleneck.
- [ ] `calculateNodesLeafCount` (`shift`, `includes`), recursive flattener, spread copies in selectors.
- [ ] 5,000 visible cap creates bounded view size, not a truncated total count.
- [ ] First paint and grouping-toggle p50/p95; frame long tasks, GC and memory after unsubscribe.

### Trust and evidence

- [ ] Measured results labeled with hardware, dataset, date, concurrent clients and plan hash.
- [ ] All synthetic vs photographed vs inferred functions clearly distinguished.
- [ ] Never introduce pagination PR or change unrelated board/eye behavior.
- [ ] Typecheck, DB seed integration, GraphQL smoke, client production build and load complete before merge.
