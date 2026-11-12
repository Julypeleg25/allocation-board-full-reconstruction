-- Re-runnable, fully synthetic. Uses :sizes set by scripts/reset-seed.mjs via environment replacement.
-- Sizes for profile: 213445 priorities, 14372 plans, 145839 array memberships, 15050 warrior mission ids.
BEGIN;
TRUNCATE replications."targetAttackPriority", replications."operationalPlan",
 replications."warriorMission", replications."gdsObjective", replications."gdsAttackPlan",
 replications."target", replications."area", replications."missionOrder", replications."component",
 replications."gdsMission", replications."gdsConnectionData",
 replications."targetAttackPriorityPolicy", replications."score",
 global."aggregatedAmmunition";
INSERT INTO replications."area" (id,name)
 SELECT 'A-'||n, 'Sector '||n FROM generate_series(1,__AREAS__) n;
INSERT INTO replications."gdsAttackPlan" (id,name)
 SELECT 'AP-'||n,'Attack plan '||n FROM generate_series(1,__ATTACK_PLANS__) n;
INSERT INTO replications."gdsObjective" (id,"glxId",name,"attackMissionName","attackMissionId","attackPlanId")
 SELECT 'O-'||n,'OBJ-'||n,'Objective '||n,'Mission '||n,'GM-'||(1+(n%__MISSIONS__)),
 'AP-'||(1+(n%__ATTACK_PLANS__)) FROM generate_series(1,__OBJECTIVES__) n;
INSERT INTO replications."target" (id,country,name,"targetCode","hasPartner","geoPosition",entity)
 SELECT 'T-'||n, (ARRAY['Israel','Greece','Italy','Spain','USA','France','Egypt'])[1+n%7],
 'Target '||n, 'TG-'||lpad((n%10000)::text,5,'0'),n%4=0,
 ST_SetSRID(ST_MakePoint(34+(n%1200)/10000.0,31+(n%800)/10000.0),4326),
 jsonb_build_object('id',n,'name','Synthetic target '||n)
 FROM generate_series(1,__TARGETS__) n;
INSERT INTO replications."warriorMission" (id,name)
 SELECT 'WM-'||n,'Warrior mission '||n FROM generate_series(1,__WARRIOR_MISSIONS__) n;
INSERT INTO replications."missionOrder" (id,name,entity,"missionOrderForControlBoard")
 SELECT 'MO-'||n, 'Mission order '||n, jsonb_build_object('id',n),jsonb_build_object('progress', n%5, 'demandIds', jsonb_build_array('D-'||(1+n%__DEMANDS__)))
 FROM generate_series(1,__MISSION_ORDERS__) n;
INSERT INTO replications."component" (id,"targetId",entity)
 SELECT 'C-'||n,'T-'||(1+(n%__TARGETS__)),jsonb_build_object('id',n)
 FROM generate_series(1,__COMPONENTS__) n;
INSERT INTO replications."gdsMission" (id,name)
 SELECT 'GM-'||n,'Mission '||n FROM generate_series(1,__MISSIONS__) n;
INSERT INTO global."aggregatedAmmunition" (id,"operationalName")
 SELECT 'AM-'||n,'Ammunition '||(n%30) FROM generate_series(1,__AMMO__) n;
INSERT INTO replications."targetAttackPriority"
 (id,"legacyRafiki","targetId","objectiveId","sectorId","attackFactor","currentStep",
 "currentStepNumber","targetFamily","attackStatus","chosenPlansStatus","targetComplexity",
 "reasonForComplexity","priorityInDestination","secondaryPriority","sequence","policy", "method",
 "isOccupied","isAlternative","isAttackPrevented","ammunitionOperationalIds",
 "connectedMoIds","connectedPlansIds",entity)
 SELECT 'D-'||n, 'D-'||lpad(n::text,9,'0'),
 CASE WHEN n <= (__DEMANDS__-__NULL_TARGETS__) THEN 'T-'||(1+(n%__TARGETS__)) END,
 CASE WHEN n <= __OBJECTIVE_LINKS__ THEN 'OBJ-'||(1+(n%__OBJ_DISTINCT__)) END,
 CASE WHEN n <= __SECTOR_LINKS__ THEN 'A-'||(1+(n%82)) END,
 (ARRAY['A','B','C','D'])[1+n%4], 'STEP-'||(n%7),n%7,
 'FAMILY-'||(n%20), (ARRAY['NOT','READY','DONE'])[1+n%3], 'STATUS-'||(n%4),
 'COMPLEXITY-'||(n%6), 'REASON-'||(n%4), 'P-'||(n%4),n%15,n,
 n%7=0,'METHOD-'||(n%6),n%3=0,n%8=0,n%11=0,
 CASE WHEN n%8=0 THEN jsonb_build_array('AM-'||(1+n%__AMMO__), 'AM-'||(1+(n+1)%__AMMO__)) ELSE '[]'::jsonb END,
 CASE WHEN n%19=0 THEN jsonb_build_array('MO-'||(1+n%__MISSION_ORDERS__)) ELSE '[]'::jsonb END,
 '[]'::jsonb,
 jsonb_build_object('name','Synthetic demand '||n,'weight',n%100,'status',n%5,'description',repeat('payload',__PAYLOAD_REPEAT__))
 FROM generate_series(1,__DEMANDS__) n;
-- The long-tail plan demand array fan-out is deliberately exact. Offsets spread entries over 86,281 distinct legacyRafiki values.
-- 4,990 plans have zero demands; 9,382 nonempty; top 7 lengths reproduce observed tail.
WITH lengths AS (
 SELECT n,
 CASE WHEN n>__ACTIVE_PLANS__ THEN 0
 WHEN n=1 THEN __TOP1__ WHEN n=2 THEN __TOP2__ WHEN n=3 THEN __TOP3__
 WHEN n=4 THEN __TOP4__ WHEN n=5 THEN __TOP5__ WHEN n=6 THEN __TOP6__
 WHEN n=7 THEN __TOP7__ WHEN n<=7+__EXTRA_FIFTEENS__ THEN 15 ELSE 14 END AS len
 FROM generate_series(1,__PLANS__) n
), offsets AS (
 SELECT n,len, COALESCE(SUM(len) OVER (ORDER BY n ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0)::bigint AS offset
 FROM lengths
)
INSERT INTO replications."operationalPlan" (id,name,"attackDemandIds","warriorMissionIds")
 SELECT 'OP-'||o.n,'Operational plan '||o.n,
 COALESCE((SELECT array_agg('D-'||lpad((1+((o.offset+gs.i-1)%__UNIQUE_DEMAND_VALUES__))::text,9,'0') ORDER BY gs.i)
    FROM generate_series(1,o.len) gs(i)),ARRAY[]::varchar[]),
 CASE WHEN o.n<=__MISSION_REF_PLANS__ THEN ARRAY['WM-'||(1+(o.n%__WARRIOR_MISSIONS__))]::varchar[] ||
    (CASE WHEN o.n<=__DOUBLE_MISSION_PLANS__ THEN ARRAY['WM-'||(1+((o.n+1)%__WARRIOR_MISSIONS__))]::varchar[] ELSE ARRAY[]::varchar[] END)
    ELSE ARRAY[]::varchar[] END
 FROM offsets o;
INSERT INTO replications."gdsConnectionData"(id,"objectiveIds","missionIds","attackPlanIds")
 SELECT 'CD-'||n,
 ARRAY['OBJ-'||(1+n%__OBJ_DISTINCT__), 'OBJ-'||(1+(n+1)%__OBJ_DISTINCT__)]::varchar[],
 ARRAY['GM-'||(1+n%__MISSIONS__)]::varchar[],
 ARRAY['AP-'||(1+n%__ATTACK_PLANS__)]::varchar[]
 FROM generate_series(1,__CONNECTIONS__) n;
INSERT INTO replications."targetAttackPriorityPolicy"(id,"attackDemandId")
 SELECT 'PO-'||n,'D-'||n FROM generate_series(1,LEAST(__DEMANDS__,__POLICIES__)) n;
INSERT INTO replications."score"(id,"demandId","campaignId")
 SELECT 'S-'||n,'D-'||n, '137' FROM generate_series(1,LEAST(__DEMANDS__,__SCORES__)) n;
COMMIT;
ANALYZE;
