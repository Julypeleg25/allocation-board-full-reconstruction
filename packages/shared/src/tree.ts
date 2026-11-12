import type {BoardRow,Folder,TreeNode,GroupByOption} from './index.js';
const ROOT='allocation-folder';
const SPLIT_OPTIONS=new Set<GroupByOption>(['OPERATIONAL_PLAN','WARRIOR_MISSION','AMMUNITION_FILTER','CONNECTED_MO_IDS']);
function valuesOf(row:BoardRow, key:GroupByOption):string[]{
 const raw=row[key];
 if(raw===null||raw===undefined||raw==='') return ['null'];
 const text=String(raw);
 const arr=SPLIT_OPTIONS.has(key)?text.split(/,\s*/).map(x=>x.trim()).filter(Boolean):[text];
 return [...new Set(arr)].sort();
}
export function buildGroupedTree(rows:BoardRow[],keys:GroupByOption[],rootId=ROOT):Record<string,TreeNode>{
 const nodes:Record<string,TreeNode>={};
 nodes[rootId]={type:'folder',id:rootId,name:rootId,parentId:null,childIds:[]};
 const pending=new Map<string,Set<string>>([[rootId,new Set()]]);
 function addChild(parent:string, child:string){
  if(!pending.has(parent)) pending.set(parent,new Set());
  pending.get(parent)!.add(child);
 }
 for(const row of rows){
  let parentIds=[rootId];
  for(const key of keys){
   const next=new Set<string>();
   for(const pid of parentIds){
    for(const label of valuesOf(row,key)){
     const id=`${pid}/${key}:${encodeURIComponent(label)}`;
     if(!nodes[id]) nodes[id]={type:'folder',id,name:label,groupByKey:key,parentId:pid,childIds:[]};
     addChild(pid,id); next.add(id);
    }
   }
   parentIds=[...next];
  }
  const id=row.id; const existing=nodes[id];
  const leaf=existing?.type==='leaf'?existing:{id,type:'leaf' as const,parentIds:[]};
  for(const pid of parentIds){
   if(!leaf.parentIds.includes(pid)) leaf.parentIds.push(pid);
   addChild(pid,id);
  }
  nodes[id]=leaf;
 }
 for(const [id,children] of pending){
  const folder=nodes[id];if(folder?.type==='folder')folder.childIds=[...children].sort();
 }
 return nodes;
}
export function allDescendantLeafIds(tree:Record<string,TreeNode>,id:string):string[]{
 const seen=new Set<string>();const leaves=new Set<string>();const todo=[id];
 while(todo.length){
  const current=todo.pop()!;
  if(seen.has(current)) continue;
  seen.add(current);
  const node=tree[current];
  if(!node) continue;
  if(node.type==='leaf')leaves.add(node.id);
  else for(const child of node.childIds) todo.push(child);
 }
 return [...leaves].sort();
}
export function computeLeafCounts(tree:Record<string,TreeNode>):Record<string,number>{
 const cache=new Map<string,Set<string>>();
 function calc(id:string, ancestors:Set<string>):Set<string>{
  if(cache.has(id))return cache.get(id)!;
  if(ancestors.has(id))throw new Error('Cyclic folder graph');
  const node=tree[id];if(!node)return new Set();
  if(node.type==='leaf')return new Set([id]);
  const next=new Set(ancestors);next.add(id);
  const ids=new Set<string>();
  for(const child of node.childIds){for(const l of calc(child,next))ids.add(l);}
  cache.set(id,ids);return ids;
 }
 const output:Record<string,number>={};
 for(const [id,node] of Object.entries(tree)) if(node.type==='folder')output[id]=calc(id,new Set()).size;
 return output;
}
export function diffById<T extends {id:string}>(prev:Record<string,T>,next:Record<string,T>){
 const added:string[]=[],removed:string[]=[],changed:string[]=[];
 for(const id of Object.keys(next)){
  if(!(id in prev))added.push(id);
  else if(JSON.stringify(prev[id])!==JSON.stringify(next[id]))changed.push(id);
 }
 for(const id of Object.keys(prev))if(!(id in next))removed.push(id);
 return {added,removed,changed};
}
