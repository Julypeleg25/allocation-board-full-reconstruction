import {Controller,Get,Post,Body,Query,HttpException,HttpStatus} from '@nestjs/common';
import {AllocationBoardSearchUseCase} from '../domain/use-cases/allocation-board-search-use-case';
import {EntityChangeListenerService} from '../infra/entity-change/entity-change-listener.service';
import {AttackDemandTreeRepositoryService} from '../infra/repository/attack-demand-tree-repository.service';
import {Database} from '../infra/knex.provider';
import type {BoardQuery} from '@lab/shared';
@Controller('/api')
export class LabController{
 constructor(private readonly board:AllocationBoardSearchUseCase,
  private readonly changes:EntityChangeListenerService,private readonly repo:AttackDemandTreeRepositoryService,
  private readonly database:Database){}
 @Get('/health')health(){return {status:'ok',engine:'postgresql',synthetic:true};}
 @Get('/metrics')metrics(){return {...this.board.getStats(),changeRevision:this.changes.version,heapUsed:process.memoryUsage().heapUsed,rss:process.memoryUsage().rss,
  pgPool:this.database.poolStats()};}
 @Post('/board/search')search(@Body()input:BoardQuery,@Query('mode')mode?:string){
  return this.board.search(input,mode==='candidate'?'candidate':'baseline');
 }
 @Post('/board/explain')explain(@Body()input:BoardQuery,@Query('mode')mode?:string){
  return this.repo.explain(input,mode==='candidate'?'candidate':'baseline');
 }
 @Post('/simulate-event')event(@Body()input:{table?:string}){
  if(process.env.ENABLE_LOCAL_MUTATIONS!=='true')throw new HttpException('Disabled',HttpStatus.FORBIDDEN);
  this.changes.emit(input.table??'targetAttackPriority');return {revision:this.changes.version};
 }
}
