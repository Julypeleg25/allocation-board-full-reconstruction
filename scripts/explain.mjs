import {mkdir,writeFile} from 'node:fs/promises';
import {withDb} from './pg.mjs';
const limit=Number(process.env.EXPLAIN_SUBSET??18000);
const idList=Array.from({length:Math.min(limit,20000)},(_,i)=>`D-${i+1}`);
const variants={
 baseline:`SELECT tap.id, string_agg(DISTINCT op_match.name, ', ') AS "OPERATIONAL_PLAN"
 FROM replications."targetAttackPriority" tap
 LEFT JOIN (SELECT DISTINCT ON (op.id,demand_value) op.id,op.name,demand_value AS "rafikiId"
 FROM replications."operationalPlan" op, unnest(op."attackDemandIds") demand_value)
 op_match ON tap."legacyRafiki"=op_match."rafikiId"
 WHERE tap.id=ANY($1::varchar[]) AND tap."targetId" IS NOT NULL
 GROUP BY tap.id ORDER BY tap.id`,
 candidate:`SELECT tap.id, string_agg(DISTINCT op_match.name, ', ') AS "OPERATIONAL_PLAN"
 FROM replications."targetAttackPriority" tap
 LEFT JOIN LATERAL (SELECT op.id,op.name FROM replications."operationalPlan" op
 WHERE op."attackDemandIds" @> ARRAY[tap."legacyRafiki"]::varchar[]) op_match ON true
 WHERE tap.id=ANY($1::varchar[]) AND tap."targetId" IS NOT NULL
 GROUP BY tap.id ORDER BY tap.id`
};
const report={date:new Date().toISOString(),rowLimit:idList.length,env:'local synthetic',results:{}};
await withDb(async db=>{
 for(const [key,sql] of Object.entries(variants)){
  console.info(`Running ${key} EXPLAIN ANALYZE on LOCAL database`);
  await db.query("SET work_mem = '4MB'");
  const r=await db.query('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) '+sql,[idList]);
  report.results[key]=r.rows[0]['QUERY PLAN'][0];
  console.info(key,'execution ms',report.results[key]['Execution Time']);
 }
});
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/explain.json',JSON.stringify(report,null,2));
console.info('Saved artifacts/explain.json');
