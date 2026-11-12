import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {withDb} from './pg.mjs';
const p=process.argv[2];if(!p)throw Error('Usage: node scripts/sql.mjs database/diagnostics/cardinality.sql');
if(!p.startsWith('database/'))throw Error('Only local repository database scripts allowed');
const sql=await readFile(resolve(process.cwd(),p),'utf8');
await withDb(async db=>{
 const results=await db.query(sql);
 for(const r of Array.isArray(results)?results:[results]){
  if(r.rows?.length)console.table(r.rows.length>100?r.rows.slice(0,100):r.rows);
 }
});
