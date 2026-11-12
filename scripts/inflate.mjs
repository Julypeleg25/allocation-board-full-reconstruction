/** Optional large TOAST/heap experiment; never auto-run. Strictly local disposable database. */
import {withDb,safeConnection} from './pg.mjs';
const env=process.env;
if(env.ALLOW_LOCAL_INFLATE!=='YES')throw Error('REFUSED: set ALLOW_LOCAL_INFLATE=YES for local synthetic inflation');
const table=env.INFLATE_TABLE??'tap';
const limits={tap:213445,target:352756,missionOrder:377139};
if(!(table in limits))throw Error('Choose INFLATE_TABLE=tap|target|missionOrder');
const n=Number(env.INFLATE_ROWS??1000);
if(!Number.isSafeInteger(n)||n<1||n>limits[table])throw Error('Invalid INFLATE_ROWS');
console.log('Local target:',safeConnection(),'table:',table,'rows:',n);
const specs={
 tap:{table:'replications."targetAttackPriority"',field:'entity',size:850},
 target:{table:'replications."target"',field:'entity',size:850},
 missionOrder:{table:'replications."missionOrder"',field:'entity',size:900}
};
const spec=specs[table];
await withDb(async db=>{
 await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
 // Each generated blob is random, unlike the seed's compressible repeat() string.
 // Scaling the bytes approximates the observed TOAST weight, not an exact storage image.
 const sql=`UPDATE ${spec.table} t SET "${spec.field}"=COALESCE(t."${spec.field}",'{}'::jsonb)
    || jsonb_build_object('blob', encode(gen_random_bytes(${spec.size}), 'hex'))
    WHERE t.id IN (SELECT id FROM ${spec.table} ORDER BY id LIMIT $1)`;
 const start=performance.now();const x=await db.query(sql,[n]);
 await db.query(`ANALYZE ${spec.table}`);
 const sizes=await db.query('SELECT pg_size_pretty(pg_total_relation_size($1::regclass)) size',[spec.table]);
 console.log('inflated',x.rowCount,'rows, seconds',(performance.now()-start)/1000,'relation size',sizes.rows[0]?.size);
});
