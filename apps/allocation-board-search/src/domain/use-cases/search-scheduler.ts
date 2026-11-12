import {Injectable} from '@nestjs/common';
import {config} from '../../config';
export class OverloadedError extends Error{constructor(){super('Server busy: bounded search queue is full');}}
/** Bounded execution in a single Node process; protect PG pools from unbounded board fan-out. */
@Injectable()
export class SearchScheduler{
 active=0; queued=0;private readonly maxQueue=60;
 private readonly waiters:(()=>void)[]=[];
 async run<T>(job:()=>Promise<T>):Promise<T>{
  if(this.active>=config.concurrency){
   if(this.waiters.length>=this.maxQueue)throw new OverloadedError();
   this.queued++;
   await new Promise<void>(resolve=>this.waiters.push(resolve));
   this.queued--;
  }else{
   // Reserve a slot immediately; queued jobs inherit a released permit.
   this.active++;
  }
  try{return await job();}
  finally{
   const next=this.waiters.shift();
   if(next)next();
   else this.active--;
  }
 }
 snapshot(){return {active:this.active,queued:this.queued,limit:config.concurrency,maxQueue:this.maxQueue};}
}
