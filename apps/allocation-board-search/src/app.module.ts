import {Module} from '@nestjs/common';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver,ApolloDriverConfig} from '@nestjs/apollo';
import {Database} from './infra/knex.provider';
import {AttackDemandTreeRepositoryService} from './infra/repository/attack-demand-tree-repository.service';
import {AllocationBoardSearchUseCase} from './domain/use-cases/allocation-board-search-use-case';
import {EntityChangeListenerService} from './infra/entity-change/entity-change-listener.service';
import {SearchScheduler} from './domain/use-cases/search-scheduler';
import {LabController} from './http/lab.controller';
import {BoardResolver} from './graphql/board.resolver';
@Module({imports:[GraphQLModule.forRoot<ApolloDriverConfig>({
 driver:ApolloDriver,autoSchemaFile:true,subscriptions:{'graphql-ws':true},
 sortSchema:true,path:'/graphql'
})],controllers:[LabController],providers:[Database,AttackDemandTreeRepositoryService,
 AllocationBoardSearchUseCase,EntityChangeListenerService,SearchScheduler,BoardResolver]})
export class AppModule{}
