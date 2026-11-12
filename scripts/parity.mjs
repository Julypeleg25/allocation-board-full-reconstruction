/** Before/after query semantics comparison. Never take a speed win without identical row+group results. */
import {withDb} from './pg.mjs';
const count=Number(process.env.PARITY_ROWS??500);
const baseline=`SELECT tap.id, COALESCE(string_agg(DISTINCT op_match.name,', ' ORDER BY op_match.name),'') names
 FROM replications."targetAttackPriority" tap
 LEFT JOIN(SELECT DISTINCT ON (op.id,dv) op.id,op.name,dv rafiki FROM replications."operationalPlan" op,
 unnest(op."attackDemandIds") dv) op_match ON tap."legacyRafiki"=op_match.rafiki
 WHERE tap.id=ANY($1::varchar[]) GROUP BY tap.id ORDER BY tap.id`;
const candidate=`SELECT tap.id, COALESCE(string_agg(DISTINCT op_match.name,', ' ORDER BY op_match.name),'') names
 FROM replications."targetAttackPriority" tap
 LEFT JOIN LATERAL(SELECT op.id,op.name FROM replications."operationalPlan" op
 WHERE op."attackDemandIds" @> ARRAY[tap."legacyRafiki"]::varchar[]) op_match ON true
 WHERE tap.id=ANY($1::varchar[]) GROUP BY tap.id ORDER BY tap.id`;
await withDb(async db=>{
 const ids=Array.from({length:count},(_,i)=>`D-${i+1}`);
 const [a,b]=await Promise.all([db.query(baseline,[ids]),db.query(candidate,[ids])]);
 const equal=JSON.stringify(a.rows)===JSON.stringify(b.rows);
 console.info('group-name parity:',equal,'records:',a.rows.length,b.rows.length);
 if(!equal){console.info('baseline sample',a.rows.slice(0,4));console.info('candidate sample',b.rows.slice(0,4));process.exitCode=1;}
});
