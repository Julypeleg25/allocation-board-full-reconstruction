# Review agent instructions

Treat this as a synthetic reconstruction, not original production code. Do not infer original semantics from reconstructed modules without corroborating photographed snippets and the real checkout. Original pagination PR is out of scope. Preserve all currently encoded behavior: combined multi-valued groups, total count, post-query 5k display cutoff, selected ids, null handling, stable ordering, global eye state and map selection. Compare both SQL implementations on same seeded DB and assert tree parity before any change to default query path.

Priority checks: DB rows/array fan-out, spill behavior with work_mem 4MB, count/aggregation/payload, 5-concurrent-filter-lookup cost, GraphQL lifecycle/cleanup, bounded Knex pool, per-user/board fanout, memory under repeated change events, NgRx selector invalidation, leaf count and repeated dictionary deep equals, DOM virtualization and map rendering. Instrument first, implement smallest effective changes, report before/after of exact scenarios; never claim an improvement based solely on inspecting source.

Do not run EXPLAIN ANALYZE or writes on production; use generated local PostGIS. The `db:seed:profile` and optional `db:inflate` are destructive for the local synthetic DB and heavy on disk. Inspect docs and safety gates before running them.
