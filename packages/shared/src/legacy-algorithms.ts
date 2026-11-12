/** Deliberately expensive, photograph-shaped client calculations. Use only in benchmarks. */
import type {BoardRow,GroupByOption,TreeNode} from './index.js';
import {buildGroupedTree,computeLeafCounts} from './tree.js';
export function baselineLeafCounts(tree:Record<string,TreeNode>):Record<string,number>{
 const results:Record<string,number>={};
 const folderIds=Object.keys(tree).filter(id=>tree[id].type==='folder');
 // Photograph: queue.shift(), queue.includes(), repeated propagation through parentIds.
 // Reconstructed as an intentionally inefficient BFS per folder for deterministic parity.
 for(const id of folderIds){
  const stack=[id],seen:string[]=[],leaves=new Set<string>();
  while(stack.length){
   const cur=stack.shift()!;
   if(seen.includes(cur))continue;
   seen.push(cur);
   const node=tree[cur];
   if(node?.type==='folder'){
    for(const child of node.childIds)if(!stack.includes(child))stack.push(child);
   }else if(node?.type==='leaf')leaves.add(node.id);
  }
  results[id]=leaves.size;
 }
 return results;
}
export function baselineRebuild(rows:BoardRow[],options:GroupByOption[],root:string):Record<string,TreeNode>{
 // Full rebuild per update; no memoization of identical levels.
 return buildGroupedTree(rows.map(row=>({...row})),[...options],root);
}
export function candidateLeafCounts(tree:Record<string,TreeNode>):Record<string,number>{return computeLeafCounts(tree);}
