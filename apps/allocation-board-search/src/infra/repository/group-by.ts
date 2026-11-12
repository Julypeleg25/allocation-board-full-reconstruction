import type {Knex} from 'knex';
import type {GroupByOption} from '@lab/shared';
import {groupByMap,FROM, type GroupByContext} from './group-by-types';
import {ensureJoin} from './group-by-joins';
export function applyGroupBy(q:Knex.QueryBuilder,options:GroupByOption[],ctx:GroupByContext):Knex.QueryBuilder{
 for(const option of options){
  const mapping=groupByMap[option]; q=ensureJoin(q,mapping.table,ctx);
  const col=`${FROM[mapping.table]}.${mapping.field}`;
  if(mapping.multi){
   // Screenshot: string_agg(DISTINCT field, ', ') FILTER (WHERE field IS NOT NULL).
   q.select(ctx.knex.raw(`string_agg(DISTINCT ??, ', ') FILTER (WHERE ?? IS NOT NULL) AS ??`,[col,col,option]));
  }else{
   q.select({[option]:col}).groupBy(col);
  }
 }
 // A demand can join multiple plans and missions; fold back to one SQL row per demand.
 return options.length?q.groupBy('tap.id'):q;
}
