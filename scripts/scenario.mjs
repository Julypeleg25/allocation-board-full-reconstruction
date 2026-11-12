import {writeFile,mkdir} from 'node:fs/promises';
const host=process.env.API_URL??'http://127.0.0.1:4300';
const scenarios=[
 {name:'specific-1k',q:{specificAttackDemandIds:Array.from({length:1000},(_,i)=>`D-${i+1}`)}},
 {name:'specific-18k',q:{specificAttackDemandIds:Array.from({length:18354},(_,i)=>`D-${i+1}`)}},
 {name:'campaign-137',q:{scoreFilters:{campaignId:'137'}}},
 {name:'op-plan-finder-10',q:{operationalPlanFilter:Array.from({length:10},(_,i)=>`OP-${i+1}`),scoreFilters:{campaignId:'137'}}}
];
const groups=[[],['TARGET_COUNTRY'],['OPERATIONAL_PLAN'],['WARRIOR_MISSION'],['OPERATIONAL_PLAN','TARGET_COUNTRY']];
const rows=[];
for(const s of scenarios){
 for(const groupBy of groups){
  const input={boardId:'scenario',groupBy,...s.q};
  const start=performance.now();
  try{
   const r=await fetch(host+'/api/board/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
   const b=await r.json();
   rows.push({scenario:s.name,groupBy:groupBy.join('+')||'NONE',ok:r.ok,totalMs:Math.round(performance.now()-start),
    sqlMs:b.timings?.sqlMs,buildMs:b.timings?.buildMs,count:b.fullQueryAttackDemandCount,
    treeNodes:Object.keys(b.tree??{}).length,bytes:JSON.stringify(b).length});
  }catch(e){rows.push({scenario:s.name,groupBy:groupBy.join('+'),error:String(e)});}
 }
}
console.table(rows);
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/scenarios.json',JSON.stringify(rows,null,2));
