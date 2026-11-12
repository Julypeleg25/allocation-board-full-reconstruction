/** Multi-user/board GraphQL WS load with explicit socket lifecycle and metrics. No production endpoints. */
import {createClient} from 'graphql-ws';
import WebSocket from 'ws';
const clients=Math.min(Number(process.env.CLIENTS??5),50);
const boards=Math.min(Number(process.env.BOARDS_PER_CLIENT??3),20);
const duration=Math.min(Number(process.env.DURATION_SECONDS??20),300);
const url=process.env.WS_URL??'ws://127.0.0.1:4300/graphql';
if(!url.startsWith('ws://127.0.0.1:')&&!url.startsWith('ws://localhost:'))throw Error('Local WebSocket URL only');
const subscriptions=[];let msgs=0,errors=0;
const clientInstances=[];
for(let c=0;c<clients;c++){
 const client=createClient({url,webSocketImpl:WebSocket,lazy:true,connectionAckWaitTimeout:5000,
  retryAttempts:0});
 clientInstances.push(client);
 for(let b=0;b<boards;b++){
  const unsubscribe=client.subscribe({
   query:'subscription($input:JSON!, $clientId:String){boardUpdates(input:$input,clientId:$clientId)}',
   variables:{input:{boardId:`B-${b}`,allocationBoardFolderId:`B-${b}`,
    groupBy:b%2?['OPERATIONAL_PLAN']:[],specificAttackDemandIds:Array.from({length:500},(_,i)=>`D-${i+1+b*30}`)},clientId:`C-${c}`}
  },{next:()=>{msgs++;},error:()=>{errors++;},complete:()=>{}});
  subscriptions.push(unsubscribe);
 }
}
const started=Date.now();
const timer=setInterval(async()=>{
 try{const r=await fetch('http://127.0.0.1:4300/api/metrics');
  console.log('seconds',Math.round((Date.now()-started)/1000),'messages',msgs,'errors',errors,'api',await r.json());}
 catch(e){console.log('metrics error',String(e));}
},5000);
await new Promise(resolve=>setTimeout(resolve,duration*1000));
clearInterval(timer);for(const unsub of subscriptions)unsub();
for(const client of clientInstances)await client.dispose();
console.log(JSON.stringify({clients,boards,subscriptions:subscriptions.length,seconds:duration,msgs,errors}));
