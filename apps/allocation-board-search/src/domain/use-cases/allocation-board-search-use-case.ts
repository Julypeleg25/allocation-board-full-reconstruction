import {Injectable} from '@nestjs/common';
import {config} from '../../config';
import type {BoardQuery,BoardResponse} from '@lab/shared';
import {validateBoardInput} from '@lab/shared';
import {AttackDemandTreeRepositoryService} from '../../infra/repository/attack-demand-tree-repository.service';
import {EntityChangeListenerService} from '../../infra/entity-change/entity-change-listener.service';
import {SearchScheduler} from './search-scheduler';
import {Subject,Subscription} from 'rxjs';
import equal from 'fast-deep-equal';
/** Baseline: search + periodic poll + whole-result deep-equal dedup, per independent subscription. */
@Injectable()
export class AllocationBoardSearchUseCase{
 constructor(
  private readonly repo:AttackDemandTreeRepositoryService,
  private readonly changes:EntityChangeListenerService,
  private readonly scheduler:SearchScheduler
 ){}
 readonly tracking=new Map<string,{clientId:string,boardId:string,started:number}>();
 async search(input:unknown,mode?:'baseline'|'candidate'){
  const parsed=validateBoardInput(input);
  return this.scheduler.run(()=>this.repo.search(parsed,mode??config.mode));
 }
 subscribe(input:unknown, clientId='local-browser'):{iterator:AsyncIterableIterator<BoardResponse>,dispose:()=>void}{
  const parsed=validateBoardInput(input);
  const id=`${clientId}:${parsed.boardId}:${Math.random().toString(36).slice(2)}`;
  const sameClient=[...this.tracking.values()].filter(x=>x.clientId===clientId).length;
  if(this.tracking.size>=config.maxSubscribers||sameClient>=config.maxPerClient)
    throw new Error('Too many active subscriptions');
  const emissions:BoardResponse[]=[];
  const waiters:((value:IteratorResult<BoardResponse>)=>void)[]=[];
  let closed=false,inFlight=false,stale=false;
  let last:BoardResponse|undefined;
  this.tracking.set(id,{clientId,boardId:parsed.boardId,started:Date.now()});
  const send=(result:BoardResponse)=>{
   if(closed)return;
   // Reconstruct the photographed full-result comparison semantics, intentionally expensive.
   if(last && last.fullQueryAttackDemandCount===result.fullQueryAttackDemandCount
    && equal(last.tree,result.tree) && equal(last.filters,result.filters))return;
   last=result;
   if(waiters.length)waiters.shift()!({done:false,value:result});
   else emissions.push(result);
  };
  const refresh=async()=>{
   if(closed)return;
   if(inFlight){stale=true;return;}
   inFlight=true;
   try{send(await this.search(parsed));}
   catch(err){console.warn('Board subscription refresh failed',err);}
   finally{inFlight=false;if(stale&&!closed){stale=false;void refresh();}}
  };
  const poll=setInterval(()=>void refresh(),config.pollInterval);
  const events:Subscription=this.changes.changed.subscribe(()=>void refresh());
  void refresh();
  const dispose=()=>{
   if(closed)return; closed=true;clearInterval(poll);events.unsubscribe();
   emissions.length=0;this.tracking.delete(id);
   while(waiters.length)waiters.shift()!({done:true,value:undefined});
  };
  const iterator:AsyncIterableIterator<BoardResponse>={
   [Symbol.asyncIterator](){return this;},
   next(){if(closed)return Promise.resolve({done:true as const,value:undefined});
    const val=emissions.shift();if(val!==undefined)return Promise.resolve({done:false as const,value:val});
    return new Promise(resolve=>waiters.push(resolve));},
   return(){dispose();return Promise.resolve({done:true as const,value:undefined});},
   throw(err){dispose();return Promise.reject(err);}
  };
  return {iterator,dispose};
 }
 getStats(){
  const boards=[...this.tracking.values()];
  return {activeSubscriptions:boards.length,distinctClients:new Set(boards.map(x=>x.clientId)).size,
    distinctBoards:new Set(boards.map(x=>x.boardId)).size,...this.scheduler.snapshot()};
 }
}
