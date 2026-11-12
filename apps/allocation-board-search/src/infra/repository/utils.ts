import type {Knex} from 'knex';
import type {BoardQuery} from '@lab/shared';
const validLike=(x:string)=>x.replace(/[%_\\]/g, s => '\\' + s);
export function baseFinderQuery(knex:Knex,p:BoardQuery):Knex.QueryBuilder{
 let q=knex.from({tap:'replications.targetAttackPriority'});
  // Selected HQ/connection-data objectives become an OR-union of correlated objective identifiers.
 // This is reconstructed from the photographed SQL; membership by id/glxId differs across tables.
 const cd=p.connectionDataIds??[];
 const branches:Knex.QueryBuilder[]=[];
 if(cd.length){
  branches.push(knex('replications.gdsConnectionData').select(knex.raw('unnest("objectiveIds") AS id')).whereIn('id',cd));
  branches.push(knex('replications.gdsObjective').select('glxId AS id').whereIn('attackMissionId',
   knex('replications.gdsConnectionData').select(knex.raw('unnest("missionIds")')).whereIn('id',cd)));
  branches.push(knex('replications.gdsObjective').select('glxId AS id').whereIn('attackPlanId',
   knex('replications.gdsConnectionData').select(knex.raw('unnest("attackPlanIds")')).whereIn('id',cd)));
 }
 if(p.objectiveIds?.length)branches.push(knex('replications.gdsObjective').select('glxId AS id').whereIn('id',p.objectiveIds));
 if(p.missionIds?.length)branches.push(knex('replications.gdsObjective').select('glxId AS id').whereIn('attackMissionId',p.missionIds));
 if(p.attackPlanIds?.length)branches.push(knex('replications.gdsObjective').select('glxId AS id').whereIn('attackPlanId',p.attackPlanIds));
 if(branches.length){
  q.where(function(){branches.forEach((b,i)=>i===0?this.whereIn('tap.objectiveId',b):this.orWhereIn('tap.objectiveId',b));});
 }
 if(p.operationalPlanIds?.length)q.whereIn('tap.legacyRafiki',knex('replications.operationalPlan')
  .select(knex.raw('unnest("attackDemandIds")')).whereIn('id',p.operationalPlanIds));
 if(p.warriorMissionIds?.length)q.whereIn('tap.legacyRafiki',knex('replications.operationalPlan')
  .select(knex.raw('unnest("attackDemandIds")')).whereRaw('"warriorMissionIds" && ?::varchar[]',[p.warriorMissionIds]));
 if(p.specificAttackDemandIds?.length)q.whereIn('tap.id',p.specificAttackDemandIds);
 if(p.missionOrderIds?.length)q.whereRaw("tap.id IN (SELECT DISTINCT x.value FROM replications.\"missionOrder\" mo CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(mo.\"missionOrderForControlBoard\"->'demandIds','[]'::jsonb)) x(value) WHERE mo.id=ANY(?::varchar[]))",[p.missionOrderIds]);
 return q;
}
export function applySharedFilters(q:Knex.QueryBuilder,knex:Knex,p:BoardQuery):Knex.QueryBuilder{
 q.whereNotNull('tap.targetId');
 if(p.sectorId?.length)q.whereIn('tap.sectorId',p.sectorId);
 if(p.attackFactor?.length)q.whereIn('tap.attackFactor',p.attackFactor);
 if(p.ammunition)q.whereRaw('tap.\"ammunitionOperationalIds\" @> ?::jsonb',[JSON.stringify([p.ammunition])]);
 if(p.isAttackPrevented!==undefined){
  if(p.isAttackPrevented===null)q.whereNull('tap.isAttackPrevented');
  else q.where('tap.isAttackPrevented',p.isAttackPrevented);
 }
 if(p.latestAttackTime?.length===1){
  if(p.latestAttackTime[0]==='true')q.whereNotNull('tap.latestAttackTime');
  else if(p.latestAttackTime[0]==='false')q.whereNull('tap.latestAttackTime');
 }else if(p.latestAttackTime?.length===2)q.whereBetween('tap.latestAttackTime',[p.latestAttackTime[0],p.latestAttackTime[1]]);

 if(p.attackStatus?.length)q.whereIn('tap.attackStatus',p.attackStatus);
 if(p.targetFamily?.length)q.whereIn('tap.targetFamily',p.targetFamily);
 if(p.chosenPlansStatus?.length)q.whereIn('tap.chosenPlansStatus',p.chosenPlansStatus);
 if(p.priorityInDestination?.length)q.whereIn('tap.priorityInDestination',p.priorityInDestination);
 for(const [field,values] of [
  ['intelligenceApprovalStatus',p.intelligenceApproval],
  ['operationalApprovalStatus',p.operationalApproval],
  ['operationalDepartmentApprovalStatus',p.operationalDepartmentApproval],
  ['method',p.method],['coordinationStatus',p.coordinationStatus]
 ] as const){
  if(values?.length){
   const nonNull=values.filter((x):x is string=>x!==null);
   const includeNull=values.includes(null);
   q.where(function(){
    if(nonNull.length)this.whereIn(`tap.${field}`,nonNull);
    if(includeNull){if(nonNull.length)this.orWhereNull(`tap.${field}`);else this.whereNull(`tap.${field}`);}
   });
  }
 }
 if(p.policy!==undefined){
  if(p.policy)q.whereIn('tap.id',knex('replications.targetAttackPriorityPolicy').select('attackDemandId'));
  else q.whereNotIn('tap.id',knex('replications.targetAttackPriorityPolicy').select('attackDemandId'));
 }
 if(p.onlyExistedTargets)q.whereIn('tap.targetId',knex('replications.target').select('id'));
 if(p.polygons?.length){
  const targetQuery=knex('replications.target').select('id').where(builder=>{
   p.polygons!.forEach((wkt,i)=>i===0?
    builder.whereRaw('ST_Contains(ST_GeomFromText(?,4326),\"geoPosition\")',[wkt]):
    builder.orWhereRaw('ST_Contains(ST_GeomFromText(?,4326),\"geoPosition\")',[wkt]));
  });
  q.whereIn('tap.targetId',targetQuery);
 }
 if(p.hasPartner!==undefined)q.whereIn('tap.targetId',knex('replications.target').select('id').where('hasPartner',p.hasPartner));
 if(p.targetCode?.length||p.targetCodes?.length){
  const codes=[...(p.targetCode??[]),...(p.targetCodes??[])];
  q.whereIn('tap.targetId',knex('replications.target').select('id').where(builder=>{
   codes.forEach((v,i)=>i===0?builder.where('targetCode','like',`${validLike(v)}%`):builder.orWhere('targetCode','like',`${validLike(v)}%`));
  }));
 }
 if(p.scoreFilters?.campaignId)q.innerJoin({score:'replications.score'},'tap.id','score.demandId').where('score.campaignId',p.scoreFilters.campaignId);
 if(p.operationalPlanFilter?.length)q.whereIn('tap.legacyRafiki',knex('replications.operationalPlan')
  .select(knex.raw('unnest("attackDemandIds")')).whereIn('id',p.operationalPlanFilter));
 if(p.warriorMissionFilter?.length)q.whereIn('tap.legacyRafiki',knex('replications.operationalPlan')
  .select(knex.raw('unnest("attackDemandIds")')).whereRaw('"warriorMissionIds" && ?::varchar[]',[p.warriorMissionFilter]));
 if(p.attackPlanFilter?.length)q.whereIn('tap.objectiveId',knex('replications.gdsObjective').select('glxId').whereIn('attackPlanId',p.attackPlanFilter));
 return q;
}
