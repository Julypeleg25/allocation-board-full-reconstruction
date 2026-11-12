import {Injectable,OnModuleDestroy} from '@nestjs/common';
import Knex,{type Knex as KnexType} from 'knex';
import {knexConfig,config} from '../config';
@Injectable()
export class Database implements OnModuleDestroy{
 readonly db:KnexType=Knex(knexConfig);
 constructor(){
  this.db.on('query',(q:any)=>{
   if(process.env.LOG_SQL==='true')console.info('[sql]',q.sql,'bindings',q.bindings?.length);
  });
 }
 async onModuleDestroy(){await this.db.destroy();}
 poolStats(){
  const client=this.db.client as typeof this.db.client & {pool?:{
   numUsed?:()=>number;numFree?:()=>number;numPendingAcquires?:()=>number;
  }};
  return {
   inUse:client.pool?.numUsed?.()??null,
   free:client.pool?.numFree?.()??null,
   pending:client.pool?.numPendingAcquires?.()??null
  };
 }
 async timed<T>(name:string, f:(db:KnexType)=>Promise<T>):Promise<T>{
  const start=performance.now();
  try{return await this.db.transaction(async t=>{
   await t.raw("SELECT set_config('statement_timeout', ?, true)", [String(config.statementTimeout)]);
   return f(t);
  },{readOnly:true});}
  finally{if(process.env.LOG_TIMINGS==='true')console.info(name,Math.round(performance.now()-start));}
 }
}
