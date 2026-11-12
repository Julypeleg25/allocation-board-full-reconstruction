export const GROUP_BY_OPTIONS = [
 'CURRENT_STEP','PRIORITY_IN_DESTINATION_FILTER','REASON_FOR_COMPLEXITY','TARGET_FAMILY',
 'CHOSEN_PLANS_STATUS','ATTACK_FACTOR','TARGET_COMPLEXITY','ATTACK_STATUS',
 'MISSION_NAME','OBJECTIVE_NAME','ATTACK_PLAN','AMMUNITION_FILTER',
 'WARRIOR_MISSION','OPERATIONAL_PLAN','CONNECTED_MO_IDS','TARGET_COUNTRY',
 'ATTACK_CAUSE','SECTOR_NAME','SECONDARY_PRIORITY'
] as const;
export type GroupByOption=typeof GROUP_BY_OPTIONS[number];
export type BoardQuery={
 boardId:string;allocationBoardFolderId?:string;groupBy:GroupByOption[];
 specificAttackDemandIds?:string[];connectionDataIds?:string[];
 attackPlanIds?:string[];missionIds?:string[];objectiveIds?:string[];
 warriorMissionIds?:string[];operationalPlanIds?:string[];missionOrderIds?:string[];
 attackPlanFilter?:string[];warriorMissionFilter?:string[];operationalPlanFilter?:string[];
 targetCode?:string[];targetCodes?:string[];sectorId?:string[];
 polygons?:string[];scoreFilters?:{campaignId?:string};ammunition?:string;
 isAttackPrevented?:boolean|null;latestAttackTime?:string[];
 intelligenceApproval?:Array<string|null>;operationalApproval?:Array<string|null>;
 operationalDepartmentApproval?:Array<string|null>;method?:Array<string|null>;coordinationStatus?:Array<string|null>;
 attackFactor?:string[];attackStatus?:string[];targetFamily?:string[];
 chosenPlansStatus?:string[];priorityInDestination?:string[];
 onlyExistedTargets?:boolean;hasPartner?:boolean;policy?:boolean;
 orderBy?:string;orderByType?:'asc'|'desc';queryLimit?:number;
};
export type BoardRow={id:string;[key:string]:string|number|boolean|null|undefined};
export type Leaf={id:string;parentIds:string[];type:'leaf'};
export type Folder={id:string;parentId:string|null;childIds:string[];name:string;groupByKey?:string;type:'folder'};
export type TreeNode=Leaf|Folder;
export type BoardResponse={
 fullQueryAttackDemandCount:number;tree:Record<string,TreeNode>;
 filters:Record<string,unknown>;timings:Record<string,number>;
};
export const INPUT_GROUP_LIMIT=19;
export function validateBoardInput(v:unknown):BoardQuery{
 if (!v||typeof v!=='object') throw new Error('Object required');
 const x=v as Record<string,unknown>;
 if(typeof x.boardId!=='string'||x.boardId.length>128||x.boardId.length===0) throw new Error('boardId is required');
 if(!Array.isArray(x.groupBy)||x.groupBy.length>INPUT_GROUP_LIMIT||x.groupBy.some(y=>!GROUP_BY_OPTIONS.includes(y as GroupByOption))) throw new Error('Invalid groupBy');
 const out={...x} as BoardQuery;
 for(const [k,val] of Object.entries(out)) {
  if (Array.isArray(val) && (val.length>10000||val.some(t=>typeof t!=='string'||t.length>1024))) throw new Error(`Invalid array: ${k}`);
 }
 if (out.queryLimit!==undefined && (!Number.isSafeInteger(out.queryLimit)||out.queryLimit<1||out.queryLimit>5000)) throw new Error('Invalid queryLimit');
 return out;
}
