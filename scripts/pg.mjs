import pg from 'pg';
const DEFAULT='postgresql://lab:lab_only@127.0.0.1:55432/allocation_lab';
export function safeConnection(){
 const url=new URL(process.env.DATABASE_URL||DEFAULT);
 if(!['localhost','127.0.0.1','::1'].includes(url.hostname)||url.pathname!=='/allocation_lab'){
  throw Error('REFUSING remote/non-lab DB. Set DATABASE_URL to a LOCAL allocation_lab database.');
 }
 return url.toString();
}
export function client(){return new pg.Client({connectionString:safeConnection(),connectionTimeoutMillis:8000});}
export async function withDb(fn){const db=client();await db.connect();try{return await fn(db);}finally{await db.end();}}
