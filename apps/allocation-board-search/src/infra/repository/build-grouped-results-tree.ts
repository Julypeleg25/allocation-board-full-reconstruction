import {buildGroupedTree} from '@lab/shared/tree';
import type {BoardQuery,BoardRow,BoardResponse} from '@lab/shared';
/** Same full-count, post-query 5000 limit, and shared-leaf graph as photographed baseline. */
export function buildGroupedResultsTree(
 allRows:BoardRow[],p:BoardQuery,filters:Record<string,unknown>,timings:Record<string,number>,defaultLimit:number
):BoardResponse{
 const limit=Math.min(p.queryLimit??defaultLimit,defaultLimit);
 const visible=allRows.slice(0,limit);
 return {
  fullQueryAttackDemandCount:allRows.length,
  tree:buildGroupedTree(visible,p.groupBy,p.allocationBoardFolderId??`board-${p.boardId}`),
  filters,timings:{...timings,transferredRows:visible.length,sqlRows:allRows.length}
 };
}
