import {createActionGroup,props,emptyProps} from '@ngrx/store';
import type {BoardQuery,BoardResponse} from '@lab/shared';
export const BoardActions=createActionGroup({source:'Allocation Board',events:{
 'Watch':props<{query:BoardQuery}>(),
 'Result':props<{response:BoardResponse}>(),
 'Failed':props<{message:string}>(),
 'Unwatch':emptyProps(),
 'Toggle Folder Eye':props<{folderId:string}>(),
 'Select Demand':props<{id:string;additive:boolean}>(),
 'Clear Selection':emptyProps()
}});
