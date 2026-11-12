import {Resolver,Query,Mutation,Subscription,Args} from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {AllocationBoardSearchUseCase} from '../domain/use-cases/allocation-board-search-use-case';
import {EntityChangeListenerService} from '../infra/entity-change/entity-change-listener.service';
@Resolver()
export class BoardResolver{
 constructor(private readonly board:AllocationBoardSearchUseCase,private readonly changes:EntityChangeListenerService){}
 @Query(()=>GraphQLJSON,{name:'searchBoard'})
 searchBoard(@Args('input',{type:()=>GraphQLJSON}) input:object){return this.board.search(input);}
 @Subscription(()=>GraphQLJSON,{name:'boardUpdates',resolve:(payload:any)=>payload.boardUpdates})
 boardUpdates(@Args('input',{type:()=>GraphQLJSON}) input:object,@Args('clientId',{type:()=>String,nullable:true})clientId?:string){
  const {iterator}=this.board.subscribe(input,clientId??'client');
  const iter:AsyncIterableIterator<{boardUpdates:unknown}>={
   [Symbol.asyncIterator](){return this;},
   async next(){const n=await iterator.next();return n.done?{done:true,value:undefined}:{done:false,value:{boardUpdates:n.value}};},
   async return(){await iterator.return?.();return {done:true,value:undefined};},
   async throw(e){await iterator.throw?.(e);throw e;}
  };
  return iter;
 }
 @Mutation(()=>Boolean,{name:'simulateLocalChange'})
 simulateLocalChange(@Args('table',{type:()=>String})table:string){
  if(process.env.ENABLE_LOCAL_MUTATIONS!=='true')throw new Error('Enable LOCAL mutations explicitly');
  this.changes.emit(table);return true;
 }
}
