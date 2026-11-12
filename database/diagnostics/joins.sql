-- Baseline: expands ALL plan arrays and sorts DISTINCT ON despite only a subset ever matching.
EXPLAIN (ANALYZE,BUFFERS,VERBOSE)
SELECT COUNT(*) FROM replications."targetAttackPriority" tap
LEFT JOIN (
  SELECT DISTINCT ON (op.id, dv) op.id,op.name,op."warriorMissionIds",dv AS "rafikiId"
  FROM replications."operationalPlan" op, unnest(op."attackDemandIds") dv
) p ON tap."legacyRafiki"=p."rafikiId"
WHERE tap."targetId" IS NOT NULL AND tap.id::text LIKE 'D-%';
-- Candidate: GIN-supported containment; compare for multi-plan matching and SELECT output parity.
EXPLAIN (ANALYZE,BUFFERS,VERBOSE)
SELECT COUNT(*) FROM replications."targetAttackPriority" tap
LEFT JOIN LATERAL (
 SELECT op.id,op.name,op."warriorMissionIds"
 FROM replications."operationalPlan" op
 WHERE op."attackDemandIds" @> ARRAY[tap."legacyRafiki"]::varchar[]
) p ON true WHERE tap."targetId" IS NOT NULL AND tap.id::text LIKE 'D-%';
