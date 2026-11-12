import {Injectable} from '@nestjs/common';
import type {Knex} from 'knex';
import type {BoardQuery,BoardRow,BoardResponse} from '@lab/shared';
import {config} from '../../config';
import {Database} from '../knex.provider';
import {applyGroupBy} from './group-by';
import {groupByMap,FROM,type GroupByContext} from './group-by-types';
import {baseFinderQuery,applySharedFilters} from './utils';
import {buildGroupedResultsTree} from './build-grouped-results-tree';
@Injectable()
export class AttackDemandTreeRepositoryService{
 constructor(private readonly database:Database){}
 private base(knex:Knex,p:BoardQuery){return applySharedFilters(baseFinderQuery(knex,p),knex,p);}
 private query(knex:Knex,p:BoardQuery,mode:'baseline'|'candidate'){
  const joinedTables=new Set<string>();
  const ctx:GroupByContext={knex,joinedTables,mode};
  let q=this.base(knex,p).select({id:'tap.id'});
  q=applyGroupBy(q,p.groupBy,ctx);
  const sortCol=p.orderBy&&groupByMap[p.orderBy as keyof typeof groupByMap]
    ?groupByMap[p.orderBy as keyof typeof groupByMap]:undefined;
  if(sortCol){
   const table=FROM[sortCol.table];
   // Filtered join can be reused if groupBy already joined it; sorting by multivalue uses aggregate alias.
   if(!joinedTables.has(sortCol.table)&&sortCol.table!=='priority'){
    // Sorting only when not grouped by the column is intentionally id-based here: original complex
    // sort+join behavior is not visible enough to reproduce without changing cardinality.
    q.orderBy('tap.id',p.orderByType??'asc');
   }else if(sortCol.multi)q.orderBy(p.orderBy!,p.orderByType??'asc');
   else q.orderBy(`${table}.${sortCol.field}`,p.orderByType??'asc');
  }else q.orderBy('tap.id','asc');
  return q;
 }
 private hasSelection(p:BoardQuery){
  return Boolean(p.specificAttackDemandIds?.length||p.connectionDataIds?.length||
   p.objectiveIds?.length||p.attackPlanIds?.length||p.missionIds?.length||
   p.missionOrderIds?.length||p.operationalPlanIds?.length||p.warriorMissionIds?.length||
   p.scoreFilters?.campaignId);
 }
 async runRows(p:BoardQuery,mode:'baseline'|'candidate'=config.mode):Promise<{rows:BoardRow[];ms:number;sql:string;bindings:number}>{
  if(!this.hasSelection(p))return {rows:[],ms:0,sql:'-- no selection',bindings:0};
  const start=performance.now();
  return this.database.timed('search',async trx=>{
   const q=this.query(trx,p,mode);
   const compiled=q.toSQL();
   const rows=await q as unknown as BoardRow[];
   return {rows,ms:performance.now()-start,sql:compiled.sql,bindings:compiled.bindings.length};
  });
 }
 async filterOptions(p:BoardQuery){
  if(!this.hasSelection(p))return {};
  const start=performance.now();
  // Each lookup acquires its own Knex pool connection. This is deliberately photo-shaped:
  // one main query + this aggregation + three optional lookups can compete for five DB connections.
  const [raw,op,wm,ap]=await Promise.all([
   this.database.timed('filter-aggregate',async trx=>this.base(trx,p)
    .clearSelect().clearOrder().select(
      trx.raw('json_agg(DISTINCT "tap"."attackFactor") FILTER (WHERE "tap"."attackFactor" IS NOT NULL) AS "attackFactor"'),
      trx.raw('json_agg(DISTINCT "tap"."targetComplexity") FILTER (WHERE "tap"."targetComplexity" IS NOT NULL) AS "targetComplexity"'),
      trx.raw('json_agg(DISTINCT "tap"."reasonForComplexity") FILTER (WHERE "tap"."reasonForComplexity" IS NOT NULL) AS "reasonForComplexity"')
    ).first()),
   p.operationalPlanIds?.length?this.database.timed('filter-op',async trx=>
    trx('replications.operationalPlan').select('id','name').whereIn('id',p.operationalPlanIds!)):Promise.resolve([]),
   p.warriorMissionIds?.length?this.database.timed('filter-wm',async trx=>
    trx('replications.warriorMission').select('id','name').whereIn('id',p.warriorMissionIds!)):Promise.resolve([]),
   p.attackPlanIds?.length?this.database.timed('filter-ap',async trx=>
    trx('replications.gdsAttackPlan').select('id','name').whereIn('id',p.attackPlanIds!)):Promise.resolve([])
  ]);
  return {filters:{...raw,operationalPlanFilterOptions:op,warriorMissionFilterOptions:wm,
    attackPlanFilterOptions:ap},ms:performance.now()-start};
 }
 async search(p:BoardQuery,mode:'baseline'|'candidate'=config.mode):Promise<BoardResponse>{
  const start=performance.now();
  // The photographed search path executes both branches concurrently; intentionally preserved.
  const [result,filterResult]=await Promise.all([this.runRows(p,mode),this.filterOptions(p)]);
  const timings={sqlMs:result.ms,filterMs:'ms' in filterResult?Number(filterResult.ms):0};
  const buildStart=performance.now();
  const board=buildGroupedResultsTree(result.rows,p,'filters' in filterResult?filterResult.filters??{}: {},timings,config.cutoff);
  board.timings.buildMs=performance.now()-buildStart;
  board.timings.totalMs=performance.now()-start;
  return board;
 }
 async explain(p:BoardQuery,mode:'baseline'|'candidate'=config.mode){
  if(process.env.ALLOW_LOCAL_EXPLAIN!=='true')throw new Error('EXPLAIN must be explicitly enabled on isolated local DB');
  return this.database.timed('explain',async trx=>{
   const q=this.query(trx,p,mode).toSQL();
   return trx.raw(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${q.sql}`,q.bindings);
  });
 }
}
