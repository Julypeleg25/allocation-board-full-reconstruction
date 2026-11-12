/** Reconstructs the photographed DISTINCT ON + UNNEST full-table join and the associated LATERAL joins. */
import type {Knex} from 'knex';
import type {GroupByContext,RefTable} from './group-by-types';
export function ensureJoin(q:Knex.QueryBuilder,table:RefTable,ctx:GroupByContext):Knex.QueryBuilder{
 if(table==='priority'||ctx.joinedTables.has(table))return q;
 if(table==='attackPlan')q=ensureJoin(q,'objective',ctx);
 if(table==='warriorMission')q=ensureJoin(q,'operationalPlan',ctx);
 ctx.joinedTables.add(table);
 switch(table){
  case 'objective':return q.leftJoin({obj:'replications.gdsObjective'},'tap.objectiveId','obj.glxId');
  case 'target':return q.leftJoin({tgt:'replications.target'},'tap.targetId','tgt.id');
  case 'area':return q.leftJoin({area:'replications.area'},'tap.sectorId','area.id');
  case 'attackPlan':return q.leftJoin({ap:'replications.gdsAttackPlan'},'obj.attackPlanId','ap.id');
  case 'operationalPlan':{
   if(ctx.mode==='candidate'){
    // Optional A/B candidate: parameterized, per-row GIN array containment.
    // Do NOT assume this outperforms the baseline without EXPLAIN and equality checks.
    return q.joinRaw('LEFT JOIN LATERAL (SELECT op.id, op.name, op."warriorMissionIds" FROM replications."operationalPlan" op WHERE op."attackDemandIds" @> ARRAY[tap."legacyRafiki"]::varchar[]) AS op_match ON true');
   }
   return q.joinRaw(`LEFT JOIN (
    SELECT DISTINCT ON (op.id, demand_value) op.id,op.name,op."warriorMissionIds",demand_value AS "rafikiId"
    FROM replications."operationalPlan" AS op, unnest(op."attackDemandIds") AS demand_value
   ) AS op_match ON tap."legacyRafiki" = op_match."rafikiId"`);
  }
  case 'warriorMission':return q.joinRaw(`LEFT JOIN LATERAL unnest(op_match."warriorMissionIds") AS warrior_mission_ids(value)
   ON op_match."warriorMissionIds" IS NOT NULL`).leftJoin({wm:'replications.warriorMission'},'wm.id','warrior_mission_ids.value');
  case 'ammunition':return q.joinRaw(`LEFT JOIN LATERAL jsonb_array_elements_text(tap."ammunitionOperationalIds") AS ammunition_ids(value)
   ON tap."ammunitionOperationalIds" IS NOT NULL`).leftJoin({ammo:'global.aggregatedAmmunition'},'ammo.id','ammunition_ids.value');
  case 'missionOrder':return q.joinRaw(`LEFT JOIN LATERAL jsonb_array_elements_text(tap."connectedMoIds") AS mission_order_ids(value)
   ON tap."connectedMoIds" IS NOT NULL`).leftJoin({mo:'replications.missionOrder'},'mo.id','mission_order_ids.value');
 }
}
