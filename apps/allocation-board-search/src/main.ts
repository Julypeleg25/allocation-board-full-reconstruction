import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {config} from './config';
async function bootstrap(){
 const app=await NestFactory.create(AppModule,{bufferLogs:true});
 app.enableCors({origin:['http://localhost:4200','http://127.0.0.1:4200'],credentials:false});
 app.enableShutdownHooks();
 await app.listen(config.port,'127.0.0.1');
 console.info(`Synthetic allocation board: http://127.0.0.1:${config.port}/graphql`);
}
void bootstrap();
