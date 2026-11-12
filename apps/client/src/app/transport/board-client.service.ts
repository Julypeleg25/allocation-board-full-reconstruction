import {Injectable} from '@angular/core';
import {createClient, type Client} from 'graphql-ws';
import {Observable} from 'rxjs';
import type {BoardQuery,BoardResponse} from '@lab/shared';
const endpoint='ws://127.0.0.1:4300/graphql';
@Injectable({providedIn:'root'})
export class BoardClientService{
 private readonly client:Client=createClient({url:endpoint,webSocketImpl:WebSocket,lazy:true,
  retryAttempts:3,shouldRetry:()=>true});
 observe(query:BoardQuery):Observable<BoardResponse>{
  return new Observable<BoardResponse>(observer=>{
   const unsubscribe=this.client.subscribe({
    query:'subscription Updates($input: JSON!, $clientId: String){boardUpdates(input:$input,clientId:$clientId)}',
    variables:{input:query,clientId:'angular-lab-'+crypto.randomUUID()}
   },{
    next:v=>{const data=(v.data as {boardUpdates?:BoardResponse})?.boardUpdates;
     if(data)observer.next(data);
     if(v.errors?.length)observer.error(new Error(v.errors.map(e=>e.message).join(', ')));},
    error:e=>observer.error(e),complete:()=>observer.complete()
   });
   return ()=>unsubscribe();
  });
 }
}
