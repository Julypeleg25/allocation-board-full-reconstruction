SELECT 'priority' relation,count(*) rows FROM replications."targetAttackPriority"
UNION ALL SELECT 'operationalPlan',count(*) FROM replications."operationalPlan"
UNION ALL SELECT 'warriorMission',count(*) FROM replications."warriorMission"
UNION ALL SELECT 'target',count(*) FROM replications."target"
UNION ALL SELECT 'gdsObjective',count(*) FROM replications."gdsObjective"
UNION ALL SELECT 'area',count(*) FROM replications."area"
UNION ALL SELECT 'missionOrder',count(*) FROM replications."missionOrder"
UNION ALL SELECT 'component',count(*) FROM replications."component";
SELECT count(*) AS plan_array_memberships, count(DISTINCT ref) AS unique_demand_refs
FROM replications."operationalPlan" p, unnest(p."attackDemandIds") ref;
SELECT count(*) AS plans_empty FROM replications."operationalPlan" WHERE cardinality("attackDemandIds")=0;
SELECT count(*) AS mission_refs FROM replications."operationalPlan" p, unnest(p."warriorMissionIds") m;
SELECT pg_size_pretty(pg_total_relation_size('replications."targetAttackPriority"')) tap_total,
       pg_size_pretty(pg_total_relation_size('replications."operationalPlan"')) op_total,
       current_setting('work_mem') work_mem;
