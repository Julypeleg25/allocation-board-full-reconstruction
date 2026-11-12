import {createFeatureSelector,createSelector} from '@ngrx/store';
import type {BoardState} from './board.reducer';
import type {TreeNode} from '@lab/shared';
import {computeLeafCounts} from '@lab/shared/tree';
export const state=createFeatureSelector<BoardState>('board');
export const selectQuery=createSelector(state,s=>s.query);
export const selectResult=createSelector(state,s=>s.result);
export const selectLoading=createSelector(state,s=>s.loading);
export const selectError=createSelector(state,s=>s.error);
export const selectHiddenIds=createSelector(state,s=>s.hiddenIds);
export const selectSelectedIds=createSelector(state,s=>s.selectedIds);
export const selectReceivedCount=createSelector(state,s=>s.responses);
export const selectLeafCounts=createSelector(selectResult,r=>r?computeLeafCounts(r.tree):{});
export type Row={id:string;viewKey:string;depth:number;name:string;type:'folder'|'leaf';count:number};
export const selectVirtualRows=createSelector(selectResult,selectLeafCounts,(r,counts):Row[]=>{
 if(!r)return [];
 const tree=r.tree;
 const root=Object.values(tree).find(n=>n.type==='folder'&&n.parentId===null);
 if(!root)return [];
 const flattened:Row[]=[];
 function add(node:TreeNode,depth:number,parentPath:string){
  // Shared leaf identity must be displayed in EVERY matching folder; dedupe only the entity ID in store.
  const viewKey=`${parentPath}/${node.id}`;
  flattened.push({id:node.id,viewKey,depth,name:node.type==='folder'?node.name:node.id,type:node.type,count:counts[node.id]??1});
  if(node.type==='folder')for(const id of node.childIds){const n=tree[id];if(n)add(n,depth+1,viewKey);}
 }
 add(root,0,'');
 return flattened;
});
