import {createReducer,on} from '@ngrx/store';
import type {BoardQuery,BoardResponse} from '@lab/shared';
import {allDescendantLeafIds} from '@lab/shared/tree';
import {BoardActions} from './board.actions';
export type BoardState={query:BoardQuery|null;result:BoardResponse|null;loading:boolean;error:string|null;
 hiddenIds:Record<string,boolean>;selectedIds:string[];responses:number};
export const initialState:BoardState={query:null,result:null,loading:false,error:null,hiddenIds:{},selectedIds:[],responses:0};
export const boardReducer=createReducer(initialState,
 on(BoardActions.watch,(state,{query})=>({...state,query,loading:true,error:null})),
 on(BoardActions.result,(state,{response})=>({...state,result:response,loading:false,responses:state.responses+1})),
 on(BoardActions.failed,(state,{message})=>({...state,error:message,loading:false})),
 on(BoardActions.unwatch,(state)=>({...state,query:null,loading:false})),
 on(BoardActions.toggleFolderEye,(state,{folderId})=>{
  const tree=state.result?.tree;if(!tree)return state;
  const ids=allDescendantLeafIds(tree,folderId);
  const hiddenIds={...state.hiddenIds};
  const newHide=ids.some(id=>!hiddenIds[id]);
  for(const id of ids)if(newHide)hiddenIds[id]=true;else delete hiddenIds[id];
  return {...state,hiddenIds};
 }),
 on(BoardActions.selectDemand,(state,{id,additive})=>({...state,
  selectedIds:additive?[...new Set([...state.selectedIds,id])]:[id]})),
 on(BoardActions.clearSelection,state=>({...state,selectedIds:[]}))
);
